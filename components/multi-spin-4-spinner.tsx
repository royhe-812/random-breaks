"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { teams, type Team } from "@/components/team-spinner"

type Spot = 1 | 2 | 3 | 4

interface MultiSpin4SpinnerProps {
  totalSpots: number
  availableSpots: number
  /** When true, kicks off the four sequential spins (one per spot). */
  isSpinning: boolean
  /** Fired when the buyer commits to one of the four spun spots. */
  onSelect: (team: Team, spot: Spot) => void
  /** The spot the buyer selected, now awaiting seller assignment. */
  pendingSpot?: Spot | null
  /** The most recent winner, shown at the bottom. Updates after a selection. */
  lastWinner?: { username: string; team: string } | null
  onViewSpots?: () => void
}

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

type Stage = "idle" | "spinning" | "ready"

export function MultiSpin4Spinner({
  totalSpots,
  availableSpots,
  isSpinning,
  onSelect,
  pendingSpot = null,
  lastWinner = null,
  onViewSpots,
}: MultiSpin4SpinnerProps) {
  const [stage, setStage] = useState<Stage>("idle")
  const [spinningSpot, setSpinningSpot] = useState<0 | Spot>(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<Record<Spot, Team | null>>({ 1: null, 2: null, 3: null, 4: null })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const hasStartedRef = useRef(false)

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
          timeoutRef.current = setTimeout(() => onDone(teams[target]), 800)
          return
        }
        timeoutRef.current = setTimeout(tick, speed)
      }
      timeoutRef.current = setTimeout(tick, speed)
    },
    [playTick],
  )

  // Kick off all four spins sequentially once bidding starts.
  useEffect(() => {
    if (isSpinning && !hasStartedRef.current && stage === "idle") {
      hasStartedRef.current = true
      setStage("spinning")
      const order: Spot[] = [1, 2, 3, 4]
      const runNext = (i: number) => {
        if (i >= order.length) {
          setSpinningSpot(0)
          setStage("ready")
          return
        }
        const spot = order[i]
        runSpin(spot, (team) => {
          setResults((prev) => ({ ...prev, [spot]: team }))
          runNext(i + 1)
        })
      }
      runNext(0)
    }
  }, [isSpinning, stage, runSpin])

  // Reset internal state when the engine is turned off (concept switch / reset)
  useEffect(() => {
    if (!isSpinning && stage !== "idle" && pendingSpot === null) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      hasStartedRef.current = false
      setStage("idle")
      setSpinningSpot(0)
      setResults({ 1: null, 2: null, 3: null, 4: null })
      setCurrentIndex(0)
    }
  }, [isSpinning, stage, pendingSpot])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const renderSpotRow = (spot: Spot) => {
    const result = results[spot]
    const team = result
    const label = result ? `${result.city} ${result.name}` : ""
    const canSelect = !!result && pendingSpot === null
    const isPendingHere = pendingSpot === spot

    return (
      <div key={spot} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-white font-bold text-sm whitespace-nowrap">Spot #{spot}:</span>
          <AnimatePresence mode="wait">
            {label && (
              <motion.span
                key={`${spot}-final`}
                className="text-white font-bold text-sm truncate"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          disabled={!canSelect}
          onClick={() => team && onSelect(team, spot)}
          className={`flex-shrink-0 px-5 py-1.5 rounded-full font-medium text-sm border transition-colors ${
            isPendingHere
              ? "border-green-400 bg-green-400 text-black"
              : canSelect
                ? "bg-[#8F8F8F] border-[#8F8F8F] text-black hover:bg-[#9d9d9d] hover:border-[#9d9d9d]"
                : "border-white/15 text-white/30 cursor-not-allowed"
          }`}
        >
          {isPendingHere ? (
            <span className="relative inline-flex items-center justify-center">
              <span className="invisible" aria-hidden="true">Select</span>
              <Loader2 className="w-4 h-4 animate-spin absolute" aria-label="Pending seller" />
            </span>
          ) : (
            "Select"
          )}
        </button>
      </div>
    )
  }

  const isAnySpinning = spinningSpot !== 0
  const glowColor = isAnySpinning ? teams[currentIndex].color : undefined

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
              style={{ backgroundColor: isAnySpinning ? teams[currentIndex].color : "transparent" }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
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
                {pendingSpot !== null ? (
                  <motion.div key="pending">
                    <PendingIndicator />
                  </motion.div>
                ) : isAnySpinning ? (
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

        {/* Divider separating the break header from the spin slots */}
        <div className="mx-4 border-t border-white/10" />

        {/* Four spin slots */}
        <div className="px-4 pt-3 pb-3 flex flex-col gap-3">
          {([1, 2, 3, 4] as Spot[]).map((spot) => renderSpotRow(spot))}
        </div>
      </motion.div>
    </div>
  )
}
