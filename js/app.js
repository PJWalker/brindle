/* Keeper's Desk — GM prep & session tool for Carved-in-Brindlewood games. Vanilla JS, offline-first. */
(() => {
"use strict";

const KEY = "keepersdesk.v1";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clone = (o) => JSON.parse(JSON.stringify(o));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = (p) => p + "-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
const byId = (arr, id) => (arr || []).find((x) => x.id === id);
const nowIso = () => new Date().toISOString();
const hhmm = (iso) => { const d = new Date(iso); return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };

/* ---------------- State ---------------- */
let S;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); if (d && d.schema) return migrate(d); }
  } catch (e) { console.warn("load failed", e); }
  return clone(window.BRINDLE_SEED);
}
function migrate(d) {
  d.mavens ||= []; d.play ||= {}; d.ui ||= {};
  d.systems ||= []; d.settings ||= []; d.mysteries ||= [];
  return d;
}
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { toast("Couldn't save — storage full or blocked. Export a backup."); }
  }, 150);
}
function commit() { save(); render(); }

const M = () => byId(S.mysteries, S.ui.activeMysteryId) || S.mysteries[0];
const SET = (m = M()) => (m && byId(S.settings, m.settingId)) || S.settings[0];
const SYS = (st = SET()) => (st && byId(S.systems, st.systemId)) || S.systems[0];
const allNpcs = (m = M()) => [...(m?.npcs || []), ...(SET(m)?.npcs || [])];
const npcById = (id, m = M()) => byId(allNpcs(m), id);
const allLocs = (m = M()) => [...(SET(m)?.locations || []), ...(m?.locations || [])];
const locById = (id, m = M()) => byId(allLocs(m), id);
const castOf = (m = M()) => {
  if (!m) return [];
  const folk = (m.featuredTownsfolk || []).map((id) => byId(SET(m)?.npcs, id)).filter(Boolean);
  return [...m.npcs, ...folk.filter((f) => !m.npcs.some((n) => n.id === f.id))];
};
const isSuspect = (id, m = M()) => (m?.suspects || []).includes(id);
function P(m = M()) {
  if (!m) return null;
  const p = (S.play[m.id] ||= {});
  p.found ||= {}; p.ticks ||= {}; p.log ||= []; p.theories ||= []; p.asked ||= {};
  p.scene ||= { locationId: "", npcs: [] }; p.session ||= 1; p.eos ||= {};
  return p;
}
function log(text, kind = "note") { const p = P(); if (!p) return; p.log.unshift({ id: uid("l"), at: nowIso(), text, kind, session: p.session }); }

/* ---------------- UI helpers ---------------- */
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200); }
const srcBadge = (o) => (o && o.src === "added" ? `<span class="badge added" title="Fleshed-out content, not from the published mystery">added</span>` : "");
const npcName = (id) => npcById(id)?.name || (id ? "Unknown" : "—");
const locName = (id) => locById(id)?.name || "";
function npcLink(id) { const n = npcById(id); return n ? `<a class="chip" href="#/npc/${esc(id)}">${esc(n.name)}${isSuspect(id) ? " ·<b>S</b>" : ""}</a>` : ""; }
function locLink(id) { const l = locById(id); return l ? `<a class="chip" href="#/loc/${esc(id)}">${esc(l.name)}</a>` : ""; }
function clueChip(id) {
  const c = byId(M()?.clues, id); if (!c) return "";
  const f = P().found[id];
  return `<span class="chip ${c.type === "void" ? "void" : ""} ${f ? "found" : ""}" data-act="clue-open" data-id="${esc(id)}" title="${esc(c.text)}">${f ? "✓ " : ""}${esc(trunc(c.text, 42))}</span>`;
}
const trunc = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");
const block = (label, text, cls = "") => (text ? `<div class="section-label">${esc(label)}</div><div class="pre ${cls}">${esc(text)}</div>` : "");

/* ---------------- Navigation ---------------- */
const NAV = [
  { group: "At the table", items: [
    { to: "#/play", label: "Session", tab: true, short: "Play" },
  ]},
  { group: "Mystery", items: [
    { to: "#/mystery/overview", label: "Overview", tab: true, short: "Mystery", match: "#/mystery" },
    { to: "#/mystery/cast", label: "Cast & Suspects", count: () => castOf().length },
    { to: "#/mystery/clues", label: "Clues", count: () => `${Object.keys(P()?.found || {}).filter((k) => byId(M()?.clues, k)).length}/${M()?.clues.length || 0}` },
    { to: "#/mystery/threats", label: "Threats" },
    { to: "#/mystery/solutions", label: "Possible Solutions" },
    { to: "#/mystery/web", label: "Relationship Web" },
  ]},
  { group: "Setting", items: [
    { to: "#/town/map", label: "Town Map", tab: true, short: "Town", match: "#/town" },
    { to: "#/town/places", label: "Locations" },
    { to: "#/town/folk", label: "Townsfolk" },
  ]},
  { group: "Players", items: [
    { to: "#/mavens", label: "Mavens", tab: true, short: "Mavens" },
  ]},
  { group: "Reference", items: [
    { to: "#/rules", label: "Moves & Rules", tab: true, short: "Rules" },
    { to: "#/library", label: "Library & Backup" },
  ]},
];
function renderNav(hash) {
  const active = (it) => hash === it.to || (it.match && hash.startsWith(it.match) && hash === it.to) || hash.startsWith(it.to);
  $("#sidebar").innerHTML = NAV.map((g) => `<div class="group"><div class="group-title">${esc(g.group)}</div>${g.items.map((it) =>
    `<a href="${it.to}" class="${active(it) ? "active" : ""}">${esc(it.label)}${it.count ? `<span class="count">${esc(it.count())}</span>` : ""}</a>`).join("")}</div>`).join("");
  const tabs = NAV.flatMap((g) => g.items).filter((i) => i.tab);
  $("#tabbar").innerHTML = tabs.map((it) => {
    const on = hash.startsWith(it.match || it.to) || (it.to === "#/mystery/overview" && hash.startsWith("#/npc")) || (it.to === "#/town/map" && hash.startsWith("#/loc")) || (it.to === "#/rules" && hash.startsWith("#/library"));
    return `<a href="${it.to}" class="${on ? "active" : ""}">${esc(it.short)}</a>`;
  }).join("");
  const m = M();
  $("#brandSub").textContent = m ? `${m.title} · ${SET(m)?.name || ""}` : "No mystery loaded";
}

function render() {
  const hash = location.hash || "#/play";
  const parts = hash.slice(2).split("/");
  document.body.classList.remove("nav-open");
  renderNav(hash);
  const main = $("#main");
  let html;
  try {
    if (!M() && !["library", "rules", "mavens"].includes(parts[0])) html = vNoMystery();
    else switch (parts[0]) {
      case "play": html = vPlay(); break;
      case "mystery": html = vMystery(parts[1] || "overview"); break;
      case "npc": html = vNpc(decodeURIComponent(parts[1])); break;
      case "loc": html = vLoc(decodeURIComponent(parts[1])); break;
      case "town": html = vTown(parts[1] || "map"); break;
      case "mavens": html = vMavens(); break;
      case "rules": html = vRules(); break;
      case "library": html = vLibrary(); break;
      default: html = vPlay();
    }
  } catch (e) { console.error(e); html = `<div class="card"><h2>Something went wrong</h2><p class="pre">${esc(e.stack || e)}</p></div>`; }
  const keepScroll = render._hash === hash;
  const y = window.scrollY;
  main.innerHTML = html;
  if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  render._hash = hash;
}

/* ---------------- Views: Play ---------------- */
function vNoMystery() {
  return `<div class="empty"><h2>No mystery loaded</h2><p>Create or import one from the Library.</p><a class="btn primary" href="#/library">Open Library</a></div>`;
}

function vPlay() {
  const m = M(), p = P(), sys = SYS();
  const found = (id) => !!p.found[id];
  const filter = S.ui.clueFilter || "open";
  const clues = m.clues.filter((c) => filter === "all" || (filter === "open" ? !found(c.id) && c.type !== "void" : filter === "found" ? found(c.id) : c.type === "void"));
  const nFound = m.clues.filter((c) => found(c.id) && c.type !== "void").length;
  const nClue = m.clues.filter((c) => c.type !== "void").length;
  const nVoid = m.clues.filter((c) => found(c.id) && c.type === "void").length;
  const sc = p.scene;
  const sceneLoc = locById(sc.locationId);
  return `
  <div class="page-head"><div class="grow"><div class="eyebrow">Session ${p.session} · Complexity ${m.complexity}</div><h1>${esc(m.title)}</h1></div>
    <div class="btn-row"><button class="btn" data-act="theorize">Theorize</button><button class="btn" data-act="happening">Town life</button><button class="btn" data-act="complication">Complication</button></div></div>

  <div class="play-grid">
  <div>
    <div class="card">
      <div class="card-head"><h3>Current scene</h3><button class="btn sm" data-act="scene-edit">Set scene</button></div>
      ${sceneLoc ? `<div><a href="#/loc/${esc(sceneLoc.id)}" class="serif" style="font-size:1.15rem;font-weight:600">${esc(sceneLoc.name)}</a> <span class="muted small">${esc(sceneLoc.kind || "")}</span></div>
        <p class="small muted" style="margin-top:4px">${esc(trunc(sceneLoc.desc, 220))}</p>
        ${(sceneLoc.paint || []).map((q) => `<div class="small"><b>Paint the scene:</b> ${esc(q)}</div>`).join("")}` : `<p class="muted">No scene set. Opening location: ${esc(locName(m.openingLocationId) || "—")}.</p>`}
      <div class="section-label">On stage</div>
      <div class="chips">${sc.npcs.map((id) => `<span class="chip"><a href="#/npc/${esc(id)}" style="color:inherit;text-decoration:none">${esc(npcName(id))}</a><button data-act="scene-drop" data-id="${esc(id)}" aria-label="Remove">×</button></span>`).join("") || `<span class="muted small">Nobody yet.</span>`}</div>
      ${sc.npcs.length ? `<div class="hr"></div>${sc.npcs.map((id) => npcCue(npcById(id))).join("")}` : ""}
    </div>

    <div class="card">
      <div class="card-head"><h3>Clues <span class="muted small">${nFound}/${nClue} found · ${nVoid} void</span></h3><a class="btn sm ghost" href="#/mystery/clues">Manage</a></div>
      <div class="seg-ctl" style="margin-bottom:8px">${[["open", "Unfound"], ["found", "Found"], ["void", "Void"], ["all", "All"]].map(([k, l]) => `<button class="${filter === k ? "on" : ""}" data-act="clue-filter" data-v="${k}">${l}</button>`).join("")}</div>
      <ul class="list">${clues.map((c) => clueRow(c)).join("") || `<li class="muted">Nothing here.</li>`}</ul>
    </div>
  </div>

  <div>
    <div class="card">
      <div class="card-head"><h3>Threats</h3><a class="btn sm ghost" href="#/mystery/threats">Manage</a></div>
      ${m.threats.map((t) => threatRow(t, true)).join("") || `<p class="muted">No threats.</p>`}
    </div>

    <div class="card">
      <div class="card-head"><h3>Session log</h3><button class="btn sm ghost" data-act="new-session">New session</button></div>
      <form class="inline-input" data-form="log"><input type="text" name="text" placeholder="Quick note… (Enter to add)" autocomplete="off"><button class="btn primary">Add</button></form>
      <ul class="log" style="margin-top:10px">${p.log.map((e) => `<li class="k-${esc(e.kind)}"><span class="t">${esc(hhmm(e.at))}</span><span class="x">${esc(e.text)}</span><button data-act="log-del" data-id="${esc(e.id)}" aria-label="Delete">×</button></li>`).join("") || `<li class="muted">Log is empty.</li>`}</ul>
    </div>

    <div class="card">
      <div class="card-head"><h3>Paint the scene</h3></div>
      <ul class="list">${m.paint.map((q, i) => `<li><button class="check ${p.asked[i] ? "on" : ""}" data-act="paint-ask" data-i="${i}" aria-label="Asked">✓</button><div class="body"><div>${esc(q.q)}</div>${q.locationId ? `<div class="meta">${esc(locName(q.locationId))}</div>` : ""}</div></li>`).join("")}</ul>
      <div class="section-label">Establishing question</div><div class="serif">${esc(m.establishing)}</div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Mavens</h3><a class="btn sm ghost" href="#/mavens">Edit</a></div>
      ${S.mavens.length ? S.mavens.map((mv) => `<div style="display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)"><div style="flex:1"><b>${esc(mv.name)}</b> <span class="muted small">${esc(mv.player || "")}</span><div class="chips" style="margin-top:3px">${(mv.conditions || []).map((c) => `<span class="badge suspect">${esc(c)}</span>`).join("")}</div></div><span class="badge">XP ${mv.xp || 0}/${sys.xpMax}</span>${(mv.crowns || []).length ? `<span class="badge void">♛ ${(mv.crowns || []).length}</span>` : ""}</div>`).join("") : `<p class="muted">No Mavens yet. <a href="#/mavens">Add the players' Mavens</a>.</p>`}
    </div>

    <div class="card">
      <div class="card-head"><h3>End of session</h3></div>
      <ul class="list">${sys.endOfSession.map((q, i) => `<li><button class="check ${p.eos[i] ? "on" : ""}" data-act="eos" data-i="${i}">✓</button><div class="body">${esc(q)}</div></li>`).join("")}</ul>
      <div class="btn-row" style="margin-top:8px"><button class="btn" data-act="eos-award" ${S.mavens.length ? "" : "disabled"}>Give each Maven +${Object.values(p.eos).filter(Boolean).length} XP</button></div>
    </div>
  </div>
  </div>`;
}

function clueRow(c) {
  const f = P().found[c.id];
  return `<li class="${f ? "done" : ""}"><button class="check ${c.type === "void" ? "void" : ""} ${f ? "on" : ""}" data-act="clue-toggle" data-id="${esc(c.id)}" aria-label="Found">✓</button>
    <div class="body"><div class="clue-text" data-act="clue-open" data-id="${esc(c.id)}">${c.type === "void" ? `<span class="badge void">Void</span> ` : ""}${esc(c.text)}</div>
    <div class="meta">${f ? `Found${f.by ? " by " + esc(f.by) : ""}${f.where ? " · " + esc(locName(f.where)) : ""}${f.note ? " · " + esc(f.note) : ""}` : (c.where || []).map(locName).filter(Boolean).map(esc).join(" · ")}</div></div></li>`;
}

function npcCue(n) {
  if (!n) return "";
  return `<div style="margin-bottom:12px"><div><a href="#/npc/${esc(n.id)}" class="serif" style="font-weight:600">${esc(n.name)}</a> <span class="muted small">${esc(n.role || "")}</span></div>
  ${n.quote ? `<div class="quote">“${esc(n.quote)}”</div>` : ""}
  <div class="small">${n.voice ? `<b>Voice:</b> ${esc(n.voice)} ` : ""}${n.mannerism ? `<b>Does:</b> ${esc(n.mannerism)}` : ""}</div>
  ${n.life ? `<div class="small"><b>Right now:</b> ${esc(n.life)}</div>` : ""}
  ${n.guarded ? `<div class="small"><b>If the murder comes up:</b> ${esc(n.guarded)}</div>` : ""}
  ${n.wants ? `<div class="small"><b>Wants:</b> ${esc(n.wants)}</div>` : ""}
  ${n.hides ? `<div class="small"><b>Hides:</b> ${esc(n.hides)}</div>` : ""}
  ${(n.prompts || []).length ? `<div class="small"><b>Play it:</b> ${n.prompts.map(esc).join(" / ")}</div>` : ""}</div>`;
}

function clockSvg(t, ticks, size = 64) {
  const n = Math.max(1, t.segments || 4), r = 28, cx = 32, cy = 32;
  let segs = "";
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    segs += n === 1 ? `<circle class="seg ${ticks > 0 ? "on" : ""}" cx="32" cy="32" r="28"/>` : `<path class="seg ${i < ticks ? "on" : ""}" d="M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z"/>`;
  }
  return `<svg class="clock" viewBox="0 0 64 64" width="${size}" height="${size}" data-act="tick" data-id="${esc(t.id)}" role="button" aria-label="Advance ${esc(t.name)}">${segs}<circle class="ring" cx="32" cy="32" r="28"/></svg>`;
}
function threatRow(t, compact) {
  const ticks = P().ticks[t.id] || 0;
  return `<div class="threat">${clockSvg(t, ticks)}<div class="body"><div style="display:flex;gap:6px;align-items:center"><b class="serif">${esc(t.name)}</b> <span class="muted small">${ticks}/${t.segments}</span>${compact ? "" : srcBadge(t)}
    <span style="margin-left:auto" class="btn-row"><button class="btn sm ghost" data-act="untick" data-id="${esc(t.id)}" aria-label="Back one">−</button>${compact ? "" : `<button class="btn sm" data-act="edit-threat" data-id="${esc(t.id)}">Edit</button>`}</span></div>
    ${compact ? (ticks && t.steps?.[ticks - 1] ? `<div class="small" style="color:var(--accent)">Now: ${esc(t.steps[ticks - 1])}</div>` : `<div class="small muted">${esc(t.desc || "")}</div>`)
      : `<div class="small muted">${esc(t.desc || "")}</div>${t.trigger ? `<div class="small"><b>Tick when:</b> ${esc(t.trigger)}</div>` : ""}<ol class="steps">${(t.steps || []).map((s, i) => `<li class="${i < ticks ? "on" : ""}">${esc(s)}</li>`).join("")}</ol>`}
    ${compact && t.steps?.[ticks] ? `<div class="small muted">Next: ${esc(t.steps[ticks])}</div>` : ""}</div></div>`;
}

/* ---------------- Views: Mystery ---------------- */
function mysteryTabs(cur) {
  const tabs = [["overview", "Overview"], ["cast", "Cast & Suspects"], ["clues", "Clues"], ["threats", "Threats"], ["solutions", "Solutions"], ["web", "Relationship Web"]];
  return `<div class="subtabs">${tabs.map(([k, l]) => `<a href="#/mystery/${k}" class="${cur === k ? "active" : ""}">${l}</a>`).join("")}</div>`;
}
function vMystery(tab) {
  const m = M();
  const head = `<div class="page-head"><div class="grow"><div class="eyebrow">Mystery · Complexity ${m.complexity}</div><h1>${esc(m.title)}</h1></div></div>${mysteryTabs(tab)}`;
  switch (tab) {
    case "cast": return head + vCast();
    case "clues": return head + vClues();
    case "threats": return head + vThreats();
    case "solutions": return head + vSolutions();
    case "web": return head + vWeb();
    default: return head + vOverview();
  }
}
function vOverview() {
  const m = M();
  return `<div class="grid cols-2">
  <div class="card"><div class="card-head"><h2>Presenting the mystery</h2><button class="btn sm" data-act="edit-mystery">Edit</button></div>
    ${block("Where", m.presenting)}${block("The hook (read or paraphrase)", m.hook)}
    <div class="section-label">Establishing question</div><div class="quote">${esc(m.establishing)}</div>
    ${block("Opening location", locName(m.openingLocationId))}
  </div>
  <div class="card"><div class="card-head"><h2>Keeper's background</h2>${srcBadge({ src: "added" })}</div>
    <div class="pre">${esc(m.backstory || "—")}</div>
    ${block("The night — what's certain, and what's loose", m.timeline)}
    ${m.victimId ? `<div class="section-label">Victim</div><div class="chips">${npcLink(m.victimId)}</div>` : ""}
    <div class="section-label">Suspects</div><div class="chips">${(m.suspects || []).map(npcLink).join("")}</div>
  </div>
  <div class="card"><div class="card-head"><h2>Paint the scene</h2></div>
    <ul class="list">${m.paint.map((q) => `<li><div class="body">${esc(q.q)}${q.locationId ? `<div class="meta">${esc(locName(q.locationId))}</div>` : ""}</div></li>`).join("")}</ul></div>
  <div class="card"><div class="card-head"><h2>Locations</h2></div><div class="chips">${allLocs().filter((l) => m.locations.includes(l) || (m.clues || []).some((c) => (c.where || []).includes(l.id)) || m.paint.some((q) => q.locationId === l.id)).map((l) => locLink(l.id)).join("")}</div>
    <div class="section-label">Complications & twists</div><ul class="steps">${(m.complications || []).map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
  <div class="card" style="grid-column:1/-1"><div class="card-head"><h2>Prep notes</h2></div>
    <textarea data-bind="mystery.notes" placeholder="Your notes for this mystery…">${esc(m.notes || "")}</textarea></div>
  </div>`;
}
function vCast() {
  const m = M(), f = S.ui.castFilter || "all";
  let list = castOf();
  if (f === "suspects") list = list.filter((n) => isSuspect(n.id));
  return `<div class="toolbar"><div class="seg-ctl">${[["all", "Everyone"], ["suspects", "Suspects"]].map(([k, l]) => `<button class="${f === k ? "on" : ""}" data-act="cast-filter" data-v="${k}">${l}</button>`).join("")}</div><span class="grow"></span>
    <button class="btn" data-act="add-npc" data-scope="mystery">+ NPC</button><button class="btn ghost" data-act="edit-mystery">Choose suspects / townsfolk</button></div>
  <div class="grid cols-2">${list.map(npcCard).join("")}</div>`;
}
function npcCard(n) {
  const m = M();
  const tags = [n.id === m.victimId ? `<span class="badge">Victim</span>` : "", isSuspect(n.id) ? `<span class="badge suspect">Suspect</span>` : "", byId(SET().npcs, n.id) ? `<span class="badge sea">Townsfolk</span>` : "", srcBadge(n)].join(" ");
  return `<a class="card tap" href="#/npc/${esc(n.id)}" style="text-decoration:none;color:inherit;display:block">
    <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap"><h3 style="margin:0">${esc(n.name)}</h3>${tags}</div>
    <div class="muted small">${esc(n.role || "")}</div>
    ${n.quote ? `<div class="quote">“${esc(trunc(n.quote, 160))}”</div>` : ""}
    <div class="small">${esc(trunc([n.look, n.personality].filter(Boolean).join(" "), 160))}</div></a>`;
}
function vClues() {
  const m = M();
  const sect = (type, title) => `<div class="card"><div class="card-head"><h2>${title}</h2><button class="btn sm" data-act="add-clue" data-type="${type}">+ Add</button></div>
    <ul class="list">${m.clues.filter((c) => c.type === type).map((c) => {
      const f = P().found[c.id];
      return `<li class="${f ? "done" : ""}"><button class="check ${type === "void" ? "void" : ""} ${f ? "on" : ""}" data-act="clue-toggle" data-id="${esc(c.id)}">✓</button>
      <div class="body"><div class="clue-text" data-act="clue-open" data-id="${esc(c.id)}">${esc(c.text)}</div>
      ${c.notes ? `<div class="small muted">${esc(c.notes)}</div>` : ""}
      <div class="chips" style="margin-top:6px">${(c.where || []).map((id) => `<span class="badge sea">@ ${esc(locName(id))}</span>`).join("")}${(c.points || []).map((id) => `<span class="badge suspect">→ ${esc(npcName(id))}</span>`).join("")}</div></div>
      <button class="btn sm ghost" data-act="edit-clue" data-id="${esc(c.id)}">Edit</button></li>`;
    }).join("") || `<li class="muted">None yet.</li>`}</ul></div>`;
  return `<div class="note-banner">Clues aren't hidden in fixed places — hand one out whenever a Maven earns it. @ = suggested places it could surface; → = who it might point to.</div>` + sect("clue", "Clues") + sect("void", "Void clues");
}
function vThreats() {
  return `<div class="toolbar"><span class="grow muted small">Tap a clock to advance it. Each step is a beat you can bring into play.</span><button class="btn" data-act="add-threat">+ Threat</button></div>
  <div class="card">${M().threats.map((t) => threatRow(t, false)).join("") || `<p class="muted">No threats yet.</p>`}</div>`;
}
function vSolutions() {
  const m = M(), p = P();
  return `<div class="note-banner">There's no canonical culprit. These are prepared theories to help you recognise where the players are heading and to make whatever they land on hang together. The Mavens' successful theory is the truth.</div>
  <div class="toolbar"><span class="grow"></span><button class="btn" data-act="add-solution">+ Solution</button></div>
  <div class="grid cols-2">${m.solutions.map((s) => {
    const have = s.clues.filter((id) => p.found[id]).length;
    const mod = have - m.complexity;
    return `<div class="card"><div class="card-head"><h3>${esc(s.title)}</h3>${srcBadge(s)}<button class="btn sm ghost" data-act="edit-solution" data-id="${esc(s.id)}">Edit</button></div>
      <div class="chips">${s.culprit ? npcLink(s.culprit) : `<span class="chip">No single culprit</span>`}</div>
      ${block("Motive", s.motive)}${block("Method", s.method)}${block("10–11 · the wrinkle", s.wrinkle)}${block("7–9 · the culprit's upper hand", s.upperHand)}
      <div class="section-label">Supporting clues · ${have}/${s.clues.length} found · roll ${mod >= 0 ? "+" : ""}${mod}</div>
      <div class="chips">${s.clues.map(clueChip).join("")}</div></div>`;
  }).join("")}</div>`;
}

/* --- Relationship web --- */
const KIND_DASH = { family: "", romance: "2 4", money: "9 4", conflict: "14 4 2 4", ally: "", void: "2 4 9 4", other: "1 3" };
const dashLine = (k, secret) => `<svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="${secret ? 4 : k === "ally" ? 1 : 2}" stroke-dasharray="${KIND_DASH[k] ?? ""}"/></svg>`;
function vWeb() {
  const m = M(), showSecret = S.ui.webSecrets !== false, sel = S.ui.webSel;
  const rels = m.relationships.filter((r) => showSecret || !r.secret);
  const linkedIds = new Set(m.relationships.flatMap((r) => [r.a, r.b]));
  const ids = [...castOf().map((n) => n.id), ...linkedIds].filter((id, i, a) => linkedIds.has(id) && a.indexOf(id) === i && npcById(id));
  const W = 760, H = 640, cx = W / 2, cy = H / 2;
  const center = ids.includes(m.victimId) ? m.victimId : null;
  const ring = ids.filter((id) => id !== center);
  const pos = {};
  if (center) pos[center] = { x: cx, y: cy };
  ring.forEach((id, i) => { const a = (i / ring.length) * Math.PI * 2 - Math.PI / 2; pos[id] = { x: cx + 270 * Math.cos(a), y: cy + 250 * Math.sin(a) }; });
  const pairCount = {};
  const edges = rels.map((r) => {
    const A = pos[r.a], B = pos[r.b]; if (!A || !B) return "";
    const key = [r.a, r.b].sort().join("|"); const k = (pairCount[key] = (pairCount[key] || 0) + 1) - 1;
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
    const off = (k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 46) + 14;
    const qx = mx - (dy / len) * off, qy = my + (dx / len) * off;
    const lx = 0.25 * A.x + 0.5 * qx + 0.25 * B.x, ly = 0.25 * A.y + 0.5 * qy + 0.25 * B.y;
    const dim = sel && r.a !== sel && r.b !== sel ? "web-dim" : "";
    const showLabel = sel ? !dim : S.ui.webLabels;
    return `<g class="${dim}"><path class="web-edge ${r.secret ? "secret" : ""}" stroke="currentColor" stroke-dasharray="${KIND_DASH[r.kind] ?? KIND_DASH.other}" data-kind="${esc(r.kind || "other")}" d="M${A.x},${A.y} Q${qx},${qy} ${B.x},${B.y}"/>${showLabel ? `<text class="web-elabel" x="${lx}" y="${ly}">${esc(trunc(r.label, 30))}</text>` : ""}</g>`;
  }).join("");
  const nodes = ids.map((id) => {
    const n = npcById(id), q = pos[id]; if (!q) return "";
    const linked = !sel || id === sel || rels.some((r) => (r.a === sel && r.b === id) || (r.b === sel && r.a === id));
    const ncls = id === m.victimId ? "victim" : isSuspect(id) ? "suspect" : byId(SET().npcs, id) ? "townsfolk" : "cast";
    const short = n.name.replace(/^(Sheriff|Deputy|Dr\.|Cpl\.)\s+/, "").split(" ")[0];
    return `<g class="web-node ${ncls} ${linked ? "" : "web-dim"}" data-act="web-sel" data-id="${esc(id)}"><circle cx="${q.x}" cy="${q.y}" r="${id === center ? 30 : 22}"/><text x="${q.x}" y="${q.y + (id === center ? 46 : 38)}">${esc(short)}</text><text class="role" x="${q.x}" y="${q.y + (id === center ? 59 : 51)}">${esc(trunc(n.role || "", 26))}</text></g>`;
  }).join("");
  const selRels = sel ? m.relationships.filter((r) => r.a === sel || r.b === sel) : [];
  return `<div class="toolbar"><label class="chip" style="cursor:pointer"><input type="checkbox" data-act="web-secrets" ${showSecret ? "checked" : ""}> Secret links</label><label class="chip" style="cursor:pointer"><input type="checkbox" data-act="web-labels" ${S.ui.webLabels ? "checked" : ""}> All labels</label><span class="muted small">Tap a person to focus their links.</span>
    <span class="grow"></span><button class="btn" data-act="add-rel">+ Link</button></div>
  <div class="legend">${Object.keys(KIND_DASH).map((k) => `<span>${dashLine(k)}${k}</span>`).join("")}<span>${dashLine("family", true)}secret</span></div>
  <div class="legend"><span><i class="dot victim"></i>victim</span><span><i class="dot suspect"></i>suspect</span><span><i class="dot cast"></i>cast</span><span><i class="dot townsfolk"></i>townsfolk</span></div>
  <div class="web-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Relationship web"><rect width="${W}" height="${H}" fill="transparent" data-act="web-sel" data-id=""/>${edges}${nodes}</svg></div>
  <div class="card" style="margin-top:14px"><div class="card-head"><h3>${sel ? esc(npcName(sel)) : "All links"}</h3>${sel ? `<a class="btn sm" href="#/npc/${esc(sel)}">Open NPC</a>` : ""}</div>
    <ul class="list">${(sel ? selRels : m.relationships).map((r) => `<li><div class="body"><b>${esc(npcName(r.a))}</b> ↔ <b>${esc(npcName(r.b))}</b> — ${esc(r.label)} <span class="badge">${esc(r.kind || "")}</span>${r.secret ? ` <span class="badge void">secret</span>` : ""}</div><button class="btn sm ghost" data-act="edit-rel" data-id="${esc(r.id)}">Edit</button></li>`).join("")}</ul></div>`;
}

/* --- NPC detail --- */
function vNpc(id) {
  const m = M(), n = npcById(id);
  if (!n) return `<div class="empty">NPC not found. <a href="#/mystery/cast">Back to cast</a></div>`;
  const inSetting = !!byId(SET().npcs, id);
  const rels = m.relationships.filter((r) => r.a === id || r.b === id);
  const clues = m.clues.filter((c) => (c.points || []).includes(id));
  const sols = m.solutions.filter((s) => s.culprit === id);
  const onStage = P().scene.npcs.includes(id);
  return `<div class="page-head"><div class="grow"><div class="eyebrow">${inSetting ? "Townsfolk" : "Mystery NPC"}${isSuspect(id) ? " · Suspect" : ""}${id === m.victimId ? " · Victim" : ""}</div><h1>${esc(n.name)} ${srcBadge(n)}</h1><div class="muted">${esc(n.role || "")}</div></div>
    <div class="btn-row"><button class="btn ${onStage ? "" : "primary"}" data-act="stage-toggle" data-id="${esc(id)}">${onStage ? "Remove from scene" : "Put on stage"}</button><button class="btn" data-act="edit-npc" data-id="${esc(id)}">Edit</button></div></div>
  <div class="grid cols-2">
    <div class="card">${n.quote ? `<div class="quote big">“${esc(n.quote)}”</div>` : ""}
      <dl class="dl">${[["Their life right now", n.life], ["If the murder comes up", n.guarded], ["Look", n.look], ["Personality", n.personality], ["Voice", n.voice], ["Mannerism", n.mannerism], ["Wants", n.wants], ["Hides", n.hides]].filter((x) => x[1]).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      ${(n.prompts || []).length ? `<div class="section-label">Ways to play them</div><ul class="steps">${n.prompts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${n.notes ? block("Notes", n.notes) : ""}
    </div>
    <div>
      <div class="card"><h3>Relationships</h3><ul class="list">${rels.map((r) => { const o = r.a === id ? r.b : r.a; return `<li><div class="body"><a href="#/npc/${esc(o)}">${esc(npcName(o))}</a> — ${esc(r.label)} ${r.secret ? `<span class="badge void">secret</span>` : ""}</div></li>`; }).join("") || `<li class="muted">None recorded.</li>`}</ul></div>
      <div class="card"><h3>Clues that could point here</h3><div class="chips">${clues.map((c) => clueChip(c.id)).join("") || `<span class="muted">None.</span>`}</div></div>
      ${sols.length ? `<div class="card"><h3>Prepared theories naming them</h3>${sols.map((s) => `<div><b>${esc(s.title)}</b><div class="small muted">${esc(s.motive)}</div></div>`).join("<div class='hr'></div>")}</div>` : ""}
    </div>
  </div>`;
}

/* ---------------- Views: Town ---------------- */
function vTown(tab) {
  const st = SET();
  const tabs = `<div class="subtabs">${[["map", "Map"], ["places", "Locations"], ["folk", "Townsfolk"], ["about", "About the town"]].map(([k, l]) => `<a href="#/town/${k}" class="${tab === k ? "active" : ""}">${l}</a>`).join("")}</div>`;
  const head = `<div class="page-head"><div class="grow"><div class="eyebrow">Setting</div><h1>${esc(st.name)}</h1></div></div>${tabs}`;
  if (tab === "folk") return head + `<div class="toolbar"><span class="grow muted small">Recurring NPCs shared by every mystery in this setting.</span><button class="btn" data-act="add-npc" data-scope="setting">+ Townsfolk</button></div><div class="grid cols-2">${st.npcs.map(npcCard).join("")}</div>`;
  if (tab === "places") return head + `<div class="toolbar"><span class="grow"></span><button class="btn" data-act="add-loc" data-scope="setting">+ Town location</button><button class="btn" data-act="add-loc" data-scope="mystery">+ Mystery location</button></div><div class="grid cols-3">${allLocs().map(locCard).join("")}</div>`;
  if (tab === "about") return head + `<div class="card"><div class="card-head"><h2>About ${esc(st.name)}</h2>${srcBadge(st)}<button class="btn sm" data-act="edit-setting">Edit</button></div>${block("Overview", st.intro)}${block("Tone", st.tone)}${(st.happenings || []).length ? `<div class="section-label">This week in town</div><ul class="steps">${st.happenings.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div>`;
  return head + vMap();
}
function locCard(l) {
  const mys = M().locations.includes(l);
  const clueN = M().clues.filter((c) => (c.where || []).includes(l.id)).length;
  return `<a class="card tap" href="#/loc/${esc(l.id)}" style="text-decoration:none;color:inherit;display:block"><div style="display:flex;gap:6px;align-items:baseline;flex-wrap:wrap"><h3 style="margin:0">${esc(l.name)}</h3>${mys ? `<span class="badge suspect">This mystery</span>` : ""}${srcBadge(l)}</div>
    <div class="muted small">${esc(l.kind || "")}${clueN ? ` · ${clueN} possible clue${clueN > 1 ? "s" : ""}` : ""}</div><p class="small" style="margin-top:6px">${esc(trunc(l.desc, 140))}</p></a>`;
}
function landPath() { return "M0,0 L74,0 C78,6 90,9 87,19 C85,26 74,24 69,30 C64,36 67,44 63,52 C59,60 67,64 61,70 L0,70 Z"; }
function vMap() {
  const locs = allLocs(), mysLocs = M().locations, placing = S.ui.placing, sel = S.ui.mapSel;
  const pins = locs.filter((l) => l.mapX != null && l.mapY != null).map((l) => {
    const water = l.kind === "Yacht";
    const left = l.mapX > 80;
    return `<g class="map-pin ${mysLocs.includes(l) ? "mys" : ""} ${sel === l.id ? "sel" : ""} ${water ? "water" : ""}" data-act="map-pin" data-id="${esc(l.id)}">
      <circle cx="${l.mapX}" cy="${l.mapY}" r="${water ? 1.8 : 1.5}"/>${water ? `<path d="M${l.mapX - 3},${l.mapY + 2.2} q3,1.4 6,0" stroke="var(--accent)" stroke-width=".5" fill="none"/>` : ""}
      <text x="${left ? l.mapX - 2.3 : l.mapX + 2.3}" y="${l.mapY + 0.8}" text-anchor="${left ? "end" : "start"}">${esc(trunc(l.name.replace(/^The /, ""), 26))}</text></g>`;
  }).join("");
  const selLoc = locById(sel);
  return `<div class="toolbar"><span class="grow muted small">${placing ? `<b style="color:var(--accent)">Tap the map to place “${esc(locName(placing))}”.</b>` : "Tap a pin for details. Filled = this mystery."}</span>
    ${placing ? `<button class="btn" data-act="place-cancel">Cancel</button>` : `<select data-act="place-start" style="width:auto;min-height:40px"><option value="">Move a pin…</option>${locs.map((l) => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join("")}</select>`}</div>
  <div class="map-wrap"><svg viewBox="0 0 100 70" data-act="map-click" role="img" aria-label="Map of ${esc(SET().name)}">
    <rect class="map-water" width="100" height="70"/>
    <path d="M70,58 q6,-2 12,0 M74,64 q6,-2 12,0 M80,34 q5,-2 10,0" stroke="var(--fg)" stroke-width=".3" fill="none"/>
    <path class="map-land" d="${landPath()}"/>
    <path class="map-road" d="M6,8 C20,20 22,40 18,66 M18,30 C30,34 44,30 58,22 M10,46 C26,46 40,50 58,50 M30,46 C34,56 44,60 56,62 M44,32 C40,40 38,48 38,58"/>
    <rect x="55" y="48.5" width="9" height="1.6" fill="var(--line)"/><rect x="51" y="60.5" width="11" height="1.6" fill="var(--line)"/>
    <text class="map-label" x="85" y="34" text-anchor="middle">Brindlewood Bay</text>
    <text class="map-label" x="4" y="5" style="font-size:2.4px;fill:var(--muted)">N ↑</text>
    ${pins}</svg></div>
  ${selLoc ? `<div class="card" style="margin-top:14px"><div class="card-head"><h3>${esc(selLoc.name)}</h3><a class="btn sm primary" href="#/loc/${esc(selLoc.id)}">Open</a><button class="btn sm" data-act="scene-here" data-id="${esc(selLoc.id)}">Set as scene</button></div><p class="small">${esc(selLoc.desc)}</p></div>` : ""}`;
}

const YACHT_ZONES = [
  { x: 150, y: 18, w: 38, h: 34 }, { x: 122, y: 15, w: 28, h: 40 }, { x: 100, y: 35, w: 22, h: 20 }, { x: 100, y: 15, w: 22, h: 20 },
  { x: 66, y: 15, w: 34, h: 40 }, { x: 36, y: 15, w: 30, h: 20 }, { x: 4, y: 15, w: 32, h: 40 }, { x: 36, y: 35, w: 30, h: 20, below: true },
];
function yachtSvg(l) {
  const sel = S.ui.zoneSel;
  return `<div class="map-wrap" ><svg class="yacht" viewBox="0 0 200 70" role="img" aria-label="Deck plan">
    <path class="hull" d="M8,14 L150,14 C176,14 192,30 197,35 C192,40 176,56 150,56 L8,56 Z"/>
    ${(l.areas || []).slice(0, YACHT_ZONES.length).map((a, i) => { const z = YACHT_ZONES[i]; const words = a.name.replace(/\(.*\)/, "").trim().split(/\s*&\s*|\s+/);
      const mid = Math.ceil(words.length / 2); const l1 = words.slice(0, mid).join(" "), l2 = words.slice(mid).join(" ");
      return `<g data-act="zone" data-i="${i}"><rect class="zone ${z.below ? "below" : ""} ${sel === i ? "sel" : ""}" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="${i === 0 ? 12 : 1}"/>
      <text x="${z.x + z.w / 2}" y="${z.y + z.h / 2 - (l2 ? 1 : -1)}" text-anchor="middle">${esc(l1)}</text>${l2 ? `<text x="${z.x + z.w / 2}" y="${z.y + z.h / 2 + 3.5}" text-anchor="middle">${esc(l2)}</text>` : ""}</g>`; }).join("")}
    <text x="4" y="66" style="font-size:3px;fill:var(--muted)">◀ stern</text><text x="196" y="66" text-anchor="end" style="font-size:3px;fill:var(--muted)">bow ▶</text><text x="51" y="63" text-anchor="middle" style="font-size:2.6px;fill:var(--muted)">(dashed = below deck)</text>
  </svg></div>`;
}
function vLoc(id) {
  const l = locById(id), m = M();
  if (!l) return `<div class="empty">Location not found. <a href="#/town/places">Back</a></div>`;
  const clues = m.clues.filter((c) => (c.where || []).includes(id));
  const paint = [...(l.paint || [])];
  m.paint.filter((q) => q.locationId === id && !paint.includes(q.q)).forEach((q) => paint.push(q.q));
  const zs = S.ui.zoneSel;
  return `<div class="page-head"><div class="grow"><div class="eyebrow">${esc(l.kind || "Location")}${m.locations.includes(l) ? " · This mystery" : ""}</div><h1>${esc(l.name)} ${srcBadge(l)}</h1></div>
    <div class="btn-row"><button class="btn primary" data-act="scene-here" data-id="${esc(id)}">Set as scene</button><button class="btn" data-act="edit-loc" data-id="${esc(id)}">Edit</button></div></div>
  <div class="grid cols-2">
    <div class="card">${block("Description", l.desc)}${block("Keeper details", l.details)}
      ${paint.length ? `<div class="section-label">Paint the scene</div>${paint.map((q) => `<div class="quote">${esc(q)}</div>`).join("")}` : ""}</div>
    <div class="card"><h3>Clues that could surface here</h3><ul class="list">${clues.map((c) => clueRow(c)).join("") || `<li class="muted">No suggested clues — any clue can appear anywhere.</li>`}</ul></div>
  </div>
  ${l.map === "yacht" ? `<h2 style="margin-top:8px">Deck plan</h2>${yachtSvg(l)}` : ""}
  ${(l.areas || []).length ? `<div class="card" style="margin-top:14px"><h3>Areas</h3><ul class="list">${l.areas.map((a, i) => `<li class="${zs === i ? "sel" : ""}" id="area-${i}"><div class="body"><b>${esc(a.name)}</b><div class="small">${esc(a.desc)}</div></div></li>`).join("")}</ul></div>` : ""}`;
}

/* ---------------- Views: Mavens ---------------- */
function vMavens() {
  const sys = SYS();
  return `<div class="page-head"><div class="grow"><div class="eyebrow">Players</div><h1>${esc(sys.pcTitle || "Maven")}s</h1></div><button class="btn primary" data-act="add-maven">+ ${esc(sys.pcTitle || "Maven")}</button></div>
  ${S.mavens.length ? `<div class="grid cols-2">${S.mavens.map((mv) => `<div class="card">
    <div class="card-head"><div style="flex:1"><h2 style="margin:0">${esc(mv.name)}</h2><div class="muted small">${esc(mv.player ? "Played by " + mv.player : "")}</div></div><button class="btn sm" data-act="edit-maven" data-id="${esc(mv.id)}">Edit</button></div>
    <div class="attrs">${sys.attributes.map((a) => `<div class="attr"><div class="v">${(mv.attrs?.[a] ?? 0) >= 0 ? "+" : ""}${mv.attrs?.[a] ?? 0}</div><div class="k">${esc(a)}</div></div>`).join("")}</div>
    <div class="section-label">Experience</div><div class="boxes">${Array.from({ length: sys.xpMax }, (_, i) => `<button class="box ${i < (mv.xp || 0) ? "on" : ""}" data-act="xp" data-id="${esc(mv.id)}" data-i="${i}" aria-label="XP ${i + 1}"></button>`).join("")}</div>
    <div class="section-label">Conditions</div><div class="chips">${(mv.conditions || []).map((c, i) => `<span class="chip">${esc(c)}<button data-act="cond-del" data-id="${esc(mv.id)}" data-i="${i}">×</button></span>`).join("")}<button class="chip" data-act="cond-add" data-id="${esc(mv.id)}">+ Condition</button></div>
    <div class="section-label">Crowns of the Void · ${(mv.crowns || []).length}/${sys.crownsMax}</div><div class="boxes">${Array.from({ length: sys.crownsMax }, (_, i) => `<span class="box crown ${i < (mv.crowns || []).length ? "on" : ""}"></span>`).join("")}</div>
    ${(mv.crowns || []).length ? `<ul class="steps">${mv.crowns.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
    ${block("Cozy activity", mv.cozy)}${block("Advances", (mv.advances || []).join("\n"))}${block("Notes", mv.notes)}
  </div>`).join("")}</div>` : `<div class="empty"><p>No ${esc(sys.pcTitle || "Maven")}s yet.</p><button class="btn primary" data-act="add-maven">Add the first one</button></div>`}`;
}

/* ---------------- Views: Rules ---------------- */
function vRules() {
  const sys = SYS();
  const cats = [...new Set(sys.moves.map((m) => m.category || "Moves"))];
  return `<div class="page-head"><div class="grow"><div class="eyebrow">Reference · ${esc(sys.name)}</div><h1>Moves & Rules</h1></div><div class="btn-row"><button class="btn" data-act="add-move">+ Move</button><button class="btn" data-act="add-rule">+ Section</button><button class="btn ghost" data-act="edit-system">System settings</button></div></div>
  ${sys.note ? `<div class="note-banner">${esc(sys.note)}</div>` : ""}
  <div class="grid cols-2">
    <div>${cats.map((cat) => `<div class="card"><h2>${esc(cat)}</h2>${sys.moves.filter((m) => (m.category || "Moves") === cat).map((mv) => moveHtml(mv, true)).join("")}</div>`).join("")}
      <div class="card"><h2>End-of-session questions</h2><ol class="steps">${sys.endOfSession.map((q) => `<li>${esc(q)}</li>`).join("")}</ol></div></div>
    <div>${sys.rules.map((r) => `<div class="card"><div class="card-head"><h2>${esc(r.title)}</h2><button class="btn sm ghost" data-act="edit-rule" data-id="${esc(r.id)}">Edit</button></div><div class="pre">${esc(r.text)}</div></div>`).join("")}
      <div class="card"><h2>Theorize odds</h2><p class="small muted">2d6 + modifier (clues − complexity).</p>${oddsTable()}</div></div>
  </div>`;
}
function moveHtml(mv, editable, open) {
  return `<details class="move" ${open ? "open" : ""}><summary>${esc(mv.name)}</summary>
    ${mv.trigger ? `<div class="trigger">${esc(mv.trigger)}</div>` : ""}<div class="pre">${esc(mv.text)}</div>
    ${mv.gm ? `<div class="gm"><b>Keeper tip:</b> ${esc(mv.gm)}</div>` : ""}
    ${editable ? `<div class="btn-row" style="margin-top:8px"><button class="btn sm ghost" data-act="edit-move" data-id="${esc(mv.id)}">Edit</button></div>` : ""}</details>`;
}
function dist2d6() { const d = {}; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) d[a + b] = (d[a + b] || 0) + 1; return d; }
function odds(mod) {
  const d = dist2d6(), r = { s12: 0, s10: 0, s7: 0, miss: 0 };
  for (const [k, v] of Object.entries(d)) { const t = +k + mod; if (t >= 12) r.s12 += v; else if (t >= 10) r.s10 += v; else if (t >= 7) r.s7 += v; else r.miss += v; }
  for (const k in r) r[k] = Math.round((r[k] / 36) * 100);
  return r;
}
function oddsHtml(mod) { const o = odds(mod); return `<div class="odds"><div class="o4"><b>${o.s12}%</b><span>12+</span></div><div><b>${o.s10}%</b><span>10–11</span></div><div><b>${o.s7}%</b><span>7–9</span></div><div class="o1"><b>${o.miss}%</b><span>6−</span></div></div>`; }
function oddsTable() {
  const rows = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  return `<table style="width:100%;border-collapse:collapse;font-size:.86rem;font-variant-numeric:tabular-nums"><tr class="muted"><th align="left">Mod</th><th>12+</th><th>10–11</th><th>7–9</th><th>6−</th></tr>${rows.map((m) => { const o = odds(m); return `<tr style="border-top:1px solid var(--line)"><td>${m >= 0 ? "+" : ""}${m}</td><td align="center">${o.s12}%</td><td align="center">${o.s10}%</td><td align="center">${o.s7}%</td><td align="center">${o.miss}%</td></tr>`; }).join("")}</table>`;
}

/* ---------------- Views: Library ---------------- */
function vLibrary() {
  return `<div class="page-head"><div class="grow"><div class="eyebrow">Library</div><h1>Library & Backup</h1></div></div>
  <div class="grid cols-2">
    <div class="card"><div class="card-head"><h2>Mysteries</h2><button class="btn sm" data-act="new-mystery">+ New</button></div>
      <ul class="list">${S.mysteries.map((m) => `<li><div class="body"><b>${esc(m.title)}</b> ${m.id === S.ui.activeMysteryId ? `<span class="badge found">Active</span>` : ""}<div class="meta">${esc(byId(S.settings, m.settingId)?.name || "")} · Complexity ${m.complexity} · ${m.clues.length} clues</div></div>
        <div class="btn-row">${m.id !== S.ui.activeMysteryId ? `<button class="btn sm primary" data-act="activate" data-id="${esc(m.id)}">Run</button>` : ""}<button class="btn sm" data-act="dup-mystery" data-id="${esc(m.id)}">Copy</button><button class="btn sm ghost danger" data-act="del-mystery" data-id="${esc(m.id)}">Delete</button></div></li>`).join("")}</ul></div>
    <div class="card"><div class="card-head"><h2>Settings (towns)</h2><button class="btn sm" data-act="new-setting">+ New</button></div>
      <ul class="list">${S.settings.map((s) => `<li><div class="body"><b>${esc(s.name)}</b><div class="meta">${esc(byId(S.systems, s.systemId)?.name || "")} · ${s.locations.length} locations · ${s.npcs.length} townsfolk</div></div><button class="btn sm ghost danger" data-act="del-setting" data-id="${esc(s.id)}">Delete</button></li>`).join("")}</ul></div>
    <div class="card"><div class="card-head"><h2>Game systems</h2><button class="btn sm" data-act="new-system">+ New</button></div>
      <p class="small muted">For other Carved-in-Brindlewood games (The Between, Public Access, your own hacks) create a system, set its ability names and moves, then point a setting at it.</p>
      <ul class="list">${S.systems.map((s) => `<li><div class="body"><b>${esc(s.name)}</b><div class="meta">${s.moves.length} moves · ${esc(s.attributes.join(", "))}</div></div><button class="btn sm ghost danger" data-act="del-system" data-id="${esc(s.id)}">Delete</button></li>`).join("")}</ul></div>
    <div class="card"><h2>Backup & sharing</h2>
      <p class="small">Everything is stored on this device only. Export regularly — especially before clearing Safari data — and import to move between iPad and iPhone.</p>
      <div class="btn-row"><button class="btn primary" data-act="export">Export everything</button><button class="btn" data-act="export-mystery">Export this mystery</button><label class="btn">Import…<input type="file" accept="application/json,.json" data-act="import" hidden></label></div>
      <div class="hr"></div>
      <div class="btn-row"><button class="btn" data-act="reset-play">Reset session state</button><button class="btn" data-act="restore-dad">Restore “Dad Overboard”</button><button class="btn ghost danger" data-act="factory">Erase all & reload defaults</button></div>
      <p class="small muted" style="margin-top:10px">Tip: on iPad, tap Share → Add to Home Screen to install. It then works fully offline.</p></div>
  </div>`;
}

/* ---------------- Modal / editor ---------------- */
const modal = () => $("#modal");
function openModal(html, keepScroll) {
  const d = modal(), y = keepScroll && d.open ? $(".modal-body", d)?.scrollTop : 0;
  d.innerHTML = html; if (!d.open) d.showModal();
  if (y) $(".modal-body", d).scrollTop = y;
}
function closeModal() { const d = modal(); if (d.open) d.close(); d.innerHTML = ""; }

function fieldHtml(f, v) {
  const id = "f-" + f.key.replace(/\W/g, "_");
  const lab = `<label for="${id}">${esc(f.label)}</label>`;
  const hint = f.hint ? `<div class="hint">${esc(f.hint)}</div>` : "";
  switch (f.type) {
    case "textarea": return `<div class="field">${lab}<textarea id="${id}" name="${f.key}" rows="${f.rows || 4}">${esc(v ?? "")}</textarea>${hint}</div>`;
    case "number": return `<div class="field">${lab}<input id="${id}" type="number" inputmode="numeric" name="${f.key}" value="${esc(v ?? "")}">${hint}</div>`;
    case "select": return `<div class="field">${lab}<select id="${id}" name="${f.key}">${(f.options() || []).map((o) => `<option value="${esc(o.v)}" ${o.v === (v ?? "") ? "selected" : ""}>${esc(o.l)}</option>`).join("")}</select>${hint}</div>`;
    case "checkbox": return `<div class="field"><label class="chip" style="cursor:pointer"><input type="checkbox" name="${f.key}" ${v ? "checked" : ""}> ${esc(f.label)}</label>${hint}</div>`;
    case "multi": { const set = new Set(v || []); return `<div class="field"><div class="lbl">${esc(f.label)}</div><div class="multi">${(f.options() || []).map((o) => `<label><input type="checkbox" data-multi="${f.key}" value="${esc(o.v)}" ${set.has(o.v) ? "checked" : ""}>${esc(o.l)}</label>`).join("") || `<span class="muted small">Nothing to choose yet.</span>`}</div>${hint}</div>`; }
    case "list": return `<div class="field"><div class="lbl">${esc(f.label)}</div><div class="rows" data-rows="${f.key}">${(v || []).map((x) => listRow(f, x)).join("")}</div><button type="button" class="btn sm" data-act="row-add" data-key="${f.key}">+ Add</button><template data-tpl="${f.key}">${listRow(f, "")}</template>${hint}</div>`;
    case "rows": return `<div class="field"><div class="lbl">${esc(f.label)}</div><div class="rows" data-rows="${f.key}">${(v || []).map((x) => objRow(f, x)).join("")}</div><button type="button" class="btn sm" data-act="row-add" data-key="${f.key}">+ Add</button><template data-tpl="${f.key}">${objRow(f, {})}</template>${hint}</div>`;
    case "attrs": return `<div class="field"><div class="lbl">${esc(f.label)}</div><div class="attr-inputs">${f.attrs().map((a) => `<div><label>${esc(a)}</label><input type="number" inputmode="numeric" data-attr="${esc(a)}" value="${esc(v?.[a] ?? 0)}"></div>`).join("")}</div></div>`;
    default: return `<div class="field">${lab}<input id="${id}" type="text" name="${f.key}" value="${esc(v ?? "")}" ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ""}>${hint}</div>`;
  }
}
function listRow(f, x) { return `<div class="row">${f.long ? `<textarea data-item rows="2">${esc(x)}</textarea>` : `<input type="text" data-item value="${esc(x)}">`}<button type="button" class="del" data-act="row-del" aria-label="Remove">×</button></div>`; }
function objRow(f, o) {
  return `<div class="row" data-obj>${f.fields.map((s) => s.type === "select" ? `<select data-sub="${s.key}">${s.options().map((op) => `<option value="${esc(op.v)}" ${op.v === (o[s.key] ?? "") ? "selected" : ""}>${esc(op.l)}</option>`).join("")}</select>`
    : s.type === "textarea" ? `<textarea data-sub="${s.key}" rows="2" placeholder="${esc(s.label)}">${esc(o[s.key] ?? "")}</textarea>` : `<input type="text" data-sub="${s.key}" placeholder="${esc(s.label)}" value="${esc(o[s.key] ?? "")}">`).join("")}<button type="button" class="del" data-act="row-del" aria-label="Remove">×</button></div>`;
}
function readForm(form, schema) {
  const out = {};
  for (const f of schema) {
    if (f.type === "multi") out[f.key] = $$(`[data-multi="${f.key}"]:checked`, form).map((i) => i.value);
    else if (f.type === "list") out[f.key] = $$(`[data-rows="${f.key}"] [data-item]`, form).map((i) => i.value.trim()).filter(Boolean);
    else if (f.type === "rows") out[f.key] = $$(`[data-rows="${f.key}"] [data-obj]`, form).map((r) => Object.fromEntries($$("[data-sub]", r).map((i) => [i.dataset.sub, i.value.trim()]))).filter((o) => Object.values(o).some(Boolean));
    else if (f.type === "attrs") out[f.key] = Object.fromEntries($$("[data-attr]", form).map((i) => [i.dataset.attr, parseInt(i.value, 10) || 0]));
    else if (f.type === "checkbox") out[f.key] = !!form.elements[f.key]?.checked;
    else if (f.type === "number") { const n = parseInt(form.elements[f.key]?.value, 10); out[f.key] = isNaN(n) ? 0 : n; }
    else out[f.key] = form.elements[f.key]?.value ?? "";
  }
  return out;
}
function openEditor({ title, schema, obj, onSave, onDelete }) {
  openModal(`<form class="modal-inner" data-form="editor"><div class="modal-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-act="modal-close" aria-label="Close">✕</button></div>
    <div class="modal-body">${schema.map((f) => fieldHtml(f, obj[f.key])).join("")}</div>
    <div class="modal-foot">${onDelete ? `<button type="button" class="btn ghost danger" data-act="editor-delete">Delete</button>` : ""}<span class="spacer"></span><button type="button" class="btn" data-act="modal-close">Cancel</button><button class="btn primary">Save</button></div></form>`);
  openEditor.current = { schema, obj, onSave, onDelete };
}

/* --- option providers & schemas --- */
const optNpcs = (blank) => () => [...(blank ? [{ v: "", l: blank }] : []), ...allNpcs().map((n) => ({ v: n.id, l: n.name }))];
const optLocs = (blank) => () => [...(blank ? [{ v: "", l: blank }] : []), ...allLocs().map((l) => ({ v: l.id, l: l.name }))];
const optClues = () => M().clues.map((c) => ({ v: c.id, l: (c.type === "void" ? "◎ " : "") + trunc(c.text, 50) }));
const SCH = {
  npc: [
    { key: "name", label: "Name" }, { key: "role", label: "Role / one-liner" }, { key: "quote", label: "Signature quote", type: "textarea", rows: 2 },
    { key: "look", label: "Look", type: "textarea", rows: 2 }, { key: "personality", label: "Personality", type: "textarea", rows: 2 },
    { key: "life", label: "Their life right now (not the murder)", type: "textarea", rows: 3 }, { key: "guarded", label: "If the murder comes up", type: "textarea", rows: 2 },
    { key: "voice", label: "Voice" }, { key: "mannerism", label: "Mannerism" }, { key: "wants", label: "Wants", type: "textarea", rows: 2 },
    { key: "hides", label: "Hides (Keeper only)", type: "textarea", rows: 2 }, { key: "prompts", label: "Ways to play them", type: "list", long: true }, { key: "notes", label: "Notes", type: "textarea", rows: 3 },
  ],
  loc: [
    { key: "name", label: "Name" }, { key: "kind", label: "Kind", placeholder: "Shop, Waterfront, Yacht…" }, { key: "desc", label: "Description (read-aloud)", type: "textarea" },
    { key: "details", label: "Keeper details", type: "textarea" }, { key: "paint", label: "Paint-the-scene questions", type: "list", long: true },
    { key: "areas", label: "Areas / rooms", type: "rows", fields: [{ key: "name", label: "Area" }, { key: "desc", label: "Description", type: "textarea" }] },
    { key: "map", label: "Diagram", type: "select", options: () => [{ v: "", l: "None" }, { v: "yacht", l: "Yacht deck plan (uses first 8 areas)" }] },
    { key: "mapX", label: "Town map X (0–100)", type: "number" }, { key: "mapY", label: "Town map Y (0–70)", type: "number" },
  ],
  clue: [
    { key: "text", label: "Clue (describe without interpreting)", type: "textarea", rows: 3 },
    { key: "type", label: "Type", type: "select", options: () => [{ v: "clue", l: "Clue" }, { v: "void", l: "Void clue" }] },
    { key: "where", label: "Could surface at", type: "multi", options: optLocs() }, { key: "points", label: "Might point to", type: "multi", options: optNpcs() },
    { key: "notes", label: "Keeper notes", type: "textarea", rows: 3 },
  ],
  threat: [
    { key: "name", label: "Name" }, { key: "desc", label: "What it is", type: "textarea", rows: 2 }, { key: "segments", label: "Clock segments", type: "number" },
    { key: "trigger", label: "Tick when…", type: "textarea", rows: 2 },
    { key: "steps", label: "Steps (one per segment)", type: "list" },
  ],
  solution: [
    { key: "title", label: "Theory name" }, { key: "culprit", label: "Culprit", type: "select", options: optNpcs("No single culprit") },
    { key: "motive", label: "Motive", type: "textarea", rows: 3 }, { key: "method", label: "Method", type: "textarea", rows: 3 },
    { key: "wrinkle", label: "10–11: the wrinkle", type: "textarea", rows: 2 }, { key: "upperHand", label: "7–9: the culprit's upper hand", type: "textarea", rows: 2 },
    { key: "clues", label: "Supporting clues", type: "multi", options: optClues },
  ],
  rel: [
    { key: "a", label: "From", type: "select", options: optNpcs() }, { key: "b", label: "To", type: "select", options: optNpcs() }, { key: "label", label: "Label" },
    { key: "kind", label: "Kind", type: "select", options: () => Object.keys(KIND_DASH).map((k) => ({ v: k, l: k })) }, { key: "secret", label: "Secret (Keeper only)", type: "checkbox" },
  ],
  mystery: [
    { key: "title", label: "Title" }, { key: "complexity", label: "Complexity", type: "number" },
    { key: "settingId", label: "Setting", type: "select", options: () => S.settings.map((s) => ({ v: s.id, l: s.name })) },
    { key: "presenting", label: "Presenting the mystery", type: "textarea", rows: 2 }, { key: "hook", label: "Hook", type: "textarea", rows: 6 },
    { key: "establishing", label: "Establishing question", type: "textarea", rows: 2 }, { key: "openingLocationId", label: "Opening location", type: "select", options: optLocs("—") },
    { key: "backstory", label: "Keeper's background", type: "textarea", rows: 6 },
    { key: "timeline", label: "The night — what's certain, and what's loose", type: "textarea", rows: 10 },
    { key: "paint", label: "Paint-the-scene questions", type: "rows", fields: [{ key: "locationId", label: "Location", type: "select", options: optLocs("Anywhere") }, { key: "q", label: "Question", type: "textarea" }] },
    { key: "victimId", label: "Victim", type: "select", options: optNpcs("—") }, { key: "suspects", label: "Suspects", type: "multi", options: optNpcs() },
    { key: "featuredTownsfolk", label: "Townsfolk in this mystery", type: "multi", options: () => SET().npcs.map((n) => ({ v: n.id, l: n.name })) },
    { key: "complications", label: "Complications & twists", type: "list", long: true },
  ],
  maven: () => [
    { key: "name", label: "Name" }, { key: "player", label: "Player" }, { key: "attrs", label: "Abilities", type: "attrs", attrs: () => SYS().attributes },
    { key: "xp", label: "XP", type: "number" }, { key: "cozy", label: "Cozy activity" }, { key: "conditions", label: "Conditions", type: "list" },
    { key: "crowns", label: "Crowns of the Void taken", type: "list" }, { key: "advances", label: "Advances taken", type: "list" }, { key: "notes", label: "Notes", type: "textarea" },
  ],
  move: [{ key: "name", label: "Name" }, { key: "category", label: "Category" }, { key: "trigger", label: "Trigger", type: "textarea", rows: 2 }, { key: "text", label: "Effect", type: "textarea", rows: 7 }, { key: "gm", label: "Keeper tip", type: "textarea", rows: 3 }],
  rule: [{ key: "title", label: "Title" }, { key: "text", label: "Text", type: "textarea", rows: 10 }],
  system: [
    { key: "name", label: "Game name" }, { key: "gmTitle", label: "GM title" }, { key: "pcTitle", label: "Player character title" },
    { key: "attributes", label: "Abilities", type: "list" }, { key: "xpMax", label: "XP track length", type: "number" }, { key: "crownsMax", label: "Crowns track length", type: "number" },
    { key: "endOfSession", label: "End-of-session questions", type: "list", long: true }, { key: "note", label: "Banner note", type: "textarea", rows: 2 },
  ],
  setting: [
    { key: "name", label: "Name" }, { key: "systemId", label: "Game system", type: "select", options: () => S.systems.map((s) => ({ v: s.id, l: s.name })) },
    { key: "intro", label: "Overview", type: "textarea", rows: 5 }, { key: "tone", label: "Tone", type: "textarea", rows: 3 },
    { key: "happenings", label: "This week in town (distractions, errands, invitations)", type: "list", long: true },
  ],
};

function editItem(kind, arr, item, title, isNew) {
  const schema = typeof SCH[kind] === "function" ? SCH[kind]() : SCH[kind];
  openEditor({
    title, schema, obj: item,
    onSave: (vals) => { Object.assign(item, vals); if (isNew) arr.push(item); },
    onDelete: isNew ? null : () => { const i = arr.indexOf(item); if (i >= 0) arr.splice(i, 1); return true; },
  });
}
function npcOwner(id) { const m = M(); return byId(m.npcs, id) ? m.npcs : SET().npcs; }
function locOwner(id) { const m = M(); return byId(m.locations, id) ? m.locations : SET().locations; }

/* ---------------- Clue / theorize / scene modals ---------------- */
function openClue(id) {
  const m = M(), c = byId(m.clues, id), f = P().found[id] || {};
  if (!c) return;
  openModal(`<form class="modal-inner" data-form="clue" data-id="${esc(id)}"><div class="modal-head"><h2>${c.type === "void" ? "◎ Void clue" : "Clue"}</h2><button type="button" class="icon-btn" data-act="modal-close">✕</button></div>
    <div class="modal-body"><div class="quote big">${esc(c.text)}</div>${block("Keeper notes", c.notes)}
      <div class="chips" style="margin:8px 0 14px">${(c.where || []).map(locLink).join("")}${(c.points || []).map(npcLink).join("")}</div>
      <div class="hr"></div>
      <div class="field"><label class="chip" style="cursor:pointer"><input type="checkbox" name="found" ${P().found[id] ? "checked" : ""}> Found</label></div>
      <div class="field"><label>Found by</label>${S.mavens.length ? `<select name="by"><option value="">—</option>${S.mavens.map((mv) => `<option ${f.by === mv.name ? "selected" : ""}>${esc(mv.name)}</option>`).join("")}</select>` : `<input type="text" name="by" value="${esc(f.by || "")}" placeholder="Maven name">`}</div>
      <div class="field"><label>Where</label><select name="where"><option value="">—</option>${allLocs().map((l) => `<option value="${esc(l.id)}" ${(f.where || P().scene.locationId) === l.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></div>
      <div class="field"><label>How it came up</label><input type="text" name="note" value="${esc(f.note || "")}" placeholder="e.g. Rolled up behind the pollock"></div>
    </div>
    <div class="modal-foot"><button type="button" class="btn ghost" data-act="edit-clue" data-id="${esc(id)}">Edit clue</button><span class="spacer"></span><button type="button" class="btn" data-act="modal-close">Cancel</button><button class="btn primary">Save</button></div></form>`);
}
function markClue(id, on, extra = {}) {
  const p = P(), c = byId(M().clues, id); if (!c) return;
  if (on) {
    const was = !!p.found[id];
    p.found[id] = { ...(p.found[id] || {}), at: p.found[id]?.at || nowIso(), where: p.found[id]?.where || p.scene.locationId || "", ...extra };
    if (!was) log(`${c.type === "void" ? "Void clue" : "Clue"}: ${c.text}${extra.by ? " — " + extra.by : ""}`, c.type === "void" ? "void" : "clue");
  } else if (p.found[id]) { delete p.found[id]; }
}

function openTheorize(keep) {
  const m = M(), p = P(), t = (S.ui.theory ||= { culprit: "", text: "", clues: [] });
  const foundClues = m.clues.filter((c) => p.found[c.id] && c.type !== "void");
  const n = theoryCount(m, p, t.clues), mod = n - m.complexity, need = Math.ceil(m.complexity / 2);
  const sols = m.solutions.map((s) => ({ s, k: s.clues.filter((id) => t.clues.includes(id)).length + (t.culprit && s.culprit === t.culprit ? 2 : 0) })).filter((x) => x.k > 0).sort((a, b) => b.k - a.k).slice(0, 3);
  openModal(`<form class="modal-inner" data-form="theory"><div class="modal-head"><h2>Theorize</h2><button type="button" class="icon-btn" data-act="modal-close">✕</button></div>
    <div class="modal-body">
      <div style="display:flex;gap:18px;align-items:center;margin-bottom:6px"><div><div class="big-num">${mod >= 0 ? "+" : ""}${mod}</div><div class="small muted">${n} clue${n === 1 ? "" : "s"} − complexity ${m.complexity}</div></div><div style="flex:1">${oddsHtml(mod)}</div></div>
      ${foundClues.length < need ? `<div class="note-banner">Theorize opens once the Mavens have found at least ${need} Clues (half the Complexity, rounded up). They have ${foundClues.length}.</div>` : ""}
      <div class="field"><label>Culprit</label><select name="culprit" data-act="theory-field"><option value="">— (who did it?)</option>${allNpcs().map((x) => `<option value="${esc(x.id)}" ${t.culprit === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div>
      <div class="field"><label>The theory (how & why)</label><textarea name="text" rows="3" data-act="theory-field" placeholder="Jot the players' theory as they explain it…">${esc(t.text)}</textarea></div>
      <div class="field"><div class="lbl">Clues incorporated or explained away — tap as the players explain (Void Clues don't count)</div>
        <div class="multi" style="max-height:300px">${foundClues.map((c) => `<label><input type="checkbox" data-act="theory-clue" value="${esc(c.id)}" ${t.clues.includes(c.id) ? "checked" : ""}>${esc(trunc(c.text, 60))}</label>`).join("") || `<span class="muted small">No clues found yet.</span>`}</div></div>
      ${sols.length ? `<div class="section-label">Closest prepared theories</div>${sols.map(({ s }) => `<div class="small" style="margin-bottom:6px"><b>${esc(s.title)}</b> — ${esc(trunc(s.method, 140))}</div>`).join("")}` : ""}
      <div class="field" style="margin-top:12px"><label>Roll total (optional)</label><input type="number" inputmode="numeric" name="roll" placeholder="2d6 + ${mod}"></div>
      <div class="note-banner">${esc(byId(SYS().moves, "mv-theorize")?.text || "10+ correct, chance to take down the culprit · 7–9 correct, with a complication or dangerous opportunity · 6− wrong, Keeper reacts · 12+ also a conspirator reveals themself")}</div>
    </div>
    <div class="modal-foot"><button type="button" class="btn ghost" data-act="theory-clear">Clear</button><span class="spacer"></span><button class="btn primary">Log theory</button></div></form>`, keep);
}
function bandFor(total) { return total >= 12 ? "12+ — correct; a conspirator reveals themself" : total >= 10 ? "10+ — correct; take down the culprit" : total >= 7 ? "7–9 — correct, with a complication" : "6− — wrong; Keeper reacts"; }
function theoryCount(m, p, ids) { return ids.filter((id) => p.found[id] && byId(m.clues, id)?.type !== "void").length; }

function openScene() {
  const sc = P().scene;
  openModal(`<form class="modal-inner" data-form="scene"><div class="modal-head"><h2>Set the scene</h2><button type="button" class="icon-btn" data-act="modal-close">✕</button></div>
    <div class="modal-body"><div class="field"><label>Location</label><select name="loc"><option value="">—</option>${allLocs().map((l) => `<option value="${esc(l.id)}" ${sc.locationId === l.id ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select></div>
    <div class="field"><div class="lbl">Who's here</div><div class="multi">${castOf().concat(SET().npcs.filter((n) => !castOf().includes(n))).map((n) => `<label><input type="checkbox" data-multi="npcs" value="${esc(n.id)}" ${sc.npcs.includes(n.id) ? "checked" : ""}>${esc(n.name)}</label>`).join("")}</div></div></div>
    <div class="modal-foot"><span class="spacer"></span><button type="button" class="btn" data-act="modal-close">Cancel</button><button class="btn primary">Set scene</button></div></form>`);
}
function setScene(locId, npcs) {
  const p = P(), changed = p.scene.locationId !== locId;
  p.scene.locationId = locId; if (npcs) p.scene.npcs = npcs;
  if (changed && locId) log(`Scene: ${locName(locId)}`, "scene");
}

/* ---------------- Sheet: moves & search ---------------- */
function openSheet(html) { $("#sheet").innerHTML = html; document.body.classList.add("sheet-open"); $("#sheet").setAttribute("aria-hidden", "false"); }
function closeSheet() { document.body.classList.remove("sheet-open", "nav-open"); $("#sheet").setAttribute("aria-hidden", "true"); }
function openMovesSheet() {
  const sys = SYS();
  openSheet(`<div class="sheet-head"><h2>Moves</h2><button class="icon-btn" data-act="close-overlays">✕</button></div><div class="sheet-body">
    ${sys.moves.map((mv) => moveHtml(mv, false, mv.id === "mv-meddle" || mv.id === "mv-theorize")).join("")}
    <div class="section-label">Keeper reactions</div><div class="pre small">${esc(byId(sys.rules, "r-gmmoves")?.text || "")}</div>
    <div class="section-label">Theorize odds (current clues)</div>${oddsHtml((M() ? M().clues.filter((c) => P()?.found[c.id] && c.type !== "void").length : 0) - (M()?.complexity || 0))}
    <a class="btn" href="#/rules" data-act="close-overlays">Full reference</a></div>`);
}
function openSearch() {
  openSheet(`<div class="sheet-head"><input type="search" id="q" placeholder="Search NPCs, places, clues, moves…" autocomplete="off" style="flex:1"><button class="icon-btn" data-act="close-overlays">✕</button></div><div class="sheet-body search-results" id="qres"><p class="muted small">Start typing.</p></div>`);
  setTimeout(() => $("#q")?.focus(), 50);
}
function runSearch(q) {
  q = q.trim().toLowerCase();
  const box = $("#qres"); if (!box) return;
  if (q.length < 2) { box.innerHTML = `<p class="muted small">Start typing.</p>`; return; }
  const m = M(), sys = SYS(), res = [];
  const hit = (...xs) => xs.flat().filter(Boolean).join(" ").toLowerCase().includes(q);
  allNpcs().forEach((n) => hit(n.name, n.role, n.life, n.look, n.personality, n.wants, n.hides, n.quote, n.prompts) && res.push(["NPC", n.name, n.role, `#/npc/${n.id}`]));
  allLocs().forEach((l) => hit(l.name, l.desc, l.details, (l.areas || []).map((a) => a.name + " " + a.desc)) && res.push(["Location", l.name, l.kind, `#/loc/${l.id}`]));
  m?.clues.forEach((c) => hit(c.text, c.notes) && res.push([c.type === "void" ? "Void clue" : "Clue", c.text, c.notes, `clue:${c.id}`]));
  m?.solutions.forEach((s) => hit(s.title, s.motive, s.method) && res.push(["Solution", s.title, s.motive, "#/mystery/solutions"]));
  m?.threats.forEach((t) => hit(t.name, t.desc, t.steps) && res.push(["Threat", t.name, t.desc, "#/mystery/threats"]));
  sys.moves.forEach((mv) => hit(mv.name, mv.trigger, mv.text, mv.gm) && res.push(["Move", mv.name, mv.trigger, "#/rules"]));
  sys.rules.forEach((r) => hit(r.title, r.text) && res.push(["Rules", r.title, "", "#/rules"]));
  S.mavens.forEach((mv) => hit(mv.name, mv.player, mv.notes) && res.push(["Maven", mv.name, mv.player, "#/mavens"]));
  const mk = (s) => esc(s || "").replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), (x) => `<mark>${x}</mark>`);
  box.innerHTML = res.slice(0, 60).map(([k, t, sub, to]) => to.startsWith("clue:") ? `<a class="res" href="javascript:void 0" data-act="clue-open" data-id="${esc(to.slice(5))}"><div class="k">${k}</div>${mk(t)}<div class="small muted">${mk(trunc(sub, 90))}</div></a>`
    : `<a class="res" href="${esc(to)}" data-act="close-overlays"><div class="k">${k}</div>${mk(t)}<div class="small muted">${mk(trunc(sub, 90))}</div></a>`).join("") || `<p class="muted">No matches.</p>`;
}

/* ---------------- Import / export ---------------- */
function download(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const file = new File([blob], name, { type: "application/json" });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && /iP(ad|hone)/.test(navigator.userAgent)) {
    navigator.share({ files: [file], title: name }).catch(() => {});
    return;
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function importData(obj) {
  if (obj && obj.kind === "keepersdesk-mystery" && obj.mystery) {
    const m = obj.mystery;
    if (obj.setting && !byId(S.settings, obj.setting.id)) S.settings.push(obj.setting);
    if (obj.system && !byId(S.systems, obj.system.id)) S.systems.push(obj.system);
    if (byId(S.mysteries, m.id)) m.id = uid("mys");
    if (!byId(S.settings, m.settingId)) m.settingId = S.settings[0]?.id;
    S.mysteries.push(m); S.ui.activeMysteryId = m.id; toast(`Imported “${m.title}”`); return;
  }
  if (obj && obj.schema && obj.mysteries) {
    if (!confirm("Replace ALL data on this device with the imported backup?")) return;
    S = migrate(obj); toast("Backup restored"); return;
  }
  throw new Error("Not a Keeper's Desk file");
}

/* ---------------- Actions ---------------- */
const A = {
  "go": (el) => { location.hash = el.dataset.to; },
  "nav-toggle": () => document.body.classList.toggle("nav-open"),
  "close-overlays": () => closeSheet(),
  "theme": () => { const cur = S.ui.theme || "light"; S.ui.theme = cur === "dark" ? "light" : "dark"; applyTheme(); save(); },
  "search": () => openSearch(),
  "moves-sheet": () => openMovesSheet(),
  "modal-close": () => closeModal(),

  "clue-filter": (el) => { S.ui.clueFilter = el.dataset.v; commit(); },
  "clue-toggle": (el) => { const id = el.dataset.id; markClue(id, !P().found[id]); commit(); },
  "clue-open": (el) => { closeSheet(); openClue(el.dataset.id); },
  "tick": (el) => { const t = byId(M().threats, el.dataset.id); const p = P(); const v = Math.min(t.segments, (p.ticks[t.id] || 0) + 1); if (v !== (p.ticks[t.id] || 0)) { p.ticks[t.id] = v; log(`${t.name} ${v}/${t.segments}${t.steps?.[v - 1] ? ": " + t.steps[v - 1] : ""}`, "threat"); } commit(); },
  "untick": (el) => { const p = P(); p.ticks[el.dataset.id] = Math.max(0, (p.ticks[el.dataset.id] || 0) - 1); commit(); },
  "paint-ask": (el) => { const p = P(); p.asked[el.dataset.i] = !p.asked[el.dataset.i]; commit(); },
  "eos": (el) => { const p = P(); p.eos[el.dataset.i] = !p.eos[el.dataset.i]; commit(); },
  "eos-award": () => { const p = P(), n = Object.values(p.eos).filter(Boolean).length; if (!n) return toast("Tick the questions answered “yes” first"); S.mavens.forEach((mv) => (mv.xp = (mv.xp || 0) + n)); log(`End of session: each Maven +${n} XP`, "session"); p.eos = {}; commit(); toast(`+${n} XP each`); },
  "new-session": () => { const p = P(); if (!confirm(`Start session ${p.session + 1}? Clues and clocks carry over.`)) return; p.session++; p.asked = {}; p.eos = {}; log(`Session ${p.session} begins`, "session"); commit(); },
  "log-del": (el) => { const p = P(); p.log = p.log.filter((e) => e.id !== el.dataset.id); commit(); },
  "complication": () => { const c = M().complications || []; if (!c.length) return toast("No complications listed"); const pick = c[Math.floor(Math.random() * c.length)]; openModal(`<div class="modal-inner"><div class="modal-head"><h2>Complication</h2><button class="icon-btn" data-act="modal-close">✕</button></div><div class="modal-body"><div class="quote big">${esc(pick)}</div></div><div class="modal-foot"><button class="btn" data-act="complication">Draw again</button><button class="btn primary" data-act="complication-log" data-v="${esc(pick)}">Use it</button></div></div>`); },
  "happening": () => { const c = SET().happenings || []; if (!c.length) return toast("No town happenings listed"); const pick = c[Math.floor(Math.random() * c.length)]; openModal(`<div class="modal-inner"><div class="modal-head"><h2>Meanwhile, in town…</h2><button class="icon-btn" data-act="modal-close">✕</button></div><div class="modal-body"><div class="quote big">${esc(pick)}</div><p class="small muted">Bring it to the Mavens as an interruption, an invitation or an errand. It needn't touch the murder.</p></div><div class="modal-foot"><button class="btn" data-act="happening">Draw again</button><button class="btn primary" data-act="complication-log" data-v="${esc(pick)}">Use it</button></div></div>`); },
  "complication-log": (el) => { log("Complication: " + el.dataset.v, "note"); closeModal(); commit(); },
  "scene-edit": () => openScene(),
  "scene-drop": (el) => { const p = P(); p.scene.npcs = p.scene.npcs.filter((x) => x !== el.dataset.id); commit(); },
  "scene-here": (el) => { setScene(el.dataset.id); commit(); toast(`Scene: ${locName(el.dataset.id)}`); },
  "stage-toggle": (el) => { const p = P(), id = el.dataset.id; p.scene.npcs = p.scene.npcs.includes(id) ? p.scene.npcs.filter((x) => x !== id) : [...p.scene.npcs, id]; commit(); },
  "theorize": () => openTheorize(),
  "theory-clear": () => { S.ui.theory = { culprit: "", text: "", clues: [] }; save(); openTheorize(); },
  "cast-filter": (el) => { S.ui.castFilter = el.dataset.v; commit(); },

  "web-sel": (el) => { S.ui.webSel = el.dataset.id && S.ui.webSel !== el.dataset.id ? el.dataset.id : ""; commit(); },
  "map-pin": (el, ev) => { if (S.ui.placing) return; ev.stopPropagation(); S.ui.mapSel = el.dataset.id; commit(); },
  "place-cancel": () => { S.ui.placing = ""; commit(); },
  "zone": (el) => { S.ui.zoneSel = +el.dataset.i; commit(); $("#area-" + el.dataset.i)?.scrollIntoView({ behavior: "smooth", block: "center" }); },

  "edit-mystery": () => editItem("mystery", [], M(), "Edit mystery"),
  "edit-setting": () => editItem("setting", [], SET(), "Edit setting"),
  "edit-system": () => editItem("system", [], SYS(), "Game system"),
  "add-npc": (el) => editItem("npc", el.dataset.scope === "setting" ? SET().npcs : M().npcs, { id: uid("npc"), name: "", prompts: [] }, "New NPC", true),
  "edit-npc": (el) => editItem("npc", npcOwner(el.dataset.id), npcById(el.dataset.id), "Edit NPC"),
  "add-loc": (el) => editItem("loc", el.dataset.scope === "setting" ? SET().locations : M().locations, { id: uid("loc"), name: "", paint: [], areas: [], mapX: 40, mapY: 40 }, "New location", true),
  "edit-loc": (el) => editItem("loc", locOwner(el.dataset.id), locById(el.dataset.id), "Edit location"),
  "add-clue": (el) => editItem("clue", M().clues, { id: uid("c"), type: el.dataset.type || "clue", text: "", where: [], points: [] }, "New clue", true),
  "edit-clue": (el) => { closeModal(); editItem("clue", M().clues, byId(M().clues, el.dataset.id), "Edit clue"); },
  "add-threat": () => editItem("threat", M().threats, { id: uid("t"), name: "", segments: 4, steps: [] }, "New threat", true),
  "edit-threat": (el) => editItem("threat", M().threats, byId(M().threats, el.dataset.id), "Edit threat"),
  "add-solution": () => editItem("solution", M().solutions, { id: uid("s"), title: "", culprit: "", clues: [] }, "New solution", true),
  "edit-solution": (el) => editItem("solution", M().solutions, byId(M().solutions, el.dataset.id), "Edit solution"),
  "add-rel": () => editItem("rel", M().relationships, { id: uid("rel"), a: M().victimId || "", b: "", label: "", kind: "other" }, "New link", true),
  "edit-rel": (el) => editItem("rel", M().relationships, byId(M().relationships, el.dataset.id), "Edit link"),
  "add-maven": () => editItem("maven", S.mavens, { id: uid("mv"), name: "", attrs: {}, xp: 0, conditions: [], crowns: [], advances: [] }, "New Maven", true),
  "edit-maven": (el) => editItem("maven", S.mavens, byId(S.mavens, el.dataset.id), "Edit Maven"),
  "xp": (el) => { const mv = byId(S.mavens, el.dataset.id), i = +el.dataset.i; mv.xp = mv.xp === i + 1 ? i : i + 1; commit(); },
  "cond-add": (el) => { const c = prompt("Condition (e.g. Unnerved, Sprained Ankle, Haunted). Max 3; a 4th marks a Crown instead:"); if (c) { byId(S.mavens, el.dataset.id).conditions.push(c.trim()); commit(); } },
  "cond-del": (el) => { byId(S.mavens, el.dataset.id).conditions.splice(+el.dataset.i, 1); commit(); },
  "add-move": () => editItem("move", SYS().moves, { id: uid("mv"), name: "", category: "Core" }, "New move", true),
  "edit-move": (el) => editItem("move", SYS().moves, byId(SYS().moves, el.dataset.id), "Edit move"),
  "add-rule": () => editItem("rule", SYS().rules, { id: uid("r"), title: "", text: "" }, "New rules section", true),
  "edit-rule": (el) => editItem("rule", SYS().rules, byId(SYS().rules, el.dataset.id), "Edit rules section"),

  "row-add": (el) => { const k = el.dataset.key, tpl = $(`template[data-tpl="${k}"]`, modal()); $(`[data-rows="${k}"]`, modal()).insertAdjacentHTML("beforeend", tpl.innerHTML); $(`[data-rows="${k}"] .row:last-child input, [data-rows="${k}"] .row:last-child textarea`, modal())?.focus(); },
  "row-del": (el) => el.closest(".row").remove(),
  "editor-delete": () => { const cur = openEditor.current; if (cur?.onDelete && confirm("Delete this?")) { cur.onDelete(); closeModal(); commit(); history.length > 1 && /#\/(npc|loc)\//.test(location.hash) && history.back(); } },

  "activate": (el) => { S.ui.activeMysteryId = el.dataset.id; commit(); toast("Mystery loaded"); },
  "new-mystery": () => { const m = { id: uid("mys"), settingId: SET()?.id || S.settings[0]?.id, title: "New Mystery", complexity: 6, presenting: "", hook: "", establishing: "", backstory: "", paint: [], locations: [], npcs: [], featuredTownsfolk: [], suspects: [], relationships: [], clues: [], threats: [], solutions: [], complications: [], notes: "" }; if (!m.settingId) return toast("Create a setting first"); S.mysteries.push(m); S.ui.activeMysteryId = m.id; save(); location.hash = "#/mystery/overview"; setTimeout(() => editItem("mystery", [], m, "New mystery"), 50); },
  "dup-mystery": (el) => { const m = clone(byId(S.mysteries, el.dataset.id)); m.id = uid("mys"); m.title += " (copy)"; S.mysteries.push(m); commit(); },
  "del-mystery": (el) => { const m = byId(S.mysteries, el.dataset.id); if (!confirm(`Delete “${m.title}” and its session state?`)) return; S.mysteries = S.mysteries.filter((x) => x !== m); delete S.play[m.id]; if (S.ui.activeMysteryId === m.id) S.ui.activeMysteryId = S.mysteries[0]?.id; commit(); },
  "new-setting": () => { const s = { id: uid("set"), systemId: S.systems[0]?.id, name: "New Town", intro: "", tone: "", locations: [], npcs: [] }; S.settings.push(s); editItem("setting", [], s, "New setting"); },
  "del-setting": (el) => { if (S.mysteries.some((m) => m.settingId === el.dataset.id)) return toast("A mystery still uses this setting"); if (!confirm("Delete this setting?")) return; S.settings = S.settings.filter((s) => s.id !== el.dataset.id); commit(); },
  "new-system": () => { const base = clone(S.systems[0] || window.BRINDLE_SEED.systems[0]); base.id = uid("sys"); base.name = "New Carved game"; S.systems.push(base); editItem("system", [], base, "New game system"); toast("Copied Brindlewood moves as a starting point"); },
  "del-system": (el) => { if (S.settings.some((s) => s.systemId === el.dataset.id)) return toast("A setting still uses this system"); if (!confirm("Delete this system?")) return; S.systems = S.systems.filter((s) => s.id !== el.dataset.id); commit(); },
  "export": () => download(`keepers-desk-backup-${new Date().toISOString().slice(0, 10)}.json`, S),
  "export-mystery": () => { const m = M(); download(`${m.title.replace(/\W+/g, "-").toLowerCase()}.json`, { kind: "keepersdesk-mystery", mystery: m, setting: SET(m), system: SYS() }); },
  "reset-play": () => { if (!confirm("Clear found clues, clocks, log and scene for this mystery?")) return; delete S.play[M().id]; commit(); },
  "restore-dad": () => { if (!confirm("Restore Dad Overboard (and the Brindlewood Bay setting & rules) to the original content? Your edits to them will be lost; Mavens and other mysteries are kept.")) return;
    const seed = clone(window.BRINDLE_SEED);
    for (const k of ["systems", "settings", "mysteries"]) seed[k].forEach((item) => { const i = S[k].findIndex((x) => x.id === item.id); if (i >= 0) S[k][i] = item; else S[k].push(item); });
    S.ui.activeMysteryId = "mys-dad"; commit(); toast("Restored"); },
  "factory": () => { if (!confirm("Erase EVERYTHING on this device and reload defaults?")) return; S = clone(window.BRINDLE_SEED); commit(); },
};

/* ---------------- Event wiring ---------------- */
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-act]");
  if (!el) { return; }
  const act = el.dataset.act;
  if (["place-start", "import", "web-secrets", "web-labels", "theory-field", "theory-clue"].includes(act)) return; // handled on change/input
  if (act === "map-click") {
    if (!S.ui.placing) return;
    const svg = el.closest("svg"), pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const l = locById(S.ui.placing); if (l) { l.mapX = Math.round(p.x * 10) / 10; l.mapY = Math.round(p.y * 10) / 10; }
    S.ui.mapSel = S.ui.placing; S.ui.placing = ""; commit(); return;
  }
  if (A[act]) {
    if (el.tagName === "A" && el.getAttribute("href")?.startsWith("#")) { A[act](el, ev); return; }
    ev.preventDefault(); A[act](el, ev);
  }
});
document.addEventListener("change", (ev) => {
  const el = ev.target, act = el.dataset.act;
  if (act === "place-start" && el.value) { S.ui.placing = el.value; commit(); }
  if (act === "web-secrets") { S.ui.webSecrets = el.checked; commit(); }
  if (act === "web-labels") { S.ui.webLabels = el.checked; commit(); }
  if (act === "theory-clue") { const t = S.ui.theory; t.clues = el.checked ? [...new Set([...t.clues, el.value])] : t.clues.filter((x) => x !== el.value); save(); openTheorize(true); }
  if (act === "theory-field" && el.tagName === "SELECT") { S.ui.theory[el.name] = el.value; save(); openTheorize(true); }
  if (act === "import") {
    const f = el.files?.[0]; if (!f) return;
    f.text().then((t) => { importData(JSON.parse(t)); commit(); }).catch((e) => toast("Import failed: " + e.message)).finally(() => (el.value = ""));
  }
});
document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (el.id === "q") runSearch(el.value);
  if (el.dataset.act === "theory-field" && el.tagName === "TEXTAREA") { S.ui.theory.text = el.value; save(); }
  if (el.dataset.bind === "mystery.notes") { M().notes = el.value; save(); }
});
document.addEventListener("submit", (ev) => {
  const form = ev.target, kind = form.dataset.form;
  if (!kind) return;
  ev.preventDefault();
  if (kind === "log") { const v = form.elements.text.value.trim(); if (v) { log(v, "note"); commit(); setTimeout(() => $('[data-form="log"] input')?.focus(), 0); } return; }
  if (kind === "editor") {
    const cur = openEditor.current; const vals = readForm(form, cur.schema);
    if (vals.segments !== undefined) vals.segments = Math.max(1, Math.min(12, vals.segments || 4));
    cur.onSave(vals); closeModal(); commit(); toast("Saved"); return;
  }
  if (kind === "clue") {
    const id = form.dataset.id, on = form.elements.found.checked;
    const extra = { by: form.elements.by.value, where: form.elements.where.value, note: form.elements.note.value.trim() };
    if (on) { markClue(id, true, extra); Object.assign(P().found[id], extra); } else markClue(id, false);
    closeModal(); commit(); return;
  }
  if (kind === "scene") { setScene(form.elements.loc.value, $$('[data-multi="npcs"]:checked', form).map((i) => i.value)); closeModal(); commit(); return; }
  if (kind === "theory") {
    const t = S.ui.theory, m = M(), n = theoryCount(m, P(), t.clues), mod = n - m.complexity;
    const roll = parseInt(form.elements.roll.value, 10);
    const rec = { id: uid("th"), at: nowIso(), culprit: t.culprit, text: t.text, clues: [...t.clues], mod, roll: isNaN(roll) ? null : roll };
    P().theories.push(rec);
    log(`Theory: ${t.culprit ? npcName(t.culprit) + " — " : ""}${t.text || "(no summary)"} · ${n} clues, mod ${mod >= 0 ? "+" : ""}${mod}${rec.roll != null ? ` · rolled ${roll}: ${bandFor(roll)}` : ""}`, "theory");
    closeModal(); commit(); toast("Theory logged"); return;
  }
});
modal().addEventListener("click", (ev) => { if (ev.target === modal()) closeModal(); });
modal().addEventListener("close", () => { modal().innerHTML = ""; });
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") closeSheet();
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") { ev.preventDefault(); openSearch(); }
});
window.addEventListener("hashchange", () => { closeSheet(); render(); });

function applyTheme() { if (S.ui.theme) document.documentElement.dataset.theme = S.ui.theme; else delete document.documentElement.dataset.theme; }

/* ---------------- Boot ---------------- */
S = load();
if (!byId(S.mysteries, S.ui.activeMysteryId)) S.ui.activeMysteryId = S.mysteries[0]?.id;
applyTheme();
render();
save();
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
window.KD = { get state() { return S; } };
})();
