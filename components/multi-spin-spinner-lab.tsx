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
      "The drum spins at the normal 255px width; on landing the pill animates out to the full 343px card interior. Buys ~88px of extra room at the exact moment it is needed, and only lightly scales type if the name still overruns.",
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

/**
 * Marquee that scrolls only when its content overflows: eases across, pauses,
 * then returns. Used for the landed centre row.
 */
function RowMarquee({ text, width }: { text: string; width: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(0)

  useLayoutEffect(() => {
    const c = containerRef.current
    const t = trackRef.current
    if (!c || !t) return
    setOverflow(Math.max(0, t.scrollWidth - c.clientWidth))
  }, [text, width])

  return (
    <div ref={containerRef} className="overflow-hidden" style={{ width }}>
      <motion.span
        ref={trackRef}
        className="inline-block whitespace-nowrap"
        animate={overflow > 0 ? { x: [0, -overflow, -overflow, 0, 0] } : { x: 0 }}
        transition={
          overflow > 0
            ? {
                duration: 5 + overflow / 40,
                times: [0, 0.42, 0.56, 0.96, 1],
                repeat: Infinity,
                ease: "linear",
              }
            : undefined
        }
      >
        {text}
      </motion.span>
    </div>
  )
}

export function MultiSpinSpinnerLab({ data }: { data: DataMode }) {
  const [treatment, setTreatment] = useState<SpinTreatment>("shrink")
  const [pos, setPos] = useState(0)
  const [phase, setPhase] = useState<"idle" | "spinning" | "landed">("idle")

  const rafRef = useRef<number | null>(null)
  const posRef = useRef(0)

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
  const wideAvail = innerFor(CARD_INNER_W)

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
  /** Gentler scale used once a broken-out pill has the full card width. */
  const wideScales = useMemo(
    () => widths.map((w) => (w > 0 ? clamp(wideAvail / w, 0.7, 1) : 1)),
    [widths, wideAvail],
  )

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

  /** Whether any name still overruns even at the full card width. */
  const overrunsAtFullWidth = useMemo(
    () => widths.some((w) => w > wideAvail),
    [widths, wideAvail],
  )

  const centreIdx = mod(Math.round(pos), POOL.length)
  const landedSpot = POOL[centreIdx]

  const spin = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    const start = posRef.current
    const laps = 4
    const stepsToTarget = 1 + Math.floor(Math.random() * POOL.length)
    const end = Math.round(start) + laps * POOL.length + stepsToTarget
    const duration = 3200
    const t0 = performance.now()

    setPhase("spinning")

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
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  // Stop any in-flight spin on unmount.
  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    },
    [],
  )

  // Changing the scenario resets the drum so each treatment starts comparable.
  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    posRef.current = 0
    setPos(0)
    setPhase("idle")
  }, [treatment, data])

  const stepDeg = (pitch / radius) * (180 / Math.PI)
  const spinning = phase === "spinning"
  const landed = phase === "landed"

  /* Pill geometry. Only the breakout treatment changes it, and only at rest. */
  const pillW = treatment === "breakout" && landed ? CARD_INNER_W : PILL_W

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

      {/* The randomizer box */}
      <div className="w-full max-w-[375px] rounded-2xl bg-[#212121] p-4 text-white">
        <p className="truncate text-sm leading-tight">
          Random Break #15
          <span className="text-white/60">
            {" — 2025 Panini Luminance Football Hobby PYT Box Break #903"}
          </span>
        </p>
        <p className="mt-1 text-xs text-white/50">
          {spinning ? "Spinning…" : landed ? "Landed" : "Ready to spin"}
        </p>

        <hr className="my-3 border-0" style={{ height: 0, borderTop: "1px solid #363636" }} />

        {/* Drum */}
        <div
          className="relative w-full overflow-hidden rounded-md"
          style={{ height: DRUM_H, backgroundColor: "transparent", perspective: 420 }}
        >
          {/* Centre selection pill */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: pillW,
              height: itemH - 4,
              marginLeft: -pillW / 2,
              marginTop: -(itemH - 4) / 2,
              backgroundColor: PILL_IDLE,
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
            else if (treatment === "breakout" && landed && isCentre)
              scale = wideScales[poolIdx] ?? 1
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
                  opacity: 1 - fade * 0.82,
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
                ) : treatment === "marquee" && isCentre && landed ? (
                  /* Only the settled row scrolls; a moving reel must not. */
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
                      transition:
                        treatment === "breakout" || treatment === "abbrevReveal"
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
        </div>

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

        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className="mt-3 w-full rounded-full bg-[#3665F3] py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {spinning ? "Spinning…" : "Spin"}
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
        {treatment === "breakout" && overrunsAtFullWidth && (
          <p>Some names still overrun the {CARD_INNER_W}px card, so type scales slightly on landing.</p>
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
