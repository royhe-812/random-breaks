"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { teams, type Team } from "@/components/team-spinner"
import { RevealPill, useRevealStage, type RevealTuning } from "@/components/pill-reveal"
import { useRollerMotionBlur } from "@/components/roller-motion-blur"
import { SpinnerChevrons } from "@/components/spinner-chevrons"

interface SpinRollerSpinnerProps {
  /** True while spinning, false to reset. */
  isSpinning: boolean
  /** Fired once the roller lands — pass the winning team up. */
  onLanded: (team: Team) => void
  /** Winning bidder's username, shown bold under the title row. */
  winnerName?: string
  /**
   * No longer rendered — the header is now just "Randomizing for @handle".
   * Kept because several call sites (page, lab, testing zone) still pass it,
   * and it belongs to the shared spinner prop shape.
   */
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
   * separation of its neighbours changes. Defaults to DEFAULT_ROW_PITCH (26).
   */
  rowPitch?: number
  /**
   * Strength of the drum's velocity-driven motion blur. 1 is the physically
   * derived smear; 0 turns it off. The blur tracks instantaneous speed, so it
   * ramps in with the drum and is always gone by the time it rests on the winner.
   */
  motionBlur?: number
  /** Ceiling on the blur's stdDeviation, in px, so peak speed can't grey out the drum. */
  motionBlurMax?: number
  /**
   * Feel of the landed pill's reveal — draw time, pacing, hold, fill, thickness,
   * pop and glow. Omit for the tuned defaults; the testing zone forwards dial
   * values through. See components/pill-reveal.tsx.
   */
  reveal?: RevealTuning
  /**
   * Suppress the drum's own centre-pill stroke/fill reveal. The Shared Element
   * Transition uses this: the roller only spins and lands, and the reveal is
   * played at screen centre after the name flies there. The drum still lands and
   * calls `onLanded`; it just leaves the centre pill idle.
   */
  disableReveal?: boolean
  /**
   * Turns on the Subtle Winning treatment (Figma 1593-51897) for single spin:
   *  - no centre selection pill (distinct from `disableReveal`, which keeps the
   *    idle grey pill and only suppresses its stroke/fill),
   *  - blue chevrons that flank the name, pulse while spinning, then fly inward
   *    and fade out on landing,
   *  - on landing the losing rows fade out so only the winner remains, held.
   * With nothing coloured behind it the centre label always stays white.
   */
  subtle?: boolean
  /**
   * Attached to the centre (winning) row's name span, so a parent can measure it
   * as the origin of a shared-element flight. Only the resting centre row carries
   * it, so it is stable once the drum has landed.
   */
  centreRowRef?: React.Ref<HTMLSpanElement>
  /**
   * Hide the centre row's name (kept in layout via `visibility`) so a flying copy
   * can take over without the original showing through underneath it.
   */
  hideCentreLabel?: boolean
  /**
   * Close the drum up once the winning team has flown off, as a list removal: the
   * rows below the vacated slot climb one pitch to take its place while the rows
   * above hold, so the next team slides into the selection container. The
   * container itself stays put and keeps framing the centred name. Animated purely
   * in CSS, and only enabled after the drum is at rest, so it never smears the spin.
   */
  collapseCentre?: boolean
}

/* ── Cylinder geometry ──
   The roller is a real 3D cylinder, not a flat list: each row sits on the
   surface of a drum rotating around the X axis. That's what gives the rows
   above and below centre their curve/foreshortening.

   Placing a row at `rotateX(-angle) translateZ(R)` puts it at screen
   y = R * sin(angle). To make one step of the drum travel exactly ITEM_H at
   centre, R must satisfy R * STEP_RAD = ITEM_H, hence R = ITEM_H / STEP_RAD. */
const ITEM_H = 34
/** Row spacing the drum ships at, in px centre-to-centre. Deliberately tighter
 *  than ITEM_H: the neighbour rows sit closer to the centre pill than a full row
 *  box apart. Kept separate from ITEM_H — which still sizes the drum, the row
 *  boxes, the pill and the scrims — so tightening the spacing never resizes any
 *  of those. Must stay in sync with the multi roller so both modes match. */
const DEFAULT_ROW_PITCH = 26
/** Widest NFL team name across all 32 teams — "Washington Commanders" — as
 *  measured at the row type (600 14px Geist). Re-measure if the row
 *  font/size/weight changes. */
const WIDEST_NAME_W = 172
/** Horizontal padding either side of the name inside the centre pill. */
const PILL_PAD_X = 16
/** Widen the pill past its snug fit around the longest name. At 1 the pill is
 *  exactly wide enough for "Washington Commanders" plus padding; 1.25 gives it
 *  25% more breathing room so shorter names sit in a roomier slot. Applied as a
 *  scale rather than baked into PILL_PAD_X so the measured name width stays the
 *  honest minimum. Must stay in sync with the multi roller. */
const PILL_W_SCALE = 1.25
/** Fixed width of the centre selection pill: the snug widest-name + padding
 *  measurement, scaled up by PILL_W_SCALE. Rounded to whole px to avoid a
 *  half-pixel edge once it is centred with a negative margin. */
const PILL_W = Math.round((WIDEST_NAME_W + PILL_PAD_X * 2) * PILL_W_SCALE)
/** Resting fill of the centre pill. The drum has no fill of its own, so the pill
 *  is what marks the selected slot: it sits one step LIGHTER than the #212121
 *  card. (It used to be #212121 against a lighter drum panel — that reads as
 *  nothing once the panel is gone.) The landed state overrides this with the
 *  team's own colour. */
const PILL_IDLE = "#363636"
/** Hairline rule colour. Shares #363636 with PILL_IDLE by design — both are the
 *  one step up from the card that separates a surface without adding a new hue. */
const DIVIDER = "#363636"
/** The card the drum sits on. The edge scrims must be tinted with exactly this
 *  colour to read as a fade-out; any lighter and they show up as a grey wash. */
const CARD_RGB = "33,33,33"
/**
 * Top/bottom edge scrim. Stops approximate a quadratic ease-out rather than a
 * straight two-stop ramp: a linear fade puts half its opacity in the middle of
 * the band, which is what makes the edge read as a hard grey bar. Falling off
 * quickly and then tapering keeps the very edge covered while blending into the
 * card. Fully opaque at the edge is safe now that the tint matches the card.
 */
const scrim = (dir: "to bottom" | "to top") =>
  `linear-gradient(${dir}, rgba(${CARD_RGB},1) 0%, rgba(${CARD_RGB},0.72) 22%, rgba(${CARD_RGB},0.4) 45%, rgba(${CARD_RGB},0.16) 68%, rgba(${CARD_RGB},0) 100%)`
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
  rowPitch = DEFAULT_ROW_PITCH,
  motionBlur = 1,
  motionBlurMax = 10,
  reveal,
  disableReveal = false,
  subtle = false,
  centreRowRef,
  hideCentreLabel = false,
  collapseCentre = false,
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

  const centre = Math.round(pos)

  /* Velocity-driven motion blur. Derived from `pos` rather than from the spin
     phase, so it needs no wiring into the landing sequence: once the drum stops
     moving the measured velocity is zero and the winner renders crisp. */
  const { blurProps, filter: motionBlurFilter } = useRollerMotionBlur({
    pos,
    active: isSpinning,
    rowPitch,
    strength: motionBlur,
    maxPx: motionBlurMax,
  })

  // Landed team drives the pill treatment, reusing the same `color` the
  // celebration moments use so the two stay visually consistent.
  const landedTeam = landedIndex !== null ? teams[landedIndex] : null
  /* Drives the staged reveal: stroke draws in the team's secondary, then the
     primary fills. Held here rather than inside the pill because the landed
     row's label has to change colour in step with the fill. */
  const revealStage = useRevealStage(disableReveal ? null : landedTeam, reveal)
  /* Only meaningful once the pill is actually filled — before that the pill is
     still dark, so a dark label picked for a bright primary (Steelers gold)
     would be unreadable. */
  const landedTextColor = landedTeam ? readableOn(landedTeam.color) : "#ffffff"

  /* Subtle landing: the drum has come to rest (the flash, or the recorded
     pick). Losing rows fade out and only the winner is held. */
  const subtleLanded = subtle && (justLanded || landedIndex !== null)
  /* Chevron choreography (subtle only): pulse while the drum moves, fly inward
     and fade the instant it lands, parked and invisible when not spinning. */
  const chevronState: "hidden" | "spinning" | "gone" = !subtle
    ? "hidden"
    : !isSpinning
      ? "hidden"
      : subtleLanded
        ? "gone"
        : "spinning"

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
    /* Outer card — matches the dark rounded bid box card shape exactly.
       `h-full` so the content can divide whatever height the card is given: in
       single mode the card is `flex-1` inside a fixed-height overlay, so hugging
       the content left the drum sitting ~20px high with a band of dead card
       below it. Where the parent is auto-height instead (multi, and the shared
       transition stage), `h-full` resolves against an indefinite height and
       behaves as auto, so those keep hugging exactly as before. */
    <div className="w-full h-full flex flex-col">

      {/* Header + divider stay pinned to the top — `shrink-0` so they are never
          compressed to make room for the drum in a short card. */}
      <div className="shrink-0 flex flex-col gap-2">
        {/* Single line naming who this draw is for. This replaced a two-line
            stack (the break + box title, then a trophy line with the handle):
            the break title is already on the bid box card this overlays, so
            repeating it here spent the card's most prominent line on something
            the viewer just read. */}
        <div className="flex items-center justify-center gap-3">
          <div className="min-w-0 text-white">
            <p className="truncate text-sm leading-tight text-center">
              {"Randomizing for "}
              {/* Bold on the handle only, so the name is what carries the line. */}
              <span className="font-bold">{`@${winnerName}`}</span>
            </p>
          </div>
        </div>

        {/* Hairline between the winner line and the drum. Figma measures it at
            320px, but that is just the card's inner width at that frame size —
            `align-self: stretch` means "fill the parent", so it stays w-full
            here instead of being pinned to 320px and mismatching the card.
            Height 0 + a 1px top border keeps it a true hairline. */}
        <hr className="w-full m-0 border-0" style={{ height: 0, borderTop: `1px solid ${DIVIDER}` }} />
      </div>

      {/* Centres the drum in whatever height is left under the header rather
          than letting it sit directly beneath the divider. `min-h-0` is what
          lets this actually shrink inside the column — without it the flex item
          keeps its content floor and can push past the card. The drum keeps its
          own fixed height, so this only ever moves it, never resizes it. */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        {/* ── Roller drum ── */}
        <div
          className="relative w-full overflow-hidden rounded-md"
          style={{
            height: ITEM_H * 3,
            /* No fill: the drum sits flush on the card. The lighter surface used
               to live here, with the darker pill reading as a slot cut into it —
               that relationship is now inverted onto the pill itself (see
               PILL_IDLE), since a #212121 pill on the #212121 card would vanish. */
            backgroundColor: "transparent",
            perspective: 420,
          }}
        >
          {/* Filter definition for the rows' motion blur. Carries no visual of
              its own — the rows reference it by id. */}
          {motionBlurFilter}

          {/* Centre selection pill, sitting behind the rows. Self-centring, and
              owns its own staged reveal — see components/pill-reveal.tsx. The
              pop and glow it used to fire the instant the drum stopped now ride
              the fill at the end of that sequence. It stays put through the
              collapse — it is the drum's selection container, not part of the
              removed row, so the rows close ranks *underneath* it and it keeps
              framing whichever name is now centred. Omitted entirely for the
              Subtle Winning concept, which marks the landing without this
              coloured container. */}
          {!subtle && (
            <RevealPill
              team={landedTeam}
              stage={revealStage}
              width={PILL_W}
              height={ITEM_H - 4}
              idleColor={PILL_IDLE}
              {...reveal}
            />
          )}

          {/* Blue chevrons framing the centre name (subtle only). */}
          {subtle && <SpinnerChevrons state={chevronState} />}

          {/* Rows, positioned on the surface of the drum */}
          <div
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            {rows.map(({ slot, idx, delta, team }) => {
              /* Compression is a list removal, not a squeeze: the winner's slot is
                 vacated, so every row *below* it climbs one pitch to close ranks
                 while the rows above stay put. Advancing the row's own drum angle
                 (rather than nudging it with a screen-space translate) means it
                 travels along the drum surface and arrives flat and centred — so
                 the selection container still frames a real name instead of
                 sitting empty over a gap. `rel` is the integer slot offset, which
                 is stable once the drum is at rest. */
              const rel = slot - centre
              const collapseRows = collapseCentre && rel > 0 ? 1 : 0
              /* The vacated row itself is left in place but hidden: the incoming
                 row lands exactly on top of it, and its label is the one that flew
                 away. */
              const vacated = collapseCentre && rel === 0
              const effDelta = delta - collapseRows
              const angle = effDelta * stepDeg
              // Past ~72° the row is nearly edge-on; drop it entirely.
              if (Math.abs(angle) > EDGE_ON_DEG) return null
              /* Fade tracks the row's *angle*, not its row-index distance, so
                 the dimming profile looks the same at any pitch. The 2.1
                 preserves the original falloff at the default pitch. Because the
                 angle is post-collapse, the row sliding into the centre brightens
                 as it arrives rather than staying dim there. */
              const fade = Math.min(1, Math.abs(angle) / (2.1 * DEFAULT_STEP_DEG))
              /* Two distinct notions of "centre": `isCentre` is the winner's row
                 (the flight's measurement source, fixed pre-collapse), while
                 `isVisualCentre` is whichever row is actually sitting in the
                 container right now. */
              const isCentre = Math.abs(delta) < 0.5
              const isVisualCentre = !vacated && Math.abs(effDelta) < 0.5
              return (
                <div
                  key={`${slot}-${idx}`}
                  className="absolute left-0 right-0 flex items-center justify-center px-3"
                  style={{
                    height: ITEM_H,
                    top: "50%",
                    marginTop: -ITEM_H / 2,
                    transform: `rotateX(${-angle}deg) translateZ(${RADIUS}px)`,
                    /* Only transitioned while collapsing or during the subtle
                       fade-to-winner, so the per-frame spin transforms are never
                       smeared by an interpolation. */
                    transition: subtleLanded
                      ? "opacity 350ms ease"
                      : collapseCentre
                        ? "transform 340ms cubic-bezier(0.22,0.61,0.36,1), opacity 340ms ease"
                        : undefined,
                    /* Subtle landing keeps only the winner (centre) row; every
                       other row fades out. Otherwise rows tip away from the
                       viewer and dim with distance. */
                    opacity: subtleLanded
                      ? isCentre
                        ? 1
                        : 0
                      : vacated
                        ? 0
                        : 1 - fade * 0.82,
                    backfaceVisibility: "hidden",
                  }}
                >
                  <span
                    ref={isCentre ? centreRowRef : undefined}
                    className={`truncate font-semibold leading-none${
                      subtleLanded && isCentre ? " winner-bump" : ""
                    }`}
                    style={{
                      fontSize: 16,
                      /* Flips with the fill, not with landing: during the
                         stroke stages the pill is still dark, so the label
                         stays white until the primary is actually behind it. */
                      color: isVisualCentre
                        ? isCentre && revealStage === 2 && !subtle
                          ? landedTextColor
                          : "#ffffff"
                        : "#8f8f8f",
                      /* Hidden (but kept in layout) once a shared-element flight
                         has taken over rendering the centre name. */
                      visibility: isCentre && hideCentreLabel ? "hidden" : "visible",
                      /* Vertical-only smear, scaled to the drum's live speed.
                         Applied to the span rather than the row so it cannot
                         flatten the parent's preserve-3d and kill the curve.
                         Winner emphasis is the `.winner-bump` class above. */
                      ...blurProps.style,
                    }}
                  >
                    {team.city} {team.name}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Subtle top/bottom scrims. These MUST fade to transparent — an
              opaque fill here is exactly as tall as the neighbour rows and
              would hide them completely. Tinted with the card colour (see
              `scrim`) so they read as the rows dissolving into the card rather
              than as a grey band laid over it. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0"
            style={{ height: ITEM_H, background: scrim("to bottom") }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{ height: ITEM_H, background: scrim("to top") }}
          />
        </div>


      </div>


    </div>
  )
}
