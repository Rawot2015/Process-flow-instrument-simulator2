/**
 * @license
 * Process Flow & Instrument Simulator
 * Component Palette (Draggable / Addable Industrial Equipment, Instruments & Controllers)
 */

import React, { useState } from 'react';
import {
  ComponentCategory,
  ComponentType,
  ProcessComponent,
} from '../types/process';
import {
  Layers,
  Search,
  Plus,
  Cpu,
  Activity,
  Droplets,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (comp: ProcessComponent) => void;
  onOpenValveInspector: () => void;
  themeMode?: 'dark' | 'light';
}

interface PaletteItem {
  type: ComponentType;
  category: ComponentCategory;
  name: string;
  tagPrefix: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  iconLetter: string;
  badgeColor: string;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onAddComponent,
  onOpenValveInspector,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    process: true,
    instrumentation: true,
    control: true,
  });

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const PALETTE_ITEMS: PaletteItem[] = [
    // PROCESS EQUIPMENT
    {
      type: 'source',
      category: 'process',
      name: 'Source de Pulpe',
      tagPrefix: 'SRC',
      description: 'Point d\'alimentation amont ou extraction',
      defaultWidth: 70,
      defaultHeight: 70,
      iconLetter: 'SRC',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'tank',
      category: 'process',
      name: 'Bac / Réservoir',
      tagPrefix: 'TK',
      description: 'Bâche de reprise ou réservoir atmosphérique',
      defaultWidth: 70,
      defaultHeight: 90,
      iconLetter: 'TK',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'pump',
      category: 'process',
      name: 'Pompe Centrifuge',
      tagPrefix: 'P',
      description: 'Pompe à pulpe centrifuge slurry haute pression',
      defaultWidth: 80,
      defaultHeight: 80,
      iconLetter: 'P',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'valve',
      category: 'process',
      name: 'Vanne d\'Isolation',
      tagPrefix: 'XV',
      description: 'Vanne guillotine slurry ou papillon manuelle',
      defaultWidth: 80,
      defaultHeight: 80,
      iconLetter: 'V',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'control_valve',
      category: 'process',
      name: 'Vanne de Contrôle',
      tagPrefix: 'FV',
      description: 'Vanne de régulation modulante avec servomoteur',
      defaultWidth: 80,
      defaultHeight: 80,
      iconLetter: 'CV',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'heat_exchanger',
      category: 'process',
      name: 'Échangeur de Chaleur',
      tagPrefix: 'E',
      description: 'Échangeur thermique tubulaire ou plaques',
      defaultWidth: 80,
      defaultHeight: 80,
      iconLetter: 'E',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'filter',
      category: 'process',
      name: 'Filtre Presse / Bande',
      tagPrefix: 'FLT',
      description: 'Filtration mécanique solide/liquide',
      defaultWidth: 85,
      defaultHeight: 80,
      iconLetter: 'F',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'hydrocyclone',
      category: 'process',
      name: 'Hydrocyclone OCP',
      tagPrefix: 'HC',
      description: 'Séparateur cyclone classification d50',
      defaultWidth: 85,
      defaultHeight: 110,
      iconLetter: 'HC',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'decanteur',
      category: 'process',
      name: 'Décanteur / Épaississeur',
      tagPrefix: 'DEC',
      description: 'Clarificateur et épaississeur de boue',
      defaultWidth: 95,
      defaultHeight: 105,
      iconLetter: 'DEC',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'crible',
      category: 'process',
      name: 'Crible Vibrant',
      tagPrefix: 'CRB',
      description: 'Crible de classification et égouttage',
      defaultWidth: 90,
      defaultHeight: 85,
      iconLetter: 'CRB',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'flottation',
      category: 'process',
      name: 'Cellule de Flottation',
      tagPrefix: 'FLOT',
      description: 'Cellule de flottation phosphate avec dart valve',
      defaultWidth: 90,
      defaultHeight: 100,
      iconLetter: 'FLT',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'decanteur_ccd',
      category: 'process',
      name: 'Décanteur CCD',
      tagPrefix: 'CCD',
      description: 'Décanteur à contre-courant haute densité',
      defaultWidth: 95,
      defaultHeight: 110,
      iconLetter: 'CCD',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'drain',
      category: 'process',
      name: 'Purge / Vidange',
      tagPrefix: 'DRN',
      description: 'Point de vidange ou purge de curage',
      defaultWidth: 60,
      defaultHeight: 60,
      iconLetter: 'DRN',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },
    {
      type: 'destination',
      category: 'process',
      name: 'Destination Procédé',
      tagPrefix: 'DST',
      description: 'Décharge vers bassin ou procédé aval',
      defaultWidth: 70,
      defaultHeight: 70,
      iconLetter: 'DST',
      badgeColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    },

    // INSTRUMENTATION
    {
      type: 'FT',
      category: 'instrumentation',
      name: 'FT — Transmetteur Débit',
      tagPrefix: 'FT',
      description: 'Débitmètre électromagnétique slurry',
      defaultWidth: 60,
      defaultHeight: 60,
      iconLetter: 'FT',
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    },
    {
      type: 'PT',
      category: 'instrumentation',
      name: 'PT — Transmetteur Pression',
      tagPrefix: 'PT',
      description: 'Capteur de pression piézorésistif',
      defaultWidth: 60,
      defaultHeight: 60,
      iconLetter: 'PT',
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    },
    {
      type: 'TT',
      category: 'instrumentation',
      name: 'TT — Transmetteur Température',
      tagPrefix: 'TT',
      description: 'Sonde Pt100 ou thermocouple',
      defaultWidth: 60,
      defaultHeight: 60,
      iconLetter: 'TT',
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    },
    {
      type: 'LT',
      category: 'instrumentation',
      name: 'LT — Transmetteur Niveau',
      tagPrefix: 'LT',
      description: 'Capteur radar ou pression hydrostatique',
      defaultWidth: 60,
      defaultHeight: 60,
      iconLetter: 'LT',
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    },
    {
      type: 'FI',
      category: 'instrumentation',
      name: 'FI — Indicateur de Débit',
      tagPrefix: 'FI',
      description: 'Manomètre ou afficheur local',
      defaultWidth: 60,
      defaultHeight: 60,
      iconLetter: 'FI',
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    },
    {
      type: 'PI',
      category: 'instrumentation',
      name: 'PI — Manomètre de Pression',
      tagPrefix: 'PI',
      description: 'Cadran de pression local',
      defaultWidth: 60,
      defaultHeight: 60,
      iconLetter: 'PI',
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    },
    {
      type: 'TI',
      category: 'instrumentation',
      name: 'TI — Thermomètre Local',
      tagPrefix: 'TI',
      description: 'Afficheur bimétallique de température',
      defaultWidth: 60,
      defaultHeight: 60,
      iconLetter: 'TI',
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    },
    {
      type: 'LI',
      category: 'instrumentation',
      name: 'LI — Indicateur de Niveau',
      tagPrefix: 'LI',
      description: 'Niveau à glace ou tube reflex',
      defaultWidth: 60,
      defaultHeight: 60,
      iconLetter: 'LI',
      badgeColor: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    },

    // CONTROL LOOPS
    {
      type: 'FC',
      category: 'control',
      name: 'FC — Régulateur de Débit',
      tagPrefix: 'FC',
      description: 'Régulateur PID asservissant une vanne de débit',
      defaultWidth: 75,
      defaultHeight: 75,
      iconLetter: 'FC',
      badgeColor: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    },
    {
      type: 'PC',
      category: 'control',
      name: 'PC — Régulateur de Pression',
      tagPrefix: 'PC',
      description: 'Boucle PID de maintien de pression réseau',
      defaultWidth: 75,
      defaultHeight: 75,
      iconLetter: 'PC',
      badgeColor: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    },
    {
      type: 'LC',
      category: 'control',
      name: 'LC — Régulateur de Niveau',
      tagPrefix: 'LC',
      description: 'Régulateur PID de niveau bac / dart valve',
      defaultWidth: 75,
      defaultHeight: 75,
      iconLetter: 'LC',
      badgeColor: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    },
    {
      type: 'TC',
      category: 'control',
      name: 'TC — Régulateur Température',
      tagPrefix: 'TC',
      description: 'Boucle PID pour échangeur de chaleur',
      defaultWidth: 75,
      defaultHeight: 75,
      iconLetter: 'TC',
      badgeColor: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    },
  ];

  const handleCreateComponent = (item: PaletteItem) => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const tag = `${item.tagPrefix}-${randomSuffix}`;
    const id = `${item.type.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newComp: ProcessComponent = {
      id,
      type: item.type,
      category: item.category,
      x: 350 + (Math.random() - 0.5) * 80,
      y: 200 + (Math.random() - 0.5) * 80,
      width: item.defaultWidth,
      height: item.defaultHeight,
      params: {
        tag,
        label: item.name,
        description: item.description,
        ...(item.type === 'pump' && {
          pumpSpeedRpm: 1450,
          pumpMaxHeadM: 50,
          pumpEfficiency: 78,
          pumpState: 'running',
        }),
        ...(item.type === 'control_valve' && {
          valveType: 'slurry_control',
          valveOpeningPct: 75,
          valveCv: 450,
          hasFlushingCircuit: true,
        }),
        ...(item.type === 'valve' && {
          valveType: 'knife_gate_slurry',
          valveOpeningPct: 100,
          hasFlushingCircuit: true,
        }),
        ...(item.category === 'control' && {
          controllerMode: 'auto',
          setpoint: 120,
          processVariable: 120,
          controllerOutputPct: 75,
          kp: 0.85,
          ki: 0.25,
          kd: 0.05,
        }),
        ...(item.category === 'instrumentation' && {
          measuredValue: 120,
          sensorRangeMin: 0,
          sensorRangeMax: 250,
        }),
        ...(item.type === 'tank' && {
          tankVolumeM3: 60,
          tankMaxLevelM: 7,
          currentLevelPct: 70,
        }),
      },
      live: {
        inletPressure: 2.0,
        outletPressure: 2.0,
        flowRate: 120,
        temperature: 25,
        velocity: 1.5,
        reynolds: 20000,
        head: 0,
        powerKw: 0,
        pressureDrop: 0,
        cavitationIndex: 5.0,
        cavitationRisk: false,
        sedimentationRisk: false,
        status: 'normal',
      },
    };

    onAddComponent(newComp);
  };

  const filteredItems = PALETTE_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tagPrefix.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const processItems = filteredItems.filter((i) => i.category === 'process');
  const instrumentItems = filteredItems.filter((i) => i.category === 'instrumentation');
  const controlItems = filteredItems.filter((i) => i.category === 'control');

  return (
    <aside
      className={`w-72 border-r flex flex-col h-full select-none z-10 shrink-0 transition-colors duration-150 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1118] border-slate-800 text-slate-100'
      }`}
    >
      {/* Palette Title & Search */}
      <div
        className={`p-3.5 border-b flex flex-col gap-2.5 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#080D14] border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              Bibliothèque P&ID
            </h3>
          </div>
          <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {filteredItems.length} Éléments
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher équipement, FT, vanne..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-md pl-8 pr-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isLight
                ? 'bg-slate-100 border border-slate-300 text-slate-900 placeholder-slate-400'
                : 'bg-[#111923] border border-slate-700/80 text-white placeholder-slate-500'
            }`}
          />
        </div>

        {/* Direct Button to open 2D Valve & Accessory Inspector */}
        <button
          onClick={onOpenValveInspector}
          className="w-full py-1.5 px-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
        >
          <Droplets className="w-3.5 h-3.5 text-emerald-400" />
          <span>Simulateur 2D Vannes (OCP)</span>
        </button>
      </div>

      {/* Categorized List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs">
        {/* Category 1: Process Equipment */}
        <div>
          <button
            onClick={() => toggleSection('process')}
            className="w-full flex items-center justify-between font-bold text-slate-300 text-[11px] uppercase tracking-wider pb-1.5 border-b border-slate-800/80 mb-2 hover:text-white"
          >
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-emerald-400" />
              <span>Procédé & Équipements</span>
            </div>
            {expandedSections.process ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {expandedSections.process && (
            <div className="grid grid-cols-1 gap-1.5">
              {processItems.map((item) => (
                <div
                  key={item.type}
                  onClick={() => handleCreateComponent(item)}
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition group ${
                    isLight
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-emerald-500'
                      : 'bg-[#101722] hover:bg-[#162130] border-slate-800/70 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-7 h-7 rounded border flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${item.badgeColor}`}>
                      {item.iconLetter}
                    </span>
                    <div className="truncate">
                      <span className={`font-semibold transition text-xs block truncate ${
                        isLight ? 'text-slate-800 group-hover:text-emerald-600' : 'text-slate-200 group-hover:text-emerald-300'
                      }`}>
                        {item.name}
                      </span>
                      <span className={`text-[10px] block truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {item.description}
                      </span>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category 2: Instrumentation */}
        <div>
          <button
            onClick={() => toggleSection('instrumentation')}
            className={`w-full flex items-center justify-between font-bold text-[11px] uppercase tracking-wider pb-1.5 border-b mb-2 transition ${
              isLight ? 'text-slate-600 hover:text-slate-900 border-slate-200' : 'text-slate-300 hover:text-white border-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Instrumentation (FT, PT, TT, LT)</span>
            </div>
            {expandedSections.instrumentation ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {expandedSections.instrumentation && (
            <div className="grid grid-cols-2 gap-1.5">
              {instrumentItems.map((item) => (
                <div
                  key={item.type}
                  onClick={() => handleCreateComponent(item)}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition group ${
                    isLight
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-cyan-500'
                      : 'bg-[#101722] hover:bg-[#162130] border-slate-800/70 hover:border-cyan-500/50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full border flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${item.badgeColor}`}>
                    {item.iconLetter}
                  </span>
                  <span className={`font-semibold transition text-[11px] truncate ${
                    isLight ? 'text-slate-800 group-hover:text-cyan-600' : 'text-slate-200 group-hover:text-cyan-300'
                  }`}>
                    {item.tagPrefix}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category 3: Control Loops */}
        <div>
          <button
            onClick={() => toggleSection('control')}
            className={`w-full flex items-center justify-between font-bold text-[11px] uppercase tracking-wider pb-1.5 border-b mb-2 transition ${
              isLight ? 'text-slate-600 hover:text-slate-900 border-slate-200' : 'text-slate-300 hover:text-white border-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Régulateurs & PID (FC, PC, LC, TC)</span>
            </div>
            {expandedSections.control ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {expandedSections.control && (
            <div className="grid grid-cols-2 gap-1.5">
              {controlItems.map((item) => (
                <div
                  key={item.type}
                  onClick={() => handleCreateComponent(item)}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition group ${
                    isLight
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-emerald-500'
                      : 'bg-[#101722] hover:bg-[#162130] border-slate-800/70 hover:border-emerald-500/50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded border flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${item.badgeColor}`}>
                    {item.iconLetter}
                  </span>
                  <span className={`font-semibold transition text-[11px] truncate ${
                    isLight ? 'text-slate-800 group-hover:text-emerald-600' : 'text-slate-200 group-hover:text-emerald-300'
                  }`}>
                    {item.tagPrefix}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
