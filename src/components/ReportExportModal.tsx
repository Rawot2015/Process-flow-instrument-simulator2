/**
 * @license
 * Process Flow & Instrument Simulator
 * Industrial Engineering Report Generator (Printable PDF & CSV Export)
 */

import React from 'react';
import {
  AlarmItem,
  ProcessCircuit,
  SimulationState,
  TelemetrySample,
} from '../types/process';
import { OcpLogo } from './OcpLogo';
import { Download, Printer, X, FileText, CheckCircle } from 'lucide-react';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuit: ProcessCircuit;
  simState: SimulationState;
  alarms: AlarmItem[];
  telemetryHistory: TelemetrySample[];
  onExportCsv: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  circuit,
  simState,
  alarms,
  telemetryHistory,
  onExportCsv,
}) => {
  if (!isOpen) return null;

  const handlePrintPdf = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0B1118] border border-slate-700/80 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100 font-['Plus_Jakarta_Sans']">
        {/* Modal Top Action Bar (hidden in print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#070D14]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Rapport d'Ingénierie & Télémétrie OCP
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter Données CSV</span>
            </button>
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / Sauvegarder en PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 print:p-0 print:m-0 print:overflow-visible">
          {/* Official OCP Header */}
          <div className="border-b-2 border-emerald-800 pb-5 mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <OcpLogo size="lg" variant="full" />
              <div className="border-l-2 border-slate-300 pl-3">
                <h1 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                  DIRECTION TECHNIQUE ET PROCÉDÉS PHOSPHATE
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Rapport de Simulation Hydraulique & Régulation Procédé (Digital Twin)
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-600 font-mono">
              <div>RÉF : OCP-SIM-{circuit.id.toUpperCase()}</div>
              <div>DATE : {currentDate}</div>
              <div>STATUT : RAPPORT CERTIFIÉ</div>
            </div>
          </div>

          {/* Circuit Overview */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wide border-b border-slate-200 pb-1 mb-2.5">
              1. Contexte du Circuit & Fluide Caloporteur
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <div className="font-semibold text-slate-800 mb-1">Nom du Circuit Procédé :</div>
                <div className="text-slate-700">{circuit.name}</div>
                <div className="text-slate-500 text-[11px] mt-1">{circuit.description}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Fluide :</span>
                  <span className="font-bold text-slate-900">{circuit.fluid.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Densité de la pulpe :</span>
                  <span className="font-bold text-slate-900">{circuit.fluid.density} kg/m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Taux de solides (Cw) :</span>
                  <span className="font-bold text-emerald-700">{circuit.fluid.solidsPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Viscosité apparente :</span>
                  <span>{(circuit.fluid.viscosity * 1000).toFixed(1)} cP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Performance Summary Table */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wide border-b border-slate-200 pb-1 mb-2.5">
              2. Bilan d'Exploitation des Équipements de Procédé
            </h2>
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold">
                  <th className="py-2 px-3">Tag</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Débit Q</th>
                  <th className="py-2 px-3">P. Amont (P1)</th>
                  <th className="py-2 px-3">P. Aval (P2)</th>
                  <th className="py-2 px-3">Perte / HMT</th>
                  <th className="py-2 px-3">Paramètre Clé</th>
                  <th className="py-2 px-3">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {circuit.components.map((comp) => (
                  <tr key={comp.id}>
                    <td className="py-2 px-3 font-bold text-slate-900">{comp.params.tag}</td>
                    <td className="py-2 px-3 font-sans text-slate-600">{comp.params.label}</td>
                    <td className="py-2 px-3">{comp.live.flowRate.toFixed(1)} m³/h</td>
                    <td className="py-2 px-3">{comp.live.inletPressure.toFixed(2)} bar</td>
                    <td className="py-2 px-3">{comp.live.outletPressure.toFixed(2)} bar</td>
                    <td className="py-2 px-3">
                      {comp.type === 'pump'
                        ? `${comp.live.head.toFixed(1)} m`
                        : `${comp.live.pressureDrop.toFixed(2)} bar`}
                    </td>
                    <td className="py-2 px-3">
                      {comp.type === 'pump'
                        ? `${comp.params.pumpSpeedRpm} RPM`
                        : comp.type === 'control_valve' || comp.type === 'valve'
                        ? `${comp.params.valveOpeningPct}% Ouv.`
                        : comp.type === 'tank'
                        ? `${comp.params.currentLevelPct}% Niveau`
                        : comp.type === 'heat_exchanger'
                        ? `${comp.live.temperature.toFixed(1)} °C`
                        : '--'}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <span
                        className={`font-semibold ${
                          comp.live.status === 'alarm'
                            ? 'text-red-600'
                            : comp.live.status === 'warning'
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {comp.live.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Instrumentation & Control Loops Table */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wide border-b border-slate-200 pb-1 mb-2.5">
              3. Chaîne d'Instrumentation & Boucles de Régulation PID
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <span className="font-bold text-slate-800 block mb-2 font-sans">
                  Transmetteurs et Capteurs de Mesure
                </span>
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-300">
                      <th className="pb-1">Tag</th>
                      <th className="pb-1">Mesure</th>
                      <th className="pb-1">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {circuit.components
                      .filter((c) => ['FT', 'PT', 'TT', 'LT'].includes(c.type))
                      .map((inst) => (
                        <tr key={inst.id}>
                          <td className="py-1 font-bold text-slate-800">{inst.params.tag}</td>
                          <td className="py-1">
                            {inst.params.measuredValue?.toFixed(2)}{' '}
                            {inst.type === 'FT' ? 'm³/h' : inst.type === 'PT' ? 'bar' : '%'}
                          </td>
                          <td className="py-1 text-emerald-700 font-sans font-semibold">NORMAL</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <span className="font-bold text-slate-800 block mb-2 font-sans">
                  Régulateurs PID en Ligne
                </span>
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-300">
                      <th className="pb-1">Tag</th>
                      <th className="pb-1">Consigne (SP)</th>
                      <th className="pb-1">Sortie (MV)</th>
                      <th className="pb-1">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {circuit.components
                      .filter((c) => ['FC', 'PC', 'LC', 'TC'].includes(c.type))
                      .map((ctrl) => (
                        <tr key={ctrl.id}>
                          <td className="py-1 font-bold text-slate-800">{ctrl.params.tag}</td>
                          <td className="py-1">{ctrl.params.setpoint?.toFixed(1)}</td>
                          <td className="py-1 text-emerald-700 font-bold">
                            {ctrl.params.controllerOutputPct?.toFixed(1)}%
                          </td>
                          <td className="py-1 font-sans">{ctrl.params.controllerMode?.toUpperCase()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Alarms and Safety Record */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wide border-b border-slate-200 pb-1 mb-2.5">
              4. Registre des Alarmes & Alertes Opérationnelles
            </h2>
            {alarms.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Aucune anomalie ou dépassement de seuil d'alarme durant la période de simulation.</span>
              </div>
            ) : (
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100">
                    <tr className="text-slate-600">
                      <th className="p-2">Sévérité</th>
                      <th className="p-2">Tag</th>
                      <th className="p-2">Description</th>
                      <th className="p-2">Valeur</th>
                      <th className="p-2">Horodatage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {alarms.map((a) => (
                      <tr key={a.id}>
                        <td className="p-2 text-red-600 font-bold">{a.severity.toUpperCase()}</td>
                        <td className="p-2">{a.tag}</td>
                        <td className="p-2 font-sans">{a.description}</td>
                        <td className="p-2 text-red-600">{a.currentValue} {a.unit}</td>
                        <td className="p-2 text-slate-500">{a.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Engineering Sign-off Box */}
          <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 text-xs text-slate-600">
            <div>
              <div className="font-semibold text-slate-800">Ingénieur Procédé :</div>
              <div className="mt-6 border-b border-slate-400 w-36"></div>
              <div className="text-[10px] text-slate-400 mt-1">Visa & Signature</div>
            </div>
            <div>
              <div className="font-semibold text-slate-800">Responsable Automatismes :</div>
              <div className="mt-6 border-b border-slate-400 w-36"></div>
              <div className="text-[10px] text-slate-400 mt-1">Visa & Signature</div>
            </div>
            <div>
              <div className="font-semibold text-slate-800">Validation Chef d'Usine :</div>
              <div className="mt-6 border-b border-slate-400 w-36"></div>
              <div className="text-[10px] text-slate-400 mt-1">Cachet OCP</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
