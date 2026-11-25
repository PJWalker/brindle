/* Renders the one-shot sheets from oneshot-data.js. No build step. */
(function () {
  const D = window.ONESHOT;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sign = (n) => (n > 0 ? "+" + n : n < 0 ? "−" + -n : "0");
  const box = '<span class="box"></span>';
  const n = (k) => `<span class="n">${k}</span>`;
  const FOOT = "Brindlewood Bay is a creation of Jason Cordova and Gauntlet Publishing. This fan-made sheet is not affiliated with them. Rules paraphrased; check your rulebook.";

  /* ---------- Basic moves page ---------- */
  function moveBlock(m) {
    let h = `<div class="mv"><h3>${esc(m.name)}${m.tag ? `<small>${esc(m.tag)}</small>` : ""}</h3>`;
    if (m.trigger) h += `<p class="trig">${m.trigger}</p>`;
    if (m.body) {
      for (const [kind, v] of m.body) {
        if (kind === "p") h += `<p>${v}</p>`;
        if (kind === "dl") h += "<dl>" + v.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join("") + "</dl>";
      }
    }
    if (m.results) h += "<table>" + m.results.map(([k, v]) => `<tr><td class="k">${k}</td><td>${v}</td></tr>`).join("") + "</table>";
    if (m.after) h += `<p>${m.after}</p>`;
    if (m.tips) h += m.tips.map((t) => `<p class="tip">${t}</p>`).join("");
    return h + "</div>";
  }

  function basicsPage(label) {
    const col = (c) => D.basics.filter((m) => m.col === c).map(moveBlock).join("");
    const rules = `<div class="rules"><h3>At this table (one-shot rules)</h3>${D.tableRules.map((r) => `<p>${r}</p>`).join("")}</div>`;
    return `<section class="page">
      <header class="head"><div class="left"><h1>Moves</h1><span class="tag">${esc(label || "Talk freely. Roll when a move says so.")}</span></div><div class="brand">Brindlewood Bay · One-shot</div></header>
      <div class="cols c3">
        <div class="col">${col(1)}</div>
        <div class="col">${col(2)}${rules}</div>
        <div class="col">${col(3)}</div>
      </div>
      <div class="foot">${FOOT}</div>
    </section>`;
  }

  /* ---------- Playbook front ---------- */
  function playbookPage(pb) {
    const opts = (arr, own = true) =>
      `<div class="opts">${arr.map((s) => `<span class="opt">${box}${esc(s)}</span>`).join("")}${own ? `<span class="opt">${box}<span class="line short"></span></span>` : ""}</div>`;

    const abil = D.abilities
      .map((a) => `<div><b>${pb.custom ? "" : sign(pb.stats[a])}</b><span>${a}</span></div>`)
      .join("");

    const abilNote = pb.custom
      ? `Write in: Vitality 0, Composure +1, Reason +1, Presence 0, Sensitivity −1. Then add 1 to one of them.`
      : `Already includes your starting +1. A move may add 1 more (max +3).`;

    const careers = pb.careers.length
      ? opts(pb.careers)
      : `<div class="line"></div>`;

    const moves = pb.moves.length
      ? pb.moves.map((id) => {
          const m = D.mavenMoves[id];
          return `<div class="mm">${box}<div class="t"><b class="nm">${esc(m.name)}.</b> ${m.text} <span class="tip">${m.tip}</span></div></div>`;
        }).join("")
      : `<p class="hint">Choose one from the Maven Moves sheet. No two Mavens can share a move.</p><div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div>`;

    const items = pb.items.length
      ? `<p class="hint">Mark one below; each other player names one more for you.</p><ul class="chk">${pb.items.map((i) => `<li>${box}<span class="t">${esc(i)}</span></li>`).join("")}</ul>`
      : `<p class="hint">Each other player names one thing in your home.</p>`;
    const blankItems = Array.from({ length: pb.items.length ? 5 : 8 }, () => `<div class="row">${box}<span class="fill"></span></div>`).join("");

    const stakes = `<ul class="plain small">${pb.stakes.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`;

    return `<section class="page">
      <header class="head"><div class="left"><h1>${esc(pb.title)}</h1><span class="tag">${esc(pb.tagline)}</span></div><div class="brand">Brindlewood Bay · One-shot playbook</div></header>
      <div class="cols c3">
        <div class="col">
          <h2>${n(1)}Name <span class="hint">circle one, add a surname</span></h2>
          <div class="names small">${pb.names.map((x) => `<span>${esc(x)}</span>`).join(" ")}</div>
          <div class="row"><span class="fill"></span></div>
          <h2>${n(2)}Style</h2>
          ${opts(pb.styles)}
          <h2>${n(3)}Cozy Activity <span class="hint">no two Mavens share one</span></h2>
          ${opts(pb.cozy)}
          <h2>${n(4)}Before Brindlewood</h2>
          <div class="small">Your career:</div>
          ${careers}
          <div class="row"><span class="lab">Late partner:</span><span class="fill"></span></div>
          <div class="row"><span class="lab">Children <span class="hint">(pets count)</span>:</span><span class="fill"></span></div>
          <h2>Abilities</h2>
          <div class="abil">${abil}</div>
          <p class="hint">${abilNote}</p>
          <h2>Conditions <span class="hint">max 3 · disadvantage when they get in the way</span></h2>
          <div class="line"></div><div class="line"></div><div class="line"></div>
        </div>
        <div class="col">
          <h2>${n(5)}Maven Move <span class="hint">choose one</span></h2>
          ${moves}
          <h2>${n(6)}Someone in town</h2>
          <p class="hint">Who in Brindlewood matters to you, and what do you want from them this week? Tell the Keeper. For example:</p>
          ${stakes}
          <div class="line"></div><div class="line"></div>
          <h2>Establishing Question</h2>
          <p class="hint">The Keeper asks this when the mystery begins.</p>
          <div class="line"></div>
          <h2>${n(7)}Spotlight <span class="hint">mark two</span></h2>
          <p class="hint">When you do one on screen, tick it (once each). Spend a tick for advantage on any roll.</p>
          <ul class="chk small">${D.spotlight.map((q) => `<li>${box}<span class="t">${esc(q)}</span></li>`).join("")}</ul>
        </div>
        <div class="col">
          <h2>Crown of the Queen <span class="hint">mark any</span></h2>
          <ul class="chk small">${D.queen.map((q) => `<li>${box}<span class="t">${q}</span></li>`).join("")}</ul>
          <h2>Crown of the Void <span class="hint">mark the next box</span></h2>
          <ul class="chk small">${D.void.map((q) => `<li>${box}<span class="t">${q}</span></li>`).join("")}</ul>
          <p class="hint">After any roll: put on a Crown to raise the result one step. See the back.</p>
          <h2>${n(8)}A Cozy Little Place</h2>
          ${items}
          ${blankItems}
        </div>
      </div>
      <div class="foot">${FOOT}</div>
    </section>`;
  }

  /* ---------- Maven moves sheet ---------- */
  function mavenMovesPage() {
    const groups = D.playbooks.filter((p) => p.moves.length).map((pb) => `
      <div class="mmgroup"><h3>${esc(pb.title)}</h3>
        ${pb.moves.map((id) => { const m = D.mavenMoves[id]; return `<div class="mvx"><b class="nm">${esc(m.name)}.</b> ${m.text} <span class="tip">${m.tip}</span></div>`; }).join("")}
      </div>`).join("");
    return `<section class="page">
      <header class="head"><div class="left"><h1>Maven Moves</h1><span class="tag">Choose one. No two Mavens start with the same move.</span></div><div class="brand">Brindlewood Bay · One-shot</div></header>
      <p class="hint" style="margin-bottom:2mm">A one-shot selection from the rulebook's Classic and Alternate sets: moves that pay off within one session. Each playbook offers three; with the Keeper's OK, you may take any move here instead.</p>
      <div class="mmgrid">${groups}</div>
      <div class="picker"><h3>Which playbook?</h3><table>${D.picker.map(([a, b]) => `<tr><td>If you want to ${esc(a)}</td><td>\u2192 <b>${esc(b)}</b></td></tr>`).join("")}</table></div>
      <div class="foot">${FOOT}</div>
    </section>`;
  }

  /* ---------- Mount ---------- */
  const root = document.getElementById("sheets");
  const mode = document.body.dataset.sheet;
  const backs = () => document.getElementById("backs")?.checked !== false;

  function render() {
    let html = "";
    if (mode === "moves") {
      html = basicsPage() + mavenMovesPage();
    } else {
      const pick = document.getElementById("which")?.value || "all";
      const list = pick === "all" ? D.playbooks : D.playbooks.filter((p) => p.id === pick);
      html = list.map((pb) => playbookPage(pb) + (backs() ? basicsPage() : "")).join("");
    }
    root.innerHTML = html;
  }

  const sel = document.getElementById("which");
  if (sel) {
    sel.innerHTML = `<option value="all">All playbooks</option>` + D.playbooks.map((p) => `<option value="${p.id}">${esc(p.title)}</option>`).join("");
    const q = new URLSearchParams(location.search).get("pb");
    if (q && D.playbooks.some((p) => p.id === q)) sel.value = q;
    sel.addEventListener("change", render);
  }
  document.getElementById("backs")?.addEventListener("change", render);
  document.getElementById("print")?.addEventListener("click", () => window.print());
  render();
})();
