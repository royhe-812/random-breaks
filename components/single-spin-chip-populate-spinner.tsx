"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { teams, type Team } from "@/components/team-spinner"

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

interface SingleSpinChipPopulateSpinnerProps {
  totalSpots: number
  availableSpots: number
  /** When true, kicks off the single spin. */
  isSpinning: boolean
  /** When set (to 1), the landed chip shows the green "selected" highlight. */
  pendingSpot?: 1 | null
  /** When true, the spinner shows the "Pending seller" state (driven after the reveal). */
  pendingSeller?: boolean
  /** Fired once the spin lands, to trigger the full-screen reveal. */
  onAnnounce?: (team: Team, spot: 1) => void
  /** Tapping the spots arc cycles the available count through the color tiers. */
  onCycleSpots?: () => void
  onViewSpots?: () => void
}

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

export function SingleSpinChipPopulateSpinner({
  totalSpots,
  availableSpots,
  isSpinning,
  pendingSpot = null,
  pendingSeller = false,
  onAnnounce,
  onCycleSpots,
  onViewSpots,
}: SingleSpinChipPopulateSpinnerProps) {
  const [stage, setStage] = useState<Stage>("idle")
  const [isCycling, setIsCycling] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [result, setResult] = useState<Team | null>(null)
  // True briefly when the spin lands on a spot, before it settles. Flashes the
  // landed team green in the header (mirrors the multi-spin behavior).
  const [justLanded, setJustLanded] = useState(false)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const announceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  // Drives the single spin: cycles teams, slows down, lands on a random team.
  const runSpin = useCallback(
    (onDone: (team: Team) => void) => {
      setIsCycling(true)
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
          // Flash the landed team green while it settles.
          setJustLanded(true)
          timeoutRef.current = setTimeout(() => {
            setIsCycling(false)
            setJustLanded(false)
            onDone(teams[target])
          }, 800)
          return
        }
        timeoutRef.current = setTimeout(tick, speed)
      }
      timeoutRef.current = setTimeout(tick, speed)
    },
    [playTick],
  )

  // Kick off the single spin once bidding starts.
  useEffect(() => {
    if (isSpinning && !hasStartedRef.current && stage === "idle") {
      hasStartedRef.current = true
      setStage("spinning")
      runSpin((team) => {
        setResult(team)
        setStage("ready")
      })
    }
  }, [isSpinning, stage, runSpin])

  // Once the chip has landed: wait a short beat (so the green flash reads),
  // then announce to trigger the full-screen reveal. The "Pending seller" state
  // is shown after the reveal, driven by the pendingSeller prop.
  useEffect(() => {
    if (stage === "ready" && !hasAnnouncedRef.current && result) {
      hasAnnouncedRef.current = true
      announceTimeoutRef.current = setTimeout(() => {
        onAnnounce?.(result, 1)
      }, 1200)
    }
  }, [stage, result, onAnnounce])

  // Reset internal state when the engine is turned off (concept switch / reset)
  useEffect(() => {
    if (!isSpinning && stage !== "idle") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (announceTimeoutRef.current) clearTimeout(announceTimeoutRef.current)
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
      hasStartedRef.current = false
      hasAnnouncedRef.current = false
      setStage("idle")
      setIsCycling(false)
      setResult(null)
      setCurrentIndex(0)
      setJustLanded(false)
    }
  }, [isSpinning, stage])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (announceTimeoutRef.current) clearTimeout(announceTimeoutRef.current)
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
    }
  }, [])

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
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-white text-xs"
              style={{ backgroundColor: isCycling ? teams[currentIndex].color : "transparent" }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
            >
              {isCycling ? (
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
                {result && !isCycling ? (
                  <motion.span
                    key="result"
                    className="font-semibold text-sm truncate"
                    style={{ color: "#4CE160" }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {result.city} {result.name}
                  </motion.span>
                ) : isCycling ? (
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

        {/* No chip or divider — the landed spot name simply persists in green
            in the header once the spin settles. */}
      </motion.div>
    </div>
  )
}
