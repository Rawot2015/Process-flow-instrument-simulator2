/**
 * @license
 * Process Flow & Instrument Simulator
 * Industrial Piping Accessories, Valves Library & OCP Lessons Learned
 * Sourced directly from OCP Engineering standards & provided technical data
 */

export interface ValveSpecification {
  id: string;
  nameFr: string;
  nameEn: string;
  typicalK: number;
  kMin: number;
  kMax: number;
  slurryCompatibility: 'Excellente' | 'Bonne' | 'Moyenne' | 'Limitée';
  internalPassage: string;
  regulationRecommended: boolean;
  flushingRequired: boolean;
  typicalDnRange: string;
  typicalPn: string;
  description: string;
  ocpRecommendation: string;
  imagePrompt?: string;
}

export const INDUSTRIAL_VALVES_DATABASE: Record<string, ValveSpecification> = {
  knife_gate_slurry: {
    id: 'knife_gate_slurry',
    nameFr: 'Vanne guillotine slurry bidirectionnelle',
    nameEn: 'Bi-directional Slurry Knife Gate Valve',
    typicalK: 0.25,
    kMin: 0.1,
    kMax: 0.5,
    slurryCompatibility: 'Excellente',
    internalPassage: 'Quasi plein passage sans rétention',
    regulationRecommended: false,
    flushingRequired: true,
    typicalDnRange: 'DN50 – DN800+',
    typicalPn: 'PN10 – PN16',
    description: 'Isolation ON/OFF sur lignes slurry très chargées, aspiration/refoulement pompes, alimentation hydrocyclone et décanteur.',
    ocpRecommendation: 'Recommandation LL136/LL467 : Équiper systématiquement d\'un système de rinçage automatique (KGV-FLUSH) lors des manœuvres ouverture/fermeture pour éviter le compactage des solides.',
  },
  push_through_kgv: {
    id: 'push_through_kgv',
    nameFr: 'Push-through knife gate',
    nameEn: 'Push-Through Knife Gate Valve',
    typicalK: 0.3,
    kMin: 0.1,
    kMax: 0.5,
    slurryCompatibility: 'Excellente',
    internalPassage: 'Plein passage traversant autonettoyant',
    regulationRecommended: false,
    flushingRequired: true,
    typicalDnRange: 'DN50 – DN600+',
    typicalPn: 'PN10 – PN25',
    description: 'Isolation sévère pour pulpes fortement abrasives à haute teneur en matières solides (% solides > 40%).',
    ocpRecommendation: 'Le manchon s\'écarte et nettoie la lame à chaque course. Purge basse recommandée.',
  },
  pinch: {
    id: 'pinch',
    nameFr: 'Pinch valve (manchon élastomère)',
    nameEn: 'Elastomer Pinch Valve',
    typicalK: 0.5,
    kMin: 0.2,
    kMax: 1.0,
    slurryCompatibility: 'Excellente',
    internalPassage: 'Manchon cylindrique continu sans pièces métalliques en contact',
    regulationRecommended: true,
    flushingRequired: false,
    typicalDnRange: 'DN25 – DN600',
    typicalPn: 'PN10 – PN16',
    description: 'Régulation et isolation de pulpes abrasives. Idéal pour dosage et régulation de débit sans risque de coincement.',
    ocpRecommendation: 'Recommandation LL135 : Remplacer les vannes papillon en eau chargée / pulpe par des pinch valves pour limiter l\'érosion et les vibrations.',
  },
  butterfly_rubber: {
    id: 'butterfly_rubber',
    nameFr: 'Vanne papillon (rubber-lined)',
    nameEn: 'Rubber-Lined Butterfly Valve',
    typicalK: 0.8,
    kMin: 0.3,
    kMax: 1.5,
    slurryCompatibility: 'Bonne',
    internalPassage: 'Disque centré dans la veine fluide',
    regulationRecommended: false,
    flushingRequired: false,
    typicalDnRange: 'DN100 – DN1200+',
    typicalPn: 'PN10 – PN16',
    description: 'Eau brute, eau recyclée et pulpes fines. Disque et manchon vulcanisé anti-abrasion.',
    ocpRecommendation: 'Attention LL137 : Une vanne papillon surdimensionnée en régulation génère des décollements de tourbillons et de violentes vibrations cavitationnelles.',
  },
  slurry_control: {
    id: 'slurry_control',
    nameFr: 'Vanne de contrôle slurry dédiée',
    nameEn: 'Dedicated Slurry Control Valve',
    typicalK: 4.5,
    kMin: 3.0,
    kMax: 20.0,
    slurryCompatibility: 'Excellente',
    internalPassage: 'Orifice à géométrie variable et chemisage carbure de tungstène / céramique',
    regulationRecommended: true,
    flushingRequired: true,
    typicalDnRange: 'DN25 – DN600',
    typicalPn: 'PN16 – PN40',
    description: 'Boucles de régulation continues (débit FT-101 / pression PT-101 / niveau LT-101) et répartition de flux d\'alimentation broyeurs.',
    ocpRecommendation: 'Recommandation LL140 : Utiliser des vannes de régulation dédiées pour la division des flux concentrés vers les broyeurs OCP.',
  },
  ball_lined: {
    id: 'ball_lined',
    nameFr: 'Vanne à boisseau sphérique (liner)',
    nameEn: 'Lined Ball Valve (Full-Bore)',
    typicalK: 0.15,
    kMin: 0.05,
    kMax: 0.3,
    slurryCompatibility: 'Bonne',
    internalPassage: 'Passage intégral cylindrique',
    regulationRecommended: false,
    flushingRequired: false,
    typicalDnRange: 'DN25 – DN500',
    typicalPn: 'PN16 – PN40',
    description: 'Isolement quart de tour rapide pour acides phosphoriques et pulpes fines traitées chimiquement.',
    ocpRecommendation: 'Garniture fluoropolymère (PTFE/PFA) pour résistance simultanée à l\'acide phosphorique et aux chlorures.',
  },
  dart: {
    id: 'dart',
    nameFr: 'Vanne dart (régulation niveau cellule)',
    nameEn: 'Dart Valve (Flotation Level Control)',
    typicalK: 2.0,
    kMin: 1.0,
    kMax: 8.0,
    slurryCompatibility: 'Excellente',
    internalPassage: 'Pointeau conique vertical sur siège polyuréthane',
    regulationRecommended: true,
    flushingRequired: false,
    typicalDnRange: 'Sur mesure caisson',
    typicalPn: 'Basse pression hydrostatique',
    description: 'Régulation du niveau d\'interface pulpe/mousse dans les bancs de flottation de phosphate.',
    ocpRecommendation: 'Asservie au transmetteur de niveau LT-101 pour stabiliser l\'écumage de concentré de phosphate.',
  },
  check_valve: {
    id: 'check_valve',
    nameFr: 'Clapet anti-retour slurry',
    nameEn: 'Slurry Non-Return Check Valve',
    typicalK: 3.5,
    kMin: 2.0,
    kMax: 10.0,
    slurryCompatibility: 'Bonne',
    internalPassage: 'Battant ou manchon déformable',
    regulationRecommended: false,
    flushingRequired: false,
    typicalDnRange: 'DN50 – DN600+',
    typicalPn: 'PN10 – PN25',
    description: 'Protection du refoulement des pompes à pulpe contre les coups de bélier et l\'inversion de débit.',
    ocpRecommendation: 'Indispensable pour éviter la vidange accidentelle des colonnes montantes vers les hydrocyclones.',
  },
  diaphragm: {
    id: 'diaphragm',
    nameFr: 'Vanne à membrane / diaphragme',
    nameEn: 'Diaphragm Valve',
    typicalK: 2.2,
    kMin: 1.0,
    kMax: 5.0,
    slurryCompatibility: 'Moyenne',
    internalPassage: 'Seuil profilé avec membrane élastomère',
    regulationRecommended: true,
    flushingRequired: false,
    typicalDnRange: 'DN15 – DN350',
    typicalPn: 'PN10 – PN16',
    description: 'Dosage de réactifs miniers (collecteurs, moussants, floculants) et préparation chimique.',
    ocpRecommendation: 'Recommandé pour fluides visqueux et réactifs sans grosses particules solides.',
  },
};

export interface OcpLessonLearned {
  id: string;
  tag: string;
  title: string;
  discipline: string;
  isPriority: boolean;
  content: string;
}

export const OCP_LESSONS_LEARNED: OcpLessonLearned[] = [
  {
    id: 'LL109',
    tag: 'LL-109',
    title: 'Slurry gravity flows & line flushing',
    discipline: 'Process / Tuyauterie',
    isPriority: true,
    content:
      'Pour les écoulements gravitaires de pulpe, minimiser les angles vifs et installer une prise d\'eau sous pression avec vanne automatique pour rincer la ligne selon un cycle programmé.',
  },
  {
    id: 'LL135',
    tag: 'LL-135',
    title: 'Technologie vannes slurry vs eau brute',
    discipline: 'Piping',
    isPriority: false,
    content:
      'Lignes pulpe ON/OFF : utiliser exclusivement des vannes guillotine (KGV avec rinçage). Lignes eau chargée/utilités : remplacer les papillons par des pinch valves pour amortir les vibrations.',
  },
  {
    id: 'LL136',
    tag: 'LL-136',
    title: 'Système de rinçage sur toutes les vannes guillotine',
    discipline: 'Piping / Process',
    isPriority: true,
    content:
      'Toutes les vannes guillotine slurry doivent être munies de circuits de flushing intégrés aux P&ID afin d\'éviter le compactage de gâteau de phosphate dans le siège.',
  },
  {
    id: 'LL137',
    tag: 'LL-137',
    title: 'Surdimensionnement des vannes papillon',
    discipline: 'Piping',
    isPriority: false,
    content:
      'Les vannes papillon de contrôle surdimensionnées (travaillant à moins de 20% d\'ouverture) provoquent d\'importantes vibrations et l\'usure prématurée des manchettes en élastomère.',
  },
  {
    id: 'LL140',
    tag: 'LL-140',
    title: 'Séparation de flux concentrés vers broyeurs',
    discipline: 'Process',
    isPriority: true,
    content:
      'Pour toutes les séparations de flux de pulpe concentrée, employer des répartiteurs spécifiques et des vannes de régulation dédiées pour garantir l\'alimentation symétrique des broyeurs.',
  },
  {
    id: 'LL467',
    tag: 'LL-467',
    title: 'Fuite des vannes guillotines à la manœuvre',
    discipline: 'Process / Exploitation',
    isPriority: true,
    content:
      'Risque de fuite et blocage des vannes guillotine lors des cycles ouverture/fermeture : asservir un rinçage automatique haute pression (KGV-FLUSH) déclenché par le système de contrôle DCS.',
  },
  {
    id: 'LL521',
    tag: 'LL-521',
    title: 'Drainage des pump boxes',
    discipline: 'Process',
    isPriority: true,
    content:
      'Sur les circuits de drainage des bacs de reprise de pompes (pump boxes), installer une vanne guillotine à passage intégral et non une vanne de régulation.',
  },
  {
    id: 'LL528',
    tag: 'LL-528',
    title: 'Automatisation des vannes d\'exploitation',
    discipline: 'Instrumentation & Contrôle',
    isPriority: true,
    content:
      'Automatiser impérativement les vannes de drainage, d\'aspiration et de refoulement (actionneurs pneumatiques avec positionneur 4-20mA et fins de course) : les vannes manuelles pénalisent lourdement la productivité.',
  },
];

export const PRESET_FLUIDS = {
  phosphate_slurry: {
    type: 'phosphate_slurry' as const,
    name: 'Pulpe de Phosphate OCP (35% solides)',
    density: 1320, // kg/m³
    viscosity: 0.018, // Pa·s (18 cP apparent)
    solidsPercentage: 35, // %
    solidsDensity: 2750, // kg/m³
    d50: 125, // µm
    temperature: 25, // °C
    vaporPressure: 0.032, // bar abs
    yieldStress: 3.5, // Pa
    isCompressible: false,
    color: '#C29B63', // Earthy beige / sandy brown (pulpe de phosphate)
  },
  phosphate_slurry_dense: {
    type: 'phosphate_slurry' as const,
    name: 'Pulpe Épaissie Décanteur CCD (52% solides)',
    density: 1540, // kg/m³
    viscosity: 0.065, // Pa·s (65 cP)
    solidsPercentage: 52, // %
    solidsDensity: 2750, // kg/m³
    d50: 140, // µm
    temperature: 28, // °C
    vaporPressure: 0.038, // bar abs
    yieldStress: 14.0, // Pa
    isCompressible: false,
    color: '#B5874D', // Dense earthy ochre-tan slurry
  },
  water: {
    type: 'water' as const,
    name: 'Eau de procédé / Dilution',
    density: 1000, // kg/m³
    viscosity: 0.001, // 1 cP
    solidsPercentage: 0,
    solidsDensity: 1000,
    d50: 0,
    temperature: 20,
    vaporPressure: 0.023,
    yieldStress: 0,
    isCompressible: false,
    color: '#0284C7',
  },
  air: {
    type: 'air' as const,
    name: 'Air comprimé d\'instrumentation / Flottation',
    density: 1.22,
    viscosity: 0.000018,
    solidsPercentage: 0,
    solidsDensity: 0,
    d50: 0,
    temperature: 20,
    vaporPressure: 0,
    yieldStress: 0,
    isCompressible: true,
    color: '#94A3B8',
  },
};

/**
 * Centralized Visual Fluid Color Configuration
 * Configures the visual appearance of process fluids throughout the simulator
 * (tanks, decanters, quick status badges, level monitors).
 *
 * For Phosphate Slurry (Pulpe de Phosphate OCP):
 * An opaque, realistic earthy sandy beige / muted yellow-brown tone (#C29B63 / #C9A36B)
 * representing dense mineral phosphate rock suspended in aqueous slurry.
 */
export interface FluidColorConfig {
  primary: string;       // Primary brand hex for indicators and charts
  fill: string;          // Opaque vessel fluid fill
  fillDark: string;      // Calibrated for dark SCADA mode
  fillLight: string;     // Calibrated for light mode
  border: string;        // Surface meniscus line highlight
  badge: string;         // Status badge / dot color
  particle: string;      // Flow particle accent
  label: string;         // Human-readable color description
}

export const FLUID_COLOR_CONFIG: Record<string, FluidColorConfig> = {
  phosphate_slurry: {
    primary: '#C29B63',          // Earthy sandy brown / ochre beige
    fill: '#C29B63',
    fillDark: '#C9A36B',         // Warm sand/khaki tone on dark SCADA
    fillLight: '#B2874E',        // Deep earthy beige-tan on daylight/light mode
    border: '#E2C498',           // Distinct meniscus line
    badge: '#C29B63',
    particle: '#EAD1A8',
    label: 'Beige sable terreux / Ocre minéral (Pulpe de Phosphate)',
  },
  water: {
    primary: '#0284C7',
    fill: '#0284C7',
    fillDark: '#38BDF8',
    fillLight: '#0284C7',
    border: '#7DD3FC',
    badge: '#0284C7',
    particle: '#BAE6FD',
    label: 'Bleu clair limpide (Eau de procédé)',
  },
  air: {
    primary: '#94A3B8',
    fill: '#94A3B8',
    fillDark: '#CBD5E1',
    fillLight: '#64748B',
    border: '#E2E8F0',
    badge: '#94A3B8',
    particle: '#F1F5F9',
    label: 'Gris neutre (Air comprimé)',
  },
  custom: {
    primary: '#A855F7',
    fill: '#A855F7',
    fillDark: '#C084FC',
    fillLight: '#9333EA',
    border: '#E9D5FF',
    badge: '#A855F7',
    particle: '#F3E8FF',
    label: 'Violet personnalisé',
  },
};

export function getFluidColorConfig(
  fluidType: string = 'phosphate_slurry',
  isLight: boolean = false
): FluidColorConfig {
  return FLUID_COLOR_CONFIG[fluidType] || FLUID_COLOR_CONFIG.phosphate_slurry;
}

