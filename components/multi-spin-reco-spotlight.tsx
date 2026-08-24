"use client"

/* ── Recommendation: Spotlight ──
   The drum forces every candidate to be a fixed-height, fixed-width single line
   riding a magnified cylinder, so a long name can only be paid for in type size,
   time, or truncation. This treatment decouples motion from text: the names hold
   still and the SELECTION travels across them.

   Two surfaces, each doing one job:
     - Field  : every candidate, always visible, as a short colour-coded token.
                Carries fairness ("here is the whole field") and motion.
     - Readout: one full-width line that holds the highlighted candidate's
                complete name, wrapping freely at full size. Carries legibility.

   Because the readout is a normal, static, full-width block, name length stops
   being a layout problem entirely — no magnification, no fixed row height, no
   truncation, no marquee, at any length. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { POOL, fullLabel, type DataMode } from "@/lib/multi-spin-data"

/** Live card width, matching the drum lab so the two compare fairly. */
const CARD_W = 375
/** Number of hops before landing. Enough travel to read as a shuffle. */
const HOPS = 34
/** Interval between the first (fastest) hops. */
const FAST_MS = 55
/** Interval at the final hop — slow enough to read the readout. */
const SLOW_MS = 430
/** Deceleration exponent. Higher = holds fast longer, then drops off hard. */
const EASE = 3.2

/** Interval before hop `i` of `HOPS`, easing from FAST_MS out to SLOW_MS. */
function hopDelay(i: number) {
  const t = Math.min(1, Math.max(0, i / HOPS))
  return FAST_MS + (SLOW_MS - FAST_MS) * Math.pow(t, EASE)
}

type Phase = "idle" | "running" | "landed"

export function MultiSpinRecoSpotlight({ data }: { data: DataMode }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [activeIdx, setActiveIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Clear any in-flight hop on unmount so a timer can't fire into a dead tree. */
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const run = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)

    const n = POOL.length
    const target = Math.floor(Math.random() * n)

    /* Respect reduced motion: the hop sequence is the whole animation, so there
       is nothing to soften — go straight to the outcome. */
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    if (reduced) {
      setActiveIdx(target)
      setPhase("landed")
      return
    }

    /* Travel sequentially and wrap, so that hop HOPS lands exactly on target.
       Sequential movement is what reads as "travelling" rather than flickering. */
    const start = ((target - HOPS) % n + n) % n

    setPhase("running")
    setActiveIdx(start)

    let i = 1
    const step = () => {
      setActiveIdx((start + i) % n)
      if (i >= HOPS) {
        setPhase("landed")
        return
      }
      i += 1
      timer.current = setTimeout(step, hopDelay(i))
    }
    timer.current = setTimeout(step, hopDelay(1))
  }, [])

  const activeSpot = POOL[activeIdx]
  const label = useMemo(() => fullLabel(activeSpot, data), [activeSpot, data])
  const landed = phase === "landed"

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">Recommendation — Spotlight</h2>
          <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            Recommended
          </span>
        </div>
        <p className="text-xs leading-relaxed text-white/50">
          Names hold still; the selection travels. Length stops being a layout problem because
          the winning name is rendered in a normal full-width block, not on a moving cylinder.
        </p>
      </header>

      <div
        className="overflow-hidden rounded-2xl"
        style={{ width: CARD_W, background: "#212121" }}
      >
        <div className="flex flex-col gap-3 p-4">
          {/* ── Field: the whole candidate set, always visible ── */}
          <div className="grid grid-cols-5 gap-1.5" role="list" aria-label="Candidate spots">
            {POOL.map((spot, i) => {
              const isActive = i === activeIdx
              return (
                <motion.div
                  key={spot.abbrev}
                  role="listitem"
                  animate={{ scale: isActive ? 1.06 : 1 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="flex items-center justify-center rounded-lg py-2 text-[11px] font-bold tabular-nums"
                  style={{
                    background: isActive ? spot.color : "#2E2E2E",
                    color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                    boxShadow:
                      isActive && landed ? "0 0 0 2px rgba(255,255,255,0.9)" : "none",
                  }}
                >
                  {spot.abbrev}
                </motion.div>
              )
            })}
          </div>

          {/* ── Readout: full name, full width, wraps freely, never truncates ── */}
          <div
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
            style={{
              background: landed ? "#FFFFFF" : "#2E2E2E",
              minHeight: 56,
              transition: "background 220ms ease-out",
            }}
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ background: activeSpot.color }}
            />
            <span
              className="text-[15px] font-semibold leading-snug text-pretty"
              style={{ color: landed ? "#111111" : "rgba(255,255,255,0.92)" }}
            >
              {label}
            </span>
          </div>

          {/* Announce only the settled result, so the hop sequence doesn't
              flood a screen reader with 34 interim names. */}
          <p className="sr-only" role="status">
            {landed ? `Winner: ${label}` : ""}
          </p>

          <button
            type="button"
            onClick={run}
            disabled={phase === "running"}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-opacity disabled:opacity-40"
          >
            {phase === "running" ? "Picking…" : landed ? "Pick again" : "Pick"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/60">
        {/* The rival figure lives in the drum section's read-out and changes with
            the content mode, so only make the comparison where it is true. Team
            names fit the pill comfortably; rosters are what break it. */}
        {data === "players" ? (
          <p>
            <span className="text-white">Why this over the drum.</span> The readout is a static
            block, so the winning name renders at full{" "}
            <span className="text-white">15px</span> and wraps — versus the shrunken figure the
            drum above reports to fit that same roster in its pill. It also holds at any length:
            a fourth player or a longer roster just wraps.
          </p>
        ) : (
          <p>
            <span className="text-white">Why this over the drum.</span> At team names the drum is
            fine — they fit its pill. Switch Content to{" "}
            <span className="text-white">NFL players</span> to see the case this solves, where a
            roster has to shrink to fit the drum but simply wraps here.
          </p>
        )}
        <p>
          <span className="text-white">It reads as fairer.</span> The drum only ever shows 3 of{" "}
          {POOL.length} candidates, so the field is never visible. Here the whole field is on
          screen for the entire pick and you watch it land.
        </p>
        <p>
          <span className="text-white">Tradeoff.</span> It gives up slot-machine familiarity,
          and the tokens need a short code per spot. Suspense comes from the hop cadence
          decelerating rather than from the reel, so the last few hops carry the tension.
        </p>
      </div>
    </section>
  )
}
