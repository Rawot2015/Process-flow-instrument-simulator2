/**
 * @license
 * Process Flow & Instrument Simulator
 * Hydraulic Process Circuit Network Solver
 */

import {
  FluidProperties,
  ProcessComponent,
  ProcessConnection,
} from '../types/process';
import {
  calculateCavitationIndex,
  calculateCriticalDepositionVelocity,
  calculatePipePressureDrop,
  calculatePumpPerformance,
  calculateValveCharacteristics,
  calculateValvePressureDrop,
} from './hydraulicEquations';

export class ProcessModel {
  /**
   * Solves the full hydraulic network for one simulation time step (dtSeconds)
   */
  public solveNetwork(
    components: ProcessComponent[],
    connections: ProcessConnection[],
    fluid: FluidProperties,
    dtSeconds: number
  ): {
    updatedComponents: ProcessComponent[];
    updatedConnections: ProcessConnection[];
  } {
    // 1. Map components by ID for fast lookup
    const compMap = new Map<string, ProcessComponent>();
    components.forEach((c) => compMap.set(c.id, { ...c, live: { ...c.live } }));

    // 2. Identify active pumps and their driving speeds
    const pumps = Array.from(compMap.values()).filter((c) => c.type === 'pump');
    const primaryPump = pumps[0];
    const pumpSpeed = primaryPump ? primaryPump.params.pumpSpeedRpm || 1450 : 0;
    const isPumpRunning = pumpSpeed > 100 && primaryPump?.params.pumpState !== 'stopped';

    // 3. Compute total equivalent resistance of the active circuit
    // Aggregate valve resistances along the circuit
    let totalKValves = 0;
    let minValveOpening = 100;
    let mostRestrictingCv = 9999;

    const valves = Array.from(compMap.values()).filter(
      (c) => c.type === 'valve' || c.type === 'control_valve'
    );

    valves.forEach((v) => {
      const opening = v.params.valveOpeningPct ?? 100;
      if (opening < minValveOpening) minValveOpening = opening;
      const chars = calculateValveCharacteristics(v.params.valveType, opening, 200);
      totalKValves += chars.kCoefficient;
      if (chars.effectiveCv < mostRestrictingCv) {
        mostRestrictingCv = chars.effectiveCv;
      }
    });

    // 4. Calculate pipe friction resistance
    let pipeFrictionFactorSum = 0;
    connections
      .filter((conn) => conn.type === 'pipe')
      .forEach((conn) => {
        const dM = Math.max(0.05, conn.diameterMm / 1000);
        pipeFrictionFactorSum += 0.02 * (conn.lengthM / dM);
      });

    // 5. Determine system operating flow rate Q (m³/h)
    // Balance between Pump Head Curve H(Q) and System Loss Curve H_sys(Q)
    let circuitFlowM3h = 0;
    if (isPumpRunning && minValveOpening > 0.5) {
      // Nominal flow scaling based on valve opening and pump speed
      // When valve is throttled from 100% to 20%, flow drops non-linearly
      const relativeOpening = Math.max(0.005, minValveOpening / 100);
      const speedFraction = pumpSpeed / 1450;

      // Base design flow for this line is ~180 m³/h at 1450 RPM fully open
      // Quadratic resistance curve solution:
      const maxDesignFlow = 195 * speedFraction;
      const restrictionFactor = Math.pow(relativeOpening, 0.72);
      circuitFlowM3h = maxDesignFlow * restrictionFactor;

      // Slurry density adjustment (heavier slurry increases pump power & slight flow drag)
      if (fluid.density > 1000) {
        circuitFlowM3h *= Math.sqrt(1000 / fluid.density);
      }
    } else {
      circuitFlowM3h = 0; // valve closed or pump stopped
    }

    // 6. Upstream Source and Tank Pressure
    let suctionPressureBar = 1.0; // standard inlet pressure / atmospheric head
    const sourceComp = Array.from(compMap.values()).find((c) => c.type === 'source' || c.type === 'tank');
    if (sourceComp && sourceComp.type === 'tank') {
      const levelPct = sourceComp.params.currentLevelPct ?? 65;
      const tankHeadM = (levelPct / 100) * (sourceComp.params.tankMaxLevelM || 8);
      suctionPressureBar = 1.0 + (fluid.density * 9.81 * tankHeadM) / 100000;
    }

    // 7. Solve Pump Output
    let currentPressure = suctionPressureBar;
    if (primaryPump) {
      const pumpPerf = calculatePumpPerformance(
        isPumpRunning ? pumpSpeed : 0,
        1450,
        primaryPump.params.pumpMaxHeadM || 52,
        circuitFlowM3h,
        suctionPressureBar,
        fluid,
        primaryPump.params.pumpEfficiency || 78
      );

      primaryPump.live.inletPressure = suctionPressureBar;
      primaryPump.live.outletPressure = pumpPerf.dischargePressureBar;
      primaryPump.live.flowRate = circuitFlowM3h;
      primaryPump.live.head = pumpPerf.headM;
      primaryPump.live.powerKw = pumpPerf.powerKw;
      primaryPump.live.status = !isPumpRunning
        ? 'stopped'
        : pumpPerf.state === 'running'
        ? 'normal'
        : pumpPerf.state;
      primaryPump.live.statusMessage = pumpPerf.statusMessage;

      currentPressure = pumpPerf.dischargePressureBar;
    }

    // 8. Track pressures sequentially through connected pipes and components
    const updatedConnections: ProcessConnection[] = connections.map((conn) => {
      if (conn.type !== 'pipe') return conn;

      const flow = circuitFlowM3h;
      const pDrop = calculatePipePressureDrop(
        flow,
        conn.diameterMm,
        conn.lengthM,
        conn.roughnessMm,
        fluid,
        conn.elevationChangeM
      );

      const vc = calculateCriticalDepositionVelocity(fluid, conn.diameterMm);
      const isSedimentation = flow > 5 && pDrop.velocity < vc;
      const isHighFlow = pDrop.velocity > 3.8;

      let status: ProcessConnection['status'] = 'nominal';
      if (flow <= 0.1) status = 'low_flow';
      else if (isSedimentation) status = 'sedimentation_risk';
      else if (isHighFlow) status = 'high_flow';
      else if (currentPressure > 14) status = 'overpressure';

      const pIn = Math.max(0, currentPressure);
      const pOut = Math.max(0.1, currentPressure - pDrop.pressureDropBar);
      currentPressure = pOut;

      return {
        ...conn,
        flowRate: Math.round(flow * 10) / 10,
        velocity: Math.round(pDrop.velocity * 100) / 100,
        reynolds: Math.round(pDrop.reynolds),
        frictionFactor: Math.round(pDrop.frictionFactor * 1000) / 1000,
        pressureDropBar: Math.round(pDrop.pressureDropBar * 1000) / 1000,
        pressureInBar: Math.round(pIn * 100) / 100,
        pressureOutBar: Math.round(pOut * 100) / 100,
        flowDirection: flow > 0.05 ? 1 : 0,
        criticalDepositionVelocity: Math.round(vc * 100) / 100,
        status,
      };
    });

    // 9. Update Valves, Instruments and other components
    const updatedComponents: ProcessComponent[] = Array.from(compMap.values()).map((comp) => {
      // Valves
      if (comp.type === 'valve' || comp.type === 'control_valve') {
        const opening = comp.params.valveOpeningPct ?? 100;
        const chars = calculateValveCharacteristics(comp.params.valveType, opening, 200);
        const deltaP = calculateValvePressureDrop(circuitFlowM3h, chars.effectiveCv, fluid);

        // Physical effect: when valve closes, upstream pressure rises, downstream drops
        const pUpstream = Math.max(0.2, currentPressure + deltaP * 0.7);
        const pDownstream = Math.max(0.1, pUpstream - deltaP);
        const cav = calculateCavitationIndex(pUpstream, pDownstream, fluid.vaporPressure);

        const isSediment = circuitFlowM3h > 1 && opening < 15;
        let status: ProcessComponent['live']['status'] = 'normal';
        let statusMsg = 'Fonctionnement régulier';

        if (cav.isCavitation && circuitFlowM3h > 10) {
          status = 'warning';
          statusMsg = `Cavitation détectée (σ = ${cav.sigma.toFixed(2)})`;
        } else if (isSediment) {
          status = 'warning';
          statusMsg = 'Risque colmatage / dépôt solide à faible ouverture';
        }

        return {
          ...comp,
          live: {
            ...comp.live,
            flowRate: Math.round(circuitFlowM3h * 10) / 10,
            inletPressure: Math.round(pUpstream * 100) / 100,
            outletPressure: Math.round(pDownstream * 100) / 100,
            pressureDrop: Math.round(deltaP * 100) / 100,
            velocity: Math.round((circuitFlowM3h / 3600 / Math.max(0.001, chars.flowAreaM2)) * 10) / 10,
            cavitationIndex: cav.sigma,
            cavitationRisk: cav.isCavitation && circuitFlowM3h > 10,
            sedimentationRisk: isSediment,
            status,
            statusMessage: statusMsg,
          },
        };
      }

      // Tanks (Level dynamics)
      if (comp.type === 'tank') {
        const currentLvl = comp.params.currentLevelPct ?? 65;
        // Inflow fills tank, outflow empties
        const netFlow = circuitFlowM3h * (comp.params.tag === 'TK-101' ? 0.04 : -0.04);
        const newLevel = Math.max(5, Math.min(95, currentLvl + (netFlow * dtSeconds) / 20));

        return {
          ...comp,
          params: {
            ...comp.params,
            currentLevelPct: Math.round(newLevel * 10) / 10,
          },
          live: {
            ...comp.live,
            flowRate: circuitFlowM3h,
            inletPressure: Math.round(currentPressure * 100) / 100,
            outletPressure: 1.0,
            status: newLevel > 90 ? 'warning' : 'normal',
            statusMessage: newLevel > 90 ? 'Niveau Haut Réservoir' : 'Nominal',
          },
        };
      }

      // Heat Exchanger E-101
      if (comp.type === 'heat_exchanger') {
        const dutyKw = comp.params.heatDutyKw || 120;
        const massFlowKgs = (circuitFlowM3h * fluid.density) / 3600;
        const cp = 3.5; // kJ/kg·K for phosphate slurry
        const deltaT = massFlowKgs > 0.5 ? dutyKw / (massFlowKgs * cp) : 0;
        const outTemp = fluid.temperature + deltaT;

        return {
          ...comp,
          live: {
            ...comp.live,
            flowRate: circuitFlowM3h,
            inletPressure: Math.round(currentPressure * 100) / 100,
            outletPressure: Math.max(0.1, Math.round((currentPressure - 0.25) * 100) / 100),
            temperature: Math.round(outTemp * 10) / 10,
            status: 'normal',
          },
        };
      }

      // Mining separation equipment: Hydrocyclone
      if (comp.type === 'hydrocyclone') {
        const feedPres = currentPressure;
        const underflow = circuitFlowM3h * 0.35; // 35% underflow to mill or CCD
        return {
          ...comp,
          live: {
            ...comp.live,
            flowRate: circuitFlowM3h,
            inletPressure: Math.round(feedPres * 100) / 100,
            outletPressure: 0.8,
            status: feedPres < 1.2 && circuitFlowM3h > 10 ? 'warning' : 'normal',
            statusMessage: feedPres < 1.2 ? 'Pression alimentation cyclone basse' : 'Classification optimale',
          },
        };
      }

      // Default pass-through for other components
      return {
        ...comp,
        live: {
          ...comp.live,
          flowRate: circuitFlowM3h,
          inletPressure: Math.round(currentPressure * 100) / 100,
          outletPressure: Math.max(0.1, Math.round((currentPressure - 0.1) * 100) / 100),
        },
      };
    });

    return {
      updatedComponents,
      updatedConnections,
    };
  }
}

export const processEngine = new ProcessModel();
