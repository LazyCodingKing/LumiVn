export interface ClockState {
  date?: string;      // DD-MM-YY
  t?: string;         // D# HH:MM
  phase?: string;     // Dawn | Morning | Afternoon | Dusk | Night | Late Night
  step?: number;
  location?: string;  // e.g. "Tendo Dojo"
  region?: string;    // e.g. "Nerima, Tokyo"
  country?: string;   // e.g. "Japan"
}

export interface SceneState {
  place?: string;
  time?: string;
  participants?: string[];
  threads?: string[];
  pressures?: string[];
  recent_changes?: string[];
  recent_beats?: string[];
}

export interface ActorOutfit {
  top?: string;
  bottom?: string;
  underwear_top?: string;
  underwear_bottom?: string;
  shoes?: string;
  accessories?: string[];
  state?: string;
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
}

export interface ActorInventory {
  in_hand?: {
    L?: string;
    R?: string;
  };
  carried?: string[];
  room?: string[];
  room_location?: string;
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
  };
  money?: {
    in_hand?: number;
    in_bank?: number;
    currency?: string;
  };
  combat?: Record<string, unknown>;
  passions?: ActorPassions;
  outfit?: ActorOutfit;
  inventory?: ActorInventory;
  relations?: Record<string, Record<string, number | unknown>>;
  profile?: Record<string, unknown>;
  state?: Record<string, unknown>;
  agency?: Record<string, unknown>;
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
  traffic?: number;
  privacy?: number;
  visibility?: number;
  access?: string;
  norm?: string;
  rhythm?: string;
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

export interface BPlot {
  id: string;
  who?: string;
  doing?: string;
  vector?: string;
  ripple?: number; // 1: isolated | 2: ambient echo (news/text/siren) | 3: collision
  status?: string; // active | converged | fizzled
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

export interface LedgerData {
  world?: Record<string, unknown>;
  clock?: ClockState;
  scene?: SceneState;
  places?: Record<string, PlaceNode>;
  roster?: Array<{ id: string; name?: string; lod?: number; status?: string; loc?: string; posture?: string; activity?: string; [key: string]: unknown }>;
  actors?: Record<string, ActorDossier>;
  bplots?: BPlot[];
  opportunities?: Opportunity[];
  journal?: JournalEntry[];
  travel?: Array<{ actor: string; purpose?: string; from?: string; to: string; eta?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface CharacterSpriteLayers {
  base?: string;
  underwear?: string;
  outfit?: string;
  expression?: string;
  accessories?: string;
}

export interface StageCharacter {
  actorId: string;
  name: string;
  slot: "left" | "center" | "right";
  isSpeaker: boolean;
  layers: CharacterSpriteLayers;
  spriteUrl?: string; // Fallback or composite URL
  emotion: string;
}

export interface StageBackground {
  url: string;
  isVideo?: boolean;
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
}

export interface AssetRecord {
  url: string;
  imageId?: string;
  uploadedAt?: string;
}

export interface AssetManifest {
  places: Record<string, string>; // key: "scope:placeId" or "placeId" -> url
  characters: Record<string, {
    outfits?: Record<string, Record<string, string>>; // outfit -> expression -> url
    actions?: Record<string, string>;                 // action -> url
  }>;
  cgs?: Record<string, string>; // event action/cg name -> url
}

