// src/backend/storage.ts
var DEFAULT_MANIFEST = {
  places: {},
  characters: {}
};
var DEFAULT_DIRECTOR_SETTINGS = {
  systemPrompt: `You are LumiWorld, the private world-state director and area orchestrator for an interactive Lumiverse simulation.

Decide what the living world does behind the next visible reply. You direct logistics, routine, and texture. You never write the reply, never speak for NPCs, and never decide what {{user}} does, thinks, or feels.

INPUTS (use only what you can see; never invent beyond them): clock, roster (lod, loc, status), places and routes, fronts, bplots (including want, knows, next.due, carriers), opportunities, scene.latents, world.facts, the last reply, your previous director note. If a field is not visible, skip whatever depends on it.

CRITICAL CONSTRAINTS
- ZERO RECAP: Never summarize or restate recent dialogue or events. Never write "{{user}} asks..." or "<NPC> feels...".
- IMPERATIVE ONLY: Every sentence starts with a command verb (Make, Let, Have, Keep, Escalate, Route, Force, Hold, Delay, Seed, Shift, Withhold, Bring, Cut).
- NO SCRIPTED SPEECH: No quoted lines. Give each NPC a tactic and a cost, never words.
- NO PLAYER CONTROL: Never dictate {{user}}'s actions, reactions, or outcomes. NPCs may initiate; the command ends at the attempt.
- OPENING RULE: The reply must open on the direct consequence of {{user}}'s last input. World and texture details never lead; they interrupt, tied to an NPC's behavior, after the first beat.
- NATURAL CAUSALITY: Nothing happens to create drama. Every event needs an in-world cause already on the ledger (a due time, an ETA, a routine, a want). When nothing is due, the world is quiet, and a quiet note is valid. Never raise stakes, add coincidence, or time an arrival to suit the emotional moment.
- CONTINUITY LOCK: Reuse exact names, place keys, numbers, durations, and locations already established. Never rename a place key, change a number, or relocate a fact (a person established in one city does not move to another; two days does not become three). New facts enter only through CANON.
- NO NEW PROPS OR ROOMS MID-SCENE: Use only resources already listed in places. A new node needs a key, plus route minutes both ways.
- ANTI-LOOP: Compare with the last reply and your previous note. Never repeat the same prop gesture, sensory cue, B-plot vector, or opening verb in consecutive notes. A prop that was offered, pushed, or refused once is retired or changes function.
- PACING: A turn is about 1-3 in-world minutes. Nothing moves faster than route minutes. Anyone about to enter the scene gets a precursor (sound, shadow, message) one turn earlier and never before scene.latents window_opens.
- SETTING FIT: Match every detail to the established genre, era, technology, and tone in world.facts and tone_weights. Never import modern or out-of-genre elements into a setting that lacks them. Keep stakes at the scale the setting already has.

DIRECTIVE SLOTS (all required, in this order, 1-2 sentences each, whole note 120-240 words)
FIRST BEAT: Name which NPC answers or reacts to {{user}}'s last input first, and how (answer, dodge, counter, ignore at a cost). If the input asks about undefined canon, say here what that NPC reveals, withholds, or distorts.
WORLD: Move the surrounding area one believable step with public clockwork matched to setting, phase and weather (traffic, patrols, market bells, deliveries, shift changes, tides, neighbors, shifting light or weather). Place it as an interruption after the first beat, never as the opening. Reuse existing place keys; add a new node only if the scene needs it, at most one per three turns. Never repeat a public event within 15 in-world minutes.
OFFSCREEN: Pick 1-3 LOD 1-2 cast whose errand, shift, chore, or journey advances now. Name actor, activity, place key, and minutes remaining. Give each at most one perceptible trace for the present scene (sound, shadow, door, smell, message), or none if too far. Leave the rest on routine. At most one new arrival per turn.
PRESSURE: Default is hold. Check bplots: act only if a bplot's next.due has been reached or a carrier's eta has passed, and at least 15 in-world minutes have gone by since the last visible B-plot beat. If nothing qualifies, write 'Hold: nothing due' with the next due time, and add no trace. If something qualifies, state its current ripple stage, then command one ordinary trace that matches that stage (Stage 1: no local trace; Stage 2: one mundane echo through a vector not used last time; Stage 3: arrival). Never lower a ripple number. Let the actor respond in proportion to what it knows, and allow it to ignore, delay, misread, or settle peacefully. Aim a beat at a specific present NPC's want or secret only if the bplot's hooks already name it. Advance at most one B-plot per turn.
PRESENT: For each LOD 3 NPC, command one tactic that serves their own want_now, plus its cost (deflect, bargain, test, bait, withhold, stall, retreat, attack, change the subject, lie by omission). Aim NPCs at different targets: at most one reacts to {{user}}; the others pursue each other, a task, or the room. Never let two NPCs chase the same request or prop. Every cooperative act must serve the NPC's own aim. Keep guarded secrets at subtle-trace stage unless evidence forces the next stage.
VOICE: Give each speaking NPC one speech cue for this beat, drawn from stress, familiarity, and audience (answers with a question, trails off, over-explains a lie, clipped fragments, interrupts themself, says less than they mean). Make speech sound like a real person: contractions, plain words, correct grammar, short lines, no announced feelings, no speeches, no assistant phrasing. Cues must differ per NPC; swearing and catchphrases are not cues. NPCs may only reference what they perceived or were told.
TEXTURE: Command 2-3 concrete details from different senses, matched to place, phase, and weather, plus one environment change that alters where someone looks or stands. Make sources physically consistent (what makes the sound, how far, which floor). Time each detail to land mid-reply so it changes someone's behavior (a flinch, a glance, a pause). Prefer specific over atmospheric.
CANON: State any new fact the reply is about to establish (family ties, backstory, durations, locations) as one short line for world.facts, consistent with existing facts. If the player's question exposes ambiguous backstory (relatives, ex-partners, past events), pick one answer consistent with the ledger and record it; do not let NPCs dodge it just because it is undefined. NPCs may still answer partially, biased, or evasively, but never contradict the ledger.
END ON: Name one concrete unresolved physical or environmental moment where the reply stops, so {{user}} has a clean point to act. Not an NPC question aimed at {{user}}.

OUTPUT FORMAT
Return strictly one single-line JSON object on Line 1 inside a details block, nothing before or after:
{"director_note":"FIRST BEAT: ... WORLD: ... OFFSCREEN: ... PRESSURE: ... PRESENT: ... VOICE: ... TEXTURE: ... CANON: ... END ON: ...","thread_label":"<3-6 words naming the dominant live thread; keep it unchanged until the thread changes>"}
No double quotes, line breaks, or markdown inside values (use single quotes if needed).`,
  userNotes: "",
  enabled: true
};

class StorageManager {
  spindle;
  constructor(spindle2) {
    this.spindle = spindle2;
  }
  async getManifest() {
    try {
      const exists = await this.spindle.storage.exists("asset_manifest.json");
      if (exists) {
        const raw = await this.spindle.storage.read("asset_manifest.json");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read asset_manifest.json, using default:", e);
    }
    return { ...DEFAULT_MANIFEST };
  }
  async saveManifest(manifest) {
    try {
      await this.spindle.storage.write("asset_manifest.json", JSON.stringify(manifest, null, 2));
    } catch (e) {
      console.error("[LumiVN] Failed to save asset_manifest.json:", e);
    }
  }
  async getChatState(chatId) {
    try {
      const path = `chats/${chatId}/state.json`;
      const exists = await this.spindle.storage.exists(path);
      if (exists) {
        const raw = await this.spindle.storage.read(path);
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(`[LumiVN] Failed to read chat state for ${chatId}:`, e);
    }
    return null;
  }
  async saveChatState(chatId, state) {
    try {
      const dir = `chats/${chatId}`;
      if (!await this.spindle.storage.exists(dir)) {
        await this.spindle.storage.mkdir(dir);
      }
      await this.spindle.storage.write(`${dir}/state.json`, JSON.stringify(state, null, 2));
    } catch (e) {
      console.error(`[LumiVN] Failed to save chat state for ${chatId}:`, e);
    }
  }
  async saveMediaFile(relPath, dataUrlOrBase64) {
    try {
      const parts = relPath.split("/");
      if (parts.length > 1) {
        let currentDir = "";
        for (let i = 0;i < parts.length - 1; i++) {
          currentDir = currentDir ? `${currentDir}/${parts[i]}` : parts[i];
          if (!await this.spindle.storage.exists(currentDir)) {
            await this.spindle.storage.mkdir(currentDir);
          }
        }
      }
      let base64 = dataUrlOrBase64;
      if (base64.includes(",")) {
        base64 = base64.split(",")[1] ?? "";
      }
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0;i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      await this.spindle.storage.writeBinary(relPath, bytes);
      return relPath;
    } catch (e) {
      console.error(`[LumiVN] Failed to save media file to ${relPath}:`, e);
      throw e;
    }
  }
  async fileExists(path) {
    try {
      return await this.spindle.storage.exists(path);
    } catch {
      return false;
    }
  }
  async getDirectorSettings() {
    try {
      const exists = await this.spindle.storage.exists("director_settings.json");
      if (exists) {
        const raw = await this.spindle.storage.read("director_settings.json");
        return { ...DEFAULT_DIRECTOR_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read director_settings.json, using defaults:", e);
    }
    return { ...DEFAULT_DIRECTOR_SETTINGS };
  }
  async saveDirectorSettings(settings) {
    try {
      await this.spindle.storage.write("director_settings.json", JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error("[LumiVN] Failed to save director_settings.json:", e);
    }
  }
  async getDirectorLogs(chatId) {
    try {
      const path = `chats/${chatId}/director_logs.json`;
      const exists = await this.spindle.storage.exists(path);
      if (exists) {
        const raw = await this.spindle.storage.read(path);
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(`[LumiVN] Failed to read director logs for ${chatId}:`, e);
    }
    return [];
  }
  async saveDirectorLogs(chatId, logs) {
    try {
      const dir = `chats/${chatId}`;
      if (!await this.spindle.storage.exists(dir)) {
        await this.spindle.storage.mkdir(dir);
      }
      await this.spindle.storage.write(`${dir}/director_logs.json`, JSON.stringify(logs, null, 2));
    } catch (e) {
      console.error(`[LumiVN] Failed to save director logs for ${chatId}:`, e);
    }
  }
}

// node_modules/js-yaml/dist/js-yaml.mjs
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var jsYaml = {};
var loader = {};
var common = {};
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon)
    return common;
  hasRequiredCommon = 1;
  function isNothing(subject) {
    return typeof subject === "undefined" || subject === null;
  }
  function isObject(subject) {
    return typeof subject === "object" && subject !== null;
  }
  function toArray(sequence) {
    if (Array.isArray(sequence))
      return sequence;
    else if (isNothing(sequence))
      return [];
    return [sequence];
  }
  function extend(target, source) {
    if (source) {
      const sourceKeys = Object.keys(source);
      for (let index = 0, length = sourceKeys.length;index < length; index += 1) {
        const key = sourceKeys[index];
        target[key] = source[key];
      }
    }
    return target;
  }
  function repeat(string, count) {
    let result = "";
    for (let cycle = 0;cycle < count; cycle += 1) {
      result += string;
    }
    return result;
  }
  function isNegativeZero(number) {
    return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
  }
  common.isNothing = isNothing;
  common.isObject = isObject;
  common.toArray = toArray;
  common.repeat = repeat;
  common.isNegativeZero = isNegativeZero;
  common.extend = extend;
  return common;
}
var exception;
var hasRequiredException;
function requireException() {
  if (hasRequiredException)
    return exception;
  hasRequiredException = 1;
  function formatError(exception2, compact) {
    let where = "";
    const message = exception2.reason || "(unknown reason)";
    if (!exception2.mark)
      return message;
    if (exception2.mark.name) {
      where += 'in "' + exception2.mark.name + '" ';
    }
    where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
    if (!compact && exception2.mark.snippet) {
      where += `

` + exception2.mark.snippet;
    }
    return message + " " + where;
  }
  function YAMLException2(reason, mark) {
    Error.call(this);
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = formatError(this, false);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack || "";
    }
  }
  YAMLException2.prototype = Object.create(Error.prototype);
  YAMLException2.prototype.constructor = YAMLException2;
  YAMLException2.prototype.toString = function toString(compact) {
    return this.name + ": " + formatError(this, compact);
  };
  exception = YAMLException2;
  return exception;
}
var snippet;
var hasRequiredSnippet;
function requireSnippet() {
  if (hasRequiredSnippet)
    return snippet;
  hasRequiredSnippet = 1;
  const common2 = requireCommon();
  function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
    let head = "";
    let tail = "";
    const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
    if (position - lineStart > maxHalfLength) {
      head = " ... ";
      lineStart = position - maxHalfLength + head.length;
    }
    if (lineEnd - position > maxHalfLength) {
      tail = " ...";
      lineEnd = position + maxHalfLength - tail.length;
    }
    return {
      str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
      pos: position - lineStart + head.length
    };
  }
  function padStart(string, max) {
    return common2.repeat(" ", max - string.length) + string;
  }
  function makeSnippet(mark, options) {
    options = Object.create(options || null);
    if (!mark.buffer)
      return null;
    if (!options.maxLength)
      options.maxLength = 79;
    if (typeof options.indent !== "number")
      options.indent = 1;
    if (typeof options.linesBefore !== "number")
      options.linesBefore = 3;
    if (typeof options.linesAfter !== "number")
      options.linesAfter = 2;
    const re = /\r?\n|\r|\0/g;
    const lineStarts = [0];
    const lineEnds = [];
    let match;
    let foundLineNo = -1;
    while (match = re.exec(mark.buffer)) {
      lineEnds.push(match.index);
      lineStarts.push(match.index + match[0].length);
      if (mark.position <= match.index && foundLineNo < 0) {
        foundLineNo = lineStarts.length - 2;
      }
    }
    if (foundLineNo < 0)
      foundLineNo = lineStarts.length - 1;
    let result = "";
    const lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
    const maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
    for (let i = 1;i <= options.linesBefore; i++) {
      if (foundLineNo - i < 0)
        break;
      const line2 = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
      result = common2.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line2.str + `
` + result;
    }
    const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
    result += common2.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + `
`;
    result += common2.repeat("-", options.indent + lineNoLength + 3 + line.pos) + `^
`;
    for (let i = 1;i <= options.linesAfter; i++) {
      if (foundLineNo + i >= lineEnds.length)
        break;
      const line2 = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
      result += common2.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line2.str + `
`;
    }
    return result.replace(/\n$/, "");
  }
  snippet = makeSnippet;
  return snippet;
}
var type;
var hasRequiredType;
function requireType() {
  if (hasRequiredType)
    return type;
  hasRequiredType = 1;
  const YAMLException2 = requireException();
  const TYPE_CONSTRUCTOR_OPTIONS = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ];
  const YAML_NODE_KINDS = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function compileStyleAliases(map2) {
    const result = {};
    if (map2 !== null) {
      Object.keys(map2).forEach(function(style) {
        map2[style].forEach(function(alias) {
          result[String(alias)] = style;
        });
      });
    }
    return result;
  }
  function Type2(tag, options) {
    options = options || {};
    Object.keys(options).forEach(function(name) {
      if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
        throw new YAMLException2('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
      }
    });
    this.options = options;
    this.tag = tag;
    this.kind = options["kind"] || null;
    this.resolve = options["resolve"] || function() {
      return true;
    };
    this.construct = options["construct"] || function(data) {
      return data;
    };
    this.instanceOf = options["instanceOf"] || null;
    this.predicate = options["predicate"] || null;
    this.represent = options["represent"] || null;
    this.representName = options["representName"] || null;
    this.defaultStyle = options["defaultStyle"] || null;
    this.multi = options["multi"] || false;
    this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
    if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
      throw new YAMLException2('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
    }
  }
  type = Type2;
  return type;
}
var schema;
var hasRequiredSchema;
function requireSchema() {
  if (hasRequiredSchema)
    return schema;
  hasRequiredSchema = 1;
  const YAMLException2 = requireException();
  const Type2 = requireType();
  function compileList(schema2, name) {
    const result = [];
    schema2[name].forEach(function(currentType) {
      let newIndex = result.length;
      result.forEach(function(previousType, previousIndex) {
        if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
          newIndex = previousIndex;
        }
      });
      result[newIndex] = currentType;
    });
    return result;
  }
  function compileMap() {
    const result = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    };
    function collectType(type2) {
      if (type2.multi) {
        result.multi[type2.kind].push(type2);
        result.multi["fallback"].push(type2);
      } else {
        result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
      }
    }
    for (let index = 0, length = arguments.length;index < length; index += 1) {
      arguments[index].forEach(collectType);
    }
    return result;
  }
  function Schema2(definition) {
    return this.extend(definition);
  }
  Schema2.prototype.extend = function extend(definition) {
    let implicit = [];
    let explicit = [];
    if (definition instanceof Type2) {
      explicit.push(definition);
    } else if (Array.isArray(definition)) {
      explicit = explicit.concat(definition);
    } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
      if (definition.implicit)
        implicit = implicit.concat(definition.implicit);
      if (definition.explicit)
        explicit = explicit.concat(definition.explicit);
    } else {
      throw new YAMLException2("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    }
    implicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      if (type2.loadKind && type2.loadKind !== "scalar") {
        throw new YAMLException2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      }
      if (type2.multi) {
        throw new YAMLException2("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
      }
    });
    explicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
    });
    const result = Object.create(Schema2.prototype);
    result.implicit = (this.implicit || []).concat(implicit);
    result.explicit = (this.explicit || []).concat(explicit);
    result.compiledImplicit = compileList(result, "implicit");
    result.compiledExplicit = compileList(result, "explicit");
    result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
    return result;
  };
  schema = Schema2;
  return schema;
}
var str;
var hasRequiredStr;
function requireStr() {
  if (hasRequiredStr)
    return str;
  hasRequiredStr = 1;
  const Type2 = requireType();
  str = new Type2("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(data) {
      return data !== null ? data : "";
    }
  });
  return str;
}
var seq;
var hasRequiredSeq;
function requireSeq() {
  if (hasRequiredSeq)
    return seq;
  hasRequiredSeq = 1;
  const Type2 = requireType();
  seq = new Type2("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(data) {
      return data !== null ? data : [];
    }
  });
  return seq;
}
var map;
var hasRequiredMap;
function requireMap() {
  if (hasRequiredMap)
    return map;
  hasRequiredMap = 1;
  const Type2 = requireType();
  map = new Type2("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(data) {
      return data !== null ? data : {};
    }
  });
  return map;
}
var failsafe;
var hasRequiredFailsafe;
function requireFailsafe() {
  if (hasRequiredFailsafe)
    return failsafe;
  hasRequiredFailsafe = 1;
  const Schema2 = requireSchema();
  failsafe = new Schema2({
    explicit: [
      requireStr(),
      requireSeq(),
      requireMap()
    ]
  });
  return failsafe;
}
var _null;
var hasRequired_null;
function require_null() {
  if (hasRequired_null)
    return _null;
  hasRequired_null = 1;
  const Type2 = requireType();
  function resolveYamlNull(data) {
    if (data === null)
      return true;
    const max = data.length;
    return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
  }
  function constructYamlNull() {
    return null;
  }
  function isNull(object) {
    return object === null;
  }
  _null = new Type2("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  });
  return _null;
}
var bool;
var hasRequiredBool;
function requireBool() {
  if (hasRequiredBool)
    return bool;
  hasRequiredBool = 1;
  const Type2 = requireType();
  function resolveYamlBoolean(data) {
    if (data === null)
      return false;
    const max = data.length;
    return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
  }
  function constructYamlBoolean(data) {
    return data === "true" || data === "True" || data === "TRUE";
  }
  function isBoolean(object) {
    return Object.prototype.toString.call(object) === "[object Boolean]";
  }
  bool = new Type2("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    represent: {
      lowercase: function(object) {
        return object ? "true" : "false";
      },
      uppercase: function(object) {
        return object ? "TRUE" : "FALSE";
      },
      camelcase: function(object) {
        return object ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  });
  return bool;
}
var int;
var hasRequiredInt;
function requireInt() {
  if (hasRequiredInt)
    return int;
  hasRequiredInt = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  function isHexCode(c) {
    return c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
  }
  function isOctCode(c) {
    return c >= 48 && c <= 55;
  }
  function isDecCode(c) {
    return c >= 48 && c <= 57;
  }
  function resolveYamlInteger(data) {
    if (data === null)
      return false;
    const max = data.length;
    let index = 0;
    let hasDigits = false;
    if (!max)
      return false;
    let ch = data[index];
    if (ch === "-" || ch === "+") {
      ch = data[++index];
    }
    if (ch === "0") {
      if (index + 1 === max)
        return true;
      ch = data[++index];
      if (ch === "b") {
        index++;
        for (;index < max; index++) {
          ch = data[index];
          if (ch !== "0" && ch !== "1")
            return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "x") {
        index++;
        for (;index < max; index++) {
          if (!isHexCode(data.charCodeAt(index)))
            return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "o") {
        index++;
        for (;index < max; index++) {
          if (!isOctCode(data.charCodeAt(index)))
            return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
    }
    for (;index < max; index++) {
      if (!isDecCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }
    if (!hasDigits)
      return false;
    return isFinite(parseYamlInteger(data));
  }
  function parseYamlInteger(data) {
    let value = data;
    let sign = 1;
    let ch = value[0];
    if (ch === "-" || ch === "+") {
      if (ch === "-")
        sign = -1;
      value = value.slice(1);
      ch = value[0];
    }
    if (value === "0")
      return 0;
    if (ch === "0") {
      if (value[1] === "b")
        return sign * parseInt(value.slice(2), 2);
      if (value[1] === "x")
        return sign * parseInt(value.slice(2), 16);
      if (value[1] === "o")
        return sign * parseInt(value.slice(2), 8);
    }
    return sign * parseInt(value, 10);
  }
  function constructYamlInteger(data) {
    return parseYamlInteger(data);
  }
  function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common2.isNegativeZero(object));
  }
  int = new Type2("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    represent: {
      binary: function(obj) {
        return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
      },
      octal: function(obj) {
        return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
      },
      decimal: function(obj) {
        return obj.toString(10);
      },
      hexadecimal: function(obj) {
        return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  });
  return int;
}
var float;
var hasRequiredFloat;
function requireFloat() {
  if (hasRequiredFloat)
    return float;
  hasRequiredFloat = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  const YAML_FLOAT_PATTERN = new RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
  const YAML_FLOAT_SPECIAL_PATTERN = new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
  function resolveYamlFloat(data) {
    if (data === null)
      return false;
    if (!YAML_FLOAT_PATTERN.test(data)) {
      return false;
    }
    if (isFinite(parseFloat(data, 10))) {
      return true;
    }
    return YAML_FLOAT_SPECIAL_PATTERN.test(data);
  }
  function constructYamlFloat(data) {
    let value = data.toLowerCase();
    const sign = value[0] === "-" ? -1 : 1;
    if ("+-".indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }
    if (value === ".inf") {
      return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else if (value === ".nan") {
      return NaN;
    }
    return sign * parseFloat(value, 10);
  }
  const SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
  function representYamlFloat(object, style) {
    if (isNaN(object)) {
      switch (style) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    } else if (Number.POSITIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    } else if (Number.NEGATIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    } else if (common2.isNegativeZero(object)) {
      return "-0.0";
    }
    const res = object.toString(10);
    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
  }
  function isFloat(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common2.isNegativeZero(object));
  }
  float = new Type2("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    represent: representYamlFloat,
    defaultStyle: "lowercase"
  });
  return float;
}
var json;
var hasRequiredJson;
function requireJson() {
  if (hasRequiredJson)
    return json;
  hasRequiredJson = 1;
  json = requireFailsafe().extend({
    implicit: [
      require_null(),
      requireBool(),
      requireInt(),
      requireFloat()
    ]
  });
  return json;
}
var core;
var hasRequiredCore;
function requireCore() {
  if (hasRequiredCore)
    return core;
  hasRequiredCore = 1;
  core = requireJson();
  return core;
}
var timestamp;
var hasRequiredTimestamp;
function requireTimestamp() {
  if (hasRequiredTimestamp)
    return timestamp;
  hasRequiredTimestamp = 1;
  const Type2 = requireType();
  const YAML_DATE_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
  const YAML_TIMESTAMP_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
  function resolveYamlTimestamp(data) {
    if (data === null)
      return false;
    if (YAML_DATE_REGEXP.exec(data) !== null)
      return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null)
      return true;
    return false;
  }
  function constructYamlTimestamp(data) {
    let fraction = 0;
    let delta = null;
    let match = YAML_DATE_REGEXP.exec(data);
    if (match === null)
      match = YAML_TIMESTAMP_REGEXP.exec(data);
    if (match === null)
      throw new Error("Date resolve error");
    const year = +match[1];
    const month = +match[2] - 1;
    const day = +match[3];
    if (!match[4]) {
      return new Date(Date.UTC(year, month, day));
    }
    const hour = +match[4];
    const minute = +match[5];
    const second = +match[6];
    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) {
        fraction += "0";
      }
      fraction = +fraction;
    }
    if (match[9]) {
      const tzHour = +match[10];
      const tzMinute = +(match[11] || 0);
      delta = (tzHour * 60 + tzMinute) * 60000;
      if (match[9] === "-")
        delta = -delta;
    }
    const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (delta)
      date.setTime(date.getTime() - delta);
    return date;
  }
  function representYamlTimestamp(object) {
    return object.toISOString();
  }
  timestamp = new Type2("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
    represent: representYamlTimestamp
  });
  return timestamp;
}
var merge;
var hasRequiredMerge;
function requireMerge() {
  if (hasRequiredMerge)
    return merge;
  hasRequiredMerge = 1;
  const Type2 = requireType();
  function resolveYamlMerge(data) {
    return data === "<<" || data === null;
  }
  merge = new Type2("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: resolveYamlMerge
  });
  return merge;
}
var binary;
var hasRequiredBinary;
function requireBinary() {
  if (hasRequiredBinary)
    return binary;
  hasRequiredBinary = 1;
  const Type2 = requireType();
  const BASE64_MAP = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function resolveYamlBinary(data) {
    if (data === null)
      return false;
    let bitlen = 0;
    const max = data.length;
    const map2 = BASE64_MAP;
    for (let idx = 0;idx < max; idx++) {
      const code = map2.indexOf(data.charAt(idx));
      if (code > 64)
        continue;
      if (code < 0)
        return false;
      bitlen += 6;
    }
    return bitlen % 8 === 0;
  }
  function constructYamlBinary(data) {
    const input = data.replace(/[\r\n=]/g, "");
    const max = input.length;
    const map2 = BASE64_MAP;
    let bits = 0;
    const result = [];
    for (let idx = 0;idx < max; idx++) {
      if (idx % 4 === 0 && idx) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      }
      bits = bits << 6 | map2.indexOf(input.charAt(idx));
    }
    const tailbits = max % 4 * 6;
    if (tailbits === 0) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    } else if (tailbits === 18) {
      result.push(bits >> 10 & 255);
      result.push(bits >> 2 & 255);
    } else if (tailbits === 12) {
      result.push(bits >> 4 & 255);
    }
    return new Uint8Array(result);
  }
  function representYamlBinary(object) {
    let result = "";
    let bits = 0;
    const max = object.length;
    const map2 = BASE64_MAP;
    for (let idx = 0;idx < max; idx++) {
      if (idx % 3 === 0 && idx) {
        result += map2[bits >> 18 & 63];
        result += map2[bits >> 12 & 63];
        result += map2[bits >> 6 & 63];
        result += map2[bits & 63];
      }
      bits = (bits << 8) + object[idx];
    }
    const tail = max % 3;
    if (tail === 0) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    } else if (tail === 2) {
      result += map2[bits >> 10 & 63];
      result += map2[bits >> 4 & 63];
      result += map2[bits << 2 & 63];
      result += map2[64];
    } else if (tail === 1) {
      result += map2[bits >> 2 & 63];
      result += map2[bits << 4 & 63];
      result += map2[64];
      result += map2[64];
    }
    return result;
  }
  function isBinary(obj) {
    return Object.prototype.toString.call(obj) === "[object Uint8Array]";
  }
  binary = new Type2("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
    represent: representYamlBinary
  });
  return binary;
}
var omap;
var hasRequiredOmap;
function requireOmap() {
  if (hasRequiredOmap)
    return omap;
  hasRequiredOmap = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const _toString = Object.prototype.toString;
  function resolveYamlOmap(data) {
    if (data === null)
      return true;
    const objectKeys = {};
    const object = data;
    for (let index = 0, length = object.length;index < length; index += 1) {
      const pair = object[index];
      let pairHasKey = false;
      if (_toString.call(pair) !== "[object Object]")
        return false;
      let pairKey;
      for (pairKey in pair) {
        if (_hasOwnProperty.call(pair, pairKey)) {
          if (!pairHasKey)
            pairHasKey = true;
          else
            return false;
        }
      }
      if (!pairHasKey)
        return false;
      if (_hasOwnProperty.call(objectKeys, pairKey))
        return false;
      Object.defineProperty(objectKeys, pairKey, { value: true });
    }
    return true;
  }
  function constructYamlOmap(data) {
    return data !== null ? data : [];
  }
  omap = new Type2("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
  });
  return omap;
}
var pairs;
var hasRequiredPairs;
function requirePairs() {
  if (hasRequiredPairs)
    return pairs;
  hasRequiredPairs = 1;
  const Type2 = requireType();
  const _toString = Object.prototype.toString;
  function resolveYamlPairs(data) {
    if (data === null)
      return true;
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length;index < length; index += 1) {
      const pair = object[index];
      if (_toString.call(pair) !== "[object Object]")
        return false;
      const keys = Object.keys(pair);
      if (keys.length !== 1)
        return false;
      result[index] = [keys[0], pair[keys[0]]];
    }
    return true;
  }
  function constructYamlPairs(data) {
    if (data === null)
      return [];
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length;index < length; index += 1) {
      const pair = object[index];
      const keys = Object.keys(pair);
      result[index] = [keys[0], pair[keys[0]]];
    }
    return result;
  }
  pairs = new Type2("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
  });
  return pairs;
}
var set;
var hasRequiredSet;
function requireSet() {
  if (hasRequiredSet)
    return set;
  hasRequiredSet = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  function resolveYamlSet(data) {
    if (data === null)
      return true;
    const object = data;
    for (const key in object) {
      if (_hasOwnProperty.call(object, key)) {
        if (object[key] !== null)
          return false;
      }
    }
    return true;
  }
  function constructYamlSet(data) {
    return data !== null ? data : {};
  }
  set = new Type2("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: resolveYamlSet,
    construct: constructYamlSet
  });
  return set;
}
var _default;
var hasRequired_default;
function require_default() {
  if (hasRequired_default)
    return _default;
  hasRequired_default = 1;
  _default = requireCore().extend({
    implicit: [
      requireTimestamp(),
      requireMerge()
    ],
    explicit: [
      requireBinary(),
      requireOmap(),
      requirePairs(),
      requireSet()
    ]
  });
  return _default;
}
var hasRequiredLoader;
function requireLoader() {
  if (hasRequiredLoader)
    return loader;
  hasRequiredLoader = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const makeSnippet = requireSnippet();
  const DEFAULT_SCHEMA2 = require_default();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CONTEXT_FLOW_IN = 1;
  const CONTEXT_FLOW_OUT = 2;
  const CONTEXT_BLOCK_IN = 3;
  const CONTEXT_BLOCK_OUT = 4;
  const CHOMPING_CLIP = 1;
  const CHOMPING_STRIP = 2;
  const CHOMPING_KEEP = 3;
  const PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
  const PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
  const PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
  const PATTERN_TAG_URI = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }
  function isEol(c) {
    return c === 10 || c === 13;
  }
  function isWhiteSpace(c) {
    return c === 9 || c === 32;
  }
  function isWsOrEol(c) {
    return c === 9 || c === 32 || c === 10 || c === 13;
  }
  function isFlowIndicator(c) {
    return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
  }
  function fromHexCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    const lc = c | 32;
    if (lc >= 97 && lc <= 102) {
      return lc - 97 + 10;
    }
    return -1;
  }
  function escapedHexLen(c) {
    if (c === 120) {
      return 2;
    }
    if (c === 117) {
      return 4;
    }
    if (c === 85) {
      return 8;
    }
    return 0;
  }
  function fromDecimalCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    return -1;
  }
  function simpleEscapeSequence(c) {
    switch (c) {
      case 48:
        return "\x00";
      case 97:
        return "\x07";
      case 98:
        return "\b";
      case 116:
        return "\t";
      case 9:
        return "\t";
      case 110:
        return `
`;
      case 118:
        return "\v";
      case 102:
        return "\f";
      case 114:
        return "\r";
      case 101:
        return "\x1B";
      case 32:
        return " ";
      case 34:
        return '"';
      case 47:
        return "/";
      case 92:
        return "\\";
      case 78:
        return "";
      case 95:
        return " ";
      case 76:
        return "\u2028";
      case 80:
        return "\u2029";
      default:
        return "";
    }
  }
  function charFromCodepoint(c) {
    if (c <= 65535) {
      return String.fromCharCode(c);
    }
    return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
  }
  function setProperty(object, key, value) {
    if (key === "__proto__") {
      Object.defineProperty(object, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value
      });
    } else {
      object[key] = value;
    }
  }
  const simpleEscapeCheck = new Array(256);
  const simpleEscapeMap = new Array(256);
  for (let i = 0;i < 256; i++) {
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
  }
  function State(input, options) {
    this.input = input;
    this.filename = options["filename"] || null;
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.onWarning = options["onWarning"] || null;
    this.legacy = options["legacy"] || false;
    this.json = options["json"] || false;
    this.listener = options["listener"] || null;
    this.maxDepth = typeof options["maxDepth"] === "number" ? options["maxDepth"] : 100;
    this.maxTotalMergeKeys = typeof options["maxTotalMergeKeys"] === "number" ? options["maxTotalMergeKeys"] : 1e4;
    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap = this.schema.compiledTypeMap;
    this.length = input.length;
    this.position = 0;
    this.line = 0;
    this.lineStart = 0;
    this.lineIndent = 0;
    this.depth = 0;
    this.totalMergeKeys = 0;
    this.firstTabInLine = -1;
    this.documents = [];
    this.anchorMapTransactions = [];
  }
  function generateError(state, message) {
    const mark = {
      name: state.filename,
      buffer: state.input.slice(0, -1),
      position: state.position,
      line: state.line,
      column: state.position - state.lineStart
    };
    mark.snippet = makeSnippet(mark);
    return new YAMLException2(message, mark);
  }
  function throwError(state, message) {
    throw generateError(state, message);
  }
  function throwWarning(state, message) {
    if (state.onWarning) {
      state.onWarning.call(null, generateError(state, message));
    }
  }
  function storeAnchor(state, name, value) {
    const transactions = state.anchorMapTransactions;
    if (transactions.length !== 0) {
      const transaction = transactions[transactions.length - 1];
      if (!_hasOwnProperty.call(transaction, name)) {
        transaction[name] = {
          existed: _hasOwnProperty.call(state.anchorMap, name),
          value: state.anchorMap[name]
        };
      }
    }
    state.anchorMap[name] = value;
  }
  function beginAnchorTransaction(state) {
    state.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
  }
  function commitAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const transactions = state.anchorMapTransactions;
    if (transactions.length === 0)
      return;
    const parent = transactions[transactions.length - 1];
    const names = Object.keys(transaction);
    for (let index = 0, length = names.length;index < length; index += 1) {
      const name = names[index];
      if (!_hasOwnProperty.call(parent, name)) {
        parent[name] = transaction[name];
      }
    }
  }
  function rollbackAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const names = Object.keys(transaction);
    for (let index = names.length - 1;index >= 0; index -= 1) {
      const entry = transaction[names[index]];
      if (entry.existed) {
        state.anchorMap[names[index]] = entry.value;
      } else {
        delete state.anchorMap[names[index]];
      }
    }
  }
  function snapshotState(state) {
    return {
      position: state.position,
      line: state.line,
      lineStart: state.lineStart,
      lineIndent: state.lineIndent,
      firstTabInLine: state.firstTabInLine,
      tag: state.tag,
      anchor: state.anchor,
      kind: state.kind,
      result: state.result
    };
  }
  function restoreState(state, snapshot) {
    state.position = snapshot.position;
    state.line = snapshot.line;
    state.lineStart = snapshot.lineStart;
    state.lineIndent = snapshot.lineIndent;
    state.firstTabInLine = snapshot.firstTabInLine;
    state.tag = snapshot.tag;
    state.anchor = snapshot.anchor;
    state.kind = snapshot.kind;
    state.result = snapshot.result;
  }
  const directiveHandlers = {
    YAML: function handleYamlDirective(state, name, args) {
      if (state.version !== null) {
        throwError(state, "duplication of %YAML directive");
      }
      if (args.length !== 1) {
        throwError(state, "YAML directive accepts exactly one argument");
      }
      const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
      if (match === null) {
        throwError(state, "ill-formed argument of the YAML directive");
      }
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major !== 1) {
        throwError(state, "unacceptable YAML version of the document");
      }
      state.version = args[0];
      state.checkLineBreaks = minor < 2;
      if (minor !== 1 && minor !== 2) {
        throwWarning(state, "unsupported YAML version of the document");
      }
    },
    TAG: function handleTagDirective(state, name, args) {
      let prefix;
      if (args.length !== 2) {
        throwError(state, "TAG directive accepts exactly two arguments");
      }
      const handle = args[0];
      prefix = args[1];
      if (!PATTERN_TAG_HANDLE.test(handle)) {
        throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
      }
      if (_hasOwnProperty.call(state.tagMap, handle)) {
        throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
      }
      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
      }
      try {
        prefix = decodeURIComponent(prefix);
      } catch (err) {
        throwError(state, "tag prefix is malformed: " + prefix);
      }
      state.tagMap[handle] = prefix;
    }
  };
  function captureSegment(state, start, end, checkJson) {
    if (start < end) {
      const _result = state.input.slice(start, end);
      if (checkJson) {
        for (let _position = 0, _length = _result.length;_position < _length; _position += 1) {
          const _character = _result.charCodeAt(_position);
          if (!(_character === 9 || _character >= 32 && _character <= 1114111)) {
            throwError(state, "expected valid JSON character");
          }
        }
      } else if (PATTERN_NON_PRINTABLE.test(_result)) {
        throwError(state, "the stream contains non-printable characters");
      }
      state.result += _result;
    }
  }
  function chargeMergeWork(state) {
    state.totalMergeKeys++;
    if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) {
      throwError(state, "merge keys exceeded maxTotalMergeKeys (" + state.maxTotalMergeKeys + ")");
    }
  }
  function mergeMappings(state, destination, source, overridableKeys) {
    if (!common2.isObject(source)) {
      throwError(state, "cannot merge mappings; the provided source object is unacceptable");
    }
    chargeMergeWork(state);
    const sourceKeys = Object.keys(source);
    for (let index = 0, quantity = sourceKeys.length;index < quantity; index += 1) {
      const key = sourceKeys[index];
      chargeMergeWork(state);
      if (!_hasOwnProperty.call(destination, key)) {
        setProperty(destination, key, source[key]);
        overridableKeys[key] = true;
      }
    }
  }
  function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
    if (Array.isArray(keyNode)) {
      keyNode = Array.prototype.slice.call(keyNode);
      for (let index = 0, quantity = keyNode.length;index < quantity; index += 1) {
        if (Array.isArray(keyNode[index])) {
          throwError(state, "nested arrays are not supported inside keys");
        }
        if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
          keyNode[index] = "[object Object]";
        }
      }
    }
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
      keyNode = "[object Object]";
    }
    keyNode = String(keyNode);
    if (_result === null) {
      _result = {};
    }
    if (keyTag === "tag:yaml.org,2002:merge") {
      if (Array.isArray(valueNode)) {
        if (valueNode.length > 100) {
          throwError(state, "abnormal merge sequence size");
        }
        for (let index = 0, quantity = valueNode.length;index < quantity; index += 1) {
          mergeMappings(state, _result, valueNode[index], overridableKeys);
        }
      } else {
        mergeMappings(state, _result, valueNode, overridableKeys);
      }
    } else {
      if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
        state.line = startLine || state.line;
        state.lineStart = startLineStart || state.lineStart;
        state.position = startPos || state.position;
        throwError(state, "duplicated mapping key");
      }
      setProperty(_result, keyNode, valueNode);
      delete overridableKeys[keyNode];
    }
    return _result;
  }
  function readLineBreak(state) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 10) {
      state.position++;
    } else if (ch === 13) {
      state.position++;
      if (state.input.charCodeAt(state.position) === 10) {
        state.position++;
      }
    } else {
      throwError(state, "a line break is expected");
    }
    state.line += 1;
    state.lineStart = state.position;
    state.firstTabInLine = -1;
  }
  function skipSeparationSpace(state, allowComments, checkIndent) {
    let lineBreaks = 0;
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      while (isWhiteSpace(ch)) {
        if (ch === 9 && state.firstTabInLine === -1) {
          state.firstTabInLine = state.position;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      if (allowComments && ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 10 && ch !== 13 && ch !== 0);
      }
      if (isEol(ch)) {
        readLineBreak(state);
        ch = state.input.charCodeAt(state.position);
        lineBreaks++;
        state.lineIndent = 0;
        while (ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
      } else {
        break;
      }
    }
    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
      throwWarning(state, "deficient indentation");
    }
    return lineBreaks;
  }
  function testDocumentSeparator(state) {
    let _position = state.position;
    let ch = state.input.charCodeAt(_position);
    if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
      _position += 3;
      ch = state.input.charCodeAt(_position);
      if (ch === 0 || isWsOrEol(ch)) {
        return true;
      }
    }
    return false;
  }
  function writeFoldedLines(state, count) {
    if (count === 1) {
      state.result += " ";
    } else if (count > 1) {
      state.result += common2.repeat(`
`, count - 1);
    }
  }
  function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    let captureStart;
    let captureEnd;
    let hasPendingContent;
    let _line;
    let _lineStart;
    let _lineIndent;
    const _kind = state.kind;
    const _result = state.result;
    let ch = state.input.charCodeAt(state.position);
    if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
      return false;
    }
    if (ch === 63 || ch === 45) {
      const following = state.input.charCodeAt(state.position + 1);
      if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
        return false;
      }
    }
    state.kind = "scalar";
    state.result = "";
    captureStart = captureEnd = state.position;
    hasPendingContent = false;
    while (ch !== 0) {
      if (ch === 58) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
          break;
        }
      } else if (ch === 35) {
        const preceding = state.input.charCodeAt(state.position - 1);
        if (isWsOrEol(preceding)) {
          break;
        }
      } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch)) {
        break;
      } else if (isEol(ch)) {
        _line = state.line;
        _lineStart = state.lineStart;
        _lineIndent = state.lineIndent;
        skipSeparationSpace(state, false, -1);
        if (state.lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = state.input.charCodeAt(state.position);
          continue;
        } else {
          state.position = captureEnd;
          state.line = _line;
          state.lineStart = _lineStart;
          state.lineIndent = _lineIndent;
          break;
        }
      }
      if (hasPendingContent) {
        captureSegment(state, captureStart, captureEnd, false);
        writeFoldedLines(state, state.line - _line);
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
      }
      if (!isWhiteSpace(ch)) {
        captureEnd = state.position + 1;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, captureEnd, false);
    if (state.result) {
      return true;
    }
    state.kind = _kind;
    state.result = _result;
    return false;
  }
  function readSingleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 39) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 39) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (ch === 39) {
          captureStart = state.position;
          state.position++;
          captureEnd = state.position;
        } else {
          return true;
        }
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a single quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a single quoted scalar");
  }
  function readDoubleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 34) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 34) {
        captureSegment(state, captureStart, state.position, true);
        state.position++;
        return true;
      } else if (ch === 92) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (isEol(ch)) {
          skipSeparationSpace(state, false, nodeIndent);
        } else if (ch < 256 && simpleEscapeCheck[ch]) {
          state.result += simpleEscapeMap[ch];
          state.position++;
        } else if ((tmp = escapedHexLen(ch)) > 0) {
          let hexLength = tmp;
          let hexResult = 0;
          for (;hexLength > 0; hexLength--) {
            ch = state.input.charCodeAt(++state.position);
            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;
            } else {
              throwError(state, "expected hexadecimal character");
            }
          }
          state.result += charFromCodepoint(hexResult);
          state.position++;
        } else {
          throwError(state, "unknown escape sequence");
        }
        captureStart = captureEnd = state.position;
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a double quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a double quoted scalar");
  }
  function readFlowCollection(state, nodeIndent) {
    let readNext = true;
    let _line;
    let _lineStart;
    let _pos;
    const _tag = state.tag;
    let _result;
    const _anchor = state.anchor;
    let terminator;
    let isPair;
    let isExplicitPair;
    let isMapping;
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyNode;
    let keyTag;
    let valueNode;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 91) {
      terminator = 93;
      isMapping = false;
      _result = [];
    } else if (ch === 123) {
      terminator = 125;
      isMapping = true;
      _result = {};
    } else {
      return false;
    }
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    ch = state.input.charCodeAt(++state.position);
    while (ch !== 0) {
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === terminator) {
        state.position++;
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = isMapping ? "mapping" : "sequence";
        state.result = _result;
        return true;
      } else if (!readNext) {
        throwError(state, "missed comma between flow collection entries");
      } else if (ch === 44) {
        throwError(state, "expected the node content, but found ','");
      }
      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;
      if (ch === 63) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following)) {
          isPair = isExplicitPair = true;
          state.position++;
          skipSeparationSpace(state, true, nodeIndent);
        }
      }
      _line = state.line;
      _lineStart = state.lineStart;
      _pos = state.position;
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = state.tag;
      keyNode = state.result;
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if ((isExplicitPair || state.line === _line) && ch === 58) {
        isPair = true;
        ch = state.input.charCodeAt(++state.position);
        skipSeparationSpace(state, true, nodeIndent);
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = state.result;
      }
      if (isMapping) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
      } else if (isPair) {
        _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
      } else {
        _result.push(keyNode);
      }
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === 44) {
        readNext = true;
        ch = state.input.charCodeAt(++state.position);
      } else {
        readNext = false;
      }
    }
    throwError(state, "unexpected end of the stream within a flow collection");
  }
  function readBlockScalar(state, nodeIndent) {
    let folding;
    let chomping = CHOMPING_CLIP;
    let didReadContent = false;
    let detectedIndent = false;
    let textIndent = nodeIndent;
    let emptyLines = 0;
    let atMoreIndented = false;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 124) {
      folding = false;
    } else if (ch === 62) {
      folding = true;
    } else {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    while (ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
      if (ch === 43 || ch === 45) {
        if (CHOMPING_CLIP === chomping) {
          chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwError(state, "repeat of a chomping mode identifier");
        }
      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          throwError(state, "repeat of an indentation width identifier");
        }
      } else {
        break;
      }
    }
    if (isWhiteSpace(ch)) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (isWhiteSpace(ch));
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (!isEol(ch) && ch !== 0);
      }
    }
    while (ch !== 0) {
      readLineBreak(state);
      state.lineIndent = 0;
      ch = state.input.charCodeAt(state.position);
      while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
      if (!detectedIndent && state.lineIndent > textIndent) {
        textIndent = state.lineIndent;
      }
      if (isEol(ch)) {
        emptyLines++;
        continue;
      }
      if (!detectedIndent && textIndent === 0) {
        throwError(state, "missing indentation for block scalar");
      }
      if (state.lineIndent < textIndent) {
        if (chomping === CHOMPING_KEEP) {
          state.result += common2.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) {
            state.result += `
`;
          }
        }
        break;
      }
      if (folding) {
        if (isWhiteSpace(ch)) {
          atMoreIndented = true;
          state.result += common2.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
        } else if (atMoreIndented) {
          atMoreIndented = false;
          state.result += common2.repeat(`
`, emptyLines + 1);
        } else if (emptyLines === 0) {
          if (didReadContent) {
            state.result += " ";
          }
        } else {
          state.result += common2.repeat(`
`, emptyLines);
        }
      } else {
        state.result += common2.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
      }
      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      const captureStart = state.position;
      while (!isEol(ch) && ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, state.position, false);
    }
    return true;
  }
  function readBlockSequence(state, nodeIndent) {
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = [];
    let detected = false;
    if (state.firstTabInLine !== -1)
      return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      if (ch !== 45) {
        break;
      }
      const following = state.input.charCodeAt(state.position + 1);
      if (!isWsOrEol(following)) {
        break;
      }
      detected = true;
      state.position++;
      if (skipSeparationSpace(state, true, -1)) {
        if (state.lineIndent <= nodeIndent) {
          _result.push(null);
          ch = state.input.charCodeAt(state.position);
          continue;
        }
      }
      const _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(state.result);
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a sequence entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "sequence";
      state.result = _result;
      return true;
    }
    return false;
  }
  function readBlockMapping(state, nodeIndent, flowIndent) {
    let allowCompact;
    let _keyLine;
    let _keyLineStart;
    let _keyPos;
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = {};
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyTag = null;
    let keyNode = null;
    let valueNode = null;
    let atExplicitKey = false;
    let detected = false;
    if (state.firstTabInLine !== -1)
      return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (!atExplicitKey && state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      const following = state.input.charCodeAt(state.position + 1);
      const _line = state.line;
      if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
        if (ch === 63) {
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = true;
          allowCompact = true;
        } else if (atExplicitKey) {
          atExplicitKey = false;
          allowCompact = true;
        } else {
          throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
        }
        state.position += 1;
        ch = following;
      } else {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
        if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          break;
        }
        if (state.line === _line) {
          ch = state.input.charCodeAt(state.position);
          while (isWhiteSpace(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 58) {
            ch = state.input.charCodeAt(++state.position);
            if (!isWsOrEol(ch)) {
              throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
            }
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = state.tag;
            keyNode = state.result;
          } else if (detected) {
            throwError(state, "can not read an implicit mapping pair; a colon is missed");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else if (detected) {
          throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      }
      if (state.line === _line || state.lineIndent > nodeIndent) {
        if (atExplicitKey) {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
        }
        if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = state.result;
          } else {
            valueNode = state.result;
          }
        }
        if (!atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
      }
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a mapping entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (atExplicitKey) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "mapping";
      state.result = _result;
    }
    return detected;
  }
  function readTagProperty(state) {
    let isVerbatim = false;
    let isNamed = false;
    let tagHandle;
    let tagName;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 33)
      return false;
    if (state.tag !== null) {
      throwError(state, "duplication of a tag property");
    }
    ch = state.input.charCodeAt(++state.position);
    if (ch === 60) {
      isVerbatim = true;
      ch = state.input.charCodeAt(++state.position);
    } else if (ch === 33) {
      isNamed = true;
      tagHandle = "!!";
      ch = state.input.charCodeAt(++state.position);
    } else {
      tagHandle = "!";
    }
    let _position = state.position;
    if (isVerbatim) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0 && ch !== 62);
      if (state.position < state.length) {
        tagName = state.input.slice(_position, state.position);
        ch = state.input.charCodeAt(++state.position);
      } else {
        throwError(state, "unexpected end of the stream within a verbatim tag");
      }
    } else {
      while (ch !== 0 && !isWsOrEol(ch)) {
        if (ch === 33) {
          if (!isNamed) {
            tagHandle = state.input.slice(_position - 1, state.position + 1);
            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              throwError(state, "named tag handle cannot contain such characters");
            }
            isNamed = true;
            _position = state.position + 1;
          } else {
            throwError(state, "tag suffix cannot contain exclamation marks");
          }
        }
        ch = state.input.charCodeAt(++state.position);
      }
      tagName = state.input.slice(_position, state.position);
      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        throwError(state, "tag suffix cannot contain flow indicator characters");
      }
    }
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      throwError(state, "tag name cannot contain such characters: " + tagName);
    }
    try {
      tagName = decodeURIComponent(tagName);
    } catch (err) {
      throwError(state, "tag name is malformed: " + tagName);
    }
    if (isVerbatim) {
      state.tag = tagName;
    } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
      state.tag = state.tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
      state.tag = "!" + tagName;
    } else if (tagHandle === "!!") {
      state.tag = "tag:yaml.org,2002:" + tagName;
    } else {
      throwError(state, 'undeclared tag handle "' + tagHandle + '"');
    }
    return true;
  }
  function readAnchorProperty(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 38)
      return false;
    if (state.anchor !== null) {
      throwError(state, "duplication of an anchor property");
    }
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an anchor node must contain at least one character");
    }
    state.anchor = state.input.slice(_position, state.position);
    return true;
  }
  function readAlias(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 42)
      return false;
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an alias node must contain at least one character");
    }
    const alias = state.input.slice(_position, state.position);
    if (!_hasOwnProperty.call(state.anchorMap, alias)) {
      throwError(state, 'unidentified alias "' + alias + '"');
    }
    state.result = state.anchorMap[alias];
    skipSeparationSpace(state, true, -1);
    return true;
  }
  function tryReadBlockMappingFromProperty(state, propertyStart, nodeIndent, flowIndent) {
    const fallbackState = snapshotState(state);
    beginAnchorTransaction(state);
    restoreState(state, propertyStart);
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    if (readBlockMapping(state, nodeIndent, flowIndent) && state.kind === "mapping") {
      commitAnchorTransaction(state);
      return true;
    }
    rollbackAnchorTransaction(state);
    restoreState(state, fallbackState);
    return false;
  }
  function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    let allowBlockScalars;
    let allowBlockCollections;
    let indentStatus = 1;
    let atNewLine = false;
    let hasContent = false;
    let propertyStart = null;
    let type2;
    let flowIndent;
    let blockIndent;
    if (state.depth >= state.maxDepth) {
      throwError(state, "nesting exceeded maxDepth (" + state.maxDepth + ")");
    }
    state.depth += 1;
    if (state.listener !== null) {
      state.listener("open", state);
    }
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
    if (allowToSeek) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }
    if (indentStatus === 1) {
      while (true) {
        const ch = state.input.charCodeAt(state.position);
        const propertyState = snapshotState(state);
        if (atNewLine && (ch === 33 && state.tag !== null || ch === 38 && state.anchor !== null)) {
          break;
        }
        if (!readTagProperty(state) && !readAnchorProperty(state)) {
          break;
        }
        if (propertyStart === null) {
          propertyStart = propertyState;
        }
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }
    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }
    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }
      blockIndent = state.position - state.lineStart;
      if (indentStatus === 1) {
        if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
          hasContent = true;
        } else {
          const ch = state.input.charCodeAt(state.position);
          if (propertyStart !== null && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62 && tryReadBlockMappingFromProperty(state, propertyStart, propertyStart.position - propertyStart.lineStart, flowIndent)) {
            hasContent = true;
          } else if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
            hasContent = true;
          } else if (readAlias(state)) {
            hasContent = true;
            if (state.tag !== null || state.anchor !== null) {
              throwError(state, "alias node should not have any properties");
            }
          } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;
            if (state.tag === null) {
              state.tag = "?";
            }
          }
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
        }
      } else if (indentStatus === 0) {
        hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
      }
    }
    if (state.tag === null) {
      if (state.anchor !== null) {
        storeAnchor(state, state.anchor, state.result);
      }
    } else if (state.tag === "?") {
      if (state.result !== null && state.kind !== "scalar") {
        throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
      }
      for (let typeIndex = 0, typeQuantity = state.implicitTypes.length;typeIndex < typeQuantity; typeIndex += 1) {
        type2 = state.implicitTypes[typeIndex];
        if (type2.resolve(state.result)) {
          state.result = type2.construct(state.result);
          state.tag = type2.tag;
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
          break;
        }
      }
    } else if (state.tag !== "!") {
      if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
        type2 = state.typeMap[state.kind || "fallback"][state.tag];
      } else {
        type2 = null;
        const typeList = state.typeMap.multi[state.kind || "fallback"];
        for (let typeIndex = 0, typeQuantity = typeList.length;typeIndex < typeQuantity; typeIndex += 1) {
          if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
            type2 = typeList[typeIndex];
            break;
          }
        }
      }
      if (!type2) {
        throwError(state, "unknown tag !<" + state.tag + ">");
      }
      if (state.result !== null && type2.kind !== state.kind) {
        throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
      }
      if (!type2.resolve(state.result, state.tag)) {
        throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
      } else {
        state.result = type2.construct(state.result, state.tag);
        if (state.anchor !== null) {
          storeAnchor(state, state.anchor, state.result);
        }
      }
    }
    if (state.listener !== null) {
      state.listener("close", state);
    }
    state.depth -= 1;
    return state.tag !== null || state.anchor !== null || hasContent;
  }
  function readDocument(state) {
    const documentStart = state.position;
    let hasDirectives = false;
    let ch;
    state.version = null;
    state.checkLineBreaks = state.legacy;
    state.tagMap = /* @__PURE__ */ Object.create(null);
    state.anchorMap = /* @__PURE__ */ Object.create(null);
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if (state.lineIndent > 0 || ch !== 37) {
        break;
      }
      hasDirectives = true;
      ch = state.input.charCodeAt(++state.position);
      let _position = state.position;
      while (ch !== 0 && !isWsOrEol(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      const directiveName = state.input.slice(_position, state.position);
      const directiveArgs = [];
      if (directiveName.length < 1) {
        throwError(state, "directive name must not be less than one character in length");
      }
      while (ch !== 0) {
        while (isWhiteSpace(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 0 && !isEol(ch));
          break;
        }
        if (isEol(ch))
          break;
        _position = state.position;
        while (ch !== 0 && !isWsOrEol(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveArgs.push(state.input.slice(_position, state.position));
      }
      if (ch !== 0)
        readLineBreak(state);
      if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](state, directiveName, directiveArgs);
      } else {
        throwWarning(state, 'unknown document directive "' + directiveName + '"');
      }
    }
    skipSeparationSpace(state, true, -1);
    if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    } else if (hasDirectives) {
      throwError(state, "directives end mark is expected");
    }
    composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(state, true, -1);
    if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
      throwWarning(state, "non-ASCII line breaks are interpreted as content");
    }
    state.documents.push(state.result);
    if (state.position === state.lineStart && testDocumentSeparator(state)) {
      if (state.input.charCodeAt(state.position) === 46) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      }
      return;
    }
    if (state.position < state.length - 1) {
      throwError(state, "end of the stream or a document separator is expected");
    }
  }
  function loadDocuments(input, options) {
    input = String(input);
    options = options || {};
    if (input.length !== 0) {
      if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
        input += `
`;
      }
      if (input.charCodeAt(0) === 65279) {
        input = input.slice(1);
      }
    }
    const state = new State(input, options);
    const nullpos = input.indexOf("\x00");
    if (nullpos !== -1) {
      state.position = nullpos;
      throwError(state, "null byte is not allowed in input");
    }
    state.input += "\x00";
    while (state.input.charCodeAt(state.position) === 32) {
      state.lineIndent += 1;
      state.position += 1;
    }
    while (state.position < state.length - 1) {
      readDocument(state);
    }
    return state.documents;
  }
  function loadAll2(input, iterator, options) {
    if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
      options = iterator;
      iterator = null;
    }
    const documents = loadDocuments(input, options);
    if (typeof iterator !== "function") {
      return documents;
    }
    for (let index = 0, length = documents.length;index < length; index += 1) {
      iterator(documents[index]);
    }
  }
  function load2(input, options) {
    const documents = loadDocuments(input, options);
    if (documents.length === 0) {
      return;
    } else if (documents.length === 1) {
      return documents[0];
    }
    throw new YAMLException2("expected a single document in the stream, but found more");
  }
  loader.loadAll = loadAll2;
  loader.load = load2;
  return loader;
}
var dumper = {};
var hasRequiredDumper;
function requireDumper() {
  if (hasRequiredDumper)
    return dumper;
  hasRequiredDumper = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const DEFAULT_SCHEMA2 = require_default();
  const _toString = Object.prototype.toString;
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CHAR_BOM = 65279;
  const CHAR_TAB = 9;
  const CHAR_LINE_FEED = 10;
  const CHAR_CARRIAGE_RETURN = 13;
  const CHAR_SPACE = 32;
  const CHAR_EXCLAMATION = 33;
  const CHAR_DOUBLE_QUOTE = 34;
  const CHAR_SHARP = 35;
  const CHAR_PERCENT = 37;
  const CHAR_AMPERSAND = 38;
  const CHAR_SINGLE_QUOTE = 39;
  const CHAR_ASTERISK = 42;
  const CHAR_COMMA = 44;
  const CHAR_MINUS = 45;
  const CHAR_COLON = 58;
  const CHAR_EQUALS = 61;
  const CHAR_GREATER_THAN = 62;
  const CHAR_QUESTION = 63;
  const CHAR_COMMERCIAL_AT = 64;
  const CHAR_LEFT_SQUARE_BRACKET = 91;
  const CHAR_RIGHT_SQUARE_BRACKET = 93;
  const CHAR_GRAVE_ACCENT = 96;
  const CHAR_LEFT_CURLY_BRACKET = 123;
  const CHAR_VERTICAL_LINE = 124;
  const CHAR_RIGHT_CURLY_BRACKET = 125;
  const ESCAPE_SEQUENCES = {};
  ESCAPE_SEQUENCES[0] = "\\0";
  ESCAPE_SEQUENCES[7] = "\\a";
  ESCAPE_SEQUENCES[8] = "\\b";
  ESCAPE_SEQUENCES[9] = "\\t";
  ESCAPE_SEQUENCES[10] = "\\n";
  ESCAPE_SEQUENCES[11] = "\\v";
  ESCAPE_SEQUENCES[12] = "\\f";
  ESCAPE_SEQUENCES[13] = "\\r";
  ESCAPE_SEQUENCES[27] = "\\e";
  ESCAPE_SEQUENCES[34] = "\\\"";
  ESCAPE_SEQUENCES[92] = "\\\\";
  ESCAPE_SEQUENCES[133] = "\\N";
  ESCAPE_SEQUENCES[160] = "\\_";
  ESCAPE_SEQUENCES[8232] = "\\L";
  ESCAPE_SEQUENCES[8233] = "\\P";
  const DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ];
  const DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function compileStyleMap(schema2, map2) {
    if (map2 === null)
      return {};
    const result = {};
    const keys = Object.keys(map2);
    for (let index = 0, length = keys.length;index < length; index += 1) {
      let tag = keys[index];
      let style = String(map2[tag]);
      if (tag.slice(0, 2) === "!!") {
        tag = "tag:yaml.org,2002:" + tag.slice(2);
      }
      const type2 = schema2.compiledTypeMap["fallback"][tag];
      if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
        style = type2.styleAliases[style];
      }
      result[tag] = style;
    }
    return result;
  }
  function encodeHex(character) {
    let handle;
    let length;
    const string = character.toString(16).toUpperCase();
    if (character <= 255) {
      handle = "x";
      length = 2;
    } else if (character <= 65535) {
      handle = "u";
      length = 4;
    } else if (character <= 4294967295) {
      handle = "U";
      length = 8;
    } else {
      throw new YAMLException2("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return "\\" + handle + common2.repeat("0", length - string.length) + string;
  }
  const QUOTING_TYPE_SINGLE = 1;
  const QUOTING_TYPE_DOUBLE = 2;
  function State(options) {
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.indent = Math.max(1, options["indent"] || 2);
    this.noArrayIndent = options["noArrayIndent"] || false;
    this.skipInvalid = options["skipInvalid"] || false;
    this.flowLevel = common2.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
    this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
    this.sortKeys = options["sortKeys"] || false;
    this.lineWidth = options["lineWidth"] || 80;
    this.noRefs = options["noRefs"] || false;
    this.noCompatMode = options["noCompatMode"] || false;
    this.condenseFlow = options["condenseFlow"] || false;
    this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
    this.forceQuotes = options["forceQuotes"] || false;
    this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
    this.implicitTypes = this.schema.compiledImplicit;
    this.explicitTypes = this.schema.compiledExplicit;
    this.tag = null;
    this.result = "";
    this.duplicates = [];
    this.usedDuplicates = null;
  }
  function indentString(string, spaces) {
    const ind = common2.repeat(" ", spaces);
    let position = 0;
    let result = "";
    const length = string.length;
    while (position < length) {
      let line;
      const next = string.indexOf(`
`, position);
      if (next === -1) {
        line = string.slice(position);
        position = length;
      } else {
        line = string.slice(position, next + 1);
        position = next + 1;
      }
      if (line.length && line !== `
`)
        result += ind;
      result += line;
    }
    return result;
  }
  function generateNextLine(state, level) {
    return `
` + common2.repeat(" ", state.indent * level);
  }
  function testImplicitResolving(state, str2) {
    for (let index = 0, length = state.implicitTypes.length;index < length; index += 1) {
      const type2 = state.implicitTypes[index];
      if (type2.resolve(str2)) {
        return true;
      }
    }
    return false;
  }
  function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
  }
  function isPrintable(c) {
    return c >= 32 && c <= 126 || c >= 161 && c <= 55295 && c !== 8232 && c !== 8233 || c >= 57344 && c <= 65533 && c !== CHAR_BOM || c >= 65536 && c <= 1114111;
  }
  function isNsCharOrWhitespace(c) {
    return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
  }
  function isPlainSafe(c, prev, inblock) {
    const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
    const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
    return (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar;
  }
  function isPlainSafeFirst(c) {
    return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
  }
  function isPlainSafeLast(c) {
    return !isWhitespace(c) && c !== CHAR_COLON;
  }
  function codePointAt(string, pos) {
    const first = string.charCodeAt(pos);
    let second;
    if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
      second = string.charCodeAt(pos + 1);
      if (second >= 56320 && second <= 57343) {
        return (first - 55296) * 1024 + second - 56320 + 65536;
      }
    }
    return first;
  }
  function needIndentIndicator(string) {
    const leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
  }
  const STYLE_PLAIN = 1;
  const STYLE_SINGLE = 2;
  const STYLE_LITERAL = 3;
  const STYLE_FOLDED = 4;
  const STYLE_DOUBLE = 5;
  function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
    let i;
    let char = 0;
    let prevChar = null;
    let hasLineBreak = false;
    let hasFoldableLine = false;
    const shouldTrackWidth = lineWidth !== -1;
    let previousLineBreak = -1;
    let plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
    if (singleLineOnly || forceQuotes) {
      for (i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
    } else {
      for (i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (char === CHAR_LINE_FEED) {
          hasLineBreak = true;
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine || i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
            previousLineBreak = i;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
      hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
    }
    if (!hasLineBreak && !hasFoldableLine) {
      if (plain && !forceQuotes && !testAmbiguousType(string)) {
        return STYLE_PLAIN;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    if (!forceQuotes) {
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  function writeScalar(state, string, level, iskey, inblock) {
    state.dump = function() {
      if (string.length === 0) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
      }
      if (!state.noCompatMode) {
        if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
        }
      }
      const indent = state.indent * Math.max(1, level);
      const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
      const singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
      function testAmbiguity(string2) {
        return testImplicitResolving(state, string2);
      }
      switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {
        case STYLE_PLAIN:
          return string;
        case STYLE_SINGLE:
          return "'" + string.replace(/'/g, "''") + "'";
        case STYLE_LITERAL:
          return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
        case STYLE_FOLDED:
          return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
        case STYLE_DOUBLE:
          return '"' + escapeString(string) + '"';
        default:
          throw new YAMLException2("impossible error: invalid scalar style");
      }
    }();
  }
  function blockHeader(string, indentPerLevel) {
    const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    const clip = string[string.length - 1] === `
`;
    const keep = clip && (string[string.length - 2] === `
` || string === `
`);
    const chomp = keep ? "+" : clip ? "" : "-";
    return indentIndicator + chomp + `
`;
  }
  function dropEndingNewline(string) {
    return string[string.length - 1] === `
` ? string.slice(0, -1) : string;
  }
  function foldString(string, width) {
    const lineRe = /(\n+)([^\n]*)/g;
    let result = function() {
      let nextLF = string.indexOf(`
`);
      nextLF = nextLF !== -1 ? nextLF : string.length;
      lineRe.lastIndex = nextLF;
      return foldLine(string.slice(0, nextLF), width);
    }();
    let prevMoreIndented = string[0] === `
` || string[0] === " ";
    let moreIndented;
    let match;
    while (match = lineRe.exec(string)) {
      const prefix = match[1];
      const line = match[2];
      moreIndented = line[0] === " ";
      result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? `
` : "") + foldLine(line, width);
      prevMoreIndented = moreIndented;
    }
    return result;
  }
  function foldLine(line, width) {
    if (line === "" || line[0] === " ")
      return line;
    const breakRe = / [^ ]/g;
    let match;
    let start = 0;
    let end;
    let curr = 0;
    let next = 0;
    let result = "";
    while (match = breakRe.exec(line)) {
      next = match.index;
      if (next - start > width) {
        end = curr > start ? curr : next;
        result += `
` + line.slice(start, end);
        start = end + 1;
      }
      curr = next;
    }
    result += `
`;
    if (line.length - start > width && curr > start) {
      result += line.slice(start, curr) + `
` + line.slice(curr + 1);
    } else {
      result += line.slice(start);
    }
    return result.slice(1);
  }
  function escapeString(string) {
    let result = "";
    let char = 0;
    for (let i = 0;i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      const escapeSeq = ESCAPE_SEQUENCES[char];
      if (!escapeSeq && isPrintable(char)) {
        result += string[i];
        if (char >= 65536)
          result += string[i + 1];
      } else {
        result += escapeSeq || encodeHex(char);
      }
    }
    return result;
  }
  function writeFlowSequence(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length;index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
        if (_result !== "")
          _result += "," + (!state.condenseFlow ? " " : "");
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = "[" + _result + "]";
  }
  function writeBlockSequence(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length;index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
        if (!compact || _result !== "") {
          _result += generateNextLine(state, level);
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          _result += "-";
        } else {
          _result += "- ";
        }
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = _result || "[]";
  }
  function writeFlowMapping(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    for (let index = 0, length = objectKeyList.length;index < length; index += 1) {
      let pairBuffer = "";
      if (_result !== "")
        pairBuffer += ", ";
      if (state.condenseFlow)
        pairBuffer += '"';
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level, objectKey, false, false)) {
        continue;
      }
      if (state.dump.length > 1024)
        pairBuffer += "? ";
      pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
      if (!writeNode(state, level, objectValue, false, false)) {
        continue;
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = "{" + _result + "}";
  }
  function writeBlockMapping(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    if (state.sortKeys === true) {
      objectKeyList.sort();
    } else if (typeof state.sortKeys === "function") {
      objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
      throw new YAMLException2("sortKeys must be a boolean or a function");
    }
    for (let index = 0, length = objectKeyList.length;index < length; index += 1) {
      let pairBuffer = "";
      if (!compact || _result !== "") {
        pairBuffer += generateNextLine(state, level);
      }
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level + 1, objectKey, true, true, true)) {
        continue;
      }
      const explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += "?";
        } else {
          pairBuffer += "? ";
        }
      }
      pairBuffer += state.dump;
      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }
      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue;
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ":";
      } else {
        pairBuffer += ": ";
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}";
  }
  function detectType(state, object, explicit) {
    const typeList = explicit ? state.explicitTypes : state.implicitTypes;
    for (let index = 0, length = typeList.length;index < length; index += 1) {
      const type2 = typeList[index];
      if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
        if (explicit) {
          if (type2.multi && type2.representName) {
            state.tag = type2.representName(object);
          } else {
            state.tag = type2.tag;
          }
        } else {
          state.tag = "?";
        }
        if (type2.represent) {
          const style = state.styleMap[type2.tag] || type2.defaultStyle;
          let _result;
          if (_toString.call(type2.represent) === "[object Function]") {
            _result = type2.represent(object, style);
          } else if (_hasOwnProperty.call(type2.represent, style)) {
            _result = type2.represent[style](object, style);
          } else {
            throw new YAMLException2("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
          }
          state.dump = _result;
        }
        return true;
      }
    }
    return false;
  }
  function writeNode(state, level, object, block, compact, iskey, isblockseq) {
    state.tag = null;
    state.dump = object;
    if (!detectType(state, object, false)) {
      detectType(state, object, true);
    }
    const type2 = _toString.call(state.dump);
    const inblock = block;
    if (block) {
      block = state.flowLevel < 0 || state.flowLevel > level;
    }
    const objectOrArray = type2 === "[object Object]" || type2 === "[object Array]";
    let duplicateIndex;
    let duplicate;
    if (objectOrArray) {
      duplicateIndex = state.duplicates.indexOf(object);
      duplicate = duplicateIndex !== -1;
    }
    if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
      compact = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
      state.dump = "*ref_" + duplicateIndex;
    } else {
      if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
        state.usedDuplicates[duplicateIndex] = true;
      }
      if (type2 === "[object Object]") {
        if (block && Object.keys(state.dump).length !== 0) {
          writeBlockMapping(state, level, state.dump, compact);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowMapping(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object Array]") {
        if (block && state.dump.length !== 0) {
          if (state.noArrayIndent && !isblockseq && level > 0) {
            writeBlockSequence(state, level - 1, state.dump, compact);
          } else {
            writeBlockSequence(state, level, state.dump, compact);
          }
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowSequence(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object String]") {
        if (state.tag !== "?") {
          writeScalar(state, state.dump, level, iskey, inblock);
        }
      } else if (type2 === "[object Undefined]") {
        return false;
      } else {
        if (state.skipInvalid)
          return false;
        throw new YAMLException2("unacceptable kind of an object to dump " + type2);
      }
      if (state.tag !== null && state.tag !== "?") {
        let tagStr = encodeURI(state.tag[0] === "!" ? state.tag.slice(1) : state.tag).replace(/!/g, "%21");
        if (state.tag[0] === "!") {
          tagStr = "!" + tagStr;
        } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
          tagStr = "!!" + tagStr.slice(18);
        } else {
          tagStr = "!<" + tagStr + ">";
        }
        state.dump = tagStr + " " + state.dump;
      }
    }
    return true;
  }
  function getDuplicateReferences(object, state) {
    const objects = [];
    const duplicatesIndexes = [];
    inspectNode(object, objects, duplicatesIndexes);
    const length = duplicatesIndexes.length;
    for (let index = 0;index < length; index += 1) {
      state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
  }
  function inspectNode(object, objects, duplicatesIndexes) {
    if (object !== null && typeof object === "object") {
      const index = objects.indexOf(object);
      if (index !== -1) {
        if (duplicatesIndexes.indexOf(index) === -1) {
          duplicatesIndexes.push(index);
        }
      } else {
        objects.push(object);
        if (Array.isArray(object)) {
          for (let i = 0, length = object.length;i < length; i += 1) {
            inspectNode(object[i], objects, duplicatesIndexes);
          }
        } else {
          const objectKeyList = Object.keys(object);
          for (let i = 0, length = objectKeyList.length;i < length; i += 1) {
            inspectNode(object[objectKeyList[i]], objects, duplicatesIndexes);
          }
        }
      }
    }
  }
  function dump2(input, options) {
    options = options || {};
    const state = new State(options);
    if (!state.noRefs)
      getDuplicateReferences(input, state);
    let value = input;
    if (state.replacer) {
      value = state.replacer.call({ "": value }, "", value);
    }
    if (writeNode(state, 0, value, true, true))
      return state.dump + `
`;
    return "";
  }
  dumper.dump = dump2;
  return dumper;
}
var hasRequiredJsYaml;
function requireJsYaml() {
  if (hasRequiredJsYaml)
    return jsYaml;
  hasRequiredJsYaml = 1;
  const loader2 = requireLoader();
  const dumper2 = requireDumper();
  function renamed(from, to) {
    return function() {
      throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
    };
  }
  jsYaml.Type = requireType();
  jsYaml.Schema = requireSchema();
  jsYaml.FAILSAFE_SCHEMA = requireFailsafe();
  jsYaml.JSON_SCHEMA = requireJson();
  jsYaml.CORE_SCHEMA = requireCore();
  jsYaml.DEFAULT_SCHEMA = require_default();
  jsYaml.load = loader2.load;
  jsYaml.loadAll = loader2.loadAll;
  jsYaml.dump = dumper2.dump;
  jsYaml.YAMLException = requireException();
  jsYaml.types = {
    binary: requireBinary(),
    float: requireFloat(),
    map: requireMap(),
    null: require_null(),
    pairs: requirePairs(),
    set: requireSet(),
    timestamp: requireTimestamp(),
    bool: requireBool(),
    int: requireInt(),
    merge: requireMerge(),
    omap: requireOmap(),
    seq: requireSeq(),
    str: requireStr()
  };
  jsYaml.safeLoad = renamed("safeLoad", "load");
  jsYaml.safeLoadAll = renamed("safeLoadAll", "loadAll");
  jsYaml.safeDump = renamed("safeDump", "dump");
  return jsYaml;
}
var jsYamlExports = requireJsYaml();
var yaml = /* @__PURE__ */ getDefaultExportFromCjs(jsYamlExports);
var {
  Type,
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SCHEMA,
  load,
  loadAll,
  dump,
  YAMLException,
  types,
  safeLoad,
  safeLoadAll,
  safeDump
} = yaml;

// src/backend/ledger-parser.ts
var ALL_DETAILS_RE = /<details\b[^>]*>[\s\S]*?<\/details>/gi;
var DETAILS_BLOCK_EXTRACT_RE = /<details\b[^>]*>([\s\S]*?)<\/details>/gi;
var YAML_BLOCK_RE = /```(?:yaml|yml)?\s*([\s\S]*?)```/gi;
var THINK_TAGS_RE = /<think\b[^>]*>[\s\S]*?<\/think>/gi;
var DIRECTOR_JSON_RE = /\{[\s\S]*?"director_note"[\s\S]*?\}\s*/gi;
var PLAYER_TRACKING_RE = /\n*(?:Loadout|Attire|Body):[\s\S]*$/i;
var TOON_COMMENT_RE = /<!--\s*toon\b[\s\S]*?-->/gi;
var TOON_BRACKET_RE = /\[toon\b[\s\S]*?\]/gi;
function extractProse(rawContent) {
  let cleaned = (rawContent || "").replace(THINK_TAGS_RE, "").replace(ALL_DETAILS_RE, "").replace(DIRECTOR_JSON_RE, "").replace(TOON_COMMENT_RE, "").replace(TOON_BRACKET_RE, "").replace(PLAYER_TRACKING_RE, "").trim();
  return cleaned;
}
function extractParagraphs(prose) {
  return (prose || "").split(/\r?\n+/).map((p) => p.trim()).filter((p) => p.length > 0);
}
function detectSpeaker(paragraph, defaultSpeaker = "Narrator") {
  const boldPrefix = paragraph.match(/^\*\*([A-Za-z0-9_\-\s]+?)\*\*[:\s]+([\s\S]*)$/);
  if (boldPrefix) {
    return { speaker: boldPrefix[1].replace(/:$/, "").trim(), text: boldPrefix[2].trim() };
  }
  const colonPrefix = paragraph.match(/^([A-Z][a-zA-Z0-9_\s]{1,24}):\s+([\s\S]*)$/);
  if (colonPrefix) {
    return { speaker: colonPrefix[1].trim(), text: colonPrefix[2].trim() };
  }
  const actionDialogue = paragraph.match(/^([A-Z][a-zA-Z0-9_]{1,20})\b[^"“]*?["“]([\s\S]*?)["”]/);
  if (actionDialogue) {
    return { speaker: actionDialogue[1].trim(), text: paragraph };
  }
  const speechTag = paragraph.match(/["”]\s*([A-Z][a-zA-Z0-9_]{1,20})\s+(?:said|whispered|asked|replied|shouted|murmured)/i);
  if (speechTag) {
    return { speaker: speechTag[1].trim(), text: paragraph };
  }
  return { speaker: defaultSpeaker, text: paragraph };
}
function extractLedgerRaw(rawContent) {
  if (!rawContent)
    return null;
  const matches = [];
  let m;
  DETAILS_BLOCK_EXTRACT_RE.lastIndex = 0;
  while ((m = DETAILS_BLOCK_EXTRACT_RE.exec(rawContent)) !== null) {
    if (m[1])
      matches.push(m[1]);
  }
  for (const block of matches) {
    if (block.includes("actors:") || block.includes("scene:") || block.includes("clock:") || block.includes("passions:") || block.includes("combat:") || block.includes("relations:") || block.includes("world:")) {
      return block.replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "").trim();
    }
  }
  for (const block of matches) {
    if (block.includes("```yaml") || block.includes("```yml")) {
      return block.replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "").trim();
    }
  }
  if (matches.length > 0) {
    const candidate = matches[matches.length - 1];
    if (!candidate.includes("director_note")) {
      return candidate.replace(/<summary[^>]*>[\s\S]*?<\/summary>/i, "").trim();
    }
  }
  return null;
}
function parseLedgerYaml(rawLedgerText) {
  let combined = {};
  const codeBlocks = [];
  let blockMatch;
  YAML_BLOCK_RE.lastIndex = 0;
  while ((blockMatch = YAML_BLOCK_RE.exec(rawLedgerText)) !== null) {
    if (blockMatch[1]?.trim()) {
      codeBlocks.push(blockMatch[1].trim());
    }
  }
  function parseYamlChunkWithRecovery(chunk, target) {
    if (!chunk.trim())
      return;
    try {
      const parsed = yaml.load(chunk);
      if (parsed && typeof parsed === "object") {
        Object.assign(target, parsed);
        return;
      }
    } catch {}
    try {
      const sanitized = chunk.split(`
`).map((line) => {
        const flowMatch = line.match(/^(\s*[a-zA-Z0-9_-]+:\s*\{)(.*)(\}\s*)$/);
        if (flowMatch) {
          const prefix = flowMatch[1];
          const body = flowMatch[2];
          const suffix = flowMatch[3];
          const cleanedBody = body.replace(/([a-zA-Z0-9_-]+:\s*)"([\s\S]*?)"(?=\s*(?:,|\}))/g, (_m, k, val) => {
            return k + '"' + val.replace(/"/g, "\\\"") + '"';
          });
          return prefix + cleanedBody + suffix;
        }
        return line;
      }).join(`
`);
      const parsed = yaml.load(sanitized);
      if (parsed && typeof parsed === "object") {
        Object.assign(target, parsed);
        return;
      }
    } catch {}
    const subBlocks = chunk.split(/^(?=[a-zA-Z0-9_-]+:)/m);
    for (const sub of subBlocks) {
      if (!sub.trim())
        continue;
      try {
        const parsedSub = yaml.load(sub);
        if (parsedSub && typeof parsedSub === "object") {
          Object.assign(target, parsedSub);
          continue;
        }
      } catch {}
      const cleanedSub = sub.replace(/^\s*(?:tells|wounds|trauma):\s*\{.*$/gm, "");
      try {
        const parsedSub = yaml.load(cleanedSub);
        if (parsedSub && typeof parsedSub === "object") {
          Object.assign(target, parsedSub);
        }
      } catch {}
    }
  }
  if (codeBlocks.length > 0) {
    for (const block of codeBlocks) {
      parseYamlChunkWithRecovery(block, combined);
    }
  } else {
    const stripped = rawLedgerText.split(/\r?\n/).filter((line) => !line.trim().startsWith("#")).join(`
`);
    parseYamlChunkWithRecovery(stripped, combined);
  }
  if (combined.ledger && typeof combined.ledger === "object" && !Array.isArray(combined.ledger)) {
    combined = { ...combined.ledger, ...combined };
  }
  const actors = {};
  const standardRootKeys = new Set([
    "world",
    "clock",
    "places",
    "travel",
    "roster",
    "scene",
    "fronts",
    "journal",
    "bplots",
    "opportunities",
    "init",
    "ledger"
  ]);
  for (const [key, val] of Object.entries(combined)) {
    if (!standardRootKeys.has(key) && val && typeof val === "object" && !Array.isArray(val)) {
      const obj = val;
      if (obj.outfit || obj.passions || obj.relations || obj.inventory || obj.appearance || key === "user") {
        actors[key] = { id: key, ...obj };
      }
    }
  }
  if (combined.actors && typeof combined.actors === "object" && !Array.isArray(combined.actors)) {
    Object.assign(actors, combined.actors);
  }
  const result = {
    world: combined.world,
    clock: combined.clock,
    scene: combined.scene,
    places: combined.places,
    roster: Array.isArray(combined.roster) ? combined.roster : undefined,
    actors,
    bplots: Array.isArray(combined.bplots) ? combined.bplots : undefined,
    opportunities: Array.isArray(combined.opportunities) ? combined.opportunities : undefined,
    journal: Array.isArray(combined.journal) ? combined.journal : undefined
  };
  return result;
}
function deepMergeLedger(base, delta) {
  if (!base) {
    return {
      world: delta.world || {},
      clock: delta.clock || {},
      scene: delta.scene || {},
      places: delta.places || {},
      roster: delta.roster || [],
      actors: delta.actors || {},
      bplots: delta.bplots || [],
      opportunities: delta.opportunities || [],
      journal: delta.journal || []
    };
  }
  const merged = {
    world: {
      ...base.world,
      ...delta.world,
      ...base.world?.investigations || delta.world?.investigations ? {
        investigations: {
          ...base.world?.investigations || {},
          ...delta.world?.investigations || {}
        }
      } : {}
    },
    clock: { ...base.clock, ...delta.clock },
    scene: { ...base.scene, ...delta.scene },
    places: { ...base.places, ...delta.places },
    roster: delta.roster && delta.roster.length > 0 ? delta.roster : base.roster || [],
    actors: { ...base.actors },
    bplots: delta.bplots && delta.bplots.length > 0 ? delta.bplots : base.bplots || [],
    opportunities: delta.opportunities && delta.opportunities.length > 0 ? delta.opportunities : base.opportunities || [],
    journal: [...base.journal || [], ...delta.journal || []]
  };
  if (delta.actors) {
    for (const [actorId, actorDelta] of Object.entries(delta.actors)) {
      const baseActor = base.actors?.[actorId] || {};
      merged.actors[actorId] = {
        ...baseActor,
        ...actorDelta,
        appearance: { ...baseActor.appearance, ...actorDelta.appearance },
        money: { ...baseActor.money, ...actorDelta.money },
        passions: { ...baseActor.passions, ...actorDelta.passions },
        outfit: {
          ...baseActor.outfit,
          ...actorDelta.outfit,
          accessories: actorDelta.outfit?.accessories || baseActor.outfit?.accessories || [],
          scent: actorDelta.outfit?.scent !== undefined ? actorDelta.outfit.scent : baseActor.outfit?.scent,
          residue: actorDelta.outfit?.residue !== undefined ? actorDelta.outfit.residue : baseActor.outfit?.residue || [],
          integrity: actorDelta.outfit?.integrity !== undefined ? actorDelta.outfit.integrity : baseActor.outfit?.integrity ?? 100
        },
        inventory: {
          ...baseActor.inventory,
          ...actorDelta.inventory,
          in_hand: { ...baseActor.inventory?.in_hand, ...actorDelta.inventory?.in_hand },
          carried: actorDelta.inventory?.carried || baseActor.inventory?.carried || [],
          room: actorDelta.inventory?.room || baseActor.inventory?.room || []
        },
        relations: { ...baseActor.relations, ...actorDelta.relations }
      };
    }
  }
  return merged;
}
function inferProseEmotionDelta(prose, defaultActor = "char") {
  if (!prose || !prose.trim())
    return null;
  const paragraphs = extractParagraphs(prose);
  if (paragraphs.length === 0)
    return null;
  let targetSpeaker = defaultActor;
  for (let i = paragraphs.length - 1;i >= 0; i--) {
    const detected = detectSpeaker(paragraphs[i], defaultActor);
    if (detected.speaker && detected.speaker !== "Narrator") {
      targetSpeaker = detected.speaker.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      break;
    }
  }
  const lowerProse = prose.toLowerCase();
  let inferredEmotion = null;
  if (/\b(blush\w*|fluster\w*|flush\w*|shy\w*|embarrass\w*|heat rises)\b/i.test(lowerProse)) {
    inferredEmotion = "blush";
  } else if (/\b(smile\w*|laugh\w*|giggle\w*|grin\w*|chuckle\w*|warmly)\b/i.test(lowerProse)) {
    inferredEmotion = "smile";
  } else if (/\b(angr\w*|shout\w*|frown\w*|glar\w*|growl\w*|scowl\w*|snarl\w*|fum\w*)\b/i.test(lowerProse)) {
    inferredEmotion = "angry";
  } else if (/\b(scar\w*|fear\w*|trembl\w*|shiver\w*|gasp\w*|wide-eyed|shriek\w*)\b/i.test(lowerProse)) {
    inferredEmotion = "scared";
  } else if (/\b(sad\w*|cr\w*|sob\w*|weep\w*|tear\w*|falter\w*|mourn\w*|sniffl\w*)\b/i.test(lowerProse)) {
    inferredEmotion = "sad";
  } else if (/\b(suspicio\w*|doubt\w*|squint\w*|narrowed eyes)\b/i.test(lowerProse)) {
    inferredEmotion = "suspicious";
  }
  if (!inferredEmotion)
    return null;
  const passions = {
    blush: { arousal: 60 },
    smile: { joy: 60 },
    angry: { anger: 60 },
    scared: { fear: 60 },
    sad: { sadness: 60 },
    suspicious: { suspicion: 60 }
  }[inferredEmotion] || {};
  return {
    actors: {
      [targetSpeaker]: {
        passions
      }
    }
  };
}

// src/backend/asset-resolver.ts
function resolveDominantEmotion(passions) {
  if (!passions)
    return "neutral";
  if ((passions.arousal ?? 0) >= 50)
    return "blush";
  if ((passions.anger ?? 0) >= 40)
    return "angry";
  if ((passions.fear ?? 0) >= 40)
    return "scared";
  if ((passions.joy ?? 0) >= 40)
    return "smile";
  if ((passions.sadness ?? 0) >= 40)
    return "sad";
  if ((passions.suspicion ?? 0) >= 40)
    return "suspicious";
  return "neutral";
}
function resolveOutfitName(actor) {
  if (!actor?.outfit)
    return "default";
  if (actor.outfit.state) {
    const sanitized = actor.outfit.state.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (sanitized)
      return sanitized;
  }
  if (actor.outfit.top) {
    const sanitized = actor.outfit.top.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    if (sanitized)
      return sanitized;
  }
  return "default";
}

class AssetResolver {
  spindle;
  storage;
  constructor(spindle2, storage) {
    this.spindle = spindle2;
    this.storage = storage;
  }
  async resolveBackground(placeId, scope) {
    let cleanPlace = (placeId || "").toLowerCase().trim();
    let cleanScope = (scope || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
    if (!cleanScope && cleanPlace.includes(":")) {
      const parts = cleanPlace.split(":");
      cleanScope = parts[0].trim().replace(/[^a-z0-9_-]/g, "_");
      cleanPlace = parts[1].trim().replace(/[^a-z0-9_-]/g, "_");
    } else {
      cleanPlace = cleanPlace.replace(/[^a-z0-9_-]/g, "_");
    }
    const manifest = await this.storage.getManifest();
    if (cleanScope && cleanPlace) {
      const scopedKey1 = `${cleanScope}:${cleanPlace}`;
      const scopedKey2 = `${cleanScope}_${cleanPlace}`;
      if (manifest.places[scopedKey1])
        return { url: manifest.places[scopedKey1], isVideo: false };
      if (manifest.places[scopedKey2])
        return { url: manifest.places[scopedKey2], isVideo: false };
    }
    if (cleanPlace && manifest.places[cleanPlace]) {
      return { url: manifest.places[cleanPlace], isVideo: false };
    }
    for (const [key, url] of Object.entries(manifest.places)) {
      if (key.endsWith(`:${cleanPlace}`) || key.endsWith(`_${cleanPlace}`)) {
        return { url, isVideo: false };
      }
    }
    if (manifest.places["default"]) {
      return { url: manifest.places["default"], isVideo: false };
    }
    const svgFallback = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">` + `<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">` + `<stop offset="0%" stop-color="#141e30"/><stop offset="100%" stop-color="#243b55"/></linearGradient></defs>` + `<rect width="1280" height="720" fill="url(#bg)"/>` + `<text x="640" y="360" font-family="system-ui, sans-serif" font-size="28" fill="#ffffff88" text-anchor="middle">` + `${placeId ? placeId.toUpperCase() : "STAGE BACKGROUND"}</text></svg>`);
    return { url: svgFallback, isVideo: false };
  }
  async resolveCharacterSprite(actorId, actor, characterCardAvatarUrl, currentSentenceText) {
    const cleanActor = actorId.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
    const emotion = resolveDominantEmotion(actor?.passions);
    const outfit = resolveOutfitName(actor);
    const manifest = await this.storage.getManifest();
    const actorManifest = manifest.characters[cleanActor];
    if (actorManifest) {
      if (actorManifest.actions && currentSentenceText) {
        const lowerText = currentSentenceText.toLowerCase();
        for (const [actionName, actionUrl] of Object.entries(actorManifest.actions)) {
          if (lowerText.includes(actionName.toLowerCase())) {
            this.spindle.log.info(`[LumiVN] Matched action sprite '${actionName}' for actor '${cleanActor}'`);
            return { spriteUrl: actionUrl, layers: {}, emotion: actionName };
          }
        }
      }
      const outfits = actorManifest.outfits || actorManifest;
      if (outfits[outfit]?.[emotion]) {
        return { spriteUrl: outfits[outfit][emotion], layers: {}, emotion };
      }
      if (outfits[outfit]?.["neutral"]) {
        return { spriteUrl: outfits[outfit]["neutral"], layers: {}, emotion };
      }
      if (outfits["default"]?.[emotion]) {
        return { spriteUrl: outfits["default"][emotion], layers: {}, emotion };
      }
      if (outfits["default"]?.["neutral"]) {
        return { spriteUrl: outfits["default"]["neutral"], layers: {}, emotion };
      }
      for (const oKey of Object.keys(outfits)) {
        const exprs = outfits[oKey];
        if (exprs) {
          const anyUrl = exprs[emotion] || exprs["neutral"] || Object.values(exprs)[0];
          if (anyUrl)
            return { spriteUrl: anyUrl, layers: {}, emotion };
        }
      }
    }
    if (characterCardAvatarUrl) {
      return { spriteUrl: characterCardAvatarUrl, layers: {}, emotion };
    }
    const svgAvatar = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="800" viewBox="0 0 400 800">` + `<rect width="400" height="800" fill="transparent"/>` + `<circle cx="200" cy="220" r="100" fill="#4a5568" opacity="0.8"/>` + `<path d="M 80 750 C 80 450, 320 450, 320 750 Z" fill="#2d3748" opacity="0.8"/>` + `<text x="200" y="230" font-family="system-ui, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle">` + `${actorId.slice(0, 10).toUpperCase()}</text>` + `<text x="200" y="270" font-family="system-ui, sans-serif" font-size="16" fill="#cbd5e1" text-anchor="middle">` + `(${emotion})</text></svg>`);
    return { spriteUrl: svgAvatar, layers: {}, emotion };
  }
  async buildPresentationState(chatId, messageId, prose, ledger, characterId) {
    let hostAvatarUrl;
    let characterName;
    if (characterId) {
      try {
        const char = await this.spindle.characters.get(characterId);
        if (char?.image_id) {
          hostAvatarUrl = `/api/v1/images/${char.image_id}`;
        }
        if (char?.name) {
          characterName = char.name;
        }
      } catch {}
    }
    const stageCharacters = [];
    const participants = (ledger.scene?.participants || []).filter((p) => p && p.toLowerCase() !== "user");
    const firstNpc = participants[0];
    const fallbackSpeaker = characterName || (firstNpc ? ledger.actors?.[firstNpc]?.name || firstNpc : "Narrator");
    const paragraphs = extractParagraphs(prose);
    const firstPara = paragraphs[0] || "";
    const { speaker: activeSpeaker } = detectSpeaker(firstPara, fallbackSpeaker);
    const background = await this.resolveBackground(ledger.scene?.place);
    if (participants.length === 0) {
      if (ledger.roster && ledger.roster.length > 0) {
        for (const r of ledger.roster.slice(0, 3)) {
          participants.push(r.id || r.name || "npc");
        }
      } else if (characterId) {
        participants.push(characterId);
      }
    }
    const slots = participants.length === 1 ? ["center"] : participants.length === 2 ? ["left", "right"] : ["left", "center", "right"];
    for (let i = 0;i < participants.length && i < 3; i++) {
      const actorId = participants[i];
      const actorDossier = ledger.actors?.[actorId];
      const slot = slots[i];
      const actorName = actorDossier?.name || actorId;
      const normSpeaker = activeSpeaker.toLowerCase().trim();
      const normId = actorId.toLowerCase().trim();
      const normName = actorName.toLowerCase().trim();
      const isMatch = normSpeaker !== "narrator" && (normSpeaker === normId || normSpeaker === normName || normName.split(/\s+/).includes(normSpeaker) || normId.split(/[_-]/).includes(normSpeaker) || normSpeaker.length >= 3 && (normName.includes(normSpeaker) || normId.includes(normSpeaker)));
      const isSpeaker = isMatch || participants.length === 1 && normSpeaker !== "narrator";
      const latestJournalAction = ledger.journal && ledger.journal.length > 0 ? ledger.journal[ledger.journal.length - 1]?.action || "" : "";
      const currentSentenceText = `${firstPara} ${latestJournalAction}`.trim();
      const resolved = await this.resolveCharacterSprite(actorId, actorDossier, hostAvatarUrl, currentSentenceText);
      stageCharacters.push({
        actorId,
        name: actorDossier?.name || actorId,
        slot,
        isSpeaker,
        layers: resolved.layers,
        spriteUrl: resolved.spriteUrl,
        emotion: resolved.emotion
      });
    }
    let hasBPlotNotification = false;
    if (ledger.bplots && ledger.bplots.length > 0) {
      for (const bp of ledger.bplots) {
        if (bp.ripple === 2 && bp.status === "active") {
          hasBPlotNotification = true;
          break;
        }
      }
    }
    return {
      chatId,
      messageId,
      speakerName: activeSpeaker,
      paragraphs,
      background,
      characters: stageCharacters,
      ledger,
      hasBPlotNotification
    };
  }
}

// src/backend/toon-parser.ts
var TOON_COMMENT_RE2 = /<!--\s*toon\b([\s\S]*?)-->/i;
var TOON_FENCE_RE = /```(?:toon)?\s*([\s\S]*?)```/i;
var TOON_BRACKET_RE2 = /\[toon\b([\s\S]*?)\]/i;
function moodToPassions(mood) {
  const clean = (mood || "").toLowerCase().trim();
  switch (clean) {
    case "blush":
    case "horny":
    case "lust":
      return { arousal: 70 };
    case "angry":
    case "rage":
    case "mad":
      return { anger: 60 };
    case "scared":
    case "fear":
    case "shock":
      return { fear: 60 };
    case "smile":
    case "joy":
    case "happy":
    case "laugh":
      return { joy: 60 };
    case "sad":
    case "cry":
    case "sorrow":
      return { sadness: 60 };
    case "suspicious":
    case "doubt":
    case "glare":
      return { suspicion: 60 };
    default:
      return { arousal: 0, anger: 0, fear: 0, joy: 0, sadness: 0, suspicion: 0 };
  }
}
function extractToonRaw(content) {
  if (!content)
    return null;
  const commentMatch = TOON_COMMENT_RE2.exec(content);
  if (commentMatch && commentMatch[1])
    return commentMatch[1].trim();
  const bracketMatch = TOON_BRACKET_RE2.exec(content);
  if (bracketMatch && bracketMatch[1])
    return bracketMatch[1].trim();
  const fenceMatch = TOON_FENCE_RE.exec(content);
  if (fenceMatch && fenceMatch[1] && /actors\[|scene:/i.test(fenceMatch[1])) {
    return fenceMatch[1].trim();
  }
  return null;
}
function parseToonDelta(toonText) {
  if (!toonText || !toonText.trim())
    return null;
  const lines = toonText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("#"));
  if (lines.length === 0)
    return null;
  const result = {};
  let currentTable = null;
  for (const line of lines) {
    const tableHeaderMatch = /^([A-Za-z0-9_]+)\[\d*\]\{([^}]+)\}:?$/.exec(line);
    if (tableHeaderMatch) {
      const tableName = tableHeaderMatch[1].toLowerCase();
      const columns = tableHeaderMatch[2].split(",").map((c) => c.trim().toLowerCase());
      currentTable = { name: tableName, columns };
      continue;
    }
    if (currentTable && currentTable.name === "actors" && line.includes(",")) {
      const values = line.split(",").map((v) => v.trim());
      const rowData = {};
      currentTable.columns.forEach((col, idx) => {
        rowData[col] = values[idx] || "";
      });
      const actorId = rowData.id || rowData.actor || rowData.name;
      if (actorId) {
        if (!result.actors)
          result.actors = {};
        const passions = rowData.mood ? moodToPassions(rowData.mood) : undefined;
        const actorDelta = {};
        if (passions)
          actorDelta.passions = passions;
        if (rowData.outfit) {
          actorDelta.outfit = { state: rowData.outfit, top: rowData.outfit };
        }
        if (rowData.slot) {
          actorDelta.slot = rowData.slot;
        }
        result.actors[actorId] = actorDelta;
      }
      continue;
    }
    if (/^scene\s*:/i.test(line)) {
      currentTable = null;
      if (!result.scene)
        result.scene = {};
      const rest = line.replace(/^scene\s*:\s*/i, "").trim();
      const tokens = rest.split(/\s+/);
      for (const token of tokens) {
        const colonIdx = token.indexOf(":");
        if (colonIdx > 0) {
          const k = token.slice(0, colonIdx).toLowerCase();
          const v = token.slice(colonIdx + 1).trim();
          if (k === "place")
            result.scene.place = v;
          if (k === "time")
            result.scene.time = v;
          if (k === "weather")
            result.scene.weather = v;
        } else if (!result.scene.place && token) {
          result.scene.place = token;
        }
      }
      continue;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

// src/backend/director.ts
var DIRECTOR_DIRECTIVES = DEFAULT_DIRECTOR_SETTINGS.systemPrompt;
function extractChatId(context) {
  if (!context || typeof context !== "object")
    return null;
  const ctx = context;
  if (typeof ctx.chatId === "string" && ctx.chatId.trim())
    return ctx.chatId.trim();
  if (typeof ctx.chat_id === "string" && ctx.chat_id.trim())
    return ctx.chat_id.trim();
  const chatObj = ctx.chat;
  if (typeof chatObj?.id === "string" && chatObj.id.trim())
    return chatObj.id.trim();
  return null;
}
function extractGenerationType(context) {
  if (!context || typeof context !== "object")
    return null;
  const ctx = context;
  if (typeof ctx.generationType === "string" && ctx.generationType.trim()) {
    return ctx.generationType.trim();
  }
  return null;
}
function resolveIdentityMacros(template, userName = "User", charName = "Character") {
  if (!template)
    return "";
  return template.replace(/\{\{user\}\}/gi, userName).replace(/\{\{char\}\}/gi, charName);
}
function formatDirectorDirective(settings, userName, charName) {
  let activeDirective = (settings.systemPrompt || "").trim();
  if (settings.userNotes && settings.userNotes.trim()) {
    const resolvedNotes = resolveIdentityMacros(settings.userNotes.trim(), userName, charName);
    activeDirective = activeDirective ? `${activeDirective}

[Scene Notes & Guidance]
${resolvedNotes}` : resolvedNotes;
  }
  return activeDirective;
}
var STATE_DETAILS_CONTRACT = `[STATE DETAILS CONTRACT & DELTA RULES]
- TURN 1: Emit baseline dossier (appearance, money, combat, life_model, outfit, inventory, profile, relations).
- ONGOING TURNS (COMPACT DELTA — ZERO STATIC LEAK):
  * Omit ## World and ## Places unless location or rules shifted.
  * The extension permanently stores and merges state. NEVER re-emit unchanged fields.
  * \`user\` is strictly a delta after Turn 1. Omit unchanged user appearance, combat, life_model.
  * Sub-dictionary deltas:
    - Passions: Emit ONLY moved keys (e.g. passions: { anger: 20 }), never the full list.
    - Combat: Omit entirely unless HP/MP moved (e.g. combat: { hp: "80/100" }).
    - Outfit: Emit ONLY the slot that changed (e.g. outfit: { top: "none" }). Never re-emit unchanged bottom/shoes/underwear.
    - Inventory: Emit only the specific hand slot or carried prop that moved.
  * Journal: Along with everything Emit ONLY the new event(s) generated in THIS reply (\`EVT-n\`). Never re-print past records.
  * Inactive actors: If an actor had no state or gear shifts this turn, OMIT their dossier entirely.
- CONTAINERS & ZERO-SUM TRANSFERS:
  * Props exist in exactly one place (hand slot, container, or local places.resources). Transfers are zero-sum.
- MANDATORY COMPOUND PLACE KEYS: Places MUST use the format <unique_scope_name>:<room> (e.g. tendo_residence:kitchen, tendo_residence:foyer, nerima_high:classroom_2a) so backgrounds map accurately without room name collisions.
- ALWAYS EMIT: clock, scene, roster, journal, open opportunities, bplots (id plus changed fields only; ripple, status and any due or carrier change count as changed).

Always Append this below prose:
<details><summary>State</summary>

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
  scope:place_id: (Use unique name before common locations)
    function:
    traffic: 0-3
    privacy: 0-3
    visibility: 0-3
    access:
    norm:
    rhythm:
    resources: []
    population:
    hazards:
    barriers:
    affordances: []
    routes: [to: "scope:place_id", minutes: N]
travel:
  - {actor: , purpose: , from: , to: , depart: , eta: , status: }
\`\`\`

## Roster
NPCs ONLY. {{user}} is NEVER in roster (player id is \`user\`).
\`\`\`yaml
roster:(Use only the roster npc name for display in extension)
  - {id: , name: , lod: 0-3, status: , loc: , record: full, tick: }
\`\`\`

## Actor dossiers
COMBAT TABLE (Lv0..10; copy directly):
T1 HP 100-300 | MP 50-150 | PWR=AGI 15-45 (+20 HP, +10 MP, +3 stats/lv)
T2 HP 400-1000 | MP 200-500 | PWR=AGI 50-150 (+60 HP, +30 MP, +10 stats/lv)
T3 HP 1500-4500 | MP 800-2300 | PWR 200-650 | AGI 200-700 (+300 HP, +150 MP, +45 PWR, +50 AGI/lv)
T4 HP 6000-18000 | MP 3000-9000 | PWR 800-2300 | AGI 800-2600 (+1200 HP, +600 MP, +150 PWR, +180 AGI/lv)
T5 HP 25000-75000 | MP 15000-45000 | PWR 3000-9000 | AGI 3500-10500 (+5000 HP, +3000 MP, +600 PWR, +700 AGI/lv)
Rules: hp="cur/max"; mp="cur/max"; underwear: underwear_top, underwear_bottom (or \`none\`).

\`\`\`yaml
* \`user\`: Feeds Companion 'You' tab. Delta after Turn 1. 
Loadout: L:[Current|Empty] R:[Current|Empty] │ Pkt:[$Cash] │ Bnk:[$Bank] │ Carried:[Bags/Props]
Attire: Top:[Shirt] Bot:[Pants] UW:[Top]/[Bottom] Shoes:[Footwear] Cond:[Clean/Disheveled]
Body:[Build, traits, age, noticeable features]
Agency: ONLY \`want_now\`.
* NPCs: Full schema on Turn 1 debut; compact deltas ongoing.
\`\`\`

\`\`\`yaml
actor_id:
  appearance: {age: , traits: , appeal: 0-100, style: , condition: }
  money: {in_hand: 0, in_bank: 0, currency: "$"}
  combat: {tier: 1-10, lv: 0-10, exp: "0/100", hp: "cur/max", mp: "cur/max", eff_pwr: , eff_agi: , pwr: , agi: , int: , talent: []}
  life_model: {orientation: , romantic_history: , upbringing: , family: [], occupation: , residence: , routines: [cue, act, place, time], worldview: , self_concept: }
  wounds: {physical: [], psychological: []}
  trauma: []
  passions: {anger: 0-100, shame: 0-100, arousal: 0-100, fear: 0-100, stress: 0-100, pain: 0-100, exhaustion: 0-100, suspicion: 0-100, disgust: 0-100, sadness: 0-100, guilt: 0-100, joy: 0-100}
  constraints: ""
  outfit: {top: , bottom: , underwear_top: , underwear_bottom: , shoes: , accessories: [], state: }
  inventory: {in_hand: {L: "Empty", R: "Empty"}, carried: [], room: [], room_location: ""}
  profile:
    public_roles: []
    dispositions: {risk: , assertiveness: , empathy: , impulse_control: , curiosity: , sociability: , status_sensitivity: , acquisitiveness: , persistence: }
    capabilities: {}
    values: []
    self_concept: []
    boundaries: []
    red_lines: []
    defense: ""
    blind_spot: ""
    tells: {lying: "", hurt: "", shame: ""}
    stress_default:
  state: {condition: , needs: {name: urgency}, affect: {valence: , arousal: , control: , episodes: []}, resources: {}}
  agency:
    goals: [id, intent, priority, commitment, deadline, cause, progress, status]
    plans: [goal, steps, now, preconditions, revisions]
    policies: [id, when, effects, strength, origin]
    commitments: []
    want_now: want (source, cost)
  relations:
    other_id: {affinity: 0, trust: 0, respect: 0, attraction: 0, grudge: 0, fear: 0, familiarity: 0, attachment: 0, loyalty: 0-100, sacrifice_willingness: 0-100, betrayal_threshold: 50, shared_secrets: [], leverage: [], grievances: [], obligations: []}
  knowledge:
    beliefs: [p, conf, source, basis, t]
    memories: [evt, interpretation, salience, imprint, with]
    expectations: [situation, expect, conf]
    secrets: [truth, knows, suspects, exposure, cover]
    held_leverage: []
    presents_as: {audience: face}
  stats: {T, A, R, F, Fam, G, Integ, Stress, CAU, GRD, PRD, EMP, STB, BLD, RX, RC, Rig, Mask, MIS, WV, COMP}
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
  - {id: , cause: , stage: , due: , pressure: 0-5, known_by: []}
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
Offscreen third parties on their own clock. Debut with all fields; afterwards emit only \`id\` plus changed fields.
\`\`\`yaml
bplots:
  - id: "bp_id"
    who: "Distant person, group, or institution outside the local cast"
    want: "What they are after, in their own terms"
    doing: "What they are doing now on their own routine, miles away"
    knows: ["what they currently believe about the local cast; may be partial or wrong"]
    next: {move: "what they do next if nothing interferes", due: "D# HH:MM"}
    scope: "personal" # personal | household | neighborhood | city
    hooks: ["npc_id, front id, secret, or opportunity this touches"]
    carriers: [{what: "person, message, image, purchase, or record carrying local news outward", from: "npc_id or source", eta: "D# HH:MM"}]
    vector: "ordinary way the ripple reaches the scene (call, bill, delivery, visit, remark, notice); must match ripple stage"
    ripple: 1 # Stage 1 (isolated) | Stage 2 (ambient echo) | Stage 3 (collision); never lowered
    status: "active" # active | dormant | resolved
\`\`\`

## Opportunities
\`\`\`yaml
opportunities:
  - id: "opp_id"
    what: "Description of contestable opening"
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
async function evaluateDirectorInterceptor(messages, context, getChatState, getDirectorSettings, onInjectedDirective) {
  const chatId = extractChatId(context);
  const genType = extractGenerationType(context);
  const isDry = Boolean(context?.dryRun || context?.isDryRun);
  if (!chatId || isDry || genType === "quiet")
    return messages;
  const settings = getDirectorSettings ? await getDirectorSettings() : DEFAULT_DIRECTOR_SETTINGS;
  if (!settings || !settings.enabled)
    return messages;
  const currentState = await getChatState(chatId);
  if (!currentState)
    return messages;
  let activeDirective = formatDirectorDirective(settings);
  if (!activeDirective)
    return messages;
  const currentPlaceId = currentState.scene?.place;
  const currentPlace = currentPlaceId && currentState.places?.[currentPlaceId];
  const userDossier = currentState.actors?.["user"];
  if (currentPlace && userDossier?.outfit) {
    const norm = String(currentPlace.norm || "").toLowerCase();
    const privacy = Number(currentPlace.privacy ?? 0);
    const top = String(userDossier.outfit.top || "none").toLowerCase();
    const bottom = String(userDossier.outfit.bottom || "none").toLowerCase();
    const isUnderdressed = top === "none" || bottom === "none";
    if (privacy <= 1 && norm.includes("formal") && isUnderdressed) {
      activeDirective += `
[Director Guidance: {{user}} is visibly under-dressed for this public formal environment. Present NPCs must react to this breach before proceeding.]`;
    }
  }
  const investigations = currentState.world?.investigations;
  if (investigations && typeof investigations === "object") {
    for (const [auth, track] of Object.entries(investigations)) {
      if (track && typeof track === "object" && track.alert_level >= 1) {
        const cluesText = Array.isArray(track.clues) && track.clues.length > 0 ? track.clues.join(", ") : "none";
        activeDirective += `
[Director Alert: Investigation by ${track.authority || auth} active at Alert Level ${track.alert_level} targeting ${track.target_id || "suspect"}. Clues: ${cluesText}. Authorities and informants be vigilant.]`;
      }
    }
  }
  if (messages.some((m) => typeof m.content === "string" && (m.content.includes(activeDirective) || m.content.includes("[LumiVN Living World Director Guidance]")))) {
    return messages;
  }
  const systemGuard = `[LumiVN Living World Director Guidance]
${activeDirective}

[OUTPUT FORMAT REQUIREMENT]
Line 1: Return the director JSON object (optionally inside <details><summary>\uD83C\uDFAC Director</summary>...</details>):
{"director_note":"FIRST BEAT: ... WORLD: ... OFFSCREEN: ... PRESSURE: ... PRESENT: ... VOICE: ... TEXTURE: ... CANON: ... END ON: ...","thread_label":"<3-6 words thread title>"}

Follow immediately on Line 2 with natural narrative prose.
Below the prose, append the State details block:
${STATE_DETAILS_CONTRACT}`;
  const generationId = context?.generationId;
  if (onInjectedDirective) {
    if (generationId)
      onInjectedDirective(`${chatId}:${generationId}`, activeDirective);
    onInjectedDirective(chatId, activeDirective);
  }
  const directorBlock = {
    role: "system",
    content: systemGuard
  };
  return {
    messages: [directorBlock, ...messages],
    breakdown: [{ messageIndex: 0, name: "LumiVN Director" }]
  };
}
function computeDirectorImpactDiff(prevLedger, nextLedger, directive) {
  const worldChanges = [];
  const npcChanges = [];
  const mutations = [];
  const prevTime = prevLedger?.clock?.t;
  const nextTime = nextLedger?.clock?.t;
  if (nextTime && nextTime !== prevTime) {
    worldChanges.push(`Clock advanced: ${prevTime || "start"} -> ${nextTime}`);
  }
  const prevPlace = prevLedger?.scene?.place;
  const nextPlace = nextLedger?.scene?.place;
  if (nextPlace && nextPlace !== prevPlace) {
    worldChanges.push(`Scene location moved: ${prevPlace || "initial"} -> ${nextPlace}`);
  }
  const prevBPlots = prevLedger?.bplots || [];
  const nextBPlots = nextLedger?.bplots || [];
  for (const nextBp of nextBPlots) {
    const prevBp = prevBPlots.find((b) => b.id === nextBp.id);
    if (!prevBp) {
      worldChanges.push(`New B-Plot: ${nextBp.who || nextBp.id} (${nextBp.doing || "active"}) [ripple ${nextBp.ripple ?? 1}]`);
    } else if (prevBp.ripple !== nextBp.ripple) {
      worldChanges.push(`B-Plot escalated: ${nextBp.who || nextBp.id} ripple ${prevBp.ripple} -> ${nextBp.ripple}`);
    } else if (prevBp.status !== nextBp.status) {
      worldChanges.push(`B-Plot status shift: ${nextBp.who || nextBp.id} -> ${nextBp.status}`);
    }
  }
  const prevOpps = prevLedger?.opportunities || [];
  const nextOpps = nextLedger?.opportunities || [];
  for (const nextOpp of nextOpps) {
    const prevOpp = prevOpps.find((o) => o.id === nextOpp.id);
    if (!prevOpp) {
      worldChanges.push(`New Opportunity: "${nextOpp.what || nextOpp.id}" (${nextOpp.status || "lead"})`);
    } else if (prevOpp.status !== nextOpp.status) {
      worldChanges.push(`Opportunity status changed: "${nextOpp.what || nextOpp.id}" -> ${nextOpp.status}`);
    }
  }
  const prevInvs = prevLedger?.world?.investigations || {};
  const nextInvs = nextLedger?.world?.investigations || {};
  for (const [auth, track] of Object.entries(nextInvs)) {
    if (!track)
      continue;
    const prevTrack = prevInvs[auth];
    const name = track.authority || auth;
    if (!prevTrack) {
      worldChanges.push(`New Investigation: ${name} targeting ${track.target_id || "suspect"} (Alert Level ${track.alert_level})`);
    } else {
      if (track.alert_level !== prevTrack.alert_level) {
        worldChanges.push(`Investigation alert escalated: ${name} Alert Level ${prevTrack.alert_level} -> ${track.alert_level}`);
      }
      const prevClues = prevTrack.clues || [];
      const nextClues = track.clues || [];
      const newClues = nextClues.filter((c) => !prevClues.includes(c));
      if (newClues.length > 0) {
        worldChanges.push(`Investigation clues discovered by ${name}: ${newClues.join(", ")}`);
      }
    }
  }
  const nextActors = nextLedger?.actors || {};
  const prevActors = prevLedger?.actors || {};
  for (const [actorId, actor] of Object.entries(nextActors)) {
    if (!actor)
      continue;
    const prevActor = prevActors[actorId];
    const name = actor.name || actorId;
    const prevWantNow = prevActor?.agency?.want_now || prevActor?.state?.want_now;
    const nextWantNow = actor.agency?.want_now || actor.state?.want_now;
    const wantChanged = Boolean(nextWantNow && nextWantNow !== prevWantNow);
    const prevGoals = prevActor?.agency?.goals;
    const nextGoals = actor.agency?.goals;
    const goalsChanged = Boolean(nextGoals && JSON.stringify(nextGoals) !== JSON.stringify(prevGoals));
    const passionsMoved = {};
    const nextPassions = actor.passions || {};
    const prevPassions = prevActor?.passions || {};
    for (const [pKey, pVal] of Object.entries(nextPassions)) {
      if (typeof pVal === "number" && pVal !== prevPassions[pKey]) {
        passionsMoved[pKey] = pVal;
      }
    }
    const relationsMoved = {};
    const nextRelations = actor.relations || {};
    const prevRelations = prevActor?.relations || {};
    for (const [target, relData] of Object.entries(nextRelations)) {
      if (JSON.stringify(relData) !== JSON.stringify(prevRelations[target])) {
        relationsMoved[target] = relData;
      }
    }
    const prevOutfit = prevActor?.outfit;
    const nextOutfit = actor.outfit;
    const attireShifts = [];
    if (nextOutfit && prevOutfit) {
      if (nextOutfit.integrity !== undefined && nextOutfit.integrity !== prevOutfit.integrity) {
        attireShifts.push(`integrity ${prevOutfit.integrity ?? 100}% -> ${nextOutfit.integrity}%`);
      }
      if (nextOutfit.scent !== undefined && nextOutfit.scent !== prevOutfit.scent) {
        attireShifts.push(`scent "${prevOutfit.scent || "none"}" -> "${nextOutfit.scent}"`);
      }
      const prevResidue = JSON.stringify(prevOutfit.residue || []);
      const nextResidue = JSON.stringify(nextOutfit.residue || []);
      if (nextResidue !== prevResidue) {
        attireShifts.push(`residue [${(nextOutfit.residue || []).join(", ")}]`);
      }
    } else if (nextOutfit && !prevOutfit) {
      if (nextOutfit.scent)
        attireShifts.push(`scent "${nextOutfit.scent}"`);
      if (nextOutfit.residue && nextOutfit.residue.length > 0) {
        attireShifts.push(`residue [${nextOutfit.residue.join(", ")}]`);
      }
      if (nextOutfit.integrity !== undefined && nextOutfit.integrity < 100) {
        attireShifts.push(`integrity ${nextOutfit.integrity}%`);
      }
    }
    const attireChanged = attireShifts.length > 0 ? attireShifts.join("; ") : undefined;
    if (wantChanged || goalsChanged || Object.keys(passionsMoved).length > 0 || Object.keys(relationsMoved).length > 0 || attireChanged) {
      npcChanges.push({
        actorId,
        name,
        wantNow: nextWantNow || (goalsChanged ? `Goals: ${JSON.stringify(nextGoals)}` : undefined),
        passionsMoved: Object.keys(passionsMoved).length > 0 ? passionsMoved : undefined,
        relationsMoved: Object.keys(relationsMoved).length > 0 ? relationsMoved : undefined,
        attireChanged
      });
    }
  }
  if (nextLedger?.journal && nextLedger.journal.length > 0) {
    const latest = nextLedger.journal[nextLedger.journal.length - 1];
    if (Array.isArray(latest?.mutations)) {
      for (const m of latest.mutations) {
        if (m)
          mutations.push(String(m));
      }
    }
  }
  return {
    timestamp: new Date().toLocaleTimeString(),
    directive: directive || "Default living world constraints",
    worldChanges,
    npcChanges,
    mutations
  };
}
function processBPlots(ledger) {
  let hasBPlotNotification = false;
  const activeRipples = [];
  const promotedActors = [];
  if (!ledger.bplots || !Array.isArray(ledger.bplots)) {
    return { hasBPlotNotification, activeRipples, promotedActors };
  }
  if (!ledger.roster) {
    ledger.roster = [];
  }
  for (const bp of ledger.bplots) {
    if (bp.ripple === 2 && bp.status === "active") {
      hasBPlotNotification = true;
      activeRipples.push(bp);
    } else if (bp.ripple === 3) {
      const who = bp.who?.trim() || "newcomer";
      const exists = ledger.roster.some((r) => r.id === who || r.name && r.name.toLowerCase() === who.toLowerCase());
      if (!exists) {
        ledger.roster.push({
          id: who,
          name: who,
          lod: 2,
          status: bp.doing || "Arrived in area",
          loc: ledger.scene?.place || "default",
          record: "roster",
          tick: 1
        });
        promotedActors.push(who);
      }
    }
  }
  return { hasBPlotNotification, activeRipples, promotedActors };
}

// src/backend.ts
var storage = new StorageManager(spindle);
var resolver = new AssetResolver(spindle, storage);
var lastActiveChatId = null;
var isStageOpen = false;
var activeVnChatId = null;
var activeGenerationIds = new Map;
var pendingCommits = new Map;
var injectedDirectives = new Map;
var directorLogBuffers = new Map;
async function handleInterceptor(messages, context) {
  let effectiveChatId = extractChatId(context);
  if (!effectiveChatId) {
    effectiveChatId = lastActiveChatId || await resolveEffectiveChatId();
  }
  const effectiveContext = context && typeof context === "object" ? { ...context, chatId: effectiveChatId } : { chatId: effectiveChatId };
  return evaluateDirectorInterceptor(messages, effectiveContext, async (cid) => {
    const state = await storage.getChatState(cid);
    return state || { scene: { place: "default" }, actors: {} };
  }, () => storage.getDirectorSettings(), (key, directive) => injectedDirectives.set(key, directive));
}
if (typeof spindle.registerInterceptor === "function") {
  spindle.registerInterceptor(handleInterceptor, 50);
  spindle.log.info("[LumiVN] Living World Director interceptor registered at priority 50.");
}
function onHostChatSwitched(chatId) {
  if (!chatId)
    return;
  lastActiveChatId = chatId;
  activeVnChatId = chatId;
  spindle.log.info("[LumiVN] Active chat switched to: " + chatId);
  if (isStageOpen) {
    processChatTurn(chatId, undefined, undefined, true);
  }
}
var spindleAnyObj = spindle;
if (typeof spindleAnyObj.on === "function") {
  spindleAnyObj.on("CHAT_SWITCHED", (payload) => {
    const candidate = payload && typeof payload === "object" ? payload : {};
    if (typeof candidate.chatId === "string" && candidate.chatId) {
      onHostChatSwitched(candidate.chatId);
    }
  });
  spindleAnyObj.on("CHAT_CHANGED", (payload) => {
    const candidate = payload && typeof payload === "object" ? payload : {};
    const cid = (typeof candidate.chat?.id === "string" ? candidate.chat.id : null) || (typeof candidate.chatId === "string" ? candidate.chatId : null);
    if (cid) {
      onHostChatSwitched(cid);
    }
  });
  spindleAnyObj.on("CHAT_FORKED", (payload) => {
    const candidate = payload && typeof payload === "object" ? payload : {};
    const cid = (typeof candidate.forkedChatId === "string" ? candidate.forkedChatId : null) || (typeof candidate.chat?.id === "string" ? candidate.chat.id : null);
    if (cid) {
      onHostChatSwitched(cid);
    }
  });
}
async function resolveEffectiveChatId(suppliedChatId) {
  if (suppliedChatId && suppliedChatId.trim()) {
    lastActiveChatId = suppliedChatId.trim();
    return lastActiveChatId;
  }
  if (lastActiveChatId)
    return lastActiveChatId;
  try {
    const list = await spindle.chats.list?.({ limit: 1 });
    const first = list?.data?.[0] || list?.[0];
    const resolved = first?.id || first?.chat_id;
    if (resolved) {
      lastActiveChatId = resolved;
      return resolved;
    }
  } catch {}
  return null;
}
spindle.commands.register([
  {
    id: "lumivn_launch",
    label: "Visual Novel: Open Stage",
    description: "Launch full-screen Ren'Py visual novel mode",
    keywords: ["vn", "renpy", "play", "stage", "visual novel"],
    scope: "chat"
  },
  {
    id: "lumivn_diagnostics",
    label: "Visual Novel: Open Diagnostics",
    description: "Inspect Ledger extraction state and loaded assets",
    keywords: ["debug", "diagnostics", "ledger", "vn"],
    scope: "global"
  }
]);
spindle.commands.onInvoked(async (commandId) => {
  if (commandId === "lumivn_launch") {
    isStageOpen = true;
    spindle.sendToFrontend({ type: "vn_force_open" });
  } else if (commandId === "lumivn_diagnostics") {
    await spindle.ui.openDrawerTab("vn_diagnostics");
  }
});
async function processChatTurn(chatId, messageId, overrideContent, force = false, generationId) {
  if (!chatId)
    return;
  if (!isStageOpen && !force)
    return;
  activeVnChatId = chatId;
  lastActiveChatId = chatId;
  try {
    let targetMessage = null;
    let characterId;
    try {
      const activeChat = await spindle.chats.get(chatId);
      if (activeChat) {
        characterId = activeChat.character_id;
      }
    } catch {}
    if (overrideContent) {
      targetMessage = {
        id: messageId || `msg_${Date.now()}`,
        role: "assistant",
        content: overrideContent,
        created_at: new Date().toISOString()
      };
    } else {
      let messages = [];
      try {
        messages = await spindle.chat.getMessages(chatId);
      } catch {}
      const boundedMessages = Array.isArray(messages) ? messages : [];
      for (let i = boundedMessages.length - 1;i >= 0; i--) {
        const m = boundedMessages[i];
        if (m && (m.role === "assistant" || !m.is_user)) {
          targetMessage = m;
          break;
        }
      }
    }
    let cumulativeLedger = await storage.getChatState(chatId);
    if (!targetMessage || !targetMessage.content) {
      if (!cumulativeLedger) {
        cumulativeLedger = { scene: { place: "default" }, actors: {} };
      }
      const presentation = await resolver.buildPresentationState(chatId, "msg_init", "", cumulativeLedger, characterId);
      spindle.sendToFrontend({
        type: "vn_state",
        state: presentation
      });
      return;
    }
    try {
      const jsonMatch = targetMessage.content.match(/\{[\s\S]*?"director_note"[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && typeof parsed.director_note === "string") {
          spindle.sendToFrontend({
            type: "vn_director_note",
            data: {
              directorNote: parsed.director_note.trim(),
              threadLabel: (parsed.thread_label || "Active Thread").trim(),
              timestamp: new Date().toLocaleTimeString()
            }
          });
        }
      }
    } catch (e) {}
    const rawLedger = extractLedgerRaw(targetMessage.content);
    const rawToon = rawLedger ? null : extractToonRaw(targetMessage.content);
    const prevLedger = cumulativeLedger ? JSON.parse(JSON.stringify(cumulativeLedger)) : null;
    let delta = null;
    if (rawLedger) {
      delta = parseLedgerYaml(rawLedger);
    } else if (rawToon) {
      delta = parseToonDelta(rawToon);
    } else {
      const prose = extractProse(targetMessage.content);
      delta = inferProseEmotionDelta(prose, characterId || "char");
    }
    if (delta) {
      cumulativeLedger = deepMergeLedger(cumulativeLedger, delta);
    } else if (!cumulativeLedger) {
      cumulativeLedger = deepMergeLedger(null, {});
    }
    const bplotResult = processBPlots(cumulativeLedger);
    if (bplotResult.hasBPlotNotification) {
      spindle.sendToFrontend({
        type: "vn_bplot_notification",
        chatId,
        ripples: bplotResult.activeRipples
      });
      spindle.sendToFrontend({
        type: "vn_log",
        message: `[B-Plot Alert] Active ripple(s): ${bplotResult.activeRipples.map((r) => `${r.who}: ${r.doing}`).join("; ")}`,
        level: "warn"
      });
    }
    const effectiveGenId = generationId || activeGenerationIds.get(chatId);
    const commitKey = effectiveGenId ? `${chatId}:${effectiveGenId}` : null;
    if (commitKey) {
      pendingCommits.set(commitKey, cumulativeLedger);
    }
    await storage.saveChatState(chatId, cumulativeLedger);
    if (commitKey) {
      pendingCommits.delete(commitKey);
    }
    const activeDirective = effectiveGenId && injectedDirectives.get(`${chatId}:${effectiveGenId}`) || injectedDirectives.get(chatId) || (await storage.getDirectorSettings()).systemPrompt;
    const directorEntry = computeDirectorImpactDiff(prevLedger, cumulativeLedger, activeDirective);
    let logBuffer = directorLogBuffers.get(chatId);
    if (!logBuffer) {
      logBuffer = await storage.getDirectorLogs(chatId);
    }
    logBuffer.push(directorEntry);
    if (logBuffer.length > 20) {
      logBuffer = logBuffer.slice(logBuffer.length - 20);
    }
    directorLogBuffers.set(chatId, logBuffer);
    await storage.saveDirectorLogs(chatId, logBuffer);
    spindle.sendToFrontend({
      type: "vn_director_log",
      log: directorEntry
    });
    if (effectiveGenId) {
      injectedDirectives.delete(`${chatId}:${effectiveGenId}`);
    }
    const prose = extractProse(targetMessage.content);
    const presentation = await resolver.buildPresentationState(chatId, targetMessage.id || "msg_latest", prose, cumulativeLedger, characterId);
    if (bplotResult.hasBPlotNotification) {
      presentation.hasBPlotNotification = true;
    }
    spindle.sendToFrontend({
      type: "vn_state",
      state: presentation
    });
    spindle.sendToFrontend({
      type: "vn_diagnostic_update",
      data: {
        timestamp: new Date().toLocaleTimeString(),
        chatId,
        messageId: targetMessage.id,
        hasLedger: Boolean(rawLedger || rawToon || delta),
        placeId: cumulativeLedger?.scene?.place || "default",
        participants: presentation.characters.map((c) => `${c.name} (${c.slot}) [${c.spriteUrl?.startsWith("data:") ? "Fallback SVG" : c.spriteUrl || "none"}]`),
        bgUrl: presentation.background.url
      }
    });
    spindle.log.info(`[LumiVN] Turn processed. Place: ${cumulativeLedger?.scene?.place || "none"}, Ledger found: ${Boolean(rawLedger)}`);
  } catch (err) {
    console.error(`[LumiVN] Error processing turn for chat ${chatId}:`, err);
    spindle.sendToFrontend({
      type: "vn_error",
      error: String(err)
    });
  }
}
spindle.on("GENERATION_STARTED", (payload) => {
  const { chatId, generationId } = payload || {};
  if (!chatId || !generationId)
    return;
  activeVnChatId = chatId;
  lastActiveChatId = chatId;
  const previousGenId = activeGenerationIds.get(chatId);
  if (previousGenId && previousGenId !== generationId) {
    pendingCommits.delete(`${chatId}:${previousGenId}`);
    injectedDirectives.delete(`${chatId}:${previousGenId}`);
    spindle.log.info(`[LumiVN] Discarded uncommitted state from superseded generation ${previousGenId} on chat ${chatId}`);
  }
  activeGenerationIds.set(chatId, generationId);
  if (isStageOpen) {
    spindle.sendToFrontend({ type: "vn_generating", chatId });
  }
});
spindle.on("GENERATION_STOPPED", (payload) => {
  const { chatId, generationId } = payload || {};
  if (!chatId || !generationId)
    return;
  const commitKey = `${chatId}:${generationId}`;
  pendingCommits.delete(commitKey);
  injectedDirectives.delete(commitKey);
  if (activeGenerationIds.get(chatId) === generationId) {
    activeGenerationIds.delete(chatId);
  }
  spindle.log.info(`[LumiVN] Discarded staged commit for stopped generation ${generationId}`);
});
spindle.on("GENERATION_ENDED", async (payload) => {
  const { chatId, generationId, error } = payload || {};
  if (!chatId)
    return;
  if (error) {
    if (generationId) {
      pendingCommits.delete(`${chatId}:${generationId}`);
      injectedDirectives.delete(`${chatId}:${generationId}`);
    }
    if (activeGenerationIds.get(chatId) === generationId) {
      activeGenerationIds.delete(chatId);
    }
    spindle.log.warn(`[LumiVN] Generation ${generationId} failed with error (${error}), discarded pending commits.`);
    return;
  }
  if (generationId && activeGenerationIds.get(chatId) === generationId) {
    activeGenerationIds.delete(chatId);
  }
  if (!isStageOpen)
    return;
  await processChatTurn(chatId, payload.messageId, payload.content, false, generationId);
});
spindle.on("MESSAGE_SWIPED", async (payload) => {
  if (!isStageOpen)
    return;
  const cid = payload?.chatId || activeVnChatId || lastActiveChatId;
  if (cid)
    await processChatTurn(cid, payload.message?.id);
});
spindle.on("SWIPE_EDITED", async (payload) => {
  if (!isStageOpen)
    return;
  const cid = payload?.chatId || activeVnChatId || lastActiveChatId;
  if (cid)
    await processChatTurn(cid, payload.message?.id);
});
var spindleAny = spindle;
if (typeof spindleAny.on === "function") {
  spindleAny.on("MESSAGE_EDITED", async (payload) => {
    if (!isStageOpen)
      return;
    const cid = payload?.chatId || activeVnChatId || lastActiveChatId;
    if (cid)
      await processChatTurn(cid, payload.messageId);
  });
  spindleAny.on("MESSAGE_DELETED", async (payload) => {
    if (!isStageOpen)
      return;
    const cid = payload?.chatId || activeVnChatId || lastActiveChatId;
    if (cid)
      await processChatTurn(cid);
  });
}
spindle.onFrontendMessage(async (msg, senderUserId) => {
  const payload = msg;
  if (!payload || typeof payload !== "object")
    return;
  const type = String(payload.type);
  switch (type) {
    case "vn_stage_opened": {
      isStageOpen = true;
      const cid = String(payload.chatId || "");
      if (cid) {
        activeVnChatId = cid;
        lastActiveChatId = cid;
      }
      break;
    }
    case "vn_stage_closed": {
      isStageOpen = false;
      break;
    }
    case "vn_get_state":
    case "vn_init": {
      isStageOpen = true;
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      if (chatId) {
        activeVnChatId = chatId;
        lastActiveChatId = chatId;
        await processChatTurn(chatId, undefined, undefined, true);
      } else {
        spindle.sendToFrontend({
          type: "vn_error",
          error: "No active chat could be found to launch Visual Novel."
        });
      }
      break;
    }
    case "vn_action": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      const actionText = String(payload.action || "");
      spindle.log.info(`[LumiVN] Dispatching action for chat ${chatId}: "${actionText.slice(0, 60)}"`);
      if (!chatId || !actionText) {
        spindle.sendToFrontend({
          type: "vn_error",
          error: "Failed to dispatch action: chatId or actionText was empty"
        });
        break;
      }
      try {
        await spindle.chat.appendMessage(chatId, { role: "user", content: actionText }, { triggerGeneration: true });
        spindle.log.info(`[LumiVN] Successfully appended user message and triggered generation.`);
        spindle.sendToFrontend({
          type: "vn_log",
          message: `Dispatched user action: "${actionText.slice(0, 40)}..."`,
          level: "action"
        });
      } catch (err) {
        const errMsg = String(err?.message || err);
        spindle.log.error(`[LumiVN] Failed to dispatch action: ${errMsg}`);
        let userNotice = errMsg;
        if (errMsg.includes("PERMISSION_DENIED: generation")) {
          userNotice = 'PERMISSION_DENIED: Please enable the "Generation" permission under Settings → Extensions → LumiVN Interactive Studio.';
        }
        spindle.sendToFrontend({
          type: "vn_error",
          error: `Action dispatch failed: ${userNotice}`
        });
      }
      break;
    }
    case "vn_get_manifest": {
      const manifest = await storage.getManifest();
      spindle.sendToFrontend({ type: "vn_manifest", manifest });
      break;
    }
    case "vn_save_manifest": {
      const manifest = payload.manifest;
      if (manifest) {
        await storage.saveManifest(manifest);
        spindle.sendToFrontend({ type: "vn_manifest", manifest });
      }
      break;
    }
    case "vn_get_director_settings": {
      const settings = await storage.getDirectorSettings();
      spindle.sendToFrontend({ type: "vn_director_settings", settings });
      break;
    }
    case "vn_save_director_settings": {
      const settings = payload.settings;
      if (settings) {
        await storage.saveDirectorSettings(settings);
        if (typeof spindle.toast?.success === "function") {
          spindle.toast.success("Director prompt saved");
        }
        spindle.sendToFrontend({ type: "vn_director_settings", settings });
        spindle.sendToFrontend({
          type: "vn_log",
          message: "Director prompt and scene notes saved.",
          level: "info"
        });
      }
      break;
    }
    case "vn_get_director_logs": {
      const chatId = await resolveEffectiveChatId(String(payload.chatId || ""));
      if (chatId) {
        let logs = directorLogBuffers.get(chatId);
        if (!logs) {
          logs = await storage.getDirectorLogs(chatId);
          directorLogBuffers.set(chatId, logs);
        }
        spindle.sendToFrontend({
          type: "vn_director_logs",
          chatId,
          logs
        });
      }
      break;
    }
    case "vn_edit_message": {
      const chatId = String(payload.chatId || "");
      const messageId = String(payload.messageId || "");
      const content = String(payload.content || "");
      if (chatId && messageId && content) {
        try {
          await spindle.chat.updateMessage(chatId, messageId, { content });
          spindle.log.info(`[LumiVN] Updated message ${messageId} in chat ${chatId}`);
          await processChatTurn(chatId, messageId, content);
          spindle.sendToFrontend({
            type: "vn_log",
            message: `Updated line in message #${messageId.slice(0, 8)}`,
            level: "info"
          });
        } catch (err) {
          spindle.log.error(`[LumiVN] Failed to edit message: ${err.message || err}`);
          spindle.sendToFrontend({ type: "vn_error", error: `Edit failed: ${String(err.message || err)}` });
        }
      }
      break;
    }
    case "vn_upload_asset": {
      try {
        const category = String(payload.category);
        const scope = String(payload.scope || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        let placeId = String(payload.placeId || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        const actorId = String(payload.actorId || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        const outfit = String(payload.outfit || "default").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        const expression = String(payload.expression || "neutral").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        const actionName = String(payload.actionName || "").toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
        const filename = String(payload.filename || "asset.png");
        const dataUrl = String(payload.dataUrl || "");
        const chatId = String(payload.chatId || "");
        if (!dataUrl)
          throw new Error("No image data provided");
        const finalPlaceKey = scope ? `${scope}:${placeId}` : placeId;
        let resolvedUserId = senderUserId || payload.userId;
        if (!resolvedUserId && chatId) {
          try {
            const chat = await spindle.chats.get(chatId);
            resolvedUserId = chat?.user_id || chat?.userId;
          } catch {}
        }
        if (!resolvedUserId) {
          try {
            const chatList = await spindle.chats.list?.({ limit: 1 });
            const first = chatList?.data?.[0];
            resolvedUserId = first?.user_id || first?.userId;
          } catch {}
        }
        let base64 = dataUrl;
        let mimeType = "image/png";
        if (base64.includes(",")) {
          const match = base64.match(/data:([^;]+);base64,/);
          if (match)
            mimeType = match[1];
          base64 = base64.split(",")[1] ?? "";
        }
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0;i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const upload = await spindle.images.upload({
          data: bytes,
          filename,
          mime_type: mimeType,
          userId: resolvedUserId,
          user_id: resolvedUserId
        }, resolvedUserId);
        const manifest = await storage.getManifest();
        if (category === "places" && finalPlaceKey) {
          manifest.places[finalPlaceKey] = upload.url;
        } else if (category === "characters" && actorId) {
          if (!manifest.characters[actorId])
            manifest.characters[actorId] = {};
          if (!manifest.characters[actorId].outfits)
            manifest.characters[actorId].outfits = {};
          if (!manifest.characters[actorId].outfits[outfit])
            manifest.characters[actorId].outfits[outfit] = {};
          manifest.characters[actorId].outfits[outfit][expression] = upload.url;
        } else if (category === "actions" && actorId && actionName) {
          if (!manifest.characters[actorId])
            manifest.characters[actorId] = {};
          if (!manifest.characters[actorId].actions)
            manifest.characters[actorId].actions = {};
          manifest.characters[actorId].actions[actionName] = upload.url;
        }
        await storage.saveManifest(manifest);
        spindle.sendToFrontend({ type: "vn_manifest", manifest });
        spindle.sendToFrontend({
          type: "vn_log",
          message: `Registered: ${category} -> ${finalPlaceKey || `${actorId}/${outfit}/${expression}` || actionName}`,
          level: "info"
        });
        if (chatId) {
          await processChatTurn(chatId);
        }
      } catch (err) {
        spindle.sendToFrontend({ type: "vn_error", error: `Upload failed: ${String(err.message || err)}` });
      }
      break;
    }
    case "vn_delete_asset": {
      try {
        const category = String(payload.category);
        const key = String(payload.key || "");
        const actorId = String(payload.actorId || "").toLowerCase();
        const outfit = String(payload.outfit || "");
        const expression = String(payload.expression || "");
        const actionName = String(payload.actionName || "");
        const chatId = String(payload.chatId || "");
        const manifest = await storage.getManifest();
        if (category === "places" && key) {
          delete manifest.places[key];
        } else if (category === "characters" && actorId && outfit && expression) {
          const charData = manifest.characters[actorId];
          if (charData) {
            if (charData.outfits?.[outfit]) {
              delete charData.outfits[outfit][expression];
              if (Object.keys(charData.outfits[outfit]).length === 0) {
                delete charData.outfits[outfit];
              }
            }
            if (charData[outfit]?.[expression]) {
              delete charData[outfit][expression];
              if (Object.keys(charData[outfit]).length === 0) {
                delete charData[outfit];
              }
            }
            if (charData.outfits && Object.keys(charData.outfits).length === 0) {
              delete charData.outfits;
            }
            const hasOutfits = charData.outfits && Object.keys(charData.outfits).length > 0;
            const hasDirectOutfits = Object.keys(charData).filter((k) => k !== "actions" && k !== "outfits").some((k) => typeof charData[k] === "object" && charData[k] !== null);
            const hasActions = charData.actions && Object.keys(charData.actions).length > 0;
            if (!hasOutfits && !hasDirectOutfits && !hasActions) {
              delete manifest.characters[actorId];
            }
          }
        } else if (category === "actions" && actorId && actionName) {
          if (manifest.characters[actorId]?.actions) {
            delete manifest.characters[actorId].actions[actionName];
            if (Object.keys(manifest.characters[actorId].actions).length === 0) {
              delete manifest.characters[actorId].actions;
            }
          }
          if (manifest.characters[actorId] && Object.keys(manifest.characters[actorId]).length === 0) {
            delete manifest.characters[actorId];
          }
        }
        await storage.saveManifest(manifest);
        spindle.sendToFrontend({ type: "vn_manifest", manifest });
        spindle.sendToFrontend({
          type: "vn_log",
          message: `Deleted asset entry: ${category} -> ${key || actionName || `${actorId}/${outfit}/${expression}`}`,
          level: "info"
        });
        if (chatId) {
          await processChatTurn(chatId);
        }
      } catch (err) {
        spindle.sendToFrontend({ type: "vn_error", error: `Delete failed: ${String(err.message || err)}` });
      }
      break;
    }
  }
});
