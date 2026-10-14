/**
 * @license
 * Process Flow & Instrument Simulator
 * Visual Mode (Light/Dark) & Engineering Units Configuration Modal
 */

import React from 'react';
import { UnitSystem } from '../types/process';
import {
  X,
  Check,
  Moon,
  Sun,
  Sliders,
  Gauge,
  Activity,
  Layers,
} from 'lucide-react';

interface ThemeCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: UnitSystem;
  onUpdateUnits: (units: Partial<UnitSystem>) => void;
  themeMode: 'dark' | 'light';
  onSetThemeMode: (mode: 'dark' | 'light') => void;
}

export const ThemeCustomizationModal: React.FC<ThemeCustomizationModalProps> = ({
  isOpen,
  onClose,
  units,
  onUpdateUnits,
  themeMode,
  onSetThemeMode,
}) => {
  if (!isOpen) return null;

  const isLight = themeMode === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`rounded-xl border w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden font-['Plus_Jakarta_Sans'] transition-colors duration-150 ${
          isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0B1118] border-slate-700 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D14] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-emerald-500" />
            <h2 className={`text-base font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Configuration Visuelle & Paramètres
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 1. Light Mode / Dark Mode Switcher */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider block mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Mode Visuel de l'Interface & Canvas
            </label>
            <div className="grid grid-cols-2 gap-3.5">
              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => onSetThemeMode('dark')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition text-left relative ${
                  themeMode === 'dark'
                    ? 'border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500/30'
                    : isLight
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    : 'border-slate-800 bg-[#0F1722] hover:bg-slate-800/40'
                }`}
              >
                {themeMode === 'dark' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-xs">Mode Sombre</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">SCADA Industriel OCP</p>
                </div>
              </button>

              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => onSetThemeMode('light')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition text-left relative ${
                  themeMode === 'light'
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30'
                    : isLight
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    : 'border-slate-800 bg-[#0F1722] hover:bg-slate-800/40'
                }`}
              >
                {themeMode === 'light' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-amber-600 fill-amber-500" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-xs">Mode Clair</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Daylight & Schéma Blueprint</p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Engineering Unit System */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider block mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Unités d'Ingénierie des Procédés
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Pressure Units */}
              <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1622] border-slate-800'}`}>
                <span className={`block text-[11px] font-semibold mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Pression (P)
                </span>
                <select
                  value={units.pressure}
                  onChange={(e) => onUpdateUnits({ pressure: e.target.value as any })}
                  className={`w-full rounded px-2.5 py-1 font-mono text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <option value="bar">bar (relatif)</option>
                  <option value="kPa">kPa (kiloPascal)</option>
                  <option value="psi">psi (lbf/in²)</option>
                  <option value="Pa">Pa (Pascal)</option>
                </select>
              </div>

              {/* Flow Units */}
              <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1622] border-slate-800'}`}>
                <span className={`block text-[11px] font-semibold mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Débit Volumique (Q)
                </span>
                <select
                  value={units.flow}
                  onChange={(e) => onUpdateUnits({ flow: e.target.value as any })}
                  className={`w-full rounded px-2.5 py-1 font-mono text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <option value="m3_h">m³/h (standard usine)</option>
                  <option value="L_min">L/min (litres / min)</option>
                  <option value="kg_h">kg/h (débit massique)</option>
                </select>
              </div>

              {/* Temperature Units */}
              <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1622] border-slate-800'}`}>
                <span className={`block text-[11px] font-semibold mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Température (T)
                </span>
                <select
                  value={units.temperature}
                  onChange={(e) => onUpdateUnits({ temperature: e.target.value as any })}
                  className={`w-full rounded px-2.5 py-1 font-mono text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <option value="C">°C (Celsius)</option>
                  <option value="K">K (Kelvin)</option>
                </select>
              </div>

              {/* Level Units */}
              <div className={`p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0E1622] border-slate-800'}`}>
                <span className={`block text-[11px] font-semibold mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Niveau Bacs (L)
                </span>
                <select
                  value={units.level}
                  onChange={(e) => onUpdateUnits({ level: e.target.value as any })}
                  className={`w-full rounded px-2.5 py-1 font-mono text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <option value="%">% hauteur utile</option>
                  <option value="m">m (mètres de pulpe)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3.5 border-t flex justify-end gap-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#070D14] border-slate-800'
          }`}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
