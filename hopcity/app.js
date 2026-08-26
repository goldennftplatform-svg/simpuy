(() => {
  "use strict";

  const SAVE_KEY = "hopcity_save_v5";
  const BOARD_N = 10;
  const TILES_N = BOARD_N * BOARD_N;
  const CENTER = 45;
  const KING_WORTH = 32000;
  const RIVAL_KING = 34000;
  const BROKE_LINE = -400;

  const SEASONS = ["Spring", "Summer", "Fall", "Winter"];
  const ADVANCE_LABELS = {
    Spring: "Bring on summer",
    Summer: "Roll into harvest",
    Fall: "Close the books",
    Winter: "New year, same dirt",
  };

  const TITLES = [
    [0, "Squatter"],
    [2500, "Claim Staker"],
    [7500, "Yard Boss"],
    [18000, "Hop Baron"],
    [32000, "Hop King"],
  ];

  const VARIETIES = {
    C: { key: "C", name: "Pacific Cluster", yield: 1.0, price: 1.0, cost: 0 },
    F: { key: "F", name: "Fuggle", yield: 0.85, price: 1.22, cost: 15 },
    W: { key: "W", name: "White Vine", yield: 1.18, price: 0.88, cost: 10 },
  };

  const COSTS = { yard: 120, well: 200, kiln: 450, cabin: 260 };
  const ASSET_VALUE = { hq: 400, yard: 80, well: 120, kiln: 300, cabin: 160 };
  const CLEAR_COST = { rock: 70, forest: 95 };
  const TERRAIN_LABEL = { grass: "Open dirt", creek: "Creek water", rock: "Bedrock", forest: "Timber" };

  const TOOLS = [
    { id: "inspect", name: "Look Around", icon: "i-cone", desc: "Click a tile to inspect it.", cost: 0 },
    { id: "yard", name: "Hop Yard", icon: "i-pole", desc: "Plant an acre of bines.", cost: 120 },
    { id: "well", name: "Dug Well", icon: "i-well", desc: "Waters the 8 tiles around it.", cost: 200 },
    { id: "kiln", name: "Hop Kiln", icon: "i-kiln", desc: "Dries 7,000 lb of hops each fall.", cost: 450 },
    { id: "cabin", name: "Pickers' Cabin", icon: "i-cabin", desc: "Hands enough to pick 6 acres.", cost: 260 },
    { id: "clear", name: "Clear Land", icon: "i-rock", desc: "Stump out bedrock & timber.", cost: 0 },
    { id: "demolish", name: "Demolish", icon: "i-tree", desc: "Tear it down, quarter refunded.", cost: 0 },
  ];

  const REGIONS = [
    {
      id: "puyallup", name: "Puyallup Valley", st: "WA",
      blurb: "Meeker country. Deep river loam under Rainier's shadow - rich, wet, and famous.",
      rain: 0.85, soil: 0.95, yieldMul: 1.08, priceMul: 1.08, costMul: 1.25, fee: 0.06,
      risk: "Mildew", creeks: 12, forest: 16, rocks: 6,
    },
    {
      id: "moxee", name: "Moxee Prairie", st: "WA",
      blurb: "Dryland gold east of Yakima. Nothing grows without water - everything grows with it.",
      rain: 0.25, soil: 0.85, yieldMul: 1.25, priceMul: 1.02, costMul: 0.9, fee: 0.05,
      risk: "Aphids", creeks: 4, forest: 2, rocks: 10,
    },
    {
      id: "yakima", name: "Yakima Valley", st: "WA",
      blurb: "Three hundred days of sun. The future of Northwest hops, if you can irrigate fast enough.",
      rain: 0.3, soil: 0.78, yieldMul: 1.2, priceMul: 1.0, costMul: 0.95, fee: 0.05,
      risk: "Drought", creeks: 6, forest: 2, rocks: 8,
    },
    {
      id: "walla", name: "Walla Walla", st: "WA",
      blurb: "Cheap wind-blown dirt on the rail line. Hail rolls off the Blues some summers.",
      rain: 0.38, soil: 0.72, yieldMul: 1.08, priceMul: 0.97, costMul: 0.8, fee: 0.04,
      risk: "Hail", creeks: 6, forest: 4, rocks: 8,
    },
    {
      id: "boise", name: "Treasure Valley", st: "ID",
      blurb: "Boise-front land going cheap as the railroad pushes through. Shipping rates are kind here.",
      rain: 0.32, soil: 0.74, yieldMul: 1.0, priceMul: 0.98, costMul: 0.75, fee: 0.03,
      risk: "Drought", creeks: 6, forest: 2, rocks: 8,
    },
    {
      id: "magic", name: "Snake River Plain", st: "ID",
      blurb: "New canal country. Big water, big sky, big yields - when the river behaves.",
      rain: 0.28, soil: 0.8, yieldMul: 1.12, priceMul: 0.99, costMul: 0.85, fee: 0.05,
      risk: "Flood", creeks: 8, forest: 2, rocks: 8,
    },
    {
      id: "willamette", name: "Willamette Valley", st: "OR",
      blurb: "Oregon's old hop belt around Independence. Portland buyers pay extra for these bales.",
      rain: 0.9, soil: 0.88, yieldMul: 0.98, priceMul: 1.12, costMul: 1.15, fee: 0.06,
      risk: "Mildew", creeks: 14, forest: 14, rocks: 4,
    },
    {
      id: "hood", name: "Hood River", st: "OR",
      blurb: "Small boutique yards above the Columbia gorge. Fewer pounds, fancier price tags.",
      rain: 0.65, soil: 0.76, yieldMul: 0.96, priceMul: 1.18, costMul: 1.1, fee: 0.05,
      risk: "Wind", creeks: 10, forest: 12, rocks: 6,
    },
  ];

  const RIVALS_SEED = [
    { name: "Silas T. Fenn", worth: 3600 },
    { name: "Almira Crocker", worth: 4300 },
    { name: "Phineas Judkins", worth: 3100 },
  ];

  // Valley lore drawn from the real Meeker/Puyallup record (1852 trail, hop boom, mansion years).
  const LORE_ALMANAC = [
    "English brewers take the bulk of Puyallup bales across the pond - London sets our prices.",
    "Ezra Meeker farms over five hundred acres of hops up the valley. The man brags, but the bales back him.",
    "An ox drinks eight to ten gallons on a hot day. Water is logistics, not scenery.",
    "Old trail men still shudder at the cholera years on the Platte. This valley's fevers are mildew and aphids.",
    "Most emigrant wagons were called prairie schooners - sails of white on a sea of grass.",
    "Donation land claims cost $1.25 an acre once proved up. The Olympia land office stays busy.",
    "The Meekers reached Portland in '52 with three dollars and a quarter between them. Fortune favors stubbornness.",
    "Marion Meeker was six weeks old when the family wagons rolled from Iowa. Babies were born to the road.",
    "Yakima's dry summers yield to controlled irrigation - ditches make the desert bloom.",
    "Kiln fires are the dread of every yard. A lamp knocked into drying racks ruins a season's profit.",
    "Emigrants marked calendars by Independence Rock - reach the landmark by the Fourth of July or fear the snows.",
    "The Puyallup takes its name from the river people who fished these waters long before claims were staked.",
  ];

  // Almanac quiz - adapted from the Ezra Meeka/Oregon Trail record.
  const TRIVIA_BANK = [
    { q: "In what year did Ezra Meeker first cross the plains to Oregon?", c: ["1852", "1860", "1848", "1856"], a: 0 },
    { q: "What business made Meeker's name in the Puyallup Valley?", c: ["Cattle ranching", "Gold mining", "Hop farming", "Lumber milling"], a: 2 },
    { q: "By repute, how tall is Ezra Meeker?", c: ["Six foot four", "Five foot one", "Average for the territory", "Nobody has asked"], a: 1 },
    { q: "How old was baby Marion Meeker when the family left Iowa?", c: ["Six weeks", "Six months", "Six years", "Not yet born"], a: 0 },
    { q: "When the Meekers reached Portland in 1852, their pockets held about:", c: ["$3.25", "$300", "A land patent", "A hop contract"], a: 0 },
    { q: "Most Puyallup hop bales sail to buyers in:", c: ["England", "Germany", "Boston", "San Francisco only"], a: 0 },
    { q: "Which scourge haunted wagon companies on the old trail?", c: ["Cholera", "Smallpox", "Influenza", "Scurvy"], a: 0 },
    { q: "A trail ox drinks roughly how much on a hot day?", c: ["8-10 gallons", "2-3 gallons", "A pint", "20 gallons"], a: 0 },
    { q: "Emigrants raced which Wyoming landmark by the Fourth of July?", c: ["Independence Rock", "Devil's Gate", "Chimney Rock", "Scott's Bluff"], a: 0 },
    { q: "What makes Yakima's hop country workable?", c: ["Dry summers tamed by irrigation", "Year-round rain", "Tropical heat", "Deep snowmelt only"], a: 0 },
    { q: "Proved-up donation land claims cost settlers:", c: ["$1.25 per acre", "Nothing at all", "Ten dollars flat", "A share of crop"], a: 0 },
    { q: "Canvas-topped wagon trains were nicknamed:", c: ["Prairie schooners", "Wind wagons", "Land frigates", "Dust ships"], a: 0 },
  ];

  const fmt$ = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const fmtLb = (n) => Math.round(n).toLocaleString("en-US") + " lb";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ---- Tiny synth SFX (no assets) ----
  let muted = false;
  try { muted = localStorage.getItem("hopcity_muted") === "1"; } catch (e) {}
  let audioCtx = null;
  function sfx(kind) {
    if (muted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      if (kind === "coin") {
        o.type = "triangle";
        o.frequency.setValueAtTime(880, t);
        o.frequency.setValueAtTime(1318, t + 0.08);
        g.gain.setValueAtTime(0.07, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        o.start(t); o.stop(t + 0.3);
      } else if (kind === "build") {
        o.type = "square";
        o.frequency.setValueAtTime(170, t);
        o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        o.start(t); o.stop(t + 0.18);
      } else if (kind === "bad") {
        o.type = "sawtooth";
        o.frequency.setValueAtTime(220, t);
        o.frequency.exponentialRampToValueAtTime(105, t + 0.22);
        g.gain.setValueAtTime(0.055, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o.start(t); o.stop(t + 0.27);
      } else {
        o.type = "sine";
        o.frequency.setValueAtTime(660, t);
        g.gain.setValueAtTime(0.04, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        o.start(t); o.stop(t + 0.1);
      }
    } catch (e) {}
  }


  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let state = null;
  let ui = { screen: "title", tool: "inspect", variety: "C", selectedTile: null, trainedThisSummer: false };
  let modalQueue = [];
  let stepQueue = [];
  let busy = false;
  let lastCash = 0;

  const TUT_SEEN_KEY = "hopcity_tutorial_seen";
  function showTutorial() {
    if (localStorage.getItem(TUT_SEEN_KEY)) return;
    document.getElementById("tutorial").classList.remove("hidden");
  }
  function dismissTutorial() {
    document.getElementById("tutorial").classList.add("hidden");
    localStorage.setItem(TUT_SEEN_KEY, "1");
  }

  // ---- Juice: cash tween, float text, season banner, rank-up ----
  let shownCash = 0;
  let cashRaf = null;
  function setCashAnimated(target) {
    const el = $("#hud-cash");
    if (Math.round(shownCash) === Math.round(target)) { el.textContent = fmt$(target); return; }
    if (cashRaf) cancelAnimationFrame(cashRaf);
    const from = shownCash, start = performance.now(), dur = 550;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      shownCash = from + (target - from) * e;
      el.textContent = fmt$(shownCash);
      if (t < 1) cashRaf = requestAnimationFrame(step);
      else { cashRaf = null; shownCash = target; el.textContent = fmt$(target); }
    };
    cashRaf = requestAnimationFrame(step);
  }

  function floatText(i, text, gain, big) {
    const col = document.querySelector(".board-col");
    if (!col) return;
    const colRect = col.getBoundingClientRect();
    let x = colRect.width / 2, y = colRect.height / 2;
    if (i != null) {
      const tile = col.querySelector('[data-i="' + i + '"]');
      if (tile) {
        const r = tile.getBoundingClientRect();
        x = r.left - colRect.left + r.width / 2;
        y = r.top - colRect.top + r.height / 2;
      }
    }
    const el = document.createElement("div");
    el.className = "float-txt " + (gain ? "gain" : "loss") + (big ? " big" : "");
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    col.appendChild(el);
    setTimeout(() => el.remove(), 1350);
  }

  function showBanner(main, sub) {
    document.querySelectorAll(".season-banner").forEach((b) => b.remove());
    sfx("tick");
    const el = document.createElement("div");
    el.className = "season-banner";
    el.innerHTML = main + (sub ? '<span class="sb-year">' + sub + "</span>" : "");
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1650);
  }

  function coinBurst(i) {
    const col = document.querySelector(".board-col");
    if (!col) return;
    const colRect = col.getBoundingClientRect();
    let x = colRect.width / 2, y = colRect.height / 2;
    if (i != null) {
      const tile = col.querySelector('[data-i="' + i + '"]');
      if (tile) {
        const r = tile.getBoundingClientRect();
        x = r.left - colRect.left + r.width / 2;
        y = r.top - colRect.top + r.height / 2;
      }
    }
    for (let k = 0; k < 9; k++) {
      const c = document.createElement("span");
      c.className = "coin";
      const ang = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 55;
      c.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      c.style.setProperty("--dy", (Math.sin(ang) * dist - 45) + "px");
      c.style.left = x + "px";
      c.style.top = y + "px";
      col.appendChild(c);
      setTimeout(() => c.remove(), 1100);
    }
  }

  function clearRangePreview() {
    document.querySelectorAll(".tile.in-range").forEach((el) => el.classList.remove("in-range"));
  }

  function previewWellRange(i) {
    clearRangePreview();
    if (ui.tool !== "well" || !tileEligible(i)) return;
    neighbors8(i).forEach((n) => {
      const el = document.querySelector('#farm-board [data-i="' + n + '"]');
      if (el) el.classList.add("in-range");
    });
  }

  function showRankup(title) {
    const box = document.getElementById("rankup");
    document.getElementById("rankup-title").textContent = title;
    box.classList.remove("hidden");
    sfx("coin");
  }

  function renderGoalTicks() {
    const t = $("#goal-ticks");
    if (!t || t.childElementCount) return;
    t.innerHTML = TITLES.filter(([m]) => m > 0 && m < KING_WORTH).map(([m, name]) =>
      '<span class="goal-tick" style="left:' + Math.min(100, (m / KING_WORTH) * 100) + '%" title="' + name + " · " + fmt$(m) + '"></span>'
    ).join("");
  }

  const REG = () => REGIONS.find((r) => r.id === state.regionId);

  function genTerrain(region) {
    const rnd = mulberry32(hashStr(region.id));
    const tiles = Array.from({ length: TILES_N }, (_, i) => ({
      t: "grass",
      b: null,
      alt: (Math.floor(i / BOARD_N) + (i % BOARD_N)) % 2 === 1,
    }));
    const spots = [];
    for (let i = 0; i < TILES_N; i++) if (i !== CENTER) spots.push(i);
    const take = (n) => {
      const out = [];
      for (let k = 0; k < n && spots.length; k++) out.push(spots.splice(Math.floor(rnd() * spots.length), 1)[0]);
      return out;
    };
    take(region.creeks).forEach((i) => (tiles[i].t = "creek"));
    take(region.forest).forEach((i) => (tiles[i].t = "forest"));
    take(region.rocks).forEach((i) => (tiles[i].t = "rock"));
    tiles[CENTER].t = "grass";
    tiles[CENTER].b = { type: "hq" };
    return tiles;
  }

  function newState(regionId, name) {
    return {
      v: 3,
      regionId,
      ranch: name || "Meeker & Sons",
      year: 1883,
      seasonIdx: 0,
      cash: 1500,
      tiles: genTerrain(REGIONS.find((r) => r.id === regionId)),
      contracts: [],
      market: { price: 0.58, lastPrice: 0.58, mod: 1, rep: 0, repPenalty: 0 },
      marketHist: [0.58],
      railPenalty: 0,
      laborShortfall: false,
      summerOrder: null,
      rivalPoach: 0,
      wageWar: false,
      poachedThisYear: false,
      storyBeat: 4 + Math.floor(Math.random() * 4),
      storyDone: false,
      landGrab: null,
      rivals: RIVALS_SEED.map((x) => ({ ...x, passed: false })),
      crownedRival: null,
      won: false,
      lost: false,
      lifetimeEarned: 0,
      totalLb: 0,
      lastTitle: "Squatter",
      log: [],
    };
  }

  function neighbors8(i) {
    const out = [];
    const x = i % BOARD_N, y = Math.floor(i / BOARD_N);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < BOARD_N && ny >= 0 && ny < BOARD_N) out.push(ny * BOARD_N + nx);
      }
    }
    return out;
  }

  const hasWaterSource = (i) => {
    const t = state.tiles[i];
    return t.t === "creek" || (t.b && t.b.type === "well");
  };
  const isYard = (i) => !!state.tiles[i].b && state.tiles[i].b.type === "yard";

  function isIrrigated(i) {
    if (!isYard(i)) return false;
    if (REG().rain >= 0.6) return true;
    if (state.tiles[i].b.wateredManual) return true;
    return neighbors8(i).some(hasWaterSource);
  }

  function yardStats(i) {
    const b = state.tiles[i].b;
    const v = VARIETIES[b.v];
    const matured = state.year - b.plantedYear >= 1 ? 1 : 0.68;
    return { v, matured, lb: 1000 * REG().yieldMul * v.yield * b.health * matured };
  }

  const countType = (type) => state.tiles.filter((t) => t.b && t.b.type === type).length;
  const assetTotal = () =>
    state.tiles.reduce((sum, t) => sum + (t.b ? ASSET_VALUE[t.b.type] || 0 : 0), 0);
  const netWorth = () => state.cash + assetTotal();
  const buildCost = (type) => Math.round(COSTS[type] * REG().costMul);
  const clearCostFor = (t) => Math.round(CLEAR_COST[t] * REG().costMul);

  function titleFor(worth) {
    let t = TITLES[0][1];
    for (const [min, name] of TITLES) if (worth >= min) t = name;
    return t;
  }

  function feed(msg, kind = "info") {
    state.log.unshift({ msg, kind });
    if (state.log.length > 30) state.log.length = 30;
  }

  function save() {
    if (!state) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.v === 3 && !s.lost ? s : null;
    } catch (e) { return null; }
  }
  function wipeSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach((s) => {
      s.classList.toggle("active", s.dataset.screen === name);
    });
    ui.screen = name;
  }

  function refreshContinue() {
    $("#btn-continue").classList.toggle("hidden", !loadSave());
  }

  const $ = (sel) => document.querySelector(sel);


  function showModal(spec) {
    modalQueue.push(spec);
    pumpModal();
  }
  function pumpModal() {
    const box = $("#modal");
    if (!box.classList.contains("hidden")) return;
    const spec = modalQueue.shift();
    if (!spec) return;
    $("#modal-eyebrow").textContent = spec.eyebrow || "Dispatch";
    $("#modal-title").textContent = spec.title || "";
    $("#modal-body").innerHTML = spec.body || "";
    const acts = $("#modal-actions");
    acts.innerHTML = "";
    (spec.choices || [{ label: "Carry on", kind: "primary" }]).forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn " + (c.kind || "");
      btn.innerHTML = c.sub ? c.label + '<span class="choice-sub">' + c.sub + "</span>" : c.label;
      btn.addEventListener("click", () => {
        box.classList.add("hidden");
        if (c.fn) c.fn();
        renderAll();
        save();
        pumpModal();
      });
      acts.appendChild(btn);
    });
    if (spec.onOpen) spec.onOpen(box);
    box.classList.remove("hidden");
  }

  function enqueue(...steps) {
    stepQueue.push(...steps);
    pumpSteps();
  }
  function pumpSteps() {
    if (busy) return;
    const step = stepQueue.shift();
    if (!step) { renderAll(); save(); return; }
    busy = true;
    step(() => { busy = false; pumpSteps(); });
  }

  function advance() {
    if (ui.screen !== "farm" || busy || modalQueue.length || !state || state.lost) return;
    const s = state.seasonIdx;
    if (s === 0) {
      enqueue(
        (done) => {
          state.seasonIdx = 1;
          ui.trainedThisSummer = false;
          summerGrowth();
          feed("Summer " + state.year + ": the bines are climbing.");
          showBanner("SUMMER", state.year);
          done();
        },
        (done) => maybeEvent("summer", done),
        checkEnd
      );
    } else if (s === 1) {
      enqueue(
        (done) => { state.seasonIdx = 2; showBanner("FALL", state.year + " · harvest"); done(); },
        (done) => maybeEvent("fall", done),
        harvest,
        checkEnd
      );
    } else if (s === 2) {
      enqueue(
        (done) => {
          state.seasonIdx = 3;
          resolveWinterNumbers();
          showBanner("WINTER", state.year + " · close the books");
          done();
        },
        almanacQuiz,
        winterModal,
        newYear,
        checkEnd
      );
    }
  }

  function summerGrowth() {
    const rainFed = REG().rain >= 0.6;
    for (let i = 0; i < TILES_N; i++) {
      if (!isYard(i)) continue;
      const b = state.tiles[i].b;
      b.health -= 0.06;
      if (isIrrigated(i)) b.health += 0.05;
      else if (!rainFed) b.health -= 0.22;
      b.wateredManual = false;
      b.health = clamp(b.health, 0.15, 1);
    }
  }

  function pickEvent(phase) {
    const r = REG();
    const pool = [];
    const add = (w, def) => pool.push({ w, def });
    if (phase === "summer") {
      if (r.rain >= 0.6) add(3, mildewEvent());
      add(r.rain < 0.45 ? 4 : 2, aphidEvent());
      add(1.5, hailEvent());
      add(0.8, kilnFireEvent());
    } else {
      add(2, boomEvent());
      add(2, bustEvent());
      add(2.2, laborShortEvent());
      add(1, meekerEvent());
      add(1.2, railEvent());
      add(1, englishBuyersEvent());
      add(1, neighborDebtEvent());
    }
    const total = pool.reduce((a, p) => a + p.w, 0);
    let roll = Math.random() * total;
    for (const p of pool) { roll -= p.w; if (roll <= 0) return p.def; }
    return pool[pool.length - 1].def;
  }

  function shuffleChoices(choices, answer) {
    const idx = choices.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return { choices: idx.map((i) => choices[i]), answer: idx.indexOf(answer) };
  }

  function almanacQuiz(done) {
    const t = TRIVIA_BANK[Math.floor(Math.random() * TRIVIA_BANK.length)];
    const s = shuffleChoices(t.c, t.a);
    showModal({
      eyebrow: "The Valley Clarion · Almanac Quiz " + state.year,
      title: "Question of the year",
      body: '<p class="copy">' + t.q + '</p><p class="tiny dim">The Clarion pays a $25 purse for a correct answer.</p>',
      choices: s.choices.map((c, i) => ({
        label: c,
        kind: "ghost",
        fn: () => {
          if (i === s.answer) {
            state.cash += 25;
            state.market.rep += 0.02;
            feed("Quiz won! The Clarion pays the purse: +$25.", "good");
            floatText(null, "+$25", true);
            sfx("coin");
            if (Math.random() < 0.35 && !state.wageWar) {
              const rv = state.rivals[Math.floor(Math.random() * state.rivals.length)];
              state.wageWar = true;
              feed(rv.name + " heard of your prize - expect wage demands this winter.", "bad");
            }
          } else {
            feed("Quiz lost - the answer was '" + t.c[t.a] + "'.", "info");
            sfx("bad");
          }
          done();
        },
      })),
    });
  }

  function maybeEvent(phase, done) {
    const spray = state.summerOrder === "spray";
    if (!state.storyDone && phase === "summer" && state.year >= (state.storyBeat || 99)) {
      storyEvent(done);
      return;
    }
    const summerChance = spray ? 0.28 : 0.55;
    if (Math.random() > (phase === "summer" ? summerChance : 0.5)) return done();
    const def = pickEvent(phase);
    feed(def.title, "event");
    if (def.choices) {
      const choices = def.choices.map((c) => ({
        label: c.label, sub: c.sub, kind: c.kind,
        fn: () => { c.fn(); if (c.result) feed(c.result, c.feedKind || "info"); done(); },
      }));
      showModal({
        eyebrow: cap(phase) + " " + state.year,
        title: def.title,
        body: '<p class="copy">' + def.copy + "</p>",
        choices,
      });
    } else {
      def.fn();
      if (def.outcome) feed(def.outcome, "event");
      done();
    }
  }

  const farmScale = () => 1 + countType("yard") / 20;

  function aphidEvent() {
    const spray = Math.round(180 * REG().costMul * farmScale());
    return {
      title: "Hop aphids ride the south wind",
      copy: "Grey-green lice massing under the leaves. Nicotine spray costs " + fmt$(spray) + ". Or gamble on ladybugs and a hot dry week.",
      choices: [
        { label: "Spray them dead", sub: "crop protected · costs " + fmt$(spray), kind: "primary",
          fn: () => { state.cash -= spray; }, result: "Aphids down. Bines stayed green.", feedKind: "good" },
        { label: "Trust the ladybugs", sub: "60% chance they chew in", kind: "ghost",
          fn: () => { if (Math.random() < 0.6) damageAllYards(0.2); }, result: "", feedKind: "bad" },
      ],
    };
  }

  function mildewEvent() {
    const spray = Math.round(220 * REG().costMul * farmScale());
    return {
      title: "Downy mildew spots the leaves",
      copy: "A humid week and the lower leaves show yellow. Bordeaux spray runs " + fmt$(spray) + "; ignoring it risks the whole block.",
      choices: [
        { label: "Copper and sulfur, boys", sub: "crop protected · costs " + fmt$(spray), kind: "primary",
          fn: () => { state.cash -= spray; }, result: "Mildew checked in time.", feedKind: "good" },
        { label: "Pray for a drying wind", sub: "65% chance of losing vigor everywhere", kind: "ghost",
          fn: () => { if (Math.random() < 0.65) damageAllYards(0.25); }, result: "", feedKind: "bad" },
      ],
    };
  }

  function hailEvent() {
    return {
      title: "Hail off the hills",
      copy: "Ten minutes of ice shredded leaves and stripped side arms across the yard.",
      choices: [
        { label: "Walk the rows, count the damage", sub: "-15% vigor everywhere", kind: "danger",
          fn: () => damageAllYards(0.15), result: "The bines will push back - some.", feedKind: "bad" },
      ],
    };
  }

  function kilnFireEvent() {
    const brigade = Math.round(120 * REG().costMul * farmScale());
    return {
      title: "Lamp fire in the kiln!",
      copy: "A draft knocked a lamp into the drying racks. A bucket line might save the house - " + fmt$(brigade) + " in damages and whiskey promised.",
      choices: [
        { label: "Form a bucket line", sub: "kiln saved · costs " + fmt$(brigade), kind: "primary",
          fn: () => { state.cash -= brigade; }, result: "Kiln scorched but standing.", feedKind: "good" },
        { label: "Let her burn, pull the men out", sub: "lose one kiln", kind: "danger",
          fn: () => loseKiln(), result: "One kiln gone to charcoal.", feedKind: "bad" },
      ],
    };
  }

  function boomEvent() {
    return {
      title: "London brewers scream for hops",
      copy: "Cables from the exchange: continental crops short, buyers bidding up Pacific bales sight unseen.",
      outcome: "Prices spike hard this market year.",
      fn: () => { state.market.mod = Math.max(state.market.mod, 1.38); },
    };
  }

  function bustEvent() {
    return {
      title: "Eastern warehouses overflow",
      copy: "Too many acres went in two seasons back. Eastern speculators are dumping bales below cost.",
      outcome: "Prices sag across the board.",
      fn: () => { state.market.mod = Math.min(state.market.mod, 0.72); },
    };
  }


  function laborShortEvent() {
    const cabins = countType("cabin");
    const bonus = cabins * 30;
    if (cabins === 0 || state.cash < bonus) {
      return {
        title: "Picker trains running light",
        copy: "The coast crews found orchard work instead. You'll pick shorthanded and leave hops on the vines.",
        outcome: "Harvest hands cut to 55%.",
        fn: () => { state.laborShortfall = true; },
      };
    }
    return {
      title: "Picker trains running light",
      copy: "The crews that usually come down from the coast found orchard work. Hold your hands with a bonus, or pick shorthanded.",
      choices: [
        { label: "Pay the picking bonus", sub: "-" + fmt$(bonus).slice(1).replace("$", "") + " full crews · costs " + fmt$(bonus), kind: "primary",
          fn: () => { state.cash -= bonus; }, result: "Hands stayed for the bonus.", feedKind: "good" },
        { label: "Pick shorthanded", sub: "harvest capacity cut to 55%", kind: "ghost",
          fn: () => { state.laborShortfall = true; }, result: "", feedKind: "bad" },
      ],
    };
  }

  function meekerEvent() {
    return {
      title: "Ezra Meeker tips his hat at the fair",
      copy: "The old Hop King judged your sample bales 'the finest color in the territory' - and told half of Portland about it.",
      outcome: "Buyers pay a premium at this fall's scale.",
      fn: () => { state.market.rep += 0.09; },
    };
  }

  function englishBuyersEvent() {
    return {
      title: "London buyers tour the valley",
      copy: "Two agents from Burton-on-Trent walk the rows, pocketing cone samples and saying little. They ask after your kilns by name.",
      outcome: "English interest steadies prices.",
      fn: () => { state.market.mod = Math.max(state.market.mod, 1.08); },
    };
  }

  function neighborDebtEvent() {
    const aid = 60;
    if (state.cash < aid) {
      return {
        title: "A neighbor grower ruined",
        copy: "Judkins next door can't cover his seed debt. You haven't the cash to help - his poles go up for sale by autumn.",
        outcome: "Nothing to be done. The valley notes it.",
        fn: () => { state.market.repPenalty = Math.min(state.market.repPenalty + 0.01, 0.05); },
      };
    }
    return {
      title: "A neighbor grower ruined",
      copy: "Phineas Judkins can't cover his seed note. Forgive part of it and the valley will talk kindly of you - or squeeze him dry while you can.",
      choices: [
        { label: "Forgive half his debt", sub: "-" + fmt$(aid) + " · buyers remember kindness", kind: "primary",
          fn: () => { state.cash -= aid; state.market.rep += 0.06; },
          result: "Meeker himself once forgave near $100,000 in bust years. Good company.", feedKind: "gold" },
        { label: "Collect what's owed", sub: "+" + fmt$(40) + " · hard feelings", kind: "danger",
          fn: () => { state.cash += 40; state.market.repPenalty = Math.min(state.market.repPenalty + 0.02, 0.06); },
          result: "Paid in full. The valley keeps count.", feedKind: "bad" },
      ],
    };
  }

  function railEvent() {
    return {
      title: "Railroad raises hop tariffs",
      copy: "The Northern Pacific quietly bumped freight rates on agricultural bales.",
      outcome: "Hauling fees up 6% for one year.",
      fn: () => { state.railPenalty = 0.06; },
    };
  }

  // --- Once-per-game story beat (fires summer of year 4-7) ---
  function storyEvent(done) {
    state.storyDone = true;
    const pool = [];
    if (countType("kiln") > 0) pool.push(kilnStrikeEvent);
    pool.push(marketCraterEvent, foremanEvent);
    const def = pool[Math.floor(Math.random() * pool.length)]();
    feed(def.title, "event");
    const choices = def.choices
      ? def.choices.map((c) => ({
          label: c.label, sub: c.sub, kind: c.kind,
          fn: () => { c.fn(); if (c.result) feed(c.result, c.feedKind || "info"); done(); },
        }))
      : [{ label: "Weather it", kind: "primary",
          fn: () => { if (def.fn) def.fn(); if (def.outcome) feed(def.outcome, "event"); done(); } }];
    showModal({
      eyebrow: "DISPATCH · " + SEASONS[state.seasonIdx] + " " + state.year,
      title: def.title,
      body: '<p class="copy">' + def.copy + "</p>",
      choices,
    });
  }

  function kilnStrikeEvent() {
    const rebuild = Math.round(300 * REG().costMul);
    return {
      title: "Lightning takes the kiln",
      copy: "A dry storm rolled over the ridge at dusk and took your newest kiln with it. The men stand around smelling char.",
      choices: [
        { label: "Rebuild at once", sub: "-" + fmt$(rebuild) + " · kiln back before harvest", kind: "primary",
          fn: () => { state.cash -= rebuild; }, result: "Fresh-mortared and firing by morning.", feedKind: "good" },
        { label: "Let it lie", sub: "one kiln gone for this fall", kind: "danger",
          fn: () => loseKiln(), result: "One kiln gone to charcoal.", feedKind: "bad" },
      ],
    };
  }

  function marketCraterEvent() {
    return {
      title: "The bottom drops out",
      copy: "Two giant Eastern crops came in at once, and the cables say buyers are walking away from Pacific bales entirely.",
      outcome: "Prices crater for a full market year.",
      fn: () => { state.market.mod = 0.55; },
    };
  }

  function foremanEvent() {
    const chase = Math.round(120 * REG().costMul);
    const payroll = Math.round(250 * REG().costMul * (1 + countType("yard") / 20));
    return {
      title: "Your foreman ran off with the payroll",
      copy: "Took the book money and the schoolteacher's daughter clear to Tacoma. The crews stand in the road, arms crossed, waiting to be paid.",
      choices: [
        { label: "Ride after him", sub: "-" + fmt$(chase) + " · payroll recovered", kind: "primary",
          fn: () => { state.cash -= chase; }, result: "Dragged him back by his collar. Crews paid full.", feedKind: "good" },
        { label: "Let him keep it", sub: "-" + fmt$(payroll) + " · vigor suffers", kind: "danger",
          fn: () => { state.cash -= payroll; damageAllYards(0.08); }, result: "Paid from your own pocket. A sour summer.", feedKind: "bad" },
      ],
    };
  }

  function damageAllYards(amount) {
    if (state.summerOrder === "spray") amount *= 0.5;
    for (let i = 0; i < TILES_N; i++) {
      if (isYard(i)) state.tiles[i].b.health = clamp(state.tiles[i].b.health - amount, 0.15, 1);
    }
  }

  function loseKiln() {
    if (state.summerOrder === "spray") {
      feed("The spray crew beat the flames out - kiln scorched but standing.", "good");
      return;
    }
    for (let i = 0; i < TILES_N; i++) {
      if (state.tiles[i].b && state.tiles[i].b.type === "kiln") {
        state.tiles[i].b = null;
        return;
      }
    }
  }

  const WET_CAP = 2000;
  const floodFactor = (marketable) => 1 - clamp(marketable / 40000, 0, 0.35);

  function projectHarvest() {
    const r = REG();
    const mkt = state.market;
    const yards = [];
    for (let i = 0; i < TILES_N; i++) if (isYard(i)) yards.push(i);
    if (!yards.length) return 0;
    let picked = 0, healthSum = 0, varPriceSum = 0;
    yards.forEach((i) => {
      const st = yardStats(i);
      picked += st.lb;
      healthSum += state.tiles[i].b.health;
      varPriceSum += st.v.price;
    });
    const avgHealth = healthSum / yards.length;
    const avgVarPrice = varPriceSum / yards.length;
    const kilnCap = countType("kiln") * 7000;
    const processed = Math.min(picked, kilnCap);
    const undried = picked - processed;
    const wetSold = Math.min(undried, WET_CAP);
    const laborCap = countType("cabin") * 6 + (state.summerOrder === "hands" ? 3 : 0);
    const covered = Math.min(yards.length, laborCap);
    const shortFrac = (yards.length - covered) / yards.length;
    const laborLoss = processed * shortFrac * 0.35;
    const marketable = Math.max(0, processed - laborLoss);
    const spot =
      mkt.price * mkt.mod * r.priceMul * avgVarPrice *
      (avgHealth * 0.5 + 0.5) * (1 + mkt.rep) * (1 - mkt.repPenalty) * (1 - (state.rivalPoach || 0)) *
      floodFactor(marketable);
    let left = marketable;
    let contractRev = 0, contractLbs = 0;
    for (const c of state.contracts) {
      const use = Math.min(c.lbs, left);
      contractRev += use * c.price;
      contractLbs += use;
      left -= use;
    }
    const rev = contractRev + (marketable - contractLbs) * spot;
    const wetRev = wetSold > 0 ? wetSold * spot * 0.18 : 0;
    const gross = rev + wetRev;
    const feeRate = r.fee + state.railPenalty;
    return gross * (1 - feeRate);
  }

  function harvest(done) {
    const r = REG();
    const mkt = state.market;
    const yards = [];
    for (let i = 0; i < TILES_N; i++) if (isYard(i)) yards.push(i);

    if (!yards.length) {
      feed("Nothing planted, nothing picked.", "bad");
      done();
      return;
    }

    let picked = 0, healthSum = 0, varPriceSum = 0;
    yards.forEach((i) => {
      const st = yardStats(i);
      picked += st.lb;
      healthSum += state.tiles[i].b.health;
      varPriceSum += st.v.price;
    });
    const avgHealth = healthSum / yards.length;
    const avgVarPrice = varPriceSum / yards.length;

    const kilnCap = countType("kiln") * 7000;
    const processed = Math.min(picked, kilnCap);
    const undried = picked - processed;
    const wetSold = Math.min(undried, WET_CAP);
    const spoiled = undried - wetSold;

    const laborCap = (countType("cabin") * 6 + (state.summerOrder === "hands" ? 3 : 0)) *
      (state.laborShortfall ? 0.55 : 1);
    const covered = Math.min(yards.length, laborCap);
    const shortFrac = (yards.length - covered) / yards.length;
    const laborLoss = processed * shortFrac * 0.35;
    const marketable = Math.max(0, processed - laborLoss);

    const spot =
      mkt.price * mkt.mod * r.priceMul * avgVarPrice *
      (avgHealth * 0.5 + 0.5) * (1 + mkt.rep) * (1 - mkt.repPenalty) * (1 - (state.rivalPoach || 0)) *
      floodFactor(marketable);

    let left = marketable;
    let contractLbs = 0, contractRev = 0;
    for (const c of state.contracts) {
      const use = Math.min(c.lbs, left);
      contractRev += use * c.price;
      contractLbs += use;
      left -= use;
    }
    const contractedTotal = state.contracts.reduce((a, c) => a + c.lbs, 0);
    const breached = Math.max(0, contractedTotal - contractLbs);
    state.contracts = [];

    const spotLbs = marketable - contractLbs;
    const spotRev = spotLbs * spot;
    const wetRev = wetSold > 0 ? wetSold * spot * 0.18 : 0;
    const gross = contractRev + spotRev + wetRev;
    const feeRate = r.fee + state.railPenalty;
    const hauling = gross * feeRate;
    const net = gross - hauling;

    state.cash += net;
    state.lifetimeEarned += gross;
    state.totalLb += marketable + wetSold;
    state.laborShortfall = false;
    mkt.repPenalty = 0;
    mkt.rep *= 0.25;
    floatText(null, (net >= 0 ? "+" : "-") + fmt$(Math.abs(net)), net >= 0, true);
    if (net > 0) { coinBurst(null); sfx("coin"); } else { sfx("bad"); }
    state.rivalPoach = 0;
    state.summerOrder = null;
    if (spoiled > 0) {
      state.market.rep = Math.max(-0.1, state.market.rep - 0.04);
      feed("Spoiled " + fmtLb(spoiled) + " wet - buyers remember. Reputation dented.", "bad");
    }

    if (breached > 0) {
      mkt.repPenalty = 0.08;
      feed("Shorted contracts by " + fmtLb(breached) + " - buyers remember.", "bad");
    }
    feed("Harvested " + fmtLb(marketable) + " for " + fmt$(net) + ".", net > 0 ? "good" : "bad");
    if (clamp(marketable / 40000, 0, 1) > 0.15) feed("So many of your bales hit the market that buyers paid less - flood penalty.", "bad");
    if (covered < yards.length) feed("Left " + (yards.length - covered) + " acres unpicked - no cabin hands.", "bad");

    showModal({
      eyebrow: "Fall " + state.year,
      title: net >= 0 ? "Harvest in" : "Tough season",
      body:
        '<p class="copy"><b>' + fmtLb(marketable) + " dried & sold</b></p>" +
        (spoiled > 0 ? '<p class="copy" style="color:var(--danger)">Spoiled: ' + fmtLb(spoiled) + " - build kilns!</p>" : "") +
        '<p class="copy">' + (contractLbs > 0 ? "Contract: " + fmtLb(contractLbs) + " @ $" + (contractRev / contractLbs).toFixed(2) + "/lb · " : "") +
        (spotLbs > 0 ? "Spot: " + fmtLb(spotLbs) + " @ $" + spot.toFixed(2) + "/lb · " : "") +
        "Hauling: -" + fmt$(hauling) + '</p>' +
        '<p class="copy" style="font-size:1.15em;margin-top:8px;"><b>Net: ' + (net >= 0 ? "+" : "") + fmt$(net) + "</b></p>",
      choices: [{ label: "Bank it", kind: "primary", fn: () => done() }],
    });
  }


  function resolveWinterNumbers() {
    const r = REG();
    const yards = countType("yard");
    const others = countType("well") + countType("kiln") + countType("cabin");
    let upkeep = Math.round(40 + yards * 8 * r.costMul + others * 18 * r.costMul);
    if (state.wageWar) {
      upkeep += 45;
      feed("Wages bid up across the valley: +" + fmt$(45) + " upkeep.", "bad");
      state.wageWar = false;
    }
    state.cash -= upkeep;
    feed("Winter upkeep: wages, twine, tarps - " + fmt$(upkeep) + ".", "bad");

    const m = state.market;
    m.lastPrice = m.price;
    m.price = clamp(m.price + (Math.random() - 0.47) * 0.09, 0.34, 1.15);
    m.mod += (1 - m.mod) * 0.5;
    const up = m.price >= m.lastPrice;
    feed(
      "Winter market wire: hops at $" + m.price.toFixed(2) + "/lb and " + (up ? "climbing." : "sliding."),
      up ? "good" : "bad"
    );
    state.marketHist.push(m.price);
    if (state.marketHist.length > 12) state.marketHist.shift();

    const worth = netWorth();
    if (!state.landGrab && worth >= 12000) {
      const rv = state.rivals.reduce((a, b) => (a.worth >= b.worth ? a : b));
      state.landGrab = rv.name;
      rv.grab = 2;
      rv.worth = Math.round(rv.worth * 1.5);
      feed(rv.name + " just bought half the valley on credit - he's making a run at the crown!", "gold");
    }
    state.rivals.forEach((rv) => {
      if (!rv.passed && worth > rv.worth && rv.worth > 0) {
        rv.passed = true;
        feed(rv.name + " tips his hat through gritted teeth - you are the richer grower now.", "gold");
        state.market.mod = Math.max(0.6, state.market.mod - 0.05);
      }
      const early = worth < KING_WORTH * 0.4;
      const chased = worth > rv.worth * 1.5;
      let g = early ? 0.12 + Math.random() * 0.1 : 0.07 + Math.random() * 0.09;
      if (chased) g = 0.1 + Math.random() * 0.1;
      if (rv.grab > 0) { g = 0.25; rv.grab--; }
      rv.worth = Math.round(rv.worth * (1 + g));
      if (!state.crownedRival && rv.worth >= RIVAL_KING) {
        state.crownedRival = rv.name;
        feed(rv.name + " was crowned Hop King! Pass " + fmt$(RIVAL_KING) + " to steal the crown.", "gold");
      }
    });
  }

  function projectMarketableLb(nextYear) {
    const yards = [];
    for (let i = 0; i < TILES_N; i++) if (isYard(i)) yards.push(i);
    if (!yards.length) return 0;
    let picked = 0;
    yards.forEach((i) => {
      const b = state.tiles[i].b;
      const v = VARIETIES[b.v];
      const matured = (state.year + (nextYear ? 1 : 0)) - b.plantedYear >= 1 ? 1 : 0.68;
      picked += 1000 * REG().yieldMul * v.yield * b.health * matured;
    });
    const kilnCap = countType("kiln") * 7000;
    const processed = Math.min(picked, kilnCap);
    const laborCap = countType("cabin") * 6 + (state.summerOrder === "hands" ? 3 : 0);
    const covered = Math.min(yards.length, laborCap);
    const shortFrac = (yards.length - covered) / yards.length;
    const laborLoss = processed * shortFrac * 0.35;
    return Math.max(0, processed - laborLoss);
  }

  function winterModal(done) {
    const exp = Math.max(2000, countType("yard") * 950);
    const mkOffer = (frac, adj) => ({
      lbs: Math.max(200, Math.round((exp * frac) / 50) * 50),
      price: +(state.market.price * (1 + adj)).toFixed(2),
      adj,
    });
    const offers = [mkOffer(0.35, -0.06), mkOffer(0.55, 0.12)];
    const proj = projectMarketableLb(true);
    const already = state.contracts.reduce((a, c) => a + c.lbs, 0);
    const projLine =
      '<p class="copy dim" style="font-size:.8rem;margin:2px 0 8px;">Projected harvest: <b style="color:var(--cream)">~' + fmtLb(proj) +
      "</b> · already contracted: <b style=\"color:var(--cream)\">" + fmtLb(already) + "</b></p>";
    const hist = (state.marketHist || []).slice(-8);
    let spark = "";
    if (hist.length >= 2) {
      const w = 200, h = 36, pad = 3;
      const min = Math.min(...hist), max = Math.max(...hist);
      const pts = hist.map((p, i) => {
        const x = pad + i * ((w - 2 * pad) / (hist.length - 1));
        const y = h - pad - ((p - min) / ((max - min) || 1)) * (h - 2 * pad);
        return x.toFixed(1) + "," + y.toFixed(1);
      }).join(" ");
      spark =
        '<div class="spark-wrap"><span class="hud-label">Market, past years ($/lb)</span>' +
        '<svg class="spark" width="' + w + '" height="' + h + '"><polyline points="' + pts +
        '" fill="none" stroke="#d4a843" stroke-width="2"/></svg></div>';
    }
    const body =
      '<p class="copy dim">Lock a price for next year — or gamble on the spot market.</p>' +
      projLine +
      spark +
      offers
        .map((o, idx) => {
          const over = already + o.lbs - proj;
          return (
            '<div class="offer"><div class="offer-head"><span>' + fmtLb(o.lbs) + "</span>" +
            '<span class="offer-price">$' + o.price.toFixed(2) + "/lb</span></div>" +
            '<div class="offer-sub">' + (o.adj >= 0 ? "+" : "") + Math.round(o.adj * 100) + "% vs today" +
            (over > 0 ? ' · <b style="color:#e07070">overcommits ' + fmtLb(over) + "</b>" : "") + "</div>" +
            '<button class="btn primary compact" data-offer="' + idx + '" type="button">Sign</button></div>'
          );
        })
        .join("");

    showModal({
      eyebrow: "Winter " + state.year,
      title: "Contract offers",
      body,
      choices: [{ label: "Into spring", kind: "primary", fn: () => done() }],
      onOpen: (box) => {
        box.querySelectorAll("[data-offer]").forEach((btn) => {
          btn.addEventListener("click", () => {
            if (btn.disabled) return;
            const o = offers[+btn.dataset.offer];
            state.contracts.push({ lbs: o.lbs, price: o.price });
            btn.disabled = true;
            btn.textContent = "Signed";
            sfx("coin");
            feed("Signed: " + fmtLb(o.lbs) + " @ $" + o.price.toFixed(2) + "/lb.", "gold");
            if (+btn.dataset.offer === 1 && !state.poachedThisYear && Math.random() < 0.2) {
              state.poachedThisYear = true;
              state.rivalPoach = 0.08;
              const rv = state.rivals[Math.floor(Math.random() * state.rivals.length)];
              feed(rv.name + " heard about that contract - he wooed one of your buyers. Spot suffers 8% this fall.", "bad");
              sfx("bad");
            }
          });
        });
      },
    });
  }

  function newYear(done) {
    state.year += 1;
    state.seasonIdx = 0;
    state.railPenalty = 0;
    state.summerOrder = null;
    state.poachedThisYear = false;
    ui.selectedTile = null;
    feed("Spring " + state.year + " - the valley wakes up.", "event");
    const lore = LORE_ALMANAC[Math.floor(Math.random() * LORE_ALMANAC.length)];
    feed("Almanac: " + lore, "event");
    showBanner("SPRING", state.year + " · new year");
    done();
  }

  function checkEnd(done) {
    const worth = netWorth();
    if (state.cash < BROKE_LINE && !state.lost) {
      state.lost = true;
      wipeSave();
      showModal({
        eyebrow: "Spring comes without you",
        title: "Foreclosure",
        body:
          '<p class="copy">The bank called the note over the winter. The kilns are auctioned, the poles pulled, and the land goes to a Spokane mining man who thinks hops are a vegetable.</p>' +
          "<p class=\"copy\"><b>Lifetime earnings: " + fmt$(state.lifetimeEarned) + " over " + (state.year - 1883) + " years.</b></p>",
        choices: [{
          label: "Dust off, start over",
          kind: "primary",
          fn: () => { state = null; showScreen("title"); refreshContinue(); done(); },
        }],
      });
      return;
    }
    if (!state.won && worth >= KING_WORTH) {
      state.won = true;
      showModal({
        eyebrow: "Territorial Fair · " + state.year,
        title: "HOP KING OF THE WORLD",
        body:
          '<p class="copy">They hang a crown of bines over the courthouse door in your name. Your bales set the territory price, and the brokers stand when you walk in.</p>' +
          '<p class="copy dim">Talk in town says Meeker means to raise a grand house on Spring Street someday. Perhaps you will build one finer.</p>' +
          '<table class="report-table">' +
          "<tr><td>Ranch</td><td>" + state.ranch + "</td></tr>" +
          "<tr><td>Region</td><td>" + REG().name + ", " + REG().st + "</td></tr>" +
          "<tr><td>Years on the land</td><td>" + (state.year - 1883 + 1) + "</td></tr>" +
          "<tr><td>Hops shipped</td><td>" + fmtLb(state.totalLb) + "</td></tr>" +
          '<tr class="total"><td>Net worth</td><td>' + fmt$(worth) + "</td></tr></table>",
        choices: [
          { label: "Keep ruling the valley", kind: "primary", fn: () => done() },
          {
            label: "Retire a legend - new empire",
            kind: "gold",
            fn: () => { wipeSave(); state = null; showScreen("title"); refreshContinue(); goClaim(); },
          },
        ],
      });
      return;
    }
    done();
  }


  const ICON_FOR = { hq: "i-hq", yard: "i-pole", well: "i-well", kiln: "i-kiln", cabin: "i-cabin" };

  const SPRITES = {
    yard:
      '<svg class="spr spr-yard" viewBox="0 0 24 24">' +
      '<g stroke="#5a4a30" stroke-width="1.5" stroke-linecap="round">' +
      '<path d="M7 21V7"/><path d="M12 21V4"/><path d="M17 21V7"/></g>' +
      '<g class="vines" stroke="#42602a" stroke-width="1" fill="none">' +
      '<path d="M7 18c2-1 2-3 0-4M7 13c2-1 2-3 0-4"/>' +
      '<path d="M12 16c2.4-1.2 2.4-3.6 0-5M12 10c2.4-1.2 2.4-3.6 0-5"/>' +
      '<path d="M17 18c-2-1-2-3 0-4M17 13c-2-1-2-3 0-4"/></g>' +
      '<g class="cones">' +
      '<ellipse cx="6.4" cy="15" rx="1.5" ry="2.2"/><ellipse cx="7.8" cy="10.5" rx="1.3" ry="1.9"/>' +
      '<ellipse cx="11.3" cy="13" rx="1.6" ry="2.4"/><ellipse cx="12.8" cy="7.5" rx="1.4" ry="2"/>' +
      '<ellipse cx="16.4" cy="15" rx="1.5" ry="2.2"/><ellipse cx="17.8" cy="10.5" rx="1.3" ry="1.9"/></g></svg>',
    kiln:
      '<svg class="spr" viewBox="0 0 24 24">' +
      '<path d="M7 21v-7.5L12 9l5 4.5V21z" fill="#8a5a34" stroke="#241408" stroke-width="1"/>' +
      '<path class="roof" d="M5.6 13.8L12 8l6.4 5.8" fill="none" stroke="#5a3a1e" stroke-width="2.4" stroke-linecap="round"/>' +
      '<rect x="10.4" y="16.5" width="3.2" height="4.5" rx=".6" fill="#241408"/>' +
      '<rect x="15.1" y="15.5" width="1.6" height="2.4" fill="#241408"/></svg>' +
      '<span class="smoke"><i></i><i></i><i></i></span>',
    cabin:
      '<svg class="spr" viewBox="0 0 24 24">' +
      '<path d="M6 21v-6.5h12V21z" fill="#7a5c38" stroke="#241a0c" stroke-width="1"/>' +
      '<path class="roof" d="M4.5 14.5L12 8l7.5 6.5z" fill="#5a4028" stroke="#241a0c" stroke-width="1"/>' +
      '<rect class="glow" x="8" y="16.2" width="3" height="3" rx=".4" fill="#e8b84a"/>' +
      '<rect x="13.6" y="16.2" width="2.6" height="4.8" rx=".4" fill="#3a2814"/></svg>',
    well:
      '<svg class="spr" viewBox="0 0 24 24">' +
      '<ellipse cx="12" cy="18.5" rx="6" ry="2.4" fill="#6a6258" stroke="#241c14" stroke-width="1"/>' +
      '<ellipse cx="12" cy="18" rx="3.6" ry="1.4" fill="#1e4a66"/>' +
      '<path d="M7.5 18V9M16.5 18V9" stroke="#5a4028" stroke-width="1.6"/>' +
      '<path class="roof" d="M6 9.5L12 4.5l6 5" fill="none" stroke="#5a4028" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M12 5.5v6" stroke="#5a4028" stroke-width=".8"/>' +
      '<rect x="10.8" y="11" width="2.4" height="2" fill="#4a3418"/></svg>',
    hq:
      '<svg class="spr" viewBox="0 0 24 24">' +
      '<path d="M5.5 21v-8L12 8l6.5 5v8z" fill="#4a5c48" stroke="#141c12" stroke-width="1"/>' +
      '<path class="roof" d="M4 13.5L12 6.5l8 7" fill="none" stroke="#2c2418" stroke-width="2.6" stroke-linecap="round"/>' +
      '<rect class="glow" x="9" y="14.5" width="2.6" height="2.6" fill="#e8b84a"/>' +
      '<rect x="13.4" y="16" width="2.8" height="5" fill="#2c2010"/>' +
      '<path d="M12 6.5V3.2" stroke="#2c2418" stroke-width="1"/>' +
      '<path class="flag" d="M12 3.2h3.6l-1 1.2 1 1.2H12z" fill="#b85c38"/></svg>',
    forest:
      '<svg class="spr spr-forest" viewBox="0 0 24 24">' +
      '<g class="tree">' +
      '<path d="M5.5 8L7.4 12L6.5 12L8.3 16.5L2.7 16.5L4.5 12L3.6 12Z"/><rect x="4.9" y="16.5" width="1.2" height="2.8"/>' +
      '<path d="M11 4L13.8 10L12.4 10L15 16.5L7 16.5L9.6 10L8.2 10Z"/><rect x="10.3" y="16.5" width="1.4" height="3"/>' +
      '<path d="M17.5 6.5L19.6 11.5L18.6 11.5L20.8 17L14.2 17L16.4 11.5L15.4 11.5Z"/><rect x="16.9" y="17" width="1.2" height="2.6"/>' +
      "</g></svg>",
  };
  const SEASON_TIPS = [
    "Spring: plant near water - every acre pays this fall",
    "Summer: train the bines - keep them watered",
    "Fall: kilns dry - cabins pick - money moves",
    "Winter: upkeep due - sign next year's contracts",
  ];
  const svgIcon = (name) => '<svg><use href="#' + name + '"/></svg>';

  function renderAll() {
    if (!state) return;
    renderHUD();
    renderBoard();
    updateToolActive();
    renderVarietyRow();
    renderActions();
    renderRivals();
    renderFeed();
    renderTileInfo(ui.selectedTile);
    $("#btn-advance").textContent = ADVANCE_LABELS[SEASONS[state.seasonIdx]];
    $("#dock-step").textContent = SEASON_TIPS[state.seasonIdx];
  }

  function renderHUD() {
    const worth = netWorth();
    const m = state.market;
    $("#hud-ranch").textContent = state.ranch;
    const title = titleFor(worth);
    if (title !== state.lastTitle) {
      feed("The territory knows your name now: " + title + ".", "gold");
      if (title !== "Squatter" && title !== "Hop King") showRankup(title);
      state.lastTitle = title;
    }
    const badge = $("#hud-title");
    badge.textContent = title;
    badge.classList.toggle("crown", state.won || title === "Hop King");
    const cashEl = $("#hud-cash");
    const cashBlock = cashEl.parentElement;
    setCashAnimated(state.cash);
    cashEl.classList.toggle("bad", state.cash < 0);
    cashEl.classList.toggle("good", state.cash >= 0);
    if (state.cash !== lastCash) {
      cashBlock.classList.remove("flash-good", "flash-bad");
      void cashBlock.offsetWidth;
      cashBlock.classList.add(state.cash > lastCash ? "flash-good" : "flash-bad");
      lastCash = state.cash;
    }
    $("#hud-worth").textContent = fmt$(worth);
    const pct = clamp(worth / KING_WORTH, 0, 1) * 100;
    const fill = $("#goal-fill");
    fill.style.width = pct + "%";
    fill.classList.toggle("full", worth >= KING_WORTH);
    $("#goal-worth").textContent = fmt$(worth) + " / " + fmt$(KING_WORTH);
    renderGoalTicks();
    $("#hud-proj").textContent = "~" + fmt$(Math.max(0, projectHarvest()));
    const up = m.price >= m.lastPrice;
    $("#hud-market").innerHTML =
      "$" + m.price.toFixed(2) +
      '<span class="' + (up ? "up" : "down") + '">' + (up ? " +" : " -") + "</span>";
    $("#hud-season").textContent = SEASONS[state.seasonIdx];
    const seasonChip = $("#hud-season");
    const seasonColors = ["#7ab87a", "#d4a843", "#b85c38", "#6b9eb8"];
    seasonChip.style.background = seasonColors[state.seasonIdx];
    $("#hud-year").textContent = state.year;
    $("#season-dots").innerHTML = SEASONS.map((s, idx) => {
      let c = "s-dot";
      if (idx === state.seasonIdx) c += " on";
      else if (idx < state.seasonIdx) c += " done";
      return '<span class="' + c + '" title="' + s + '"></span>';
    }).join("");
  }

  function tileEligible(i) {
    const t = state.tiles[i];
    switch (ui.tool) {
      case "yard": case "well": case "kiln": case "cabin":
        return t.t === "grass" && !t.b;
      case "clear":
        return t.t === "rock" || t.t === "forest";
      case "demolish":
        return !!t.b && t.b.type !== "hq";
      default:
        return true;
    }
  }

  function renderBoard() {
    let html = "";
    const dryRegion = REG().rain < 0.6;
    const boardEl = $("#farm-board");
    if (boardEl.parentElement) boardEl.parentElement.setAttribute("data-season", state.seasonIdx);
    const sky = document.getElementById("sky");
    if (sky) sky.className = "sky sky-hop s" + state.seasonIdx;
    for (let i = 0; i < TILES_N; i++) {
      const t = state.tiles[i];
      let cls = "tile t-" + t.t + (t.alt ? " alt" : "");
      let inner = "";
      if (t.b) {
        cls += " b-" + t.b.type;
        if (t.b.type === "yard") inner += SPRITES.yard.replace("spr-yard", "spr-yard v-" + t.b.v);
        else inner += SPRITES[t.b.type] || "";
      } else if (t.t === "forest") inner += SPRITES.forest;
      if (isYard(i)) {
        const h = t.b.health;
        cls += h >= 0.7 ? " h-ok" : h >= 0.45 ? " h-mid" : " h-low";
        if (state.year - t.b.plantedYear < 1) cls += " young";
        if (dryRegion) cls += isIrrigated(i) ? " irrigated" : " thirsty";
        inner += '<span class="vtag">' + t.b.v + "</span>";
      }
      if (ui.selectedTile === i) cls += " selected-tile";
      if (tileEligible(i)) cls += " can-build";
      html += '<button type="button" data-i="' + i + '" class="' + cls + '">' + inner + "</button>";
    }
    boardEl.innerHTML = html;
    if (ui.selectedTile != null) {
      const st = state.tiles[ui.selectedTile];
      if (st.b && st.b.type === "well") {
        neighbors8(ui.selectedTile).forEach((n) => {
          const el = boardEl.querySelector('[data-i="' + n + '"]');
          if (el) el.classList.add("well-zone");
        });
      }
    }
  }

  function renderToolsStatic() {
    $("#tool-list").innerHTML = TOOLS.map((t) => {
      const cost = t.cost ? "$" + Math.round(t.cost * REG().costMul) : "";
      return (
        '<button type="button" class="tool-btn" data-tool="' + t.id + '">' +
        svgIcon(t.icon) +
        '<span class="tool-name">' + t.name + "</span>" +
        '<span class="tool-cost">' + cost + "</span>" +
        '<span class="tool-desc">' + t.desc + "</span></button>"
      );
    }).join("");
    document.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.addEventListener("click", () => {
        ui.tool = btn.dataset.tool;
        ui.selectedTile = null;
        renderAll();
      });
    });
  }

  function updateToolActive() {
    document.querySelectorAll("[data-tool]").forEach((b) => {
      b.classList.toggle("active", b.dataset.tool === ui.tool);
    });
  }

  function renderVarietyRow() {
    $("#variety-row").classList.toggle("hidden", ui.tool !== "yard");
    document.querySelectorAll("[data-var]").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.var === ui.variety);
    });
  }


  function thirstyCount() {
    if (REG().rain >= 0.6) return 0;
    let n = 0;
    for (let i = 0; i < TILES_N; i++) if (isYard(i) && !isIrrigated(i)) n++;
    return n;
  }

  function renderActions() {
    const body = $("#action-body");
    const s = state.seasonIdx;
    $("#action-title").textContent = SEASONS[s] + " jobs";
    if (s !== 1) {
      const hint =
        ["Plant yards now - first-year bines yield 68%, mature acres pay full.",
         "",
         "Harvest is automatic. Kilns dry 7,000 lb each; cabins pick 6 acres each.",
         "Sign contracts for next year, then take your cut of spring hope."][s];
      body.innerHTML = '<p class="copy dim">' + (hint || "Kilns, wells and cabins bought today still count this fall.") + "</p>";
      return;
    }
    const yards = countType("yard");
    const order = state.summerOrder;
    const trainCost = yards * 8;
    const sprayCost = Math.round((140 + yards * 5) * REG().costMul);
    const handsCost = Math.round(110 * REG().costMul);
    const thirsty = thirstyCount();
    const haulCost = thirsty * 6;
    const orderBtn = (id, label, cost, sub, enabled) =>
      '<button type="button" class="action-btn" id="' + id + '"' +
      (enabled ? "" : " disabled") + ">" +
      label + " - " + fmt$(cost) +
      '<span class="action-sub">' + sub + "</span></button>";
    let html =
      '<p class="copy dim" style="font-size:.76rem;margin:0 0 7px;">One crew order this summer - choose well.</p>' +
      orderBtn("act-train", "Train the bines", trainCost,
        "+10% vigor on every yard" + (order === "train" ? " - ORDERED" : ""),
        !order && state.cash >= trainCost) +
      orderBtn("act-spray", "Preventative spray", sprayCost,
        "Summer disasters half as likely, half as cruel" + (order === "spray" ? " - ORDERED" : ""),
        !order && state.cash >= sprayCost) +
      orderBtn("act-hands", "Hire extra hands", handsCost,
        "+3 acres picked at harvest" + (order === "hands" ? " - ORDERED" : ""),
        !order && state.cash >= handsCost);
    if (thirsty > 0) {
      html +=
        '<button type="button" class="action-btn" id="act-haul"' +
        (state.cash >= haulCost ? "" : " disabled") + ">" +
        "Haul water to " + thirsty + " thirsty yard" + (thirsty > 1 ? "s" : "") + " - " + fmt$(haulCost) +
        '<span class="action-sub">Emergency buckets. Wells and creeks are cheaper.</span></button>';
    }
    body.innerHTML = html;

    const wireOrder = (id, key, cost, msg, effect) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener("click", () => {
        if (state.summerOrder || state.cash < cost) return;
        state.summerOrder = key;
        state.cash -= cost;
        if (effect) effect();
        feed(msg, "good");
        sfx("build");
        renderAll();
        save();
      });
    };
    wireOrder("act-train", "train", countType("yard") * 8, "Hands in the yard: every bine trained and tied.", () => {
      for (let i = 0; i < TILES_N; i++) {
        if (isYard(i)) state.tiles[i].b.health = clamp(state.tiles[i].b.health + 0.1, 0.15, 1);
      }
    });
    wireOrder("act-spray", "spray", sprayCost, "Copper and sulfur dusted on every row - insurance against the season.");
    wireOrder("act-hands", "hands", Math.round(110 * REG().costMul), "Extra pickers hired for the fall run.");
    const hw = document.getElementById("act-haul");
    if (hw) hw.addEventListener("click", () => {
      const n = thirstyCount();
      const cost = n * 6;
      if (!n || state.cash < cost) return;
      state.cash -= cost;
      for (let i = 0; i < TILES_N; i++) {
        if (isYard(i) && !isIrrigated(i)) state.tiles[i].b.wateredManual = true;
      }
      feed("Bucket line formed - water hauled to " + n + " yard" + (n > 1 ? "s" : "") + ".", "good");
      sfx("build");
      renderAll();
      save();
    });
  }

  function renderRivals() {
    const rows = state.rivals.map((rv) => ({
      name: rv.name,
      worth: rv.worth,
      crowned: state.crownedRival === rv.name,
    }));
    rows.push({ name: state.ranch + " (you)", worth: netWorth(), me: true });
    rows.sort((a, b) => b.worth - a.worth);
    $("#rival-list").innerHTML = rows
      .map((r) =>
        '<li class="' + (r.me ? "me " : "") + (r.crowned ? "crowned" : "") + '">' +
        "<span>" + r.name + '</span><span class="r-worth">' + fmt$(r.worth) + "</span></li>"
      )
      .join("");
    $("#rival-note").textContent = state.crownedRival
      ? state.crownedRival + " wears the crown. Pass " + fmt$(RIVAL_KING) + " to steal it."
      : "First fortune past " + fmt$(RIVAL_KING) + " wears the crown.";
  }

  function renderFeed() {
    $("#feed").innerHTML = state.log
      .slice(0, 12)
      .map((l) => '<li class="' + l.kind + '">' + l.msg + "</li>")
      .join("");
  }

  function infoLine(k, v) {
    return '<div class="info-line"><span>' + k + "</span><b>" + v + "</b></div>";
  }

  function renderTileInfo(i) {
    const box = $("#tile-info");
    if (i == null || !state.tiles[i]) {
      box.innerHTML = '<p class="copy dim">Click a tile to inspect it.</p>';
      return;
    }
    const t = state.tiles[i];
    let head = TERRAIN_LABEL[t.t];
    let lines = "";
    let actions = "";

    if (t.b) {
      const b = t.b;
      if (b.type === "yard") {
        head = VARIETIES[b.v].name + " yard";
        const st = yardStats(i);
        const dry = REG().rain < 0.6;
        const water = !dry ? "Rain-fed country" : isIrrigated(i) ? "Watered" : "THIRSTY";
        lines += infoLine("Vigor", Math.round(b.health * 100) + "%");
        lines += infoLine("Est. yield", fmtLb(st.lb));
        lines += infoLine("Stand", st.matured >= 1 ? "Mature" : "First year (68%)");
        lines += infoLine("Water", water);
      } else if (b.type === "kiln") {
        head = "Hop kiln";
        lines += infoLine("Capacity", "7,000 lb per fall");
        lines += infoLine("On the ranch", countType("kiln") + " total");
      } else if (b.type === "cabin") {
        head = "Pickers' cabin";
        lines += infoLine("Hands", "Picks 6 acres at harvest");
        lines += infoLine("On the ranch", countType("cabin") + " total");
      } else if (b.type === "well") {
        head = "Dug well";
        lines += infoLine("Reach", "Waters the 8 tiles around it");
      } else if (b.type === "hq") {
        head = "Home ranch";
        lines += infoLine("", "Where the ledgers live.");
      }
      if (b.type !== "hq") {
        const refund = Math.round(COSTS[b.type] * REG().costMul * 0.25);
        actions += '<div class="info-actions"><button type="button" id="demo-btn" class="btn compact ghost">Demolish (+' + fmt$(refund) + ")</button></div>";
      }
    } else if (t.t === "rock") {
      actions += '<div class="info-actions"><button type="button" id="clear-btn" class="btn compact ghost">Blast & clear - ' + fmt$(clearCostFor("rock")) + "</button></div>";
    } else if (t.t === "forest") {
      actions += '<div class="info-actions"><button type="button" id="clear-btn" class="btn compact ghost">Fall the timber - ' + fmt$(clearCostFor("forest")) + "</button></div>";
    } else {
      lines += infoLine("Status", "Open for planting or building");
    }

    box.innerHTML = '<p class="info-head">' + head + "</p>" + lines + actions;
    const cb = document.getElementById("clear-btn");
    if (cb) cb.addEventListener("click", () => tryClear(i));
    const db = document.getElementById("demo-btn");
    if (db) db.addEventListener("click", () => tryDemolish(i));
  }

  function tryClear(i) {
    const t = state.tiles[i];
    if (t.t !== "rock" && t.t !== "forest") return;
    const cost = clearCostFor(t.t);
    if (state.cash < cost) { feed("Not enough cash to clear that.", "bad"); renderAll(); return; }
    state.cash -= cost;
    t.t = "grass";
    feed("Cleared a rough acre for " + fmt$(cost) + ".");
    sfx("build");
    floatText(i, "-" + fmt$(cost), false);
    renderAll();
    save();
  }

  function tryDemolish(i) {
    const t = state.tiles[i];
    if (!t.b || t.b.type === "hq") return;
    const refund = Math.round(COSTS[t.b.type] * REG().costMul * 0.25);
    t.b = null;
    state.cash += refund;
    feed("Torn down. Salvage: " + fmt$(refund) + ".");
    sfx("build");
    floatText(i, "+" + fmt$(refund), true);
    renderAll();
    save();
  }

  const BUILD_NAME = { yard: "Hop yard", well: "Dug well", kiln: "Hop kiln", cabin: "Pickers' cabin" };

  function tryBuild(i, type) {
    const t = state.tiles[i];
    if (t.t !== "grass" || t.b) {
      feed(TERRAIN_LABEL[t.t] + " - needs open dirt. Try Clear Land first.", "bad");
      renderAll();
      return;
    }
    const varietyCost = type === "yard" ? VARIETIES[ui.variety].cost : 0;
    const cost = buildCost(type) + varietyCost;
    if (state.cash < cost) { feed("Not enough cash for that.", "bad"); renderAll(); return; }
    state.cash -= cost;
    if (type === "yard") {
      t.b = { type: "yard", v: ui.variety, plantedYear: state.year, health: 0.78 };
      feed("Planted " + VARIETIES[ui.variety].name + " on an acre (" + fmt$(cost) + ").");
    } else {
      t.b = { type };
      feed(BUILD_NAME[type] + " raised (" + fmt$(cost) + ").");
    }
    floatText(i, "-" + fmt$(cost), false);
    sfx("build");
    renderAll();
    const el = document.querySelector('#farm-board [data-i="' + i + '"]');
    if (el) { el.classList.add("built-pop"); setTimeout(() => el.classList.remove("built-pop"), 500); }
    save();
  }

  function onTileClick(i) {
    ui.selectedTile = i;
    if (ui.tool === "inspect") { renderAll(); return; }
    if (ui.tool === "clear") return tryClear(i);
    if (ui.tool === "demolish") return tryDemolish(i);
    if (COSTS[ui.tool]) return tryBuild(i, ui.tool);
    renderAll();
  }


  let claimSel = null;

  function goClaim() {
    claimSel = null;
    $("#ranch-name").value = "";
    const startBtn = $("#btn-start");
    startBtn.disabled = true;
    startBtn.textContent = "Select a region first";
    renderRegions();
    showScreen("claim");
  }

  function bar(v, warnBelow) {
    const pct = Math.round(clamp(v, 0, 1) * 100);
    return '<span class="bar' + (warnBelow !== undefined && v < warnBelow ? " warn" : "") +
      '"><i style="width:' + pct + '%"></i></span>';
  }

  function renderRegions() {
    $("#region-grid").innerHTML = REGIONS.map((r) =>
      '<button type="button" class="region-card' + (claimSel === r.id ? " selected" : "") +
      '" data-region="' + r.id + '">' +
      '<div class="rc-top"><h3>' + r.name + '</h3><span class="state-badge">' + r.st + "</span></div>" +
      '<i class="rc-swatch" style="background:linear-gradient(180deg,hsl(' + Math.round(75 + r.rain * 55) + ',' + Math.round(24 + r.soil * 14) + '%,' + Math.round(30 + r.soil * 8) + '%),#1c1610)"></i>' +
      '<p class="rc-blurb">' + r.blurb + "</p>" +
      '<div class="rc-stats">' +
      '<div class="rc-stat"><span>Rain</span>' + bar(r.rain, 0.45) + "</div>" +
      '<div class="rc-stat"><span>Soil</span>' + bar(r.soil) + "</div>" +
      '<div class="rc-stat"><span>Yield</span>' + bar((r.yieldMul - 0.8) / 0.5) + "</div>" +
      '<div class="rc-stat"><span>Prices</span>' + bar((r.priceMul - 0.9) / 0.35) + "</div>" +
      "</div>" +
      '<div class="rc-foot"><span class="price-chip">Builds ~' + Math.round(100 * r.costMul) + "% cost</span>" +
      '<span class="risk-tag">' + r.risk + "</span></div></button>"
    ).join("");
    document.querySelectorAll("[data-region]").forEach((card) => {
      card.addEventListener("click", () => {
        claimSel = card.dataset.region;
        const r = REGIONS.find((x) => x.id === claimSel);
        document.querySelectorAll("[data-region]").forEach((c) => {
          c.classList.toggle("selected", c.dataset.region === claimSel);
        });
        const btn = $("#btn-start");
        btn.disabled = false;
        btn.textContent = "Stake your claim in " + r.name;
      });
    });
  }

  function startGame() {
    if (!claimSel) return;
    const name = ($("#ranch-name").value || "").trim() || "Meeker & Sons";
    state = newState(claimSel, name);
    lastCash = state.cash;
    shownCash = state.cash;
    wipeSave();
    enterFarm();
    feed("Spring 1883. You ride into " + REG().name + " with $1,500 and a roll of wire.", "event");
    if (REG().rain < 0.45) {
      feed("Dry country: plant yards next to creeks or sink wells, or the bines will bake.", "bad");
    } else {
      feed("Wet country: watch for mildew when the rains settle in.", "info");
    }
    renderAll();
    save();
    setTimeout(showTutorial, 300);
  }

  function netWorthOf(s) {
    let sum = s.cash;
    s.tiles.forEach((t) => { if (t.b) sum += ASSET_VALUE[t.b.type] || 0; });
    return sum;
  }

  function enterFarm() {
    ui.tool = "inspect";
    ui.selectedTile = null;
    ui.trainedThisSummer = false;
    renderToolsStatic();
    showScreen("farm");
    renderAll();
  }

  function wireUI() {
    $("#btn-new").addEventListener("click", () => {
      const existing = loadSave();
      if (existing) {
        showModal({
          eyebrow: "Careful now",
          title: "Start a new empire?",
          body:
            '<p class="copy">Your old ranch (' + existing.ranch + ", " + fmt$(netWorthOf(existing)) +
            ') will be plowed under. There are no second saves.</p>',
          choices: [
            { label: "Plow it under", kind: "danger", fn: () => { wipeSave(); refreshContinue(); goClaim(); } },
            { label: "Keep my empire", kind: "primary", fn: () => {} },
          ],
        });
      } else {
        goClaim();
      }
    });

    $("#btn-continue").addEventListener("click", () => {
      const s = loadSave();
      if (!s) return;
      state = s;
      lastCash = state.cash;
      shownCash = state.cash;
      enterFarm();
      feed("Back to the " + REG().name + " ranch - " + SEASONS[state.seasonIdx] + " " + state.year + ".", "info");
      renderAll();
    });

    $("#btn-how").addEventListener("click", () => showScreen("how"));
    $("#btn-faq").addEventListener("click", () => showScreen("faq"));
    $("#btn-how-faq").addEventListener("click", () => showScreen("faq"));
    $("#btn-faq-back").addEventListener("click", () => { refreshContinue(); showScreen("title"); });
    $("#btn-back-title").addEventListener("click", () => { refreshContinue(); showScreen("title"); });
    $("#btn-claim-back").addEventListener("click", () => { refreshContinue(); showScreen("title"); });
    $("#btn-start").addEventListener("click", startGame);
    $("#btn-advance").addEventListener("click", advance);

    document.querySelectorAll("[data-var]").forEach((chip) => {
      chip.addEventListener("click", () => {
        ui.variety = chip.dataset.var;
        renderVarietyRow();
      });
    });

    $("#farm-board").addEventListener("click", (e) => {
      const tile = e.target.closest("[data-i]");
      if (!tile) return;
      onTileClick(+tile.dataset.i);
    });

    $("#farm-board").addEventListener("mouseover", (e) => {
      const tile = e.target.closest("[data-i]");
      if (!tile) return;
      previewWellRange(+tile.dataset.i);
    });
    $("#farm-board").addEventListener("mouseout", (e) => {
      if (e.target.closest("[data-i]")) clearRangePreview();
    });

    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && ui.screen === "farm" && !busy && modalQueue.length === 0) {
        e.preventDefault();
        advance();
      }
    });

    refreshContinue();

    document.getElementById("btn-tut-ok").addEventListener("click", dismissTutorial);
    document.getElementById("rankup-ok").addEventListener("click", () => {
      document.getElementById("rankup").classList.add("hidden");
    });

    const sndBtn = document.getElementById("btn-sound");
    const syncSnd = () => { sndBtn.textContent = muted ? "Sound: Off" : "Sound: On"; };
    syncSnd();
    sndBtn.addEventListener("click", () => {
      muted = !muted;
      try { localStorage.setItem("hopcity_muted", muted ? "1" : "0"); } catch (e) {}
      syncSnd();
      if (!muted) sfx("tick");
    });
  }

  window.HOPCITY = {
    get state() { return state; },
    set state(v) { state = v; },
    get busy() { return busy; },
    get mqLen() { return modalQueue.length; },
    get sqLen() { return stepQueue.length; },
    ui,
    fns: { newState, enterFarm, advance, tryBuild, tryClear, tryDemolish, netWorth, countType, projectHarvest },
  };

  wireUI();
})();

