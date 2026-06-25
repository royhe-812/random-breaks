"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Info } from "lucide-react"
import { teams, type Team } from "@/components/team-spinner"

type Spot = 1 | 2 | 3

const SPOTS: Spot[] = [1, 2, 3]

/**
 * Marquee that only scrolls when its content overflows, easing right-to-left,
 * pausing, then left-to-right, then pausing — instead of a continuous loop.
 */
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

interface MultiSpin3LabelSpinnerProps {
  totalSpots: number
  availableSpots: number
  /** When true, kicks off the sequential spins (one per spot). */
  isSpinning: boolean
  /** The spot currently being announced/assigned (drives the pending state). */
  pendingSpot?: Spot | null
  /** When true, the spinner shows the "Pending seller" state (driven after the reveal). */
  pendingSeller?: boolean
  /** Fired once all spots have landed, with the full set so the buyer/seller can pick one. */
  onSpotsLanded?: (spots: { spot: Spot; team: Team }[]) => void
  /** Tapping the spots arc cycles the available count through the color tiers. */
  onCycleSpots?: () => void
  onViewSpots?: () => void
}

const PendingIndicator = () => (
  <motion.div
    className="flex items-center gap-2"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    <span className="text-white font-semibold text-sm whitespace-nowrap">Waiting for seller</span>
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-white/70"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  </motion.div>
)

// Circular progress component (mirrors the one used in TeamSpinner)
const CircularProgress = ({ available, total, size = 16 }: { available: number; total: number; size?: number }) => {
  const percentage = (available / total) * 100
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // 4-tier scale: green -> yellow -> orange -> red as the bar empties
  const getProgressColor = (pct: number) => {
    const ratio = pct / 100
    if (ratio <= 0.25) return "#ef4444" // red
    if (ratio <= 0.5) return "#f97316" // orange
    if (ratio <= 0.75) return "#eab308" // yellow
    return "#22c55e" // green
  }

  return (
    <svg className="transform -rotate-90" width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getProgressColor(percentage)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
      />
    </svg>
  )
}

type Stage = "idle" | "spinning" | "ready"

export function MultiSpin3LabelSpinner({
  totalSpots,
  availableSpots,
  isSpinning,
  pendingSpot = null,
  pendingSeller = false,
  onSpotsLanded,
  onCycleSpots,
  onViewSpots,
}: MultiSpin3LabelSpinnerProps) {
  const [stage, setStage] = useState<Stage>("idle")
  const [spinningSpot, setSpinningSpot] = useState<0 | Spot>(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<Record<Spot, Team | null>>({ 1: null, 2: null, 3: null })
  // Order in which spots land, oldest → newest. Chips render in this order so they
  // populate left → right, with the newest selection appearing on the right.
  const [landedOrder, setLandedOrder] = useState<Spot[]>([])
  // True briefly when a spin has landed on a spot, before the next spin starts.
  // Drives the green "locked in" flash on the header text.
  const [justLanded, setJustLanded] = useState(false)
  // True during the pause between spins: shows "Waiting for seller" before the
  // next spin rotates in.
  const [interSpinWaiting, setInterSpinWaiting] = useState(false)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const announceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Pause between one spin landing and the next spin starting.
  const interSpinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const hasStartedRef = useRef(false)
  const hasAnnouncedRef = useRef(false)

  // Soft tick sound, identical feel to the original spinner
  const playTick = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      if (ctx.state === "suspended") ctx.resume()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.02)
      oscillator.type = "sine"
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.03)
    } catch {
      // ignore audio errors
    }
  }, [])

  // Drives a single spin: cycles teams, slows down, lands on a random team.
  const runSpin = useCallback(
    (spot: Spot, onDone: (team: Team) => void) => {
      setSpinningSpot(spot)
      setJustLanded(false) // Clear the previous landed-green as the next spin starts
      setInterSpinWaiting(false) // Clear the "Waiting for seller" beat as we rotate in
      const target = Math.floor(Math.random() * teams.length)
      let speed = 50
      let elapsed = 0
      let idx = Math.floor(Math.random() * teams.length)

      const tick = () => {
        idx = (idx + 1) % teams.length
        setCurrentIndex(idx)
        playTick()
        elapsed += speed
        if (elapsed > 1200) speed += 30
        if (speed >= 400) {
          setCurrentIndex(target)
          // Turn the landed team green and keep it green through the pause; it is
          // cleared at the start of the next spin (see top of runSpin).
          setJustLanded(true)
          timeoutRef.current = setTimeout(() => {
            onDone(teams[target])
          }, 1600)
          return
        }
        timeoutRef.current = setTimeout(tick, speed)
      }
      timeoutRef.current = setTimeout(tick, speed)
    },
    [playTick],
  )

  // Kick off all spins sequentially once bidding starts.
  useEffect(() => {
    if (isSpinning && !hasStartedRef.current && stage === "idle") {
      hasStartedRef.current = true
      setStage("spinning")
      const order: Spot[] = SPOTS
      const landed: Record<Spot, Team> = {} as Record<Spot, Team>
      const runNext = (i: number) => {
        if (i >= order.length) {
          setSpinningSpot(0)
          setStage("ready")
          return
        }
        const spot = order[i]
        runSpin(spot, (team) => {
          landed[spot] = team
          setResults((prev) => ({ ...prev, [spot]: team }))
          setLandedOrder((prev) => [...prev, spot]) // newest appended last
          // Show "Waiting for seller" after a spot lands. Between spins we hold it
          // briefly then rotate the next spin in; on the final spin we leave it on
          // so the header goes from the landed green spot straight to "Waiting for
          // seller" (instead of reverting to the case break title) until the
          // parent takes over the pending-seller beat.
          setInterSpinWaiting(true)
          if (i + 1 >= order.length) {
            runNext(i + 1)
          } else {
            interSpinTimeoutRef.current = setTimeout(() => runNext(i + 1), 2500)
          }
        })
      }
      runNext(0)
    }
  }, [isSpinning, stage, runSpin])

  // Once all spots have landed: wait a short beat, then hand the full set of
  // landed spots up so the buyer can request one (and the seller assigns it).
  useEffect(() => {
    const allLanded = results[1] && results[2] && results[3]
    if (stage === "ready" && !hasAnnouncedRef.current && allLanded) {
      hasAnnouncedRef.current = true
      announceTimeoutRef.current = setTimeout(() => {
        const landedSet = SPOTS
          .filter((s) => results[s])
          .map((s) => ({ spot: s, team: results[s] as Team }))
        onSpotsLanded?.(landedSet)
      }, 1200)
    }
  }, [stage, results, onSpotsLanded])

  // Reset internal state when the engine is turned off (concept switch / reset)
  useEffect(() => {
    if (!isSpinning && stage !== "idle") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (announceTimeoutRef.current) clearTimeout(announceTimeoutRef.current)
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
      if (interSpinTimeoutRef.current) clearTimeout(interSpinTimeoutRef.current)
      hasStartedRef.current = false
      hasAnnouncedRef.current = false
      setStage("idle")
      setSpinningSpot(0)
      setResults({ 1: null, 2: null, 3: null })
      setLandedOrder([])
      setCurrentIndex(0)
      setJustLanded(false)
      setInterSpinWaiting(false)
    }
  }, [isSpinning, stage])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (announceTimeoutRef.current) clearTimeout(announceTimeoutRef.current)
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
      if (interSpinTimeoutRef.current) clearTimeout(interSpinTimeoutRef.current)
    }
  }, [])

  const renderChip = (spot: Spot) => {
    const result = results[spot]
    if (!result) return null
    const label = `${result.city} ${result.name}`
    const isAnnounced = pendingSpot === spot

    return (
      <motion.div
        key={spot}
        layout
        initial={{ opacity: 0, scale: 0.8, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="inline-flex h-4 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3 text-[10px] leading-none font-bold uppercase tracking-wide"
        style={{
          backgroundColor: isAnnounced ? "#4CE160" : "transparent",
          color: isAnnounced ? "#101820" : "#ffffff",
          boxShadow: isAnnounced ? "none" : "inset 0 0 0 1px rgba(255,255,255,0.6)",
        }}
      >
        {label}
      </motion.div>
    )
  }

  // Plain (non-animated) chip used inside the marquee track once populating is done.
  const renderMarqueeChip = (spot: Spot, key: string) => {
    const result = results[spot]
    if (!result) return null
    const isAnnounced = pendingSpot === spot
    return (
      <span
        key={key}
        className="inline-flex h-4 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3 text-[10px] leading-none font-bold uppercase tracking-wide"
        style={{
          backgroundColor: isAnnounced ? "#4CE160" : "transparent",
          color: isAnnounced ? "#101820" : "#ffffff",
          boxShadow: isAnnounced ? "none" : "inset 0 0 0 1px rgba(255,255,255,0.6)",
        }}
      >
        {result.city} {result.name}
      </span>
    )
  }

  const isAnySpinning = spinningSpot !== 0
  // Newest selection first (leftmost), older chips pushed to the right.
  const assignedSpots = landedOrder
  // Once every spot has landed, the chips row turns into a continuous marquee.
  const donePopulating = stage === "ready" && landedOrder.length === SPOTS.length

  return (
    <div className="w-full">
      <motion.div
        className="relative bg-black/40 backdrop-blur rounded-xl overflow-hidden"
        animate={{
          boxShadow: "none",
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Header row: thumbnail + title + spots + view spots */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-white text-xs"
              style={{ backgroundColor: isAnySpinning && !interSpinWaiting ? teams[currentIndex].color : "transparent" }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
            >
              {isAnySpinning && !interSpinWaiting ? (
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
                {pendingSeller || interSpinWaiting ? (
                  <motion.div key="pending">
                    <PendingIndicator />
                  </motion.div>
                ) : isAnySpinning ? (
                  <motion.span
                    key={justLanded ? "landed" : teams[currentIndex].name}
                    className="font-semibold text-sm truncate"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, color: justLanded ? "#4CE160" : "#ffffff" }}
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
                <span className="text-sm text-white">
                  {availableSpots}/{totalSpots} spots available
                </span>
              </button>
            </div>

            <button
              onClick={onViewSpots}
              className="flex items-center gap-1 text-white/50 hover:text-white/70 transition-colors flex-shrink-0"
            >
              <span className="text-sm">View all</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Divider + label are always present so "Multi-spin, choose one" shows
            even before bidding. Chips then populate one-by-one below as each spot
            lands, in a single horizontally-swipeable row. */}
        <div>
          {/* Divider separating the break header from the chips row */}
          <div className="mx-4 border-t border-white/10" />

          {/* Label row above the populated spots */}
          <div className="flex items-center justify-between gap-2 px-4 pt-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-white/70 flex-shrink-0" />
              <span className="text-sm text-white">Multi-spin, choose one</span>
            </div>
            <button
              onClick={onViewSpots}
              className="flex items-center gap-1 text-white/50 hover:text-white/70 transition-colors flex-shrink-0"
            >
              <span className="text-sm">Break rules</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {donePopulating ? (
            // All spots landed: chips scroll back and forth like the title marquee.
            <div className="px-4 pt-2 pb-3">
              <BackAndForthMarquee trackClassName="flex gap-2">
                {assignedSpots.map((spot) => renderMarqueeChip(spot, `${spot}`))}
              </BackAndForthMarquee>
            </div>
          ) : (
            // Still populating (or empty before bidding): chips grow in a
            // swipeable row as each lands.
            <div
              className="px-4 pt-2 pb-3 flex gap-2 overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <AnimatePresence initial={false}>
                {assignedSpots.map((spot) => renderChip(spot))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
