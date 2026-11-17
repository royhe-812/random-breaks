"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, Heart, Search, Truck, Zap } from "lucide-react"

export type SurpriseSetId = "sick-watch" | "dive-watch"

export const SURPRISE_SETS: Record<SurpriseSetId, { title: string; image: string; total: number; status: "featured" | "starting-soon" }> = {
  "sick-watch": {
    title: "Sick watch surprise set!",
    image: "/images/watches-surprise-set.png",
    total: 32,
    status: "featured",
  },
  "dive-watch": {
    title: "Vintage dive watch surprise set",
    image: "/images/watches-surprise-set-2.png",
    total: 32,
    status: "starting-soon",
  },
}

type LineupEntry =
  | { kind: "set"; id: SurpriseSetId }
  | { kind: "listing"; id: string; title: string; price: number; shipping: number; image: string }

// Add more entries here to extend the lineup: surprise sets open the spots
// board, listings are regular Buy It Now items.
const LINEUP: LineupEntry[] = [
  { kind: "set", id: "sick-watch" },
  { kind: "set", id: "dive-watch" },
  {
    kind: "listing",
    id: "bin-chrono",
    title: "Navy Dial Steel Chronograph Automatic Wristwatch",
    price: 1280,
    shipping: 7,
    image: "/images/watch-listing-bin.png",
  },
]

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

export function ItemLineupSheet({
  isOpen,
  onClose,
  onSeeSpots,
  featuredAvailable,
}: {
  isOpen: boolean
  onClose: () => void
  onSeeSpots: (id: SurpriseSetId) => void
  /** Live spots left in the featured set (the one being broken right now). */
  featuredAvailable: number
}) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()

  const entries = LINEUP.filter((e) => {
    if (!q) return true
    const title = e.kind === "set" ? SURPRISE_SETS[e.id].title : e.title
    return title.toLowerCase().includes(q)
  })

  const chipBase = "flex-shrink-0 rounded-full border border-white/70 bg-black px-4 py-2 text-sm font-medium whitespace-nowrap"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-x-0 bottom-0 top-[6%] z-50 flex flex-col overflow-hidden rounded-t-3xl bg-[#1a1a1a] text-white"
          role="dialog"
          aria-modal="true"
          aria-labelledby="item-lineup-title"
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
            <h2 id="item-lineup-title" className="text-xl font-bold">
              Item lineup
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

          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3" role="group" aria-label="Filter items">
            <button type="button" aria-pressed="true" className="flex-shrink-0 rounded-full border border-white bg-white px-4 py-2 text-sm font-medium text-black">
              Available
            </button>
            <button type="button" disabled className={`${chipBase} flex items-center gap-1.5 text-white/60`}>
              <Zap className="h-4 w-4" aria-hidden="true" />
              Deals
            </button>
            <button type="button" disabled className={chipBase}>
              Auctions
            </button>
            <button type="button" disabled className={`${chipBase} text-white/60`}>
              Buy It Now
            </button>
            <button type="button" disabled aria-label="Watched" className={`${chipBase} px-3.5`}>
              <Heart className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-8">
            {entries.length === 0 && <p className="pt-8 text-center text-sm text-white/50">No items match your search.</p>}
            <ul className="flex flex-col gap-4">
              {entries.map((e) => {
                if (e.kind === "set") {
                  const set = SURPRISE_SETS[e.id]
                  const available = e.id === "sick-watch" ? featuredAvailable : set.total
                  const soon = set.status === "starting-soon"
                  return (
                    <li key={e.id} className="rounded-3xl bg-[#2f2f2f] p-4">
                      <div className="flex gap-3">
                        <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-[#3a3a3a]">
                          <img src={set.image} alt={set.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col items-start">
                          {soon ? (
                            <span className="rounded-full border border-white/35 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white/55">
                              Starting soon
                            </span>
                          ) : (
                            <span className="rounded-full border border-[#4d8bff] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#6ea0ff]">
                              Featured
                            </span>
                          )}
                          <h3 className="mt-1.5 line-clamp-2 text-lg font-medium leading-6">{set.title}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <ProgressRing available={available} total={set.total} color={soon ? "#4CE160" : "#eab308"} />
                            <span className="text-base text-white/85">
                              {available}/{set.total} spots available
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSeeSpots(e.id)}
                        className="mt-4 w-full rounded-full bg-[#5b8def] py-3 text-base font-bold text-black transition-opacity hover:opacity-90"
                      >
                        See all spots
                      </button>
                    </li>
                  )
                }
                return (
                  <li key={e.id} className="flex gap-3">
                    <div className="relative h-[150px] w-[150px] flex-shrink-0 overflow-hidden rounded-3xl bg-white">
                      <img src={e.image} alt={e.title} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        aria-label="Watch this item"
                        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black"
                      >
                        <Heart className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="line-clamp-3 text-lg font-medium leading-6">{e.title}</h3>
                      <p className="mt-1 text-xl font-bold">${e.price.toLocaleString()}.00</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-base text-white/55">
                        <Truck className="h-4 w-4" aria-hidden="true" />${e.shipping} shipping
                      </p>
                      <button
                        type="button"
                        className="mt-auto w-full rounded-full bg-[#5b8def] py-2.5 text-base font-bold text-black transition-opacity hover:opacity-90"
                      >
                        Buy It Now
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
