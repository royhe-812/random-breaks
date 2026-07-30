"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { teams, type Team } from "@/components/team-spinner"

interface SpinInPlaceSpinnerProps {
  /** True while spinning, false to reset. */
  isSpinning: boolean
  /** Fired once the spin lands — pass the winning team up. */
  onLanded: (team: Team) => void
  /** Winner name to display in "Picking team for X" */
  winnerName?: string
  /** Break number shown in the subtitle, kept in sync with the bid box card. */
  breakNumber?: number
  /** Spots still available — kept in sync with the bid box card. */
  availableSpots?: number
  /** Total spots in the break. */
  totalSpots?: number
}

type Stage = "idle" | "spinning" | "landed"

// Circular progress indicator matching the rest of the app
function CircularProgress({ available, total, size = 14 }: { available: number; total: number; size?: number }) {
  const pct = (available / total) * 100
  const sw = 2.5
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct <= 25 ? "#ef4444" : pct <= 50 ? "#f97316" : pct <= 75 ? "#eab308" : "#4ce160"
  return (
    <svg className="transform -rotate-90 flex-shrink-0" width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={sw} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
      />
    </svg>
  )
}

export function SpinInPlaceSpinner({
  isSpinning,
  onLanded,
  winnerName = "Adam007",
  breakNumber = 15,
  availableSpots = 15,
  totalSpots = 32,
}: SpinInPlaceSpinnerProps) {
  const [stage, setStage] = useState<Stage>("idle")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [winner, setWinner] = useState<Team | null>(null)
  const [justLanded, setJustLanded] = useState(false)

  const audioRef = useRef<AudioContext | null>(null)
  // Keep the latest onLanded without making it an effect dependency, so a new
  // callback identity from the parent can never restart the spin mid-flight.
  const onLandedRef = useRef(onLanded)
  useEffect(() => {
    onLandedRef.current = onLanded
  }, [onLanded])

  const playTick = useCallback(() => {
    try {
      if (!audioRef.current)
        audioRef.current = new (window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const ctx = audioRef.current
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
    } catch { /* ignore */ }
  }, [])

  // Single self-contained spin engine. All timers and progress live inside the
  // effect, so its cleanup fully cancels the run and a re-run restarts it from
  // scratch. This keeps it correct under React Strict Mode's mount/unmount/
  // remount cycle — the previous version latched on a ref, so the Strict Mode
  // cleanup killed the timers and the restart was blocked, leaving the card
  // frozen on a single static team instead of spinning.
  useEffect(() => {
    if (!isSpinning) {
      setStage("idle")
      setCurrentIndex(0)
      setWinner(null)
      setJustLanded(false)
      return
    }

    let cancelled = false
    let tickTimer: ReturnType<typeof setTimeout> | null = null
    let landTimer: ReturnType<typeof setTimeout> | null = null

    const target = Math.floor(Math.random() * teams.length)
    let speed = 50
    let elapsed = 0
    let idx = Math.floor(Math.random() * teams.length)

    setStage("spinning")
    setWinner(null)
    setJustLanded(false)
    setCurrentIndex(idx)

    const step = () => {
      if (cancelled) return
      idx = (idx + 1) % teams.length
      setCurrentIndex(idx)
      playTick()
      elapsed += speed
      if (elapsed > 1200) speed += 30

      // Slowed past the threshold — snap to the winner and settle.
      if (speed >= 400) {
        setCurrentIndex(target)
        setJustLanded(true)
        landTimer = setTimeout(() => {
          if (cancelled) return
          setJustLanded(false)
          setWinner(teams[target])
          setStage("landed")
          onLandedRef.current(teams[target])
        }, 800)
        return
      }
      tickTimer = setTimeout(step, speed)
    }
    tickTimer = setTimeout(step, speed)

    return () => {
      cancelled = true
      if (tickTimer) clearTimeout(tickTimer)
      if (landTimer) clearTimeout(landTimer)
    }
  }, [isSpinning, playTick])

  const isLanded = stage === "landed"
  const displayTeam = isLanded ? winner : teams[currentIndex]

  return (
    // Outer card — matches the dark rounded bid box card shape exactly.
    // h-full + justify-between so it fills the measured bid box height and the
    // footer row anchors to the bottom (main row stays at the top).
    <div className="w-full h-full flex flex-col justify-between gap-0" style={{ minHeight: 120 }}>

      {/* ── Main content row ── */}
      <div className="flex items-stretch gap-3">

        {/* Left: large square coloured badge with team abbrev.
            Renders the abbrev directly (no AnimatePresence) so it flips crisply
            on every ~50ms spin tick — mirrors the single-spin thumbnail cycling.
            A short backgroundColor transition keeps the color changes smooth. */}
        <motion.div
          className="flex-shrink-0 rounded-xl flex items-center justify-center font-bold text-white"
          style={{ width: 72, height: 72, fontSize: 20, letterSpacing: "0.05em" }}
          animate={{
            backgroundColor: displayTeam ? displayTeam.color : "rgba(255,255,255,0.12)",
            scale: justLanded ? [1, 1.08, 1] : 1,
          }}
          transition={{ backgroundColor: { duration: 0.08 }, scale: { duration: 0.3 } }}
        >
          {displayTeam?.abbrev ?? "—"}
        </motion.div>

        {/* Right: text stack */}
        <div className="flex flex-col justify-center flex-1 min-w-0 gap-0.5">

          {/* "Random Break #15 · Adam007" subtitle */}
          <p className="text-sm leading-tight" style={{ color: "#8f8f8f" }}>
            Random Break #{breakNumber} &middot;{" "}
            <span className="font-semibold text-white">{winnerName}</span>
          </p>

          {/* Cycling / settled team name */}
          <AnimatePresence mode="wait">
            {isLanded && winner ? (
              <motion.p
                key="winner-name"
                className="font-bold text-lg leading-snug truncate"
                style={{ color: "lab(78.503 -64.9265 39.7492)" }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {winner.city} {winner.name}
              </motion.p>
            ) : (
              /* Spinning: render the name directly (stable key, no per-tick
                 enter/exit) so it swaps in the same frame as the badge. An
                 AnimatePresence swap here lagged behind the ~50ms ticks and
                 left the name showing a different team than the badge. */
              <motion.p
                key="spinning-name"
                className="font-bold text-lg leading-snug truncate"
                animate={{
                  color: justLanded ? "lab(78.503 -64.9265 39.7492)" : "#ffffff",
                }}
                transition={{ duration: justLanded ? 0.15 : 0.08 }}
              >
                {displayTeam?.city} {displayTeam?.name}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Spots available row */}
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center gap-1.5">
              <CircularProgress available={availableSpots} total={totalSpots} size={14} />
              <span className="text-sm" style={{ color: "#f7f7f7" }}>
                {availableSpots}/{totalSpots} spots available
              </span>
            </div>
            {/* Chevron right */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8f8f8f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Bottom block: divider + footer, anchored to the card bottom ── */}
      <div>
        {/* Divider */}
        <div className="mb-3" style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />

        {/* Footer row: "Spots are generated randomly · Break rules" */}
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "#707070" }}>
            Spots are generated randomly
          </span>
          <button
            className="text-sm underline underline-offset-2 transition-opacity hover:opacity-80"
            style={{ color: "#707070" }}
          >
            Break rules
          </button>
        </div>
      </div>
    </div>
  )
}
