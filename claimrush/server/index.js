import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { RoomHub } from "./room.js";
import { loadScores, submitScore } from "./scores.js";
import { ACRES_PER_BLOCK, GOAL_ACRES } from "./trivia.js";
import { mapPublic } from "./map.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SIMPULY = path.join(ROOT, "..");
const PORT = Number(process.env.PORT || process.env.CLAIMRUSH_PORT) || 5177;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true },
});

const hub = new RoomHub();
let scores = loadScores();
const lastScoreAt = new Map();

app.use(express.static(ROOT));
// Blender 1885 stills / flyover live in the parent simpuy folder
app.use("/valley", express.static(SIMPULY));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    rooms: hub.rooms.size,
    acresPerBlock: ACRES_PER_BLOCK,
    goalAcres: GOAL_ACRES,
    map: "puyallup-1885",
  });
});

app.get("/api/config", (_req, res) => {
  res.json({
    acresPerBlock: ACRES_PER_BLOCK,
    goalAcres: GOAL_ACRES,
    map: "puyallup-1885",
    scores: scores.slice(0, 20),
  });
});

app.get("/api/map", (_req, res) => {
  res.json(mapPublic());
});

function emitRoom(room) {
  if (!room) return;
  const snap = room.snapshot();
  for (const p of room.players.keys()) {
    io.to(p).emit("claim:state", snap);
  }
}

io.on("connection", (socket) => {
  socket.emit("scores:list", scores.slice(0, 40));
  socket.emit("claim:config", {
    acresPerBlock: ACRES_PER_BLOCK,
    goalAcres: GOAL_ACRES,
  });

  socket.on("claim:create", (payload) => {
    const name = String(payload?.name || "Player").slice(0, 16);
    const mode = payload?.mode === "1v1" ? "1v1" : "open";
    const room = hub.create(socket.id, name, { mode });
    socket.join(room.code);
    socket.emit("claim:joined", {
      code: room.code,
      you: socket.id,
      mode: room.mode,
      maxPlayers: room.maxPlayers,
    });
    emitRoom(room);
  });

  socket.on("claim:join", (payload) => {
    const name = String(payload?.name || "Player").slice(0, 16);
    const res = hub.join(socket.id, name, payload?.code);
    if (!res.ok) {
      socket.emit("claim:error", { error: res.error });
      return;
    }
    socket.join(res.room.code);
    socket.emit("claim:joined", {
      code: res.room.code,
      you: socket.id,
      mode: res.room.mode,
      maxPlayers: res.room.maxPlayers,
    });
    emitRoom(res.room);
    if (res.shouldAutoStart) {
      const hostId = [...res.room.players.values()].find((p) => p.host)?.id;
      const started = res.room.start(hostId || socket.id, true);
      if (started.ok) emitRoom(res.room);
    }
  });

  socket.on("claim:ready", (payload) => {
    const room = hub.getFor(socket.id);
    if (!room) return;
    room.setReady(socket.id, payload?.ready !== false);
    emitRoom(room);
  });

  socket.on("claim:start", () => {
    const room = hub.getFor(socket.id);
    if (!room) return;
    const res = room.start(socket.id);
    if (!res.ok) {
      socket.emit("claim:error", { error: res.error });
      return;
    }
    emitRoom(room);
  });

  socket.on("claim:tap", (payload) => {
    const room = hub.getFor(socket.id);
    if (!room) return;
    const idx = Number(payload?.idx);
    if (!Number.isInteger(idx)) return;
    const res = room.claim(socket.id, idx);
    if (!res.ok) {
      socket.emit("claim:error", { error: res.error });
      return;
    }
    emitRoom(room);
    if (res.finished) maybeAutoScore(room);
  });

  socket.on("claim:trivia:request", () => {
    const room = hub.getFor(socket.id);
    if (!room) return;
    const res = room.requestTrivia(socket.id);
    if (!res.ok) {
      socket.emit("claim:error", { error: res.error });
      return;
    }
    emitRoom(room);
  });

  socket.on("claim:trivia:answer", (payload) => {
    const room = hub.getFor(socket.id);
    if (!room) return;
    const res = room.answerTrivia(socket.id, payload?.choice);
    if (!res.ok) {
      socket.emit("claim:error", { error: res.error });
      return;
    }
    socket.emit("claim:trivia:result", {
      correct: res.correct,
      teach: res.teach,
    });
    emitRoom(room);
    if (res.finished) maybeAutoScore(room);
  });

  socket.on("scores:submit", (payload) => {
    const now = Date.now();
    if ((lastScoreAt.get(socket.id) || 0) + 8000 > now) return;
    lastScoreAt.set(socket.id, now);
    const name = String(payload?.name || "Player").slice(0, 24);
    const acres = Number(payload?.acres) || 0;
    const triviaCorrect = Number(payload?.triviaCorrect) || 0;
    const mode = String(payload?.mode || "solo").slice(0, 16);
    const { scores: next, row } = submitScore(scores, {
      name,
      acres,
      triviaCorrect,
      mode,
    });
    scores = next;
    io.emit("scores:list", scores.slice(0, 40));
    socket.emit("scores:saved", row);
  });

  socket.on("scores:list:request", () => {
    socket.emit("scores:list", scores.slice(0, 40));
  });

  socket.on("disconnect", () => {
    const room = hub.leave(socket.id);
    if (room) emitRoom(room);
    lastScoreAt.delete(socket.id);
  });
});

function maybeAutoScore(room) {
  if (!room || room.phase !== "result") return;
  for (const p of room.players.values()) {
    const { scores: next } = submitScore(scores, {
      name: p.name,
      acres: p.acres,
      triviaCorrect: p.triviaCorrect,
      mode: "multi",
    });
    scores = next;
  }
  io.emit("scores:list", scores.slice(0, 40));
}

server.listen(PORT, () => {
  console.log(`CLAIMRUSH http://127.0.0.1:${PORT}`);
  console.log(`1 block = ${ACRES_PER_BLOCK} acres · goal ${GOAL_ACRES} acres`);
});
