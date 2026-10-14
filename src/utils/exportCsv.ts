/**
 * @license
 * Process Flow & Instrument Simulator
 * CSV Telemetry & Historian Data Exporter
 */

import { TelemetrySample } from '../types/process';

export function exportTelemetryCsv(history: TelemetrySample[], circuitName: string = 'circuit'): void {
  if (history.length === 0) {
    alert('Aucune donnée de télémétrie enregistrée à exporter.');
    return;
  }

  // Extract all unique headers/tags across history
  const allTags = new Set<string>();
  history.forEach((sample) => {
    Object.keys(sample.readings).forEach((tag) => allTags.add(tag));
  });

  const tagList = Array.from(allTags).sort();
  const headerRow = ['Horodatage_ISO', 'Temps_Simulation', ...tagList].join(';');

  const rows = history.map((sample) => {
    const iso = new Date(sample.timestamp).toISOString();
    const simTime = sample.timeStr;
    const values = tagList.map((tag) => {
      const val = sample.readings[tag];
      return val !== undefined ? val.toFixed(2) : '';
    });
    return [iso, simTime, ...values].join(';');
  });

  const csvContent = [headerRow, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  link.setAttribute('download', `telemetrie_ocp_${circuitName.replace(/\s+/g, '_')}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
