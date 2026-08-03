"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { teams, type Team } from "@/components/team-spinner"

interface SpinRollerSpinnerProps {
  /** True while spinning, false to reset. */
  isSpinning: boolean
  /** Fired once the roller lands — pass the winning team up. */
  onLanded: (team: Team) => void
  /** Winner name shown in the subtitle. */
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
}

/* ── Cylinder geometry ──
   The roller is a real 3D cylinder, not a flat list: each row sits on the
   surface of a drum rotating around the X axis. That's what gives the rows
   above and below centre their curve/foreshortening.

   Placing a row at `rotateX(-angle) translateZ(R)` puts it at screen
   y = R * sin(angle). To make one step of the drum travel exactly ITEM_H at
   centre, R must satisfy R * STEP_RAD = ITEM_H, hence R = ITEM_H / STEP_RAD. */
const ITEM_H = 34
const STEP_DEG = 20
const RADIUS = ITEM_H / (STEP_DEG * (Math.PI / 180))
/** Rows rendered either side of centre — beyond this they're edge-on/hidden. */
const HALF_WINDOW = 3

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

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
}: SpinRollerSpinnerProps) {
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
    const duration = 4200

    setLandedIndex(null)
    setJustLanded(false)
    setPos(start)

    let lastTick = start
    const t0 = performance.now()

    const frame = (now: number) => {
      if (cancelled) return
      const t = Math.min(1, (now - t0) / duration)
      const p = start + distance * easeOutQuart(t)
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
      }, 800)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (settleTimer) clearTimeout(settleTimer)
    }
  }, [isSpinning, playTick, forceTeamIndex])

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
  const rows = []
  for (let k = -HALF_WINDOW; k <= HALF_WINDOW; k++) {
    const slot = centre + k
    const idx = ((slot % teams.length) + teams.length) % teams.length
    rows.push({ slot, idx, delta: slot - pos, team: teams[idx] })
  }

  return (
    // Outer card — matches the dark rounded bid box card shape exactly.
    // h-full + justify-between so it fills the measured bid box height and the
    // footer row anchors to the bottom.
    <div className="w-full h-full flex flex-col justify-between gap-0" style={{ minHeight: 120 }}>

      <div className="flex flex-col gap-2">
        {/* "Random Break #15 · Adam007" subtitle */}
        <p className="text-sm leading-tight" style={{ color: "#8f8f8f" }}>
          Random Break #{breakNumber} &middot;{" "}
          <span className="font-semibold text-white">{winnerName}</span>
        </p>

        {/* ── Roller drum ── */}
        <div
          className="relative w-full overflow-hidden rounded-xl"
          style={{
            height: ITEM_H * 3,
            backgroundColor: "rgba(255,255,255,0.05)",
            perspective: 420,
          }}
        >
          {/* Centre selection pill, sitting behind the rows */}
          <motion.div
            className="absolute left-2 right-2 rounded-lg"
            style={{
              height: ITEM_H - 4,
              top: "50%",
              marginTop: -(ITEM_H - 4) / 2,
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
              const angle = delta * STEP_DEG
              // Past ~72° the row is nearly edge-on; drop it entirely.
              if (Math.abs(angle) > 72) return null
              const fade = Math.min(1, Math.abs(delta) / 2.1)
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
                    className="truncate font-bold leading-none"
                    style={{
                      fontSize: isCentre ? 17 : 16,
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

        {/* Spots available row — tapping it opens the break spots sheet */}
        <button
          type="button"
          onClick={onViewSpots}
          aria-label="View break spots"
          className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-1.5">
            <CircularProgress available={availableSpots} total={totalSpots} size={14} />
            <span className="text-sm" style={{ color: "#f7f7f7" }}>
              {availableSpots}/{totalSpots} spots available
            </span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8f8f8f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* ── Bottom block: divider + footer, anchored to the card bottom ── */}
      <div>
        <div className="mb-3" style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
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
