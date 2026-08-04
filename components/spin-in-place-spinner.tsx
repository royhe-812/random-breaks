"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { teams, type Team } from "@/components/team-spinner"

interface SpinInPlaceSpinnerProps {
  /** True while spinning, false to reset. */
  isSpinning: boolean
  /** Fired once the spin lands — pass the winning team up. */
  onLanded: (team: Team) => void
  /** @deprecated No longer rendered — the bidder subtitle was replaced by the
   *  auction card title row. Kept so existing call sites still type-check. */
  winnerName?: string
  /** Break number shown in the subtitle, kept in sync with the bid box card. */
  breakNumber?: number
  /** Spots still available — kept in sync with the bid box card. */
  availableSpots?: number
  /** Total spots in the break. */
  totalSpots?: number
  /** Tapping the spots row opens the break spots sheet. */
  onViewSpots?: () => void
  /**
   * Forces the spin to land on a specific team index instead of picking one at
   * random. Used by the testing zone to make outcomes reproducible; leave
   * undefined/null in production for genuinely random results.
   */
  forceTeamIndex?: number | null
  /**
   * Total time the spin takes, in ms. This variant's timing is emergent (it
   * ticks fast then decays until it crosses a speed threshold) rather than a
   * fixed duration, so the value is applied as a scale factor over the natural
   * ~4200ms run to keep the original feel while stretching/compressing it.
   */
  spinDuration?: number
  /** Speed the drum begins at, as a fraction of its peak speed. */
  startSpeed?: number
  /** Fraction of the spin spent accelerating up to peak speed. */
  rampUp?: number
  /**
   * Shape of the deceleration. Low values keep speed then stop sharply; high
   * values ease off early and creep to a halt like a game-show wheel.
   */
  stopEase?: number
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
  onViewSpots,
  forceTeamIndex = null,
  spinDuration = 4200,
  startSpeed = 0.15,
  rampUp = 0.3,
  stopEase = 3,
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

    const target =
      forceTeamIndex !== null && forceTeamIndex >= 0 && forceTeamIndex < teams.length
        ? forceTeamIndex
        : Math.floor(Math.random() * teams.length)
    // Natural run of the untouched decay curve, measured from the constants
    // below: ~1200ms at full speed + ~2640ms of decay + 800ms settle. Scaling
    // every interval by this factor makes the total track `spinDuration`.
    // This variant's runtime is emergent (it ticks, then decays until crossing a
    // speed threshold), so there's no closed form for "make it last N ms". A
    // fixed scale factor drifted up to 27% once ramp-up was added, so instead we
    // simulate the loop and bisect for the scale that lands on `spinDuration`.
    const rampMs = Math.max(0, Math.min(0.9, rampUp)) * spinDuration
    const speedFrac = Math.max(0.02, Math.min(1, startSpeed))
    const k = Math.min(8, Math.max(0.3, stopEase))

    // The decay used to grow the tick interval by a fixed additive step, which
    // gave one unchangeable stop feel. It's now driven by the same exponential
    // velocity curve the roller uses, so `stopEase` shapes the tail identically:
    // progress `u` walks 0 -> 1 while speed falls as (1 - u)^k.
    const V_MIN = 0.04 // floor speed, so the final crawl can't stall forever
    const DECAY_BUDGET = 2600 // nominal ms of decay, before scaling

    const runLoop = (s: number) => {
      const peak = 50 * s
      const startInt = peak / speedFrac
      const budget = DECAY_BUDGET * s
      let acc = 0
      let u = 0
      let wall = rampMs > 0 ? startInt : peak
      for (let guard = 0; guard < 40000; guard++) {
        let interval: number
        if (rampMs > 0 && acc < rampMs) {
          const x = acc / rampMs
          interval = startInt + (peak - startInt) * (x * x * (3 - 2 * x))
        } else {
          interval = peak / Math.max(V_MIN, Math.pow(1 - u, k))
          u += interval / budget
        }
        acc += interval
        wall += interval
        if (u >= 1) break
      }
      return wall + 800 * s
    }

    // No closed form for this loop's runtime, so bisect for the scale that makes
    // the simulated total land exactly on `spinDuration`.
    let lo = 0.005
    let hi = 6
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2
      if (runLoop(mid) < spinDuration) lo = mid
      else hi = mid
    }
    const scale = (lo + hi) / 2
    const settleMs = 800 * scale
    const decayBudget = DECAY_BUDGET * scale

    // `speed` here is a tick *interval* in ms, so larger means slower. The drum
    // therefore starts on a long interval and shortens it as it accelerates.
    const peakInterval = 50 * scale
    const startInterval = peakInterval / Math.max(0.02, Math.min(1, startSpeed))
    const smoothstep = (x: number) => x * x * (3 - 2 * x)

    let elapsed = 0
    let decayU = 0
    let idx = Math.floor(Math.random() * teams.length)

    const intervalFor = () => {
      if (rampMs > 0 && elapsed < rampMs) {
        return startInterval + (peakInterval - startInterval) * smoothstep(elapsed / rampMs)
      }
      const interval = peakInterval / Math.max(V_MIN, Math.pow(1 - decayU, k))
      decayU += interval / decayBudget
      return interval
    }

    setStage("spinning")
    setWinner(null)
    setJustLanded(false)
    setCurrentIndex(idx)

    const step = () => {
      if (cancelled) return
      idx = (idx + 1) % teams.length
      setCurrentIndex(idx)
      playTick()
      const interval = intervalFor()
      elapsed += interval

      // Decay curve exhausted — snap to the winner and settle. The final
      // interval is still honoured before landing (the simulator counts it, so
      // skipping it here would cut the measured total short and, worse, would
      // swallow the long last crawl step that high `stopEase` values create).
      if (decayU >= 1) {
        landTimer = setTimeout(() => {
          if (cancelled) return
          setCurrentIndex(target)
          setJustLanded(true)
          landTimer = setTimeout(() => {
            if (cancelled) return
            setJustLanded(false)
            setWinner(teams[target])
            setStage("landed")
            onLandedRef.current(teams[target])
          }, settleMs)
        }, interval)
        return
      }
      tickTimer = setTimeout(step, interval)
    }
    tickTimer = setTimeout(step, rampMs > 0 ? startInterval : peakInterval)

    return () => {
      cancelled = true
      if (tickTimer) clearTimeout(tickTimer)
      if (landTimer) clearTimeout(landTimer)
    }
  }, [isSpinning, playTick, forceTeamIndex, spinDuration, startSpeed, rampUp, stopEase])

  const isLanded = stage === "landed"
  const displayTeam = isLanded ? winner : teams[currentIndex]

  return (
    // Outer card — matches the dark rounded bid box card shape exactly.
    // Height hugs the content: there's no footer left to anchor to the bottom,
    // so h-full/justify-between/minHeight would only add dead space.
    <div className="w-full flex flex-col gap-2">

      {/* Auction card title row — mirrors the bid box card in the live stream.
          Sits above the badge row (rather than in the narrow text stack beside
          it) so the full card width is available before the title truncates. */}
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 min-w-0 truncate text-sm leading-tight text-white">
          <span className="font-semibold">
            {`Random Break #${breakNumber}`}
            {" — 2025 Panini Luminance Football Hobby PYT Box Break #903"}
          </span>
        </p>
        <button
          type="button"
          onClick={onViewSpots}
          aria-label="View break spots"
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          <ChevronRight className="w-5 h-5 text-white/40" />
        </button>
      </div>

      {/* ── Main content row ── */}
      <div className="flex items-stretch gap-3">

        {/* Left: large square coloured badge with team abbrev.
            Renders the abbrev directly (no AnimatePresence) so it flips crisply
            on every ~50ms spin tick — mirrors the single-spin thumbnail cycling.
            A short backgroundColor transition keeps the color changes smooth. */}
        <motion.div
          className="flex-shrink-0 rounded-xl flex items-center justify-center font-bold text-white"
          style={{ width: 72, height: 100, fontSize: 20, letterSpacing: "0.05em" }}
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


        </div>
      </div>


    </div>
  )
}
