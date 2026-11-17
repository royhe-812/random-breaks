"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, Heart, Search, Trophy, Zap } from "lucide-react"

// Same team order as BreakSpotsSheet, so both boards agree on which spots are
// sold for a given spots count: the first (total - available) teams are sold.
const TEAMS = [
  { city: "Rolex", name: "Submariner", abbrev: "SUB" },
  { city: "Omega", name: "Speedmaster", abbrev: "SPD" },
  { city: "Cartier", name: "Tank", abbrev: "TNK" },
  { city: "Patek Philippe", name: "Nautilus", abbrev: "NAU" },
  { city: "Seiko", name: "Presage", abbrev: "PRS" },
  { city: "Tudor", name: "Black Bay", abbrev: "BBY" },
  { city: "Breitling", name: "Navitimer", abbrev: "NAV" },
  { city: "TAG Heuer", name: "Carrera", abbrev: "CRR" },
  { city: "Grand Seiko", name: "Snowflake", abbrev: "SNW" },
  { city: "Hamilton", name: "Khaki Field", abbrev: "KHK" },
  { city: "Casio", name: "G-Shock", abbrev: "GSK" },
  { city: "Longines", name: "Spirit", abbrev: "SPT" },
  { city: "Citizen", name: "Promaster", abbrev: "PRO" },
  { city: "Oris", name: "Aquis", abbrev: "AQU" },
  { city: "Panerai", name: "Luminor", abbrev: "LUM" },
  { city: "IWC", name: "Pilot", abbrev: "PLT" },
  { city: "Zenith", name: "El Primero", abbrev: "ELP" },
  { city: "Audemars Piguet", name: "Royal Oak", abbrev: "ROK" },
  { city: "Vacheron Constantin", name: "Overseas", abbrev: "OVS" },
  { city: "Jaeger-LeCoultre", name: "Reverso", abbrev: "REV" },
  { city: "Hublot", name: "Big Bang", abbrev: "BGB" },
  { city: "Rolex", name: "Datejust", abbrev: "DTJ" },
  { city: "Omega", name: "Seamaster", abbrev: "SEA" },
  { city: "Tudor", name: "Pelagos", abbrev: "PEL" },
  { city: "Nomos", name: "Tangente", abbrev: "TAN" },
  { city: "Bell & Ross", name: "BR 03", abbrev: "BR3" },
  { city: "Rolex", name: "GMT-Master", abbrev: "GMT" },
  { city: "Seiko", name: "Prospex", abbrev: "PSX" },
  { city: "Breguet", name: "Marine", abbrev: "MAR" },
  { city: "Sinn", name: "556", abbrev: "S56" },
  { city: "Tissot", name: "PRX", abbrev: "PRX" },
  { city: "Timex", name: "Marlin", abbrev: "MRL" },
]

const BUYERS = ["KemMajed90", "BestCollector", "CardKing22", "SportsGuru", "PackRipper", "HobbyFan", "CardChaser", "BigHits", "TopPulls", "RookieHunter", "GradedGems", "WaxBreaker", "HitMaker", "CardShark", "BoxBreaker", "SerialHunter", "ChaseElite", "MintCondition", "RipNShip", "SlabHunter", "TheBreaker", "CardVault", "HitChaser", "PrizmKing", "WaxAddict", "GemMint10", "BreakRoom", "CardCove", "HotBoxes", "PullMaster", "AceCards", "BigLeague"]

type Filter = "available" | "sold"

const SPOT_PRICE = 21

function ProgressRing({ available, total, color, size = 22 }: { available: number; total: number; color: string; size?: number }) {
  const stroke = 3
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = total ? available / total : 0
  return (
    <svg className="-rotate-90 flex-shrink-0" width={size} height={size} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - ratio * c}
      />
    </svg>
  )
}

export function LiveSpotsBoard({
  isOpen,
  onClose,
  onBreakRules,
  spotsAvailable,
  spotsTotal,
  setTitle = "Sick watch surprise set!",
  setImage = "/images/watches-surprise-set.png",
  startingSoon = false,
}: {
  startingSoon?: boolean
  isOpen: boolean
  onClose: () => void
  onBreakRules?: () => void
  setTitle?: string
  setImage?: string
  spotsAvailable: number
  spotsTotal: number
}) {
  const [filter, setFilter] = useState<Filter>("available")
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
    if (filter === "available" && s.owner) return false
    if (filter === "sold" && !s.owner) return false
    if (!q) return true
    return `${s.city} ${s.name} ${s.abbrev} ${s.owner ?? ""}`.toLowerCase().includes(q)
  })

  const chipBase = "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
  const chipIdle = "border border-white/70 bg-black text-white"
  const chipOn = "border border-white bg-white text-black"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-x-0 bottom-0 top-[6%] z-50 flex flex-col overflow-hidden rounded-t-3xl bg-[#1a1a1a] text-white"
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-board-title"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="flex justify-center pb-1 pt-2">
            <div className="h-1 w-10 rounded-full bg-white/30" />
          </div>

          <div className="flex items-center gap-3 px-4 py-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-black"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h2 id="live-board-title" className="text-xl font-bold">
              Break spots
            </h2>
          </div>

          <div className="px-4 pt-1">
            <label className="flex items-center gap-2 rounded-full border border-white/50 px-4 py-2.5">
              <Search className="h-5 w-5 text-white/60" aria-hidden="true" />
              <span className="sr-only">Search item title</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search item title"
                className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/55"
              />
            </label>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3" role="group" aria-label="Filter spots">
            <button
              type="button"
              onClick={() => setFilter("available")}
              aria-pressed={filter === "available"}
              className={`${chipBase} ${filter === "available" ? chipOn : chipIdle}`}
            >
              Available
            </button>
            <button type="button" disabled className={`${chipBase} ${chipIdle} flex items-center gap-1.5 text-white/60`}>
              <Zap className="h-4 w-4" aria-hidden="true" />
              Deals
            </button>
            <button type="button" disabled className={`${chipBase} ${chipIdle}`}>
              Auctions
            </button>
            <button type="button" disabled className={`${chipBase} ${chipIdle} text-white/60`}>
              Buy It Now
            </button>
            <button type="button" disabled aria-label="Watched" className={`${chipBase} ${chipIdle} px-3.5`}>
              <Heart className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setFilter("sold")}
              aria-pressed={filter === "sold"}
              className={`${chipBase} ${filter === "sold" ? chipOn : chipIdle}`}
            >
              Sold
            </button>
          </div>

          <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-8">
            <div className="rounded-3xl bg-[#2f2f2f] p-4">
              <div className="flex gap-3">
                <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-[#3a3a3a]">
                  <img src={setImage} alt={setTitle} className="h-full w-full object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-start">
                  {startingSoon ? (
                    <span className="rounded-full border border-white/35 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white/55">
                      Starting soon
                    </span>
                  ) : (
                    <span className="rounded-full border border-[#4d8bff] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#6ea0ff]">
                      Featured
                    </span>
                  )}
                  <h3 className="mt-1.5 line-clamp-2 text-lg font-medium leading-6">{setTitle}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <ProgressRing available={openCount} total={total} color={startingSoon ? "#4CE160" : "#eab308"} />
                    <span className="text-base text-white/85">
                      {openCount}/{total} spots available
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onBreakRules}
                    className="mt-2.5 rounded-full border border-white/80 px-5 py-2 text-base font-medium transition-colors hover:bg-white/10"
                  >
                    Break rules
                  </button>
                </div>
              </div>

              {visible.length === 0 ? (
                <p className="pt-8 text-center text-sm text-white/50">
                  {filter === "available" && openCount === 0 ? "Every spot has been sold." : "No spots match your search."}
                </p>
              ) : (
                <ul className="mt-3">
                  {visible.map((s) => (
                    <li key={s.abbrev} className="flex items-center justify-between gap-3 border-b border-white/25 py-3 last:border-b-0">
                      <div className="min-w-0">
                        <p className="truncate text-lg leading-6">
                          {s.city} {s.name}
                        </p>
                        {s.owner && (
                          <p className="mt-1 flex items-center gap-1.5 text-lg leading-6">
                            <span className="font-bold">${SPOT_PRICE}.00</span>
                            <Trophy className="h-4 w-4 flex-shrink-0 text-[#f5b90b]" aria-hidden="true" />
                            <span className="truncate font-bold">{s.owner}</span>
                          </p>
                        )}
                      </div>
                      {s.owner ? (
                        <span className="flex-shrink-0 rounded-full border border-[#ff5a4d] px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#ff5a4d]">
                          Sold out
                        </span>
                      ) : (
                        <span className="flex-shrink-0 rounded-full border border-white/40 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white/55">
                          Available
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
