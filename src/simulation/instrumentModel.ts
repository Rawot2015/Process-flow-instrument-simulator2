/**
 * @license
 * Process Flow & Instrument Simulator
 * Modular Instrument Model (Sensors, Lag, Noise, Calibration, Alarms)
 */

import { AlarmItem, ProcessComponent } from '../types/process';

export interface SensorFilterState {
  filteredValue: number;
}

export class InstrumentModel {
  private sensorStates: Map<string, SensorFilterState> = new Map();

  /**
   * Resets sensor states
   */
  public reset(): void {
    this.sensorStates.clear();
  }

  /**
   * Processes a single instrument component and evaluates its measurement & alarms
   */
  public processInstrument(
    instrument: ProcessComponent,
    trueProcessValue: number,
    dtSeconds: number,
    currentTimeStr: string
  ): {
    measuredValue: number;
    status: 'normal' | 'warning' | 'alarm';
    alarms: AlarmItem[];
  } {
    const params = instrument.params;
    let state = this.sensorStates.get(instrument.id);
    if (!state) {
      state = { filteredValue: trueProcessValue };
      this.sensorStates.set(instrument.id, state);
    }

    // First-order sensor lag: y(k) = alpha * y(k-1) + (1 - alpha) * u(k)
    const tau = 0.5; // time constant in seconds
    const alpha = Math.exp(-dtSeconds / Math.max(0.1, tau));

    // Realistic small measurement noise (±0.3% of span)
    const span = (params.sensorRangeMax || 200) - (params.sensorRangeMin || 0);
    const noise = (Math.random() - 0.5) * 0.006 * span;

    state.filteredValue = alpha * state.filteredValue + (1 - alpha) * (trueProcessValue + noise);

    // Clamp to range limits
    const clampedValue = Math.max(
      params.sensorRangeMin || 0,
      Math.min(params.sensorRangeMax || 9999, state.filteredValue)
    );

    const measured = Math.round(clampedValue * 10) / 10;

    // Alarms evaluation
    const alarms: AlarmItem[] = [];
    let status: 'normal' | 'warning' | 'alarm' = 'normal';

    const unit =
      params.measuredProperty === 'flow'
        ? 'm³/h'
        : params.measuredProperty === 'pressure'
        ? 'bar'
        : params.measuredProperty === 'level'
        ? '%'
        : '°C';

    if (params.alarmHighHigh !== undefined && measured >= params.alarmHighHigh) {
      status = 'alarm';
      alarms.push({
        id: `${instrument.id}_HH_${Date.now()}`,
        componentId: instrument.id,
        tag: params.tag,
        description: `TRÈS HAUTE VALEUR (${params.tag} ≥ ${params.alarmHighHigh} ${unit})`,
        severity: 'critical',
        limitValue: params.alarmHighHigh,
        currentValue: measured,
        unit,
        timestamp: currentTimeStr,
        acknowledged: false,
      });
    } else if (params.alarmHigh !== undefined && measured >= params.alarmHigh) {
      status = 'warning';
      alarms.push({
        id: `${instrument.id}_H_${Date.now()}`,
        componentId: instrument.id,
        tag: params.tag,
        description: `HAUTE VALEUR (${params.tag} ≥ ${params.alarmHigh} ${unit})`,
        severity: 'warning',
        limitValue: params.alarmHigh,
        currentValue: measured,
        unit,
        timestamp: currentTimeStr,
        acknowledged: false,
      });
    } else if (params.alarmLowLow !== undefined && measured <= params.alarmLowLow) {
      status = 'alarm';
      alarms.push({
        id: `${instrument.id}_LL_${Date.now()}`,
        componentId: instrument.id,
        tag: params.tag,
        description: `TRÈS BASSE VALEUR (${params.tag} ≤ ${params.alarmLowLow} ${unit})`,
        severity: 'critical',
        limitValue: params.alarmLowLow,
        currentValue: measured,
        unit,
        timestamp: currentTimeStr,
        acknowledged: false,
      });
    } else if (params.alarmLow !== undefined && measured <= params.alarmLow) {
      status = 'warning';
      alarms.push({
        id: `${instrument.id}_L_${Date.now()}`,
        componentId: instrument.id,
        tag: params.tag,
        description: `BASSE VALEUR (${params.tag} ≤ ${params.alarmLow} ${unit})`,
        severity: 'warning',
        limitValue: params.alarmLow,
        currentValue: measured,
        unit,
        timestamp: currentTimeStr,
        acknowledged: false,
      });
    }

    return {
      measuredValue: measured,
      status,
      alarms,
    };
  }
}

export const instrumentEngine = new InstrumentModel();
