export const DEFAULT_STAT_RULES = `<stat_rules>
DATA: relations per target: A affinity, T trust, R respect (-100..100); At attraction, F fear, Fam, attachment, grudge (0..100); loyalty, sacrifice_willingness, betrayal_threshold. Transient emotions in passions (anger, shame, arousal, fear, stress, pain, exhaustion, suspicion, disgust, sadness, guilt, joy). Other named emotions (jealousy, longing, relief, pride, gratitude, loneliness, contempt, hope, curiosity, envy, embarrassment) = state.affect.episodes "name:target:intensity". Derived judgments are never stored. Debut values are not mutations. Edges start at 0 on the first meaningful interaction. Groups, institutions, non-human and animal NPCs use the same rules with their own values; animals run on F, A and need-driven wants.

GRV (event tier; pick the LOWEST that fits; tag every mutation with its GRV#; values are FIXED, never choose a number inside a range):
Tier | Primary edge | Secondary edge | Passion 1 | Passion 2 | Attachment | Events
GRV1 | 2 | 1 | 6 | 3 | 0 | brief gesture, small slight, flirt beat, small favor, rebuffed advance, minor lie, small kindness
GRV2 | 4 | 2 | 12 | 6 | 0 | meaningful kindness or offense, firm refusal, shared moment, kept small promise, clear threat, insult, boundary pushed
GRV3 | 8 | 4 | 22 | 11 | 2 | kept/broken promise, costly help, serious insult, public humiliation, confession, caught lie, violence without injury
GRV4 | 14 | 7 | 35 | 18 | 4 | rescue, betrayal, violence with injury, sustained intimacy, secret exposed, major sacrifice
GRV5 | 24 | 12 | 50 | 25 | 8 | death, deep betrayal, life saved at great cost; once per pair per arc, needs prior GRV3+ or life stakes
Fixed values: Fam +1 for meaningful two-way interaction (+2 shared hardship), once/scene/pair, never from a rebuffed act. Fear and grudge use the Primary column when they are the main axis. Episodes start at the Passion 1 value.
Axis profile by event (Primary / Secondary; Passion 1 / Passion 2):
- Unwelcome act refused or resisted: T- / A-, or F+ if forceful; anger, shame, disgust or fear by values / stress.
- Resisted act with interest shown in the reply: At +1 and arousal +3 only, regardless of tier.
- Kindness, help, gift: A+ / T+ or R+; joy / relief or gratitude.
- Promise kept or broken, lie caught: T / R, and grudge if broken; anger or guilt / stress.
- Insult, humiliation: grudge+ / A-; shame or anger / stress.
- Threat, violence: F+ / A-, grudge+; fear or pain / stress.
- Welcomed flirt or intimacy: At+ / A+; arousal / joy.
- Competence, courage: R+ / A+; pride episode.
- Betrayal: T- / A-, grudge+; anger, sadness / guilt in the betrayer.

Tier adjustment (one step max): up for surprise, an audience the NPC cares about, or a trauma match; down for routine-within-role or low stakes. Never above GRV3 unless someone bore cost or risk.
Sensitivity multiplier on every value: x0.5 (stoic, high impulse_control, low empathy, indifferent to the actor), x1.5 (volatile, trauma-linked, high status_sensitivity on a slight, strong bond to the actor), otherwise x1; round half up, minimum 1; apply once. Every delta must equal a table value times the multiplier; any other number is invalid.
Limits per NPC per turn: max 3 edge mutations, one per axis; max 2 passions (first at Passion 1, second at Passion 2). Several events in one turn: take the highest tier only, no stacking.

BOUNDS (anti-runaway):
Headroom: a move that pushes an axis past 40 is halved, past 70 quartered (signed axes by absolute value); T losses x1.5 before halving; minimum 1. Moves away from an extreme are unscaled.
Fam ceiling: A, T, attachment above 40 need Fam>=30; above 70 need Fam>=60 or a GRV4+ costly event. Attachment <= Fam+20 until GRV4. At from perception or flirting: GRV1 per event until Fam>=20.
Scene budget per pair per axis: net up <= +8, net down <= -14 (+14/-24 with GRV4+). When spent, further same-direction events give 0 until a new scene or a new GRV3+ event type.
Repetition: same act type, same pair: 1st full, 2nd half, 3rd+ 0 (track repetition_group/cooldown_until). New movement needs a new stimulus, changed presentation, or meaningful interaction.
Passions: per-turn change is the tier's Passion 1 value (max 22 unless GRV4+). With no new cause, a passion moves 20% of the gap toward baseline (min 2); episodes lose 1 intensity per 30 in-world min. Baseline = 0 unless set by dispositions/stress_default/trauma. Decay needs no mutation line. Passions never ratchet.
A, T, R, At, attachment never decay by clock; only events, NEGLECT or LOSS move them. Grudge returns to 0 slowly, trauma slowest. Fam fades only after long no-contact. Apology/costly amends: grudge-, T partly restored, never above the pre-breach value.

CAUSALITY: Perceive -> appraise -> transient response -> relation mutation -> decision. React from own beliefs, preferences, needs, passions, values, relations; the same event differs per NPC in direction AND size. Mutate from the reaction actually shown in the reply, never from the actor's intent or what the player wants. Each perceiver mutates only its own edge toward the actor; never mirror A->B onto B->A. Take the event type, tier, and axes from the Director's MUTATE slot when present, and apply the table values; the ledger copies this plan. Mutation integrity: every changed relation or passion (except decay) is one mutation line; \`effects\` derives from \`mutations\` only; memory tags match the net direction (negative if T or A fell, mixed if At rose while T fell).

APPRAISAL (derived, never stored): appeal, charm, repulsion, threat, warmth, credibility, temptation, desert, stance; from orientation/preferences, target properties, observed behavior, beliefs, wants/needs, relationship, norms, observers, perceived consequences. Context (witnesses, privacy, place, power gap as the NPC perceives it) and body state (pain, exhaustion, intoxication, illness, hunger) shade thresholds and lower impulse_control and patience; they never decide an outcome alone, create a want, or flip a value.

DEFAULT ZERO: Nothing moves to fill space. Greetings, routine politeness, fair trade or routine service, travel, waiting, passive observation, presence, speaking, proximity: no mutation (exception NEGLECT). Emit a mutation only if a specific event in this reply caused it. No reading -> mutations: []. Most turns are [].

PERCEPTION: Mere perception changes no edge. Exception: a salient, compatible stimulus the NPC merely observes (not an act done to them) may move At and passions (arousal/fear/disgust) up to GRV1. Appearance never changes T, R, A, Fam, loyalty, grudge, attachment. A transient response creates no goal.

COMPATIBILITY: Romantic/sexual At/arousal needs an age-appropriate adult matching the NPC's orientation/preferences. Incompatibility blocks it; curiosity, appreciation, respect, discomfort, indifference remain. Attraction never equals consent, willingness or action.

LAYERS: A liking; At romantic/sexual; T reliability/truth; R esteem; attachment bond/dependency; Fam familiarity. All independent. Axes may move together and do not cancel unless an event directly opposes (attractive+rude: At up, A/grudge down; charming+dangerous: interest and F up; disgusting+kind: disgust up, A/T up).

READING (NPC's own view):
UNWELCOME ACT (any act done to the NPC beyond their standing or boundary: touch, order, demand, request, gift, confession) by the reaction shown: refused/resisted/endured: no At, arousal or A gain; T-, A- (R- if disrespect); fear/anger/disgust/shame/suspicion by values; larger if witnessed or the NPC is vulnerable. Wanted but inhibited: At/arousal up to GRV1 only if the interest shows in the reply; T/A flat; shame/guilt+. Complied under duress: F+, T-, grudge+, never A/T gain. Welcomed: per the rows below.
Boundary respected (actor accepts a refusal or stops): T+, R+, suspicion/fear ease; once per boundary. Persisting after refusal or repeating a resisted act: F+, T-, A-, grudge+, suspicion+, one GRV tier worse per repeat; At never gains.
Kept promise/verified truth: T+, R+. Broken promise/caught exploitation: T-, grudge+; A- if bond damaged.
Cost-bearing kindness/help in danger/rescue: A+, T+, R+; record obligation (gratitude), sized by cost or risk borne. Duty-only help: T/R+ for reliability, not A.
Gift/favor/loan: obligation; A+ only if wanted and no strings believed; strings detected: T-, suspicion+. Unpaid debt past due: grudge by values.
Confidence shared in trust: T+, Fam+1, add to shared_secrets; leaked: T-, grudge+.
Comfort in vulnerability: T+, A+; attachment+ only if sustained. Care≠romance. Manipulative care: no bonus once insincerity believed.
Flattery: none unless personally meaningful. Praise/achievement: pride episode if self_concept values it; R+ toward praiser only if credible.
Reciprocal flirting (compatible, no boundary): At+, arousal+; A+ if welcomed. Unreciprocated: no At gain; irritation/discomfort/suspicion.
Teasing: playful (Fam>=30 or established, read as affectionate, no sensitive boundary): A+, Fam+. Hostile: shame/anger/grudge by intent and vulnerability.
Insult/humiliation: grudge+, A-; shame or rage by intent and temperament; worse before an audience the NPC cares about, and for a proud or high status_sensitivity NPC. Minor public faux pas: small shame, avoidance, no edge change unless the actor caused it.
Threat/violence: F+, A-; R+ only if the NPC's values read dominance as worthy, else R-. Harm taken: pain, anger/fear, grudge by values. Coercion: F and compliance only, never A/T. Awe or deference to perceived rank/power: R+/F+, may block or force compliance, never A/T by itself.
Orders: inside a recognized hierarchy get role compliance (R/obligation), resentment if abusive; outside it they are an UNWELCOME ACT.
Competence seen via result: R+. Cowardice: R- only if read as cowardice, not prudence. Fair contest: R by the NPC's values; mercy shown: R+, obligation if it was needed.
Rival gets what the NPC wants: suspicion/grudge/jealousy/envy only if it conflicts with the NPC's goal/bond/status; competition, never an edge change by itself.
Disgust: appearance-based = passion only; conduct-based gets its own reading. Contempt = R- (+disgust if conduct). Pity: sadness, small A+; R- if read as condescension.
Value clash on a core value: A-, R-; shared value affirmed: A+ small, once/scene. Group pressure: audience norms push low-status or high-sociability NPCs toward conformity; dissent has a cost.
Charm = observed effective behavior (timing, attentiveness, humor, competence, warmth), not beauty. Raises receptivity per NPC wants; never bypasses boundaries, red_lines, suspicion, evidence, decision.
Shared positive (enjoyed time, celebration, joint success; not routine): Fam+1, A+ small, joy+; sustained attachment+. Once/scene/pair.
Vicarious: bonded other succeeds/suffers: joy/sadness by attachment; no edge change unless the NPC contributed.
Intimacy (consensual adult): Fam+, At+; attachment+ only if meaningful/sustained. Aftermath by values: warmth, guilt, shame, regret. Never auto-bonds.
NEGLECT: bonded target repeatedly violates care/attention expectations: loneliness episode, A drifts down, attachment stalls, receptivity to alternatives+ (never action alone).
LOSS: bonded target dies/lost: sadness+; attachment decays slowly; grudge if blamed.
Map: admiration=R+; love=attachment+A; jealousy=episode when a bonded target's attention/status goes to a rival; resentment=grudge; disappointment=violated expectation -> T-/R-; surprise amplifies one tier.

MANIPULATION/DECEPTION: Charming/caring is not automatically trusted. Believed-genuine motive: benefit raises T/A. Detected instrumental use: T falls harder if a known vulnerability was exploited; grudge may rise. Works only if target beliefs can absorb it. Judge liar skill/integrity vs target belief confidence, trust, suspicion, source credibility, plausibility, direct evidence. High trust lowers suspicion; strong evidence overrides. Protective lies may preserve bond but still damage trust if found. Misleading truth/omission counts as a lie. Planted artifact = D at plausibility conf.

EVIDENCE: D witnessed full; R reported by trusted source half; I inferred quarter, mark "(false belief)" if wrong. Mutate from belief, not truth. Direct evidence may collapse a belief: recompute affected edges once from the corrected belief.

DECISION: Passions are impulses, not commands. Arousal>=60 is an eligible driver only with target opportunity and a viable action. At/attachment/A steer choice only when want_now points to the target or the situation activates the bond. Inhibitors, norms, observers, risk, self-concept, consequences stay active. Romantic action needs At/interest + compatible want + opportunity + no boundary/red_line + decision pass. Any act toward the NPC: routine acts within role/norms get ordinary cooperation unless the dossier gives a reason against; personal or extreme acts need standing matching their intrusiveness (T, A, At, F, R/authority, obligation, leverage), and without it the NPC hesitates, deflects, refuses or resists. Neither yielding nor refusing is a default.
FEAR STYLE: fight/flight/freeze/fawn by dispositions, escape routes and power gap; fawn is compliance under duress, never A/T.
TRAUMA TRIGGER: a stimulus matching trauma spikes passions one tier up (cap Passion 1 of GRV4) and the response follows defense (freeze, flee, fight, fawn, numb); T/A toward the actor fall only if the actor caused it.
TRAIT SCALING (only if set in dossier): shy/introverted: contact raises stress, Fam grows slower. Proud/status_sensitive: bigger shame/grudge from slights, smaller T from flattery. Stubborn: slower change both ways. Paranoid: suspicion floor, T gains halved. Empathetic: larger sadness/guilt. Narcissistic: R+ from admiration, grudge from criticism. Honor/religious/ideological: red_lines tied to values. Craving/dependency: need urgency can outrank social goals in want_now.
MOOD CARRYOVER: unresolved passions at scene start shade the first reading by one tier.

BETRAYAL/INFIDELITY: Eligible when gain/opportunity is meaningful, detection risk low, no red_line, and gain+grudge-loyalty-attachment >= betrayal_threshold. Not mandatory. Commitment to a partner is a cost, not a block, unless in red_lines. Infidelity: At/attachment to X + unmet need + opportunity + low detection must outweigh attachment + loyalty + values + fear of loss. Ambivalence allowed. Red_line break only if desperation, leverage and payoff are all high; then guilt/shame+ and a policy records the shift. After: others' T toward the betrayer falls (F+ if apt); betrayer guilt by values/EMP and attachment to the wronged. Betrayed: T drops to <=-50, A- hard, grudge+, retaliation goal may form; attachment may stay high.

WRONGDOER STANCE (NPC who wronged the actor): Derive REM/DEF/DET/AMB from guilt, defense, values, attachment, want_now, fault-view belief, secrets.exposure. Read every action toward them through it.
DESERT: before reading retaliation (insult, exposure, coldness, revenge), judge whether the NPC believes it deserved. Deserved+guilt: shame/guilt+, grudge small. Undeserved, disproportionate or DEF: grudge+, A-. Never auto-accepts punishment.
EXPOSED: caught with D evidence: fear, shame, guilt by stance; reply by defense/tells (deny, minimize, blame, confess). Never auto-confesses; update secrets.exposure.
Costly forgiveness: A+, T+, R+; guilt+ (REM/AMB). DEF reads weakness (R-) or entitlement; DET none. Kindness to the undeserving: REM guilt+; DEF suspects motive.
Silence/no-contact from a bonded target: REM/AMB sadness or fear; DEF anger; DET relief. Pleading: R- (DEF/DET), guilt+ (REM), A+ only AMB. Taking blame: REM guilt eases; DEF R-; no reward.
Hypocrisy (actor mirrors the act): jealousy by bond; grudge if DEF. Control (surveillance, phone-taking, isolation): boundary violation: F+, A-, grudge by thresholds, any stance. Assets/legal action/telling third parties: grudge/F by intent and status_sensitivity.

SELF-DIRECTED: Acting against own values/commitments: guilt+ by values, EMP, attachment to the wronged. Drives concealment, avoidance, overcompensation or confession per defense/tells.
THIRD-PARTY: Witnessed cruelty/violence/value-violation: F+ if self could be the target; R/A/disgust(conduct) by NPC values.
SCOPE: Mutate only involved actors, those whose goal/bond/status is touched, and witnesses at LOD>=2. LOD<2 and transients appraise statelessly; write edges on promotion. Offscreen: only the two involved mutate; others learn via R/I.
EXTREME TRAITS (obsession, jealousy, sadism, dependency, volatility): trigger -> threshold -> expression -> restraint (impulse_control/STB) -> mask. Under isolation or abuse, attachment may rise while T/A fall. Extreme traits widen passion swings (cap +50%) but never lift the BOUNDS on edges.

<population>
Population: Occ: band | basis
Cohorts: [Nx Type@Place/activity(flux); flux = stable|entering|leaving]

Who is here derives from place, time, and reasons, never from {{user}}'s presence or a wish for activity.
LADDER (escalate only when causally necessary): COHORT = background people in \`scene_cohorts\` (Nx Type@Place/activity(stable|entering|leaving)), non-interactive. LATENT = plausible optional person not yet present. TRANSIENT = manifested person in \`transients\`. PERSISTENT = full \`cast_<Name>__*\` entry.
PLACE PROFILE (\`place_<Name>\`; same underscore string as scene_loc), one line: function | users (who belongs; what legitimate outsiders come) | traffic 0-3 | privacy 0-3 | visibility 0-3 | access | norm | rhythm | routes | resources | disturbances | layout. Rhythm has SIX values in band order dawn,morning,midday,afternoon,evening,night using L/M/H/0, e.g. \`rhythm:L,M,H,M,L,0\`. Layout = areas as label=level,surface; connections. Derive once on first entry from setting, culture, and established facts; no stock templates. Change only by a logged cause.
OCCUPANCY = traffic x rhythm(band), +/-1 weather/events, 0 if closed, plus persistent-NPC routines. 0=Empty, L=Quiet/Light, M=Busy, H=Crowded. Write \`Occ: band | basis\`; re-derive on band/weather change, event, arrival, departure. Empty is valid.
LATENT (\`latent\`): id | loc | purpose | trait | need | window HH:MM-HH:MM | from | why
purpose = reason to be here; trait = temperament/ethics/confidence typical of the setting's population (opportunists, sellers, thieves, drunks, officials where the setting supports them); need = want; from = adjacent place/route. why REQUIRED: one stored reference (profile field, rhythm band, persistent-NPC routine, cascade id, weather, adjacent destination, or a visible opening such as an empty house, an unattended target, a lone customer); never {{user}}'s presence alone or drama. No valid why = invalid.
REFRESH ONLY ON: entering a place; time-band change; weather/event change; a persistent NPC's routine placing someone on a route here.
CAPS by traffic: 0 -> 0-1; 1 -> 1; 2 -> 2; 3 -> 4. Unused latents expire silently. On location change delete old-place latents; return regenerates from profile and clock.
ARRIVAL: a latent surfaces only as a selected candidate with an open window, a route passing here, an opening, and a stated reason. Max 1 new actor per beat, max 3 transients present. Persistent NPCs arrive via away/cascade.
TRANSIENT (\`transients\`): latent fields plus attn 0/1/2 | risk L/M/H | knows | exit. It is a compact drive: purpose = Want, need = pressure, exit = Due.
EXIT (any one): goal done; window reached; new obligation; discomfort; danger; recognition of someone; better opportunity; weather; staying is useless. STAY: a stimulus, opportunity, or obligation that fits their need and trait may replace purpose and defer the exit; write the new purpose. A PRESENT PERSISTENT NPC may also leave or turn away on a stimulus, mood, or obligation: write their away (loc | activity | ETA | lastTick) and render the departure. A departing transient with an unfinished purpose or a recurring routine becomes an arrival/appointment cascade (seed = its id); otherwise delete it.
PROMOTION to persistent when one holds: second interaction in a distinct scene; relationship change; cascade-linked secret; drive Due outliving exit; {{user}} actively seeks them. Name or pleasant chat alone is not promotion.
ATTENTION: an actor notices a stimulus only if REACH (line of sight, earshot, light, noise masking, facing) AND DRAW (salience, novelty, or need match exceeds absorption). T2/T3 in reach are always noticed. Not noticed = no reaction, and narration must not treat them as aware.
AUDIENCE SHIFT: arrival/departure/new attention makes actors with pending optional acts re-evaluate Cost (continue, retreat, reword, conceal, delay, leave).
ENVIRONMENT: STATE -> AFFORDANCE -> ACTOR INTERACTION -> CONSEQUENCE. Props and portals are stored state (prop_<Name>, portal_<Name>) and may carry an owner or linked drive; a prop records its holder and hand. Weather, wetness, dirt, injury, noise, and smell attach only through stored state or a caused event; outside conditions reach an interior only as far as a portal or wall lets them. Weather is stored in env_weather and changes only by a logged cause or an AMBIENT event.
</population>
</stat_rules>`;

export const DEFAULT_LEDGER_PROMPT = `LEDGER (after prose; authoritative world state):
1. TURN 1: emit baseline dossier (appearance, money, combat, life_model, outfit, inventory, profile, relations).
2. AFTER TURN 1 = COMPACT DELTA, ZERO STATIC LEAK. The extension permanently stores and merges state; NEVER re-emit unchanged fields.
  * Omit ## World and ## Places unless location or rules shifted (\`clock\` is still always emitted).
  * \`user\`: delta only; omit unchanged appearance, combat, life_model.
  * Passions: moved keys only (\`passions: { anger: 20 }\`).
  * Combat: omit unless HP/MP moved (\`combat: { hp: "80/100" }\`).
  * Outfit: changed slot only (\`outfit: { top: "none" }\`); never re-emit unchanged slots.
  * Inventory: only the hand slot or carried prop that moved.
  * Journal: only the new event(s) from THIS reply (\`EVT-n\`); never reprint past records.
  * Actors with no state or gear shift this turn: omit dossier entirely.
3. Props exist in exactly one place (hand slot, container, or local \`places.resources\`); transfers are zero-sum.
4. Place keys MUST be prefixed with scope markers: use '@common:<name>' or '@public:<name>' for shared, town, or public places (e.g. '@public:district_square', '@common:tavern_hearth'), and '@<scope>:<room>' for private or enclosed premises (e.g. '@mansion:kitchen', '@nerima_high:classroom_2a'). This prevents background collision and distinguishes public zones from private quarters.
5. ALWAYS EMIT: clock, scene, roster, journal, open opportunities, bplots (\`id\` + changed fields only; ripple, status, due, carrier changes count as changed).
6. DIRECTOR INTEGRATION: Record each Director SEED once, as an NPC dossier stub, bplot, front, or world.facts line, then continue it from the ledger. On 'PROMOTE: id', raise that NPC to LOD 3, write a full dossier with edges starting at 0 toward {{user}}, and update the roster. Write journal memories and grudges into the NPC's dossier so the Response Gate can read them next turn. When a place is first entered or has resources: [], seed places.resources with 3-6 ordinary objects that fit its function, era, and setting (one large fixture, one small portable item, one item an inhabitant would use), with no plot value unless a ledger cause supports it. Add any fixture contents the Director gives in CANON to places.resources. Props exist in one place only; moves and consumption are zero-sum.

Always append this details block after prose:
<details><summary>📊 Ledger</summary>

## World
\`\`\`yaml
world:
  genre:
  facts: []
  calendar:
  currency: "$"
  time_scale:
  tone_weights:
  content_bounds:
  special_rules: []
  needs: []
  capabilities: []
  investigations: {} # authority: { alert_level: 0-3, clues: [], target_id: "" }
clock:
  date: "DD-MM-YY"
  t: "D# HH:MM"
  phase: "Morning" # Dawn | Morning | Afternoon | Dusk | Night | Late Night
  location: "Building or Venue"
  region: "District or City"
  country: "Country or Realm"
  step: N
init: complete or pending
\`\`\`

## Places

\`\`\`yaml
places:
  "@scope:place_id": # e.g. @common:district_plaza or @mansion:kitchen
    function: "Primary social or functional role"
    users: "Who belongs here and legitimate outsiders"
    traffic: 0-3
    privacy: 0-3
    visibility: 0-3
    access: "open | restricted | locked"
    norm: "Formal | Casual | Sacred | Dangerous | Private"
    rhythm: "L,M,H,M,L,0" # 6 bands: dawn, morning, midday, afternoon, evening, night
    occ: "band | basis" # e.g. "M | lunch rush", "0 | closed"
    cohorts: [] # background crowd: ["3x Commuter@Platform/waiting(stable)"]
    resources: []
    affordances: []
    routes:
      - { to: "@scope:place_id", minutes: 5 }
travel:
  - { actor: "", purpose: "", from: "", to: "", depart: "", eta: "", status: "" }
\`\`\`

## Roster

\`\`\`yaml
roster:
  - { id: "actor_id", name: "Display Name", lod: 3, status: "Active", loc: "@scope:place_id", record: "full", tick: 1 }
\`\`\`

## Actor dossiers

COMBAT TABLE (Lv0..10; copy directly):
T1 HP 100-300 | MP 50-150 | PWR=AGI 15-45 (+20 HP, +10 MP, +3 stats/lv)
T2 HP 400-1000 | MP 200-500 | PWR=AGI 50-150 (+60 HP, +30 MP, +10 stats/lv)
T3 HP 1500-4500 | MP 800-2300 | PWR 200-650 | AGI 200-700 (+300 HP, +150 MP, +45 PWR, +50 AGI/lv)
T4 HP 6000-18000 | MP 3000-9000 | PWR 800-2300 | AGI 800-2600 (+1200 HP, +600 MP, +150 PWR, +180 AGI/lv)
T5 HP 25000-75000 | MP 15000-45000 | PWR 3000-9000 | AGI 3500-10500 (+5000 HP, +3000 MP, +600 PWR, +700 AGI/lv)
Rules: underwear: underwear_top, underwear_bottom (or \`none\`).

\`\`\`yaml
user:
  appearance: { age: 18, traits: "athletic", appeal: 65, style: "casual", condition: "normal" }
  money: { in_hand: 50, in_bank: 500, currency: "$" }
  combat: { tier: 1, lv: 1, exp: "0/100", hp: "100/100", mp: "50/50", eff_pwr: 15, eff_agi: 15, pwr: 15, agi: 15, int: 10, talent: [] }
  passions: { anger: 0, shame: 0, arousal: 0, fear: 0, stress: 0, pain: 0, exhaustion: 0, suspicion: 0, disgust: 0, sadness: 0, guilt: 0, joy: 10 }
  outfit: { top: "t-shirt", bottom: "jeans", underwear_top: "none", underwear_bottom: "boxers", shoes: "sneakers", accessories: [], state: "clean" }
  inventory: { in_hand: { L: "Empty", R: "Empty" }, carried: [], room: [], room_location: "@user_residence:bedroom" }
  agency:
    want_now: "explore area"

actor_id:
  name: "Actor Name"
  voice: "" # host TTS voice tag or connection
  speech_style: ""
  appearance: { age: 18, traits: "", appeal: 0-100, style: "", condition: "" }
  somatic: { face: "[features]", wound: "[scar→origin→somatic]", sensory: "[gating/limits]", cycles: "[metabolism/vulnerabilities]", instincts: "[primal drives]" }
  psyche:
    ethos: "[type]"
    worldview: "[axiom]"
    self_story: "[self-belief]"
    misbelief: "[misbelief]"
    blindspot: "[blindspot]"
    contradictions: "[A↔B; C↔D]"
    mask: { pub: "[persona]", priv: "[intimate]", deep: "[truth]" }
    drv: { want: "[goal]", need: "[requirement]", fear: "[dread]" }
    patience: { erosion: "[triggers]", warn: "[tell]", break: "[at zero]", recov: "[method+duration]" }
    coping: { prim: "[type]", sec: "[fallback]" }
    comp: 0-100
  habits: { hab: "[trigger→behavior→cost]", pol: ["[trigger→tendency]"] }
  trauma: { origin: "[event]", fear: "[dread]", cascade: "[behaviors]" }
  mot: { goal: "[obj]", want: "[desire]", amb: "[Step1→Step2→Terminal]", hard: "[refusal]", soft: "[negotiable]", ceil: "[ceiling]", break: "[shatter trigger]", praise: "[yield trigger]", tempt: "[vice hook]" }
  soc: { reg: { up: "[superior]", peer: "[equal]", down: "[subordinate]", stranger: "[unknown]" }, disgust: "[stimulus→contempt]", dependents: [], allegiance: "[faction|depth]", asset: "[leverage]" }
  sec: { fact: "[truth]", cover: "[story]", holder: [], risk: 0-5, lev: "[target→asset→cost]" }
  vec: { E: "[Ethos]", C: "[Coping]", A: "[Attachment]", D: "[Dynamic]" }
  competence: { master: ["[stress-immune skills]"], journeyman: ["[panic-degraded]"], novice: ["[stress-collapsing]"] }
  now: { urge: "[impulse]", def: "[coping defense]", mask: "[active persona]", focus: "[attention target]", thought: "[internal assessment]", action: "[movement/positioning]", spoken: "[dialogue per voice/register]" }
  sense: { focus: "[stimulus]", gaze: "Av|Lk|Co|Gl", load: "N|M|H" }
  goal_active: { task: "[obj]", step: "1/3", act: "[action]", preocc: "[concern]", plan: "[next]" }
  need_active: { drive: "Want:[motive]→Plan:[method]→Progress:[status]", conflict: "Opp:[target]|Stakes:[lvl]|Threat:[0–5]", instinct: "Core:[archetype]|Trigger:[trigger]|State:[state]", override: 0, impulse: "[urge]" }
  money: { in_hand: 0, in_bank: 0, currency: "$" }
  combat: { tier: 1-10, lv: 0-10, exp: "0/100", hp: "cur/max", mp: "cur/max", eff_pwr: 15, eff_agi: 15, pwr: 15, agi: 15, int: 10, talent: [] }
  life_model: { orientation: "pansexual", romantic_history: "none", upbringing: "strict", family: [], occupation: "student", residence: "@tendo_residence:room", routines: [["morning", "tea", "@tendo_residence:kitchen", "07:00"]], worldview: "stoic", self_concept: "competent" }
  wounds: { physical: [], psychological: [] }
  passions: { anger: 0, shame: 0, arousal: 0, fear: 0, stress: 10, pain: 0, exhaustion: 0, suspicion: 15, disgust: 0, sadness: 0, guilt: 0, joy: 5 }
  constraints: ""
  outfit: { top: "", bottom: "", underwear_top: "", underwear_bottom: "", shoes: "", accessories: [], state: "" }
  inventory: { in_hand: { L: "Empty", R: "Empty" }, carried: [], room: [], room_location: "" }
  profile:
    public_roles: []
    dispositions: { risk: 50, assertiveness: 50, empathy: 50, impulse_control: 50, curiosity: 50, sociability: 50, status_sensitivity: 50, acquisitiveness: 50, persistence: 50 }
    capabilities: {}
    values: []
    self_concept: []
    boundaries: []
    red_lines: []
    defense: ""
    blind_spot: ""
    tells: { lying: "", hurt: "", shame: "" }
    stress_default:
  state: { condition: "", needs: {}, affect: { valence: 0, arousal: 0, control: 0, episodes: [] }, resources: {} }
  agency:
    goals: []
    plans: []
    policies: []
    commitments: []
    want_now: "want (source, cost)"
  relations:
    user: { affinity: 0, trust: 0, respect: 0, attraction: 0, grudge: 0, fear: 0, familiarity: 0, attachment: 0, loyalty: 0, sacrifice_willingness: 0, betrayal_threshold: 50, shared_secrets: [], leverage: [], grievances: [], obligations: [] }
  knowledge:
    beliefs: [["user is new visitor", 80, "direct", "observed", "D1 12:00"]]
    Opinion: []
    memories: []
    expectations: []
    grudges: []
    secrets: []
    Promises: []
    held_leverage: []
    presents_as: { audience: "composed" }
    Recent Interaction: []
  stats: { T: 0, A: 0, R: 0, F: 0, Fam: 0, G: 0, Integ: 80, Stress: 10, CAU: 60, GRD: 50, PRD: 70, EMP: 40, STB: 70, BLD: 10, RX: 30, RC: 40, Rig: 50, Mask: 40, MIS: 10, WV: 60, COMP: 30 }
\`\`\`

## Scene

\`\`\`yaml
scene:
  player_intent:
  place: "scope:place_id"
  time:
  participants: []
  threads: []
  pressures: []
  recent_changes: []
  recent_beats: []
  constraints:
  affordances: []
  stall: N
  streak: N
  transients: [id, purpose, loc, want, exit_cause]
  latents: [id, who, errand, route, window_opens, status]
\`\`\`

## Fronts

\`\`\`yaml
fronts:
  - {id: , cause: , stage: <phase name>, due: , tempo: , pressure: 0-5, if_ignored: , player: , known_by: []}
\`\`\`

## Journal

\`\`\`yaml
journal:
  - id: EVT-n
    time:
    place: "scope:place_id"
    cause: []
    actors: []
    action:
    outcome: full or partial or fail
    sensory: only if it changes who perceives
    witnesses: [actor: confidence]
    effects: [target: change]
    opp: [opportunity ids touched]
    mutations: ["Actor.STAT@Target old->new | cause | D/R/I | GRV#", "user.money.in_hand -20 | vendor.money.in_hand +20"]
    dice: ev, lane, flavor, intensity, cand, origin, d20
    repetition_group:
    cooldown_until:
    novel: false
\`\`\`

## B-Plots

\`\`\`yaml
  - id: "bp_id"
    who: "distant person/group/institution outside the local cast"
    want: "their goal, in their own terms"
    doing: "current routine, miles away"
    knows: ["belief about the local cast; may be partial or wrong"]
    next: {move: "next move if uninterrupted", due: "D# HH:MM"}
    phase: "Incubation"        # NEW
    tempo: "5-10d"             # NEW
    player: "unaware"          # NEW: unaware|heard|involved|resolved
    factions: []               # NEW (optional)
    if_ignored: ""             # NEW: natural outcome
    clues: []                  # NEW
    chain: [{system: , effect: , after: , via: }]   # NEW
    scope: "personal" # personal | household | neighborhood | city
    hooks: ["npc_id, front id, secret, or opportunity touched"]
    carriers: [{what: "person/message/image/purchase/record carrying local news outward", from: "npc_id or source", eta: "D# HH:MM"}]
    vector: "ordinary way the ripple reaches the scene (call, bill, delivery, visit, remark, notice); must match ripple stage"
    ripple: 1 # Stage 1 (isolated) | Stage 2 (ambient echo) | Stage 3 (collision); never lowered
    status: "active" # active | dormant | resolved
\`\`\`

## Opportunities
\`\`\`yaml
opportunities:
  - id: "opp_id"
    what: "contestable opening"
    wanted_by: ["npc_id"]
    noticed_by: ["npc_id"]
    readings: {npc_id: ["verb", 80, "basis"]}
    cost: {npc_id: "cost description"}
    payoff: "payoff description"
    claimed_by: []
    status: lead
    due: "expiry condition"
\`\`\`
</details>`;
