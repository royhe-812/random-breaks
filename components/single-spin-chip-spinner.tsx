"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { teams, type Team } from "@/components/team-spinner"

interface SingleSpinChipSpinnerProps {
  totalSpots: number
  availableSpots: number
  /** When true, kicks off the single spin. */
  isSpinning: boolean
  /** When set (to 1), the landed chip shows the green "selected" highlight. */
  pendingSpot?: 1 | null
  /** Fired once the spin lands and the pending beat resolves. */
  onAnnounce?: (team: Team, spot: 1) => void
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
    <span className="text-white font-semibold text-sm whitespace-nowrap">Pending seller</span>
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

  const getProgressColor = (pct: number) => {
    if (pct > 50) return "#4CE160"
    if (pct > 30) return "#F5A623"
    return "#FF4444"
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

export function SingleSpinChipSpinner({
  totalSpots,
  availableSpots,
  isSpinning,
  pendingSpot = null,
  onAnnounce,
  onViewSpots,
}: SingleSpinChipSpinnerProps) {
  const [stage, setStage] = useState<Stage>("idle")
  const [isCycling, setIsCycling] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [result, setResult] = useState<Team | null>(null)
  const [showPending, setShowPending] = useState(false)

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
          timeoutRef.current = setTimeout(() => {
            setIsCycling(false)
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

  // Once the chip has landed: wait a beat, surface the "Pending seller" state,
  // then announce the landed team.
  useEffect(() => {
    if (stage === "ready" && !hasAnnouncedRef.current && result) {
      hasAnnouncedRef.current = true
      announceTimeoutRef.current = setTimeout(() => {
        setShowPending(true)
        pendingTimeoutRef.current = setTimeout(() => {
          setShowPending(false)
          onAnnounce?.(result, 1)
        }, 2500)
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
      setShowPending(false)
      setCurrentIndex(0)
    }
  }, [isSpinning, stage])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (announceTimeoutRef.current) clearTimeout(announceTimeoutRef.current)
      if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current)
    }
  }, [])

  const glowColor = isCycling ? teams[currentIndex].color : undefined
  const isAnnounced = pendingSpot === 1

  return (
    <div className="w-full">
      <motion.div
        className="relative bg-black/40 backdrop-blur rounded-xl overflow-hidden"
        animate={{
          boxShadow: glowColor ? `0 0 20px ${glowColor}40, 0 0 40px ${glowColor}20` : "none",
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Header row: thumbnail + title + spots + view spots */}
        <div className="px-4 pt-3 pb-2">
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
                {showPending ? (
                  <motion.div key="pending">
                    <PendingIndicator />
                  </motion.div>
                ) : isCycling ? (
                  <motion.span
                    key={teams[currentIndex].name}
                    className="text-white font-semibold text-sm truncate"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.05 }}
                  >
                    {teams[currentIndex].city} {teams[currentIndex].name}
                  </motion.span>
                ) : (
                  <div key="marquee" className="overflow-hidden">
                    <motion.div
                      className="text-white font-semibold text-sm whitespace-nowrap"
                      animate={{ x: ["0%", "-50%"] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                      2025 Panini Luminance Football Hobby PYT Box Break #903 &nbsp;&nbsp;&nbsp;&nbsp; 2025 Panini Luminance Football Hobby PYT Box Break #903 &nbsp;&nbsp;&nbsp;&nbsp;
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
              <button onClick={onViewSpots} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
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
              <span className="text-sm">View spots</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Divider separating the break header from the spot row */}
        <div className="mx-4 border-t border-white/10" />

        {/* Persistent "Spot:" row. The landed team is added next to the label
            as a single colored chip once the spin lands, and stays present
            until the concept is reset. */}
        <div className="px-4 pt-3 pb-3 flex items-center gap-2 min-h-[3.25rem]">
          <span className="text-white font-bold text-sm whitespace-nowrap">Spot:</span>
          <AnimatePresence>
            {result && (
              <motion.div
                key="chip"
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
                {result.city} {result.name}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
