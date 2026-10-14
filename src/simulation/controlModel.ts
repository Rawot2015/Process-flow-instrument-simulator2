/**
 * @license
 * Process Flow & Instrument Simulator
 * Modular Control Loop Engine (PID, Auto/Manual, Tracking)
 */

export interface PidState {
  integralAccumulator: number;
  previousError: number;
  lastExecutionTime: number;
}

export class ControlModel {
  private pidStates: Map<string, PidState> = new Map();

  /**
   * Resets internal integrator and states for a controller
   */
  public resetController(controllerId: string): void {
    this.pidStates.delete(controllerId);
  }

  /**
   * Executes one discrete PID update step
   */
  public updateController(
    controllerId: string,
    setpoint: number,
    processVariable: number,
    dtSeconds: number,
    kp: number = 0.8,
    ki: number = 0.15,
    kd: number = 0.05,
    directAction: boolean = false,
    mode: 'auto' | 'manual' = 'auto',
    manualOutputPct: number = 50
  ): {
    controllerOutputPct: number;
    error: number;
    proportionalTerm: number;
    integralTerm: number;
    derivativeTerm: number;
  } {
    // If in manual mode, direct pass-through
    if (mode === 'manual') {
      const output = Math.max(0, Math.min(100, manualOutputPct));
      return {
        controllerOutputPct: output,
        error: setpoint - processVariable,
        proportionalTerm: 0,
        integralTerm: 0,
        derivativeTerm: 0,
      };
    }

    let state = this.pidStates.get(controllerId);
    if (!state) {
      state = {
        integralAccumulator: 50, // initialize at neutral mid-scale
        previousError: 0,
        lastExecutionTime: Date.now(),
      };
      this.pidStates.set(controllerId, state);
    }

    // Error calculation (reverse action typical for valve throttling flow: if PV < SP, need to open valve more)
    const rawError = setpoint - processVariable;
    const error = directAction ? -rawError : rawError;

    // Proportional term
    const pTerm = kp * error;

    // Integral term with trapezoidal integration & anti-windup clamping
    const dt = Math.max(0.05, Math.min(2.0, dtSeconds));
    state.integralAccumulator += ki * error * dt;
    state.integralAccumulator = Math.max(0, Math.min(100, state.integralAccumulator));

    // Derivative term
    const dTerm = kd * ((error - state.previousError) / dt);
    state.previousError = error;

    // Unconstrained controller output
    let output = state.integralAccumulator + pTerm + dTerm;

    // Clamp to valve 0-100% position
    output = Math.max(0, Math.min(100, output));

    return {
      controllerOutputPct: Math.round(output * 10) / 10,
      error: Math.round(error * 10) / 10,
      proportionalTerm: Math.round(pTerm * 10) / 10,
      integralTerm: Math.round(state.integralAccumulator * 10) / 10,
      derivativeTerm: Math.round(dTerm * 10) / 10,
    };
  }
}

export const controlEngine = new ControlModel();
