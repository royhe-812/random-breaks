"use client"

/**
 * MULTI-SPIN (MANUAL) — Standalone prototype
 *
 * Drop this single file into any Next.js / React project.
 *
 * Dependencies:
 *   pnpm add framer-motion lucide-react
 *   (Tailwind CSS must be configured)
 *
 * Usage:
 *   import MultiSpinManualPage from "./multi-spin-manual-standalone"
 *   // Then render <MultiSpinManualPage /> on any page/route.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Pointer } from "lucide-react"

// ---------------------------------------------------------------------------
// Team data
// ---------------------------------------------------------------------------

export interface Team {
  name: string
  city: string
  abbrev: string
  color: string
  secondary: string
}

const teams: Team[] = [
  { name: "Chiefs",    city: "Kansas City",   abbrev: "KC",  color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles",    city: "Philadelphia",  abbrev: "PHI", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys",   city: "Dallas",        abbrev: "DAL", color: "#003594", secondary: "#869397" },
  { name: "49ers",     city: "San Francisco", abbrev: "SF",  color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills",     city: "Buffalo",       abbrev: "BUF", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins",  city: "Miami",         abbrev: "MIA", color: "#008E97", secondary: "#FC4C02" },
  { name: "Ravens",    city: "Baltimore",     abbrev: "BAL", color: "#241773", secondary: "#9E7C0C" },
  { name: "Lions",     city: "Detroit",       abbrev: "DET", color: "#0076B6", secondary: "#B0B7BC" },
  { name: "Packers",   city: "Green Bay",     abbrev: "GB",  color: "#203731", secondary: "#FFB612" },
  { name: "Bengals",   city: "Cincinnati",    abbrev: "CIN", color: "#FB4F14", secondary: "#000000" },
  { name: "Jets",      city: "New York",      abbrev: "NYJ", color: "#125740", secondary: "#000000" },
  { name: "Broncos",   city: "Denver",        abbrev: "DEN", color: "#FB4F14", secondary: "#002244" },
  { name: "Chargers",  city: "Los Angeles",   abbrev: "LAC", color: "#0080C6", secondary: "#FFC20E" },
  { name: "Colts",     city: "Indianapolis",  abbrev: "IND", color: "#002C5F", secondary: "#A2AAAD" },
  { name: "Texans",    city: "Houston",       abbrev: "HOU", color: "#03202F", secondary: "#A71930" },
  { name: "Steelers",  city: "Pittsburgh",    abbrev: "PIT", color: "#FFB612", secondary: "#101820" },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Spot = 1 | 2 | 3 | 4
// Spots that get spun; spot 4 is reserved for the manual "extra" assignment.
const SPUN_SPOTS: Spot[] = [1, 2, 3]

// Buyer's comment templates — deterministically picked so autofill and posted
// message always match.
const SPOT_REQUEST_TEMPLATES = [
  (t: string) => `Lock me in for the ${t}! 🔒`,
  (t: string) => `${t} are mine, sell it to me!`,
  (t: string) => `Need those ${t}, hook me up!`,
  (t: string) => `Put me down for the ${t}!`,
  (t: string) => `${t} please, I've been waiting all night!`,
  (t: string) => `Sell me the ${t}, let's go!`,
  (t: string) => `Don't let anyone else grab the ${t} — they're mine!`,
  (t: string) => `Claiming the ${t}, ship it my way!`,
  (t: string) => `${t} all day! Sell it to me!`,
]

function buildSpotRequestMessage(spunTeam: string, extraTeam: string) {
  let seed = 0
  for (let i = 0; i < spunTeam.length; i++) seed += spunTeam.charCodeAt(i)
  const base = SPOT_REQUEST_TEMPLATES[seed % SPOT_REQUEST_TEMPLATES.length](spunTeam)
  return `${base} And the ${extraTeam} too if they're open!`
}

const MOCK_CHAT: { user: string; message: string; color: string }[] = [
  { user: "johnpleys",      message: "Gotta try to hit this one! Love Mosaic",  color: "text-white/60"  },
  { user: "Chloepulls11",   message: "These are so hot, get your bids in!",     color: "text-yellow-400" },
  { user: "chrisjames",     message: "So sick",                                  color: "text-white"     },
  { user: "cardking99",     message: "GL everyone!",                             color: "text-blue-400"  },
  { user: "packripperz",    message: "Who got the Burrow last break?",           color: "text-purple-400"},
  { user: "sportsfan22",    message: "Need that Stroud auto",                    color: "text-green-400" },
  { user: "rookie_hunter",  message: "Herbert please!",                          color: "text-orange-400"},
  { user: "bigpulls",       message: "Let's gooo",                               color: "text-pink-400"  },
  { user: "cardcollector",  message: "Anyone hit a case hit yet?",               color: "text-cyan-400"  },
  { user: "mikibreaks",     message: "Just got the Cowboys, hyped!",             color: "text-blue-400"  },
  { user: "nfl_cards",      message: "Mahomes would be insane",                  color: "text-red-400"   },
  { user: "boxbreaker",     message: "Love these random breaks",                 color: "text-yellow-400"},
]

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function BackAndForthMarquee({
  children,
  className,
  trackClassName,
  duration = 14,
}: {
  children: ReactNode
  className?: string
  trackClassName?: string
  duration?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState(0)

  useEffect(() => {
    const measure = () => {
      const c = containerRef.current
      const t = trackRef.current
      if (!c || !t) return
      setOverflow(Math.max(0, t.scrollWidth - c.clientWidth))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [children])

  return (
    <div ref={containerRef} className={`overflow-hidden ${className ?? ""}`}>
      <motion.div
        ref={trackRef}
        className={`w-max ${trackClassName ?? ""}`}
        animate={overflow > 0 ? { x: [0, -overflow, -overflow, 0, 0] } : { x: 0 }}
        transition={
          overflow > 0
            ? { duration, times: [0, 0.4, 0.5, 0.9, 1], repeat: Infinity, ease: "linear" }
            : undefined
        }
      >
        {children}
      </motion.div>
    </div>
  )
}

const CircularProgress = ({
  available,
  total,
  size = 16,
}: {
  available: number
  total: number
  size?: number
}) => {
  const pct = (available / total) * 100
  const sw = 3
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color =
    pct / 100 <= 0.25 ? "#ef4444" : pct / 100 <= 0.5 ? "#f97316" : pct / 100 <= 0.75 ? "#eab308" : "#22c55e"

  return (
    <svg className="transform -rotate-90" width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={sw} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// MultiSpin5LabelSpinner  (the randomizer card)
// ---------------------------------------------------------------------------

type SpinnerStage = "idle" | "spinning" | "ready"

interface SpinnerProps {
  totalSpots: number
  availableSpots: number
  isSpinning: boolean
  pendingSpot?: Spot | null
  onSpotsLanded?: (spots: { spot: Spot; team: Team }[]) => void
  onCycleSpots?: () => void
  onViewSpots?: () => void
  /** Shows a hand/pointer icon on the announced chip instead of a text suffix. */
  manualIcon?: boolean
  /** An extra team (not in the spun list) to populate as a 4th chip. */
  manualAssignment?: { spot: Spot; team: Team } | null
}

function MultiSpinRandomizer({
  totalSpots,
  availableSpots,
  isSpinning,
  pendingSpot = null,
  onSpotsLanded,
  onCycleSpots,
  onViewSpots,
  manualIcon = false,
  manualAssignment = null,
}: SpinnerProps) {
  const [stage, setStage] = useState<SpinnerStage>("idle")
  const [spinningSpot, setSpinningSpot] = useState<0 | Spot>(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<Record<Spot, Team | null>>({ 1: null, 2: null, 3: null, 4: null })
  const [landedOrder, setLandedOrder] = useState<Spot[]>([])
  const [justLanded, setJustLanded] = useState(false)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const announceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interSpinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const hasStartedRef = useRef(false)
  const hasAnnouncedRef = useRef(false)

  const playTick = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.02)
      osc.type = "sine"
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.03)
    } catch { /* silent */ }
  }, [])

  const runSpin = useCallback(
    (spot: Spot, onDone: (team: Team) => void, exclude: Set<string> = new Set()) => {
      setSpinningSpot(spot)
      setJustLanded(false)
      const pool = teams.filter((t) => !exclude.has(t.name))
      const chosen = (pool.length > 0 ? pool : teams)[Math.floor(Math.random() * (pool.length > 0 ? pool.length : teams.length))]
      const target = teams.findIndex((t) => t.name === chosen.name)
      let speed = 50, elapsed = 0
      let idx = Math.floor(Math.random() * teams.length)
      const tick = () => {
        idx = (idx + 1) % teams.length
        setCurrentIndex(idx)
        playTick()
        elapsed += speed
        if (elapsed > 1200) speed += 30
        if (speed >= 400) {
          setCurrentIndex(target)
          setJustLanded(true)
          timeoutRef.current = setTimeout(() => onDone(teams[target]), 1600)
          return
        }
        timeoutRef.current = setTimeout(tick, speed)
      }
      timeoutRef.current = setTimeout(tick, speed)
    },
    [playTick],
  )

  useEffect(() => {
    if (isSpinning && !hasStartedRef.current && stage === "idle") {
      hasStartedRef.current = true
      setStage("spinning")
      const landed: Record<Spot, Team> = {} as Record<Spot, Team>
      const runNext = (i: number) => {
        if (i >= SPUN_SPOTS.length) { setSpinningSpot(0); setStage("ready"); return }
        const spot = SPUN_SPOTS[i]
        if (i === 1) setLandedOrder((p) => (p.includes(SPUN_SPOTS[0]) ? p : [SPUN_SPOTS[0], ...p]))
        const used = new Set(Object.values(landed).map((t) => t.name))
        runSpin(spot, (team) => {
          landed[spot] = team
          setResults((p) => ({ ...p, [spot]: team }))
          if (i >= 1) setLandedOrder((p) => (p.includes(spot) ? p : [...p, spot]))
          interSpinTimeoutRef.current = setTimeout(() => runNext(i + 1), 2500)
        }, used)
      }
      runNext(0)
    }
  }, [isSpinning, stage, runSpin])

  useEffect(() => {
    const allLanded = results[1] && results[2] && results[3]
    if (stage === "ready" && !hasAnnouncedRef.current && allLanded) {
      hasAnnouncedRef.current = true
      announceTimeoutRef.current = setTimeout(() => {
        const set = SPUN_SPOTS.filter((s) => results[s]).map((s) => ({ spot: s, team: results[s] as Team }))
        onSpotsLanded?.(set)
      }, 1200)
    }
  }, [stage, results, onSpotsLanded])

  useEffect(() => {
    if (!manualAssignment) return
    const { spot, team } = manualAssignment
    setResults((p) => (p[spot] ? p : { ...p, [spot]: team }))
    setLandedOrder((p) => (p.includes(spot) ? p : [...p, spot]))
  }, [manualAssignment])

  useEffect(() => {
    if (!isSpinning && stage !== "idle") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (announceTimeoutRef.current) clearTimeout(announceTimeoutRef.current)
      if (interSpinTimeoutRef.current) clearTimeout(interSpinTimeoutRef.current)
      hasStartedRef.current = false
      hasAnnouncedRef.current = false
      setStage("idle"); setSpinningSpot(0)
      setResults({ 1: null, 2: null, 3: null, 4: null })
      setLandedOrder([]); setCurrentIndex(0); setJustLanded(false)
    }
  }, [isSpinning, stage])

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (announceTimeoutRef.current) clearTimeout(announceTimeoutRef.current)
    if (interSpinTimeoutRef.current) clearTimeout(interSpinTimeoutRef.current)
  }, [])

  const renderChip = (spot: Spot) => {
    const result = results[spot]
    if (!result) return null
    const isAnnounced = pendingSpot === spot

    return (
      <motion.div
        key={spot} layout
        initial={{ opacity: 0, scale: 0.8, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative inline-flex h-4 shrink-0 whitespace-nowrap items-center gap-1 rounded-full px-3 text-[10px] leading-none font-bold uppercase tracking-wide overflow-hidden"
        style={{
          backgroundColor: isAnnounced ? result.color : "transparent",
          color: isAnnounced ? "#ffffff" : result.color,
          boxShadow: isAnnounced ? "none" : `inset 0 0 0 1px ${result.color}`,
        }}
      >
        {isAnnounced && manualIcon && <Pointer className="w-3 h-3 shrink-0" aria-label="Manual assignment" />}
        {result.city} {result.name}
        <motion.span
          key={`shimmer-${spot}`} aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)", mixBlendMode: "overlay" }}
          initial={{ x: "-120%" }} animate={{ x: "220%" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        />
      </motion.div>
    )
  }

  const renderMarqueeChip = (spot: Spot, key: string) => {
    const result = results[spot]
    if (!result) return null
    const isAnnounced = pendingSpot === spot
    return (
      <span key={key}
        className="inline-flex h-4 shrink-0 whitespace-nowrap items-center gap-1 rounded-full px-3 text-[10px] leading-none font-bold uppercase tracking-wide"
        style={{
          backgroundColor: isAnnounced ? result.color : "transparent",
          color: isAnnounced ? "#ffffff" : result.color,
          boxShadow: isAnnounced ? "none" : `inset 0 0 0 1px ${result.color}`,
        }}
      >
        {isAnnounced && manualIcon && <Pointer className="w-3 h-3 shrink-0" />}
        {result.city} {result.name}
      </span>
    )
  }

  const isAnySpinning = spinningSpot !== 0
  const assignedSpots = landedOrder
  const donePopulating = stage === "ready" && landedOrder.length >= SPUN_SPOTS.length

  return (
    <div className="w-full">
      <motion.div
        className="relative bg-black/40 backdrop-blur rounded-xl overflow-hidden"
        animate={{ boxShadow: "none" }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-white text-xs"
              style={{ backgroundColor: isAnySpinning ? teams[currentIndex].color : "transparent" }}
              transition={{ duration: 0.15 }}
            >
              {isAnySpinning ? (
                teams[currentIndex].abbrev
              ) : (
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%F0%9F%93%B8%20Image-9iS4XVufx1PUEY9oOKKsmjnhTZzv9F.png"
                  alt="Panini Luminance box"
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
            </motion.div>

            <div className="flex flex-col flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {isAnySpinning ? (
                  <motion.span
                    key={justLanded ? "landed" : teams[currentIndex].name}
                    className="font-semibold text-sm truncate"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, color: justLanded ? teams[currentIndex].color : "#ffffff" }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: justLanded ? 0.2 : 0.05 }}
                  >
                    {teams[currentIndex].city} {teams[currentIndex].name}
                  </motion.span>
                ) : (
                  <BackAndForthMarquee key="marquee" duration={26} trackClassName="text-sm leading-5">
                    <span className="text-white font-semibold text-sm whitespace-nowrap">
                      2025 Panini Luminance Football Hobby PYT Box Break #903
                    </span>
                  </BackAndForthMarquee>
                )}
              </AnimatePresence>
              <button onClick={onCycleSpots ?? onViewSpots} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <CircularProgress available={availableSpots} total={totalSpots} size={16} />
                <span className="text-sm text-white">{availableSpots}/{totalSpots} spots available</span>
              </button>
            </div>

            <button onClick={onViewSpots} className="flex items-center gap-1 text-white/50 hover:text-white/70 transition-colors flex-shrink-0">
              <span className="text-sm">View all</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chips row */}
        <AnimatePresence>
          {assignedSpots.length > 0 && (
            <motion.div key="chips" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="mx-4 border-t border-white/10" />
              {donePopulating ? (
                <div className="px-4 pt-3 pb-3">
                  <BackAndForthMarquee trackClassName="flex gap-2">
                    {assignedSpots.map((s) => renderMarqueeChip(s, `${s}`))}
                  </BackAndForthMarquee>
                </div>
              ) : (
                <div
                  className="px-4 pt-3 pb-3 flex gap-2 overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <AnimatePresence initial={false}>
                    {assignedSpots.map((s) => renderChip(s))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Winner announcement (in-chat seller message)
// ---------------------------------------------------------------------------

function WinnerAnnouncement({ team, show, label }: { team: Team | null; show: boolean; label: string }) {
  if (!show || !team) return null
  return (
    <motion.div className="pr-20" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col">
        <span className="text-green-400 font-bold text-sm">ryans_cardhouse</span>
        <span className="text-white/80 text-sm">
          {label}{" "}
          <span className="font-bold text-white">{team.city} {team.name}</span> to{" "}
          <span className="font-bold text-white">Adam007</span>
        </span>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MultiSpinManualPage() {
  // --- Spinner state ---
  const [isSpinning, setIsSpinning] = useState(false)
  const [pendingSpot, setPendingSpot] = useState<Spot | null>(null)
  const [availableSpots, setAvailableSpots] = useState(15)

  // --- Flow state ---
  const [spunSpots, setSpunSpots] = useState<{ spot: Spot; team: Team }[]>([])
  const [revealPending, setRevealPending] = useState(false)   // "Pending seller" overlay
  const [requestDraft, setRequestDraft] = useState<{ spot: Spot; team: Team } | null>(null)
  const [extraTeam, setExtraTeam] = useState<Team | null>(null)
  const [commentRequested, setCommentRequested] = useState(false)
  const [manualAssignment, setManualAssignment] = useState<{ spot: Spot; team: Team } | null>(null)

  // Winner announcements
  const [firstWinner, setFirstWinner] = useState<Team | null>(null)   // Spun spot
  const [secondWinner, setSecondWinner] = useState<Team | null>(null) // Extra manual team
  const [showFirst, setShowFirst] = useState(false)
  const [showSecond, setShowSecond] = useState(false)

  // --- Chat ---
  const [messages, setMessages] = useState(MOCK_CHAT.slice(0, 3))
  const msgIdxRef = useRef(3)
  const chatPausedRef = useRef(false)
  const manualPhaseRef = useRef<"first" | "second">("first")
  const assignTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Rotate chat
  useEffect(() => {
    const id = setInterval(() => {
      if (chatPausedRef.current) return
      setMessages((prev) => {
        const next = [...prev.slice(1)]
        next.push(MOCK_CHAT[msgIdxRef.current % MOCK_CHAT.length])
        msgIdxRef.current++
        return next
      })
    }, 2500)
    return () => clearInterval(id)
  }, [])

  // --- Bid button ---
  const handleBid = useCallback(() => {
    if (isSpinning) return
    setIsSpinning(true)
    // Optimistically decrement spots (cosmetic)
    setAvailableSpots((p) => Math.max(0, p - 1))
  }, [isSpinning])

  // --- All spots landed → pending seller phase ---
  const handleSpotsLanded = useCallback((spots: { spot: Spot; team: Team }[]) => {
    setSpunSpots(spots)
    setRevealPending(true)
    setCommentRequested(false)
    manualPhaseRef.current = "first"

    // Pre-pick one of the spun spots for the buyer's request
    const draft = spots[Math.floor(Math.random() * spots.length)] ?? null
    setRequestDraft(draft)

    // Pick a random EXTRA team that isn't in the spun list
    const spunNames = new Set(spots.map((s) => s.team.name))
    const pool = teams.filter((t) => !spunNames.has(t.name))
    setExtraTeam(pool[Math.floor(Math.random() * pool.length)] ?? null)

    setFirstWinner(null)
    setSecondWinner(null)
    setShowFirst(false)
    setShowSecond(false)
    setManualAssignment(null)
  }, [])

  // --- Buyer taps "send comment" ---
  const handleSendComment = useCallback(() => {
    if (!revealPending || commentRequested || !requestDraft || !extraTeam) return
    setCommentRequested(true)
    chatPausedRef.current = true

    const msg = buildSpotRequestMessage(requestDraft.team.name, extraTeam.name)
    setMessages((prev) => [...prev.slice(1), { user: "Adam007", message: msg, color: "text-[#4CE160]" }])

    // After ~2.6 s the seller assigns the spun spot → green chip + reveal beat
    assignTimerRef.current = setTimeout(() => {
      setRevealPending(false)
      setPendingSpot(requestDraft.spot)

      // Reveal #1: spun spot announcement
      setTimeout(() => {
        setShowFirst(true)
        setFirstWinner(requestDraft.team)

        // After announce, seller manually assigns the extra team
        setTimeout(() => {
          manualPhaseRef.current = "second"
          setManualAssignment({ spot: 4 as Spot, team: extraTeam })

          // Reveal #2: extra team announcement
          setTimeout(() => {
            setShowSecond(true)
            setSecondWinner(extraTeam)
            chatPausedRef.current = false
          }, 2000)
        }, 2600)
      }, 900)
    }, 2600)
  }, [revealPending, commentRequested, requestDraft, extraTeam])

  // Auto-assign if buyer never taps (keeps demo moving)
  useEffect(() => {
    if (!revealPending || commentRequested || !requestDraft || !extraTeam) return
    const id = setTimeout(() => {
      if (!commentRequested) handleSendComment()
    }, 6000)
    return () => clearTimeout(id)
  }, [revealPending, commentRequested, requestDraft, extraTeam, handleSendComment])

  // --- Reset ---
  const handleReset = useCallback(() => {
    if (assignTimerRef.current) clearTimeout(assignTimerRef.current)
    setIsSpinning(false)
    setPendingSpot(null)
    setAvailableSpots(15)
    setSpunSpots([])
    setRevealPending(false)
    setRequestDraft(null)
    setExtraTeam(null)
    setCommentRequested(false)
    setManualAssignment(null)
    setFirstWinner(null)
    setSecondWinner(null)
    setShowFirst(false)
    setShowSecond(false)
    chatPausedRef.current = false
    manualPhaseRef.current = "first"
  }, [])

  const cycleSpots = useCallback(() => {
    setAvailableSpots((p) => { const n = p - 8; return n < 0 ? 32 : n })
  }, [])

  // Comment input autofill text
  const commentText =
    requestDraft && extraTeam ? buildSpotRequestMessage(requestDraft.team.name, extraTeam.name) : ""

  const showReset = showFirst || showSecond

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Phone frame */}
      <div className="w-[390px] bg-zinc-900 rounded-[40px] overflow-hidden shadow-2xl shadow-black/60 border border-white/10 relative">

        {/* Live stream mock header */}
        <div className="relative h-48 bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "url(https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%F0%9F%93%B8%20Image-9iS4XVufx1PUEY9oOKKsmjnhTZzv9F.png)", backgroundSize: "cover", backgroundPosition: "center", filter: "blur(8px)" }}
          />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">LIVE</div>
            <span className="text-white/70 text-xs">ryans_cardhouse</span>
          </div>
          {/* Viewer count */}
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur rounded-full px-2 py-1 text-white/70 text-xs">
            👁 240
          </div>
        </div>

        {/* Chat + spinner area */}
        <div className="flex flex-col gap-0 bg-zinc-900">

          {/* Spinner card */}
          <div className="px-3 pt-3">
            <MultiSpinRandomizer
              totalSpots={32}
              availableSpots={availableSpots}
              isSpinning={isSpinning}
              pendingSpot={pendingSpot}
              onSpotsLanded={handleSpotsLanded}
              onCycleSpots={cycleSpots}
              manualIcon
              manualAssignment={manualAssignment}
            />
          </div>

          {/* "Pending seller" overlay pill */}
          <AnimatePresence>
            {revealPending && (
              <motion.div
                className="mx-3 mt-2 flex items-center gap-2 bg-zinc-800/80 backdrop-blur rounded-xl px-3 py-2"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white/80 text-xs font-medium">Pending seller assignment</span>
                <span className="flex items-center gap-0.5 ml-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="w-1 h-1 rounded-full bg-white/60"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat messages */}
          <div className="px-3 pt-3 pb-2 flex flex-col gap-1.5 min-h-[72px]">
            <AnimatePresence initial={false} mode="popLayout">
              {messages.map((m, i) => (
                <motion.div key={`${m.user}-${i}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex gap-1.5 items-baseline"
                >
                  <span className={`text-xs font-bold shrink-0 ${m.color}`}>{m.user}</span>
                  <span className="text-white/70 text-xs leading-relaxed">{m.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Winner announcements */}
            <WinnerAnnouncement team={firstWinner} show={showFirst} label="assigned" />
            <WinnerAnnouncement team={secondWinner} show={showSecond} label="manually added" />
          </div>

          {/* Comment input */}
          <div className="px-3 pb-4">
            <AnimatePresence mode="wait">
              {showReset ? (
                /* Reset CTA after both assignments */
                <motion.button
                  key="reset"
                  onClick={handleReset}
                  className="w-full py-3 rounded-2xl bg-zinc-700 text-white font-semibold text-sm"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  Reset
                </motion.button>
              ) : revealPending && !commentRequested ? (
                /* Autofilled comment draft — buyer taps to send */
                <motion.button
                  key="send-comment"
                  onClick={handleSendComment}
                  className="w-full flex items-center gap-2 bg-zinc-800 rounded-2xl px-4 py-3 text-left"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="flex-1 text-white text-sm truncate">{commentText}</span>
                  <span className="text-white/50 text-xs shrink-0">Tap to send</span>
                </motion.button>
              ) : revealPending && commentRequested ? (
                /* Sent state */
                <motion.div
                  key="sent"
                  className="w-full flex items-center justify-center gap-2 bg-zinc-800/50 rounded-2xl px-4 py-3"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-white/50 text-sm">Comment sent</span>
                </motion.div>
              ) : !isSpinning ? (
                /* Bid button */
                <motion.button
                  key="bid"
                  onClick={handleBid}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm transition-all"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  Bid $30
                </motion.button>
              ) : (
                /* Spinning: idle input */
                <motion.div
                  key="idle-input"
                  className="w-full flex items-center gap-2 bg-zinc-800/60 rounded-2xl px-4 py-3"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-white/30 text-sm">Add comment…</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
