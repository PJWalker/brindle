/* On-device text generation (SmolLM2 360M via transformers.js). Runs off the main thread.
   Library and model are fetched on first use and cached by the browser for offline play. */

// transformers.js's browser build imports "onnxruntime-web/webgpu" and "onnxruntime-common" by bare name.
// Point both at the exact onnxruntime-web bundle it was built against, then load it from a blob.
const LIB = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/dist/transformers.web.min.js";
const ORT = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/ort.webgpu.bundle.min.mjs";
const MODEL = "HuggingFaceTB/SmolLM2-360M-Instruct";

async function loadLib() {
  const res = await fetch(LIB);
  if (!res.ok) throw new Error(`Couldn't fetch the AI library (${res.status})`);
  const src = (await res.text()).replace(/from\s*"onnxruntime-(?:common|web\/webgpu)"/g, `from"${ORT}"`);
  if (/from\s*"onnxruntime-/.test(src)) throw new Error("Unexpected AI library format");
  const url = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
  try { return await import(url); } finally { URL.revokeObjectURL(url); }
}

let T = null, gen = null, stop = null;

async function pickDevice() {
  try {
    const a = await navigator.gpu?.requestAdapter();
    if (a) return { device: "webgpu", dtype: a.features.has("shader-f16") ? "q4f16" : "q4" };
  } catch (e) { /* fall through to CPU */ }
  return { device: "wasm", dtype: "q4" };
}

async function load() {
  if (gen) return post({ type: "ready", device: gen._kdDevice });
  T ||= await loadLib();
  const { pipeline, env, InterruptableStoppingCriteria } = T;
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  stop = new InterruptableStoppingCriteria();
  const choice = await pickDevice();
  const progress_callback = (p) => { if (p.status === "progress_total") post({ type: "progress", loaded: p.loaded, total: p.total }); };
  try {
    gen = await pipeline("text-generation", MODEL, { ...choice, progress_callback });
  } catch (e) {
    if (choice.device !== "webgpu") throw e;
    // WebGPU present but unusable (common on older tablets): fall back to CPU.
    choice.device = "wasm"; choice.dtype = "q4";
    gen = await pipeline("text-generation", MODEL, { ...choice, progress_callback });
  }
  gen._kdDevice = choice.device;
  post({ type: "ready", device: choice.device });
}

async function generate(id, messages, o = {}) {
  stop.reset();
  const out = await gen(messages, {
    max_new_tokens: o.max ?? 60,
    do_sample: (o.temp ?? 0.8) > 0,
    temperature: o.temp ?? 0.8,
    top_p: 0.9,
    repetition_penalty: 1.15,
    stopping_criteria: stop,
  });
  post({ type: "done", id, text: out[0].generated_text.at(-1).content });
}

const post = (m) => self.postMessage(m);
self.onmessage = async ({ data: m }) => {
  try {
    if (m.type === "load") await load();
    else if (m.type === "gen") await generate(m.id, m.messages, m.opts);
    else if (m.type === "stop") stop?.interrupt();
  } catch (e) {
    post({ type: "error", id: m.id, message: String(e?.message || e) });
  }
};
