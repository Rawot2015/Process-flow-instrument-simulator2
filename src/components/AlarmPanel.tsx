/**
 * @license
 * Process Flow & Instrument Simulator
 * Industrial Alarm System & Event Log (SCADA Standard)
 */

import React, { useState } from 'react';
import { AlarmItem } from '../types/process';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  X,
  Bell,
  Check,
  Trash2,
} from 'lucide-react';

interface AlarmPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeAlarms: AlarmItem[];
  alarmHistory: AlarmItem[];
  onAcknowledgeAlarm: (alarmId: string) => void;
  onClearAll: () => void;
}

export const AlarmPanel: React.FC<AlarmPanelProps> = ({
  isOpen,
  onClose,
  activeAlarms,
  alarmHistory,
  onAcknowledgeAlarm,
  onClearAll,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning'>('all');

  if (!isOpen) return null;

  const filteredAlarms = activeAlarms.filter((a) => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0B1118] border border-slate-700/80 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100 font-['Plus_Jakarta_Sans']">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#070D14]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Gestionnaire d'Alarmes & Déclenchements Procédé
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-600/30 text-red-400 border border-red-500/40">
                  {activeAlarms.length} Active{activeAlarms.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Surveillance continue des seuils critiques (Pression, Débit, Cavitation, Décantation)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeAlarms.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Acquitter Tout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Severity Filter Strip */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800/80 bg-[#0E1520] text-xs">
          <span className="text-slate-400 font-medium">Filtrer par sévérité :</span>
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              filterSeverity === 'all'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Toutes ({activeAlarms.length})
          </button>
          <button
            onClick={() => setFilterSeverity('critical')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              filterSeverity === 'critical'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Critiques (
            {activeAlarms.filter((a) => a.severity === 'critical').length})
          </button>
          <button
            onClick={() => setFilterSeverity('warning')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              filterSeverity === 'warning'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Avertissements (
            {activeAlarms.filter((a) => a.severity === 'warning').length})
          </button>
        </div>

        {/* Alarm List Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAlarms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-white">Aucune alarme active</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Le circuit fonctionne dans les limites de consigne nominales. Toutes les pressions, débits et températures sont normaux.
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#0A1017]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0E1622] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Sévérité</th>
                    <th className="py-2.5 px-3">Tag</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Valeur Actuelle</th>
                    <th className="py-2.5 px-3">Seuil Limite</th>
                    <th className="py-2.5 px-3">Horodatage</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {filteredAlarms.map((alarm) => (
                    <tr
                      key={alarm.id}
                      className="hover:bg-slate-900/60 transition group"
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {alarm.severity === 'critical' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-800/60">
                            <AlertOctagon className="w-3 h-3" /> CRITIQUE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60">
                            <AlertTriangle className="w-3 h-3" /> ALERTE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                        {alarm.tag}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-200">
                        {alarm.description}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-red-400 whitespace-nowrap">
                        {alarm.currentValue} {alarm.unit}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {alarm.limitValue} {alarm.unit}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                        {alarm.timestamp}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => onAcknowledgeAlarm(alarm.id)}
                          className="px-2.5 py-1 text-[11px] font-sans font-medium bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded transition shadow-sm"
                        >
                          Acquitter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
