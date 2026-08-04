"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { teams, type Team } from "@/components/team-spinner"

interface SpinRollerSpinnerProps {
  /** True while spinning, false to reset. */
  isSpinning: boolean
  /** Fired once the roller lands — pass the winning team up. */
  onLanded: (team: Team) => void
  /** Winning bidder's username, shown bold under the title row. */
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
   * Total time the drum spends spinning, in ms, from first motion to resting on
   * the winner. Exposed so the testing zone can tune it live via dialkit.
   */
  spinDuration?: number
  /**
   * Speed the drum begins at, as a fraction of its peak speed. 1 reproduces the
   * old behaviour (instantly at full tilt); lower values ease it in.
   */
  startSpeed?: number
  /** Fraction of the spin spent accelerating up to peak speed. */
  rampUp?: number
  /**
   * Shape of the deceleration. Low values keep speed then stop sharply; high
   * values ease off early and creep to a halt like a game-show wheel.
   */
  stopEase?: number
  /**
   * Centre-to-centre spacing between adjacent team names, in px. Tightens or
   * expands the drum's rows without resizing the drum itself: the radius stays
   * fixed, so the centre row keeps its exact size and only the angular
   * separation of its neighbours changes. Defaults to ITEM_H (34).
   */
  rowPitch?: number
}

/* ── Cylinder geometry ──
   The roller is a real 3D cylinder, not a flat list: each row sits on the
   surface of a drum rotating around the X axis. That's what gives the rows
   above and below centre their curve/foreshortening.

   Placing a row at `rotateX(-angle) translateZ(R)` puts it at screen
   y = R * sin(angle). To make one step of the drum travel exactly ITEM_H at
   centre, R must satisfy R * STEP_RAD = ITEM_H, hence R = ITEM_H / STEP_RAD. */
const ITEM_H = 34
/** Widest NFL team name across all 32 teams — "Washington Commanders" — as
 *  measured at the row type (600 14px Geist). Re-measure if the row
 *  font/size/weight changes. */
const WIDEST_NAME_W = 172
/** Horizontal padding either side of the name inside the centre pill. */
const PILL_PAD_X = 16
/** Fixed width of the centre selection pill: widest name + padding both sides. */
const PILL_W = WIDEST_NAME_W + PILL_PAD_X * 2
/** Angular separation between rows at the default pitch. Only used to derive
 *  RADIUS — the live value is computed per-render from the `rowPitch` prop. */
const DEFAULT_STEP_DEG = 20
const RADIUS = ITEM_H / (DEFAULT_STEP_DEG * (Math.PI / 180))
/** Past this angle a row is so close to edge-on it isn't worth drawing. Also
 *  sets how many rows the visible window needs at a given pitch. */
const EDGE_ON_DEG = 72

/** Hold time on the winning row after the drum stops, before reporting up. */
const SETTLE_MS = 800

/**
 * Builds the drum's position curve from a *velocity* profile rather than a
 * position ease. `easeOutQuart` alone starts at peak speed (its slope at t=0 is
 * maximal), which is why the drum used to snap straight into full motion. Here
 * the drum accelerates from `startSpeed` up to full speed across the first
 * `rampFraction` of the run, then decays to rest on the original quart curve.
 *
 * `stopEase` shapes the deceleration tail. It is the exponent of the decaying
 * velocity curve, so low values hold speed and then cut off abruptly, while high
 * values shed speed early and crawl to a halt — the drawn-out game-show stop.
 *
 * The profile is integrated into a normalised lookup table so the curve is
 * guaranteed to travel exactly 0 -> 1. That matters: the drum must still come to
 * rest precisely on the winning row no matter how the dials are set.
 */
function buildSpinEase(startSpeed: number, rampFraction: number, stopEase: number) {
  const SAMPLES = 480
  const r = Math.min(0.95, Math.max(0, rampFraction))
  // Never allow 0 — a dead stop at t=0 wastes the front of the animation.
  const v0 = Math.min(1, Math.max(0.02, startSpeed))
  const k = Math.min(8, Math.max(0.3, stopEase))

  // Floor on the decaying velocity. Without it, a high `stopEase` drives speed
  // to ~0 well before the end, so the drum visibly freezes for the last stretch
  // instead of creeping. The floor keeps it inching forward to the very end.
  const V_MIN = 0.06

  const smoothstep = (x: number) => x * x * (3 - 2 * x)
  const velocity = (t: number) => {
    if (r > 0 && t < r) return v0 + (1 - v0) * smoothstep(t / r)
    const u = r >= 1 ? 0 : (t - r) / (1 - r)
    return Math.max(V_MIN, Math.pow(1 - u, k))
  }

  const cumulative = new Float64Array(SAMPLES + 1)
  const dt = 1 / SAMPLES
  for (let i = 1; i <= SAMPLES; i++) {
    cumulative[i] = cumulative[i - 1] + ((velocity((i - 1) * dt) + velocity(i * dt)) / 2) * dt
  }
  const total = cumulative[SAMPLES] || 1
  for (let i = 0; i <= SAMPLES; i++) cumulative[i] /= total

  return (t: number) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    const x = t * SAMPLES
    const i = Math.floor(x)
    return cumulative[i] + (cumulative[i + 1] - cumulative[i]) * (x - i)
  }
}

/* ── Team colour contrast ──
   Team primaries span a huge brightness range (Packers #203731 is nearly black,
   Steelers #FFB612 is bright yellow), so the landed row can't just hardcode
   white text. Pick black or white per WCAG relative luminance instead. */
function readableOn(hex: string) {
  const h = hex.replace("#", "")
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const r = toLinear(parseInt(h.slice(0, 2), 16) / 255)
  const g = toLinear(parseInt(h.slice(2, 4), 16) / 255)
  const b = toLinear(parseInt(h.slice(4, 6), 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.42 ? "#101820" : "#ffffff"
}

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

export function SpinRollerSpinner({
  isSpinning,
  onLanded,
  winnerName = "Adam007",
  breakNumber = 15,
  availableSpots = 15,
  totalSpots = 32,
  onViewSpots,
  forceTeamIndex = null,
  /* Defaults below are the values settled on in the Spinner Testing Zone dials,
     so any instance that doesn't drive them explicitly (e.g. the production
     "Spin In Place (Roller)") gets the same tuned feel. */
  spinDuration = 4000,
  startSpeed = 0.09,
  rampUp = 0.35,
  stopEase = 3,
  rowPitch = ITEM_H,
}: SpinRollerSpinnerProps) {
  /* Convert the px pitch into the angular step the rows are laid out on.
     RADIUS is deliberately left fixed so the centre row's distance from the
     camera — and therefore its perspective magnification — never shifts as the
     pitch changes; only its neighbours spread out or close in. */
  const stepDeg = (rowPitch / RADIUS) * (180 / Math.PI)
  /** Fractional drum position, in rows. Integer values sit dead centre. */
  const [pos, setPos] = useState(0)
  const [landedIndex, setLandedIndex] = useState<number | null>(null)
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
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.03)
    } catch { /* ignore */ }
  }, [])

  // Self-contained rAF spin. Everything lives inside the effect so cleanup
  // fully cancels a run and a re-run restarts from scratch — correct under
  // React Strict Mode's mount/unmount/remount cycle.
  useEffect(() => {
    if (!isSpinning) {
      setPos(0)
      setLandedIndex(null)
      setJustLanded(false)
      return
    }

    let cancelled = false
    let raf = 0
    let settleTimer: ReturnType<typeof setTimeout> | null = null

    const n = teams.length
    const target =
      forceTeamIndex !== null && forceTeamIndex >= 0 && forceTeamIndex < n
        ? forceTeamIndex
        : Math.floor(Math.random() * n)
    const start = Math.floor(Math.random() * n)
    // Spin through 3 full drum revolutions, then however many extra rows are
    // needed to come to rest exactly on `target`.
    const distance = n * 3 + (((target - start) % n) + n) % n
    // `spinDuration` is the TOTAL time the spin takes, so the drum motion gets
    // whatever is left after the fixed post-landing settle flash.
    const duration = Math.max(300, spinDuration - SETTLE_MS)
    // Built once per spin, not per frame — the table is 480 samples.
    const ease = buildSpinEase(startSpeed, rampUp, stopEase)

    setLandedIndex(null)
    setJustLanded(false)
    setPos(start)

    let lastTick = start
    const t0 = performance.now()

    const frame = (now: number) => {
      if (cancelled) return
      const t = Math.min(1, (now - t0) / duration)
      const p = start + distance * ease(t)
      setPos(p)

      // Tick once per row that clicks past the centre line.
      const rowsPassed = Math.floor(p)
      if (rowsPassed !== lastTick) {
        lastTick = rowsPassed
        playTick()
      }

      if (t < 1) {
        raf = requestAnimationFrame(frame)
        return
      }

      // Rest exactly on the target row, flash it, then report up.
      setPos(start + distance)
      setJustLanded(true)
      settleTimer = setTimeout(() => {
        if (cancelled) return
        setJustLanded(false)
        setLandedIndex(target)
        onLandedRef.current(teams[target])
      }, SETTLE_MS)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (settleTimer) clearTimeout(settleTimer)
    }
  }, [isSpinning, playTick, forceTeamIndex, spinDuration, startSpeed, rampUp, stopEase])

  const isLanded = landedIndex !== null
  const centre = Math.round(pos)

  // Landed team drives the pill treatment, reusing the same `color` the
  // celebration moments use so the two stay visually consistent.
  const landedTeam = landedIndex !== null ? teams[landedIndex] : null
  const pillColor = landedTeam ? landedTeam.color : "#191919"
  const landedTextColor = landedTeam ? readableOn(landedTeam.color) : "#ffffff"

  /* Build the visible window of rows. Indices wrap with a modulo so the drum
     is endless, while `delta` stays fractional to keep motion perfectly smooth
     between rows. */
  /* How many rows to render either side of centre. Derived from the live pitch
     rather than fixed: at a tight pitch more rows fit before going edge-on, and
     rendering too few would leave visible gaps at the drum's top and bottom.
     Capped at half the team count so rows never repeat within one window. */
  const halfWindow = Math.min(
    Math.floor(teams.length / 2),
    Math.ceil(EDGE_ON_DEG / stepDeg) + 1,
  )
  const rows = []
  for (let k = -halfWindow; k <= halfWindow; k++) {
    const slot = centre + k
    const idx = ((slot % teams.length) + teams.length) % teams.length
    rows.push({ slot, idx, delta: slot - pos, team: teams[idx] })
  }

  return (
    // Outer card — matches the dark rounded bid box card shape exactly.
    // Height hugs the content: there's no footer left to anchor to the bottom,
    // so h-full/justify-between/minHeight would only add dead space.
    <div className="w-full flex flex-col gap-0">

      <div className="flex flex-col gap-4">
        {/* Auction card title row — mirrors the bid box card in the live stream:
            the break + box title truncated to one line, with the chevron at the
            end opening the break spots sheet via onViewSpots. */}
        <div className="flex items-center justify-between gap-3">
          {/* Title + winner stack — 8px gap */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 text-white">
            <p className="truncate text-sm leading-tight">
              <span className="font-normal">
                {`Random Break #${breakNumber}`}
                {" — 2025 Panini Luminance Football Hobby PYT Box Break #903"}
              </span>
            </p>
            <p className="truncate text-sm leading-tight font-bold">
              <span aria-hidden="true">{"🏆"}</span> {winnerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onViewSpots}
            aria-label="View break spots"
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-white/40" />
          </button>
        </div>

        {/* ── Roller drum ── */}
        <div
          className="relative w-full overflow-hidden rounded-md"
          style={{
            height: ITEM_H * 3,
            backgroundColor: "rgba(255,255,255,0.05)",
            perspective: 420,
          }}
        >
          {/* Centre selection pill, sitting behind the rows */}
          <motion.div
            className="absolute rounded-[4px]"
            style={{
              height: ITEM_H - 4,
              top: "50%",
              marginTop: -(ITEM_H - 4) / 2,
              // Fixed width, horizontally centred to match the centred rows.
              width: PILL_W,
              left: "50%",
              marginLeft: -PILL_W / 2,
              backgroundColor: "#191919",
            }}
            animate={{
              scale: justLanded ? [1, 1.04, 1] : 1,
              backgroundColor: pillColor,
              // Same glow signature as the celebration moments.
              boxShadow: landedTeam
                ? `0 0 20px ${landedTeam.color}40, 0 0 40px ${landedTeam.color}20`
                : "0 0 0 rgba(0,0,0,0)",
            }}
            transition={{
              scale: { duration: 0.3 },
              backgroundColor: { duration: 0.25 },
              boxShadow: { duration: 0.25 },
            }}
          />

          {/* Rows, positioned on the surface of the drum */}
          <div
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            {rows.map(({ slot, idx, delta, team }) => {
              const angle = delta * stepDeg
              // Past ~72° the row is nearly edge-on; drop it entirely.
              if (Math.abs(angle) > EDGE_ON_DEG) return null
              /* Fade tracks the row's *angle*, not its row-index distance, so
                 the dimming profile looks the same at any pitch. The 2.1
                 preserves the original falloff at the default pitch. */
              const fade = Math.min(1, Math.abs(angle) / (2.1 * DEFAULT_STEP_DEG))
              const isCentre = Math.abs(delta) < 0.5
              return (
                <div
                  key={`${slot}-${idx}`}
                  className="absolute left-0 right-0 flex items-center justify-center px-3"
                  style={{
                    height: ITEM_H,
                    top: "50%",
                    marginTop: -ITEM_H / 2,
                    transform: `rotateX(${-angle}deg) translateZ(${RADIUS}px)`,
                    // Rows tip away from the viewer, so they dim and lose
                    // contrast the further they are from centre.
                    opacity: 1 - fade * 0.82,
                    backfaceVisibility: "hidden",
                  }}
                >
                  <span
                    className="truncate font-semibold leading-none"
                    style={{
                      fontSize: 14,
                      color: isCentre
                        ? isLanded
                          ? landedTextColor
                          : "#ffffff"
                        : "#8f8f8f",
                    }}
                  >
                    {team.city} {team.name}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Soft top/bottom scrims so rows fade out at the drum edges instead
              of being hard-clipped by the container. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0"
            style={{ height: ITEM_H, background: "linear-gradient(to bottom, rgba(25,25,25,0.85), transparent)" }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{ height: ITEM_H, background: "linear-gradient(to top, rgba(25,25,25,0.85), transparent)" }}
          />
        </div>


      </div>


    </div>
  )
}
