/**
 * @license
 * Process Flow & Instrument Simulator
 * Master Simulation Orchestrator & Telemetry Stream Manager
 */

import {
  AlarmItem,
  FluidProperties,
  ProcessCircuit,
  ProcessComponent,
  ProcessConnection,
  SimulationState,
  TelemetrySample,
  UnitSystem,
} from '../types/process';
import { controlEngine } from './controlModel';
import { instrumentEngine } from './instrumentModel';
import { processEngine } from './processModel';

export class SimulationEngine {
  private state: SimulationState;
  private circuit: ProcessCircuit;
  private telemetryBuffer: TelemetrySample[] = [];
  private maxBufferSize: number = 240; // 4 minutes at 1s resolution or 2 minutes at 0.5s
  private activeAlarms: AlarmItem[] = [];
  private alarmHistory: AlarmItem[] = [];
  private listeners: Set<(circuit: ProcessCircuit, state: SimulationState, alarms: AlarmItem[]) => void> = new Set();
  private timerId: number | null = null;
  private lastTickTimestamp: number = 0;

  constructor(initialCircuit: ProcessCircuit) {
    this.circuit = initialCircuit;
    this.state = {
      isRunning: false,
      isPaused: false,
      speedMultiplier: 1.0,
      simTimeSeconds: 0,
      fluid: initialCircuit.fluid,
      units: {
        pressure: 'bar',
        flow: 'm3_h',
        temperature: 'C',
        level: '%',
        velocity: 'm_s',
      },
      websocketConnected: true,
      lastTelemetryPing: Date.now(),
      networkSolved: true,
    };
  }

  public subscribe(
    callback: (circuit: ProcessCircuit, state: SimulationState, alarms: AlarmItem[]) => void
  ): () => void {
    this.listeners.add(callback);
    // Initial notify
    callback(this.circuit, this.state, this.activeAlarms);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.circuit, this.state, this.activeAlarms));
  }

  public getCircuit(): ProcessCircuit {
    return this.circuit;
  }

  public getState(): SimulationState {
    return this.state;
  }

  public getTelemetryHistory(): TelemetrySample[] {
    return this.telemetryBuffer;
  }

  public getActiveAlarms(): AlarmItem[] {
    return this.activeAlarms;
  }

  public getAlarmHistory(): AlarmItem[] {
    return this.alarmHistory;
  }

  public setCircuit(newCircuit: ProcessCircuit): void {
    this.circuit = newCircuit;
    this.state.fluid = newCircuit.fluid;
    this.telemetryBuffer = [];
    this.activeAlarms = [];
    this.notify();
  }

  public updateFluid(fluid: FluidProperties): void {
    this.state.fluid = fluid;
    this.circuit.fluid = fluid;
    this.step(0.1);
  }

  public updateUnits(units: Partial<UnitSystem>): void {
    this.state.units = { ...this.state.units, ...units };
    this.notify();
  }

  public setSpeedMultiplier(mult: number): void {
    this.state.speedMultiplier = mult;
    this.notify();
  }

  public start(): void {
    if (this.state.isRunning && !this.state.isPaused) return;

    this.state.isRunning = true;
    this.state.isPaused = false;
    this.lastTickTimestamp = Date.now();

    if (this.timerId !== null) clearInterval(this.timerId);

    // High frequency update loop (20 Hz = 50ms) for smooth animation & realistic simulation
    this.timerId = window.setInterval(() => {
      const now = Date.now();
      const elapsed = (now - this.lastTickTimestamp) / 1000;
      this.lastTickTimestamp = now;

      // Scale time by simulation speed multiplier
      const dt = Math.min(0.2, elapsed) * this.state.speedMultiplier;
      this.step(dt);
    }, 50);

    this.notify();
  }

  public pause(): void {
    this.state.isPaused = true;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public stop(): void {
    this.state.isRunning = false;
    this.state.isPaused = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public reset(): void {
    this.stop();
    this.state.simTimeSeconds = 0;
    this.telemetryBuffer = [];
    this.activeAlarms = [];

    // Reset controllers and equipment states
    this.circuit.components.forEach((c) => {
      if (c.type === 'pump') {
        c.params.pumpSpeedRpm = 1450;
        c.params.pumpState = 'running';
      }
      if (c.type === 'control_valve' || c.type === 'valve') {
        c.params.valveOpeningPct = 75;
      }
      if (c.type === 'FC' || c.type === 'PC' || c.type === 'LC') {
        c.params.controllerMode = 'auto';
        c.params.setpoint = 120;
      }
      controlEngine.resetController(c.id);
    });

    instrumentEngine.reset();
    this.step(0.1);
  }

  /**
   * Advances the simulation by dtSeconds
   */
  public step(dtSeconds: number): void {
    this.state.simTimeSeconds += dtSeconds;
    const timeStr = this.formatSimTime(this.state.simTimeSeconds);

    // A. Run Process Network Solver (Hydraulics, Pumps, Valves, Pipes)
    const { updatedComponents, updatedConnections } = processEngine.solveNetwork(
      this.circuit.components,
      this.circuit.connections,
      this.state.fluid,
      dtSeconds
    );

    let components = updatedComponents;
    const connections = updatedConnections;

    // B. Run Instrument Model (Sensors measuring process values)
    const newAlarms: AlarmItem[] = [];

    components = components.map((comp) => {
      // Find instrument types: FT, PT, TT, LT, etc.
      if (['FT', 'FI'].includes(comp.type)) {
        // Read flow from upstream or connected equipment
        const flowComp = components.find((c) => c.type === 'pump' || c.type === 'control_valve');
        const trueFlow = flowComp ? flowComp.live.flowRate : 0;
        const res = instrumentEngine.processInstrument(comp, trueFlow, dtSeconds, timeStr);
        newAlarms.push(...res.alarms);
        return {
          ...comp,
          params: { ...comp.params, measuredValue: res.measuredValue },
          live: { ...comp.live, status: res.status },
        };
      }

      if (['PT', 'PI'].includes(comp.type)) {
        // Pressure measurement: PT-101 reads downstream of control valve or pump discharge
        const valveComp = components.find((c) => c.type === 'control_valve');
        const truePres = valveComp ? valveComp.live.inletPressure : 4.2;
        const res = instrumentEngine.processInstrument(comp, truePres, dtSeconds, timeStr);
        newAlarms.push(...res.alarms);
        return {
          ...comp,
          params: { ...comp.params, measuredValue: res.measuredValue },
          live: { ...comp.live, status: res.status },
        };
      }

      if (['TT', 'TI'].includes(comp.type)) {
        const hexComp = components.find((c) => c.type === 'heat_exchanger');
        const trueTemp = hexComp ? hexComp.live.temperature : this.state.fluid.temperature;
        const res = instrumentEngine.processInstrument(comp, trueTemp, dtSeconds, timeStr);
        newAlarms.push(...res.alarms);
        return {
          ...comp,
          params: { ...comp.params, measuredValue: res.measuredValue },
          live: { ...comp.live, status: res.status },
        };
      }

      if (['LT', 'LI'].includes(comp.type)) {
        const tankComp = components.find((c) => c.type === 'tank');
        const trueLvl = tankComp?.params.currentLevelPct ?? 65;
        const res = instrumentEngine.processInstrument(comp, trueLvl, dtSeconds, timeStr);
        newAlarms.push(...res.alarms);
        return {
          ...comp,
          params: { ...comp.params, measuredValue: res.measuredValue },
          live: { ...comp.live, status: res.status },
        };
      }

      return comp;
    });

    // C. Run Control Model (PID Loops: e.g. FT-101 -> FC-101 -> FV-101)
    components = components.map((comp) => {
      if (['FC', 'PC', 'LC', 'TC'].includes(comp.type)) {
        // Find process variable input from matching transmitter
        const transmitterType =
          comp.type === 'FC' ? 'FT' : comp.type === 'PC' ? 'PT' : comp.type === 'LC' ? 'LT' : 'TT';
        const trans = components.find((c) => c.type === transmitterType);
        const pv = trans?.params.measuredValue ?? 100;
        const sp = comp.params.setpoint ?? 120;

        const pidRes = controlEngine.updateController(
          comp.id,
          sp,
          pv,
          dtSeconds,
          comp.params.kp ?? 0.8,
          comp.params.ki ?? 0.25,
          comp.params.kd ?? 0.05,
          comp.params.directAction ?? false,
          comp.params.controllerMode ?? 'auto',
          comp.params.controllerOutputPct ?? 50
        );

        return {
          ...comp,
          params: {
            ...comp.params,
            processVariable: pv,
            controllerOutputPct: pidRes.controllerOutputPct,
          },
        };
      }
      return comp;
    });

    // D. Actuator update: If a control valve is driven by a controller in AUTO mode
    const flowController = components.find((c) => c.type === 'FC');
    const controlValve = components.find((c) => c.type === 'control_valve');

    if (flowController && controlValve && flowController.params.controllerMode === 'auto') {
      const targetOpening = flowController.params.controllerOutputPct ?? 75;
      const currentOpening = controlValve.params.valveOpeningPct ?? 75;
      // Realistic pneumatic actuator slew rate (max 15% per second)
      const maxDelta = 15 * dtSeconds;
      const diff = targetOpening - currentOpening;
      const step = Math.sign(diff) * Math.min(Math.abs(diff), maxDelta);
      controlValve.params.valveOpeningPct = Math.round((currentOpening + step) * 10) / 10;
    }

    // E. Manage Alarms
    if (newAlarms.length > 0) {
      newAlarms.forEach((alarm) => {
        // Prevent duplicate alarms in active set
        const exists = this.activeAlarms.some((a) => a.tag === alarm.tag && a.severity === alarm.severity);
        if (!exists) {
          this.activeAlarms.unshift(alarm);
          this.alarmHistory.unshift(alarm);
        }
      });
      // Limit alarm history
      if (this.alarmHistory.length > 50) this.alarmHistory.pop();
    }

    // F. Record Telemetry Sample (every ~0.5s)
    const readings: Record<string, number> = {};
    components.forEach((c) => {
      if (['FT', 'PT', 'TT', 'LT', 'FI', 'PI', 'TI', 'LI'].includes(c.type)) {
        readings[c.params.tag] = c.params.measuredValue ?? 0;
      }
      if (['FC', 'PC', 'LC', 'TC'].includes(c.type)) {
        readings[`${c.params.tag}_SP`] = c.params.setpoint ?? 0;
        readings[`${c.params.tag}_OUT`] = c.params.controllerOutputPct ?? 0;
      }
      if (c.type === 'pump') {
        readings[`${c.params.tag}_RPM`] = c.params.pumpSpeedRpm ?? 0;
        readings[`${c.params.tag}_KW`] = c.live.powerKw;
        readings[`${c.params.tag}_P_DIS`] = c.live.outletPressure;
      }
      if (c.type === 'control_valve' || c.type === 'valve') {
        readings[`${c.params.tag}_OP%`] = c.params.valveOpeningPct ?? 0;
        readings[`${c.params.tag}_DP`] = c.live.pressureDrop;
      }
    });

    const sample: TelemetrySample = {
      timestamp: Date.now(),
      timeStr,
      readings,
    };

    this.telemetryBuffer.push(sample);
    if (this.telemetryBuffer.length > this.maxBufferSize) {
      this.telemetryBuffer.shift();
    }

    this.state.lastTelemetryPing = Date.now();
    this.circuit = {
      ...this.circuit,
      components,
      connections,
    };

    this.notify();
  }

  public updateComponentParam(componentId: string, updates: Partial<ProcessComponent['params']>): void {
    const comp = this.circuit.components.find((c) => c.id === componentId);
    if (comp) {
      comp.params = { ...comp.params, ...updates };
      this.step(0.05);
    }
  }

  public updateComponentPosition(componentId: string, x: number, y: number): void {
    const comp = this.circuit.components.find((c) => c.id === componentId);
    if (comp) {
      comp.x = Math.round(x);
      comp.y = Math.round(y);
      this.notify();
    }
  }

  public addComponent(component: ProcessComponent): void {
    this.circuit.components.push(component);
    this.step(0.05);
  }

  public removeComponent(componentId: string): void {
    this.circuit.components = this.circuit.components.filter((c) => c.id !== componentId);
    this.circuit.connections = this.circuit.connections.filter(
      (conn) => conn.sourceId !== componentId && conn.targetId !== componentId
    );
    this.step(0.05);
  }

  public addConnection(connection: ProcessConnection): void {
    // Avoid duplicate connections between same ports
    const exists = this.circuit.connections.some(
      (c) => c.sourceId === connection.sourceId && c.targetId === connection.targetId
    );
    if (!exists) {
      this.circuit.connections.push(connection);
      this.step(0.05);
    }
  }

  public removeConnection(connectionId: string): void {
    this.circuit.connections = this.circuit.connections.filter((c) => c.id !== connectionId);
    this.step(0.05);
  }

  public acknowledgeAlarm(alarmId: string): void {
    this.activeAlarms = this.activeAlarms.filter((a) => a.id !== alarmId);
    const hist = this.alarmHistory.find((a) => a.id === alarmId);
    if (hist) hist.acknowledged = true;
    this.notify();
  }

  public clearAllAlarms(): void {
    this.activeAlarms = [];
    this.alarmHistory.forEach((a) => (a.acknowledged = true));
    this.notify();
  }

  private formatSimTime(totalSec: number): string {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.floor(totalSec % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
}
