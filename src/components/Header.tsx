/**
 * @license
 * Process Flow & Instrument Simulator
 * Industrial Top Header Bar (OCP Branding, Simulation Controls, Circuit Management, Light/Dark Mode)
 */

import React, { useState } from 'react';
import { SimulationState, AlarmItem, ProcessCircuit } from '../types/process';
import { OcpLogo } from './OcpLogo';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Bell,
  Sliders,
  FileText,
  Cloud,
  WifiOff,
  Plus,
  Trash2,
  Sun,
  Moon,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  simState: SimulationState;
  activeCircuit: ProcessCircuit;
  circuits: ProcessCircuit[];
  activeAlarms: AlarmItem[];
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
  onOpenAlarms: () => void;
  onOpenSettings: () => void;
  onOpenReport: () => void;
  onSelectCircuit: (circuitId: string) => void;
  onCreateCircuit: (name: string, template: 'empty' | 'default' | 'cyclone') => void;
  onDeleteCircuit: (circuitId: string) => void;
  isOffline: boolean;
  themeMode: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  simState,
  activeCircuit,
  circuits,
  activeAlarms,
  onStart,
  onPause,
  onStop,
  onReset,
  onSetSpeed,
  onOpenAlarms,
  onOpenSettings,
  onOpenReport,
  onSelectCircuit,
  onCreateCircuit,
  onDeleteCircuit,
  isOffline,
  themeMode,
  onToggleTheme,
}) => {
  const speeds = [0.5, 1, 2, 5, 10];
  const isLight = themeMode === 'light';

  // Modal state for adding a circuit
  const [isAddCircuitModalOpen, setIsAddCircuitModalOpen] = useState(false);
  const [newCircuitName, setNewCircuitName] = useState('');
  const [newCircuitTemplate, setNewCircuitTemplate] = useState<'empty' | 'default' | 'cyclone'>('default');

  // Confirmation state for deleting a circuit
  const [isDeleteCircuitModalOpen, setIsDeleteCircuitModalOpen] = useState(false);

  const formatSimTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.floor(totalSec % 60);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const handleOpenAddModal = () => {
    setNewCircuitName(`Circuit ${circuits.length + 1}`);
    setNewCircuitTemplate('default');
    setIsAddCircuitModalOpen(true);
  };

  const handleConfirmAddCircuit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newCircuitName.trim() || `Circuit ${circuits.length + 1}`;
    onCreateCircuit(finalName, newCircuitTemplate);
    setIsAddCircuitModalOpen(false);
  };

  const handleConfirmDeleteCircuit = () => {
    onDeleteCircuit(activeCircuit.id);
    setIsDeleteCircuitModalOpen(false);
  };

  return (
    <>
      <header
        className={`h-14 border-b px-3 lg:px-4 flex items-center justify-between gap-3 select-none shrink-0 z-30 font-['Plus_Jakarta_Sans'] transition-colors duration-150 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#080D14] border-slate-800 text-slate-100'
        }`}
      >
        {/* Zone 1: OCP Brand Wordmark & Circuit Management */}
        <div className="flex items-center gap-2.5 lg:gap-3.5 shrink-0">
          <OcpLogo size="md" variant="full" />
          <div className={`hidden lg:block h-6 w-px ${isLight ? 'bg-slate-300' : 'bg-slate-800'}`} />

          {/* Circuit Switcher & Management */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`hidden xl:inline text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Circuit :
              </span>
              <div className="relative flex items-center">
                <select
                  value={activeCircuit.id}
                  onChange={(e) => onSelectCircuit(e.target.value)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                      : 'bg-[#101824] border-slate-700/80 text-slate-200 hover:bg-[#162130]'
                  }`}
                >
                  {circuits.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.components.length} éq.)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Circuit Button */}
            <button
              onClick={handleOpenAddModal}
              title="Créer un nouveau circuit indépendant"
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-semibold transition ${
                isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nouveau</span>
            </button>

            {/* Delete Circuit Button */}
            <button
              onClick={() => setIsDeleteCircuitModalOpen(true)}
              disabled={circuits.length <= 1}
              title={
                circuits.length <= 1
                  ? 'Impossible de supprimer l’unique circuit existant'
                  : `Supprimer le circuit actif (${activeCircuit.name})`
              }
              className={`p-1.5 rounded-lg border text-xs transition ${
                circuits.length <= 1
                  ? 'opacity-40 cursor-not-allowed bg-transparent border-transparent text-slate-400'
                  : isLight
                  ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                  : 'bg-red-950/40 border-red-800/60 text-red-400 hover:bg-red-900/50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Zone 2: Main Simulation Transport Controls (START, PAUSE, STOP, RESET, SPEED, TIME) */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Playback Buttons */}
          <div
            className={`flex items-center rounded-lg p-0.5 border shadow-sm ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#101724] border-slate-700/80'
            }`}
          >
            {!simState.isRunning || simState.isPaused ? (
              <button
                onClick={onStart}
                title="Démarrer la simulation"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md transition shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>DÉMARRER</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                title="Mettre en pause"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-md transition shadow-sm"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </button>
            )}

            <button
              onClick={onStop}
              title="Arrêter la simulation"
              className={`p-1.5 rounded transition ${
                isLight ? 'text-slate-600 hover:text-black hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onReset}
              title="Réinitialiser le circuit"
              className={`p-1.5 rounded transition ${
                isLight ? 'text-slate-600 hover:text-black hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Multiplier Segmented Tabs */}
          <div
            className={`hidden sm:flex items-center rounded-lg p-0.5 text-xs font-mono border ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#101724] border-slate-800'
            }`}
          >
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-1 rounded transition text-[11px] font-semibold ${
                  simState.speedMultiplier === s
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Live Simulation Time & Status Counter */}
          <div
            className={`hidden md:flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-mono border ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0C121B] border-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  simState.isRunning && !simState.isPaused
                    ? 'bg-emerald-500 animate-pulse'
                    : simState.isPaused
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className={`text-[11px] uppercase font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {simState.isRunning && !simState.isPaused ? 'EN COURS' : simState.isPaused ? 'PAUSE' : 'ARRÊT'}
              </span>
            </div>
            <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>|</span>
            <span className={`font-bold tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {formatSimTime(simState.simTimeSeconds)}
            </span>
          </div>
        </div>

        {/* Zone 3: Actions (Light/Dark Toggle, Alarms, Report, Settings) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Light / Dark Mode Quick Switch */}
          <button
            onClick={onToggleTheme}
            title={isLight ? 'Activer le Mode Sombre (Dark SCADA)' : 'Activer le Mode Clair (Daylight / Blueprint)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition shadow-sm ${
              isLight
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
            }`}
          >
            {isLight ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span className="hidden md:inline">Clair</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-300 fill-cyan-400/20" />
                <span className="hidden md:inline">Sombre</span>
              </>
            )}
          </button>

          {/* Alarms Button with Count Badge */}
          <button
            onClick={onOpenAlarms}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
              activeAlarms.length > 0
                ? 'bg-red-950/40 border-red-700/60 text-red-300 hover:bg-red-900/50'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-[#101724] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${activeAlarms.length > 0 ? 'text-red-400 animate-bounce' : ''}`} />
            <span className="hidden sm:inline">Alarmes</span>
            {activeAlarms.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold bg-red-600 text-white">
                {activeAlarms.length}
              </span>
            )}
          </button>

          {/* Report / Export PDF */}
          <button
            onClick={onOpenReport}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-[#101724] hover:bg-[#162130] border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Rapport</span>
          </button>

          {/* Settings / Units */}
          <button
            onClick={onOpenSettings}
            title="Paramètres & Unités d'ingénierie"
            className={`p-1.5 rounded-lg border transition ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-[#101724] hover:bg-[#162130] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4 text-cyan-500" />
          </button>
        </div>
      </header>

      {/* MODAL 1: ADD CIRCUIT */}
      {isAddCircuitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md rounded-xl border p-5 shadow-2xl transition-colors ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0F1722] border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold">Créer un Nouveau Circuit</h3>
              </div>
              <button
                onClick={() => setIsAddCircuitModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAddCircuit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-400">
                  Nom du Circuit
                </label>
                <input
                  type="text"
                  required
                  value={newCircuitName}
                  onChange={(e) => setNewCircuitName(e.target.value)}
                  placeholder="Ex : Ligne Flottation 2, Circuit P-102"
                  className={`w-full rounded-lg px-3 py-2 border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-400">
                  Modèle de départ
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      newCircuitTemplate === 'default'
                        ? 'border-emerald-500 bg-emerald-950/20'
                        : isLight
                        ? 'border-slate-200 hover:bg-slate-50'
                        : 'border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      checked={newCircuitTemplate === 'default'}
                      onChange={() => setNewCircuitTemplate('default')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="font-bold">Boucle Régulée Standard</p>
                      <p className="text-[11px] text-slate-400">
                        Pompe P-101, vanne FV-101, PID (FT-101 → FC-101) et échangeur
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      newCircuitTemplate === 'cyclone'
                        ? 'border-emerald-500 bg-emerald-950/20'
                        : isLight
                        ? 'border-slate-200 hover:bg-slate-50'
                        : 'border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      checked={newCircuitTemplate === 'cyclone'}
                      onChange={() => setNewCircuitTemplate('cyclone')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="font-bold">Ligne Classification & Décanteur CCD</p>
                      <p className="text-[11px] text-slate-400">
                        Batterie d'hydrocyclones, décanteur CCD et recyclage de pulpe
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                      newCircuitTemplate === 'empty'
                        ? 'border-emerald-500 bg-emerald-950/20'
                        : isLight
                        ? 'border-slate-200 hover:bg-slate-50'
                        : 'border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      checked={newCircuitTemplate === 'empty'}
                      onChange={() => setNewCircuitTemplate('empty')}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <p className="font-bold">Circuit Vierge (Vide)</p>
                      <p className="text-[11px] text-slate-400">
                        Canvas vierge pour concevoir un circuit personnalisé depuis zéro
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setIsAddCircuitModalOpen(false)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold ${
                    isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm"
                >
                  Créer le Circuit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CIRCUIT CONFIRMATION */}
      {isDeleteCircuitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-sm rounded-xl border p-5 shadow-2xl transition-colors ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0F1722] border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold">Supprimer le Circuit</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le circuit{' '}
              <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                « {activeCircuit.name} »
              </strong>{' '}
              ? Les autres circuits resteront intacts.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/50 text-xs">
              <button
                type="button"
                onClick={() => setIsDeleteCircuitModalOpen(false)}
                className={`px-3 py-1.5 rounded-lg border font-semibold ${
                  isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCircuit}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
