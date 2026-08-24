"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  POOL,
  fullLabel,
  shortLabel,
  type DataMode,
  type Spot,
} from "@/lib/multi-spin-data"

/* ── Spinner treatments for very long spot names ──
   The live drum is a real 3D cylinder. Its geometry is what makes long names
   hard: rows are a fixed 34px tall and the centre selection pill is a fixed
   255px wide — sized around "Washington Commanders" (~172px). A three-player
   spot like "V. Wembanyama · C. Cunningham · P. Banchero" measures ~320px, so
   it overruns the pill AND the 343px card interior.

   Constraint for this lab: the drum keeps its 102px envelope (3 x 34px). Every
   treatment therefore has to solve the problem HORIZONTALLY. */

/** Row box height the drum ships at. */
const ITEM_H = 34
/** Row spacing centre-to-centre. Deliberately tighter than ITEM_H. */
const ROW_PITCH = 28
/** Angular separation the radius is derived from. */
const STEP_DEG = 20
/** Total drum height. Locked — treatments may not buy vertical space. */
const DRUM_H = ITEM_H * 3
/** Past this angle a row is close enough to edge-on to skip drawing. */
const EDGE_ON_DEG = 72
/** Horizontal padding either side of the name inside the pill. */
const PILL_PAD_X = 16
/** The shipping pill width. */
const PILL_W = 255
/** Card interior width — the widest a pill can ever break out to. */
const CARD_INNER_W = 343
/** Perspective depth of the drum stage. */
const PERSPECTIVE = 420
/** Fill of the centre selection pill: one step lighter than the #212121 card. */
const PILL_IDLE = "#363636"
const CARD_RGB = "33,33,33"

/* ── Multi-spin ──
   A buyer who owns two spots spins twice in one sitting, so the card needs
   somewhere to keep result #1 while result #2 is still being drawn. */

/** Beat the landed name is held in the pill before it flies to the bank. Long
 *  enough to actually read the winner — the flight is not the reveal. */
const READ_MS = 950
/** Duration of the shrink-and-pop flight into the bank. */
const FLY_MS = 520
/** Type size of a banked chip. Every pool label fits one line at this size. */
const BANK_FONT = 12

const scrim = (dir: "to bottom" | "to top") =>
  `linear-gradient(${dir}, rgba(${CARD_RGB},1) 0%, rgba(${CARD_RGB},0.72) 22%, rgba(${CARD_RGB},0.4) 45%, rgba(${CARD_RGB},0.16) 68%, rgba(${CARD_RGB},0) 100%)`

export type SpinTreatment =
  | "shrink"
  | "marquee"
  | "breakout"
  | "abbrevReveal"
  | "teamBelow"
  | "stacked"

export const SPIN_TREATMENTS: { id: SpinTreatment; label: string; blurb: string }[] = [
  {
    id: "shrink",
    label: "Shrink to fit",
    blurb:
      "Every row auto-scales its type down until the full name fits the 255px pill. Nothing is ever hidden or shortened — the cost is paid entirely in font size, so the read-out below tells you how small the worst row actually gets.",
  },
  {
    id: "marquee",
    // Named distinctly from the pill row's "Marquee" so the two switchers on
    // this page never read as the same control.
    label: "Marquee row",
    blurb:
      "Rows keep full-size type and clip at the pill edge. The landed centre row then eases back and forth so the whole name reads over a few seconds. Full size, full name — but the tail is time-delayed rather than instant.",
  },
  {
    id: "breakout",
    label: "Pill breaks out",
    blurb:
      "The drum spins at the normal 255px width; on landing the pill grows to exactly the width this name needs at full 14px — a snug pill for a short winner, the whole 343px card interior for a long one. Type is never shrunk. If even the full interior can't hold the name, the landed row marquees instead.",
  },
  {
    id: "abbrevReveal",
    label: "Abbrev → full",
    blurb:
      "The reel spins short forms (\"C. McCaffrey\") and cross-fades to the full name once landed. The most legible spin of the set — but it is the one treatment that does NOT show the true name throughout, so the reel is arguably showing something the buyer never won.",
  },
  {
    id: "teamBelow",
    label: "Team + roster line",
    blurb:
      "The drum only ever spins the short team name, which always fits comfortably. The three players resolve on a supporting line beneath the drum. Splits one long string into two well-sized fields instead of fighting the pill width.",
  },
  {
    id: "stacked",
    label: "Stacked rows",
    blurb:
      "Rows grow to 51px and stack the name across two lines, so the drum shows two rows instead of three inside the same locked 102px. Full names at readable size, paid for with reel context rather than height.",
  },
]

/** Treatments that render a taller, two-line row. */
const isStacked = (t: SpinTreatment) => t === "stacked"

const mod = (n: number, m: number) => ((n % m) + m) % m
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
/** Ease-out quart — a long, settling tail, matching the shipping spin feel. */
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

/** Split a spot's name across two balanced lines for the stacked treatment. */
function stackedLines(spot: Spot, data: DataMode): [string, string] {
  if (data === "teams") return [spot.city, spot.team]
  const p = spot.players
  if (p.length <= 1) return [p[0] ?? "", ""]
  if (p.length === 2) return [p[0], p[1]]
  return [`${p[0]} · ${p[1]}`, p[2]]
}

/** Gap between the two copies in a looping marquee, px. */
const MARQUEE_GAP = 48
/** Marquee travel speed, px per second. Constant regardless of name length. */
const MARQUEE_SPEED = 55

/**
 * Marquee that scrolls only when its content overflows. Travels continuously
 * leftwards and wraps: the text is rendered twice, and the track is animated by
 * exactly one copy-plus-gap before snapping back, so the second copy lands
 * precisely where the first began and the seam is invisible.
 *
 * A ping-pong (run left, pause, reverse) was tried first and reads badly here —
 * the reversal draws the eye back to a name it has already read, and the pause
 * looks like the animation has hung. A one-way loop matches the ticker idiom
 * people already expect for a name that does not fit.
 */
function RowMarquee({ text, width }: { text: string; width: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLSpanElement>(null)
  const [copyW, setCopyW] = useState(0)
  const [overflowing, setOverflowing] = useState(false)

  useLayoutEffect(() => {
    const c = containerRef.current
    const one = copyRef.current
    if (!c || !one) return
    /* Measure ONE copy, not the track: the track always overflows because it
       deliberately holds two copies plus the gap. */
    const w = one.getBoundingClientRect().width
    setCopyW(w)
    setOverflowing(w > c.clientWidth + 0.5)
  }, [text, width])

  /* Distance for one full cycle. Travelling exactly copy + gap is what makes
     the wrap seamless — any other distance visibly jumps. */
  const distance = copyW + MARQUEE_GAP

  return (
    <div ref={containerRef} className="overflow-hidden" style={{ width }}>
      <motion.div
        className="flex w-max flex-nowrap"
        style={{ gap: MARQUEE_GAP }}
        animate={overflowing ? { x: [0, -distance] } : { x: 0 }}
        transition={
          overflowing
            ? {
                duration: distance / MARQUEE_SPEED,
                repeat: Infinity,
                // Linear only: any easing makes the wrap stutter, and speed
                // must not vary with name length.
                ease: "linear",
                repeatType: "loop",
              }
            : undefined
        }
      >
        <span ref={copyRef} className="whitespace-nowrap">
          {text}
        </span>
        {/* Trailing copy exists purely to fill the gap left by the first as it
            exits. Hidden from assistive tech so the name is not read twice. */}
        {overflowing && (
          <span className="whitespace-nowrap" aria-hidden="true">
            {text}
          </span>
        )}
      </motion.div>
    </div>
  )
}

/** One already-drawn result, parked at the bottom of the card. */
type BankEntry = { id: number; idx: number; settled: boolean }
/** Geometry for the pill → bank flight, in card-relative px. */
type Flight = {
  id: number
  label: string
  from: { x: number; y: number; w: number; h: number }
  to: { x: number; y: number; w: number; h: number }
}

export function MultiSpinSpinnerLab({ data }: { data: DataMode }) {
  const [treatment, setTreatment] = useState<SpinTreatment>("shrink")
  const [pos, setPos] = useState(0)
  const [phase, setPhase] = useState<"idle" | "spinning" | "landed" | "flying">("idle")

  /** How many spots this buyer is drawing in one sitting. */
  const [spinCount, setSpinCount] = useState<1 | 2>(1)
  const [banked, setBanked] = useState<BankEntry[]>([])
  const [flight, setFlight] = useState<Flight | null>(null)
  /* True once this round's winner has moved to the bank. Without it the centre
     label returns when the flight ends and the name sits in two places at
     once — undoing the very thing the flight just showed. */
  const [vacated, setVacated] = useState(false)

  const rafRef = useRef<number | null>(null)
  const posRef = useRef(0)
  /* Indices already drawn this sitting. Kept in a ref as well as in `banked`
     because the next round is scheduled from a timeout that would otherwise
     close over a stale copy. */
  const bankedIdxRef = useRef<number[]>([])
  const bankIdRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const cardRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef(new Map<number, HTMLElement>())
  const bankScrollRef = useRef<HTMLDivElement>(null)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  /* Mirrors of props/state the scheduled callbacks read. A timeout fired three
     seconds into a spin would otherwise see the values from when it was set. */
  const spinCountRef = useRef(spinCount)
  spinCountRef.current = spinCount
  const dataRef = useRef(data)
  dataRef.current = data

  const stacked = isStacked(treatment)
  const itemH = stacked ? 51 : ITEM_H
  const pitch = stacked ? 44 : ROW_PITCH
  const radius = itemH / (STEP_DEG * (Math.PI / 180))

  /* The drum spins the short team name in the teamBelow treatment, and the
     abbreviated form while spinning in abbrevReveal. Everything else spins the
     genuine full name. */
  const labelFor = useCallback(
    (spot: Spot, isCentre: boolean) => {
      if (treatment === "teamBelow") return `${spot.city} ${spot.team}`
      if (treatment === "abbrevReveal") {
        const revealed = phase === "landed" && isCentre
        return revealed ? fullLabel(spot, data) : shortLabel(spot, data)
      }
      return fullLabel(spot, data)
    },
    [treatment, data, phase],
  )

  /* ── Measure every label once so shrink-to-fit has real widths ──
     Measuring per frame during a spin would be far too costly, so all pool
     labels are rendered once into a hidden probe at the base 14px and their
     widths cached. Scales are then pure arithmetic. */
  const probeRef = useRef<HTMLDivElement>(null)
  const [widths, setWidths] = useState<number[]>([])
  const [shortWidths, setShortWidths] = useState<number[]>([])

  /* Always probe the FULL label. Every treatment that needs a scale is fitting
     the full name — the short forms and team names fit at 14px unaided — so one
     measured set serves them all and the probe never re-runs on a treatment
     switch. */
  const probeLabels = useMemo(() => POOL.map((spot) => fullLabel(spot, data)), [data])
  const shortProbeLabels = useMemo(() => POOL.map((spot) => shortLabel(spot, data)), [data])

  useLayoutEffect(() => {
    const node = probeRef.current
    if (!node) return
    const read = (kind: string) =>
      Array.from(node.querySelectorAll<HTMLSpanElement>(`[data-probe="${kind}"]`)).map(
        (s) => s.getBoundingClientRect().width,
      )
    setWidths(read("full"))
    setShortWidths(read("short"))
  }, [probeLabels, shortProbeLabels])

  /* Rows live on the cylinder surface at translateZ(radius), so perspective
     magnifies them by PERSPECTIVE / (PERSPECTIVE - radius) — about 1.30x at the
     default pitch. The pill is NOT on the cylinder, so it is drawn at true size.
     A row's layout box must therefore be divided by the magnification for its
     RENDERED width to match the pill. (This is exactly why the shipping pill is
     255px: 172px of name x 1.30 + 32px padding.) */
  const magnification = PERSPECTIVE / (PERSPECTIVE - radius)
  /** Un-magnified text width that renders flush inside a pill of width `pw`. */
  const innerFor = useCallback(
    (pw: number) => (pw - PILL_PAD_X * 2) / magnification,
    [magnification],
  )

  const narrowAvail = innerFor(PILL_W)

  /** Font scale per pool index for the shrink treatment. */
  const shrinkScales = useMemo(
    () => widths.map((w) => (w > 0 ? clamp(narrowAvail / w, 0.5, 1) : 1)),
    [widths, narrowAvail],
  )
  /** Scale for the abbreviated reel rows. Three initial+surname names still
   *  overrun the pill at 14px, so even the short form has to be fitted. */
  const shortScales = useMemo(
    () => shortWidths.map((w) => (w > 0 ? clamp(narrowAvail / w, 0.5, 1) : 1)),
    [shortWidths, narrowAvail],
  )
  /* Breakout does not shrink type at all. Instead the pill grows to exactly the
     width this name needs at full 14px — inverting innerFor(), so the un-magnified
     text width is scaled back up by the perspective magnification before the
     padding is added. Capped at the card interior; anything that still doesn't
     fit falls back to a marquee rather than shrinking. */
  const pillWidthFor = useCallback(
    (w: number) => w * magnification + PILL_PAD_X * 2,
    [magnification],
  )
  /** Pill width each pool entry would need to show its whole name at 14px. */
  const neededPillW = useMemo(() => widths.map(pillWidthFor), [widths, pillWidthFor])

  /** Smallest size the viewer actually perceives — the honest cost read-out.
   *  Type is authored un-magnified, so the on-screen size is scale x magnification. */
  const smallestPx = useMemo(() => {
    if (!shrinkScales.length) return 14
    return Math.round(Math.min(...shrinkScales) * 14 * magnification * 10) / 10
  }, [shrinkScales, magnification])

  /** Same read-out for the abbreviated reel, so the two can be compared. */
  const smallestShortPx = useMemo(() => {
    if (!shortScales.length) return 14
    return Math.round(Math.min(...shortScales) * 14 * magnification * 10) / 10
  }, [shortScales, magnification])

  /** How many pool entries can't fit even at the full card interior. */
  const marqueeCount = useMemo(
    () => neededPillW.filter((w) => w > CARD_INNER_W).length,
    [neededPillW],
  )

  const centreIdx = mod(Math.round(pos), POOL.length)
  const landedSpot = POOL[centreIdx]

  /** Spin the drum to a specific pool index, then hand back control. */
  const spinTo = useCallback((targetIdx: number, onLand: () => void) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    const start = posRef.current
    const from = Math.round(start)
    const laps = 4
    /* Land on the chosen index rather than a random number of steps, so round
       two can be forced away from the spot round one already took. */
    let end = from + laps * POOL.length
    end += mod(targetIdx - mod(end, POOL.length), POOL.length)
    if (end <= from) end += POOL.length
    const duration = 3200
    const t0 = performance.now()

    setPhase("spinning")
    setVacated(false)

    const tick = (now: number) => {
      const t = clamp((now - t0) / duration, 0, 1)
      const next = start + (end - start) * easeOutQuart(t)
      posRef.current = next
      setPos(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        posRef.current = end
        setPos(end)
        setPhase("landed")
        onLand()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  /* The multi-spin chain. Each round: spin → hold the winner so it can be read
     → shrink it into the bank → spin the next. Written as mutually recursive
     callbacks rather than an effect chain so the timing stays explicit. */
  const runRoundRef = useRef<(round: number) => void>(() => {})

  const finishFlight = useCallback(
    (id: number, round: number, total: number) => {
      setFlight(null)
      setBanked((prev) => prev.map((b) => (b.id === id ? { ...b, settled: true } : b)))
      setVacated(true)
      /* Leave the flying phase or the sitting never ends: `busy` would stay
         true and the Spin button would sit disabled on "Spinning…" forever. */
      setPhase("landed")
      if (round + 1 < total) {
        const t = setTimeout(() => runRoundRef.current(round + 1), 260)
        timersRef.current.push(t)
      } else {
        /* The scroller was jumped to the end to measure the flight target.
           Leaving it parked there truncates spot 1 mid-word, so the finished
           sitting eases back to read from the beginning. */
        const t = setTimeout(() => {
          bankScrollRef.current?.scrollTo({ left: 0, behavior: "smooth" })
        }, 220)
        timersRef.current.push(t)
      }
    },
    [],
  )
  const finishFlightRef = useRef(finishFlight)
  finishFlightRef.current = finishFlight

  const runRound = useCallback(
    (round: number) => {
      const total = spinCountRef.current
      /* Keep results distinct: a two-spot buyer drawing the same spot twice
         would look like the randomizer is broken. */
      const used = bankedIdxRef.current
      const allowed = POOL.map((_, i) => i).filter((i) => !used.includes(i))
      const target = allowed[Math.floor(Math.random() * allowed.length)] ?? 0

      spinTo(target, () => {
        if (total < 2) return // Single spin: land and stay landed, as before.
        const t = setTimeout(() => {
          const id = ++bankIdRef.current
          bankedIdxRef.current = [...bankedIdxRef.current, target]
          setBanked((prev) => [...prev, { id, idx: target, settled: false }])

          /* Measure only once the (hidden) destination chip is in the DOM, so
             the flight lands on the chip's real geometry instead of a guess. */
          requestAnimationFrame(() => {
            const card = cardRef.current
            const pill = pillRef.current
            const slot = slotRefs.current.get(id)
            if (!card || !pill || !slot) {
              finishFlightRef.current(id, round, total)
              return
            }
            /* Bring the new chip into view BEFORE measuring. In a horizontal
               scroller the newest chip can start beyond the right edge, and a
               flight aimed at an off-screen rect flies out of the card. Jump
               (not smooth) so the rect is final by the time we read it. */
            const scroller = bankScrollRef.current
            if (scroller) scroller.scrollLeft = scroller.scrollWidth

            const c = card.getBoundingClientRect()
            const o = pill.getBoundingClientRect()
            const d = slot.getBoundingClientRect()
            setFlight({
              id,
              label: fullLabel(POOL[target], dataRef.current),
              from: { x: o.left - c.left, y: o.top - c.top, w: o.width, h: o.height },
              to: { x: d.left - c.left, y: d.top - c.top, w: d.width, h: d.height },
            })
            setPhase("flying")
          })
        }, READ_MS)
        timersRef.current.push(t)
      })
    },
    [spinTo],
  )
  runRoundRef.current = runRound

  /** Start a fresh sitting: clear the bank, then run every round in turn. */
  const startSequence = useCallback(() => {
    clearTimers()
    bankedIdxRef.current = []
    setBanked([])
    setFlight(null)
    runRound(0)
  }, [clearTimers, runRound])

  // Stop any in-flight spin or scheduled round on unmount.
  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      timersRef.current.forEach(clearTimeout)
    },
    [],
  )

  // Changing the scenario resets the drum so each treatment starts comparable.
  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    posRef.current = 0
    setPos(0)
    setPhase("idle")
    // A half-finished sitting must not survive into another treatment.
    bankedIdxRef.current = []
    setBanked([])
    setFlight(null)
  }, [treatment, data, spinCount])

  const stepDeg = (pitch / radius) * (180 / Math.PI)
  const spinning = phase === "spinning"
  const landed = phase === "landed"
  const flying = phase === "flying"

  /* Multi-spin is a breakout-only exploration for now: the other treatments
     are still being judged on the single-spin problem, and giving them a bank
     would change what they are being compared on. */
  const multiEnabled = treatment === "breakout"
  const multi = multiEnabled && spinCount > 1
  /** Rendered type size of a drum row — authored 14px, magnified by the cylinder. */
  const drumFontPx = 14 * magnification
  const busy = spinning || flying
  const sittingDone = multi && banked.length === spinCount && banked.every((b) => b.settled)

  /* Pill geometry. Only the breakout treatment changes it, and only at rest.
     The pill grows to fit THIS name rather than always slamming to the card
     edge, so a short winner keeps a snug pill and only a genuinely long one
     uses the full interior. */
  const needed = neededPillW[centreIdx] ?? PILL_W
  /* Once the winner has flown to the bank the pill has nothing to fit, so it
     eases back to its neutral 255px rather than holding a wide empty shell. */
  const breakout = treatment === "breakout" && landed && !vacated
  /** True when even the full card interior cannot hold the name at 14px. */
  const breakoutMarquee = breakout && needed > CARD_INNER_W
  const pillW = breakout ? clamp(needed, PILL_W, CARD_INNER_W) : PILL_W

  /* Rows are drawn as a window around the centre so a finite pool can spin
     forever without rendering hundreds of nodes. */
  const base = Math.round(pos)
  const rowWindow = stacked ? [-1, 0, 1] : [-2, -1, 0, 1, 2]

  const activeBlurb = SPIN_TREATMENTS.find((t) => t.id === treatment)?.blurb ?? ""

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-bold">Spinner — long spot names</h2>
        <p className="text-sm text-white/50">
          The drum stays locked at {DRUM_H}px, so every treatment has to solve the overflow
          horizontally. Spin each one with the same names to compare.
        </p>
      </header>

      {/* Treatment switcher */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-white/40">
          Spinner treatment
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SPIN_TREATMENTS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTreatment(t.id)}
              aria-pressed={treatment === t.id}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                treatment === t.id
                  ? "bg-white text-zinc-900"
                  : "bg-zinc-800 text-white/70 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/60">
        {activeBlurb}
      </p>

      {/* The randomizer box. `relative` anchors the flight layer, which is
          positioned in card-relative coordinates. */}
      <div
        ref={cardRef}
        className="relative w-full max-w-[375px] rounded-2xl bg-[#212121] p-4 text-white"
      >
        <p className="truncate text-sm leading-tight">
          Randomizing for <span className="font-semibold">@Chrisjames</span>
        </p>

        {/* -mx-4 cancels the card's p-4 so the rule spans the full card width
            rather than stopping at the content inset. */}
        <hr
          className="-mx-4 my-3 border-0"
          style={{ height: 0, borderTop: "1px solid #363636" }}
        />

        {/* Drum.
            Once every spot is drawn the drum has no job left, so it collapses to
            nothing and the bank rises to take its place. Merely dimming it (the
            first attempt) still reserved ~200px of dead band above the results,
            which read as a spot that had failed to fill. Height is animated
            rather than toggled so the bank slides up instead of jumping. */}
        <motion.div
          className="relative w-full overflow-hidden rounded-md"
          /* At height 0 the reel rows are invisible but still in the text and
             accessibility tree, so a screen reader would announce five stale
             names after the sitting has already resolved. */
          aria-hidden={sittingDone || undefined}
          initial={false}
          animate={{
            height: sittingDone ? 0 : DRUM_H,
            opacity: sittingDone ? 0 : 1,
            marginBottom: sittingDone ? -12 : 0,
          }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          style={{ backgroundColor: "transparent", perspective: 420 }}
        >
          {/* Centre selection pill */}
          <div
            ref={pillRef}
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full transition-[width,opacity] duration-300 ease-out"
            style={{
              width: pillW,
              height: itemH - 4,
              marginLeft: -pillW / 2,
              marginTop: -(itemH - 4) / 2,
              backgroundColor: PILL_IDLE,
              /* The pill IS the thing that flies to the bank, so the original
                 must vacate the moment the flyer takes over — and stay gone
                 afterwards. Leaving it visible once its name has been banked
                 parks a hollow grey capsule in the middle of the drum, which
                 reads as a rendering fault rather than an empty selection. */
              opacity: flying || vacated ? 0 : 1,
            }}
          />

          {rowWindow.map((k) => {
            const idx = base + k
            const spot = POOL[mod(idx, POOL.length)]
            const offset = idx - pos
            const angle = offset * stepDeg
            if (Math.abs(angle) > EDGE_ON_DEG) return null

            const isCentre = k === 0
            const fade = Math.min(1, Math.abs(angle) / EDGE_ON_DEG)
            const poolIdx = mod(idx, POOL.length)
            const label = labelFor(spot, isCentre)

            /* Per-treatment horizontal fitting inside the pill. Short forms and
               team names already fit at 14px, so only the full name is scaled. */
            let scale = 1
            if (treatment === "shrink") scale = shrinkScales[poolIdx] ?? 1
            /* Breakout deliberately has no scale branch: it pays in width, and
               then in time via the marquee, never in type size. */
            else if (treatment === "abbrevReveal")
              // The revealed full name has to fit the same 255px pill, or the
              // "reveal" hands back a truncated name and the treatment is moot.
              scale =
                landed && isCentre ? (shrinkScales[poolIdx] ?? 1) : (shortScales[poolIdx] ?? 1)

            const contentW = innerFor(isCentre ? pillW : PILL_W)

            return (
              <div
                key={idx}
                className="absolute left-0 right-0 flex items-center justify-center"
                style={{
                  height: itemH,
                  top: "50%",
                  marginTop: -itemH / 2,
                  transform: `rotateX(${-angle}deg) translateZ(${radius}px)`,
                  /* The centre label leaves with the pill during the flight and
                     stays gone afterwards — otherwise the banked name appears
                     in two places at once. */
                  opacity: isCentre && (flying || vacated) ? 0 : 1 - fade * 0.82,
                }}
              >
                {stacked ? (
                  /* Two balanced lines inside the same locked drum height. */
                  <div
                    className="flex flex-col items-center justify-center text-center leading-tight"
                    style={{ width: contentW }}
                  >
                    {stackedLines(spot, data).map((line, i) =>
                      line ? (
                        <span
                          key={i}
                          className="block w-full truncate text-[12px] font-semibold"
                          style={{ opacity: i === 0 ? 1 : 0.85 }}
                        >
                          {line}
                        </span>
                      ) : null,
                    )}
                  </div>
                ) : isCentre && ((treatment === "marquee" && landed) || breakoutMarquee) ? (
                  /* Only the settled row scrolls; a moving reel must not. In
                     breakout this is the fallback: the pill has already grown
                     as far as the card allows and the name still overruns. */
                  <div className="text-[14px] font-semibold">
                    <RowMarquee text={label} width={contentW} />
                  </div>
                ) : (
                  <span
                    className="block truncate text-center font-semibold"
                    style={{
                      width: contentW,
                      fontSize: 14 * scale,
                      // Scaling type, not transform, keeps the row on the cylinder.
                      // Breakout animates WIDTH (it never touches type) and must
                      // use the same 300ms as the pill, or the text box snaps to
                      // full width while the pill is still growing under it.
                      transition:
                        treatment === "breakout"
                          ? "width 300ms ease-out"
                          : treatment === "abbrevReveal"
                            ? "font-size 300ms ease-out"
                            : undefined,
                    }}
                  >
                    {label}
                  </span>
                )}
              </div>
            )
          })}

          {/* Depth scrims top and bottom */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0"
            style={{ height: ITEM_H, background: scrim("to bottom") }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{ height: ITEM_H, background: scrim("to top") }}
          />
        </motion.div>

        {/* Supporting roster line — the second field in the teamBelow treatment. */}
        {treatment === "teamBelow" && (
          <div className="mt-2 min-h-[34px] rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
            {data !== "players" ? (
              /* Team names already fit the pill, so this treatment only has
                 something to solve in the players case. Say so rather than
                 echoing the landed team name back at the viewer. */
              <p className="text-[12px] leading-tight text-white/40">
                Team names already fit the pill — switch Content to NFL players.
              </p>
            ) : landed ? (
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                {landedSpot.players.map((p, i) => (
                  <span key={p} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span className="text-[12px] leading-tight text-white/30" aria-hidden="true">
                        ·
                      </span>
                    )}
                    <span className="text-[12px] leading-tight text-white">{p}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] leading-tight text-white/40">
                Roster resolves on landing
              </p>
            )}
          </div>
        )}

        {/* ── Banked results ─��
            Where a drawn spot lives once the drum has moved on. Present for the
            whole sitting (not just after the first land) so the card does not
            change height mid-flight and the flight has a real target to aim at. */}
        {multi && (
          <div className="mt-3">
            {/* With the drum collapsed this rule would sit a few px under the
                header's rule, reading as a double hairline. The header's rule
                already separates the bank at that point. */}
            {!sittingDone && (
              <hr
                className="-mx-4 mb-3 border-0"
                style={{ height: 0, borderTop: "1px solid #363636" }}
              />
            )}
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide text-white/40">
                Your spots
              </span>
              <span className="text-[11px] tabular-nums text-white/40">
                {banked.filter((b) => b.settled).length} of {spinCount}
              </span>
            </div>

            {/* Spots sit on one row and scroll sideways. Full roster labels are
                far wider than the 343px interior, so wrapping them would stack
                the card taller with every spin; a scroller keeps the card a
                fixed height whatever the pool contains. The negative margin +
                matching padding lets chips run to the card's edges instead of
                stopping short at the content inset. */}
            <div
              ref={bankScrollRef}
              className="no-scrollbar -mx-4 flex snap-x snap-mandatory items-start gap-1.5 overflow-x-auto px-4 pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {banked.map((b) => (
                <span
                  key={b.id}
                  ref={(el) => {
                    if (el) slotRefs.current.set(b.id, el)
                    else slotRefs.current.delete(b.id)
                  }}
                  className="shrink-0 snap-start whitespace-nowrap rounded-full px-3 py-1 font-semibold"
                  style={{
                    fontSize: BANK_FONT,
                    background: "rgba(255,255,255,0.09)",
                    /* Held invisible but laid out while its result is still in
                       flight: the chip is the flight's measured destination, so
                       it has to occupy its final geometry before the flyer moves. */
                    visibility: b.settled ? "visible" : "hidden",
                  }}
                >
                  {fullLabel(POOL[b.idx], data)}
                </span>
              ))}

              {/* Slots still to be drawn, so the buyer can see what is owed. */}
              {Array.from({ length: Math.max(0, spinCount - banked.length) }).map((_, i) => (
                <span
                  key={`empty-${i}`}
                  className="shrink-0 snap-start whitespace-nowrap rounded-full border border-dashed border-white/15 px-3 py-1 text-white/25"
                  style={{ fontSize: BANK_FONT }}
                >
                  Spin {banked.length + i + 1}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Flight layer ──
            One element morphing from the pill's geometry to the banked chip's:
            position, size and type size all animate, so the name shrinks into
            place rather than being scaled (which would distort the text). */}
        {flight && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute z-10 flex items-center justify-center overflow-hidden whitespace-nowrap rounded-full font-semibold text-white"
            initial={{
              left: flight.from.x,
              top: flight.from.y,
              width: flight.from.w,
              height: flight.from.h,
              fontSize: drumFontPx,
            }}
            animate={{
              left: flight.to.x,
              top: flight.to.y,
              width: flight.to.w,
              height: flight.to.h,
              fontSize: BANK_FONT,
            }}
            transition={{ duration: FLY_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() =>
              finishFlightRef.current(flight.id, banked.length - 1, spinCount)
            }
            style={{ background: PILL_IDLE }}
          >
            {flight.label}
          </motion.div>
        )}
      </div>

      {/* The action lives OUTSIDE the randomizer box, directly beneath it: the
          card is the thing being randomized, the button is the control acting
          on it. Matching the card's max-width keeps the two visually paired,
          and `min-w` stops the button resizing between the "Spin" and
          "Spinning…" labels. */}
      <div className="flex w-full max-w-[375px] items-center justify-between gap-3">
        {/* Scenario toggle. Breakout-only, but the slot is always occupied so
            the Spin button does not shift when switching treatments. */}
        {multiEnabled ? (
          <div
            className="flex items-center gap-0.5 rounded-full bg-zinc-800 p-0.5"
            role="group"
            aria-label="Number of spins"
          >
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSpinCount(n)}
                disabled={busy}
                aria-pressed={spinCount === n}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40 ${
                  spinCount === n ? "bg-white text-zinc-900" : "text-white/70 hover:text-white"
                }`}
              >
                {n === 1 ? "Single spin" : "2 spins"}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={startSequence}
          disabled={busy}
          className="min-w-[120px] shrink-0 rounded-full bg-[#3665F3] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Spinning…" : sittingDone ? "Spin again" : multi ? "Spin 2 spots" : "Spin"}
        </button>
      </div>

      {/* Honest cost read-outs, so a treatment can be rejected on evidence. */}
      <div className="flex flex-col gap-1 text-xs text-white/45">
        {treatment === "shrink" && (
          <p>
            Smallest row at this content: <span className="text-white">{smallestPx}px</span>
            {smallestPx < 11 ? " — below comfortable reading size on a phone." : "."}
          </p>
        )}
        {treatment === "breakout" && (
          <>
            <p>
              {marqueeCount === 0
                ? `Every name in this pool fits by widening alone — the pill never has to marquee.`
                : `${marqueeCount} of ${POOL.length} names need more than the ${CARD_INNER_W}px interior, so those marquee instead of shrinking.`}
            </p>
            {landed && (
              <p>
                This winner:{" "}
                <span className="text-white">
                  {PILL_W}px → {Math.round(pillW)}px
                </span>
                {breakoutMarquee
                  ? ` (capped at the card interior, needs ${Math.round(needed)}px — marqueeing)`
                  : " — full name, full size, no marquee needed"}
                .
              </p>
            )}
          </>
        )}
        {treatment === "abbrevReveal" && data === "players" && (
          <>
            <p>
              Reel type <span className="text-white">{smallestShortPx}px</span> vs full name{" "}
              <span className="text-white">{smallestPx}px</span> — three initial+surname names
              still overrun the pill, so abbreviating buys less than it looks.
            </p>
            <p>
              Reel shows <span className="text-white">{shortLabel(landedSpot, data)}</span>; result
              shows <span className="text-white">{fullLabel(landedSpot, data)}</span>.
            </p>
          </>
        )}
        {treatment === "stacked" && <p>Two rows visible instead of three — less reel context.</p>}
      </div>

      {/* Hidden probe: measures each label once at base size. */}
      <div
        ref={probeRef}
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] -top-[9999px] whitespace-nowrap"
        style={{ fontSize: 14, fontWeight: 600 }}
      >
        {probeLabels.map((l, i) => (
          <span key={`f${i}`} data-probe="full" className="whitespace-nowrap">
            {l}
          </span>
        ))}
        {shortProbeLabels.map((l, i) => (
          <span key={`s${i}`} data-probe="short" className="whitespace-nowrap">
            {l}
          </span>
        ))}
      </div>
    </section>
  )
}
