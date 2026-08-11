"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { teams, type Team } from "@/components/team-spinner"
import { type RevealTuning } from "@/components/pill-reveal"

type Spot = 1 | 2 | 3
const MULTI_SPOTS: Spot[] = [1, 2, 3]
const SINGLE_SPOTS: Spot[] = [1]

interface SpinTickerSpinnerProps {
  /** True while spinning, false to reset. */
  isSpinning: boolean
  /** One spot, or three chained like the multi roller. */
  mode?: "single" | "multi"
  /** Fired as each spot lands. In single mode this is the only callback. */
  onLanded?: (team: Team) => void
  /** Multi only: fired once every spot has landed, with the full set. */
  onAllLanded?: (landed: { spot: Spot; team: Team }[]) => void
  /** Winning bidder's username, shown in the randomizing label. */
  winnerName?: string
  /** Break number shown in the subtitle, kept in sync with the bid box card. */
  breakNumber?: number
  /** Forces the landing for reproducible testing; null/undefined = random. */
  forceTeamIndex?: number | null
  /**
   * Total time one spot takes, in ms, from first tick to resting on the winner.
   * Shared with the rollers so all three concepts pace identically.
   */
  spinDuration?: number
  /** Speed the ticker begins at, as a fraction of its peak rate. */
  startSpeed?: number
  /** Fraction of the run spent accelerating up to peak rate. */
  rampUp?: number
  /**
   * Shape of the deceleration. Low values hold the rate then cut off abruptly;
   * high values shed rate early and creep to a halt like a game-show wheel.
   */
  stopEase?: number
  /**
   * How many times the ticker cycles the full 32-team list before landing. This
   * is the ticker's single most important legibility control — see TICKER_LAPS.
   */
  laps?: number
  /** Staged pill reveal tuning, forwarded from the dial panel. */
  reveal?: RevealTuning
  /** Skip the reveal entirely (used by the shared-transition host). */
  disableReveal?: boolean
}

/* ── Layout ──
   Per frame 817:27591 the ticker is NOT the roller's drum minus the outer rows:
   it is its own inset panel with a smaller, lighter, more rounded pill and a
   label above it. So the geometry here is deliberately independent of the
   rollers' — only the card chrome around it (title, divider, chips) is shared. */
/** "Randomizing spot for …" label above the wordmark. Kept at the 1.5× the rest
 *  of the card was tuned to (frame's 12px → 18). */
const LABEL_SIZE = 18
const LABEL_LINE = 24
/** The wordmark lockup that replaced the pill. The team NAME is the hero, so it
 *  is far larger than the old 21px pill text — this is what gives the region its
 *  mass. Both lines are single-line: the longest of the 17 team names ("Patriots"
 *  / "Steelers", 8ch) clears ~185px at 40/800, and the longest city ("San
 *  Francisco", 13ch) clears ~120px at 18/500 — both well inside the 326px card. */
const CITY_SIZE = 18
const NAME_SIZE = 40

/* ── Randomizer region (frame 817:27737) ──
   A bare region of the card holding the "Randomizing spot for …" label and the
   hero wordmark, centred as a group. The frame gives it no fill — a divider above
   is what separates it from the title instead of an inset surface. */
/** Hairline rule colour. Matches both rollers' DIVIDER so the three cards agree. */
const DIVIDER = "#363636"
/** Region height. Fixed so the card never resizes mid-spin. Sized to hold the
 *  three stacked lines (label 24 + city 18 + name 40 + gaps ≈ 102 with padding)
 *  with slack above and below for the glow to bloom without clipping. */
const PANEL_H = 144
  /** Gap between the label and the wordmark. A small gap lets the big name read
   *  as its own block rather than crowding the "Randomizing spot for …" line. */
  const PANEL_GAP = 6
  /** Vertical breathing room inside the region. Held separately from PANEL_GAP so
   *  the label/name gap and the region's padding stay independent. */
  const PANEL_PAD_Y = 8
/** Height reserved for the picked-team chip row (chips are h-4), held from the
 *  first render so the panel never changes height as picks land. */
const CHIP_ROW_H = 16

/** Hold on the winning name after the ticking stops, before reporting up. */
const SETTLE_MS = 800
/** Pause between one spot landing and the ticker restarting for the next. */
const INTER_SPIN_MS = 1200

/**
 * How many full passes through the 32 teams a spin makes by default.
 *
 * This is the one number that separates a ticker from a strobe, and it is why
 * Ticker cannot simply inherit the rollers' 3 laps. The roller moves
 * *continuously*, so 3 laps (~96 rows in ~3.2s, peaking around 30 rows/sec) is
 * smooth travel that motion blur then smears into a believable drum. Swapping
 * text instantly at that same rate is not motion at all — it is 30 hard cuts a
 * second, which reads as flicker, sits in the range most likely to bother
 * photosensitive viewers, and shows nothing the eye can actually resolve.
 *
 * One lap puts the peak around 15 names/sec: fast enough to feel genuinely
 * random and out of control, slow enough that each name registers as a name.
 */
const TICKER_LAPS = 1

/**
 * Builds the position curve from a *velocity* profile rather than a position
 * ease — identical to the rollers, so the accelerate → decay → creep feel is
 * shared and the dials mean the same thing in every concept.
 *
 * The ticker consumes it differently: the rollers render the fractional position
 * directly, while the ticker floors it into a name index. That quantisation is
 * the whole effect — as velocity decays the same curve naturally stretches the
 * gap between swaps, so the names visibly slow to a crawl before locking without
 * any separate "slow down at the end" logic.
 *
 * The profile is integrated into a normalised lookup table so the curve travels
 * exactly 0 -> 1, which is what guarantees the last index is precisely the
 * winner no matter how the dials are set.
 */
function buildSpinEase(startSpeed: number, rampFraction: number, stopEase: number) {
  const SAMPLES = 480
  const r = Math.min(0.95, Math.max(0, rampFraction))
  const v0 = Math.min(1, Math.max(0.02, startSpeed))
  const k = Math.min(8, Math.max(0.3, stopEase))
  // Floor on the decaying velocity, so a high `stopEase` keeps inching to the
  // end instead of visibly freezing on one name for the last stretch.
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

export function SpinTickerSpinner({
  isSpinning,
  mode = "single",
  onLanded,
  onAllLanded,
  winnerName = "Adam007",
  breakNumber = 15,
  forceTeamIndex = null,
  /* Defaults match the rollers' tuned dial values, so an instance that doesn't
     drive them explicitly gets the same feel. */
  spinDuration = 4000,
  startSpeed = 0.09,
  rampUp = 0.35,
  stopEase = 3,
  laps = TICKER_LAPS,
  reveal,
  disableReveal = false,
}: SpinTickerSpinnerProps) {
  const spots = mode === "multi" ? MULTI_SPOTS : SINGLE_SPOTS

  /** Absolute tick counter, in names. Floored from the eased position, so it is
   *  already an integer — the name changes the instant this changes. */
  const [step, setStep] = useState(0)
  /** Which spin is running, 0-based. Bumping this starts the next spot. */
  const [spinNo, setSpinNo] = useState(0)
  /** Spots landed so far, oldest first, so chips populate left → right. */
  const [results, setResults] = useState<{ spot: Spot; team: Team }[]>([])
  const [allDone, setAllDone] = useState(false)
  /** Team index the ticker has stopped on, or null while it is running. Cleared
   *  before each spin, which is what re-arms the reveal — otherwise the same
   *  team landing twice in a row would not re-trigger it. */
  const [landedIndex, setLandedIndex] = useState<number | null>(null)

  const audioRef = useRef<AudioContext | null>(null)
  /** Tick index the previous spot ended on, so the next spin continues counting
   *  from there rather than restarting the sequence. */
  const restStepRef = useRef(0)
  /** Team indices already taken, so no two spots land on the same team. */
  const takenRef = useRef<number[]>([])

  const reduceMotion = useReducedMotion()

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
    setStep(0)
    setSpinNo(0)
    setResults([])
    setAllDone(false)
    setLandedIndex(null)
    restStepRef.current = 0
    takenRef.current = []
  }, [isSpinning])

  /* One spin per effect run, keyed on `spinNo`. Everything lives inside so
     cleanup fully cancels a run — correct under Strict Mode's mount/unmount/
     remount cycle — and landing simply bumps `spinNo` to chain the next spot. */
  useEffect(() => {
    if (!isSpinning || spinNo >= spots.length) return

    let cancelled = false
    let raf = 0
    let settleTimer: ReturnType<typeof setTimeout> | null = null
    let nextTimer: ReturnType<typeof setTimeout> | null = null

    const n = teams.length
    const isFinalSpin = spinNo === spots.length - 1
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

    /* Records the pick, then either chains the next spot or reports the set.
       Shared by the animated path and the reduced-motion path below so both
       settle identically. */
    const land = () => {
      setLandedIndex(target)
      settleTimer = setTimeout(() => {
        if (cancelled) return
        takenRef.current = [...takenRef.current, target]

        const spot = spots[spinNo]
        const landedTeam = teams[target]
        setResults((prev) => [...prev, { spot, team: landedTeam }])
        onLandedRef.current?.(landedTeam)

        if (spinNo + 1 >= spots.length) {
          setAllDone(true)
          return
        }
        nextTimer = setTimeout(() => {
          if (cancelled) return
          setSpinNo((s) => s + 1)
        }, INTER_SPIN_MS)
      }, SETTLE_MS)
    }

    /* Reduced motion: a rapid sequence of hard cuts is exactly the pattern this
       setting exists to suppress, so skip the ticking entirely and present the
       winner. The staged reveal still plays — it is a colour wash, not flicker,
       and RevealPill shortens it under the same setting. */
    if (reduceMotion) {
      setStep(target)
      restStepRef.current = target
      land()
      return () => {
        cancelled = true
        if (settleTimer) clearTimeout(settleTimer)
        if (nextTimer) clearTimeout(nextTimer)
      }
    }

    // Continue the count from where the last spot stopped so the first swap of
    // this spin is a real change rather than a repeat of the resting name.
    const start = restStepRef.current
    const startIdx = ((start % n) + n) % n
    /* Whole laps of the list, then however many extra names land on `target`.
       `laps` is rounded into a whole number of names so the arithmetic below
       stays exact and the final floored index is guaranteed to be the winner. */
    const lapNames = Math.max(1, Math.round(Math.max(0.25, laps) * n))
    const distance = lapNames + ((((target - startIdx) % n) + n) % n)
    // `spinDuration` is the total per spot, so the ticking gets what's left
    // after the fixed post-landing settle.
    const duration = Math.max(300, spinDuration - SETTLE_MS)
    const ease = buildSpinEase(startSpeed, rampUp, stopEase)

    setStep(start)
    /* Drop the previous spot's pill back to idle before this spin starts, so
       every pick gets the full stroke-then-fill reveal from a clean slate. The
       finished pick is already recorded as a chip, so nothing is lost. */
    setLandedIndex(null)

    /* Last committed tick, tracked in a ref-like local rather than read back
       from state: `step` in this closure is the value from the render that
       started the spin and never updates, so comparing against it would fire a
       setState on every single frame. */
    let lastStep = start
    const t0 = performance.now()

    const frame = (now: number) => {
      if (cancelled) return
      const t = Math.min(1, (now - t0) / duration)
      const next = Math.floor(start + distance * ease(t))

      /* The quantisation gate, and the reason this is cheap: the rAF loop runs
         at 60fps but only commits when the floored index actually changes, so
         the component re-renders about as often as the name visibly swaps
         (~15 times a second at peak, far fewer as it slows) rather than 60. */
      if (next !== lastStep) {
        lastStep = next
        setStep(next)
        playTick()
      }

      if (t < 1) {
        raf = requestAnimationFrame(frame)
        return
      }

      // Rest exactly on the target, then hold it before reporting up.
      const restStep = start + distance
      setStep(restStep)
      restStepRef.current = restStep
      land()
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (settleTimer) clearTimeout(settleTimer)
      if (nextTimer) clearTimeout(nextTimer)
    }
    // `spots` is derived from `mode`, so depending on `mode` keeps this stable
    // across renders while still restarting if the concept is switched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning, spinNo, mode, playTick, forceTeamIndex, spinDuration, startSpeed, rampUp, stopEase, laps, reduceMotion])

  const n = teams.length
  /** The single visible name. Wraps with a modulo so the list is endless. */
  const shownIdx = ((step % n) + n) % n
  const shownTeam = teams[shownIdx]

  // Landed team drives the wordmark's settled treatment (colour wash + pop).
  const landedTeam = landedIndex !== null ? teams[landedIndex] : null
  /* True once the spin has settled on a team — flips the glow to full bloom and
     washes the name to its team tint. Gated on !disableReveal so the shared-
     transition host, which owns its own landing, gets a plain settle. */
  const landed = !disableReveal && landedTeam !== null

  /* One buyer wins all spots, so the label always shows the same name. */
  const activeWinner = winnerName

  const chipClass =
    "inline-flex h-4 shrink-0 whitespace-nowrap items-center rounded-full px-3 text-[10px] leading-none font-bold uppercase tracking-wide"
  const chipStyle = useMemo(
    () => ({
      backgroundColor: "transparent",
      color: "#ffffff",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)",
    }),
    [],
  )

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Title row — mirrors the bid box card and both rollers: break + box
          title truncated to one line. `min-w-0` is what lets it actually
          truncate inside the flex column. */}
      <div className="min-w-0 flex flex-col gap-2 text-white">
        <p className="truncate text-sm leading-tight">
          <span className="font-normal">
            {`Random Break #${breakNumber}`}
            {" — 2025 Panini Luminance Football Hobby PYT Box Break #903"}
          </span>
        </p>
      </div>

      {/* Hairline between the title and the randomizer (frame 817:27762, a 0-height
          LINE). Figma exports it as divider.svg, but a 1px rule is not artwork —
          rendering it as the same bordered `hr` both rollers use keeps the three
          cards identical instead of introducing an <img> for one hairline.
          Measured at 320px in the frame, which is just the card's inner width, so
          it stays w-full here rather than being pinned and mismatching the card. */}
      <hr className="w-full m-0 border-0" style={{ height: 0, borderTop: `1px solid ${DIVIDER}` }} />

      {/* ── Randomizer region (frame 817:27737) ──
          Holds the label and the pill centred as a group. The frame gives this
          node a radius but no fill: it is a bare region of the card, not an inset
          surface, so the pill reads as the only object on the card. The divider
          above is what separates it from the title now.

          Height is fixed rather than derived from the contents so the card is
          its final size before the first tick and never resizes mid-spin. */}
      <div
        className="w-full flex flex-col items-center justify-center"
        style={{
          height: PANEL_H,
          gap: PANEL_GAP,
          paddingTop: PANEL_PAD_Y,
          paddingBottom: PANEL_PAD_Y,
        }}
      >
        {/* Whose spot is being drawn (frame 817:27750). */}
        <p
          className="truncate text-center"
          style={{ fontSize: LABEL_SIZE, lineHeight: `${LABEL_LINE}px`, color: "#f7f7f7" }}
        >
          {`Randomizing spot for ${activeWinner}:`}
        </p>

        {/* ── Ticker, as a hero wordmark ──
            The roller's 3-row drum reduced to a single name, but presented as a
            two-line lockup (city over team) that fills the region rather than a
            small pill floating in it. Nothing travels, so there is no motion
            blur; each name cuts in place at the tick rate.

            The name stays white while spinning — calm and readable across all 17
            teams — and washes to a team tint on landing. Identity during the spin
            comes from the glow behind it, which recolours on every cut.
            `color-mix(… white)` lifts near-black brands (Texans, Jets) to a
            visible hue so the flash never disappears, and keeps the landed name
            readable on the dark card without a per-team luma test. */}
        <div className="relative flex flex-col items-center justify-center" aria-hidden="true">
          {/* Colour glow behind the name. Colour is set inline so it cuts
              instantly with each tick; only opacity/scale animate, so the hue
              snaps while the bloom eases. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{
              width: 260,
              height: 120,
              x: "-50%",
              y: "-50%",
              borderRadius: "9999px",
              filter: "blur(28px)",
              background: `radial-gradient(closest-side, color-mix(in oklch, ${shownTeam.color} 82%, white) 0%, transparent 72%)`,
            }}
            initial={false}
            animate={{
              opacity: landed ? 0.55 : 0.22,
              scale: landed && !reduceMotion ? 1.08 : 0.92,
            }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* City — the smaller line of the lockup. */}
          <span
            className="relative z-10 max-w-[300px] truncate text-center font-medium leading-none transition-colors duration-500"
            style={{ fontSize: CITY_SIZE, color: landed ? "#d4d4d4" : "#8f8f8f" }}
          >
            {shownTeam.city}
          </span>

          {/* Team name — the hero. Pops on landing (skipped under reduced motion)
              and washes from white to a readable team tint. */}
          <motion.span
            className="relative z-10 mt-1 block max-w-[320px] truncate text-center font-extrabold leading-none tracking-tight transition-colors duration-500"
            style={{
              fontSize: NAME_SIZE,
              color: landed ? `color-mix(in oklch, ${shownTeam.color} 62%, white)` : "#ffffff",
            }}
            initial={false}
            animate={{ scale: landed && !reduceMotion ? [1, 1.14, 1] : 1 }}
            transition={{ duration: 0.5, times: [0, 0.42, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            {shownTeam.name}
          </motion.span>
        </div>
      </div>

      {/* Live region carrying only the settled result, so assistive tech gets
          the outcome without the hundreds of intermediate names. */}
      <p className="sr-only" aria-live="polite">
        {landedTeam ? `${activeWinner} drew the ${landedTeam.city} ${landedTeam.name}` : ""}
      </p>

      {/* Picked teams, as chips — multi only, one per landed spot. Sits outside
          the panel so the panel can keep its fixed frame height, and is always
          mounted with a reserved row height so the card is its final size before
          the first spin and never jumps as picks land. */}
      {mode === "multi" && (
        <div className="flex items-center" style={{ minHeight: CHIP_ROW_H }}>
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
        </div>
      )}
    </div>
  )
}
