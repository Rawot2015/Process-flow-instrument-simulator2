/**
 * @license
 * Process Flow & Instrument Simulator
 * P&ID Process Diagram Simulation Canvas (SVG & Canvas Interactive Engine)
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  ProcessCircuit,
  ProcessComponent,
  ProcessConnection,
  SimulationState,
  ValveSubType,
} from '../types/process';
import { getFluidColorConfig } from '../constants/accessoriesData';
import { ZoomIn, ZoomOut, Maximize2, Trash2, Settings, ExternalLink } from 'lucide-react';

interface PAndIDCanvasProps {
  circuit: ProcessCircuit;
  simState: SimulationState;
  selectedComponentId: string | null;
  selectedConnectionId: string | null;
  onSelectComponent: (componentId: string | null) => void;
  onSelectConnection: (connectionId: string | null) => void;
  onUpdateComponentPosition: (componentId: string, x: number, y: number) => void;
  onOpenValveInspector?: (valveType: ValveSubType) => void;
  onDeleteSelected?: () => void;
  themeMode?: 'dark' | 'light';
}

export const PAndIDCanvas: React.FC<PAndIDCanvasProps> = ({
  circuit,
  simState,
  selectedComponentId,
  selectedConnectionId,
  onSelectComponent,
  onSelectConnection,
  onUpdateComponentPosition,
  onOpenValveInspector,
  onDeleteSelected,
  themeMode = 'dark',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Zoom and pan state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });

  // Panning tracking ref (avoids stale closures and jitter)
  const panRef = useRef<{
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
    hasMoved: boolean;
    isPanning: boolean;
  } | null>(null);

  // Component dragging tracking ref
  const dragRef = useRef<{
    compId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    hasMoved: boolean;
  } | null>(null);

  // Animation cycle counter for fluid particle flow
  const [animTick, setAnimTick] = useState<number>(0);

  useEffect(() => {
    let frameId: number;
    const animate = () => {
      setAnimTick((prev) => (prev + 1) % 10000);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.15));
  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 40, y: 30 });
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((z) => Math.max(0.4, Math.min(2.5, z * zoomFactor)));
  };

  // Mouse down on canvas background
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only respond to primary (left) button
    if (e.button !== 0) return;

    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origPanX: pan.x,
      origPanY: pan.y,
      hasMoved: false,
      isPanning: true,
    };
  };

  // Global mouse move on container
  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. If dragging an equipment
    if (dragRef.current) {
      const dx = (e.clientX - dragRef.current.startX) / zoom;
      const dy = (e.clientY - dragRef.current.startY) / zoom;
      if (Math.hypot(dx, dy) > 3 || dragRef.current.hasMoved) {
        dragRef.current.hasMoved = true;
        const newX = Math.round(Math.max(10, dragRef.current.origX + dx));
        const newY = Math.round(Math.max(10, dragRef.current.origY + dy));
        onUpdateComponentPosition(dragRef.current.compId, newX, newY);
      }
      return;
    }

    // 2. If panning canvas
    if (panRef.current && panRef.current.isPanning) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      if (Math.hypot(dx, dy) > 3 || panRef.current.hasMoved) {
        panRef.current.hasMoved = true;
        setPan({
          x: panRef.current.origPanX + dx,
          y: panRef.current.origPanY + dy,
        });
      }
    }
  };

  // Global mouse up on container
  const handleMouseUp = () => {
    // If was panning canvas
    if (panRef.current) {
      // If user did NOT move the canvas (pure single click on empty background):
      if (!panRef.current.hasMoved) {
        onSelectComponent(null);
        onSelectConnection(null);
      }
      panRef.current = null;
    }

    // If was dragging equipment
    if (dragRef.current) {
      dragRef.current = null;
    }
  };

  // Helper to get component center coordinates
  const getCompCenter = (id: string) => {
    const c = circuit.components.find((comp) => comp.id === id);
    if (!c) return { x: 0, y: 0 };
    return {
      x: c.x + c.width / 2,
      y: c.y + c.height / 2,
    };
  };

  const isLight = themeMode === 'light';

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`relative flex-1 w-full h-full overflow-hidden select-none cursor-crosshair transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC]' : 'bg-[#0A0F17]'
      }`}
    >
      {/* Background Engineering Millimeter Grid */}
      <svg
        id="canvas-bg"
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="smallGrid" width={16 * zoom} height={16 * zoom} patternUnits="userSpaceOnUse">
            <path
              d={`M ${16 * zoom} 0 L 0 0 0 ${16 * zoom}`}
              fill="none"
              stroke={isLight ? 'rgba(203, 213, 225, 0.6)' : 'rgba(30, 41, 59, 0.45)'}
              strokeWidth="0.5"
            />
          </pattern>
          <pattern id="grid" width={80 * zoom} height={80 * zoom} patternUnits="userSpaceOnUse">
            <rect width={80 * zoom} height={80 * zoom} fill="url(#smallGrid)" />
            <path
              d={`M ${80 * zoom} 0 L 0 0 0 ${80 * zoom}`}
              fill="none"
              stroke={isLight ? 'rgba(148, 163, 184, 0.5)' : 'rgba(51, 65, 85, 0.55)'}
              strokeWidth="1.2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating Canvas Tools & Zoom HUD */}
      <div
        className={`absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-lg p-1.5 shadow-xl backdrop-blur-sm border ${
          isLight
            ? 'bg-white/90 border-slate-300 text-slate-700'
            : 'bg-[#0F1722]/90 border-slate-700/80 text-slate-300'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className={`p-1.5 rounded transition ${
            isLight ? 'hover:bg-slate-100 hover:text-black' : 'hover:bg-slate-700/80 hover:text-white'
          }`}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className={`p-1.5 rounded transition ${
            isLight ? 'hover:bg-slate-100 hover:text-black' : 'hover:bg-slate-700/80 hover:text-white'
          }`}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Recentrer la vue"
          className={`p-1.5 rounded transition ${
            isLight ? 'hover:bg-slate-100 hover:text-black' : 'hover:bg-slate-700/80 hover:text-white'
          }`}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <span
          className={`text-[11px] font-mono px-2 border-l ${
            isLight ? 'text-slate-500 border-slate-300' : 'text-slate-400 border-slate-700'
          }`}
        >
          {(zoom * 100).toFixed(0)}%
        </span>
      </div>

      {/* Quick Fluid Status Badge at top right of canvas */}
      {(() => {
        const fluidConfig = getFluidColorConfig(circuit.fluid.type, isLight);
        return (
          <div
            className={`absolute top-4 right-4 z-20 flex items-center gap-2 rounded-lg px-3 py-1.5 shadow-xl backdrop-blur-sm text-xs font-mono border ${
              isLight
                ? 'bg-white/90 border-slate-300 text-slate-700'
                : 'bg-[#0F1722]/90 border-slate-700/80 text-slate-300'
            }`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
              style={{ backgroundColor: fluidConfig.primary }}
            ></span>
            <span className="font-semibold">{circuit.fluid.name}</span>
            <span className="text-slate-400">·</span>
            <span
              className="font-bold font-mono"
              style={{ color: isLight ? fluidConfig.fillLight : fluidConfig.primary }}
            >
              {circuit.fluid.density} kg/m³
            </span>
            {circuit.fluid.solidsPercentage > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                ({circuit.fluid.solidsPercentage}% Solides)
              </span>
            )}
          </div>
        );
      })()}

      {/* Main SVG Render Layer */}
      <svg
        className="w-full h-full pointer-events-auto"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10B981" />
          </marker>
          <marker id="arrow-amber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#F59E0B" />
          </marker>
          <marker id="arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#EF4444" />
          </marker>
          <marker id="signal-dot" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5">
            <circle cx="4" cy="4" r="3" fill="#06B6D4" />
          </marker>
        </defs>

        {/* 1. PIPES & CONNECTIONS LAYER */}
        {circuit.connections.map((conn) => {
          const src = getCompCenter(conn.sourceId);
          const tgt = getCompCenter(conn.targetId);

          const isSelected = selectedConnectionId === conn.id;
          const isSignal = conn.type === 'signal';

          let pipeStroke = isLight ? '#94A3B8' : '#475569';
          let flowPulseSpeed = 0;

          if (isSignal) {
            pipeStroke = '#0891B2'; // cyan signal wire
          } else {
            flowPulseSpeed = Math.min(10, Math.max(0.4, (conn.flowRate / 60) * 1.8));

            if (conn.status === 'sedimentation_risk') pipeStroke = '#EA580C';
            else if (conn.status === 'overpressure') pipeStroke = '#DC2626';
            else if (conn.status === 'high_flow') pipeStroke = '#D97706';
            else if (conn.flowRate > 0.5) pipeStroke = isLight ? '#059669' : '#10B981';
            else pipeStroke = isLight ? '#94A3B8' : '#475569';
          }

          const midX = (src.x + tgt.x) / 2;
          const midY = (src.y + tgt.y) / 2;
          const pathD = `M ${src.x} ${src.y} C ${midX} ${src.y}, ${midX} ${tgt.y}, ${tgt.x} ${tgt.y}`;
          const offsetDash = simState.isRunning ? (animTick * flowPulseSpeed * 1.5) % 100 : 0;

          return (
            <g
              key={conn.id}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectConnection(conn.id);
                onSelectComponent(null);
              }}
              className="cursor-pointer"
            >
              {/* Invisible wide hitbox for reliable pipe selection without interfering with equipment */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth="18"
                strokeLinecap="round"
              />

              {/* Outer pipe casing / insulation */}
              {!isSignal && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSelected ? '#0284C7' : isLight ? '#CBD5E1' : '#1E293B'}
                  strokeWidth="11"
                  strokeLinecap="round"
                />
              )}

              {/* Core fluid pipe conduit */}
              <path
                d={pathD}
                fill="none"
                stroke={pipeStroke}
                strokeWidth={isSignal ? 2.2 : 6}
                strokeDasharray={isSignal ? '5,5' : 'none'}
                strokeOpacity={isSignal ? 0.9 : 0.95}
                strokeLinecap="round"
              />

              {/* Animated Flow Particles inside pipe */}
              {!isSignal && conn.flowRate > 0.5 && simState.isRunning && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeDasharray="4, 22"
                  strokeDashoffset={-offsetDash}
                  strokeLinecap="round"
                  className="opacity-90"
                />
              )}

              {/* Signal wire animated pulse */}
              {isSignal && simState.isRunning && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#67E8F9"
                  strokeWidth="3"
                  strokeDasharray="6, 30"
                  strokeDashoffset={-(animTick * 3) % 100}
                />
              )}

              {/* Live Pipe Tag & Flow Readout badge */}
              {!isSignal && conn.flowRate > 0 && (
                <g transform={`translate(${midX}, ${midY - 14})`}>
                  <rect
                    x="-42"
                    y="-10"
                    width="84"
                    height="18"
                    rx="3"
                    fill={isLight ? '#FFFFFF' : '#0B131D'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#94A3B8' : '#334155'}
                    strokeWidth="1.2"
                    className="drop-shadow"
                  />
                  <text
                    x="0"
                    y="3"
                    fill={isLight ? '#0F172A' : '#E2E8F0'}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {conn.flowRate.toFixed(1)} m³/h
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 2. COMPONENTS & EQUIPMENT LAYER */}
        {circuit.components.map((comp) => {
          const isSelected = selectedComponentId === comp.id;

          const handleCompMouseDown = (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectComponent(comp.id);
            onSelectConnection(null);

            // Record drag starting points
            dragRef.current = {
              compId: comp.id,
              startX: e.clientX,
              startY: e.clientY,
              origX: comp.x,
              origY: comp.y,
              hasMoved: false,
            };
          };

          const handleCompClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectComponent(comp.id);
            onSelectConnection(null);
          };

          return (
            <g
              key={comp.id}
              transform={`translate(${comp.x}, ${comp.y})`}
              onMouseDown={handleCompMouseDown}
              onClick={handleCompClick}
              onMouseUp={(e) => e.stopPropagation()}
              className="cursor-move group"
            >
              {/* Invisible interactive hitbox ensuring full clickability of the equipment bounding box */}
              <rect
                x="0"
                y="0"
                width={comp.width}
                height={comp.height + 24}
                fill="transparent"
                pointerEvents="all"
              />

              {/* Selection Highlight (High-visibility engineering outline) */}
              {isSelected && (
                <rect
                  x="-6"
                  y="-6"
                  width={comp.width + 12}
                  height={comp.height + 32}
                  rx="6"
                  fill="#0284C7"
                  fillOpacity="0.08"
                  stroke={isLight ? '#0284C7' : '#38BDF8'}
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  pointerEvents="none"
                />
              )}

              {/* Floating Quick Action Toolbar when selected */}
              {isSelected && (
                <g
                  transform={`translate(0, ${comp.y < 42 ? comp.height + 30 : -34})`}
                  className="cursor-default select-none pointer-events-auto"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <rect
                    x={comp.width / 2 - 65}
                    y="0"
                    width="130"
                    height="28"
                    rx="6"
                    fill={isLight ? '#FFFFFF' : '#0F172A'}
                    stroke={isLight ? '#CBD5E1' : '#334155'}
                    strokeWidth="1.2"
                    className="drop-shadow-xl"
                  />

                  {/* Tag badge in toolbar */}
                  <text
                    x={comp.width / 2 - 35}
                    y="18"
                    fill={isLight ? '#0F172A' : '#38BDF8'}
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {comp.params.tag}
                  </text>

                  {/* Delete button */}
                  <g
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteSelected) onDeleteSelected();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="cursor-pointer hover:opacity-85"
                  >
                    <rect
                      x={comp.width / 2}
                      y="4"
                      width="60"
                      height="20"
                      rx="4"
                      fill="#DC2626"
                    />
                    <text
                      x={comp.width / 2 + 30}
                      y="17.5"
                      fill="#FFFFFF"
                      fontSize="9.5"
                      fontFamily="Plus Jakarta Sans"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Supprimer
                    </text>
                  </g>
                </g>
              )}

              {/* RENDER SPECIFIC EQUIPMENT SYMBOLS */}

              {/* PUMP */}
              {comp.type === 'pump' && (
                <g>
                  <circle
                    cx={comp.width / 2}
                    cy={comp.height / 2}
                    r={comp.width / 2 - 4}
                    fill={isLight ? '#F1F5F9' : '#131F2E'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="3"
                  />
                  <path
                    d={`M ${comp.width / 2 + 15} ${comp.height / 2 - 24} L ${comp.width} ${comp.height / 2 - 24} L ${comp.width} ${comp.height / 2 - 12} L ${comp.width / 2 + 15} ${comp.height / 2 - 12} Z`}
                    fill={isLight ? '#94A3B8' : '#334155'}
                  />
                  <g
                    transform={`translate(${comp.width / 2}, ${comp.height / 2}) rotate(${
                      simState.isRunning && comp.params.pumpState !== 'stopped'
                        ? (animTick * 18) % 360
                        : 0
                    })`}
                  >
                    <path
                      d="M -16 0 C -8 -10, 8 -10, 16 0 C 8 10, -8 10, -16 0 Z"
                      fill="#0284C7"
                      stroke="#38BDF8"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 0 -16 C -10 -8, -10 8, 0 16 C 10 8, 10 -8, 0 -16 Z"
                      fill="#0284C7"
                      stroke="#38BDF8"
                      strokeWidth="1.5"
                    />
                    <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" />
                  </g>
                  <circle
                    cx={comp.width - 10}
                    cy="10"
                    r="5"
                    fill={
                      comp.live.status === 'trip'
                        ? '#EF4444'
                        : comp.live.status === 'warning'
                        ? '#F59E0B'
                        : '#10B981'
                    }
                  />
                  <text
                    x={comp.width / 2}
                    y={comp.height + 15}
                    fill={isLight ? '#0284C7' : '#38BDF8'}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {comp.live.outletPressure.toFixed(2)} bar
                  </text>
                </g>
              )}

              {/* CONTROL VALVE */}
              {comp.type === 'control_valve' && (
                <g>
                  <path
                    d={`M ${comp.width / 2 - 18} 14 C ${comp.width / 2 - 18} 2, ${comp.width / 2 + 18} 2, ${comp.width / 2 + 18} 14 Z`}
                    fill="#0F766E"
                    stroke="#14B8A6"
                    strokeWidth="2"
                  />
                  <line
                    x1={comp.width / 2}
                    y1="14"
                    x2={comp.width / 2}
                    y2={comp.height / 2}
                    stroke={isLight ? '#475569' : '#94A3B8'}
                    strokeWidth="3"
                  />
                  <polygon
                    points={`6,${comp.height / 2 - 16} ${comp.width / 2},${comp.height / 2} 6,${comp.height / 2 + 16}`}
                    fill={isLight ? '#F1F5F9' : '#1E293B'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  <polygon
                    points={`${comp.width - 6},${comp.height / 2 - 16} ${comp.width / 2},${comp.height / 2} ${comp.width - 6},${comp.height / 2 + 16}`}
                    fill={isLight ? '#F1F5F9' : '#1E293B'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  <rect
                    x={comp.width / 2 - 18}
                    y={comp.height / 2 + 18}
                    width="36"
                    height="16"
                    rx="3"
                    fill={isLight ? '#FFFFFF' : '#0B131D'}
                    stroke="#F59E0B"
                    strokeWidth="1.2"
                  />
                  <text
                    x={comp.width / 2}
                    y={comp.height / 2 + 30}
                    fill="#D97706"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {comp.params.valveOpeningPct?.toFixed(0)}%
                  </text>
                </g>
              )}

              {/* MANUAL / KNIFE GATE VALVE */}
              {comp.type === 'valve' && (
                <g>
                  <polygon
                    points={`6,${comp.height / 2 - 16} ${comp.width / 2},${comp.height / 2} 6,${comp.height / 2 + 16}`}
                    fill={isLight ? '#F1F5F9' : '#1E293B'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  <polygon
                    points={`${comp.width - 6},${comp.height / 2 - 16} ${comp.width / 2},${comp.height / 2} ${comp.width - 6},${comp.height / 2 + 16}`}
                    fill={isLight ? '#F1F5F9' : '#1E293B'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  <line
                    x1={comp.width / 2}
                    y1="12"
                    x2={comp.width / 2}
                    y2={comp.height / 2}
                    stroke={isLight ? '#475569' : '#CBD5E1'}
                    strokeWidth="3"
                  />
                  <line
                    x1={comp.width / 2 - 14}
                    y1="12"
                    x2={comp.width / 2 + 14}
                    y2="12"
                    stroke={isLight ? '#475569' : '#E2E8F0'}
                    strokeWidth="3"
                  />
                  <text
                    x={comp.width / 2}
                    y={comp.height + 12}
                    fill={isLight ? '#334155' : '#E2E8F0'}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                  >
                    {comp.params.valveOpeningPct}%
                  </text>
                </g>
              )}

              {/* TANK / SUMP */}
              {comp.type === 'tank' && (
                <g>
                  <rect
                    x="2"
                    y="6"
                    width={comp.width - 4}
                    height={comp.height - 12}
                    rx="8"
                    fill={isLight ? '#F8FAFC' : '#0F1723'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="3"
                  />
                  {(() => {
                    const lvl = comp.params.currentLevelPct ?? 65;
                    const fillHeight = ((comp.height - 16) * lvl) / 100;
                    const fluidConfig = getFluidColorConfig(circuit.fluid.type, isLight);
                    const fluidFill = isLight ? fluidConfig.fillLight : fluidConfig.fillDark;

                    return (
                      <g>
                        {/* Slurry fluid body: realistic, opaque earthy beige / sandy brown phosphate slurry */}
                        <rect
                          x="5"
                          y={comp.height - 8 - fillHeight}
                          width={comp.width - 10}
                          height={fillHeight}
                          rx="4"
                          fill={fluidFill}
                          fillOpacity={0.9}
                          className="transition-all duration-300"
                        />
                        {/* Distinct surface meniscus line highlight */}
                        <line
                          x1="5"
                          y1={comp.height - 8 - fillHeight}
                          x2={comp.width - 5}
                          y2={comp.height - 8 - fillHeight}
                          stroke={fluidConfig.border}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeOpacity={0.95}
                        />
                      </g>
                    );
                  })()}
                  <text
                    x={comp.width / 2}
                    y={comp.height / 2 + 4}
                    fill="#FFFFFF"
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth="0.5"
                    fontSize="11"
                    fontFamily="JetBrains Mono"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {comp.params.currentLevelPct?.toFixed(0)}%
                  </text>
                  <text
                    x={comp.width / 2}
                    y={comp.height / 2 + 17}
                    fill={isLight ? '#64748B' : '#94A3B8'}
                    fontSize="8.5"
                    textAnchor="middle"
                  >
                    Niveau
                  </text>
                </g>
              )}

              {/* HEAT EXCHANGER */}
              {comp.type === 'heat_exchanger' && (
                <g>
                  <circle
                    cx={comp.width / 2}
                    cy={comp.height / 2}
                    r={comp.width / 2 - 4}
                    fill={isLight ? '#F1F5F9' : '#1E293B'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="3"
                  />
                  <path
                    d={`M ${comp.width / 2 - 20} ${comp.height / 2 - 12} Q ${comp.width / 2} ${comp.height / 2 - 25}, ${comp.width / 2 + 20} ${comp.height / 2 - 12} T ${comp.width / 2 + 20} ${comp.height / 2 + 12}`}
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="2.5"
                  />
                  <text
                    x={comp.width / 2}
                    y={comp.height + 14}
                    fill="#EA580C"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {comp.live.temperature.toFixed(1)} °C
                  </text>
                </g>
              )}

              {/* HYDROCYCLONE */}
              {comp.type === 'hydrocyclone' && (
                <g>
                  <rect
                    x="12"
                    y="10"
                    width={comp.width - 24}
                    height="28"
                    rx="3"
                    fill={isLight ? '#F1F5F9' : '#1E293B'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  <polygon
                    points={`12,38 ${comp.width - 12},38 ${comp.width / 2 + 8},${comp.height - 12} ${comp.width / 2 - 8},${comp.height - 12}`}
                    fill={isLight ? '#F1F5F9' : '#1E293B'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  <rect
                    x={comp.width / 2 - 7}
                    y={comp.height - 12}
                    width="14"
                    height="12"
                    fill={isLight ? '#94A3B8' : '#334155'}
                  />
                  <rect
                    x={comp.width / 2 - 6}
                    y="0"
                    width="12"
                    height="12"
                    fill={isLight ? '#94A3B8' : '#334155'}
                  />
                  <text
                    x={comp.width / 2}
                    y={comp.height / 2 - 4}
                    fill={isLight ? '#0284C7' : '#38BDF8'}
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    CYCLONE
                  </text>
                </g>
              )}

              {/* DÉCANTEUR CCD / THICKENER */}
              {(comp.type === 'decanteur_ccd' || comp.type === 'decanteur') && (
                <g>
                  <polygon
                    points={`4,20 ${comp.width - 4},20 ${comp.width - 4},50 ${comp.width / 2 + 10},${comp.height - 10} ${comp.width / 2 - 10},${comp.height - 10} 4,50`}
                    fill={isLight ? '#F8FAFC' : '#131D2A'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  {/* Dense settled phosphate slurry bed in thickener underflow cone */}
                  {(() => {
                    const fluidConfig = getFluidColorConfig(circuit.fluid.type, isLight);
                    return (
                      <polygon
                        points={`14,40 ${comp.width - 14},40 ${comp.width / 2 + 9},${comp.height - 10} ${comp.width / 2 - 9},${comp.height - 10}`}
                        fill={isLight ? fluidConfig.fillLight : fluidConfig.fillDark}
                        fillOpacity={0.88}
                      />
                    );
                  })()}
                  <line
                    x1="0"
                    y1="18"
                    x2={comp.width}
                    y2="18"
                    stroke={isLight ? '#64748B' : '#94A3B8'}
                    strokeWidth="3"
                  />
                  <line
                    x1={comp.width / 2}
                    y1="18"
                    x2={comp.width / 2}
                    y2={comp.height - 20}
                    stroke={isLight ? '#475569' : '#64748B'}
                    strokeWidth="2"
                  />
                  <line
                    x1={comp.width / 2 - 32}
                    y1={comp.height - 24}
                    x2={comp.width / 2 + 32}
                    y2={comp.height - 24}
                    stroke="#F59E0B"
                    strokeWidth="2"
                  />
                  <text
                    x={comp.width / 2}
                    y="38"
                    fill="#10B981"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {comp.type === 'decanteur_ccd' ? 'DEC-CCD' : 'DÉCANTEUR'}
                  </text>
                </g>
              )}

              {/* CRIBLE VIBRANT */}
              {comp.type === 'crible' && (
                <g>
                  <rect
                    x="6"
                    y="14"
                    width={comp.width - 12}
                    height={comp.height - 28}
                    rx="4"
                    fill={isLight ? '#F1F5F9' : '#1E293B'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  {/* Vibrating decks */}
                  <line x1="12" y1="26" x2={comp.width - 12} y2="26" stroke="#0284C7" strokeWidth="2" strokeDasharray="3,3" />
                  <line x1="12" y1="38" x2={comp.width - 12} y2="38" stroke="#10B981" strokeWidth="2" strokeDasharray="3,3" />
                  <text
                    x={comp.width / 2}
                    y={comp.height / 2 + 15}
                    fill={isLight ? '#0F172A' : '#E2E8F0'}
                    fontSize="8.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    CRIBLE
                  </text>
                </g>
              )}

              {/* FLOTTATION */}
              {comp.type === 'flottation' && (
                <g>
                  <rect
                    x="6"
                    y="10"
                    width={comp.width - 12}
                    height={comp.height - 20}
                    rx="4"
                    fill={isLight ? '#F1F5F9' : '#132338'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  {/* Rotor and air bubbles */}
                  <circle cx={comp.width / 2} cy={comp.height - 22} r="8" fill="#0284C7" />
                  <circle cx={comp.width / 2 - 10} cy={comp.height / 2 - 5} r="3" fill="#67E8F9" opacity="0.8" />
                  <circle cx={comp.width / 2 + 8} cy={comp.height / 2 - 8} r="4" fill="#67E8F9" opacity="0.8" />
                  <text
                    x={comp.width / 2}
                    y="22"
                    fill="#10B981"
                    fontSize="8.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    FLOTTATION
                  </text>
                </g>
              )}

              {/* FILTER */}
              {comp.type === 'filter' && (
                <g>
                  <rect
                    x="10"
                    y="10"
                    width={comp.width - 20}
                    height={comp.height - 20}
                    rx="4"
                    fill={isLight ? '#F1F5F9' : '#1E293B'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  <line x1="10" y1="10" x2={comp.width - 10} y2={comp.height - 10} stroke="#F59E0B" strokeWidth="2" strokeDasharray="3,3" />
                  <text
                    x={comp.width / 2}
                    y={comp.height / 2 + 4}
                    fill={isLight ? '#0F172A' : '#E2E8F0'}
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    FILTRE
                  </text>
                </g>
              )}

              {/* SOURCE / DESTINATION / DRAIN */}
              {(comp.type === 'source' || comp.type === 'destination' || comp.type === 'drain') && (
                <g>
                  <polygon
                    points={
                      comp.type === 'source'
                        ? `8,8 ${comp.width - 8},${comp.height / 2} 8,${comp.height - 8}`
                        : comp.type === 'drain'
                        ? `8,8 ${comp.width - 8},8 ${comp.width / 2},${comp.height - 8}`
                        : `8,${comp.height / 2} ${comp.width - 8},8 ${comp.width - 8},${comp.height - 8}`
                    }
                    fill={isLight ? '#F1F5F9' : '#1E293B'}
                    stroke={isSelected ? '#0284C7' : isLight ? '#475569' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  <text
                    x={comp.width / 2}
                    y={comp.height / 2 + 3}
                    fill={isLight ? '#0F172A' : '#38BDF8'}
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {comp.type.toUpperCase()}
                  </text>
                </g>
              )}

              {/* INSTRUMENT BUBBLES (FT, PT, TT, LT, FI, PI, TI, LI) */}
              {['FT', 'PT', 'TT', 'LT', 'FI', 'PI', 'TI', 'LI'].includes(comp.type) && (
                <g>
                  <circle
                    cx={comp.width / 2}
                    cy={comp.height / 2}
                    r={comp.width / 2 - 3}
                    fill={isLight ? '#FFFFFF' : '#0B131D'}
                    stroke={isSelected ? '#0284C7' : comp.live.status === 'alarm' ? '#EF4444' : '#06B6D4'}
                    strokeWidth="2.5"
                    className="drop-shadow-md"
                  />
                  <line
                    x1="6"
                    y1={comp.height / 2}
                    x2={comp.width - 6}
                    y2={comp.height / 2}
                    stroke={comp.live.status === 'alarm' ? '#EF4444' : '#06B6D4'}
                    strokeWidth="1.5"
                  />
                  <text
                    x={comp.width / 2}
                    y={comp.height / 2 - 5}
                    fill={isLight ? '#0F172A' : '#FFFFFF'}
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="Plus Jakarta Sans"
                    textAnchor="middle"
                  >
                    {comp.params.tag}
                  </text>
                  <text
                    x={comp.width / 2}
                    y={comp.height / 2 + 13}
                    fill={comp.live.status === 'alarm' ? '#EF4444' : '#0891B2'}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {comp.params.measuredValue !== undefined ? comp.params.measuredValue.toFixed(1) : '--'}
                  </text>
                </g>
              )}

              {/* CONTROLLERS (FC, PC, LC, TC) */}
              {['FC', 'PC', 'LC', 'TC'].includes(comp.type) && (
                <g>
                  <rect
                    x="2"
                    y="2"
                    width={comp.width - 4}
                    height={comp.height - 4}
                    rx="4"
                    fill={isLight ? '#FFFFFF' : '#0F1722'}
                    stroke={isSelected ? '#0284C7' : '#10B981'}
                    strokeWidth="2.5"
                  />
                  <circle
                    cx={comp.width / 2}
                    cy={comp.height / 2}
                    r={comp.width / 2 - 8}
                    fill={isLight ? '#F8FAFC' : '#0A1017'}
                    stroke="#10B981"
                    strokeWidth="1.2"
                  />
                  <text
                    x={comp.width / 2}
                    y={comp.height / 2 - 5}
                    fill={isLight ? '#0F172A' : '#FFFFFF'}
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="Plus Jakarta Sans"
                    textAnchor="middle"
                  >
                    {comp.params.tag}
                  </text>
                  <text
                    x={comp.width / 2}
                    y={comp.height / 2 + 12}
                    fill="#10B981"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {comp.params.controllerMode?.toUpperCase()}: {comp.params.controllerOutputPct?.toFixed(0)}%
                  </text>
                </g>
              )}

              {/* Tag Label banner below equipment */}
              {!['FT', 'PT', 'TT', 'LT', 'FC', 'PC', 'LC', 'TC'].includes(comp.type) && (
                <g transform={`translate(${comp.width / 2}, ${comp.height + 6})`}>
                  <rect
                    x="-34"
                    y="-2"
                    width="68"
                    height="16"
                    rx="3"
                    fill={isLight ? '#FFFFFF' : '#0B1118'}
                    stroke={isLight ? '#CBD5E1' : '#334155'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="10"
                    fill={isLight ? '#0F172A' : '#CBD5E1'}
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {comp.params.tag}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
