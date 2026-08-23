/**
 * Puyallup Valley claim map — simplified from the Blender 1885 blockout.
 * Origin vibe: Pioneer Park center, river north, hops south, South Hill edge.
 * Scale fiction for play: 1 average block ≈ 10 acres (hops/town/hill vary).
 */

export const COLS = 8;
export const ROWS = 8;

/** terrain → acres when claimed */
export const TERRAIN_ACRES = {
  river: 0,
  farm: 10,
  town: 12,
  pioneer: 25,
  hops: 15,
  hill: 8,
};

export const TERRAIN_LABEL = {
  river: "Puyallup River",
  farm: "Valley farm",
  town: "Downtown",
  pioneer: "Pioneer Park",
  hops: "Hop field",
  hill: "South Hill",
};

/**
 * Rows: north → south (matches Blender +Y north).
 * R river · F farm · T town · P pioneer · H hops · S south hill
 */
const LAYOUT = [
  "FFFFFFFF", // north flats
  "RRRRRRRR", // river band
  "FFTTTFFF", // town approaches
  "FTTPTTFS", // Pioneer Park core
  "HHTTTHHS", // downtown / hop edge
  "HHHHHHHS", // hop fields
  "HHHHHFFS", // toward fairgrounds south
  "SSSSSSSS", // South Hill rise
];

const CHAR = {
  R: "river",
  F: "farm",
  T: "town",
  P: "pioneer",
  H: "hops",
  S: "hill",
};

export function buildValleyGrid() {
  const cells = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const terrain = CHAR[LAYOUT[y][x]] || "farm";
      const blocked = terrain === "river";
      cells.push({
        x,
        y,
        terrain,
        label: TERRAIN_LABEL[terrain],
        acres: TERRAIN_ACRES[terrain] || 0,
        owner: blocked ? "blocked" : "empty",
      });
    }
  }
  return cells;
}

export function acresForCell(cell) {
  if (!cell || cell.owner === "blocked" || cell.owner === "empty") return 0;
  return TERRAIN_ACRES[cell.terrain] || 10;
}

export function mapPublic() {
  return {
    cols: COLS,
    rows: ROWS,
    acresByTerrain: TERRAIN_ACRES,
    labels: TERRAIN_LABEL,
    cells: buildValleyGrid().map((c) => ({
      terrain: c.terrain,
      label: c.label,
      acres: c.acres,
    })),
  };
}
