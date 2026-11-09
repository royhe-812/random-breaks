"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronDown, ChevronUp, Gavel, Search, Tag, X } from "lucide-react"
import { CircularProgress, allTeams, soldBuyers, soldPrices } from "@/components/break-spots-sheet"

type SpotStatus = "available" | "sold"
type SpotFormat = "auction" | "buy-now"
type SheetTab = "spots" | "details"

interface Spot {
  city: string
  name: string
  abbrev: string
  status: SpotStatus
  format: SpotFormat
  price: number
  buyer?: string
}

const PRODUCT_TITLE = "16X 2023 Panini Mosaic NFL Blaster PYT RAndom #224"
const PRODUCT_IMAGE =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%F0%9F%93%B8%20Image-9iS4XVufx1PUEY9oOKKsmjnhTZzv9F.png"

const STATUS_OPTIONS: { id: "all" | SpotStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "sold", label: "Sold" },
]

const FORMAT_OPTIONS: { id: "all" | SpotFormat; label: string }[] = [
  { id: "all", label: "All" },
  { id: "auction", label: "Auction" },
  { id: "buy-now", label: "Buy it now" },
]

/**
 * One segmented control. Each option carries a live count so the buyer can see
 * what a tap will give them before they tap it. The white thumb slides between
 * options via a shared layoutId, which is why every group needs its own id.
 */
function Segmented<T extends string>({
  groupId,
  label,
  value,
  options,
  counts,
  onChange,
}: {
  groupId: string
  label: string
  value: T
  options: { id: T; label: string }[]
  counts: Record<T, number>
  onChange: (next: T) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 flex-shrink-0 text-xs font-medium text-white/50">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-1 rounded-full bg-[#2a2a2a] p-0.5"
      >
        {options.map((option) => {
          const selected = option.id === value
          const empty = counts[option.id] === 0
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={`relative flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-medium whitespace-nowrap transition-colors ${
                selected ? "text-black" : empty ? "text-white/35" : "text-white"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId={`${groupId}-thumb`}
                  className="absolute inset-0 rounded-full bg-white"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative">{option.label}</span>
              <span className={`relative text-xs tabular-nums ${selected ? "text-black/60" : "text-white/45"}`}>
                {counts[option.id]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FormatLabel({ format, className = "" }: { format: SpotFormat; className?: string }) {
  const Icon = format === "auction" ? Gavel : Tag
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {format === "auction" ? "Auction" : "Buy it now"}
    </span>
  )
}

function ProductHeader({ spotsAvailable, spotsTotal }: { spotsAvailable: number; spotsTotal: number }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#3a3a3a]">
        <img src={PRODUCT_IMAGE || "/placeholder.svg"} alt="Mosaic blaster box" className="h-full w-full object-cover" />
      </div>
      <div className="flex-1">
        <h3 className="mb-2 text-sm font-medium leading-tight text-white">{PRODUCT_TITLE}</h3>
        <div className="flex items-center gap-1.5">
          <CircularProgress available={spotsAvailable} total={spotsTotal} size={16} />
          <span className="text-xs text-white/60">
            {spotsAvailable}/{spotsTotal} spots available
          </span>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="flex-shrink-0 text-sm text-white/50">{label}</dt>
      <dd className="text-right text-sm text-white">{children}</dd>
    </div>
  )
}

const RULES = [
  "All sales are final. No refunds after the break has filled.",
  "Breaks will begin once all spots are sold and payment is received.",
  "All cards ship unless otherwise noted.",
  "Veteran base cards may be sorted together when applicable. All rookies, inserts, parallels, numbered cards, autographs, relics, and hits ship.",
]

const HOW_IT_WORKS = [
  {
    title: "Choose Your Spot",
    body: "Select a team or player from the board. Each spot gives you all cards from that team/player.",
  },
  {
    title: "Random Selection",
    body: "When you bid, you\u2019re entered into a randomizer that selects your team. The more you bid, the more chances to win!",
  },
  {
    title: "Watch Live",
    body: "The streamer opens packs live on camera. When your team\u2019s cards are pulled, they\u2019re yours!",
  },
  {
    title: "Cards Ship",
    body: "After the break, all your cards are shipped directly to you. Hits and base cards included.",
  },
]

/**
 * "Item line up" version of the Break Spots sheet.
 *
 * Differences from BreakSpotsSheet:
 *  - Search is a header icon that expands into a field, not a full-width bar.
 *  - The four chips (Available / Sold / Auctions / Buy It Now) are replaced by
 *    two labelled segmented controls: Status and Format. They combine, so
 *    "Available" + "Auction" gives the open auction spots. In the old chips the
 *    Auction and Buy It Now options did nothing at all.
 *  - A "Break Details" tab replaces the old "Break Rules" screen and button.
 */
function ItemLineupSheet({
  isOpen,
  onClose,
  spotsAvailable,
  spotsTotal,
  openToDetails = false,
}: {
  isOpen: boolean
  onClose: () => void
  spotsAvailable: number
  spotsTotal: number
  /** When true, the sheet opens on the Break Details tab. */
  openToDetails?: boolean
}) {
  const [tab, setTab] = useState<SheetTab>("spots")
  const [statusFilter, setStatusFilter] = useState<"all" | SpotStatus>("all")
  const [formatFilter, setFormatFilter] = useState<"all" | SpotFormat>("all")
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [availableExpanded, setAvailableExpanded] = useState(true)
  const [soldExpanded, setSoldExpanded] = useState(true)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setTab(openToDetails ? "details" : "spots")
    setStatusFilter("all")
    setFormatFilter("all")
    setSearchOpen(false)
    setQuery("")
  }, [isOpen, openToDetails])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  // The first (total - available) teams are sold so the sheet always agrees
  // with the randomizer. Format is a fixed pattern over the team order, so each
  // spot keeps the same format every time the sheet opens.
  const spots: Spot[] = useMemo(() => {
    const soldCount = Math.min(allTeams.length, Math.max(0, spotsTotal - spotsAvailable))
    return allTeams.slice(0, spotsTotal).map((team, i) => {
      const sold = i < soldCount
      return {
        ...team,
        status: sold ? "sold" : "available",
        format: i % 5 < 2 ? "auction" : "buy-now",
        price: soldPrices[i % soldPrices.length],
        buyer: sold ? soldBuyers[i % soldBuyers.length] : undefined,
      }
    })
  }, [spotsAvailable, spotsTotal])

  const q = query.trim().toLowerCase()
  const matchesQuery = (s: Spot) =>
    !q || `${s.city} ${s.name} ${s.abbrev} ${s.buyer ?? ""}`.toLowerCase().includes(q)
  const matchesStatus = (s: Spot) => statusFilter === "all" || s.status === statusFilter
  const matchesFormat = (s: Spot) => formatFilter === "all" || s.format === formatFilter

  // Each control's counts respect the OTHER control, so a number always equals
  // the rows you'll see after tapping that option.
  const statusCounts = {
    all: spots.filter((s) => matchesQuery(s) && matchesFormat(s)).length,
    available: spots.filter((s) => matchesQuery(s) && matchesFormat(s) && s.status === "available").length,
    sold: spots.filter((s) => matchesQuery(s) && matchesFormat(s) && s.status === "sold").length,
  }
  const formatCounts = {
    all: spots.filter((s) => matchesQuery(s) && matchesStatus(s)).length,
    auction: spots.filter((s) => matchesQuery(s) && matchesStatus(s) && s.format === "auction").length,
    "buy-now": spots.filter((s) => matchesQuery(s) && matchesStatus(s) && s.format === "buy-now").length,
  }

  const visible = spots.filter((s) => matchesQuery(s) && matchesStatus(s) && matchesFormat(s))
  const availableList = visible.filter((s) => s.status === "available")
  const soldList = visible.filter((s) => s.status === "sold")
  const isFiltered = statusFilter !== "all" || formatFilter !== "all" || q !== ""

  const clearFilters = () => {
    setStatusFilter("all")
    setFormatFilter("all")
    setQuery("")
  }
  const closeSearch = () => {
    setSearchOpen(false)
    setQuery("")
  }
  const switchTab = (next: SheetTab) => {
    if (next === "details") closeSearch()
    setTab(next)
  }

  const auctionTotal = spots.filter((s) => s.format === "auction").length
  const buyNowTotal = spots.length - auctionTotal

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="absolute inset-0 z-50 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="absolute inset-x-0 bottom-0 top-[15%] z-50 flex flex-col overflow-hidden rounded-t-3xl bg-[#1a1a1a]"
            role="dialog"
            aria-label="Break spots"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex justify-center pb-1 pt-2">
              <div className="h-1 w-10 rounded-full bg-white/30" />
            </div>

            {/* Header: title + search icon, or the expanded search field */}
            <div className="flex h-14 items-center gap-3 px-4">
              {searchOpen ? (
                <>
                  <div className="flex h-10 flex-1 items-center gap-2 rounded-full bg-[#2a2a2a] px-4">
                    <Search className="h-4 w-4 flex-shrink-0 text-white/50" aria-hidden="true" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                      placeholder="Search team or buyer"
                      aria-label="Search spots"
                      className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("")
                          searchRef.current?.focus()
                        }}
                        aria-label="Clear search text"
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="flex-shrink-0 text-sm font-medium text-white"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close break spots"
                    className="flex h-8 w-8 items-center justify-center"
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                  <h2 className="flex-1 text-lg font-semibold text-white">Break spots</h2>
                  {tab === "spots" && (
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      aria-label="Search spots"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a] transition-colors hover:bg-[#333]"
                    >
                      <Search className="h-[18px] w-[18px] text-white" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Tabs */}
            <div role="tablist" aria-label="Break spots sections" className="flex border-b border-white/10 px-4">
              {([
                { id: "spots", label: "Spots" },
                { id: "details", label: "Break Details" },
              ] as const).map((t) => {
                const selected = tab === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`lineup-tab-${t.id}`}
                    aria-selected={selected}
                    aria-controls={`lineup-panel-${t.id}`}
                    onClick={() => switchTab(t.id)}
                    className={`relative flex-1 py-3 text-sm font-semibold transition-colors ${
                      selected ? "text-white" : "text-white/50"
                    }`}
                  >
                    {t.label}
                    {selected && (
                      <motion.span
                        layoutId="lineup-tab-underline"
                        className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-white"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {tab === "spots" ? (
              <div
                role="tabpanel"
                id="lineup-panel-spots"
                aria-labelledby="lineup-tab-spots"
                className="flex min-h-0 flex-1 flex-col"
              >
                {/* Filters */}
                <div className="flex flex-col gap-2 px-4 pb-3 pt-3">
                  <Segmented
                    groupId="lineup-status"
                    label="Status"
                    value={statusFilter}
                    options={STATUS_OPTIONS}
                    counts={statusCounts}
                    onChange={setStatusFilter}
                  />
                  <Segmented
                    groupId="lineup-format"
                    label="Format"
                    value={formatFilter}
                    options={FORMAT_OPTIONS}
                    counts={formatCounts}
                    onChange={setFormatFilter}
                  />
                  {isFiltered && (
                    <div className="flex items-center justify-between pt-1" aria-live="polite">
                      <span className="text-xs text-white/60">
                        Showing {visible.length} of {spots.length} spots
                      </span>
                      <button type="button" onClick={clearFilters} className="text-xs font-semibold text-white underline underline-offset-2">
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-8">
                  <div className="rounded-2xl bg-[#2a2a2a] p-3">
                    <ProductHeader spotsAvailable={spotsAvailable} spotsTotal={spotsTotal} />

                    <div className="mt-3 border-t border-white/10 pt-1" />

                    {visible.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                        <p className="text-sm text-white/70">No spots match these filters.</p>
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="rounded-full border border-white/80 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                        >
                          Clear all
                        </button>
                      </div>
                    ) : (
                      <>
                        {availableList.length > 0 && (
                          <div className="mb-2">
                            <button
                              type="button"
                              onClick={() => setAvailableExpanded(!availableExpanded)}
                              aria-expanded={availableExpanded}
                              className="flex w-full items-center justify-between py-3"
                            >
                              <span className="text-base font-semibold text-white">
                                Available <span className="font-normal text-white/50">{availableList.length}</span>
                              </span>
                              {availableExpanded ? (
                                <ChevronUp className="h-5 w-5 text-white" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-white" />
                              )}
                            </button>
                            <AnimatePresence initial={false}>
                              {availableExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  {availableList.map((spot) => (
                                    <div key={spot.abbrev} className="flex items-center justify-between py-2">
                                      <span className="text-sm text-white">
                                        {spot.city} {spot.name}
                                      </span>
                                      <span className="flex items-center gap-2 text-xs text-white/60">
                                        <FormatLabel format={spot.format} />
                                        <span className="tabular-nums text-white/80">
                                          {spot.format === "auction" ? "from $1" : `$${spot.price}`}
                                        </span>
                                      </span>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {soldList.length > 0 && (
                          <div className="mb-2">
                            <button
                              type="button"
                              onClick={() => setSoldExpanded(!soldExpanded)}
                              aria-expanded={soldExpanded}
                              className="flex w-full items-center justify-between py-3"
                            >
                              <span className="text-base font-semibold text-white">
                                Sold <span className="font-normal text-white/50">{soldList.length}</span>
                              </span>
                              {soldExpanded ? (
                                <ChevronUp className="h-5 w-5 text-white" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-white" />
                              )}
                            </button>
                            <AnimatePresence initial={false}>
                              {soldExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  {soldList.map((spot) => (
                                    <div key={spot.abbrev} className="flex items-center justify-between py-2">
                                      <div>
                                        <span className="text-sm text-white">
                                          {spot.city} {spot.name}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-xs text-white/50">
                                          <span className="tabular-nums">${spot.price}.00</span>
                                          <span aria-hidden="true">&middot;</span>
                                          <FormatLabel format={spot.format} />
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        <span className="text-sm text-white/50">{spot.buyer}</span>
                                        <span className="rounded-full border border-[#FF4444] px-2 py-0.5 text-[10px] font-bold text-[#FF4444]">
                                          SOLD OUT
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                role="tabpanel"
                id="lineup-panel-details"
                aria-labelledby="lineup-tab-details"
                className="flex-1 overflow-y-auto px-4 pb-8 pt-4"
              >
                <div className="rounded-2xl bg-[#2a2a2a] p-3">
                  <ProductHeader spotsAvailable={spotsAvailable} spotsTotal={spotsTotal} />
                  <dl className="mt-3 divide-y divide-white/10 border-t border-white/10">
                    <DetailRow label="Break type">Random team break</DetailRow>
                    <DetailRow label="Spots">
                      {spotsTotal} total &middot; {spotsAvailable} available
                    </DetailRow>
                    <DetailRow label="Spot formats">
                      {auctionTotal} Auction &middot; {buyNowTotal} Buy it now
                    </DetailRow>
                    <DetailRow label="Break starts">Once all spots are sold and paid</DetailRow>
                  </dl>
                </div>

                <h3 className="mb-4 mt-8 text-lg font-semibold text-white">Seller Rules</h3>
                <ul className="space-y-3">
                  {RULES.map((rule) => (
                    <li key={rule} className="flex gap-3">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4CE160]" />
                      <p className="text-sm text-white/60">{rule}</p>
                    </li>
                  ))}
                </ul>

                <h3 className="mb-4 mt-8 text-lg font-semibold text-white">How Case Breaks Work</h3>
                <div className="space-y-4">
                  {HOW_IT_WORKS.map((step) => (
                    <div key={step.title} className="flex gap-3">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4CE160]" />
                      <div>
                        <p className="mb-1 font-medium text-white">{step.title}</p>
                        <p className="text-sm text-white/60">{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export { ItemLineupSheet }
