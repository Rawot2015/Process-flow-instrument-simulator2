/**
 * @license
 * Process Flow & Instrument Simulator
 * Main Industrial Application Shell (OCP Standard)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AlarmItem,
  ProcessCircuit,
  ProcessComponent,
  SimulationState,
  TelemetrySample,
  ValveSubType,
} from './types/process';
import { DEFAULT_CIRCUIT, PHOSPHATE_CLASSIFICATION_CIRCUIT } from './constants/presets';
import { SimulationEngine } from './simulation/simulationEngine';
import { Header } from './components/Header';
import { ComponentPalette } from './components/ComponentPalette';
import { PAndIDCanvas } from './components/PAndIDCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { TelemetryTrendsPanel } from './components/TelemetryTrendsPanel';
import { ValveCutawayInspectorModal } from './components/ValveCutawayInspectorModal';
import { AlarmPanel } from './components/AlarmPanel';
import { ThemeCustomizationModal } from './components/ThemeCustomizationModal';
import { ReportExportModal } from './components/ReportExportModal';
import { exportTelemetryCsv } from './utils/exportCsv';
import { Sliders, Layers, X, Trash2 } from 'lucide-react';

const STORAGE_KEY_CIRCUITS = 'ocp_simulator_circuits_v2';
const STORAGE_KEY_ACTIVE_ID = 'ocp_simulator_active_circuit_id';
const STORAGE_KEY_THEME_MODE = 'ocp_simulator_theme_mode';

export default function App() {
  // 1. Multiple Circuits Management State
  const [circuits, setCircuits] = useState<ProcessCircuit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CIRCUITS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load saved circuits from localStorage', e);
    }
    return [DEFAULT_CIRCUIT, PHOSPHATE_CLASSIFICATION_CIRCUIT];
  });

  const [activeCircuitId, setActiveCircuitId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId) return savedId;
    } catch (e) {}
    return DEFAULT_CIRCUIT.id;
  });

  // Theme mode: Simple Light Mode / Dark Mode switch
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME_MODE);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });

  // Find active circuit object
  const activeCircuit = circuits.find((c) => c.id === activeCircuitId) || circuits[0] || DEFAULT_CIRCUIT;

  // 2. Initialize Simulation Engine with active circuit
  const engineRef = useRef<SimulationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new SimulationEngine(activeCircuit);
  }
  const engine = engineRef.current;

  // React state synced from engine
  const [circuit, setCircuit] = useState<ProcessCircuit>(engine.getCircuit());
  const [simState, setSimState] = useState<SimulationState>(engine.getState());
  const [alarms, setAlarms] = useState<AlarmItem[]>(engine.getActiveAlarms());
  const [alarmHistory, setAlarmHistory] = useState<AlarmItem[]>(engine.getAlarmHistory());
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetrySample[]>([]);

  // Selection states
  const [selectedCompId, setSelectedCompId] = useState<string | null>('fv_101');
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);

  // Deletion Confirmation modal state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    id: string;
    tag: string;
    isConnection?: boolean;
  } | null>(null);

  // Modals state
  const [isValveInspectorOpen, setIsValveInspectorOpen] = useState<boolean>(false);
  const [inspectorValveType, setInspectorValveType] = useState<ValveSubType>('butterfly_rubber');
  const [isAlarmPanelOpen, setIsAlarmPanelOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Mobile drawer toggles
  const [mobileLeftOpen, setMobileLeftOpen] = useState<boolean>(false);
  const [mobileRightOpen, setMobileRightOpen] = useState<boolean>(false);

  // Offline capability tracking
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Subscribe to simulation engine events
  useEffect(() => {
    const unsubscribe = engine.subscribe((c, s, a) => {
      setCircuit({ ...c });
      setSimState({ ...s });
      setAlarms([...a]);
      setAlarmHistory([...engine.getAlarmHistory()]);
      setTelemetryHistory([...engine.getTelemetryHistory()]);

      // Keep active circuit synchronized in circuits array
      setCircuits((prev) => {
        return prev.map((item) => (item.id === c.id ? { ...c } : item));
      });
    });

    const startTimeout = setTimeout(() => {
      engine.start();
    }, 500);

    return () => {
      clearTimeout(startTimeout);
      unsubscribe();
    };
  }, [engine]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Global Keyboard shortcuts: Delete / Backspace key to remove selected equipment or connection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCompId || selectedConnId) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCompId, selectedConnId]);

  // Simulation transport controls
  const handleStart = () => engine.start();
  const handlePause = () => engine.pause();
  const handleStop = () => engine.stop();
  const handleReset = () => engine.reset();
  const handleSetSpeed = (s: number) => engine.setSpeedMultiplier(s);

  // Circuit Management handlers
  const handleSelectCircuit = (circuitId: string) => {
    const target = circuits.find((c) => c.id === circuitId);
    if (!target) return;
    setActiveCircuitId(circuitId);
    engine.setCircuit(target);

    // Set highlighted component for new circuit
    const highlight =
      target.components.find((c) => c.type === 'control_valve' || c.type === 'pump') ||
      target.components[0];
    setSelectedCompId(highlight ? highlight.id : null);
    setSelectedConnId(null);

    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, circuitId);
    } catch (e) {}
  };

  const handleCreateCircuit = (name: string, template: 'empty' | 'default' | 'cyclone') => {
    const newId = `circuit_${Date.now()}`;
    let baseCircuit: ProcessCircuit;

    if (template === 'cyclone') {
      baseCircuit = JSON.parse(JSON.stringify(PHOSPHATE_CLASSIFICATION_CIRCUIT));
    } else if (template === 'empty') {
      baseCircuit = {
        id: newId,
        name,
        description: 'Circuit personnalisé',
        fluid: DEFAULT_CIRCUIT.fluid,
        components: [],
        connections: [],
      };
    } else {
      baseCircuit = JSON.parse(JSON.stringify(DEFAULT_CIRCUIT));
    }

    baseCircuit.id = newId;
    baseCircuit.name = name;

    const nextCircuits = [...circuits, baseCircuit];
    setCircuits(nextCircuits);
    setActiveCircuitId(newId);
    engine.setCircuit(baseCircuit);
    setSelectedCompId(baseCircuit.components[0]?.id || null);
    setSelectedConnId(null);

    try {
      localStorage.setItem(STORAGE_KEY_CIRCUITS, JSON.stringify(nextCircuits));
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, newId);
    } catch (e) {}
  };

  const handleDeleteCircuit = (circuitId: string) => {
    if (circuits.length <= 1) return;

    const nextCircuits = circuits.filter((c) => c.id !== circuitId);
    setCircuits(nextCircuits);

    if (activeCircuitId === circuitId) {
      const fallback = nextCircuits[0];
      setActiveCircuitId(fallback.id);
      engine.setCircuit(fallback);
      setSelectedCompId(fallback.components[0]?.id || null);
      setSelectedConnId(null);
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, fallback.id);
      } catch (e) {}
    }

    try {
      localStorage.setItem(STORAGE_KEY_CIRCUITS, JSON.stringify(nextCircuits));
    } catch (e) {}
  };

  // Theme Mode toggle
  const handleToggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    try {
      localStorage.setItem(STORAGE_KEY_THEME_MODE, next);
    } catch (e) {}
  };

  const handleSetThemeMode = (mode: 'dark' | 'light') => {
    setThemeMode(mode);
    try {
      localStorage.setItem(STORAGE_KEY_THEME_MODE, mode);
    } catch (e) {}
  };

  // Component & Canvas operations
  const handleUpdateComponentParam = (id: string, updates: Partial<ProcessComponent['params']>) => {
    engine.updateComponentParam(id, updates);
  };

  const handleUpdateComponentPosition = (id: string, x: number, y: number) => {
    engine.updateComponentPosition(id, x, y);
  };

  const handleAddComponent = (comp: ProcessComponent) => {
    engine.addComponent(comp);
    setSelectedCompId(comp.id);
    setSelectedConnId(null);
    setMobileLeftOpen(false);
  };

  const handleDeleteSelected = () => {
    if (selectedCompId) {
      const comp = circuit.components.find((c) => c.id === selectedCompId);
      if (comp) {
        setDeleteConfirmItem({
          id: comp.id,
          tag: comp.params.tag || comp.id,
          isConnection: false,
        });
      }
    } else if (selectedConnId) {
      const conn = circuit.connections.find((c) => c.id === selectedConnId);
      if (conn) {
        setDeleteConfirmItem({
          id: conn.id,
          tag: `DN${conn.diameterMm} (${conn.sourceId} → ${conn.targetId})`,
          isConnection: true,
        });
      }
    }
  };

  const confirmExecuteDelete = () => {
    if (!deleteConfirmItem) return;
    if (deleteConfirmItem.isConnection) {
      engine.removeConnection(deleteConfirmItem.id);
      setSelectedConnId(null);
    } else {
      engine.removeComponent(deleteConfirmItem.id);
      setSelectedCompId(null);
    }
    setDeleteConfirmItem(null);
  };

  const handleOpenValveInspector = (valveType?: ValveSubType) => {
    if (valveType) setInspectorValveType(valveType);
    setIsValveInspectorOpen(true);
  };

  const handleApplyValveInspectorToCircuit = (valveType: ValveSubType, openingPct: number) => {
    const activeValve =
      circuit.components.find(
        (c) => c.id === selectedCompId && (c.type === 'valve' || c.type === 'control_valve')
      ) || circuit.components.find((c) => c.type === 'control_valve' || c.type === 'valve');

    if (activeValve) {
      engine.updateComponentParam(activeValve.id, {
        valveType,
        valveOpeningPct: openingPct,
      });
    }
  };

  const selectedComponent = circuit.components.find((c) => c.id === selectedCompId) || null;
  const selectedConnection = circuit.connections.find((c) => c.id === selectedConnId) || null;
  const isLight = themeMode === 'light';

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden font-['Plus_Jakarta_Sans'] select-none transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-800' : 'bg-[#0A0F17] text-slate-100'
      }`}
    >
      {/* 1. Header Bar with Circuit Management & Light/Dark Mode Switch */}
      <Header
        simState={simState}
        activeCircuit={circuit}
        circuits={circuits}
        activeAlarms={alarms}
        onStart={handleStart}
        onPause={handlePause}
        onStop={handleStop}
        onReset={handleReset}
        onSetSpeed={handleSetSpeed}
        onOpenAlarms={() => setIsAlarmPanelOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onSelectCircuit={handleSelectCircuit}
        onCreateCircuit={handleCreateCircuit}
        onDeleteCircuit={handleDeleteCircuit}
        isOffline={isOffline}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Mobile Toolbar Toggle Buttons */}
      <div
        className={`lg:hidden flex items-center justify-between px-3 py-1.5 border-b text-xs ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0C121B] border-slate-800'
        }`}
      >
        <button
          onClick={() => setMobileLeftOpen(!mobileLeftOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold ${
            isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-500" />
          <span>Équipements</span>
        </button>
        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
          Q = {circuit.components.find((c) => c.type === 'pump')?.live.flowRate.toFixed(1) || '0.0'} m³/h
        </span>
        <button
          onClick={() => setMobileRightOpen(!mobileRightOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold ${
            isLight ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-500" />
          <span>Propriétés</span>
        </button>
      </div>

      {/* 2. Main Workspace (Left Palette + Central P&ID Canvas + Right Properties) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Left Sidebar (Component Palette) */}
        <div className="hidden lg:flex h-full">
          <ComponentPalette
            onAddComponent={handleAddComponent}
            onOpenValveInspector={() => handleOpenValveInspector('butterfly_rubber')}
            themeMode={themeMode}
          />
        </div>

        {/* Mobile Left Drawer Overlay */}
        {mobileLeftOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex">
            <div
              className={`w-72 h-full border-r flex flex-col ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#0B1118] border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center p-3 border-b border-slate-700/50">
                <span className="font-bold text-xs">ÉQUIPEMENTS</span>
                <button onClick={() => setMobileLeftOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <ComponentPalette
                onAddComponent={handleAddComponent}
                onOpenValveInspector={() => {
                  setMobileLeftOpen(false);
                  handleOpenValveInspector('butterfly_rubber');
                }}
                themeMode={themeMode}
              />
            </div>
          </div>
        )}

        {/* Central Interactive P&ID Simulation Canvas */}
        <main className="flex-1 h-full flex flex-col min-w-0 overflow-hidden relative">
          <PAndIDCanvas
            circuit={circuit}
            simState={simState}
            selectedComponentId={selectedCompId}
            selectedConnectionId={selectedConnId}
            onSelectComponent={(id) => {
              setSelectedCompId(id);
              if (id) {
                setSelectedConnId(null);
              }
            }}
            onSelectConnection={(id) => {
              setSelectedConnId(id);
              if (id) {
                setSelectedCompId(null);
              }
            }}
            onUpdateComponentPosition={handleUpdateComponentPosition}
            onOpenValveInspector={handleOpenValveInspector}
            onDeleteSelected={handleDeleteSelected}
            themeMode={themeMode}
          />
        </main>

        {/* Desktop Right Sidebar (Properties & Hydraulics Inspector) */}
        <div className="hidden lg:flex h-full">
          <PropertiesPanel
            circuit={circuit}
            simState={simState}
            selectedComponent={selectedComponent}
            selectedConnection={selectedConnection}
            onUpdateComponentParam={handleUpdateComponentParam}
            onUpdateConnection={(id, updates) => {
              const conn = circuit.connections.find((c) => c.id === id);
              if (conn) {
                Object.assign(conn, updates);
                engine.step(0.05);
              }
            }}
            onUpdateFluid={(f) => engine.updateFluid(f)}
            onOpenValveInspector={handleOpenValveInspector}
            onDeleteSelected={handleDeleteSelected}
            themeMode={themeMode}
          />
        </div>

        {/* Mobile Right Drawer Overlay */}
        {mobileRightOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
            <div
              className={`w-80 h-full border-l flex flex-col ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#0B1118] border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center p-3 border-b border-slate-700/50">
                <span className="font-bold text-xs">PROPRIÉTÉS</span>
                <button onClick={() => setMobileRightOpen(false)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <PropertiesPanel
                circuit={circuit}
                simState={simState}
                selectedComponent={selectedComponent}
                selectedConnection={selectedConnection}
                onUpdateComponentParam={handleUpdateComponentParam}
                onUpdateConnection={(id, updates) => {
                  const conn = circuit.connections.find((c) => c.id === id);
                  if (conn) {
                    Object.assign(conn, updates);
                    engine.step(0.05);
                  }
                }}
                onUpdateFluid={(f) => engine.updateFluid(f)}
                onOpenValveInspector={(v) => {
                  setMobileRightOpen(false);
                  handleOpenValveInspector(v);
                }}
                onDeleteSelected={() => {
                  handleDeleteSelected();
                  setMobileRightOpen(false);
                }}
                themeMode={themeMode}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Multi-Trace Telemetry Trends Panel */}
      <TelemetryTrendsPanel
        history={telemetryHistory}
        isRunning={simState.isRunning && !simState.isPaused}
        onExportCsv={() => exportTelemetryCsv(telemetryHistory, circuit.name)}
        themeMode={themeMode}
      />

      {/* 4. Interactive Modals */}
      <ValveCutawayInspectorModal
        isOpen={isValveInspectorOpen}
        onClose={() => setIsValveInspectorOpen(false)}
        initialValveType={inspectorValveType}
        initialOpeningPct={
          selectedComponent && (selectedComponent.type === 'valve' || selectedComponent.type === 'control_valve')
            ? selectedComponent.params.valveOpeningPct ?? 65
            : 65
        }
        initialFlowRate={circuit.components.find((c) => c.type === 'pump')?.live.flowRate || 120}
        initialDiameterMm={200}
        onApplyToCircuit={handleApplyValveInspectorToCircuit}
      />

      <AlarmPanel
        isOpen={isAlarmPanelOpen}
        onClose={() => setIsAlarmPanelOpen(false)}
        activeAlarms={alarms}
        alarmHistory={alarmHistory}
        onAcknowledgeAlarm={(id) => engine.acknowledgeAlarm(id)}
        onClearAll={() => engine.clearAllAlarms()}
      />

      <ThemeCustomizationModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        units={simState.units}
        onUpdateUnits={(u) => engine.updateUnits(u)}
        themeMode={themeMode}
        onSetThemeMode={handleSetThemeMode}
      />

      <ReportExportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        circuit={circuit}
        simState={simState}
        alarms={alarms}
        telemetryHistory={telemetryHistory}
        onExportCsv={() => exportTelemetryCsv(telemetryHistory, circuit.name)}
      />

      {/* 5. Delete Confirmation Modal (Protects against accidental equipment or connection deletion) */}
      {deleteConfirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setDeleteConfirmItem(null)}
        >
          <div
            className={`w-full max-w-md rounded-xl p-6 shadow-2xl border ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0F1722] border-slate-800 text-slate-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  {deleteConfirmItem.isConnection ? 'Supprimer la conduite' : 'Supprimer l\'équipement'}
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Action sur le schéma du procédé
                </p>
              </div>
            </div>
            <p className={`text-xs leading-relaxed mb-6 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Voulez-vous vraiment supprimer{' '}
              <span className="font-mono font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                {deleteConfirmItem.tag}
              </span>{' '}
              ?
              {!deleteConfirmItem.isConnection && (
                <span className="block mt-2 text-[11px] text-amber-500 font-medium">
                  ⚠️ Note : Toutes les conduites raccordées à cet équipement seront également retirées.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition ${
                  isLight
                    ? 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={confirmExecuteDelete}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1.5 shadow-md shadow-red-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
