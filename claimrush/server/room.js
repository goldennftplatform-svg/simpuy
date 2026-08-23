import {
  ACRES_PER_BLOCK,
  GOAL_ACRES,
  pickTrivia,
  checkAnswer,
  publicTrivia,
} from "./trivia.js";
import {
  COLS,
  ROWS,
  buildValleyGrid,
  acresForCell,
} from "./map.js";

export { ACRES_PER_BLOCK, GOAL_ACRES };

const COLORS = ["you", "p2", "p3", "p4"];

function code() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function emptyGrid() {
  return buildValleyGrid();
}

export class Room {
  constructor(hostId, hostName, opts = {}) {
    this.code = code();
    this.phase = "lobby"; // lobby | play | result
    this.mode = opts.mode === "1v1" ? "1v1" : "open";
    this.maxPlayers = this.mode === "1v1" ? 2 : 4;
    this.autoStart = this.mode === "1v1";
    this.players = new Map(); // socketId -> player
    this.grid = emptyGrid();
    this.startedAt = null;
    this.winnerId = null;
    this.feed = [];
    this.activeTrivia = null; // { forId, item }
    this.addPlayer(hostId, hostName, true);
  }

  addPlayer(socketId, name, isHost = false) {
    if (this.players.size >= this.maxPlayers) return { ok: false, error: "Room full (1v1 is 2 players)" };
    if (this.phase !== "lobby") return { ok: false, error: "Round already started" };
    const slot = this.players.size;
    this.players.set(socketId, {
      id: socketId,
      name: String(name || "Player").slice(0, 16),
      color: COLORS[slot] || "p4",
      acres: 0,
      blocks: 0,
      triviaCorrect: 0,
      host: isHost || slot === 0,
      ready: true, // 1v1: no ready dance
    });
    this.pushFeed(`${name} joined`);
    return { ok: true, shouldAutoStart: this.autoStart && this.players.size >= 2 };
  }

  removePlayer(socketId) {
    const p = this.players.get(socketId);
    if (!p) return;
    this.players.delete(socketId);
    this.pushFeed(`${p.name} left`);
    if (this.phase === "play") {
      // Vacate their land to empty so others can take it
      for (const cell of this.grid) {
        if (cell.owner === socketId) cell.owner = "empty";
      }
      this.recalc();
    }
    if (!this.players.size) return "empty";
    // Transfer host
    if (p.host) {
      const next = [...this.players.values()][0];
      if (next) next.host = true;
    }
    return "ok";
  }

  pushFeed(text) {
    this.feed.push({ at: Date.now(), text: String(text).slice(0, 80) });
    if (this.feed.length > 40) this.feed = this.feed.slice(-40);
  }

  playerList() {
    return [...this.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      acres: p.acres,
      blocks: p.blocks,
      triviaCorrect: p.triviaCorrect,
      host: p.host,
      ready: p.ready,
    }));
  }

  publicGrid() {
    return this.grid.map((c) => ({
      owner: c.owner,
      terrain: c.terrain,
      label: c.label,
      acres: c.acres,
    }));
  }

  snapshot() {
    return {
      code: this.code,
      phase: this.phase,
      cols: COLS,
      rows: ROWS,
      map: "puyallup-1885",
      mode: this.mode,
      maxPlayers: this.maxPlayers,
      acresPerBlock: ACRES_PER_BLOCK,
      goalAcres: GOAL_ACRES,
      players: this.playerList(),
      grid: this.publicGrid(),
      feed: this.feed.slice(-12),
      winnerId: this.winnerId,
      trivia: this.activeTrivia
        ? { forId: this.activeTrivia.forId, ...publicTrivia(this.activeTrivia.item) }
        : null,
    };
  }

  setReady(socketId, ready) {
    const p = this.players.get(socketId);
    if (!p || this.phase !== "lobby") return;
    p.ready = !!ready;
  }

  canStart() {
    if (this.phase !== "lobby") return false;
    if (this.mode === "1v1") return this.players.size >= 2;
    if (this.players.size < 1) return false;
    return [...this.players.values()].every((p) => p.ready);
  }

  start(socketId, force = false) {
    const p = this.players.get(socketId);
    if (!force && !p?.host) return { ok: false, error: "Only host can start" };
    if (!this.canStart()) {
      return {
        ok: false,
        error: this.mode === "1v1" ? "Need 2 players" : "Everyone must ready up",
      };
    }

    this.grid = emptyGrid();
    this.phase = "play";
    this.startedAt = Date.now();
    this.winnerId = null;
    this.activeTrivia = null;

    // Seed on claimable valley parcels (avoid river)
    const seeds = [3 * COLS + 2, 5 * COLS + 2, 4 * COLS + 5, 6 * COLS + 1];
    let i = 0;
    for (const pl of this.players.values()) {
      pl.acres = 0;
      pl.blocks = 0;
      pl.triviaCorrect = 0;
      pl.triviaAsked = 0;
      pl.triviaBudget = 1; // one optional trivia beat
      const idx = seeds[i % seeds.length];
      if (this.grid[idx] && this.grid[idx].owner === "empty") {
        this.grid[idx].owner = pl.id;
      }
      i++;
    }
    this.recalc();
    this.pushFeed("Round started — first to " + GOAL_ACRES + " acres wins");
    return { ok: true };
  }

  recalc() {
    for (const p of this.players.values()) {
      p.blocks = 0;
      p.acres = 0;
    }
    for (const cell of this.grid) {
      if (cell.owner === "empty" || cell.owner === "blocked") continue;
      const p = this.players.get(cell.owner);
      if (p) {
        p.blocks += 1;
        p.acres += acresForCell(cell);
      }
    }
  }

  openCount() {
    return this.grid.filter((c) => c.owner === "empty").length;
  }

  claim(socketId, idx) {
    if (this.phase !== "play") return { ok: false, error: "Not playing" };
    if (!this.players.has(socketId)) return { ok: false, error: "Not in room" };
    const cell = this.grid[idx];
    if (!cell || cell.owner !== "empty") return { ok: false, error: "Can't claim that" };
    cell.owner = socketId;
    this.recalc();
    const p = this.players.get(socketId);
    this.pushFeed(`${p.name} took ${cell.label} (+${cell.acres} ac)`);
    return this.afterClaim(socketId);
  }

  afterClaim(socketId) {
    const p = this.players.get(socketId);
    if (p && p.acres >= GOAL_ACRES) {
      return this.finish(socketId, "goal");
    }
    if (this.openCount() === 0) {
      let best = null;
      for (const pl of this.players.values()) {
        if (!best || pl.acres > best.acres) best = pl;
      }
      return this.finish(best?.id || socketId, "full");
    }
    // Auto trivia: at most 3 per player per round, at acre milestones
    if (p && !this.activeTrivia) {
      const asked = p.triviaAsked || 0;
      const budget = p.triviaBudget || 2;
      if (asked < budget) {
        const marks = budget <= 1 ? [80] : budget === 2 ? [60, 140] : [40, 100, 160];
        if (p.acres >= marks[asked]) this.offerTrivia(socketId);
      }
    }
    return { ok: true, state: this.snapshot() };
  }

  offerTrivia(socketId) {
    const p = this.players.get(socketId);
    if (!p) return;
    const asked = p.triviaAsked || 0;
    const budget = p.triviaBudget || 2;
    if (asked >= budget || this.activeTrivia) return;
    const item = pickTrivia();
    p.triviaAsked = asked + 1;
    this.activeTrivia = { forId: socketId, item };
    this.pushFeed("Trivia (" + p.triviaAsked + "/" + budget + ")");
  }

  requestTrivia(socketId) {
    if (this.phase !== "play") return { ok: false, error: "Not playing" };
    if (this.activeTrivia) return { ok: false, error: "Trivia already up" };
    const p = this.players.get(socketId);
    if (!p) return { ok: false, error: "Nope" };
    const asked = p.triviaAsked || 0;
    const budget = p.triviaBudget || 2;
    if (asked >= budget) return { ok: false, error: "No trivia left this round" };
    if (p.blocks < 2) return { ok: false, error: "Claim 2 blocks first" };
    this.offerTrivia(socketId);
    return { ok: true, state: this.snapshot() };
  }

  answerTrivia(socketId, choiceIndex) {
    if (!this.activeTrivia || this.activeTrivia.forId !== socketId) {
      return { ok: false, error: "Not your trivia" };
    }
    const { item } = this.activeTrivia;
    const result = checkAnswer(item.id, choiceIndex);
    this.activeTrivia = null;
    const p = this.players.get(socketId);
    if (!p) return { ok: false, error: "Nope" };

    if (result.ok) {
      p.triviaCorrect += 1;
      // Power: steal one rival block or grab two empties
      const stolen = this.stealOne(socketId);
      if (!stolen) this.claimTwoOpen(socketId);
      this.recalc();
      this.pushFeed(`${p.name} nailed trivia — land grab!`);
      const after = this.afterClaim(socketId);
      return {
        ok: true,
        correct: true,
        teach: result.teach,
        state: after.state || this.snapshot(),
        finished: after.finished || false,
      };
    }

    this.pushFeed(`${p.name} missed trivia`);
    return {
      ok: true,
      correct: false,
      teach: result.teach,
      state: this.snapshot(),
      finished: false,
    };
  }

  stealOne(socketId) {
    const rivals = [];
    for (let i = 0; i < this.grid.length; i++) {
      const o = this.grid[i].owner;
      if (o !== "empty" && o !== "blocked" && o !== socketId) rivals.push(i);
    }
    if (!rivals.length) return false;
    const idx = rivals[Math.floor(Math.random() * rivals.length)];
    this.grid[idx].owner = socketId;
    return true;
  }

  claimTwoOpen(socketId) {
    const open = [];
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i].owner === "empty") open.push(i);
    }
    for (let n = 0; n < 2 && open.length; n++) {
      const j = Math.floor(Math.random() * open.length);
      const idx = open.splice(j, 1)[0];
      this.grid[idx].owner = socketId;
    }
  }

  finish(winnerId, reason) {
    this.phase = "result";
    this.winnerId = winnerId;
    this.activeTrivia = null;
    const w = this.players.get(winnerId);
    this.pushFeed(
      reason === "goal"
        ? `${w?.name || "Player"} hit ${GOAL_ACRES} acres!`
        : `Valley full — ${w?.name || "Player"} has the most acres`
    );
    return { ok: true, finished: true, state: this.snapshot() };
  }
}

export class RoomHub {
  constructor() {
    this.rooms = new Map(); // code -> Room
    this.socketRoom = new Map(); // socketId -> code
  }

  create(socketId, name, opts = {}) {
    this.leave(socketId);
    const room = new Room(socketId, name, opts);
    this.rooms.set(room.code, room);
    this.socketRoom.set(socketId, room.code);
    return room;
  }

  join(socketId, name, roomCode) {
    const code = String(roomCode || "")
      .trim()
      .toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: "Room not found — check the code" };
    this.leave(socketId);
    const res = room.addPlayer(socketId, name);
    if (!res.ok) return res;
    this.socketRoom.set(socketId, room.code);
    return { ok: true, room, shouldAutoStart: res.shouldAutoStart };
  }

  getFor(socketId) {
    const code = this.socketRoom.get(socketId);
    return code ? this.rooms.get(code) : null;
  }

  leave(socketId) {
    const code = this.socketRoom.get(socketId);
    if (!code) return null;
    const room = this.rooms.get(code);
    this.socketRoom.delete(socketId);
    if (!room) return null;
    const status = room.removePlayer(socketId);
    if (status === "empty") this.rooms.delete(code);
    return room;
  }
}
