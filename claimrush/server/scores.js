import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.CLAIMRUSH_DATA_DIR
  ? path.resolve(process.env.CLAIMRUSH_DATA_DIR)
  : path.join(__dirname, "..", "data");
const SCORES_FILE = path.join(DATA_DIR, "scores.json");
const CAP = 100;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadScores() {
  ensureDir();
  if (!fs.existsSync(SCORES_FILE)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(SCORES_FILE, "utf8"));
    if (!Array.isArray(j)) return [];
    return j
      .filter((r) => r && r.name && Number.isFinite(Number(r.score)))
      .map((r) => ({
        name: String(r.name).slice(0, 24),
        score: Number(r.score),
        at: String(r.at || new Date().toISOString()),
        meta: r.meta && typeof r.meta === "object" ? r.meta : undefined,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, CAP);
  } catch {
    return [];
  }
}

export function saveScores(scores) {
  ensureDir();
  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores.slice(0, CAP), null, 2) + "\n", "utf8");
}

/** Score = acres + triviaCorrect * 25 (Emota-flavored points). */
export function computeScore(acres, triviaCorrect) {
  return Math.max(0, Math.floor(acres + triviaCorrect * 25));
}

export function submitScore(scores, { name, acres, triviaCorrect, mode }) {
  const row = {
    name: String(name || "Player").slice(0, 24),
    score: computeScore(acres, triviaCorrect),
    at: new Date().toISOString(),
    meta: {
      acres: Math.max(0, Math.floor(acres)),
      trivia: Math.max(0, Math.floor(triviaCorrect)),
      mode: String(mode || "solo").slice(0, 16),
    },
  };
  const next = [row, ...scores]
    .sort((a, b) => b.score - a.score || a.at.localeCompare(b.at))
    .slice(0, CAP);
  saveScores(next);
  return { scores: next, row };
}
