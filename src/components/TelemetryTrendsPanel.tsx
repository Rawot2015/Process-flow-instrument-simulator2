/**
 * @license
 * Process Flow & Instrument Simulator
 * Real-Time Telemetry & Multi-Channel Trend Recorder
 */

import React, { useState } from 'react';
import { TelemetrySample } from '../types/process';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Download,
  Pause,
  Play,
  RotateCcw,
  Wifi,
} from 'lucide-react';

interface TelemetryTrendsPanelProps {
  history: TelemetrySample[];
  isRunning: boolean;
  onExportCsv: () => void;
  themeMode?: 'dark' | 'light';
}

interface ChannelConfig {
  key: string;
  label: string;
  color: string;
  unit: string;
  minScale: number;
  maxScale: number;
}

export const TelemetryTrendsPanel: React.FC<TelemetryTrendsPanelProps> = ({
  history,
  isRunning,
  onExportCsv,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeChannels, setActiveChannels] = useState<string[]>([
    'FT-101',
    'PT-101',
    'FV-101_OP%',
    'FC-101_SP',
  ]);

  const CHANNELS: ChannelConfig[] = [
    { key: 'FT-101', label: 'Débit FT-101', color: '#10B981', unit: 'm³/h', minScale: 0, maxScale: 250 },
    { key: 'PT-101', label: 'Pression PT-101', color: '#38BDF8', unit: 'bar', minScale: 0, maxScale: 12 },
    { key: 'FV-101_OP%', label: 'Ouverture FV-101', color: '#F59E0B', unit: '%', minScale: 0, maxScale: 100 },
    { key: 'FC-101_SP', label: 'Consigne SP', color: '#A855F7', unit: 'm³/h', minScale: 0, maxScale: 250 },
    { key: 'TK-101', label: 'Niveau TK-101', color: '#06B6D4', unit: '%', minScale: 0, maxScale: 100 },
    { key: 'E-101_TEMP', label: 'Température E-101', color: '#F97316', unit: '°C', minScale: 0, maxScale: 80 },
    { key: 'P-101_RPM', label: 'Vitesse Pompe RPM', color: '#E11D48', unit: 'RPM', minScale: 0, maxScale: 1800 },
  ];

  const toggleChannel = (key: string) => {
    setActiveChannels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Prepare chart dimensions
  const chartWidth = 900;
  const chartHeight = 160;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 25;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Recent data slice (last 60 samples)
  const dataSlice = history.slice(-60);

  // Generate SVG path for a given channel key
  const generatePath = (ch: ChannelConfig) => {
    if (dataSlice.length < 2) return '';

    const points = dataSlice.map((sample, idx) => {
      const x = paddingLeft + (idx / Math.max(1, dataSlice.length - 1)) * innerWidth;
      const rawVal = sample.readings[ch.key] ?? (ch.key === 'FC-101_SP' ? 120 : 0);
      const normalized = Math.max(0, Math.min(1, (rawVal - ch.minScale) / (ch.maxScale - ch.minScale)));
      const y = paddingTop + (1 - normalized) * innerHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const latestSample = dataSlice[dataSlice.length - 1];

  return (
    <div
      className={`border-t flex flex-col select-none font-['Plus_Jakarta_Sans'] transition-colors duration-150 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'border-slate-800 bg-[#080D14] text-slate-100'
      }`}
    >
      {/* Top Strip / Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b ${
          isLight ? 'bg-slate-50 border-slate-200' : 'border-slate-800/80 bg-[#0A1018]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              Enregistreur de Tendances en Temps Réel (SCADA Historian)
            </span>
          </div>

          {/* WebSocket stream status */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/40">
            <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>FLUX TÉLÉMÉTRIE WS : 20 Hz (Latence &lt; 5ms)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition"
          >
            <Download className="w-3 h-3" />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Graph Content */}
      {!isCollapsed && (
        <div className="p-3 flex flex-col md:flex-row gap-4 items-stretch">
          {/* Channel selector badges */}
          <div className="w-56 flex flex-col gap-1.5 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Canaux d'Acquisition :
            </span>
            {CHANNELS.map((ch) => {
              const isSelected = activeChannels.includes(ch.key);
              const currentVal = latestSample?.readings[ch.key];
              return (
                <button
                  key={ch.key}
                  onClick={() => toggleChannel(ch.key)}
                  className={`flex items-center justify-between px-2.5 py-1 rounded text-xs transition border ${
                    isSelected
                      ? 'bg-[#111A24] border-slate-700 text-white font-medium shadow-sm'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: ch.color, opacity: isSelected ? 1 : 0.4 }}
                    />
                    <span className="truncate text-[11px]">{ch.label}</span>
                  </div>
                  <span className="font-mono text-[10px] ml-2 text-slate-300">
                    {currentVal !== undefined ? currentVal.toFixed(1) : '--'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SVG Multi-trace Time Series Chart */}
          <div className="flex-1 bg-[#05090F] border border-slate-800/90 rounded-lg p-2 overflow-hidden relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              className="w-full h-40 overflow-visible"
            >
              {/* Horizontal grid lines & scale markings */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = paddingTop + (1 - pct) * innerHeight;
                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="#1E293B"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingLeft - 6}
                      y={y + 3}
                      fill="#64748B"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      textAnchor="end"
                    >
                      {pct === 1 ? '100%' : pct === 0 ? '0' : `${(pct * 100).toFixed(0)}%`}
                    </text>
                  </g>
                );
              })}

              {/* Vertical time grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((tPct, i) => {
                const x = paddingLeft + tPct * innerWidth;
                return (
                  <line
                    key={i}
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={chartHeight - paddingBottom}
                    stroke="#16202E"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Draw active channel traces */}
              {CHANNELS.filter((ch) => activeChannels.includes(ch.key)).map((ch) => (
                <path
                  key={ch.key}
                  d={generatePath(ch)}
                  fill="none"
                  stroke={ch.color}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Real-time sweeping marker on latest value */}
              {dataSlice.length > 0 && (
                <line
                  x1={paddingLeft + innerWidth}
                  y1={paddingTop}
                  x2={paddingLeft + innerWidth}
                  y2={chartHeight - paddingBottom}
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Time axis label */}
              <text
                x={paddingLeft + innerWidth / 2}
                y={chartHeight - 8}
                fill="#64748B"
                fontSize="9"
                fontFamily="JetBrains Mono"
                textAnchor="middle"
              >
                TEMPS ÉCOULÉ (FENÊTRE GLISSANTE DE 60s)
              </text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
