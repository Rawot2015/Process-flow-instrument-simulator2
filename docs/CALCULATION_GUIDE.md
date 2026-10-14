# Guide Technique Pas-à-Pas : Comprendre et Modifier les Calculs du Simulateur de Procédé (OCP)

Ce guide est destiné aux ingénieurs, techniciens et développeurs souhaitant comprendre le moteur de calcul scientifique et hydraulique du **Simulateur de Procédé & P&ID**. Il détaille le code réel, les formules mathématiques, les variables de procédé, ainsi que la méthode pour modifier et étendre ces calculs en toute sécurité.

---

## Sommaire

1. [Étape 1 — Architecture Globale de l'Application](#étape-1--architecture-globale-de-lapplication)
2. [Étape 2 — Structure des Fichiers et Emplacement des Calculs](#étape-2--structure-des-fichiers-et-emplacement-des-calculs)
3. [Étape 3 — Variables de Procédé et Grandeurs Physiques](#étape-3--variables-de-procédé-et-grandeurs-physiques)
4. [Étape 4 — Formules Mathématiques et Modèles d'Ingénierie](#étape-4--formules-mathématiques-et-modèles-dingénierie)
   - 4.1. Vitesse d'écoulement et Section de conduite
   - 4.2. Viscosité apparente d'un fluide non newtonien (Bingham)
   - 4.3. Nombre de Reynolds
   - 4.4. Facteur de frottement de Darcy-Weisbach (Swamee-Jain)
   - 4.5. Perte de charge linéaire et hydrostatique dans une conduite
   - 4.6. Vitesse critique de dépôt solide (Corrélation de Durand)
   - 4.7. Caractéristiques des vannes (Cv, coefficient K, pourcentage d'ouverture)
   - 4.8. Perte de charge singulière à travers une vanne
   - 4.9. Indice de cavitation ($\sigma$)
   - 4.10. Performance de la pompe centrifuge (Lois d'affinité, Hauteur et Puissance)
   - 4.11. Bilan thermique de l'échangeur de chaleur
   - 4.12. Dynamique de niveau dans les réservoirs (Bilan matière)
   - 4.13. Boucle de régulation PID discrète et Actionneur pneumatique
   - 4.14. Filtrage et bruit de mesure des transmetteurs
5. [Étape 5 — Cycle d'Exécution de la Simulation](#étape-5--cycle-dexécution-de-la-simulation)
6. [Étape 6 — Logique des Équipements et Instruments](#étape-6--logique-des-équipements-et-instruments)
7. [Étape 7 — Exemple Pratique : Modifier un Calcul Pas-à-Pas](#étape-7--exemple-pratique--modifier-un-calcul-pas-à-pas)
8. [Étape 8 — Tests, Validation et Prévention des Régressions](#étape-8--tests-validation-et-prévention-des-régressions)
9. [Étape 9 — Dépannage et Diagnostic d'Erreurs Fréquentes](#étape-9--dépannage-et-diagnostic-derreurs-fréquentes)
10. [Étape 10 — Bonnes Pratiques et Workflow de Développement](#étape-10--bonnes-pratiques-et-workflow-de-développement)

---

## Étape 1 — Architecture Globale de l'Application

L'application est architecturée selon une séparation stricte entre **Moteur Physique & Logique de Simulation** (côté calcul) et **Interface Utilisateur Réactive** (côté rendu) :

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INTERFACE UTILISATEUR                           │
│   (React SPA : Canvas P&ID SVG, Panneau Propriétés, Graphiques SCADA)  │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Notifications d'état (Pattern Observer)
                                    │ engine.subscribe((circuit, state, alarms) => ...)
┌───────────────────────────────────┴────────────────────────────────────┐
│                  SIMULATION ENGINE (simulationEngine.ts)               │
│          Boucle d'horloge 20 Hz (50 ms) avec vitesse réglable          │
│                                                                        │
│  1. Réseau Hydraulique ───► 2. Transmetteurs ───► 3. Régulateurs PID  │
│     (processModel.ts)       (instrumentModel.ts)   (controlModel.ts)   │
│            ▲                                              │            │
│            └──────── 4. Actionneur Pneumatique ◄──────────┘            │
│                       (Mise à jour vanne FV-101)                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│             ÉQUATIONS PHYSIQUES & HYDRAULIQUE (hydraulicEquations.ts)   │
│      Lois de Darcy-Weisbach, Swamee-Jain, Bingham, Durand, Pompes      │
└────────────────────────────────────────────────────────────────────────┘
```

- **Indépendance du calcul :** Les classes de calcul (`SimulationEngine`, `ProcessModel`, `ControlModel`, `InstrumentModel`) sont écrites en pur TypeScript sans dépendance directe au DOM. Elles peuvent fonctionner de manière autonome.
- **Pattern Observable :** L'interface React souscrit aux événements du moteur via `engine.subscribe()`. Chaque itération du solveur met à jour l'objet `ProcessCircuit` et notifie les composants UI pour rafraîchir l'affichage sans saccade.

---

## Étape 2 — Structure des Fichiers et Emplacement des Calculs

Voici la cartographie exacte des fichiers contenant les calculs :

| Fichier | Rôle dans les Calculs | Fonctions Principales |
|---|---|---|
| `src/simulation/hydraulicEquations.ts` | **Cœur des équations physiques** : Vitesse, Reynolds, perte de charge, Durand, cavitation, courbes de pompes, caractéristiques de vannes. | `calculateVelocity`, `calculateReynolds`, `calculatePipePressureDrop`, `calculatePumpPerformance`, `calculateValveCharacteristics`, `calculateCriticalDepositionVelocity`, etc. |
| `src/simulation/processModel.ts` | **Solveur de réseau hydraulique** : Équilibre débit/pression, propagation de pression le long des tuyaux, niveau des réservoirs, hydrocyclones, échangeur thermique. | `ProcessModel.solveNetwork()` |
| `src/simulation/controlModel.ts` | **Algorithme PID numérique** : Erreur, termes P, I, D avec intégration trapézoïdale et limitation anti-windup. | `ControlModel.updateController()` |
| `src/simulation/instrumentModel.ts` | **Modèle des instruments et alarmes** : Filtrage du 1er ordre (temps de réponse $\tau$), bruit capteur, déclenchement des seuils LL, L, H, HH. | `InstrumentModel.processInstrument()` |
| `src/simulation/simulationEngine.ts` | **Orchestrateur maître** : Boucle de cadencement (20 Hz), coordination entre le réseau, les capteurs, les boucles de régulation et l'actionneur. | `SimulationEngine.step()`, `start()`, `pause()`, `reset()` |
| `src/types/process.ts` | **Définitions TypeScript** : Types de composants, données de télémétrie, propriétés de fluides et unités de mesure. | Interfaces `ProcessComponent`, `ProcessConnection`, `FluidProperties`. |
| `src/constants/accessoriesData.ts` | **Banque de données industrielles OCP** : Propriétés des pulpes de phosphate, coefficients types des vannes industrielles, fiches techniques. | `PRESET_FLUIDS`, `INDUSTRIAL_VALVES_DATABASE`. |

---

## Étape 3 — Variables de Procédé et Grandeurs Physiques

Le tableau suivant liste les variables manipulées par le moteur de calcul :

| Variable | Symbole | Unité SI / Industrielle | Type TS | Valeur par défaut (OCP) | Description |
|---|---|---|---|---|---|
| Débit volumique | $Q$ | $\text{m}^3/\text{h}$ | `number` | $120.0$ | Volume de fluide traversant la section par unité de temps |
| Pression amont/aval | $P$ | $\text{bar}$ | `number` | $1.0$ à $6.85$ | Pression relative dans la canalisation ($1\text{ bar} = 10^5\text{ Pa}$) |
| Vitesse d'écoulement | $V$ | $\text{m/s}$ | `number` | $1.0$ à $2.5$ | Vitesse moyenne linéaire du fluide |
| Diamètre intérieur | $D$ | $\text{mm}$ | `number` | $200$ | Diamètre de la tuyauterie ($DN200 = 0.2\text{ m}$) |
| Masse volumique | $\rho$ | $\text{kg/m}^3$ | `number` | $1320$ | Densité de la pulpe de phosphate à 35% de solides |
| Viscosité plastique | $\mu_p$ | $\text{Pa}\cdot\text{s}$ | `number` | $0.018$ | Viscosité apparente ($18\text{ cP}$) |
| Seuil de cisaillement | $\tau_0$ | $\text{Pa}$ | `number` | $3.5$ | Seuil plastique de Bingham pour la pulpe minérale |
| Vitesse critique de dépôt | $V_c$ | $\text{m/s}$ | `number` | $1.85$ | Vitesse minimale pour éviter la sédimentation (Durand) |
| Hauteur manométrique | $H$ | $\text{m}$ (CLF) | `number` | $42.0$ | Énergie fournie par la pompe en mètres de colonne de fluide |
| Puissance absorbée | $P_{\text{shaft}}$ | $\text{kW}$ | `number` | $24.5$ | Puissance électrique/mécanique absorbée à l'arbre |
| Niveau réservoir | $L$ | $\%$ | `number` | $75.0$ | Hauteur de remplissage du bac de stockage |
| Température | $T$ | $^\circ\text{C}$ | `number` | $25.0$ | Température du fluide |
| Ouverture vanne | $X_v$ | $\%$ | `number` | $65.0$ | Course de la vanne de contrôle ($0\% =$ fermée, $100\% =$ ouverte) |

---

## Étape 4 — Formules Mathématiques et Modèles d'Ingénierie

### 4.1. Vitesse d'écoulement et Section de conduite
- **Principe :** Conservation de la masse pour un fluide incompressible en régime permanent ($Q = A \times V$).
- **Formule :**
  $$A = \frac{\pi \cdot D^2}{4} \quad (\text{avec } D \text{ en mètres})$$
  $$V = \frac{Q_{\text{m}^3/\text{s}}}{A} = \frac{Q_{\text{m}^3/\text{h}} / 3600}{\pi \cdot (D/1000)^2 / 4}$$
- **Emplacement dans le code :** `src/simulation/hydraulicEquations.ts`, fonctions `calculateCrossSectionArea(diameterMm)` et `calculateVelocity(flowRateM3h, diameterMm)`.
- **Exemple concret :**
  Pour $D = 200\text{ mm}$ ($0.2\text{ m}$) et $Q = 120\text{ m}^3/\text{h}$ :
  $$A = \frac{\pi \times 0.2^2}{4} = 0.031416\text{ m}^2$$
  $$Q = 120 / 3600 = 0.03333\text{ m}^3/\text{s}$$
  $$V = \frac{0.03333}{0.031416} \approx 1.061\text{ m/s}$$

---

### 4.2. Viscosité apparente d'un fluide non newtonien (Bingham)
- **Principe :** La pulpe de phosphate est un fluide à seuil (plastique de Bingham). Elle nécessite une contrainte minimale $\tau_0$ pour s'écouler. Sa viscosité apparente $\mu_{\text{app}}$ diminue lorsque le taux de cisaillement augmente (rhéofluidification).
- **Formule :**
  $$\dot{\gamma} = \frac{8 \cdot V}{D}$$
  $$\mu_{\text{app}} = \mu_{\text{plastic}} + \frac{\tau_0}{\dot{\gamma}}$$
- **Emplacement dans le code :** `src/simulation/hydraulicEquations.ts`, fonction `calculateApparentViscosity(fluid, velocity, diameterMm)`.
- **Exemple concret :**
  Avec $\mu_{\text{plastic}} = 0.018\text{ Pa}\cdot\text{s}$, $\tau_0 = 3.5\text{ Pa}$, $V = 1.061\text{ m/s}$, $D = 0.2\text{ m}$ :
  $$\dot{\gamma} = \frac{8 \times 1.061}{0.2} = 42.44\text{ s}^{-1}$$
  $$\mu_{\text{app}} = 0.018 + \frac{3.5}{42.44} = 0.018 + 0.0825 = 0.1005\text{ Pa}\cdot\text{s}$$

---

### 4.3. Nombre de Reynolds
- **Principe :** Rapport entre les forces d'inertie et les forces visqueuses. Il détermine si l'écoulement est laminaire ($Re < 2300$) ou turbulent ($Re > 4000$).
- **Formule :**
  $$Re = \frac{\rho \cdot |V| \cdot D}{\mu_{\text{app}}}$$
- **Emplacement dans le code :** `src/simulation/hydraulicEquations.ts`, fonction `calculateReynolds(fluid, velocity, diameterMm)`.
- **Exemple concret :**
  Avec $\rho = 1320\text{ kg/m}^3$, $V = 1.061\text{ m/s}$, $D = 0.2\text{ m}$, $\mu_{\text{app}} = 0.1005\text{ Pa}\cdot\text{s}$ :
  $$Re = \frac{1320 \times 1.061 \times 0.2}{0.1005} \approx 2787 \quad (\text{régime de transition})$$

---

### 4.4. Facteur de frottement de Darcy-Weisbach (Swamee-Jain)
- **Principe :** En régime turbulent, la formule explicite de Swamee-Jain approche l'équation implicite de Colebrook-White avec une précision supérieure à 1%.
- **Formule :**
  $$f = \begin{cases} \frac{64}{Re} & \text{si } Re < 2300 \\ \frac{0.25}{\left[ \log_{10}\left( \frac{\epsilon / D}{3.7} + \frac{5.74}{Re^{0.9}} \right) \right]^2} & \text{si } Re \ge 2300 \end{cases}$$
- **Emplacement dans le code :** `src/simulation/hydraulicEquations.ts`, fonction `calculateFrictionFactor(reynolds, roughnessMm, diameterMm)`.
- **Exemple concret :**
  Avec rugosité acier/revêtement $\epsilon = 0.045\text{ mm}$, $D = 200\text{ mm}$, $Re = 28500$ :
  $$\frac{\epsilon/D}{3.7} = \frac{0.045/200}{3.7} = 6.081 \times 10^{-5}$$
  $$\frac{5.74}{28500^{0.9}} = \frac{5.74}{10086} = 5.69 \times 10^{-4}$$
  $$\log_{10}(6.081 \times 10^{-5} + 5.69 \times 10^{-4}) = \log_{10}(6.30 \times 10^{-4}) = -3.2006$$
  $$f = \frac{0.25}{(-3.2006)^2} = \frac{0.25}{10.244} \approx 0.0244$$

---

### 4.5. Perte de charge linéaire et hydrostatique dans une conduite
- **Principe :** Équation de Darcy-Weisbach combinée à la variation de charge hydrostatique due au dénivelé ($\Delta z$).
- **Formule :**
  $$\Delta P_{\text{friction}} = f \cdot \frac{L}{D} \cdot \left( \frac{\rho \cdot V^2}{2} \right) \quad [\text{Pa}]$$
  $$\Delta P_{\text{hydrostatique}} = \rho \cdot g \cdot \Delta z \quad [\text{Pa}]$$
  $$\Delta P_{\text{total}} = \frac{\Delta P_{\text{friction}} + \Delta P_{\text{hydrostatique}}}{10^5} \quad [\text{bar}]$$
- **Emplacement dans le code :** `src/simulation/hydraulicEquations.ts`, fonction `calculatePipePressureDrop(...)`.
- **Exemple concret :**
  Pour $L = 50\text{ m}$, $D = 0.2\text{ m}$, $f = 0.0244$, $\rho = 1320\text{ kg/m}^3$, $V = 1.061\text{ m/s}$, $\Delta z = 0$ :
  $$\Delta P_{\text{friction}} = 0.0244 \times \frac{50}{0.2} \times \frac{1320 \times 1.061^2}{2} = 6.1 \times 743.2 = 4533\text{ Pa} \approx 0.0453\text{ bar}$$

---

### 4.6. Vitesse critique de dépôt solide (Corrélation de Durand)
- **Principe :** Dans les transports hydrauliques de phosphate (slurry piping), les particules minérales solides décantent si la vitesse dans le tuyau chute sous la vitesse critique $V_c$. Le simulateur surveille cette condition pour alerter l'opérateur en cas de risque d'ensablement.
- **Formule :**
  $$s = \frac{\rho_{\text{solide}}}{\rho_{\text{fluide}}}$$
  $$V_c = F_L \cdot \sqrt{2 \cdot g \cdot D \cdot (s - 1)}$$
  où $F_L \approx 1.34$ est le paramètre empirique de Durand pour une granulométrie $d_{50} = 125\,\mu\text{m}$.
- **Emplacement dans le code :** `src/simulation/hydraulicEquations.ts`, fonction `calculateCriticalDepositionVelocity(fluid, diameterMm)`.
- **Exemple concret :**
  Avec $\rho_{\text{solide}} = 2750\text{ kg/m}^3$, $\rho_{\text{fluide}} = 1320\text{ kg/m}^3$, $D = 0.2\text{ m}$ :
  $$s = \frac{2750}{1320} = 2.083$$
  $$V_c = 1.34 \times \sqrt{2 \times 9.81 \times 0.2 \times (2.083 - 1)} = 1.34 \times \sqrt{3.924 \times 1.083} = 1.34 \times \sqrt{4.25} \approx 2.76\text{ m/s}$$
  Si $V_{\text{tuyau}} < V_c$, le statut de la conduite passe automatiquement en `sedimentation_risk`.

---

### 4.7. Caractéristiques des vannes (Cv, coefficient K, pourcentage d'ouverture)
- **Principe :** Le coefficient de débit $C_v$ et le coefficient de perte de charge singulière $K$ dépendent de la géométrie interne de la vanne (linéaire, équipourcentage, papillon, guillotine).
- **Formules :**
  - **Vanne papillon ($butterfly\_rubber$) :**
    $$\text{Fraction surface} = \sin^2\left(\frac{X \cdot \pi}{2}\right) \quad (\text{avec } X = \text{ouverture} / 100)$$
  - **Vanne de contrôle slurry ($slurry\_control$) :** courbe équipourcentage avec $R = 30$ :
    $$\text{Fraction surface} = 30^{X - 1}$$
  - **Coefficient $K$ singulier :**
    $$K = \frac{K_{100}}{\max(0.015, \text{Fraction surface})^2}$$
- **Emplacement dans le code :** `src/simulation/hydraulicEquations.ts`, fonction `calculateValveCharacteristics(valveType, openingPct, nominalDiameterMm)`.

---

### 4.8. Perte de charge singulière à travers une vanne
- **Principe :** Formule normalisée ISA/IEC reliant le débit volumique en GPM, la densité relative $SG$, et le $C_v$ effectif :
- **Formule :**
  $$Q_{\text{gpm}} = Q_{\text{m}^3/\text{h}} \times 4.40287$$
  $$SG = \frac{\rho}{\rho_{\text{eau}}} = \frac{\rho}{1000}$$
  $$\Delta P_{\text{psi}} = \left( \frac{Q_{\text{gpm}}}{C_v} \right)^2 \times SG$$
  $$\Delta P_{\text{bar}} = \frac{\Delta P_{\text{psi}}}{14.5038}$$
- **Emplacement dans le code :** `src/simulation/hydraulicEquations.ts`, fonction `calculateValvePressureDrop(flowRateM3h, effectiveCv, fluid)`.

---

### 4.9. Indice de cavitation ($\sigma$)
- **Principe :** La cavitation survient lorsque la pression statique locale chute sous la tension de vapeur saturante $P_v$. L'indice de cavitation $\sigma$ (nombre de Thoma/Tullis) quantifie cette marge de sécurité.
- **Formule :**
  $$\sigma = \frac{P_{2,\text{abs}} - P_{v,\text{abs}}}{P_{1,\text{abs}} - P_{2,\text{abs}}}$$
  avec $P_{\text{abs}} = P_{\text{rel}} + 1.013\text{ bar}$.
  Si $\sigma < 1.35$, le simulateur active l'indicateur de cavitation (`isCavitation = true`).
- **Emplacement dans le code :** `src/simulation/hydraulicEquations.ts`, fonction `calculateCavitationIndex(...)`.

---

### 4.10. Performance de la pompe centrifuge (Lois d'affinité, Hauteur et Puissance)
- **Principe :** Les lois de similitude (affinité) permettent d'ajuster la courbe caractéristique $H(Q)$ en fonction de la vitesse de rotation $N$ :
- **Formule :**
  $$\text{Ratio de vitesse } \alpha = \frac{N}{N_0} = \frac{N}{1450}$$
  $$H_{\text{max}} = H_0 \cdot \alpha^2$$
  $$H(Q) = H_{\text{max}} - 0.00018 \cdot Q^2 \quad [\text{m}]$$
  $$\Delta P_{\text{pompe}} = \frac{\rho \cdot g \cdot H(Q)}{10^5} \quad [\text{bar}]$$
  $$P_{\text{hydraulique}} = \frac{\rho \cdot g \cdot (Q / 3600) \cdot H(Q)}{1000} \quad [\text{kW}]$$
  $$P_{\text{absorbée}} = \frac{P_{\text{hydraulique}}}{\eta} \quad (\eta = \text{rendement} \approx 0.78)$$
- **Emplacement dans le code :** `src/simulation/hydraulicEquations.ts`, fonction `calculatePumpPerformance(...)`.
- **Exemple concret :**
  À $N = 1450\text{ RPM}$ ($\alpha = 1.0$), $H_0 = 52\text{ m}$, $Q = 120\text{ m}^3/\text{h}$ :
  $$H = 52 - 0.00018 \times (120)^2 = 52 - 2.592 = 49.4\text{ m}$$
  $$\Delta P = \frac{1320 \times 9.80665 \times 49.4}{100000} \approx 6.40\text{ bar}$$
  $$P_{\text{hyd}} = \frac{1320 \times 9.80665 \times (120/3600) \times 49.4}{1000} = 21.32\text{ kW}$$
  $$P_{\text{absorbée}} = \frac{21.32}{0.78} = 27.33\text{ kW}$$

---

### 4.11. Bilan thermique de l'échangeur de chaleur
- **Principe :** Bilan d'énergie stationnaire sans changement de phase :
- **Formule :**
  $$\dot{m} = \frac{Q_{\text{m}^3/\text{h}} \cdot \rho}{3600} \quad [\text{kg/s}]$$
  $$\Delta T = \frac{\Phi}{\dot{m} \cdot C_p} \quad \text{avec } \Phi = \text{puissance en kW, } C_p \approx 3.5\text{ kJ/(kg}\cdot\text{K)}$$
  $$T_{\text{sortie}} = T_{\text{entrée}} + \Delta T$$
- **Emplacement dans le code :** `src/simulation/processModel.ts`, composant `heat_exchanger`.

---

### 4.12. Dynamique de niveau dans les réservoirs (Bilan matière)
- **Principe :** Équation différentielle de conservation du volume liquide dans un bac :
- **Formule :**
  $$\frac{dL}{dt} = \frac{Q_{\text{entrant}} - Q_{\text{sortant}}}{A_{\text{bac}}}$$
  $$L(t + \Delta t) = L(t) + \frac{Q_{\text{net}} \cdot \Delta t}{20}$$
- **Emplacement dans le code :** `src/simulation/processModel.ts`, composant `tank`.

---

### 4.13. Boucle de régulation PID discrète et Actionneur pneumatique
- **Principe :** Régulation PID en forme parallèle avec intégration discrète trapézoïdale et protection anti-emballement (anti-windup clamping).
- **Formule :**
  $$e(k) = SP - PV \quad (\text{ou } PV - SP \text{ si action directe})$$
  $$P_{\text{term}} = K_p \cdot e(k)$$
  $$I_{\text{accum}}(k) = \text{clamp}_{0}^{100}\left(I_{\text{accum}}(k-1) + K_i \cdot e(k) \cdot \Delta t\right)$$
  $$D_{\text{term}} = K_d \cdot \frac{e(k) - e(k-1)}{\Delta t}$$
  $$\text{Sortie}_{\text{PID}} = \text{clamp}_{0}^{100}\left(I_{\text{accum}} + P_{\text{term}} + D_{\text{term}}\right)$$
- **Vitesse de déplacement de l'actionneur (Slew Rate) :**
  Une vanne pneumatique réelle ne passe pas instantanément de 0% à 100%. Sa course est bridée à une vitesse physique réaliste de $15\%/\text{s}$ :
  $$\Delta X_{\text{max}} = 15 \times \Delta t$$
- **Emplacement dans le code :**
  - Calcul PID : `src/simulation/controlModel.ts`, fonction `ControlModel.updateController()`.
  - Vitesse vanne : `src/simulation/simulationEngine.ts`, lignes 291-304.

---

### 4.14. Filtrage et bruit de mesure des transmetteurs
- **Principe :** Les transmetteurs industriels (FT-101, PT-101, LT-101) comportent une constante de temps de mesure $\tau$ (filtre passe-bas du premier ordre) et un bruit blanc de mesure :
- **Formule :**
  $$\alpha = e^{-\Delta t / \tau} \quad (\tau = 0.5\text{ s})$$
  $$\text{Bruit} = (\text{rand}() - 0.5) \times 0.6\% \times \text{Échelle}$$
  $$y(k) = \alpha \cdot y(k-1) + (1 - \alpha) \cdot (u(k) + \text{Bruit})$$
- **Emplacement dans le code :** `src/simulation/instrumentModel.ts`, fonction `processInstrument()`.

---

## Étape 5 — Cycle d'Exécution de la Simulation

Le cycle d'exécution s'opère de la manière suivante :

1. **Déclenchement du pas de calcul :**
   Dans `SimulationEngine.start()`, un timer JavaScript tourne à 20 Hz (intervalle de 50 ms) :
   ```typescript
   this.timerId = window.setInterval(() => {
     const now = Date.now();
     const elapsed = (now - this.lastTickTimestamp) / 1000;
     const dt = Math.min(0.2, elapsed) * this.state.speedMultiplier;
     this.step(dt);
   }, 50);
   ```

2. **Séquence des calculs dans `SimulationEngine.step(dt)` :**
   - **Étape A :** `processEngine.solveNetwork(components, connections, fluid, dt)` calcule les débits, pressions de refoulement, pertes de charge et vitesses.
   - **Étape B :** `instrumentEngine.processInstrument(...)` lit les vraies valeurs du procédé ($Q, P, T, L$), applique le filtre et génère les alarmes ($HH, H, L, LL$).
   - **Étape C :** `controlEngine.updateController(...)` exécute les régulateurs PID ($FC\text{-}101, PC\text{-}101$) en comparant consigne ($SP$) et mesure ($PV$).
   - **Étape D :** L'actionneur ajuste la position de la vanne motorisée $FV\text{-}101$ selon son slew rate.
   - **Étape E :** La télémétrie horodatée est enregistrée dans le buffer d'historique (pour affichage graphique et export CSV).
   - **Étape F :** `this.notify()` transmet les données calculées à React via `setCircuit`, `setSimState` et `setAlarms`.

---

## Étape 6 — Logique des Équipements et Instruments

Chaque équipement possède un comportement spécifique modélisé :

- **Pompe centrifuge (`pump`) :**
  - Paramètres d'entrée : `pumpSpeedRpm`, `pumpMaxHeadM`, `pumpEfficiency`, `pumpState`.
  - Calculs : Hauteur manométrique, puissance absorbée en kW, pression de refoulement.
  - Sécurités : Détection de risque de cavitation si la pression d'aspiration $P_{\text{asp}} < 0.15\text{ bar}$ (alarme NPSH faible) ou disjonction (`trip`) si $P_{\text{asp}} < 0\text{ bar}$.
- **Vanne de régulation (`control_valve`) :**
  - Paramètres d'entrée : `valveOpeningPct`, `valveType`.
  - Calculs : Coefficient $C_v$, perte de charge $\Delta P$, indice de cavitation $\sigma$.
  - Alertes : Alerte de colmatage si ouverture $< 15\%$ avec pulpe chargée.
- **Réservoir (`tank`) :**
  - Paramètres d'entrée : `tankVolumeM3`, `tankMaxLevelM`, `currentLevelPct`.
  - Calculs : Pression hydrostatique au fond du bac ($P = 1.0 + \frac{\rho g h}{10^5}$), intégration continue du niveau.
- **Hydrocyclone (`hydrocyclone`) :**
  - Séparation solide/liquide avec partage de flux : sous-verse (underflow) concentrée à 35% du débit d'alimentation, surverse (overflow) clarifiée.
- **Transmetteurs & Contrôleurs (`FT`, `PT`, `LT`, `TT`, `FC`, `PC`, `LC`) :**
  - Échantillonnage, filtrage, génération d'alarmes visuelles et sonores, régulation PID en mode `auto` ou `manual`.

---

## Étape 7 — Exemple Pratique : Modifier un Calcul Pas-à-Pas

Imaginons que vous souhaitiez **modifier la courbe de hauteur manométrique de la pompe** pour simuler une pompe plus puissante avec une courbe plus plate.

### 1. Localiser la fonction
Ouvrez le fichier `src/simulation/hydraulicEquations.ts` et recherchez `calculatePumpPerformance`.

### 2. Examiner le code existant
```typescript
// Ligne ~295 dans hydraulicEquations.ts
const maxHead = maxHeadM * Math.pow(speedRatio, 2);
const headDrop = 0.00018 * Math.pow(Math.abs(flowRateM3h), 2);
const headM = Math.max(0, maxHead - headDrop);
```

### 3. Modifier la formule en toute sécurité
Par exemple, pour introduire un terme linéaire et un coefficient de chute plus faible :
```typescript
// Nouvelle formule personnalisée :
const headDrop = 0.00012 * Math.pow(Math.abs(flowRateM3h), 2) + 0.01 * Math.abs(flowRateM3h);
const headM = Math.max(0, maxHead - headDrop);
```

### 4. Vérifier la compilation
Dans le terminal du projet :
```bash
npm run build
```
Vérifiez que la compilation s'achève avec succès sans erreur de type TypeScript.

### 5. Tester le comportement dans l'application
- Démarrez la simulation via le bouton **DÉMARRER**.
- Observez le transmetteur de pression $PT\text{-}101$ et le débitmètre $FT\text{-}101$.
- Faites varier la vitesse de la pompe dans le panneau de propriétés de 1450 RPM à 1600 RPM et vérifiez que la pression réagit fidèlement à la nouvelle formule.

---

## Étape 8 — Tests, Validation et Prévention des Régressions

Pour valider vos modifications sans régressions :

1. **Vérification aux limites (Edge Cases) :**
   - **Débit nul ($Q = 0$) :** La pompe doit délivrer sa hauteur à vanne fermée ($H_0$), la perte de charge dans les tuyaux doit être strictement égale à zéro.
   - **Vanne 100% fermée ($X_v = 0\%$) :** La perte de charge $\Delta P$ de la vanne doit atteindre son maximum bridé, sans division par zéro.
   - **Vitesse de pompe nulle ($N = 0$) :** La pompe doit passer en état `trip`, et le débit doit descendre à 0.
2. **Cohérence des unités physiques :**
   - Toujours convertir les débits en $\text{m}^3/\text{s}$ avant d'utiliser la constante gravitationnelle $g = 9.80665\text{ m/s}^2$.
   - Diviser par $10^5$ pour passer des Pascals ($\text{Pa}$) aux bars ($\text{bar}$).
3. **Protection contre `NaN` et valeurs négatives :**
   - Utilisez systématiquement `Math.max(val, 0)` pour les grandeurs physiques qui ne peuvent être négatives (viscosité, pertes de charge, débits).

---

## Étape 9 — Dépannage et Diagnostic d'Erreurs Fréquentes

| Symptôme observé | Cause probable | Solution recommandée |
|---|---|---|
| Pression ou débit affiche `NaN` ou `Infinity` | Division par zéro dans le calcul de $C_v$, de la viscosité, ou racine carrée d'un nombre négatif. | Vérifier `Math.sqrt(...)` et ajouter des protections `Math.max(0.001, denominateur)`. |
| Le régulateur PID oscille violemment | Gain proportionnel $K_p$ trop élevé ou constante de temps intégrale $K_i$ excessive pour le temps de réponse de la boucle. | Réduire $K_p$ (ex: passer de 1.5 à 0.6) et diminuer $K_i$ (ex: 0.15 au lieu de 0.8). |
| L'équipement se désélectionne au clic | Propagation de l'événement de clic vers le fond du canvas SVG. | Vérifier que `e.stopPropagation()` est bien présent sur l'élément `<g>` de l'équipement dans `PAndIDCanvas.tsx`. |
| Erreur de type TypeScript lors de l'ajout d'une variable | La propriété n'est pas déclarée dans l'interface correspondante. | Ajouter le nouveau champ dans `src/types/process.ts` (`ProcessComponent['params']` ou `ProcessComponent['live']`). |

---

## Étape 10 — Bonnes Pratiques et Workflow de Développement

Pour modifier le code en toute sécurité :

1. **Sauvegarder une copie de travail :**
   Avant toute modification d'un fichier de calcul (`hydraulicEquations.ts` ou `processModel.ts`), dupliquez ou notez l'état initial des fonctions ciblées.
2. **Modifier un seul calcul à la fois :**
   Ne modifiez pas simultanément la formule de pompe et celle du régulateur PID. Ajustez une formule, vérifiez son comportement à l'écran, puis passez à la suivante.
3. **Tester sur les deux circuits :**
   Basculez entre la **Boucle Principale Régulée** et la **Ligne Classification & Décanteur CCD** pour vérifier que votre formule fonctionne aussi bien avec une boucle de débit qu'avec un banc d'hydrocyclones.
4. **Vérifier les thèmes :**
   Vérifiez que les nouveaux indicateurs ou valeurs numériques restent parfaitement lisibles en **Mode Clair** comme en **Mode Sombre**.

---

*Documentation technique officielle — Process Flow & Instrument Simulator (OCP Standard).*
