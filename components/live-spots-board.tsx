"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Search, X } from "lucide-react"

// Same team order as BreakSpotsSheet, so both boards agree on which spots are
// sold for a given spots count: the first (total - available) teams are sold.
const TEAMS = [
  { city: "Kansas City", name: "Chiefs", abbrev: "KC" },
  { city: "Philadelphia", name: "Eagles", abbrev: "PHI" },
  { city: "Dallas", name: "Cowboys", abbrev: "DAL" },
  { city: "San Francisco", name: "49ers", abbrev: "SF" },
  { city: "Buffalo", name: "Bills", abbrev: "BUF" },
  { city: "Miami", name: "Dolphins", abbrev: "MIA" },
  { city: "Baltimore", name: "Ravens", abbrev: "BAL" },
  { city: "Detroit", name: "Lions", abbrev: "DET" },
  { city: "Green Bay", name: "Packers", abbrev: "GB" },
  { city: "Cincinnati", name: "Bengals", abbrev: "CIN" },
  { city: "New York", name: "Jets", abbrev: "NYJ" },
  { city: "Denver", name: "Broncos", abbrev: "DEN" },
  { city: "Los Angeles", name: "Chargers", abbrev: "LAC" },
  { city: "Indianapolis", name: "Colts", abbrev: "IND" },
  { city: "Houston", name: "Texans", abbrev: "HOU" },
  { city: "Pittsburgh", name: "Steelers", abbrev: "PIT" },
  { city: "New England", name: "Patriots", abbrev: "NE" },
  { city: "New York", name: "Giants", abbrev: "NYG" },
  { city: "Washington", name: "Commanders", abbrev: "WAS" },
  { city: "Chicago", name: "Bears", abbrev: "CHI" },
  { city: "Minnesota", name: "Vikings", abbrev: "MIN" },
  { city: "New Orleans", name: "Saints", abbrev: "NO" },
  { city: "Atlanta", name: "Falcons", abbrev: "ATL" },
  { city: "Carolina", name: "Panthers", abbrev: "CAR" },
  { city: "Tampa Bay", name: "Buccaneers", abbrev: "TB" },
  { city: "Arizona", name: "Cardinals", abbrev: "ARI" },
  { city: "Los Angeles", name: "Rams", abbrev: "LAR" },
  { city: "Seattle", name: "Seahawks", abbrev: "SEA" },
  { city: "Las Vegas", name: "Raiders", abbrev: "LV" },
  { city: "Jacksonville", name: "Jaguars", abbrev: "JAX" },
  { city: "Tennessee", name: "Titans", abbrev: "TEN" },
  { city: "Cleveland", name: "Browns", abbrev: "CLE" },
]

const BUYERS = ["KemMajed90", "BestCollector", "CardKing22", "SportsGuru", "PackRipper", "HobbyFan", "CardChaser", "BigHits", "TopPulls", "RookieHunter", "GradedGems", "WaxBreaker", "HitMaker", "CardShark", "BoxBreaker", "SerialHunter", "ChaseElite", "MintCondition", "RipNShip", "SlabHunter", "TheBreaker", "CardVault", "HitChaser", "PrizmKing", "WaxAddict", "GemMint10", "BreakRoom", "CardCove", "HotBoxes", "PullMaster", "AceCards", "BigLeague"]

const logoFor = (abbrev: string) =>
  `https://a.espncdn.com/i/teamlogos/nfl/500/${abbrev === "WAS" ? "wsh" : abbrev.toLowerCase()}.png`

type Filter = "all" | "open" | "sold"

export function LiveSpotsBoard({
  isOpen,
  onClose,
  spotsAvailable,
  spotsTotal,
}: {
  isOpen: boolean
  onClose: () => void
  spotsAvailable: number
  spotsTotal: number
}) {
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")

  const total = Math.min(TEAMS.length, spotsTotal)
  const soldCount = Math.min(total, Math.max(0, total - spotsAvailable))
  const openCount = total - soldCount

  const spots = useMemo(
    () =>
      TEAMS.slice(0, total).map((team, i) => ({
        ...team,
        owner: i < soldCount ? BUYERS[i % BUYERS.length] : null,
      })),
    [total, soldCount],
  )

  const q = query.trim().toLowerCase()
  const visible = spots.filter((s) => {
    if (filter === "open" && s.owner) return false
    if (filter === "sold" && !s.owner) return false
    if (!q) return true
    return `${s.city} ${s.name} ${s.abbrev} ${s.owner ?? ""}`.toLowerCase().includes(q)
  })

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: `All ${total}` },
    { id: "open", label: `Open ${openCount}` },
    { id: "sold", label: `Sold ${soldCount}` },
  ]

  const soldPct = total ? (soldCount / total) * 100 : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col bg-[#0d0d0d] text-white"
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-board-title"
          initial={{ opacity: 0, scale: 0.96, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 40 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-14">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF4444]" aria-hidden="true" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Live board</p>
              </div>
              <h2 id="live-board-title" className="mt-1 text-xl font-bold leading-6">
                {openCount} of {total} spots available
              </h2>
              <p className="mt-0.5 text-xs text-white/55">
                {soldCount} sold · {openCount} left to be assigned
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close live board"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Fill meter */}
          <div className="px-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#4CE160] transition-[width] duration-300" style={{ width: `${soldPct}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-white/40">
              <span>{Math.round(soldPct)}% filled</span>
              <span>{openCount} open</span>
            </div>
          </div>

          {/* Filters + search */}
          <div className="flex items-center gap-2 px-4 pt-3">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  filter === f.id ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="px-4 pt-2">
            <label className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
              <Search className="h-4 w-4 text-white/45" aria-hidden="true" />
              <span className="sr-only">Search teams or buyers</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams or buyers"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
              />
            </label>
          </div>

          {/* Team grid */}
          <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6 pt-3">
            {visible.length === 0 ? (
              <p className="pt-8 text-center text-sm text-white/50">
                {filter === "open" && openCount === 0 ? "Every spot has been assigned." : "No spots match your search."}
              </p>
            ) : (
              <ul className="grid grid-cols-3 gap-2">
                {visible.map((s) => (
                  <li
                    key={s.abbrev}
                    className={`flex flex-col items-center gap-1.5 rounded-xl px-1.5 pb-2 pt-2.5 ring-1 ${
                      s.owner ? "bg-white/[0.04] ring-white/10" : "bg-[#4CE160]/[0.07] ring-[#4CE160]/40"
                    }`}
                  >
                    <img
                      src={logoFor(s.abbrev)}
                      alt=""
                      className={`h-9 w-9 object-contain ${s.owner ? "opacity-60" : ""}`}
                      loading="lazy"
                    />
                    <span className="w-full truncate text-center text-xs font-semibold leading-4">{s.name}</span>
                    {s.owner ? (
                      <span className="w-full truncate rounded-full bg-white/10 px-1.5 py-0.5 text-center text-[10px] font-medium leading-3 text-white/75">
                        @{s.owner}
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#4CE160] px-2 py-0.5 text-[10px] font-bold leading-3 text-black">
                        OPEN
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
