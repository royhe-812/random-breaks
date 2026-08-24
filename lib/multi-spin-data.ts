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
