(() => {
  "use strict";

  const ACRES_PER_BLOCK = 10;
  const GOAL_ACRES = 180;
  const COLS = 8;
  const ROWS = 8;

  // Mirrors server/map.js — Blender 1885 Puyallup layout
  const TERRAIN_ACRES = {
    river: 0,
    farm: 10,
    town: 12,
    pioneer: 25,
    hops: 15,
    hill: 8,
  };
  const TERRAIN_LABEL = {
    river: "Puyallup River",
    farm: "Valley farm",
    town: "Downtown",
    pioneer: "Pioneer Park",
    hops: "Hop field",
    hill: "South Hill",
  };
  const LAYOUT = [
    "FFFFFFFF",
    "RRRRRRRR",
    "FFTTTFFF",
    "FTTPTTFS",
    "HHTTTHHS",
    "HHHHHHHS",
    "HHHHHFFS",
    "SSSSSSSS",
  ];
  const CHAR = { R: "river", F: "farm", T: "town", P: "pioneer", H: "hops", S: "hill" };

  const LOCAL_TRIVIA = [
    {
      id: "puyallup_hint",
      q: "Puyallup Valley farming in the Meeker story is especially tied to:",
      choices: ["Silver mining", "Hop fields", "Whale oil", "Cattle drives to Texas"],
      answer: 1,
      teach: "Ezra’s hop-king chapter is Puyallup — acres, kilns, and boom/bust.",
    },
    {
      id: "hop_king",
      q: "“Hop King of the World” points to:",
      choices: [
        "California gold only",
        "Puyallup Valley hops + Ezra’s big personality",
        "Lewis and Clark only",
        "A made-up island",
      ],
      answer: 1,
      teach: "Northwest hops + Meeker branding.",
    },
    {
      id: "land_claim",
      q: "At journey’s end, many families faced this land tension:",
      choices: [
        "Free land with zero paperwork",
        "Donation claims vs later fees and filings",
        "Only British crown grants",
        "Land assigned by dice",
      ],
      answer: 1,
      teach: "Donation claims vs later fees shaped who kept farms.",
    },
    {
      id: "fee_acre",
      q: "Later land fees were often talked about as about:",
      choices: ["$0 forever", "$1.25 an acre", "$100 an acre", "Paid in hops only"],
      answer: 1,
      teach: "About $1.25/acre in the fee era.",
    },
    {
      id: "blocks_acres",
      q: "On this Puyallup board, a hop-field block is worth:",
      choices: ["1 acre", "15 acres", "100 acres", "500 acres"],
      answer: 1,
      teach: "Hop fields = 15 acres. Pioneer Park = 25. Farms ≈ 10.",
    },
    {
      id: "pioneer_park",
      q: "The big prize parcel in the valley core is:",
      choices: ["A ferry dock", "Pioneer Park", "Mount Rainier summit", "A gold mine"],
      answer: 1,
      teach: "Pioneer Park sits near the Blender map origin — 25 acres if you grab it.",
    },
    {
      id: "river_logic",
      q: "Why did rivers matter so much on the real trail?",
      choices: [
        "They were just pretty",
        "They forced risk — ferries, fords, drownings",
        "They never flooded",
        "Only crossed in winter",
      ],
      answer: 1,
      teach: "Drama clusters at water. River tiles stay blocked.",
    },
  ];

  let playerName = "Player";
  let mode = "solo"; // solo | multi
  let myId = "you";
  let socket = null;
  let connected = false;
  let roomState = null;
  let lastMode = "solo";
  let scores = loadLocalScores();

  // Solo state
  let solo = null;
  let botTimer = null;

  const $ = (sel) => document.querySelector(sel);

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach((el) => {
      el.classList.toggle("active", el.dataset.screen === name);
    });
    const dock = $("#dock");
    if (dock) {
      dock.classList.toggle("hidden", name === "play");
    }
    const sample = $("#sample-video");
    if (sample) {
      if (name === "how") {
        sample.currentTime = 0;
        sample.play().catch(() => {});
      } else {
        sample.pause();
      }
    }
    if (name === "lobby") {
      $("#lobby-name").textContent = playerName;
      updateNetStatus();
    }
    if (name === "play") {
      $("#hud-name").textContent = playerName;
      $("#hud-goal").textContent = GOAL_ACRES + " ac";
    }
  }

  function updateNetStatus() {
    const el = $("#net-status");
    if (!el) return;
    el.textContent = connected
      ? "Live server on — rooms + board sync"
      : "Offline — solo + local board still work";
  }

  function loadLocalScores() {
    try {
      const raw = JSON.parse(localStorage.getItem("claimrush_scores") || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function saveLocalScore(row) {
    scores = [row, ...scores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);
    try {
      localStorage.setItem("claimrush_scores", JSON.stringify(scores));
    } catch (_) {}
  }

  function computeScore(acres, triviaCorrect) {
    return Math.max(0, Math.floor(acres + triviaCorrect * 25));
  }

  function renderLeaderboard(sel) {
    const el = $(sel);
    if (!el) return;
    const list = scores.slice(0, 8);
    if (!list.length) {
      el.innerHTML = "<li class='empty-row'>No scores yet — win a round.</li>";
      return;
    }
    el.innerHTML = list
      .map(
        (r, i) =>
          `<li><span class="rank">${i + 1}</span><span class="nm">${escapeHtml(
            r.name
          )}</span><span class="sc">${r.score}</span><span class="meta">${
            r.meta?.acres != null ? r.meta.acres + " ac" : ""
          }</span></li>`
      )
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ---------- Solo engine (Puyallup 1885 map) ---------- */
  function makeSoloGrid() {
    const grid = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const terrain = CHAR[LAYOUT[y][x]] || "farm";
        const blocked = terrain === "river";
        grid.push({
          owner: blocked ? "blocked" : "empty",
          terrain,
          label: TERRAIN_LABEL[terrain],
          acres: TERRAIN_ACRES[terrain] || 0,
        });
      }
    }
    // Starters: you by Pioneer, Baron in hops, Bea on South Hill edge
    grid[3 * COLS + 2].owner = "you";
    grid[5 * COLS + 2].owner = "botA";
    grid[4 * COLS + 7].owner = "botB";
    return grid;
  }

  function soloCounts() {
    let youAcres = 0;
    let youBlocks = 0;
    let foeAcres = 0;
    let open = 0;
    for (const cell of solo.grid) {
      if (cell.owner === "empty") open += 1;
      else if (cell.owner === "you") {
        youBlocks += 1;
        youAcres += cell.acres;
      } else if (cell.owner === "botA" || cell.owner === "botB") {
        foeAcres += cell.acres;
      }
    }
    return { youAcres, youBlocks, foeAcres, open };
  }

  function triviaMilestones(budget) {
    return [90]; // one mid-round beat
  }

  function startSolo() {
    stopSolo();
    mode = "solo";
    lastMode = "solo";
    myId = "you";
    const triviaBudget = 1;
    solo = {
      grid: makeSoloGrid(),
      triviaCorrect: 0,
      triviaAsked: 0,
      triviaBudget,
      triviaMarks: triviaMilestones(triviaBudget),
      triviaOpen: false,
      feed: ["Practice: tap numbered squares. Rival moves slowly.", "First to " + GOAL_ACRES + " acres wins."],
      playing: true,
      pendingTrivia: null,
    };
    // Only one rival on the board for clear 1v1 practice
    for (let i = 0; i < solo.grid.length; i++) {
      if (solo.grid[i].owner === "botB") solo.grid[i].owner = "empty";
    }
    showScreen("play");
    updateTriviaButton();
    renderSolo();
    // Slow pace — not a blur
    botTimer = setInterval(botTick, 1600);
  }

  function stopSolo() {
    if (botTimer) clearInterval(botTimer);
    botTimer = null;
    if (solo) solo.playing = false;
  }

  function updateTriviaButton() {
    const btn = $("#btn-trivia");
    if (!btn) return;
    if (mode !== "solo" || !solo) {
      btn.textContent = "Trivia boost";
      btn.disabled = false;
      return;
    }
    const left = Math.max(0, solo.triviaBudget - solo.triviaAsked);
    btn.textContent = left ? `Trivia (${left} left)` : "No trivia left";
    btn.disabled = left <= 0 || solo.triviaOpen;
  }

  function botClaimOne(bot, label) {
    const open = [];
    for (let i = 0; i < solo.grid.length; i++) {
      if (solo.grid[i].owner === "empty") open.push(i);
    }
    if (!open.length) return false;

    let pick = open[Math.floor(Math.random() * open.length)];
    const adj = open.filter((i) => {
      const x = i % COLS;
      const y = (i / COLS) | 0;
      return [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ].some(([nx, ny]) => {
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return false;
        return solo.grid[ny * COLS + nx].owner === bot;
      });
    });
    if (adj.length) pick = adj[Math.floor(Math.random() * adj.length)];

    const counts = soloCounts();
    if (counts.youBlocks > 5 && Math.random() < 0.08) {
      const yours = [];
      for (let i = 0; i < solo.grid.length; i++) {
        if (solo.grid[i].owner === "you") yours.push(i);
      }
      if (yours.length > 1) {
        pick = yours[Math.floor(Math.random() * yours.length)];
        const stolen = solo.grid[pick];
        stolen.owner = bot;
        solo.feed.push(label + " stole " + stolen.label + "!");
        return true;
      }
    }

    const cell = solo.grid[pick];
    cell.owner = bot;
    solo.feed.push(label + " took " + cell.label + " (+" + cell.acres + ")");
    return true;
  }

  function botTick() {
    if (!solo?.playing || solo.triviaOpen) return;
    botClaimOne("botA", "Rival");
    renderSolo();
    checkSoloEnd();
  }

  function maybeAutoTrivia() {
    if (!solo?.playing || solo.triviaOpen) return;
    if (solo.triviaAsked >= solo.triviaBudget) return;
    const c = soloCounts();
    const next = solo.triviaMarks[solo.triviaAsked];
    if (next != null && c.youAcres >= next) {
      offerLocalTrivia(true);
    }
  }

  function claimSolo(idx) {
    if (!solo?.playing || solo.triviaOpen) return;
    if (solo.grid[idx].owner !== "empty") return;
    const cell = solo.grid[idx];
    cell.owner = "you";
    solo.feed.push("You took " + cell.label + " (+" + cell.acres + ")");
    renderSolo();
    maybeAutoTrivia();
    checkSoloEnd();
  }

  function checkSoloEnd() {
    const c = soloCounts();
    if (c.youAcres >= GOAL_ACRES) {
      endSolo("win");
      return;
    }
    if (c.foeAcres >= GOAL_ACRES) {
      endSolo("lose");
      return;
    }
    if (c.open === 0) {
      if (c.youAcres > c.foeAcres) endSolo("win");
      else if (c.youAcres < c.foeAcres) endSolo("lose");
      else endSolo("tie");
    }
  }

  function endSolo(result) {
    if (!solo?.playing) return;
    stopSolo();
    const c = soloCounts();
    if (!result) {
      result =
        c.youAcres > c.foeAcres ? "win" : c.youAcres < c.foeAcres ? "lose" : "tie";
    }
    const score = computeScore(c.youAcres, solo.triviaCorrect);
    const row = {
      name: playerName,
      score,
      at: new Date().toISOString(),
      meta: { acres: c.youAcres, trivia: solo.triviaCorrect, mode: "solo" },
    };
    saveLocalScore(row);
    if (connected && socket) {
      socket.emit("scores:submit", {
        name: playerName,
        acres: c.youAcres,
        triviaCorrect: solo.triviaCorrect,
        mode: "solo",
      });
    }
    showResult({
      result,
      acres: c.youAcres,
      blocks: c.youBlocks,
      trivia: solo.triviaCorrect,
      score,
      copy:
        result === "win"
          ? "You locked the valley."
          : result === "tie"
            ? "Split acres. Rematch."
            : "The rival beat you to 180. Try again — tap faster on hops.",
    });
  }

  function offerLocalTrivia(auto) {
    if (!solo?.playing || solo.triviaOpen) return;
    if (solo.triviaAsked >= solo.triviaBudget) {
      updateTriviaButton();
      return;
    }
    const item = LOCAL_TRIVIA[Math.floor(Math.random() * LOCAL_TRIVIA.length)];
    solo.pendingTrivia = item;
    solo.triviaOpen = true;
    solo.triviaAsked += 1;
    updateTriviaButton();
    openTriviaModal(item, (choice) => {
      const ok = choice === item.answer;
      $("#trivia-teach").textContent = (ok ? "Yes. " : "Nope. ") + item.teach;
      if (ok && solo) {
        solo.triviaCorrect += 1;
        const rivals = [];
        const open = [];
        for (let i = 0; i < solo.grid.length; i++) {
          const o = solo.grid[i].owner;
          if (o === "empty") open.push(i);
          else if (o !== "you" && o !== "blocked") rivals.push(i);
        }
        if (rivals.length) {
          solo.grid[rivals[Math.floor(Math.random() * rivals.length)]].owner = "you";
          solo.feed.push("Trivia steal!");
        } else {
          for (let n = 0; n < 2 && open.length; n++) {
            const j = Math.floor(Math.random() * open.length);
            solo.grid[open.splice(j, 1)[0]].owner = "you";
          }
          solo.feed.push("Trivia land grab!");
        }
        renderSolo();
        checkSoloEnd();
      }
      setTimeout(() => {
        if (solo) solo.triviaOpen = false;
        closeTriviaModal();
        updateTriviaButton();
      }, 900);
    });
  }

  function renderSolo() {
    const board = $("#game-board");
    const c = soloCounts();
    $("#score-you").textContent = String(c.youAcres);
    $("#score-rival").textContent = String(c.foeAcres);
    $("#score-them-label").innerHTML = `Rival <b id="score-rival">${c.foeAcres}</b>`;
    updateTriviaButton();
    board.style.setProperty("--cols", String(COLS));
    board.innerHTML = "";
    solo.grid.forEach((cell, idx) => {
      board.appendChild(makeTile(cell, () => claimSolo(idx)));
    });
    const feed = $("#play-feed");
    feed.innerHTML = solo.feed
      .slice(-5)
      .map((t) => `<li>${escapeHtml(t)}</li>`)
      .join("");
  }

  /* ---------- Trivia modal ---------- */
  let triviaHandler = null;

  function openTriviaModal(item, onPick) {
    const modal = $("#trivia-modal");
    $("#trivia-q").textContent = item.q;
    $("#trivia-teach").textContent = "";
    const box = $("#trivia-choices");
    box.innerHTML = "";
    triviaHandler = onPick;
    item.choices.forEach((label, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn ghost";
      b.textContent = label;
      b.addEventListener("click", () => {
        box.querySelectorAll("button").forEach((x) => (x.disabled = true));
        if (triviaHandler) triviaHandler(i);
      });
      box.appendChild(b);
    });
    modal.classList.remove("hidden");
  }

  function closeTriviaModal() {
    $("#trivia-modal").classList.add("hidden");
    triviaHandler = null;
  }

  /* ---------- Multiplayer ---------- */
  function connectSocket() {
    if (typeof io === "undefined") {
      connected = false;
      updateNetStatus();
      return;
    }
    socket = io({ transports: ["websocket", "polling"] });
    socket.on("connect", () => {
      connected = true;
      myId = socket.id;
      updateNetStatus();
    });
    socket.on("disconnect", () => {
      connected = false;
      updateNetStatus();
    });
    socket.on("scores:list", (list) => {
      if (Array.isArray(list) && list.length) {
        scores = list;
        renderLeaderboard("#lobby-board");
        renderLeaderboard("#result-board");
      }
    });
    socket.on("claim:joined", (payload) => {
      myId = payload.you || socket.id;
      showDuelHost(payload.code);
    });
    socket.on("claim:state", (state) => {
      roomState = state;
      mode = "multi";
      if (state.phase === "lobby") {
        showScreen("lobby");
        showDuelHost(state.code);
        const n = state.players?.length || 1;
        const wait = $("#duel-wait");
        if (wait) wait.textContent = n + " / 2 players — game starts at 2";
      } else if (state.phase === "play") {
        lastMode = "multi";
        $("#duel-panel")?.classList.add("hidden");
        showScreen("play");
        renderMulti(state);
        if (state.trivia && state.trivia.forId === myId) {
          maybeShowServerTrivia(state.trivia);
        } else if (!state.trivia) {
          closeTriviaModal();
        }
      } else if (state.phase === "result") {
        finishMulti(state);
      }
    });
    socket.on("claim:error", (p) => {
      const el = $("#net-status");
      if (el) el.textContent = p.error || "Error";
    });
    socket.on("claim:trivia:result", (p) => {
      $("#trivia-teach").textContent = (p.correct ? "Yes. " : "Nope. ") + (p.teach || "");
      setTimeout(closeTriviaModal, 1100);
    });
  }

  let showingTriviaId = null;
  function maybeShowServerTrivia(tr) {
    if (showingTriviaId === tr.id) return;
    showingTriviaId = tr.id;
    openTriviaModal(tr, (choice) => {
      socket.emit("claim:trivia:answer", { choice });
      showingTriviaId = null;
    });
  }

  function showDuelHost(code) {
    const panel = $("#duel-panel");
    const host = $("#duel-host");
    if (!panel || !host) return;
    panel.classList.remove("hidden");
    host.classList.remove("hidden");
    const el = $("#duel-code");
    if (el) el.textContent = code || "----";
  }

  function hideDuel() {
    $("#duel-panel")?.classList.add("hidden");
    $("#duel-host")?.classList.add("hidden");
  }

  function makeTile(cell, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    let ownerCls = "empty";
    if (cell.owner === "blocked") ownerCls = "blocked";
    else if (cell.owner === "you" || cell.owner === myId) ownerCls = "you";
    else if (cell.owner !== "empty") ownerCls = "rival";
    const terrain = cell.terrain || "farm";
    btn.className = "tile " + ownerCls + " t-" + terrain;
    // Keep terrain skin even when owned
    if (ownerCls === "you" || ownerCls === "rival") {
      const skin = {
        farm: "/skins/skin_farm.png",
        town: "/skins/skin_town.png",
        pioneer: "/skins/skin_park.png",
        hops: "/skins/skin_hops.png",
        hill: "/skins/skin_hill.png",
        river: "/skins/skin_river.png",
      }[terrain];
      if (skin) btn.style.backgroundImage = "url('" + skin + "')";
    }
    btn.title =
      (cell.label || TERRAIN_LABEL[terrain] || terrain) +
      (cell.acres ? " · " + cell.acres + " ac" : "") +
      (ownerCls === "empty" ? " — tap to claim" : "");
    if (ownerCls === "blocked") btn.disabled = true;
    else if (onClick) btn.addEventListener("click", onClick);
    if (ownerCls === "empty" && terrain !== "river") {
      const tag = document.createElement("span");
      tag.className = "tile-tag";
      tag.textContent = String(cell.acres || "");
      btn.appendChild(tag);
    }
    return btn;
  }

  function renderMulti(state) {
    const me = state.players.find((p) => p.id === myId);
    const foes = state.players.filter((p) => p.id !== myId);
    const foeAcres = foes.reduce((s, p) => s + p.acres, 0);
    $("#score-you").textContent = String(me?.acres || 0);
    $("#score-them-label").innerHTML = `Them <b id="score-rival">${foeAcres}</b>`;
    $("#hud-goal").textContent = (state.goalAcres || GOAL_ACRES) + " ac";

    const board = $("#game-board");
    board.style.setProperty("--cols", String(state.cols || COLS));
    board.innerHTML = "";
    state.grid.forEach((cell, idx) => {
      board.appendChild(
        makeTile(cell, () => {
          socket.emit("claim:tap", { idx });
        })
      );
    });
    $("#play-feed").innerHTML = (state.feed || [])
      .slice(-5)
      .map((f) => `<li>${escapeHtml(f.text)}</li>`)
      .join("");
  }

  function finishMulti(state) {
    const me = state.players.find((p) => p.id === myId);
    const won = state.winnerId === myId;
    const score = computeScore(me?.acres || 0, me?.triviaCorrect || 0);
    showResult({
      result: won ? "win" : "lose",
      acres: me?.acres || 0,
      blocks: me?.blocks || 0,
      trivia: me?.triviaCorrect || 0,
      score,
      copy: won
        ? "You owned the valley this round."
        : "Someone else locked more acres.",
    });
  }

  function showResult(r) {
    $("#result-eyebrow").textContent =
      r.result === "win" ? "You win" : r.result === "tie" ? "Tie" : "You lose";
    $("#result-title").textContent =
      r.result === "win" ? "Valley secured." : r.result === "tie" ? "Split claim." : "Lost the hops.";
    $("#result-copy").textContent = r.copy;
    $("#result-acres").textContent = String(r.acres);
    $("#result-blocks").textContent = String(r.blocks);
    $("#result-trivia").textContent = String(r.trivia);
    $("#result-score").textContent = String(r.score);
    showScreen("result");
  }

  /* ---------- Bind UI ---------- */
  function bind() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      const id = t.id;

      if (id === "btn-how" || id === "btn-boot") {
        showScreen("name");
        return;
      }
      if (id === "btn-replay-how") {
        showScreen("how");
        return;
      }
      if (id === "btn-name") {
        const input = $("#player-name");
        playerName = (input?.value.trim() || "Player").slice(0, 16);
        if (playerName.length < 2) return;
        try {
          localStorage.setItem("claimrush_player", JSON.stringify({ name: playerName }));
        } catch (_) {}
        hideDuel();
        showScreen("lobby");
        return;
      }
      if (t.closest("#name-chips")) {
        const input = $("#player-name");
        const btnName = $("#btn-name");
        if (input) {
          input.value = t.getAttribute("data-name") || t.textContent || "";
          if (btnName) btnName.disabled = input.value.trim().length < 2;
        }
        return;
      }
      if (id === "btn-solo") {
        startSolo();
        return;
      }
      if (id === "btn-1v1") {
        if (!connected) {
          $("#net-status").textContent = "Server offline — use Practice, or run npm start";
          return;
        }
        socket.emit("claim:create", { name: playerName, mode: "1v1" });
        showDuelHost("····");
        return;
      }
      if (id === "btn-join") {
        if (!connected) {
          $("#net-status").textContent = "Server offline — use Practice, or run npm start";
          return;
        }
        const code = ($("#room-code").value || "").trim().toUpperCase();
        if (code.length < 4) {
          $("#net-status").textContent = "Enter the 4-letter code from your friend";
          return;
        }
        socket.emit("claim:join", { name: playerName, code });
        return;
      }
      if (id === "btn-duel-cancel") {
        hideDuel();
        return;
      }
      if (id === "btn-trivia") {
        if (mode === "multi") {
          socket?.emit("claim:trivia:request");
        } else if (solo?.playing) {
          offerLocalTrivia(false);
        }
        return;
      }
      if (id === "btn-again") {
        if (lastMode === "multi" && connected) {
          hideDuel();
          showScreen("lobby");
        } else {
          startSolo();
        }
        return;
      }
      if (id === "btn-home") {
        stopSolo();
        closeTriviaModal();
        hideDuel();
        showScreen("lobby");
        return;
      }
    });

    const nameInput = $("#player-name");
    const btnName = $("#btn-name");
    nameInput?.addEventListener("input", () => {
      if (btnName) btnName.disabled = nameInput.value.trim().length < 2;
    });
    nameInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && btnName && !btnName.disabled) {
        playerName = nameInput.value.trim();
        hideDuel();
        showScreen("lobby");
      }
    });

    try {
      const saved = JSON.parse(localStorage.getItem("claimrush_player") || "null");
      if (saved?.name) {
        playerName = saved.name;
        if (nameInput) nameInput.value = saved.name;
        if (btnName) btnName.disabled = saved.name.length < 2;
      }
    } catch (_) {}

    connectSocket();
    showScreen("how");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
