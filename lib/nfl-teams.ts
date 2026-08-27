/**
 * All 32 NFL teams.
 *
 * The existing `teams` array in `components/team-spinner.tsx` is a private
 * const with only 17 entries, which can't express the "start from all 32 and
 * shrink to one" behaviour the explorations zone is built to test. This is the
 * complete league, ordered by division so that taking the first N teams still
 * yields a plausible-looking mixed set rather than one conference.
 *
 * The shape is intentionally identical to the exported `Team` interface in
 * `team-spinner.tsx` so a team from here can be handed to that component
 * without a mapping step.
 */
export interface NflTeam {
  name: string
  city: string
  abbrev: string
  /** Primary brand colour, used as the tile fill. */
  color: string
  /** Secondary brand colour, used for accents/borders. */
  secondary: string
}

export const NFL_TEAMS: NflTeam[] = [
  // AFC East
  { name: "Bills", city: "Buffalo", abbrev: "BUF", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", city: "Miami", abbrev: "MIA", color: "#008E97", secondary: "#FC4C02" },
  { name: "Patriots", city: "New England", abbrev: "NE", color: "#002244", secondary: "#C60C30" },
  { name: "Jets", city: "New York", abbrev: "NYJ", color: "#125740", secondary: "#FFFFFF" },
  // NFC East
  { name: "Cowboys", city: "Dallas", abbrev: "DAL", color: "#003594", secondary: "#869397" },
  { name: "Giants", city: "New York", abbrev: "NYG", color: "#0B2265", secondary: "#A71930" },
  { name: "Eagles", city: "Philadelphia", abbrev: "PHI", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Commanders", city: "Washington", abbrev: "WAS", color: "#5A1414", secondary: "#FFB612" },
  // AFC North
  { name: "Ravens", city: "Baltimore", abbrev: "BAL", color: "#241773", secondary: "#9E7C0C" },
  { name: "Bengals", city: "Cincinnati", abbrev: "CIN", color: "#FB4F14", secondary: "#000000" },
  { name: "Browns", city: "Cleveland", abbrev: "CLE", color: "#311D00", secondary: "#FF3C00" },
  { name: "Steelers", city: "Pittsburgh", abbrev: "PIT", color: "#101820", secondary: "#FFB612" },
  // NFC North
  { name: "Bears", city: "Chicago", abbrev: "CHI", color: "#0B162A", secondary: "#C83803" },
  { name: "Lions", city: "Detroit", abbrev: "DET", color: "#0076B6", secondary: "#B0B7BC" },
  { name: "Packers", city: "Green Bay", abbrev: "GB", color: "#203731", secondary: "#FFB612" },
  { name: "Vikings", city: "Minnesota", abbrev: "MIN", color: "#4F2683", secondary: "#FFC62F" },
  // AFC South
  { name: "Texans", city: "Houston", abbrev: "HOU", color: "#03202F", secondary: "#A71930" },
  { name: "Colts", city: "Indianapolis", abbrev: "IND", color: "#002C5F", secondary: "#A2AAAD" },
  { name: "Jaguars", city: "Jacksonville", abbrev: "JAX", color: "#006778", secondary: "#D7A22A" },
  { name: "Titans", city: "Tennessee", abbrev: "TEN", color: "#0C2340", secondary: "#4B92DB" },
  // NFC South
  { name: "Falcons", city: "Atlanta", abbrev: "ATL", color: "#A71930", secondary: "#000000" },
  { name: "Panthers", city: "Carolina", abbrev: "CAR", color: "#0085CA", secondary: "#101820" },
  { name: "Saints", city: "New Orleans", abbrev: "NO", color: "#101820", secondary: "#D3BC8D" },
  { name: "Buccaneers", city: "Tampa Bay", abbrev: "TB", color: "#D50A0A", secondary: "#0A0A08" },
  // AFC West
  { name: "Broncos", city: "Denver", abbrev: "DEN", color: "#FB4F14", secondary: "#002244" },
  { name: "Chiefs", city: "Kansas City", abbrev: "KC", color: "#E31837", secondary: "#FFB81C" },
  { name: "Raiders", city: "Las Vegas", abbrev: "LV", color: "#101820", secondary: "#A5ACAF" },
  { name: "Chargers", city: "Los Angeles", abbrev: "LAC", color: "#0080C6", secondary: "#FFC20E" },
  // NFC West
  { name: "Cardinals", city: "Arizona", abbrev: "ARI", color: "#97233F", secondary: "#FFB612" },
  { name: "Rams", city: "Los Angeles", abbrev: "LAR", color: "#003594", secondary: "#FFD100" },
  { name: "49ers", city: "San Francisco", abbrev: "SF", color: "#AA0000", secondary: "#B3995D" },
  { name: "Seahawks", city: "Seattle", abbrev: "SEA", color: "#002244", secondary: "#69BE28" },
]

/** The full league size, so callers don't hardcode 32. */
export const LEAGUE_SIZE = NFL_TEAMS.length
