"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { teams, type Team } from "@/components/team-spinner"
import { RevealPill, useRevealStage, readableOn, type RevealTuning } from "@/components/pill-reveal"

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
/** Widest name in the actual 17-team list — "Los Angeles Chargers" — measured at
 *  the pill's own type (700 14px Market Sans) via canvas measureText. Re-measure
 *  if the team list or the label's font/size/weight changes. */
const WIDEST_NAME_W = 149
/** Pill width, exactly as authored in frame 817:27758. The ticker holds one fixed
 *  width for every name (see the fixed-width note on the label), so it has to
 *  clear the widest one — at 149px it does, with 20px of room a side. */
const PILL_W = 190
/** Room the label keeps inside the pill on the worst-case name, so `truncate` can
 *  never bite into a name that would otherwise fit. */
const PILL_PAD_X = Math.floor((PILL_W - WIDEST_NAME_W) / 2)
/** Pill height and radius, both straight from frame 817:27758. */
const PILL_H = 20
const PILL_RADIUS = 8

/* ── Randomizer panel (frame 817:27737) ──
   The randomizer is now its own inset panel rather than a bare region of the
   card: a #363636 rounded box holding the "Randomizing spot for …" line and the
   pill, centred as a group. */
/** Inset panel fill. */
const PANEL_BG = "#363636"
const PANEL_RADIUS = 8
/** Panel height, from the frame. Fixed so the card never resizes mid-spin. */
const PANEL_H = 138
/** Gap between the label and the pill, from the frame. */
const PANEL_GAP = 8
/** Resting fill of the pill (frame 817:27758). Much lighter than the rollers'
 *  #363636 — light enough that the reveal's stroke test has to allow *darker*
 *  strokes as well as brighter ones, or 9 of the 17 teams collapse onto the same
 *  neutral outline. See DARK_STROKE_MIN_PILL_LUMA in pill-reveal.tsx. */
const PILL_IDLE = "#767676"
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

  // Landed team drives the pill treatment, reusing the same `color` the
  // celebration moments use so the two stay visually consistent.
  const landedTeam = landedIndex !== null ? teams[landedIndex] : null
  /* Drives the staged reveal: stroke draws in the team's secondary, then the
     primary fills. Held here rather than inside the pill because the label has
     to change colour in step with the fill. */
  const revealStage = useRevealStage(disableReveal ? null : landedTeam, reveal)
  /* Only meaningful once the pill is actually filled — before that the pill is
     still dark, so a dark label picked for a bright primary (Steelers gold)
     would be unreadable. */
  const landedTextColor = landedTeam ? readableOn(landedTeam.color) : "#ffffff"

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
    <div className="w-full flex flex-col gap-2">
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

      {/* ── Randomizer panel (frame 817:27737) ──
          The randomizer is its own inset #363636 box rather than a bare region
          of the card, holding the label and the pill centred as a group. It
          replaces the rollers' hairline-divider + trophy-line arrangement: the
          panel's own label already carries the winner's name, so a trophy line
          above it would print the same name twice.

          Height is fixed rather than derived from the contents so the card is
          its final size before the first tick and never resizes mid-spin. */}
      <div
        className="w-full flex flex-col items-center justify-center"
        style={{
          height: PANEL_H,
          gap: PANEL_GAP,
          backgroundColor: PANEL_BG,
          borderRadius: PANEL_RADIUS,
          paddingTop: PANEL_GAP,
          paddingBottom: PANEL_GAP,
        }}
      >
        {/* Whose spot is being drawn (frame 817:27750). */}
        <p className="truncate text-center" style={{ fontSize: 12, lineHeight: "16px", color: "#f7f7f7" }}>
          {`Randomizing spot for ${activeWinner}:`}
        </p>

        {/* ── Ticker ──
            The roller's drum reduced to a single row. No perspective, no 3D and
            no motion blur: nothing here travels, so there is no direction to
            smear along — a blur would just read as the text being out of focus.

            Sized to the pill exactly, so the pill is the row. */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: PILL_W, height: PILL_H }}
          /* The name changes far too fast to be worth announcing mid-run; the
             settled winner is announced by the live region below. */
          aria-hidden="true"
        >
          {/* Selection pill, sitting behind the name. Self-centring, and owns
              its own staged reveal — see components/pill-reveal.tsx. It picks the
              stroke from `idleColor`, so this lighter pill gets the darker-stroke
              branch automatically. */}
          <RevealPill
            team={landedTeam}
            stage={revealStage}
            width={PILL_W}
            height={PILL_H}
            radius={PILL_RADIUS}
            idleColor={PILL_IDLE}
            {...reveal}
          />

          {/* The one visible name. Fixed to the pill's width and centred, so
              only the text swaps — letting it hug each name would strobe the
              pill's width dozens of times a second on top of the text change,
              which reads as jitter rather than as a ticker. */}
          <span
            className="relative truncate text-center font-bold"
            style={{
              width: PILL_W - PILL_PAD_X * 2,
              fontSize: 14,
              lineHeight: `${PILL_H}px`,
              /* Flips with the fill, not with landing: through the stroke stages
                 the pill is still the idle grey, so the label stays white until
                 the primary is actually behind it. */
              color: revealStage === 2 ? landedTextColor : "#ffffff",
            }}
          >
            {shownTeam.city} {shownTeam.name}
          </span>
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
