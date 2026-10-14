/**
 * @license
 * Process Flow & Instrument Simulator
 * Centralized Process Fluid Colors
 *
 * Configured specifically for OCP Phosphate Mining:
 * Phosphate slurry (pulpe de phosphate) is an earthy, sandy-brown / beige mineral suspension.
 */

export interface FluidColorConfig {
  base: string; // Primary accent color (hex)
  fill: string; // Semi-transparent or opaque fluid fill in tanks
  fillLight: string; // Fluid fill in Light Mode
  particle: string; // Animated particle color in pipes
  border: string; // Fluid boundary / meniscus line
  tagBg: string; // Pill/badge background
  tagText: string; // Pill/badge text color
}

export const PROCESS_FLUID_COLORS: Record<string, FluidColorConfig> = {
  // Phosphate Slurry (Pulpe de Phosphate OCP) — Earthy sandy-brown / mineral beige tone
  phosphate_slurry: {
    base: '#C29B62', // Earthy beige / phosphate sand tone
    fill: 'rgba(194, 155, 98, 0.72)', // Tank slurry fill in dark mode
    fillLight: 'rgba(180, 138, 80, 0.82)', // Tank slurry fill in light mode
    particle: '#E6C994', // Lighter sandy grain particles
    border: '#9E743A', // Sediment / meniscus line
    tagBg: 'rgba(194, 155, 98, 0.20)',
    tagText: '#E6C994',
  },

  // Dense Phosphate Slurry (Underflow CCD 52% solids) — Darker, richer earthen tone
  phosphate_slurry_dense: {
    base: '#9E743A',
    fill: 'rgba(158, 116, 58, 0.85)',
    fillLight: 'rgba(142, 102, 48, 0.90)',
    particle: '#D4AF67',
    border: '#7A5422',
    tagBg: 'rgba(158, 116, 58, 0.25)',
    tagText: '#D4AF67',
  },

  // Process Water / Dilution — Clean industrial cyan/blue
  water: {
    base: '#0284C7',
    fill: 'rgba(2, 132, 199, 0.45)',
    fillLight: 'rgba(2, 132, 199, 0.55)',
    particle: '#38BDF8',
    border: '#0369A1',
    tagBg: 'rgba(2, 132, 199, 0.20)',
    tagText: '#38BDF8',
  },

  // Compressed Air / Flotation Bubbles — Frothy white/gray
  air: {
    base: '#94A3B8',
    fill: 'rgba(148, 163, 184, 0.25)',
    fillLight: 'rgba(148, 163, 184, 0.35)',
    particle: '#F1F5F9',
    border: '#64748B',
    tagBg: 'rgba(148, 163, 184, 0.20)',
    tagText: '#E2E8F0',
  },
};

/**
 * Helper to retrieve fluid colors by type
 */
export function getFluidColor(fluidType: string = 'phosphate_slurry'): FluidColorConfig {
  return PROCESS_FLUID_COLORS[fluidType] || PROCESS_FLUID_COLORS.phosphate_slurry;
}
