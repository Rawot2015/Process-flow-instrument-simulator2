/**
 * @license
 * Process Flow & Instrument Simulator
 * Properties Panel (Dynamic Industrial Inspector for Pipes, Pumps, Valves, Instruments, Controllers)
 */

import React from 'react';
import {
  FluidProperties,
  ProcessCircuit,
  ProcessComponent,
  ProcessConnection,
  SimulationState,
  ValveSubType,
} from '../types/process';
import {
  Sliders,
  Settings,
  AlertTriangle,
  CheckCircle,
  Activity,
  Layers,
  Droplets,
  Zap,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import {
  INDUSTRIAL_VALVES_DATABASE,
  getFluidColorConfig,
  PRESET_FLUIDS,
} from '../constants/accessoriesData';

interface PropertiesPanelProps {
  circuit: ProcessCircuit;
  simState: SimulationState;
  selectedComponent: ProcessComponent | null;
  selectedConnection: ProcessConnection | null;
  onUpdateComponentParam: (id: string, updates: Partial<ProcessComponent['params']>) => void;
  onUpdateConnection: (id: string, updates: Partial<ProcessConnection>) => void;
  onUpdateFluid: (fluid: FluidProperties) => void;
  onOpenValveInspector: (valveType: ValveSubType) => void;
  onDeleteSelected: () => void;
  themeMode?: 'dark' | 'light';
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  circuit,
  simState,
  selectedComponent,
  selectedConnection,
  onUpdateComponentParam,
  onUpdateConnection,
  onUpdateFluid,
  onOpenValveInspector,
  onDeleteSelected,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';

  return (
    <aside
      className={`w-80 border-l flex flex-col h-full select-none z-10 shrink-0 font-['Plus_Jakarta_Sans'] transition-colors duration-150 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1118] border-slate-800 text-slate-100'
      }`}
    >
      {/* Header bar */}
      <div
        className={`p-3.5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#080D14] border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-500" />
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
            {selectedComponent
              ? `Propriétés : ${selectedComponent.params.tag}`
              : selectedConnection
              ? `Conduite : DN${selectedConnection.diameterMm}`
              : 'Paramètres du Procédé & Fluide'}
          </h3>
        </div>
        {(selectedComponent || selectedConnection) && (
          <button
            onClick={onDeleteSelected}
            title={selectedComponent ? `Supprimer ${selectedComponent.params.tag}` : 'Supprimer cette conduite'}
            className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md transition border shadow-sm ${
              isLight
                ? 'text-red-600 hover:text-white hover:bg-red-600 bg-red-50 border-red-200'
                : 'text-red-400 hover:text-white hover:bg-red-600 bg-red-950/40 border-red-900/60'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
        {/* 1. COMPONENT IS SELECTED */}
        {selectedComponent && (
          <div className="space-y-4">
            {/* Tag & Description */}
            <div className="bg-[#101723] border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400 font-semibold text-[11px]">Tag d'Ingénierie</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {selectedComponent.params.tag}
                </span>
              </div>
              <input
                type="text"
                value={selectedComponent.params.label}
                onChange={(e) =>
                  onUpdateComponentParam(selectedComponent.id, { label: e.target.value })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
              />
            </div>

            {/* A. PUMP P-101 PROPERTIES */}
            {selectedComponent.type === 'pump' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-[#101723] p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">État de la pompe :</span>
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    {selectedComponent.live.status === 'trip' ? (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> TRIP
                      </span>
                    ) : selectedComponent.live.status === 'warning' ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> WARNING
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> RUNNING
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Vitesse pompe (RPM) :</span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {selectedComponent.params.pumpSpeedRpm || 1450} RPM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1800"
                    step="50"
                    value={selectedComponent.params.pumpSpeedRpm || 1450}
                    onChange={(e) =>
                      onUpdateComponentParam(selectedComponent.id, {
                        pumpSpeedRpm: Number(e.target.value),
                        pumpState: Number(e.target.value) === 0 ? 'stopped' : 'running',
                      })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Live Operating Performance Table */}
                <div className="bg-[#101723] border border-slate-800 rounded-lg p-2.5 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hauteur Manométrique (HMT) :</span>
                    <span className="text-white font-bold">{selectedComponent.live.head.toFixed(1)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pression aspiration (Psuc) :</span>
                    <span className="text-slate-200">{selectedComponent.live.inletPressure.toFixed(2)} bar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pression refoulement (Pdis) :</span>
                    <span className="text-emerald-400 font-bold">{selectedComponent.live.outletPressure.toFixed(2)} bar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Puissance absorbée :</span>
                    <span className="text-amber-400">{selectedComponent.live.powerKw.toFixed(1)} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rendement estimé :</span>
                    <span className="text-slate-300">{selectedComponent.params.pumpEfficiency || 78}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* B. VALVE & CONTROL VALVE PROPERTIES */}
            {(selectedComponent.type === 'valve' || selectedComponent.type === 'control_valve') && (
              <div className="space-y-3">
                {/* Valve Model Selection */}
                <div>
                  <label className="text-slate-400 block mb-1">Type de vanne industrielle :</label>
                  <select
                    value={selectedComponent.params.valveType || 'slurry_control'}
                    onChange={(e) =>
                      onUpdateComponentParam(selectedComponent.id, {
                        valveType: e.target.value as ValveSubType,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  >
                    {Object.values(INDUSTRIAL_VALVES_DATABASE).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nameFr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valve Opening % slider */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Ouverture vanne (%) :</span>
                    <span className="font-mono text-amber-400 font-bold text-sm">
                      {selectedComponent.params.valveOpeningPct?.toFixed(0) || 75}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedComponent.params.valveOpeningPct ?? 75}
                    onChange={(e) =>
                      onUpdateComponentParam(selectedComponent.id, {
                        valveOpeningPct: Number(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Auto-Flush Button (OCP LL136 / LL467) */}
                <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-400 text-[11px] block">
                      Rinçage Auto (KGV-FLUSH)
                    </span>
                    <span className="text-[10px] text-slate-400">Recommandation OCP LL136</span>
                  </div>
                  <button
                    onClick={() => {
                      onUpdateComponentParam(selectedComponent.id, { flushingActive: true });
                      setTimeout(() => {
                        onUpdateComponentParam(selectedComponent.id, { flushingActive: false });
                      }, 2000);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded transition"
                  >
                    {selectedComponent.params.flushingActive ? 'Rinçage en cours...' : 'Rincer (Flush)'}
                  </button>
                </div>

                {/* Button to open detailed 2D Hydrodynamic Inspector */}
                <button
                  onClick={() =>
                    onOpenValveInspector(selectedComponent.params.valveType || 'slurry_control')
                  }
                  className="w-full py-1.5 bg-[#121E2C] hover:bg-[#18283A] border border-cyan-800/60 text-cyan-300 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspecteur 2D Hydrodynamique</span>
                </button>

                {/* Hydraulic telemetry */}
                <div className="bg-[#101723] border border-slate-800 rounded-lg p-2.5 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pression amont P1 :</span>
                    <span className="text-slate-200">{selectedComponent.live.inletPressure.toFixed(2)} bar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pression aval P2 :</span>
                    <span className="text-slate-200">{selectedComponent.live.outletPressure.toFixed(2)} bar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Perte de charge ΔP :</span>
                    <span className="text-red-400 font-bold">{selectedComponent.live.pressureDrop.toFixed(2)} bar</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Indice cavitation σ :</span>
                    <span className={selectedComponent.live.cavitationRisk ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {selectedComponent.live.cavitationIndex.toFixed(2)} {selectedComponent.live.cavitationRisk && '(Risque!)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* C. CONTROLLER (FC-101 / PC-101 / LC-101) */}
            {['FC', 'PC', 'LC', 'TC'].includes(selectedComponent.type) && (
              <div className="space-y-3">
                {/* Auto / Manual Mode Toggle */}
                <div className="flex items-center justify-between bg-[#101723] p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Mode Régulateur :</span>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded">
                    <button
                      onClick={() =>
                        onUpdateComponentParam(selectedComponent.id, { controllerMode: 'auto' })
                      }
                      className={`px-2.5 py-1 text-[11px] rounded font-semibold transition ${
                        selectedComponent.params.controllerMode === 'auto'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      AUTO
                    </button>
                    <button
                      onClick={() =>
                        onUpdateComponentParam(selectedComponent.id, { controllerMode: 'manual' })
                      }
                      className={`px-2.5 py-1 text-[11px] rounded font-semibold transition ${
                        selectedComponent.params.controllerMode === 'manual'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      MANUEL
                    </button>
                  </div>
                </div>

                {/* Setpoint Slider */}
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Consigne (Setpoint SP) :</span>
                    <span className="font-mono text-cyan-300 font-bold text-sm">
                      {selectedComponent.params.setpoint?.toFixed(1)} m³/h
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="220"
                    value={selectedComponent.params.setpoint ?? 120}
                    onChange={(e) =>
                      onUpdateComponentParam(selectedComponent.id, {
                        setpoint: Number(e.target.value),
                      })
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* PID Parameters Tuning (Kp, Ki, Kd) */}
                <div className="bg-[#101723] border border-slate-800 rounded-lg p-2.5 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Réglage Boucle PID
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Gain Kp</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedComponent.params.kp ?? 0.85}
                        onChange={(e) =>
                          onUpdateComponentParam(selectedComponent.id, {
                            kp: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Intégral Ki</label>
                      <input
                        type="number"
                        step="0.05"
                        value={selectedComponent.params.ki ?? 0.25}
                        onChange={(e) =>
                          onUpdateComponentParam(selectedComponent.id, {
                            ki: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Dérivé Kd</label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedComponent.params.kd ?? 0.05}
                        onChange={(e) =>
                          onUpdateComponentParam(selectedComponent.id, {
                            kd: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Controller Output Readout */}
                <div className="bg-[#101723] border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mesure Procédé (PV) :</span>
                    <span className="text-white font-bold">
                      {selectedComponent.params.processVariable?.toFixed(1)} m³/h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sortie Régulateur (MV) :</span>
                    <span className="text-emerald-400 font-bold">
                      {selectedComponent.params.controllerOutputPct?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* D. INSTRUMENTS (FT / PT / TT / LT) */}
            {['FT', 'PT', 'TT', 'LT', 'FI', 'PI', 'TI', 'LI'].includes(selectedComponent.type) && (
              <div className="space-y-3">
                <div className="bg-[#101723] border border-slate-800 rounded-lg p-3 text-center">
                  <span className="text-slate-400 text-[11px] block mb-1">Mesure Actuelle</span>
                  <div className="text-2xl font-mono font-bold text-cyan-300">
                    {selectedComponent.params.measuredValue?.toFixed(2)}{' '}
                    <span className="text-xs text-slate-400">
                      {selectedComponent.type === 'FT' ? 'm³/h' : selectedComponent.type === 'PT' ? 'bar' : '%'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Statut : {selectedComponent.live.status?.toUpperCase() || 'NORMAL'}
                  </span>
                </div>

                {/* Alarm Thresholds Configuration */}
                <div className="bg-[#101723] border border-slate-800 rounded-lg p-2.5 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Seuils d'Alarme Transmetteur
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="text-red-400 block">Très Haut (HH)</label>
                      <input
                        type="number"
                        value={selectedComponent.params.alarmHighHigh ?? 200}
                        onChange={(e) =>
                          onUpdateComponentParam(selectedComponent.id, {
                            alarmHighHigh: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 font-mono text-center text-red-300"
                      />
                    </div>
                    <div>
                      <label className="text-amber-400 block">Haut (H)</label>
                      <input
                        type="number"
                        value={selectedComponent.params.alarmHigh ?? 180}
                        onChange={(e) =>
                          onUpdateComponentParam(selectedComponent.id, {
                            alarmHigh: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 font-mono text-center text-amber-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* E. TANK TK-100 */}
            {selectedComponent.type === 'tank' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Niveau de remplissage (%) :</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: getFluidColorConfig(circuit.fluid.type, isLight).primary }}
                    >
                      {selectedComponent.params.currentLevelPct?.toFixed(0)}%
                    </span>
                  </div>
                  {/* Visual Slurry Tank Gauge Bar */}
                  <div className={`w-full h-3 rounded-full border overflow-hidden relative mb-2 ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-700'}`}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${selectedComponent.params.currentLevelPct || 65}%`,
                        backgroundColor: isLight
                          ? getFluidColorConfig(circuit.fluid.type, isLight).fillLight
                          : getFluidColorConfig(circuit.fluid.type, isLight).fillDark,
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={selectedComponent.params.currentLevelPct ?? 65}
                    onChange={(e) =>
                      onUpdateComponentParam(selectedComponent.id, {
                        currentLevelPct: Number(e.target.value),
                      })
                    }
                    className="w-full cursor-pointer"
                    style={{ accentColor: getFluidColorConfig(circuit.fluid.type, isLight).primary }}
                  />
                </div>
                <div className="bg-[#101723] border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volume total :</span>
                    <span className="text-white">{selectedComponent.params.tankVolumeM3 || 60} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hauteur max :</span>
                    <span className="text-white">{selectedComponent.params.tankMaxLevelM || 7} m</span>
                  </div>
                </div>
              </div>
            )}

            {/* Prominent Action Button: Supprimer cet équipement */}
            <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <button
                onClick={onDeleteSelected}
                className={`w-full py-2 border rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm ${
                  isLight
                    ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'
                    : 'bg-red-950/40 hover:bg-red-900/60 border-red-700/60 text-red-300 hover:text-white'
                }`}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>
                  {`Supprimer cet équipement (${selectedComponent.params.tag})`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 2. CONNECTION (PIPE) IS SELECTED */}
        {!selectedComponent && selectedConnection && (
          <div className="space-y-3">
            <div className="bg-[#101723] border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 font-semibold text-[11px] block mb-1">
                Spécification Tuyauterie
              </span>
              <div className="font-mono text-base font-bold text-cyan-300">
                DN{selectedConnection.diameterMm} · {selectedConnection.material}
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Diamètre Nominal DN (mm) :</label>
              <select
                value={selectedConnection.diameterMm}
                onChange={(e) =>
                  onUpdateConnection(selectedConnection.id, {
                    diameterMm: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
              >
                <option value="150">DN150 (6")</option>
                <option value="200">DN200 (8")</option>
                <option value="250">DN250 (10")</option>
                <option value="300">DN300 (12")</option>
                <option value="400">DN400 (16")</option>
                <option value="500">DN500 (20")</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Longueur de tronçon (m) :</label>
              <input
                type="number"
                value={selectedConnection.lengthM}
                onChange={(e) =>
                  onUpdateConnection(selectedConnection.id, {
                    lengthM: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
              />
            </div>

            {/* Calculated Hydraulics */}
            <div className="bg-[#101723] border border-slate-800 rounded-lg p-2.5 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Débit véhiculé Q :</span>
                <span className="text-emerald-400 font-bold">{selectedConnection.flowRate.toFixed(1)} m³/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vitesse d'écoulement V :</span>
                <span className="text-cyan-300 font-bold">{selectedConnection.velocity.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vitesse critique dépôt Vc :</span>
                <span className="text-amber-300">{selectedConnection.criticalDepositionVelocity.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nombre de Reynolds :</span>
                <span className="text-slate-200">{selectedConnection.reynolds.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Perte de charge linéaire ΔP :</span>
                <span className="text-slate-200">{selectedConnection.pressureDropBar.toFixed(3)} bar</span>
              </div>
            </div>

            {/* Prominent Action Button: Supprimer cette tuyauterie */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={onDeleteSelected}
                className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-700/60 text-red-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Supprimer cette tuyauterie</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. NO SELECTION: FLUID PROPERTIES MANAGER */}
        {!selectedComponent && !selectedConnection && (
          <div className="space-y-3.5">
            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-3">
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                <Droplets className="w-3.5 h-3.5" />
                <span>Propriétés du Fluide Caloporteur / Slurry</span>
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Les propriétés du fluide pilotent la viscosité apparente Bingham, les pertes de charge et la vitesse critique de sédimentation.
              </p>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Type de Fluide de Procédé :</label>
              <select
                value={circuit.fluid.type}
                onChange={(e) => {
                  const t = e.target.value;
                  if (t === 'water') {
                    onUpdateFluid(PRESET_FLUIDS.water);
                  } else {
                    onUpdateFluid(PRESET_FLUIDS.phosphate_slurry);
                  }
                }}
                className={`w-full rounded px-2.5 py-1.5 text-xs border ${
                  isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <option value="phosphate_slurry">Pulpe de Phosphate OCP (35% solides)</option>
                <option value="water">Eau claire de procédé / Dilution</option>
                <option value="air">Air comprimé / Flottation</option>
              </select>
            </div>

            {/* Centralized Visual Slurry Color Swatch & Description */}
            <div className={`p-2.5 rounded-lg border flex items-center gap-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#101723] border-slate-800'}`}>
              <div
                className="w-6 h-6 rounded-md shrink-0 shadow-sm border border-black/20"
                style={{
                  backgroundColor: isLight
                    ? getFluidColorConfig(circuit.fluid.type, isLight).fillLight
                    : getFluidColorConfig(circuit.fluid.type, isLight).fillDark,
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Couleur du produit
                </span>
                <span className="text-[11px] font-semibold block truncate" style={{ color: getFluidColorConfig(circuit.fluid.type, isLight).primary }}>
                  {getFluidColorConfig(circuit.fluid.type, isLight).label}
                </span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Densité de la pulpe (kg/m³) :</label>
              <input
                type="number"
                value={circuit.fluid.density}
                onChange={(e) =>
                  onUpdateFluid({ ...circuit.fluid, density: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Teneur en Solides (% massique Cw) :</label>
              <input
                type="number"
                value={circuit.fluid.solidsPercentage}
                onChange={(e) =>
                  onUpdateFluid({ ...circuit.fluid, solidsPercentage: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Taille médiane grains D50 (µm) :</label>
              <input
                type="number"
                value={circuit.fluid.d50}
                onChange={(e) =>
                  onUpdateFluid({ ...circuit.fluid, d50: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
