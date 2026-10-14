/**
 * @license
 * Process Flow & Instrument Simulator
 * Hydraulic & Slurry Engineering Physics Engine
 * Sourced from Darcy-Weisbach, Swamee-Jain, Durand, and Bingham plastic models
 */

import { FluidProperties, UnitSystem, ValveSubType } from '../types/process';

const G = 9.80665; // m/s² gravitational acceleration

/**
 * Calculates cross-sectional pipe area in m²
 */
export function calculateCrossSectionArea(diameterMm: number): number {
  const dM = Math.max(0.01, diameterMm / 1000);
  return (Math.PI * Math.pow(dM, 2)) / 4;
}

/**
 * Calculates mean flow velocity V in m/s from flow rate Q (m³/h) and diameter (mm)
 */
export function calculateVelocity(flowRateM3h: number, diameterMm: number): number {
  const area = calculateCrossSectionArea(diameterMm);
  const flowM3s = flowRateM3h / 3600;
  return flowM3s / area;
}

/**
 * Apparent viscosity for Bingham plastic slurry (e.g. Phosphate pulp)
 */
export function calculateApparentViscosity(
  fluid: FluidProperties,
  velocity: number,
  diameterMm: number
): number {
  if (fluid.yieldStress <= 0 || velocity <= 0.05) {
    return fluid.viscosity;
  }
  const dM = diameterMm / 1000;
  // Bingham apparent viscosity: μ_app = μ_plastic + (τ_0 * D) / (6 * V)
  const shearRate = (8 * Math.max(0.1, velocity)) / dM;
  const yieldComponent = fluid.yieldStress / Math.max(1, shearRate);
  return Math.min(0.5, fluid.viscosity + yieldComponent);
}

/**
 * Calculates Reynolds number
 */
export function calculateReynolds(
  fluid: FluidProperties,
  velocity: number,
  diameterMm: number
): number {
  const dM = diameterMm / 1000;
  const mu = calculateApparentViscosity(fluid, velocity, diameterMm);
  if (mu <= 0) return 100000;
  return (fluid.density * Math.abs(velocity) * dM) / mu;
}

/**
 * Calculates Darcy-Weisbach friction factor f
 * Uses Swamee-Jain approximation for turbulent regime, 64/Re for laminar
 */
export function calculateFrictionFactor(
  reynolds: number,
  roughnessMm: number,
  diameterMm: number
): number {
  if (reynolds <= 10) return 0.08;
  if (reynolds < 2300) {
    return Math.min(0.1, 64 / Math.max(100, reynolds));
  }
  const relativeRoughness = (roughnessMm / diameterMm);
  // Swamee-Jain explicit equation
  const term1 = relativeRoughness / 3.7;
  const term2 = 5.74 / Math.pow(reynolds, 0.9);
  const logTerm = Math.log10(term1 + term2);
  const f = 0.25 / Math.pow(logTerm, 2);
  return Math.max(0.012, Math.min(0.08, f));
}

/**
 * Calculates linear pressure drop across a pipe segment (in bar)
 * ΔP = f * (L/D) * (ρ * V² / 2) / 10^5
 */
export function calculatePipePressureDrop(
  flowRateM3h: number,
  diameterMm: number,
  lengthM: number,
  roughnessMm: number,
  fluid: FluidProperties,
  elevationChangeM: number = 0
): {
  pressureDropBar: number;
  velocity: number;
  reynolds: number;
  frictionFactor: number;
  hydrostaticDeltaBar: number;
} {
  const velocity = calculateVelocity(Math.abs(flowRateM3h), diameterMm);
  const reynolds = calculateReynolds(fluid, velocity, diameterMm);
  const f = calculateFrictionFactor(reynolds, roughnessMm, diameterMm);
  const dM = diameterMm / 1000;

  // Friction loss in Pa
  const dynamicPressurePa = (fluid.density * Math.pow(velocity, 2)) / 2;
  const frictionLossPa = f * (lengthM / Math.max(0.01, dM)) * dynamicPressurePa;

  // Hydrostatic head change in Pa (ρ * g * Δz)
  const hydrostaticLossPa = fluid.density * G * elevationChangeM;

  const totalDeltaPa = frictionLossPa + hydrostaticLossPa;
  const pressureDropBar = totalDeltaPa / 100000;

  return {
    pressureDropBar: Math.max(0, pressureDropBar),
    velocity,
    reynolds,
    frictionFactor: f,
    hydrostaticDeltaBar: hydrostaticLossPa / 100000,
  };
}

/**
 * Critical Deposition Velocity Vc (Durand correlation for slurry transport)
 * Essential for phosphate mining: if V < Vc, particles settle and cause blockages!
 */
export function calculateCriticalDepositionVelocity(
  fluid: FluidProperties,
  diameterMm: number
): number {
  if (fluid.solidsPercentage <= 2) return 0.5; // clear water minimum
  const dM = diameterMm / 1000;
  const s = fluid.solidsDensity / Math.max(1000, fluid.density); // specific gravity ratio
  // Durand constant FL depends on d50 and volumetric concentration
  const fL = 1.34;
  const vc = fL * Math.sqrt(2 * G * dM * Math.max(0.1, s - 1));
  return Math.max(1.2, Math.min(4.5, vc));
}

/**
 * Computes valve flow coefficient Cv and K factor as a function of opening percentage
 */
export function calculateValveCharacteristics(
  valveType: ValveSubType = 'butterfly_rubber',
  openingPct: number,
  nominalDiameterMm: number = 200
): {
  relativeOpening: number;
  effectiveCv: number;
  kCoefficient: number;
  flowAreaM2: number;
} {
  const x = Math.max(0, Math.min(100, openingPct)) / 100;
  const fullArea = calculateCrossSectionArea(nominalDiameterMm);

  let fullCv = 2.5 * Math.pow(nominalDiameterMm / 25.4, 2) * 12; // approximate valve Cv
  let flowAreaFraction = 0;
  let baseK100 = 0.5;

  switch (valveType) {
    case 'knife_gate_slurry':
    case 'push_through_kgv':
      baseK100 = 0.25;
      fullCv = 3.2 * Math.pow(nominalDiameterMm / 25.4, 2) * 14;
      flowAreaFraction = Math.pow(x, 1.25);
      break;

    case 'pinch':
      baseK100 = 0.45;
      fullCv = 2.8 * Math.pow(nominalDiameterMm / 25.4, 2) * 12;
      flowAreaFraction = Math.pow(x, 1.15);
      break;

    case 'butterfly_rubber':
      baseK100 = 0.75;
      fullCv = 2.6 * Math.pow(nominalDiameterMm / 25.4, 2) * 11;
      // Sinusoidal disc angle characteristic
      flowAreaFraction = Math.pow(Math.sin((x * Math.PI) / 2), 2);
      break;

    case 'slurry_control':
      baseK100 = 3.5;
      fullCv = 1.9 * Math.pow(nominalDiameterMm / 25.4, 2) * 10;
      // Equal percentage curve R = 30
      flowAreaFraction = x <= 0.02 ? 0 : Math.pow(30, x - 1);
      break;

    case 'dart':
      baseK100 = 1.8;
      fullCv = 2.2 * Math.pow(nominalDiameterMm / 25.4, 2) * 10;
      flowAreaFraction = Math.pow(x, 1.4);
      break;

    case 'ball_lined':
      baseK100 = 0.15;
      fullCv = 3.4 * Math.pow(nominalDiameterMm / 25.4, 2) * 15;
      flowAreaFraction = Math.pow(x, 1.3);
      break;

    case 'check_valve':
      baseK100 = 2.8;
      fullCv = 2.0 * Math.pow(nominalDiameterMm / 25.4, 2) * 9;
      flowAreaFraction = Math.pow(x, 1.5);
      break;

    case 'diaphragm':
    default:
      baseK100 = 2.0;
      fullCv = 2.1 * Math.pow(nominalDiameterMm / 25.4, 2) * 9;
      flowAreaFraction = Math.pow(x, 1.2);
      break;
  }

  const effectiveCv = fullCv * Math.max(0.001, flowAreaFraction);
  // As valve closes, K increases asymptotically
  const kCoefficient = baseK100 / Math.pow(Math.max(0.015, flowAreaFraction), 2);
  const flowAreaM2 = fullArea * flowAreaFraction;

  return {
    relativeOpening: flowAreaFraction,
    effectiveCv: Math.round(effectiveCv * 10) / 10,
    kCoefficient: Math.min(999, Math.round(kCoefficient * 10) / 10),
    flowAreaM2: Math.round(flowAreaM2 * 10000) / 10000,
  };
}

/**
 * Pressure drop across a valve in bar
 * ΔP = (Q / (N * Cv))^2 * (ρ / ρ_water)
 */
export function calculateValvePressureDrop(
  flowRateM3h: number,
  effectiveCv: number,
  fluid: FluidProperties
): number {
  if (effectiveCv <= 0.1) return 25.0; // fully closed
  const sg = fluid.density / 1000;
  // Cv formula: Q (US gpm) = Cv * sqrt(ΔP (psi) / SG)
  // Conversion: 1 m³/h = 4.40287 gpm, 1 bar = 14.5038 psi
  const qGpm = Math.abs(flowRateM3h) * 4.40287;
  const deltaPpsi = Math.pow(qGpm / Math.max(0.1, effectiveCv), 2) * sg;
  const deltaPbar = deltaPpsi / 14.5038;
  return Math.min(30, Math.max(0.005, deltaPbar));
}

/**
 * Cavitation index sigma = (P_downstream - P_vapor) / (P_upstream - P_downstream)
 */
export function calculateCavitationIndex(
  upstreamPressureBar: number,
  downstreamPressureBar: number,
  vaporPressureBar: number
): { sigma: number; isCavitation: boolean } {
  const deltaP = Math.max(0.01, upstreamPressureBar - downstreamPressureBar);
  const p2Abs = Math.max(0.01, downstreamPressureBar + 1.013); // absolute
  const pvAbs = Math.max(0.01, vaporPressureBar);
  const sigma = (p2Abs - pvAbs) / deltaP;
  return {
    sigma: Math.max(0, Math.round(sigma * 100) / 100),
    isCavitation: sigma < 1.35, // Below critical sigma, cavitation flashing occurs
  };
}

/**
 * Centrifugal Slurry Pump head and discharge pressure calculation
 */
export function calculatePumpPerformance(
  speedRpm: number,
  nominalSpeedRpm: number = 1450,
  maxHeadM: number = 48,
  flowRateM3h: number,
  suctionPressureBar: number,
  fluid: FluidProperties,
  efficiencyPct: number = 78
): {
  headM: number;
  dischargePressureBar: number;
  powerKw: number;
  state: 'running' | 'warning' | 'trip';
  statusMessage: string;
} {
  const speedRatio = Math.max(0, speedRpm) / Math.max(100, nominalSpeedRpm);
  if (speedRatio < 0.1) {
    return {
      headM: 0,
      dischargePressureBar: suctionPressureBar,
      powerKw: 0,
      state: 'trip',
      statusMessage: 'Pompe arrêtée (0 RPM)',
    };
  }

  // Affinity laws: H(Q) = H0 * (N/N0)^2 - a * Q^2
  const maxHead = maxHeadM * Math.pow(speedRatio, 2);
  const headDrop = 0.00018 * Math.pow(Math.abs(flowRateM3h), 2);
  const headM = Math.max(0, maxHead - headDrop);

  // Pressure rise in bar = ρ * g * H / 10^5
  const deltaPbar = (fluid.density * G * headM) / 100000;
  const dischargePressureBar = suctionPressureBar + deltaPbar;

  // Hydraulic and shaft power in kW
  const flowM3s = Math.abs(flowRateM3h) / 3600;
  const hydraulicPowerKw = (fluid.density * G * flowM3s * headM) / 1000;
  const eff = Math.max(0.3, efficiencyPct / 100);
  const shaftPowerKw = hydraulicPowerKw / eff;

  // Warnings and trip conditions
  let state: 'running' | 'warning' | 'trip' = 'running';
  let statusMessage = 'Nominal (Fonctionnement normal)';

  if (suctionPressureBar < 0.15) {
    state = 'warning';
    statusMessage = 'Avertissement: Risque de cavitation à l\'aspiration (NPSH faible)';
  } else if (suctionPressureBar < 0.0) {
    state = 'trip';
    statusMessage = 'DÉCLENCHEMENT: Dépression critique aspiration';
  } else if (flowRateM3h > 650) {
    state = 'warning';
    statusMessage = 'Avertissement: Débit supérieur à la plage nominale';
  }

  return {
    headM: Math.round(headM * 10) / 10,
    dischargePressureBar: Math.round(dischargePressureBar * 100) / 100,
    powerKw: Math.round(shaftPowerKw * 10) / 10,
    state,
    statusMessage,
  };
}

/**
 * Unit conversion utilities
 */
export function formatPressure(valueBar: number, unit: UnitSystem['pressure']): string {
  switch (unit) {
    case 'kPa':
      return `${(valueBar * 100).toFixed(1)} kPa`;
    case 'Pa':
      return `${(valueBar * 100000).toFixed(0)} Pa`;
    case 'psi':
      return `${(valueBar * 14.5038).toFixed(1)} psi`;
    case 'bar':
    default:
      return `${valueBar.toFixed(2)} bar`;
  }
}

export function formatFlow(valueM3h: number, unit: UnitSystem['flow']): string {
  switch (unit) {
    case 'L_min':
      return `${((valueM3h * 1000) / 60).toFixed(1)} L/min`;
    case 'kg_h':
      return `${(valueM3h * 1350).toFixed(0)} kg/h`; // using typical slurry density
    case 'm3_h':
    default:
      return `${valueM3h.toFixed(1)} m³/h`;
  }
}

export function formatTemperature(valueC: number, unit: UnitSystem['temperature']): string {
  switch (unit) {
    case 'K':
      return `${(valueC + 273.15).toFixed(1)} K`;
    case 'C':
    default:
      return `${valueC.toFixed(1)} °C`;
  }
}
