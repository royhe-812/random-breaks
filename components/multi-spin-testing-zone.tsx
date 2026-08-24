"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { MultiSpinSpinnerLab } from "@/components/multi-spin-spinner-lab"
import {
  LANDED_SPOTS as SPOTS,
  abbreviatePlayer,
  type DataMode,
  type Spot,
} from "@/lib/multi-spin-data"

/* ── Multi Spin Testing Zone ──
   A focused sandbox for the chip/pill row at the bottom of the randomizer card
   in the MULTI-spin use case. The real card lists one pill per spot won; with
   NFL team names ("San Francisco 49ers") those stay short, but a break can
   instead list the star players on each spot — up to 3 per spot, and player
   names run long ("Christian McCaffrey, Brandon Aiyuk, George Kittle").

   This zone lets you toggle the pill CONTENT between team names and player names,
   and switch between three long-name TREATMENTS so they can be compared against
   the same card at the same width. It is deliberately self-contained and static
   (no spinning) — the point is the resting pill row, not the animation. */

type Treatment = "marquee" | "abbreviated" | "truncate"

const TREATMENTS: { id: Treatment; label: string; blurb: string }[] = [
  {
    id: "marquee",
    label: "Marquee",
    blurb: "Full names stay intact; the row eases back and forth so long names read over time.",
  },
  {
    id: "abbreviated",
    label: "Abbreviated",
    blurb: "Names shorten to first-initial + last name (teams to their code) so every pill fits.",
  },
  {
    id: "truncate",
    label: "Truncate + tap",
    blurb: "Each pill clips with an ellipsis at a fixed width. Tap a pill to expand the full name.",
  },
]

/** Label for a spot's pill given the current data + treatment. */
function spotLabel(spot: Spot, data: DataMode, treatment: Treatment) {
  if (data === "teams") {
    return treatment === "abbreviated" ? spot.abbrev : `${spot.city} ${spot.team}`
  }
  const names = treatment === "abbreviated" ? spot.players.map(abbreviatePlayer) : spot.players
  return names.join(", ")
}

/**
 * Marquee that scrolls only when its content overflows: eases right-to-left,
 * pauses, then back. Same profile the live multi-spin chip row uses.
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

/** A single bordered pill: team colour dot + label. */
function Pill({
  spot,
  label,
  mode,
  expanded,
  onToggle,
}: {
  spot: Spot
  label: string
  mode: "nowrap" | "truncate"
  expanded?: boolean
  onToggle?: () => void
}) {
  const inner = (
    <>
      <span
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: spot.color }}
        aria-hidden="true"
      />
      <span
        className={
          mode === "truncate"
            ? expanded
              ? "whitespace-normal"
              : "truncate max-w-[130px]"
            : "whitespace-nowrap"
        }
      >
        {label}
      </span>
    </>
  )

  const base =
    "inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.04] px-2.5 py-1 text-[12px] leading-tight text-white"

  if (mode === "truncate") {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`${base} max-w-full text-left transition-colors hover:border-white/40`}
      >
        {inner}
      </button>
    )
  }

  return <span className={`${base} flex-shrink-0`}>{inner}</span>
}

/** The randomizer card, restyled to the resting multi-spin state. */
function RandomizerCard({ data, treatment }: { data: DataMode; treatment: Treatment }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Reset expansion when the scenario changes so each treatment starts clean.
  useEffect(() => {
    setExpanded(new Set())
  }, [data, treatment])

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="w-full max-w-[375px] rounded-2xl bg-[#212121] p-4 text-white">
      {/* Title row — mirrors the bid box card. */}
      <p className="truncate text-sm leading-tight">
        Random Break #15
        <span className="text-white/60">
          {" — 2025 Panini Luminance Football Hobby PYT Box Break #903"}
        </span>
      </p>

      {/* Winner line — one buyer wins all spots. */}
      <p className="mt-1 truncate text-sm font-bold leading-tight">
        <span aria-hidden="true">{"🏆"}</span> Adam007
      </p>

      <hr className="my-3 border-0" style={{ height: 0, borderTop: "1px solid #363636" }} />

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">Won {SPOTS.length} spots</p>
        {treatment === "truncate" && (
          <p className="text-[11px] text-white/40">Tap a pill to expand</p>
        )}
      </div>

      {/* Pill row — the element under test. */}
      <div className="mt-2">
        {treatment === "marquee" && (
          <BackAndForthMarquee trackClassName="flex gap-2">
            {SPOTS.map((spot) => (
              <Pill key={spot.abbrev} spot={spot} label={spotLabel(spot, data, "marquee")} mode="nowrap" />
            ))}
          </BackAndForthMarquee>
        )}

        {treatment === "abbreviated" && (
          <div className="flex flex-wrap gap-2">
            {SPOTS.map((spot) => (
              <Pill
                key={spot.abbrev}
                spot={spot}
                label={spotLabel(spot, data, "abbreviated")}
                mode="nowrap"
              />
            ))}
          </div>
        )}

        {treatment === "truncate" && (
          <div className="flex flex-wrap gap-2">
            {SPOTS.map((spot) => (
              <Pill
                key={spot.abbrev}
                spot={spot}
                label={spotLabel(spot, data, "truncate")}
                mode="truncate"
                expanded={expanded.has(spot.abbrev)}
                onToggle={() => toggle(spot.abbrev)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Segmented control used for both toggles. */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (id: T) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-white/40">{label}</span>
      <div className="inline-flex rounded-full bg-zinc-800 p-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={value === opt.id}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              value === opt.id ? "bg-white text-zinc-900" : "text-white/70 hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MultiSpinTestingZone() {
  const [data, setData] = useState<DataMode>("players")
  const [treatment, setTreatment] = useState<Treatment>("marquee")

  const activeBlurb = TREATMENTS.find((t) => t.id === treatment)?.blurb ?? ""

  return (
    <div className="min-h-screen w-full bg-zinc-950 px-4 py-8 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-lg font-bold">Multi Spin Testing Zone</h1>
          <p className="text-sm text-white/50">
            Long-name treatments for the multi-spin randomizer, where a single spot can list up
            to three players. The Content toggle drives both sections below.
          </p>
        </header>

        <div className="flex flex-wrap gap-6">
          <Segmented
            label="Content"
            value={data}
            onChange={setData}
            options={[
              { id: "teams", label: "NFL teams" },
              { id: "players", label: "NFL players" },
            ]}
          />
          <Segmented
            label="Pill treatment"
            value={treatment}
            onChange={setTreatment}
            options={TREATMENTS.map((t) => ({ id: t.id, label: t.label }))}
          />
        </div>

        <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/60">
          {activeBlurb}
        </p>

        <RandomizerCard data={data} treatment={treatment} />

        <hr className="border-0" style={{ height: 0, borderTop: "1px solid rgba(255,255,255,0.1)" }} />

        {/* Second subject: the spinner itself, sharing the content toggle above. */}
        <MultiSpinSpinnerLab data={data} />
      </div>
    </div>
  )
}
