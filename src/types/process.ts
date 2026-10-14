/**
 * @license
 * Process Flow & Instrument Simulator
 * Core Data Models & Type Definitions
 */

export type FluidType = 'phosphate_slurry' | 'water' | 'air' | 'custom';

export interface FluidProperties {
  type: FluidType;
  name: string;
  density: number; // kg/m³
  viscosity: number; // Pa·s (apparent viscosity)
  solidsPercentage: number; // % mass (Cw)
  solidsDensity: number; // kg/m³ (typical phosphate rock ~2700 kg/m³)
  d50: number; // µm median particle size
  temperature: number; // °C
  vaporPressure: number; // bar (abs)
  yieldStress: number; // Pa (Bingham plastic threshold)
  isCompressible: boolean;
  color?: string; // Visual color representation (e.g. #C29B63 for phosphate slurry)
}

export type UnitSystem = {
  pressure: 'bar' | 'kPa' | 'Pa' | 'psi';
  flow: 'm3_h' | 'L_min' | 'kg_h';
  temperature: 'C' | 'K';
  level: '%' | 'm';
  velocity: 'm_s' | 'ft_s';
};

export type ComponentCategory = 'process' | 'instrumentation' | 'control';

export type ProcessEquipmentType =
  | 'source'
  | 'tank'
  | 'pump'
  | 'pipe'
  | 'valve'
  | 'control_valve'
  | 'heat_exchanger'
  | 'filter'
  | 'hydrocyclone'
  | 'decanteur'
  | 'crible'
  | 'flottation'
  | 'decanteur_ccd'
  | 'drain'
  | 'destination';

export type InstrumentType =
  | 'FT' // Flow Transmitter
  | 'PT' // Pressure Transmitter
  | 'TT' // Temperature Transmitter
  | 'LT' // Level Transmitter
  | 'FI' // Flow Indicator
  | 'PI' // Pressure Indicator
  | 'TI' // Temperature Indicator
  | 'LI'; // Level Indicator

export type ControllerType =
  | 'FC' // Flow Controller
  | 'PC' // Pressure Controller
  | 'LC' // Level Controller
  | 'TC'; // Temperature Controller

export type ComponentType = ProcessEquipmentType | InstrumentType | ControllerType;

export type ValveSubType =
  | 'butterfly_rubber' // Vanne papillon (rubber-lined)
  | 'knife_gate_slurry' // Vanne guillotine slurry (KGV)
  | 'push_through_kgv' // Push-through knife gate
  | 'pinch' // Pinch valve (manchon)
  | 'ball_lined' // Vanne à boisseau (liner)
  | 'slurry_control' // Dedicated slurry control valve
  | 'dart' // Dart valve (cellule flottation)
  | 'check_valve' // Clapet anti-retour
  | 'diaphragm'; // Vanne à diaphragme

export interface ComponentPort {
  id: string;
  type: 'in' | 'out' | 'signal_in' | 'signal_out';
  xOffset: number; // relative to component center
  yOffset: number;
  label?: string;
}

export interface ComponentParameters {
  // Common
  tag: string;
  label: string;
  description?: string;

  // Pump parameters
  pumpSpeedRpm?: number; // RPM (nominal ~1450)
  pumpMaxHeadM?: number; // Max shutoff head H0 (m)
  pumpCurveSlope?: number; // Head drop coefficient
  pumpEfficiency?: number; // 0-100%
  pumpSuctionDiameterMm?: number;
  pumpDischargeDiameterMm?: number;
  pumpState?: 'running' | 'warning' | 'trip' | 'stopped';

  // Valve parameters
  valveType?: ValveSubType;
  valveOpeningPct?: number; // 0 - 100%
  valveCv?: number; // Max Cv at 100%
  valveMinOpening?: number;
  valveMaxOpening?: number;
  flushingActive?: boolean; // For auto-flush KGV
  hasFlushingCircuit?: boolean;

  // Controller parameters
  controllerMode?: 'auto' | 'manual';
  setpoint?: number; // SP
  processVariable?: number; // PV
  controllerOutputPct?: number; // MV (0-100%)
  kp?: number;
  ki?: number;
  kd?: number;
  directAction?: boolean; // direct (increase MV raises PV) or reverse

  // Tank parameters
  tankVolumeM3?: number;
  tankMaxLevelM?: number;
  currentLevelPct?: number; // 0-100%
  tankDiameterM?: number;

  // Heat exchanger
  heatDutyKw?: number;
  targetTempC?: number;

  // Hydrocyclone / Decanteur / Mining equip
  cycloneDiameterMm?: number;
  cycloneFeedPressureBar?: number;
  underflowSplitPct?: number;
  clarityEffPct?: number;

  // Instrument parameters
  measuredProperty?: 'flow' | 'pressure' | 'temperature' | 'level';
  measuredValue?: number;
  sensorRangeMin?: number;
  sensorRangeMax?: number;
  sensorAccuracyPct?: number; // e.g. 0.5%
  alarmHighHigh?: number;
  alarmHigh?: number;
  alarmLow?: number;
  alarmLowLow?: number;
  connectedTargetId?: string; // id of pipe/equipment being measured
}

export interface ProcessComponent {
  id: string;
  type: ComponentType;
  category: ComponentCategory;
  x: number;
  y: number;
  width: number;
  height: number;
  params: ComponentParameters;
  live: {
    inletPressure: number; // bar
    outletPressure: number; // bar
    flowRate: number; // m³/h
    temperature: number; // °C
    velocity: number; // m/s
    reynolds: number;
    head: number; // m
    powerKw: number;
    pressureDrop: number; // bar
    cavitationIndex: number;
    cavitationRisk: boolean;
    sedimentationRisk: boolean;
    status: 'normal' | 'warning' | 'trip' | 'alarm' | 'stopped';
    statusMessage?: string;
  };
}

export interface ProcessConnection {
  id: string;
  sourceId: string;
  sourcePortId: string;
  targetId: string;
  targetPortId: string;
  type: 'pipe' | 'signal';

  // Pipe physical properties
  diameterMm: number; // DN
  lengthM: number;
  roughnessMm: number;
  material: 'Rubber-Lined' | 'Carbon Steel' | 'HDPE' | 'Stainless Steel';
  elevationChangeM: number;

  // Dynamic simulation values
  flowRate: number; // m³/h
  velocity: number; // m/s
  reynolds: number;
  frictionFactor: number;
  pressureDropBar: number;
  pressureInBar: number;
  pressureOutBar: number;
  temperatureC: number;
  flowDirection: 1 | -1 | 0; // 1 = source->target, -1 = reverse, 0 = no flow
  criticalDepositionVelocity: number; // Vc m/s (Durand)
  status: 'nominal' | 'high_flow' | 'low_flow' | 'sedimentation_risk' | 'overpressure' | 'reverse';
}

export interface AlarmItem {
  id: string;
  componentId: string;
  tag: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  limitValue: number;
  currentValue: number;
  unit: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface TelemetrySample {
  timestamp: number;
  timeStr: string;
  readings: Record<string, number>; // Tag -> Value
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  speedMultiplier: number; // 0.5, 1, 2, 5, 10
  simTimeSeconds: number;
  fluid: FluidProperties;
  units: UnitSystem;
  websocketConnected: boolean;
  lastTelemetryPing: number;
  networkSolved: boolean;
}

export interface ProcessCircuit {
  id: string;
  name: string;
  description: string;
  fluid: FluidProperties;
  components: ProcessComponent[];
  connections: ProcessConnection[];
}
