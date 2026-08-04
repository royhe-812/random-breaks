"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { teams, type Team } from "@/components/team-spinner"

/* ── Roller, multi ──
   Same 3D drum as SpinRollerSpinner, but it runs one spin per spot instead of
   one and only. Each landing is held so it reads, then the drum re-spins for the
   next spot; every landed team is kept as a chip below the drum so the full set
   stays visible — the same chip treatment the other multi variants use.

   This file is deliberately self-contained (its own drum geometry, easing and
   tick sound) rather than importing internals from the single-spin roller. That
   matches how the existing variants are written — spin-in-place, roller and
   multi-spin-6 each carry their own copies — and means tuning this variant can
   never regress the single roller that ships today. */

type Spot = 1 | 2 | 3
const SPOTS: Spot[] = [1, 2, 3]

interface SpinRollerMultiSpinnerProps {
  /** True while spinning, false to reset. */
  isSpinning: boolean
  /** Fired as each spot lands, so the host can show the running result. */
  onLanded?: (team: Team) => void
  /** Fired once every spot has landed, with the full set. */
  onAllLanded?: (landed: { spot: Spot; team: Team }[]) => void
  /**
   * Winning bidder per spot, shown on the trophy line as that spot is drawn.
   * One name per spot, in spot order.
   */
  winnerNames?: string[]
  /** Break number shown in the title row, kept in sync with the bid box card. */
  breakNumber?: number
  /**
   * Forces the FINAL spin to land on a specific team index. Earlier spins stay
   * random (and avoid this index), so the forced outcome is always reachable —
   * the same convention the mini multi variants use in the testing zone.
   */
  forceTeamIndex?: number | null
  /** Time each individual spin takes, in ms. */
  spinDuration?: number
  /** Speed each spin begins at, as a fraction of peak speed. */
  startSpeed?: number
  /** Fraction of each spin spent accelerating up to peak speed. */
  rampUp?: number
  /** Shape of each spin's deceleration. */
  stopEase?: number
  /** Centre-to-centre spacing between adjacent team names, in px. */
  rowPitch?: number
}

/* ── Cylinder geometry ──
   The roller is a real 3D cylinder: each row sits on the surface of a drum
   rotating around the X axis, which is what curves the rows above and below
   centre. Placing a row at `rotateX(-angle) translateZ(R)` puts it at screen
   y = R * sin(angle), so for one step to travel exactly ITEM_H at centre,
   R must satisfy R * STEP_RAD = ITEM_H. */
const ITEM_H = 34
/** Widest NFL team name across all 32 teams — "Washington Commanders" — as
 *  measured at the row type (600 14px Geist). */
const WIDEST_NAME_W = 172
/** Horizontal padding either side of the name inside the centre pill. */
const PILL_PAD_X = 16
/** Fixed width of the centre selection pill: widest name + padding both sides. */
const PILL_W = WIDEST_NAME_W + PILL_PAD_X * 2
/** Angular separation between rows at the default pitch; only derives RADIUS. */
const DEFAULT_STEP_DEG = 20
const RADIUS = ITEM_H / (DEFAULT_STEP_DEG * (Math.PI / 180))
/** Past this angle a row is so close to edge-on it isn't worth drawing. */
const EDGE_ON_DEG = 72

/** Hold time on the winning row after the drum stops, before recording it. */
const SETTLE_MS = 800
/** Pause between one spot landing and the drum re-spinning for the next. */
const INTER_SPIN_MS = 1200

/**
 * Builds the drum's position curve from a *velocity* profile rather than a
 * position ease. `easeOutQuart` alone starts at peak speed, which snaps the drum
 * straight into full motion; here it accelerates from `startSpeed` across the
 * first `rampFraction` of the run, then decays to rest.
 *
 * The profile is integrated into a normalised lookup table so the curve travels
 * exactly 0 -> 1 — the drum must come to rest precisely on the winning row no
 * matter how the dials are set.
 */
function buildSpinEase(startSpeed: number, rampFraction: number, stopEase: number) {
  const SAMPLES = 480
  const r = Math.min(0.95, Math.max(0, rampFraction))
  const v0 = Math.min(1, Math.max(0.02, startSpeed))
  const k = Math.min(8, Math.max(0.3, stopEase))
  // Floor on the decaying velocity, so a high `stopEase` creeps to the end
  // instead of visibly freezing for the last stretch.
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

/* Team primaries span a huge brightness range (Packers #203731 is nearly black,
   Steelers #FFB612 bright yellow), so the landed row picks black or white text
   per WCAG relative luminance rather than hardcoding one. */
function readableOn(hex: string) {
  const h = hex.replace("#", "")
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const r = toLinear(parseInt(h.slice(0, 2), 16) / 255)
  const g = toLinear(parseInt(h.slice(2, 4), 16) / 255)
  const b = toLinear(parseInt(h.slice(4, 6), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42 ? "#101820" : "#ffffff"
}

/**
 * Marquee that only scrolls when its content overflows, easing right-to-left,
 * pausing, then back — matching the chips row in the other multi variants.
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

export function SpinRollerMultiSpinner({
  isSpinning,
  onLanded,
  onAllLanded,
  winnerNames = ["Adam007", "boxbreaker", "Chloepulls11"],
  breakNumber = 15,
  forceTeamIndex = null,
  spinDuration = 4000,
  startSpeed = 0.09,
  rampUp = 0.35,
  stopEase = 3,
  rowPitch = ITEM_H,
}: SpinRollerMultiSpinnerProps) {
  /* Convert the px pitch into the angular step the rows sit on. RADIUS stays
     fixed so the centre row's perspective magnification never shifts as the
     pitch changes; only its neighbours spread out or close in. */
  const stepDeg = (rowPitch / RADIUS) * (180 / Math.PI)

  /** Fractional drum position, in rows. Integer values sit dead centre. */
  const [pos, setPos] = useState(0)
  /** Index of the team the drum is currently resting on, or null mid-spin. */
  const [landedIndex, setLandedIndex] = useState<number | null>(null)
  const [justLanded, setJustLanded] = useState(false)
  /** Which spin is running, 0-based. Bumping this starts the next spin. */
  const [spinNo, setSpinNo] = useState(0)
  /** Spots landed so far, oldest first, so chips populate left → right. */
  const [results, setResults] = useState<{ spot: Spot; team: Team }[]>([])
  const [allDone, setAllDone] = useState(false)

  const audioRef = useRef<AudioContext | null>(null)
  /** Drum position the previous spin came to rest on, so the next spin
   *  continues from there rather than jumping. */
  const restPosRef = useRef(0)
  /** Team indices already taken, so no two spots land on the same team. */
  const takenRef = useRef<number[]>([])

  // Keep the latest callbacks without making them effect dependencies, so a new
  // callback identity from the parent can never restart a spin mid-flight.
  const onLandedRef = useRef(onLanded)
  const onAllLandedRef = useRef(onAllLanded)
  useEffect(() => {
    onLandedRef.current = onLanded
    onAllLandedRef.current = onAllLanded
  }, [onLanded, onAllLanded])

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

  // Full reset whenever the engine is switched off.
  useEffect(() => {
    if (isSpinning) return
    setPos(0)
    setLandedIndex(null)
    setJustLanded(false)
    setSpinNo(0)
    setResults([])
    setAllDone(false)
    restPosRef.current = 0
    takenRef.current = []
  }, [isSpinning])

  /* One spin per effect run, keyed on `spinNo`. Everything lives inside so
     cleanup fully cancels a run — correct under Strict Mode's mount/unmount/
     remount cycle — and landing simply bumps `spinNo` to chain the next spot. */
  useEffect(() => {
    if (!isSpinning || spinNo >= SPOTS.length) return

    let cancelled = false
    let raf = 0
    let settleTimer: ReturnType<typeof setTimeout> | null = null
    let nextTimer: ReturnType<typeof setTimeout> | null = null

    const n = teams.length
    const isFinalSpin = spinNo === SPOTS.length - 1
    const forced =
      forceTeamIndex !== null && forceTeamIndex >= 0 && forceTeamIndex < n ? forceTeamIndex : null

    /* Pick this spin's target. Spots can't share a team, so anything already
       landed is off the table — and while earlier spins are random they also
       avoid the forced index, guaranteeing the final spin can still reach it. */
    let target: number
    if (isFinalSpin && forced !== null) {
      target = forced
    } else {
      const excluded = new Set(takenRef.current)
      if (forced !== null) excluded.add(forced)
      const pool = Array.from({ length: n }, (_, i) => i).filter((i) => !excluded.has(i))
      target = pool.length
        ? pool[Math.floor(Math.random() * pool.length)]
        : Math.floor(Math.random() * n)
    }

    // Continue from where the last spin stopped so the drum never jumps.
    const start = restPosRef.current
    const startIdx = ((Math.round(start) % n) + n) % n
    // Three full revolutions, then however many extra rows land on `target`.
    const distance = n * 3 + ((((target - startIdx) % n) + n) % n)
    // `spinDuration` is the total per spin, so drum motion gets what's left
    // after the fixed post-landing settle flash.
    const duration = Math.max(300, spinDuration - SETTLE_MS)
    const ease = buildSpinEase(startSpeed, rampUp, stopEase)

    setLandedIndex(null)
    setJustLanded(false)
    setPos(start)

    let lastTick = Math.floor(start)
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

      // Rest exactly on the target row, flash it, then record and chain.
      const restPos = start + distance
      setPos(restPos)
      restPosRef.current = restPos
      setJustLanded(true)

      settleTimer = setTimeout(() => {
        if (cancelled) return
        setJustLanded(false)
        setLandedIndex(target)
        takenRef.current = [...takenRef.current, target]

        const spot = SPOTS[spinNo]
        const landedTeam = teams[target]
        setResults((prev) => [...prev, { spot, team: landedTeam }])
        onLandedRef.current?.(landedTeam)

        if (spinNo + 1 >= SPOTS.length) {
          setAllDone(true)
          return
        }
        // Hold the landed team so it reads, then re-spin for the next spot.
        nextTimer = setTimeout(() => {
          if (cancelled) return
          setSpinNo((s) => s + 1)
        }, INTER_SPIN_MS)
      }, SETTLE_MS)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (settleTimer) clearTimeout(settleTimer)
      if (nextTimer) clearTimeout(nextTimer)
    }
  }, [isSpinning, spinNo, playTick, forceTeamIndex, spinDuration, startSpeed, rampUp, stopEase])

  // Report the full set once, after the last spot has been recorded.
  useEffect(() => {
    if (allDone && results.length === SPOTS.length) onAllLandedRef.current?.(results)
  }, [allDone, results])

  const isLanded = landedIndex !== null
  const centre = Math.round(pos)

  // Landed team drives the pill treatment, reusing the same `color` the
  // celebration moments use so the two stay visually consistent.
  const landedTeam = landedIndex !== null ? teams[landedIndex] : null
  const pillColor = landedTeam ? landedTeam.color : "#191919"
  const landedTextColor = landedTeam ? readableOn(landedTeam.color) : "#ffffff"

  /* The winner being drawn right now: the spot mid-spin, or — once everything
     has landed — the last spot drawn, so the line never goes blank. */
  const activeWinnerIdx = Math.min(spinNo, winnerNames.length - 1)
  const activeWinner = winnerNames[activeWinnerIdx] ?? winnerNames[0]

  /* Build the visible window of rows. Indices wrap with a modulo so the drum is
     endless, while `delta` stays fractional to keep motion smooth between rows.
     The window size is derived from the live pitch: at a tight pitch more rows
     fit before going edge-on, and too few would leave gaps at the drum edges. */
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

  const chipClass =
    "inline-flex h-4 shrink-0 whitespace-nowrap items-center rounded-full px-3 text-[10px] leading-none font-bold uppercase tracking-wide"
  const chipStyle = {
    backgroundColor: "transparent",
    color: "#ffffff",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)",
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Title row — mirrors the bid box card: break + box title truncated to
          one line, with the winner currently being drawn beneath it. `min-w-0`
          is what lets the title actually truncate inside the flex column. */}
      <div className="min-w-0 flex flex-col gap-2 text-white">
        <p className="truncate text-sm leading-tight">
          <span className="font-normal">
            {`Random Break #${breakNumber}`}
            {" — 2025 Panini Luminance Football Hobby PYT Box Break #903"}
          </span>
        </p>
        {/* Whose spot is being drawn. Chips below hold the full history. */}
        <AnimatePresence mode="wait">
          <motion.p
            key={activeWinner}
            className="truncate text-sm leading-tight font-bold"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <span aria-hidden="true">{"🏆"}</span> {activeWinner}
          </motion.p>
        </AnimatePresence>
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
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {rows.map(({ slot, idx, delta, team }) => {
            const angle = delta * stepDeg
            // Past ~72° the row is nearly edge-on; drop it entirely.
            if (Math.abs(angle) > EDGE_ON_DEG) return null
            /* Fade tracks the row's *angle*, not its row-index distance, so the
               dimming profile looks the same at any pitch. */
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
                  // Rows tip away from the viewer, so they dim with distance.
                  opacity: 1 - fade * 0.82,
                  backfaceVisibility: "hidden",
                }}
              >
                <span
                  className="truncate font-semibold leading-none"
                  style={{
                    fontSize: 14,
                    color: isCentre ? (isLanded ? landedTextColor : "#ffffff") : "#8f8f8f",
                  }}
                >
                  {team.city} {team.name}
                </span>
              </div>
            )
          })}
        </div>

        {/* Soft top/bottom scrims so rows fade at the drum edges instead of
            being hard-clipped by the container. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{ height: ITEM_H, background: "linear-gradient(to bottom, rgba(25,25,25,0.85), transparent)" }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{ height: ITEM_H, background: "linear-gradient(to top, rgba(25,25,25,0.85), transparent)" }}
        />
      </div>

      {/* Landed spots, as chips. Populates one per spin and stays until reset;
          once every spot is in, the row becomes a back-and-forth marquee so
          longer team names stay readable in the narrow card. */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            key="chips"
            layout
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Divider separating the drum from the chips row */}
            <div className="border-t border-white/10" />

            {allDone ? (
              <BackAndForthMarquee trackClassName="flex gap-2">
                {results.map(({ spot, team }) => (
                  <span key={spot} className={chipClass} style={chipStyle}>
                    {team.city} {team.name}
                  </span>
                ))}
              </BackAndForthMarquee>
            ) : (
              <div
                className="flex gap-2 overflow-x-auto flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <AnimatePresence initial={false}>
                  {results.map(({ spot, team }) => (
                    <motion.span
                      key={spot}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={chipClass}
                      style={chipStyle}
                    >
                      {team.city} {team.name}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
