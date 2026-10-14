/**
 * @license
 * Process Flow & Instrument Simulator
 * 2D Hydrodynamic Cutaway Inspector & Valve Simulation
 * Inspired directly by OCP "TECHNIK MEKANIK - Simulateur Vannes et Accessoires"
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, AlertTriangle, CheckCircle, Info, BookOpen } from 'lucide-react';
import { INDUSTRIAL_VALVES_DATABASE, OCP_LESSONS_LEARNED } from '../constants/accessoriesData';
import { calculateValveCharacteristics, calculateReynolds, calculateValvePressureDrop, calculateCavitationIndex } from '../simulation/hydraulicEquations';
import { ValveSubType } from '../types/process';

interface ValveCutawayInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValveType?: ValveSubType;
  initialOpeningPct?: number;
  initialFlowRate?: number;
  initialDiameterMm?: number;
  onApplyToCircuit?: (valveType: ValveSubType, openingPct: number) => void;
}

export const ValveCutawayInspectorModal: React.FC<ValveCutawayInspectorModalProps> = ({
  isOpen,
  onClose,
  initialValveType = 'butterfly_rubber',
  initialOpeningPct = 45,
  initialFlowRate = 120,
  initialDiameterMm = 200,
  onApplyToCircuit,
}) => {
  const [selectedValveType, setSelectedValveType] = useState<ValveSubType>(initialValveType);
  const [openingPct, setOpeningPct] = useState<number>(initialOpeningPct);
  const [flowRateM3h, setFlowRateM3h] = useState<number>(initialFlowRate);
  const [diameterMm, setDiameterMm] = useState<number>(initialDiameterMm);
  const [pulpDensity, setPulpDensity] = useState<number>(1320);
  const [pulpViscosityCp, setPulpViscosityCp] = useState<number>(18);
  const [solidsPct, setSolidsPct] = useState<number>(35);
  const [upstreamPressureBar, setUpstreamPressureBar] = useState<number>(5.5);
  const [activeTab, setActiveTab] = useState<'vannes' | 'coudes' | 'pompes' | 'cyclones'>('vannes');
  const [activeChart, setActiveChart] = useState<'q_vs_open' | 'k_vs_open' | 'dp_vs_q'>('q_vs_open');
  const [isAnimating, setIsAnimating] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync with initial props when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedValveType(initialValveType);
      setOpeningPct(initialOpeningPct);
      setFlowRateM3h(initialFlowRate);
      setDiameterMm(initialDiameterMm);
    }
  }, [isOpen, initialValveType, initialOpeningPct, initialFlowRate, initialDiameterMm]);

  const valveSpec = INDUSTRIAL_VALVES_DATABASE[selectedValveType] || INDUSTRIAL_VALVES_DATABASE.butterfly_rubber;

  // Real-time calculations
  const fluidProps = {
    type: 'phosphate_slurry' as const,
    name: 'Pulpe',
    density: pulpDensity,
    viscosity: pulpViscosityCp / 1000,
    solidsPercentage: solidsPct,
    solidsDensity: 2750,
    d50: 125,
    temperature: 25,
    vaporPressure: 0.035,
    yieldStress: 3.5,
    isCompressible: false,
  };

  const chars = calculateValveCharacteristics(selectedValveType, openingPct, diameterMm);
  const pipeArea = (Math.PI * Math.pow(diameterMm / 1000, 2)) / 4;
  const pipeVelocity = (flowRateM3h / 3600) / pipeArea;
  const localJetVelocity = chars.flowAreaM2 > 0 ? (flowRateM3h / 3600) / chars.flowAreaM2 : 0;
  const reynolds = calculateReynolds(fluidProps, pipeVelocity, diameterMm);
  const deltaP = calculateValvePressureDrop(flowRateM3h, chars.effectiveCv, fluidProps);
  const downstreamPressureBar = Math.max(0.1, upstreamPressureBar - deltaP);
  const cav = calculateCavitationIndex(upstreamPressureBar, downstreamPressureBar, fluidProps.vaporPressure);

  // Erosion risk estimate (proportional to velocity^2.5 * solids concentration)
  const erosionIndex = Math.min(100, Math.round((Math.pow(localJetVelocity, 2.2) * (solidsPct / 35) * 4)));
  const erosionRisk = erosionIndex > 65 ? 'Élevé (Usure rapide)' : erosionIndex > 35 ? 'Moyen' : 'Faible';

  // 2D Canvas Fluid Particle & Velocity Field Animation
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = canvas.width;
    const height = canvas.height;

    // Particle system
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
    }

    const particles: Particle[] = [];
    const numParticles = 80;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: height / 2 + (Math.random() - 0.5) * (height * 0.5),
        vx: 2 + Math.random() * 2,
        vy: (Math.random() - 0.5) * 0.5,
        size: 1.5 + Math.random() * 2,
        color: '#38BDF8',
        life: Math.random() * 100,
      });
    }

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Background pipe walls
      const pipeTop = height * 0.22;
      const pipeBottom = height * 0.78;
      const pipeHeight = pipeBottom - pipeTop;
      const centerX = width * 0.5;

      // Pipe interior fill (dark blue-gray water/slurry chamber)
      ctx.fillStyle = '#0F1A24';
      ctx.fillRect(0, pipeTop, width, pipeHeight);

      // Pipe steel walls
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, pipeTop - 14, width, 14);
      ctx.fillRect(0, pipeBottom, width, 14);

      // Rubber lining strip (greenish/black elastomer liner)
      ctx.fillStyle = '#065F46';
      ctx.fillRect(0, pipeTop - 3, width, 3);
      ctx.fillRect(0, pipeBottom, width, 3);

      // Flanges at center
      ctx.fillStyle = '#475569';
      ctx.fillRect(centerX - 42, pipeTop - 24, 84, 24);
      ctx.fillRect(centerX - 42, pipeBottom, 84, 24);

      // Bolts on flanges
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(centerX - 32, pipeTop - 20, 6, 8);
      ctx.fillRect(centerX + 26, pipeTop - 20, 6, 8);
      ctx.fillRect(centerX - 32, pipeBottom + 12, 6, 8);
      ctx.fillRect(centerX + 26, pipeBottom + 12, 6, 8);

      // Velocity contour field overlay
      // Upstream (uniform blue) -> Valve throttle (yellow/red jet) -> Downstream turbulence vortex
      const velGradient = ctx.createLinearGradient(centerX - 80, 0, centerX + 120, 0);
      const jetIntensity = Math.min(1.0, localJetVelocity / 6.0);
      velGradient.addColorStop(0, 'rgba(14, 165, 233, 0.15)');
      velGradient.addColorStop(0.35, `rgba(234, 179, 8, ${0.25 * jetIntensity})`);
      velGradient.addColorStop(0.5, `rgba(239, 68, 68, ${0.45 * jetIntensity})`);
      velGradient.addColorStop(0.75, `rgba(234, 88, 12, ${0.2 * jetIntensity})`);
      velGradient.addColorStop(1, 'rgba(14, 165, 233, 0.15)');

      ctx.fillStyle = velGradient;
      ctx.fillRect(0, pipeTop, width, pipeHeight);

      // Valve mechanical element (disc or blade)
      ctx.save();
      ctx.translate(centerX, height / 2);

      if (selectedValveType === 'butterfly_rubber') {
        // Butterfly disc rotated by opening angle
        // 0% = 90 deg (closed across pipe), 100% = 0 deg (parallel to flow)
        const discAngleRad = ((100 - openingPct) / 100) * (Math.PI / 2);
        ctx.rotate(discAngleRad);

        // Shaft
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(-4, -pipeHeight / 2 - 15, 8, pipeHeight + 30);

        // Elliptical disc
        ctx.fillStyle = '#EAB308';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, pipeHeight / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (selectedValveType === 'knife_gate_slurry' || selectedValveType === 'push_through_kgv') {
        // Knife gate blade descending from top
        const bladeTravel = (1 - openingPct / 100) * (pipeHeight - 6);
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(-6, -pipeHeight / 2 - 20, 12, bladeTravel + 20);
        // Beveled knife edge
        ctx.beginPath();
        ctx.moveTo(-6, -pipeHeight / 2 + bladeTravel);
        ctx.lineTo(0, -pipeHeight / 2 + bladeTravel + 8);
        ctx.lineTo(6, -pipeHeight / 2 + bladeTravel);
        ctx.fillStyle = '#CBD5E1';
        ctx.fill();
      } else if (selectedValveType === 'pinch') {
        // Pinch sleeve compressing from top and bottom
        const pinchDist = (1 - openingPct / 100) * (pipeHeight * 0.42);
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.moveTo(-40, -pipeHeight / 2);
        ctx.quadraticCurveTo(0, -pipeHeight / 2 + pinchDist, 40, -pipeHeight / 2);
        ctx.lineTo(40, pipeHeight / 2);
        ctx.quadraticCurveTo(0, pipeHeight / 2 - pinchDist, -40, pipeHeight / 2);
        ctx.closePath();
        ctx.fillStyle = '#064E3B';
        ctx.fill();
      } else {
        // Generic plug / dart / ball
        const seatTravel = (1 - openingPct / 100) * (pipeHeight * 0.45);
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(0, -pipeHeight / 2 + seatTravel, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Recirculation vortex behind valve if high throttling
      if (openingPct < 60 && flowRateM3h > 20) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const vortexX = centerX + 45;
        const vortexY = height / 2 + (openingPct < 40 ? 25 : -25);
        ctx.arc(vortexX, vortexY, 14, (frame * 0.08) % (Math.PI * 2), ((frame * 0.08) % (Math.PI * 2)) + Math.PI * 1.5);
        ctx.stroke();
      }

      // Draw and update animated particles
      if (isAnimating) {
        const speedMultiplier = Math.max(0.2, (flowRateM3h / 120) * 2.2);

        particles.forEach((p) => {
          // Accelerate particle in the throttle constriction
          const distToValve = p.x - centerX;
          let currentSpeed = p.vx * speedMultiplier;

          if (Math.abs(distToValve) < 40 && openingPct < 90) {
            currentSpeed *= Math.max(1.2, localJetVelocity / Math.max(0.5, pipeVelocity));
          }

          p.x += currentSpeed;

          // Re-spawn on left when exiting canvas
          if (p.x > width) {
            p.x = 0;
            p.y = pipeTop + 6 + Math.random() * (pipeHeight - 12);
          }

          // Avoid mechanical obstacle
          if (Math.abs(p.x - centerX) < 14) {
            if (openingPct < 20) {
              p.x = 0; // blocked
            } else {
              p.y += (Math.random() - 0.5) * 4;
            }
          }

          // Particle color based on local speed
          const isFast = currentSpeed > 5.5;
          ctx.fillStyle = isFast ? '#EF4444' : currentSpeed > 3.5 ? '#F59E0B' : '#38BDF8';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Flow direction arrows
      ctx.fillStyle = '#64748B';
      for (let ax = 40; ax < width - 40; ax += 120) {
        ctx.beginPath();
        ctx.moveTo(ax, pipeTop + 14);
        ctx.lineTo(ax + 8, pipeTop + 18);
        ctx.lineTo(ax, pipeTop + 22);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, selectedValveType, openingPct, flowRateM3h, diameterMm, isAnimating, localJetVelocity, pipeVelocity]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0B1118] border border-slate-700/80 rounded-xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-['Plus_Jakarta_Sans']">
        {/* Top Header bar with OCP Styling */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#070D14]">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2.5 py-1 rounded">
              OCP TECHNIK MEKANIK
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              Simulateur Hydrodynamique Vannes et Accessoires
            </h2>
            <span className="text-xs text-slate-400">· Étude d'Écoulement & Pertes Singulières</span>
          </div>

          <div className="flex items-center gap-3">
            {onApplyToCircuit && (
              <button
                onClick={() => {
                  onApplyToCircuit(selectedValveType, openingPct);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition shadow-sm"
              >
                Appliquer au Circuit
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-slate-800/80 bg-[#0E1520] text-xs">
          <button
            onClick={() => setActiveTab('vannes')}
            className={`px-3 py-1.5 font-medium rounded transition ${
              activeTab === 'vannes' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vannes & Robinets
          </button>
          <button
            onClick={() => setActiveTab('coudes')}
            className={`px-3 py-1.5 font-medium rounded transition ${
              activeTab === 'coudes' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Coudes / Tés / Accessoires
          </button>
          <button
            onClick={() => setActiveTab('pompes')}
            className={`px-3 py-1.5 font-medium rounded transition ${
              activeTab === 'pompes' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pompes Slurry
          </button>
          <button
            onClick={() => setActiveTab('cyclones')}
            className={`px-3 py-1.5 font-medium rounded transition ${
              activeTab === 'cyclones' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hydrocyclones OCP
          </button>
        </div>

        {/* Main Body Grid */}
        <div className="flex-1 grid grid-cols-12 gap-0 overflow-y-auto">
          {/* Left Column: Valve Selector & Specs (Col 3) */}
          <div className="col-span-3 border-r border-slate-800 p-4 bg-[#0A1017] flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Type de vanne / Robinet
              </label>
              <select
                value={selectedValveType}
                onChange={(e) => setSelectedValveType(e.target.value as ValveSubType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {Object.values(INDUSTRIAL_VALVES_DATABASE).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nameFr}
                  </option>
                ))}
              </select>
            </div>

            {/* Valve Quick Summary Card */}
            <div className="bg-[#111A24] border border-slate-800 rounded-lg p-3 text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Compatibilité Slurry :</span>
                <span className="font-semibold text-emerald-400">{valveSpec.slurryCompatibility}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Régulation continue :</span>
                <span className={valveSpec.regulationRecommended ? 'text-emerald-400' : 'text-amber-400'}>
                  {valveSpec.regulationRecommended ? 'Recommandée' : 'Déconseillée (ON/OFF)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Flushing automatique :</span>
                <span className={valveSpec.flushingRequired ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                  {valveSpec.flushingRequired ? 'Requis (LL136)' : 'Optionnel'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">K à 100% ouverture :</span>
                <span className="font-mono text-cyan-300">{valveSpec.typicalK}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Plage DN nominale :</span>
                <span className="text-slate-300">{valveSpec.typicalDnRange}</span>
              </div>
            </div>

            {/* OCP Lessons Learned Highlight */}
            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Recommandation OCP Usine</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{valveSpec.ocpRecommendation}</p>
            </div>

            {/* Quick Presets for Valve Types */}
            <div className="mt-auto">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Vannes les plus courantes à OCP
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  onClick={() => setSelectedValveType('knife_gate_slurry')}
                  className={`p-1.5 rounded border text-left truncate transition ${
                    selectedValveType === 'knife_gate_slurry'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Guillotine Slurry
                </button>
                <button
                  onClick={() => setSelectedValveType('slurry_control')}
                  className={`p-1.5 rounded border text-left truncate transition ${
                    selectedValveType === 'slurry_control'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Vanne Régulation
                </button>
                <button
                  onClick={() => setSelectedValveType('pinch')}
                  className={`p-1.5 rounded border text-left truncate transition ${
                    selectedValveType === 'pinch'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Pinch Valve
                </button>
                <button
                  onClick={() => setSelectedValveType('butterfly_rubber')}
                  className={`p-1.5 rounded border text-left truncate transition ${
                    selectedValveType === 'butterfly_rubber'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Papillon Caoutchouc
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column: 2D Simulation Canvas & Animation Controls (Col 5) */}
          <div className="col-span-5 p-4 flex flex-col gap-3 bg-[#0B121C]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Visualisation 2D d'Écoulement & Turbulences
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAnimating(!isAnimating)}
                  className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1"
                >
                  {isAnimating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isAnimating ? 'Pause' : 'Animer'}</span>
                </button>
              </div>
            </div>

            {/* 2D Cutaway Canvas */}
            <div className="relative border border-slate-800 rounded-lg overflow-hidden bg-slate-950 shadow-inner">
              <canvas
                ref={canvasRef}
                width={480}
                height={260}
                className="w-full h-[240px] block"
              />

              {/* In-canvas HUD markers */}
              <div className="absolute top-2 left-3 text-[11px] font-mono text-cyan-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                Écoulement de pulpe →
              </div>

              <div className="absolute bottom-2 left-3 text-[11px] font-mono text-amber-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                Ouverture : {openingPct}% ({((openingPct / 100) * 90).toFixed(0)}°)
              </div>

              {/* Velocity Colorbar Indicator (from user reference image) */}
              <div className="absolute top-2 right-2 bg-slate-900/85 border border-slate-700 p-1.5 rounded flex flex-col items-center text-[9px] font-mono">
                <span className="text-slate-400 mb-0.5">Vitesse (m/s)</span>
                <div className="w-3 h-20 rounded bg-gradient-to-t from-sky-500 via-amber-400 to-red-500 mb-0.5"></div>
                <div className="flex flex-col text-[8px] leading-tight text-slate-300 items-end">
                  <span>8.0</span>
                  <span className="my-auto">4.0</span>
                  <span>0</span>
                </div>
              </div>
            </div>

            {/* Sliders & Input Parameters */}
            <div className="bg-[#101823] border border-slate-800 rounded-lg p-3 grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Ouverture vanne (%) :</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{openingPct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={openingPct}
                  onChange={(e) => setOpeningPct(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Débit Q (m³/h) :</label>
                <input
                  type="number"
                  value={flowRateM3h}
                  onChange={(e) => setFlowRateM3h(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Diamètre DN (mm) :</label>
                <input
                  type="number"
                  value={diameterMm}
                  onChange={(e) => setDiameterMm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Densité pulpe (kg/m³) :</label>
                <input
                  type="number"
                  value={pulpDensity}
                  onChange={(e) => setPulpDensity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">% Solides massique :</label>
                <input
                  type="number"
                  value={solidsPct}
                  onChange={(e) => setSolidsPct(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Real-time Results & Characteristic Graphs (Col 4) */}
          <div className="col-span-4 border-l border-slate-800 p-4 bg-[#0A1017] flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Résultats de Calcul en Temps Réel
            </span>

            {/* Results Grid Table */}
            <div className="bg-[#101823] border border-slate-800 rounded-lg overflow-hidden text-xs">
              <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Aire de passage libre</span>
                <span className="font-mono text-white">{chars.flowAreaM2} m²</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Vitesse moyenne amont</span>
                <span className="font-mono text-cyan-300">{pipeVelocity.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Vitesse locale au col (jet)</span>
                <span className="font-mono font-bold text-amber-300">{localJetVelocity.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Nombre de Reynolds (Re)</span>
                <span className="font-mono text-white">{reynolds.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Coefficient singulier K</span>
                <span className="font-mono text-amber-400 font-semibold">{chars.kCoefficient}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Perte de charge ΔP</span>
                <span className="font-mono text-red-400 font-bold">{deltaP.toFixed(2)} bar</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800/80">
                <span className="text-slate-400">Coefficient Cv effectif</span>
                <span className="font-mono text-emerald-400">{chars.effectiveCv} gpm/√psi</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-slate-400">Risque de cavitation</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    cav.isCavitation ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {cav.isCavitation ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Oui (σ = {cav.sigma})</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Non (σ = {cav.sigma})</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Characteristic Curves Section */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Courbe Caractéristique
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveChart('q_vs_open')}
                    className={`px-2 py-0.5 text-[10px] rounded transition ${
                      activeChart === 'q_vs_open' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Q vs Ouv.
                  </button>
                  <button
                    onClick={() => setActiveChart('k_vs_open')}
                    className={`px-2 py-0.5 text-[10px] rounded transition ${
                      activeChart === 'k_vs_open' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    K vs Ouv.
                  </button>
                  <button
                    onClick={() => setActiveChart('dp_vs_q')}
                    className={`px-2 py-0.5 text-[10px] rounded transition ${
                      activeChart === 'dp_vs_q' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ΔP vs Q
                  </button>
                </div>
              </div>

              {/* SVG Characteristic Graph */}
              <div className="h-40 bg-[#101823] border border-slate-800 rounded-lg p-2.5 relative flex items-center justify-center">
                <svg viewBox="0 0 300 130" className="w-full h-full overflow-visible">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="280" y2="20" stroke="#1E293B" strokeDasharray="3 3" />
                  <line x1="40" y1="60" x2="280" y2="60" stroke="#1E293B" strokeDasharray="3 3" />
                  <line x1="40" y1="100" x2="280" y2="100" stroke="#334155" />
                  <line x1="40" y1="20" x2="40" y2="100" stroke="#334155" />

                  {/* Axis labels */}
                  <text x="35" y="24" fill="#94A3B8" fontSize="9" textAnchor="end">
                    {activeChart === 'q_vs_open' ? '250' : activeChart === 'k_vs_open' ? '100' : '8.0'}
                  </text>
                  <text x="35" y="104" fill="#94A3B8" fontSize="9" textAnchor="end">0</text>
                  <text x="40" y="116" fill="#94A3B8" fontSize="9">0%</text>
                  <text x="280" y="116" fill="#94A3B8" fontSize="9" textAnchor="end">
                    {activeChart === 'dp_vs_q' ? '300 m³/h' : '100%'}
                  </text>

                  {/* Curve path */}
                  {activeChart === 'q_vs_open' && (
                    <>
                      <path
                        d="M 40,100 Q 160,90 280,30"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                      />
                      {/* Current operating point marker */}
                      <circle
                        cx={40 + (openingPct / 100) * 240}
                        cy={100 - (Math.pow(openingPct / 100, 1.3) * 70)}
                        r="4.5"
                        fill="#EF4444"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    </>
                  )}

                  {activeChart === 'k_vs_open' && (
                    <>
                      <path
                        d="M 40,25 Q 70,85 280,95"
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx={40 + (openingPct / 100) * 240}
                        cy={Math.min(95, Math.max(25, 25 + (1 - openingPct / 100) * 70))}
                        r="4.5"
                        fill="#38BDF8"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    </>
                  )}

                  {activeChart === 'dp_vs_q' && (
                    <>
                      <path
                        d="M 40,100 Q 180,92 280,28"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx={40 + (Math.min(250, flowRateM3h) / 250) * 240}
                        cy={Math.max(25, 100 - (deltaP / 6) * 75)}
                        r="4.5"
                        fill="#EF4444"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    </>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
