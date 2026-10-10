export interface ClockState {
  date?: string;      // DD-MM-YY
  t?: string;         // D# HH:MM
  phase?: string;     // Dawn | Morning | Afternoon | Dusk | Night | Late Night
  step?: number;
  location?: string;  // e.g. "Tendo Dojo"
  region?: string;    // e.g. "Nerima, Tokyo"
  country?: string;   // e.g. "Japan"
}

export interface SceneLatent {
  id?: string;
  who?: string;
  errand?: string;
  route?: string;
  window_opens?: string;
  status?: string;
}

export interface SceneState {
  place?: string;
  time?: string;
  participants?: string[];
  threads?: string[];
  pressures?: string[];
  recent_changes?: string[];
  recent_beats?: string[];
  constraints?: string;
  affordances?: string[];
  stall?: number;
  streak?: number;
  transients?: Array<Record<string, unknown> | string>;
  latents?: SceneLatent[];
  [key: string]: unknown;
}

export interface ActorOutfit {
  top?: string;
  bottom?: string;
  underwear_top?: string;
  underwear_bottom?: string;
  shoes?: string;
  footwear?: string;
  accessories?: string[] | string;
  jewelry?: string[] | string;
  hair?: string;
  makeup?: string;
  scent?: string;
  residue?: string[];
  integrity?: number;
  state?: string;
  [key: string]: unknown;
}

export interface ActorCombat {
  tier?: number | string;
  lv?: number | string;
  exp?: string | number;
  hp?: string | number;
  mp?: string | number;
  eff_pwr?: number;
  eff_agi?: number;
  pwr?: number;
  agi?: number;
  int?: number;
  talent?: string[] | string;
  [key: string]: unknown;
}

export interface ActorLifeModel {
  orientation?: string;
  romantic_history?: string;
  upbringing?: string;
  family?: string[] | string;
  occupation?: string;
  residence?: string;
  routines?: Array<[string, string, string, string] | Record<string, unknown>>;
  worldview?: string;
  self_concept?: string;
  [key: string]: unknown;
}

export interface ActorWounds {
  physical?: string[] | unknown[];
  psychological?: string[] | unknown[];
  [key: string]: unknown;
}

export interface ActorPassions {
  anger?: number;
  shame?: number;
  arousal?: number;
  fear?: number;
  stress?: number;
  pain?: number;
  exhaustion?: number;
  suspicion?: number;
  disgust?: number;
  sadness?: number;
  guilt?: number;
  joy?: number;
  [key: string]: number | undefined;
}

export interface ActorInventory {
  in_hand?: {
    L?: string;
    R?: string;
  };
  carried?: string[];
  room?: string[];
  room_location?: string;
  [key: string]: unknown;
}

export interface ActorDossier {
  id?: string;
  name?: string;
  appearance?: {
    age?: string | number;
    traits?: string;
    appeal?: number;
    style?: string;
    condition?: string;
    [key: string]: unknown;
  };
  money?: {
    in_hand?: number;
    in_bank?: number;
    currency?: string;
    [key: string]: unknown;
  };
  combat?: ActorCombat | Record<string, unknown>;
  life_model?: ActorLifeModel | Record<string, unknown>;
  wounds?: ActorWounds | Record<string, unknown>;
  trauma?: string[] | unknown[];
  constraints?: string;
  passions?: ActorPassions;
  outfit?: ActorOutfit;
  inventory?: ActorInventory;
  relations?: Record<string, Record<string, number | unknown>>;
  profile?: Record<string, unknown>;
  state?: Record<string, unknown>;
  agency?: Record<string, unknown>;
  knowledge?: Record<string, unknown>;
  stats?: Record<string, number | unknown>;
  voice?: string | { connectionId?: string; voice?: string; speed?: number };
  speech_style?: string;
  somatic?: Record<string, unknown>;
  psyche?: Record<string, unknown>;
  habits?: Record<string, unknown>;
  mot?: Record<string, unknown>;
  soc?: Record<string, unknown>;
  sec?: Record<string, unknown>;
  vec?: Record<string, unknown>;
  competence?: Record<string, unknown>;
  now?: Record<string, unknown>;
  sense?: Record<string, unknown>;
  goal_active?: Record<string, unknown>;
  need_active?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PlaceRoute {
  to: string;
  minutes: number | string;
  requires?: Record<string, unknown>;
  why_not?: string;
}

export interface PlaceNode {
  function?: string;
  users?: string;
  traffic?: number;
  privacy?: number;
  visibility?: number;
  access?: string;
  norm?: string;
  rhythm?: string;
  occ?: string;
  cohorts?: string[];
  resources?: string[];
  indoors?: boolean;
  population?: string;
  hazards?: string[];
  barriers?: string[];
  affordances?: string[];
  routes?: Array<PlaceRoute | Record<string, string | number>>;
  [key: string]: unknown;
}

export interface Opportunity {
  id: string;
  what?: string;
  wanted_by?: string[];
  noticed_by?: string[];
  cost?: Record<string, unknown> | string;
  payoff?: string;
  claimed_by?: string[];
  status?: string; // lead | taken | contested | lost
  due?: string;
  [key: string]: unknown;
}

export interface BPlotCarrier {
  what?: string;
  from?: string;
  eta?: string;
}

export interface BPlot {
  id?: string;
  who?: string;
  want?: string;
  doing?: string;
  knows?: string[] | string;
  next?: { move?: string; due?: string };
  scope?: "personal" | "household" | "neighborhood" | "city" | string;
  hooks?: string[] | string;
  carriers?: BPlotCarrier[];
  vector?: string;
  ripple?: number; // 1: Isolated, 2: Ambient Echo, 3: Collision
  status?: "active" | "dormant" | "resolved" | string;
  [key: string]: unknown;
}

export interface FrontNode {
  id?: string;
  cause?: string;
  stage?: string;
  due?: string;
  pressure?: number; // 0-5
  known_by?: string[];
  [key: string]: unknown;
}

export interface TravelNode {
  actor?: string;
  purpose?: string;
  from?: string;
  to?: string;
  depart?: string;
  eta?: string;
  status?: string;
  [key: string]: unknown;
}

export interface RosterCharacter {
  id: string;
  name?: string;
  lod?: number;
  status?: string;
  loc?: string;
  posture?: string;
  activity?: string;
  destination?: string;
  eta?: string;
  tick?: number | string;
  record?: string;
  [key: string]: unknown;
}

export interface JournalEntry {
  id: string;
  time?: string;
  place?: string;
  action?: string;
  outcome?: string;
  witnesses?: Record<string, unknown> | unknown[];
  effects?: Record<string, unknown> | unknown[];
  mutations?: string[];
  [key: string]: unknown;
}

export interface InvestigationTrack {
  authority: string;
  alert_level: number;
  clues: string[];
  target_id: string;
}

export interface LedgerData {
  world?: Record<string, unknown>;
  clock?: ClockState;
  scene?: SceneState;
  places?: Record<string, PlaceNode>;
  travel?: TravelNode[];
  roster?: RosterCharacter[];
  actors?: Record<string, ActorDossier>;
  bplots?: BPlot[];
  fronts?: FrontNode[];
  opportunities?: Opportunity[];
  journal?: JournalEntry[];
  [key: string]: unknown;
}

export interface CharacterSpriteLayers {
  base?: string;
  underwear?: string;
  outfit?: string;
  expression?: string;
  accessories?: string;
}

export type StageSlot = "far-left" | "left" | "center" | "right" | "far-right";

export interface StageCharacter {
  actorId: string;
  name: string;
  slot: StageSlot;
  isSpeaker: boolean;
  layers: CharacterSpriteLayers;
  spriteUrl?: string; // Fallback or composite URL
  emotion: string;
}

export interface StageBackground {
  url: string;
  isVideo?: boolean;
}

export interface DirectorNoteData {
  directorNote: string;
  threadLabel: string;
  timestamp?: string;
}

export interface DirectorNotePayload {
  type: "vn_director_note";
  data: DirectorNoteData;
}

export interface VnPresentationState {
  chatId: string;
  messageId: string;
  speakerName: string;
  speakerId?: string;
  paragraphs: string[];
  background: StageBackground;
  characters: StageCharacter[];
  ledger: LedgerData;
  hasBPlotNotification?: boolean;
  directorNote?: DirectorNoteData;
  bgmTrack?: string;
  bgmUrl?: string;
}

export interface AssetRecord {
  url: string;
  imageId?: string;
  uploadedAt?: string;
}

export interface AssetLibraryItem {
  id: string;
  name: string;
  url: string;
  category?: string;
  actorId?: string;
  outfit?: string;
  expression?: string;
  placeId?: string;
  uploadedAt: string;
}

export interface CharacterManifestEntry {
  outfits?: Record<string, Record<string, string>>; // outfit -> expression -> url
  actions?: Record<string, string>;                 // action -> url
  avatarFocus?: { x?: number; y?: number };         // face focal point in % (e.g. x: 50, y: 15)
  [key: string]: unknown;
}

export interface AssetManifest {
  places: Record<string, string>; // key: "scope:placeId" or "placeId" -> url
  characters: Record<string, CharacterManifestEntry>;
  cgs?: Record<string, string>; // event action/cg name -> url
  library?: AssetLibraryItem[];
}

export interface DirectorSettings {
  systemPrompt: string;
  userNotes: string;
  enabled: boolean;
}

export interface DirectorLogEntry {
  timestamp: string;
  directive: string;
  worldChanges: string[];
  npcChanges: Array<{
    actorId: string;
    name: string;
    wantNow?: string;
    passionsMoved?: Record<string, number>;
    relationsMoved?: Record<string, any>;
    attireChanged?: string;
  }>;
  mutations: string[];
}

export interface DiagnosticData {
  timestamp: string;
  chatId: string;
  messageId?: string;
  hasLedger: boolean;
  placeId: string;
  participants: string[];
  bgUrl: string;
}

export interface StatRulesSettings {
  statRules: string;
  ledgerPrompt: string;
  enabled: boolean;
  mode: "mvu_quiet" | "inline_interceptor" | "passive";
  rpgPrompt?: string;
}

export interface StatRulesSettingsPayload {
  type: "vn_stat_rules_settings";
  settings: StatRulesSettings;
}


