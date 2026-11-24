/* On-device AI helper for Keeper's Desk. Optional; nothing loads until the Keeper turns it on.
   Model: SmolLM2 360M Instruct. It is small: prompts ask for one short item at a time,
   use a worked example, and output is trimmed to a single line. */
(() => {
"use strict";

const MODEL_PATH = "HuggingFaceTB/SmolLM2-360M-Instruct";
const CACHE = "transformers-cache";
const SIZE_MB = 400;

let worker = null, ready = null, seq = 0, device = "";
const pending = new Map();
const listeners = new Set();
const st = { status: "idle", loaded: 0, total: 0, error: "" }; // idle | loading | ready | error

function emit() { listeners.forEach((f) => { try { f(st); } catch (e) { console.warn(e); } }); }
function set(p) { Object.assign(st, p); emit(); }

const supported = typeof Worker !== "undefined" && "caches" in self && typeof WebAssembly === "object";

function start() {
  if (ready) return ready;
  set({ status: "loading", loaded: 0, total: 0, error: "" });
  worker = new Worker("js/ai-worker.js", { type: "module" });
  ready = new Promise((resolve, reject) => {
    worker.onmessage = ({ data: m }) => {
      if (m.type === "progress") set({ loaded: m.loaded, total: m.total });
      else if (m.type === "ready") { device = m.device; set({ status: "ready" }); resolve(); }
      else if (m.type === "done") { pending.get(m.id)?.resolve(m.text); pending.delete(m.id); }
      else if (m.type === "error") {
        if (m.id != null && pending.has(m.id)) { pending.get(m.id).reject(new Error(m.message)); pending.delete(m.id); }
        else { fail(m.message); reject(new Error(m.message)); }
      }
    };
    worker.onerror = (e) => { const msg = e.message || "Couldn't start the model"; fail(msg); reject(new Error(msg)); };
  });
  ready.catch(() => {});
  worker.postMessage({ type: "load" });
  return ready;
}
function fail(msg) {
  set({ status: "error", error: navigator.onLine === false ? "You're offline and the model isn't downloaded yet." : msg });
  worker?.terminate(); worker = null; ready = null;
  pending.forEach((p) => p.reject(new Error(msg))); pending.clear();
}

// Generations run one at a time, in order.
let chain = Promise.resolve();
function generate(messages, opts) {
  const run = async () => {
    await start();
    const id = ++seq;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); worker.postMessage({ type: "gen", id, messages, opts }); });
  };
  const p = chain.then(run, run);
  chain = p.catch(() => {});
  return p;
}
function stop() { worker?.postMessage({ type: "stop" }); }

async function isDownloaded() {
  try {
    const c = await caches.open(CACHE);
    return (await c.keys()).some((r) => r.url.includes(MODEL_PATH) && r.url.includes(".onnx"));
  } catch (e) { return false; }
}
async function remove() {
  worker?.terminate(); worker = null; ready = null; pending.clear();
  try { await caches.delete(CACHE); await caches.delete("keepersdesk-lib"); } catch (e) { /* ignore */ }
  set({ status: "idle", loaded: 0, total: 0, error: "" });
}

/* ---------- Output clean-up ---------- */
function oneLine(s, max = 240) {
  let t = String(s || "").trim().split(/\n+/).map((x) => x.trim()).find(Boolean) || "";
  t = t.replace(/^(\d+[.)]|[-*•])\s+/, "").replace(/^(Answer|Line|Detail|Idea)\s*:\s*/i, "");
  if (t.length > max) { const cut = t.slice(0, max); const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? ")); t = (end > 40 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…"); }
  return t;
}
function quoteLine(s) {
  let t = oneLine(s, 260);
  const m = t.match(/[“"]([^”"]{8,})[”"]/);
  if (m) t = m[1];
  t = t.replace(/^[“"']+|[”"']+$/g, "").trim();
  return t ? `“${t}”` : "";
}

/* ---------- Prompts ---------- */
const first = (name) => String(name || "").split(/\s+/)[0] || "they";
const tasks = {
  npcLine(n, topic) {
    const who = `${n.name}${n.role ? ", " + n.role : ""}`;
    const about = topic || (n.wants ? "what they want: " + n.wants : "the day they're having");
    const msgs = [{ role: "system", content: "You write dialogue for a cozy mystery game. Reply with one line of dialogue in quotes." }];
    const ask = `Character: ${who}.${n.voice ? " Voice: " + n.voice : ""}${n.personality ? " Personality: " + n.personality : ""}\nWrite one thing ${first(n.name)} says.`;
    if (n.quote) msgs.push({ role: "user", content: ask }, { role: "assistant", content: `"${n.quote}"` }, { role: "user", content: `Another line, about ${about}. Same voice, shorter.` });
    else msgs.push(
      { role: "user", content: "Character: Mrs. Pell, the vicar's wife. Voice: warm, nosy.\nWrite one thing she says to a visitor." },
      { role: "assistant", content: "\"You simply must try the lemon bars, dear, and do tell me who you saw at the church last night.\"" },
      { role: "user", content: ask.replace("says.", `says to a visitor, about ${about}.`) });
    return { messages: msgs, opts: { max: 50, temp: 0.8 }, post: quoteLine };
  },
  sceneDetail(loc, sense) {
    return {
      messages: [
        { role: "system", content: "You write scene details for a cozy mystery game. Reply with one short sentence only." },
        { role: "user", content: "Place: The lighthouse. A white tower on the point, paint peeling.\nWrite one small detail a visitor notices (touch)." },
        { role: "assistant", content: "Salt has crusted the brass door handle green, and it is cold enough to sting." },
        { role: "user", content: `Place: ${loc.name}. ${loc.desc || loc.kind || ""}\nWrite one small detail a visitor notices (${sense}).` },
      ],
      opts: { max: 45, temp: 0.8 }, post: (s) => oneLine(s, 200),
    };
  },
  clueIdea(clue, loc, npcs) {
    const people = npcs.map((n) => n.name).join(", ") || "nobody in particular";
    return {
      messages: [
        { role: "system", content: "You help a game master in a cozy mystery game. Reply with one short sentence only." },
        { role: "user", content: "Scene: The church hall. People here: Mrs. Pell.\nClue: A torn raffle ticket with a phone number on the back.\nWrite one way the players could come across this clue here." },
        { role: "assistant", content: "Mrs. Pell sweeps up after the raffle and a torn ticket sticks to her shoe; someone has scribbled a number on the back." },
        { role: "user", content: `Scene: ${loc ? loc.name : "somewhere in town"}. People here: ${people}.\nClue: ${clue.text}\nWrite one way the players could come across this clue here.` },
      ],
      opts: { max: 55, temp: 0.8 }, post: (s) => oneLine(s, 240),
    };
  },
  townsperson(setting) {
    return {
      messages: [
        { role: "system", content: `You invent townsfolk for a cozy mystery game set in ${setting?.name || "a small coastal town"}. Reply with one line: Name — job, one quirk.` },
        { role: "user", content: "One townsperson." },
        { role: "assistant", content: "Doris Whitlock — postmistress, reads postcards aloud before delivering them." },
        { role: "user", content: "One townsperson." },
      ],
      opts: { max: 32, temp: 0.95 },
      post: (s) => {
        const t = oneLine(s, 140).replace(/^I'?m\s+/i, "");
        const m = t.match(/^([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+){1,2})\s*(?:—|–|-{1,2}|,|:|\()\s*(.+?)\)?$/);
        return m ? { name: m[1], role: m[2].replace(/^the\s+/i, "") } : null;
      },
    };
  },
};

window.KDAI = {
  supported, SIZE_MB, tasks,
  get state() { return st; },
  get device() { return device; },
  onChange(f) { listeners.add(f); return () => listeners.delete(f); },
  start, generate, stop, isDownloaded, remove,
  // One retry when the model talks about the task instead of doing it, or returns nothing usable.
  async run(task) {
    for (let i = 0; i < 2; i++) {
      const out = task.post(await generate(task.messages, task.opts));
      if (out && !META.test(typeof out === "string" ? out : out.name + " " + out.role)) return out;
    }
    return null;
  },
};
const META = /\b(character'?s?|sentence|phrase|dialogue|game master|role-?play|as an ai|I wrote|this line)\b/i;
})();
