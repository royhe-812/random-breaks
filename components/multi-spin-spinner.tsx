"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { teams, type Team } from "@/components/team-spinner"

interface MultiSpinSpinnerProps {
  totalSpots: number
  availableSpots: number
  /** When true, kicks off the two sequential spins (one per spot). */
  isSpinning: boolean
  /** Fired when the buyer commits to one of the two spun spots. */
  onSelect: (team: Team, spot: 1 | 2) => void
  /** The spot the buyer selected, now awaiting seller assignment. */
  pendingSpot?: 1 | 2 | null
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

type Stage = "idle" | "spinning1" | "spinning2" | "ready" | "selected"

export function MultiSpinSpinner({
  totalSpots,
  availableSpots,
  isSpinning,
  onSelect,
  pendingSpot = null,
  lastWinner = null,
  onViewSpots,
}: MultiSpinSpinnerProps) {
  const [stage, setStage] = useState<Stage>("idle")
  const [spinningSpot, setSpinningSpot] = useState<0 | 1 | 2>(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [spot1, setSpot1] = useState<Team | null>(null)
  const [spot2, setSpot2] = useState<Team | null>(null)

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
    (spot: 1 | 2, onDone: (team: Team) => void) => {
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

  // Kick off both spins sequentially once bidding starts.
  useEffect(() => {
    if (isSpinning && !hasStartedRef.current && stage === "idle") {
      hasStartedRef.current = true
      setStage("spinning1")
      runSpin(1, (teamA) => {
        setSpot1(teamA)
        setStage("spinning2")
        runSpin(2, (teamB) => {
          setSpot2(teamB)
          setSpinningSpot(0)
          setStage("ready")
        })
      })
    }
  }, [isSpinning, stage, runSpin])

  // Reset internal state when the engine is turned off (concept switch / reset)
  useEffect(() => {
    if (!isSpinning && stage !== "idle" && pendingSpot === null) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      hasStartedRef.current = false
      setStage("idle")
      setSpinningSpot(0)
      setSpot1(null)
      setSpot2(null)
      setCurrentIndex(0)
    }
  }, [isSpinning, stage, pendingSpot])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const renderSpotRow = (spot: 1 | 2) => {
    const result = spot === 1 ? spot1 : spot2
    const team = result
    const label = result ? `${result.city} ${result.name}` : ""
    const canSelect = !!result && pendingSpot === null
    const isPendingHere = pendingSpot === spot

    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-white font-bold text-sm whitespace-nowrap">Spot #{spot}:</span>
          <AnimatePresence mode="wait">
            {label && team && (
              <motion.span
                key={`${spot}-final`}
                className="font-bold text-sm truncate"
                style={{ color: "lab(78.503 -64.9265 39.7492)" }}
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
                ? "border-white text-white hover:bg-white/10"
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
                  src="/images/watches-surprise-set.png"
                  alt="Luxury watches surprise set"
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
                      Luxury Watches Surprise Set &nbsp;&nbsp;&nbsp;&nbsp; Luxury Watches Surprise Set &nbsp;&nbsp;&nbsp;&nbsp;
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Divider separating the break header from the spin slots */}
        <div className="mx-4 border-t border-white/10" />

        {/* Two spin slots */}
        <div className="px-4 pt-3 pb-3 flex flex-col gap-3">
          {renderSpotRow(1)}
          {renderSpotRow(2)}
        </div>
      </motion.div>
    </div>
  )
}
