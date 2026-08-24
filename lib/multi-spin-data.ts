/* ── Shared data for the Multi Spin Testing Zone ──
   Both the resting pill row and the spinner drum draw from the same spots so a
   treatment can be judged against identical names in both places. */

export interface Spot {
  city: string
  team: string
  abbrev: string
  color: string
  /** Up to 3 star players on this spot. */
  players: string[]
}

export type DataMode = "teams" | "players"

/** Separator between players inside one spot label. */
export const SEP = " · "

/**
 * The pool the drum spins through. Ten real teams, each with three star
 * players, so the reel contains the genuine worst case rather than a
 * hand-picked long name. "Washington Commanders" is the widest team name and
 * is what the live pill width (255px) was originally sized around.
 */
export const POOL: Spot[] = [
  {
    city: "San Francisco",
    team: "49ers",
    abbrev: "SF",
    color: "#AA0000",
    players: ["Christian McCaffrey", "Brandon Aiyuk", "George Kittle"],
  },
  {
    city: "Detroit",
    team: "Lions",
    abbrev: "DET",
    color: "#0076B6",
    players: ["Amon-Ra St. Brown", "Jahmyr Gibbs", "Sam LaPorta"],
  },
  {
    city: "Cincinnati",
    team: "Bengals",
    abbrev: "CIN",
    color: "#FB4F14",
    players: ["Ja'Marr Chase", "Tee Higgins", "Joe Burrow"],
  },
  {
    city: "Kansas City",
    team: "Chiefs",
    abbrev: "KC",
    color: "#E31837",
    players: ["Patrick Mahomes", "Travis Kelce", "Isiah Pacheco"],
  },
  {
    city: "Philadelphia",
    team: "Eagles",
    abbrev: "PHI",
    color: "#004C54",
    players: ["Jalen Hurts", "A.J. Brown", "DeVonta Smith"],
  },
  {
    city: "Miami",
    team: "Dolphins",
    abbrev: "MIA",
    color: "#008E97",
    players: ["Tyreek Hill", "Jaylen Waddle", "De'Von Achane"],
  },
  {
    city: "Washington",
    team: "Commanders",
    abbrev: "WAS",
    color: "#5A1414",
    players: ["Jayden Daniels", "Terry McLaurin", "Brian Robinson Jr."],
  },
  {
    city: "Minnesota",
    team: "Vikings",
    abbrev: "MIN",
    color: "#4F2683",
    players: ["Justin Jefferson", "Jordan Addison", "T.J. Hockenson"],
  },
  {
    city: "Jacksonville",
    team: "Jaguars",
    abbrev: "JAX",
    color: "#006778",
    players: ["Trevor Lawrence", "Brian Thomas Jr.", "Travis Etienne"],
  },
  {
    city: "Los Angeles",
    team: "Chargers",
    abbrev: "LAC",
    color: "#0080C6",
    players: ["Justin Herbert", "Ladd McConkey", "Quentin Johnston"],
  },
]

/**
 * The three spots a single buyer landed, used by the resting pill row. Kept
 * separate from POOL so one spot can carry only two players — the real card
 * has to survive an uneven mix, not just the uniform three.
 */
export const LANDED_SPOTS: Spot[] = [
  POOL[0],
  POOL[1],
  { ...POOL[2], players: ["Ja'Marr Chase", "Tee Higgins"] },
]

/* Name suffixes that must not be mistaken for the surname when abbreviating. */
const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"])

/** "Christian McCaffrey" -> "C. McCaffrey", preserving Jr./III style suffixes. */
export function abbreviatePlayer(full: string) {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  let last = parts[parts.length - 1]
  if (SUFFIXES.has(last.replace(/\./g, "").toLowerCase()) && parts.length > 2) {
    last = parts[parts.length - 2]
  }
  return `${parts[0][0]}. ${last}`
}

/** The complete, untruncated label for a spot. */
export function fullLabel(spot: Spot, data: DataMode, sep = SEP) {
  if (data === "teams") return `${spot.city} ${spot.team}`
  return spot.players.join(sep)
}

/** The shortest honest label: team code, or initial + surname per player. */
export function shortLabel(spot: Spot, data: DataMode, sep = SEP) {
  if (data === "teams") return spot.team
  return spot.players.map(abbreviatePlayer).join(sep)
}

/* ────────────────────────────────────────────────────────────────────────────
   Scalable spot model
   ────────────────────────────────────────────────────────────────────────────
   The `Spot` shape above models a spot as "a team, which has players". That is
   wrong for real breaks and it is what broke the first recommendation:

     - A spot can be ONE team, ONE player, or SEVERAL of either, mixed.
     - Players are not derivable from a team. Rosters change mid-season, so any
       team -> players mapping is stale the moment someone is traded.
     - There is no reliable short code for a player name, and initials collide.

   So a spot is just an ORDERED LIST OF LITERAL ENTRIES, and the only stable
   identifier is the spot's NUMBER — buyers own "spot 7" regardless of what it
   is later relabelled to. Nothing here is derived from anything else. */

export type EntryKind = "team" | "player"

export interface SpotEntry {
  /** Rendered verbatim. Never abbreviated, never used to look anything up. */
  name: string
  kind: EntryKind
}

export interface RosterSpot {
  /** 1-based spot number. The durable handle; survives trades and relabelling. */
  n: number
  entries: SpotEntry[]
}

const team = (name: string): SpotEntry => ({ name, kind: "team" })
const player = (name: string): SpotEntry => ({ name, kind: "player" })

/**
 * A deliberately uneven break: every shape a spot can take, including the ones
 * that broke the token approach. Order is intentional — a single short team
 * name sits next to a three-player spot so the layout is judged on the jump
 * between them, not on a uniform set.
 */
export const ROSTER_SPOTS: RosterSpot[] = [
  { n: 1, entries: [team("Kansas City Chiefs")] },
  { n: 2, entries: [player("Christian McCaffrey")] },
  {
    n: 3,
    entries: [
      player("Amon-Ra St. Brown"),
      player("Jahmyr Gibbs"),
      player("Sam LaPorta"),
    ],
  },
  { n: 4, entries: [team("New York Giants"), team("New York Jets")] },
  {
    n: 5,
    /* Mixed kinds in one spot — impossible to express as "a team plus its
       roster", which is exactly the case the first attempt could not render. */
    entries: [team("Washington Commanders"), player("Brian Robinson Jr.")],
  },
  { n: 6, entries: [player("Ja'Marr Chase"), player("Tee Higgins")] },
  {
    n: 7,
    entries: [
      player("Victor Wembanyama"),
      player("Cade Cunningham"),
      player("Paolo Banchero"),
    ],
  },
  { n: 8, entries: [team("Green Bay Packers")] },
  { n: 9, entries: [player("Patrick Mahomes"), player("Travis Kelce")] },
  { n: 10, entries: [team("Jacksonville Jaguars"), player("Trevor Lawrence")] },
  { n: 11, entries: [player("Shai Gilgeous-Alexander")] },
  { n: 12, entries: [team("Tampa Bay Buccaneers")] },
]

/** Filler used only to pad a break out to a larger spot count. */
const FILLER: SpotEntry[][] = [
  [team("Denver Broncos")],
  [player("Justin Jefferson"), player("Jordan Addison")],
  [team("Baltimore Ravens")],
  [player("Anthony Edwards")],
  [team("Los Angeles Chargers"), team("Los Angeles Rams")],
]

/**
 * A break of exactly `count` spots. Used to prove the layout holds at the top
 * of the range (the live card advertises 32) rather than asserting that it does.
 */
export function makeBreak(count: number): RosterSpot[] {
  const out: RosterSpot[] = []
  for (let i = 0; i < count; i++) {
    const src = i < ROSTER_SPOTS.length
      ? ROSTER_SPOTS[i].entries
      : FILLER[(i - ROSTER_SPOTS.length) % FILLER.length]
    out.push({ n: i + 1, entries: src })
  }
  return out
}

/** Flat label for announcements and measurement. Joins entries literally. */
export function spotLabel(spot: RosterSpot, sep = SEP) {
  return spot.entries.map((e) => e.name).join(sep)
}
