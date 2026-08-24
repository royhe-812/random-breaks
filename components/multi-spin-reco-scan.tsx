"use client"

/* ── Recommendation: Scan ──
   Second attempt. The first (Spotlight) put a short colour-coded token per spot
   in a grid and resolved the full name in a separate readout. Three assumptions
   in that design do not survive real break data:

     1. It needed a short code per spot. Player names have no reliable short
        form and initials collide.
     2. It coloured tokens by team. A player spot has no team, and a trade
        invalidates any colour that was derived from one.
     3. Token + separate readout implied a mapping — "SF" above
        "Christian McCaffrey · ..." asserts those players are on that team,
        which is exactly the claim that goes stale mid-season.

   So this version derives NOTHING. A spot is an ordered list of literal entries
   and its number is the only stable handle. One surface: the row IS the result,
   rendered verbatim at full size, wrapping as far as it needs to. Motion comes
   from the selection travelling down the list and the list scrolling under it,
   which is the reel feeling without putting text on a cylinder. */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { makeBreak, spotLabel, type RosterSpot } from "@/lib/multi-spin-data"

/** Live card width, matching the drum lab so the two compare fairly. */
const CARD_W = 375
/** Scroll viewport height. Deliberately small — this has to fit the live card. */
const VIEWPORT_H = 212
/** Number of hops before landing. */
const HOPS = 30
/** Interval between the first (fastest) hops. */
const FAST_MS = 52
/** Interval at the final hop — slow enough to read a three-name spot. */
const SLOW_MS = 440
/** Deceleration exponent. Higher = holds fast longer, then drops off hard. */
const EASE = 3.2

function hopDelay(i: number) {
  const t = Math.min(1, Math.max(0, i / HOPS))
  return FAST_MS + (SLOW_MS - FAST_MS) * Math.pow(t, EASE)
}

/** "3 players", "1 team", "1 team · 1 player" — counted, never derived. */
function composition(spot: RosterSpot) {
  const teams = spot.entries.filter((e) => e.kind === "team").length
  const players = spot.entries.length - teams
  const parts: string[] = []
  if (teams) parts.push(`${teams} team${teams > 1 ? "s" : ""}`)
  if (players) parts.push(`${players} player${players > 1 ? "s" : ""}`)
  return parts.join(" · ")
}

type Phase = "idle" | "running" | "landed"

export function MultiSpinRecoScan() {
  const [count, setCount] = useState(12)
  const [phase, setPhase] = useState<Phase>("idle")
  const [activeIdx, setActiveIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLLIElement | null)[]>([])

  const spots = useMemo(() => makeBreak(count), [count])
  const activeSpot = spots[activeIdx] ?? spots[0]
  const landed = phase === "landed"

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])

  useEffect(() => stop, [stop])

  /* Changing the break size invalidates the in-flight pick and any landed
     result, since both point at indices in the previous list. */
  useEffect(() => {
    stop()
    setPhase("idle")
    setActiveIdx(0)
  }, [count, stop])

  /* Keep the highlighted row centred. Rows are variable height, so this reads
     each row's real offset rather than assuming a fixed row pitch. Positioning
     is instant: at 52ms hops a smooth scroll would lag behind the highlight. */
  useLayoutEffect(() => {
    const vp = viewportRef.current
    const row = rowRefs.current[activeIdx]
    if (!vp || !row) return
    vp.scrollTop = row.offsetTop - (vp.clientHeight - row.offsetHeight) / 2
  }, [activeIdx, count])

  const run = useCallback(() => {
    stop()
    const n = spots.length
    const target = Math.floor(Math.random() * n)

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    if (reduced) {
      setActiveIdx(target)
      setPhase("landed")
      return
    }

    /* Travel sequentially and wrap so hop HOPS lands exactly on target. */
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
  }, [spots, stop])

  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">Recommendation — Scan</h2>
          <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            Recommended
          </span>
        </div>
        <p className="text-xs leading-relaxed text-white/50">
          A spot is a list of literal names and a number. Nothing is abbreviated, coloured by
          team, or looked up — so trades, mixed team/player spots, and any name length are all
          just text.
        </p>
      </header>

      {/* Break size is a property of this section only: it is proving the layout
          holds at 32, which the shared Content toggle has no opinion about. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide text-white/40">Break size</span>
        <div className="flex gap-1 rounded-full bg-zinc-800 p-1">
          {[12, 32].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCount(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                count === c ? "bg-white text-zinc-900" : "text-white/60 hover:text-white"
              }`}
            >
              {c} spots
            </button>
          ))}
        </div>
      </div>

      <div
        className="overflow-hidden rounded-2xl"
        style={{ width: CARD_W, background: "#212121" }}
      >
        <div className="flex flex-col gap-3 p-4">
          <div
            ref={viewportRef}
            className="relative overflow-y-auto rounded-xl"
            style={{ height: VIEWPORT_H, background: "#1A1A1A" }}
          >
            {/* Half-viewport padding top and bottom. Without it the centring
                target for the first and last rows falls outside the scroll
                range, the browser clamps it, and those spots can only ever
                appear jammed against the edge — which reads as a clipped
                highlight rather than a landed winner. */}
            <ul
              className="relative flex flex-col gap-1 px-1.5"
              style={{ paddingTop: VIEWPORT_H / 2, paddingBottom: VIEWPORT_H / 2 }}
            >
              {spots.map((spot, i) => {
                const isActive = i === activeIdx
                const isWinner = isActive && landed
                return (
                  <li
                    key={spot.n}
                    ref={(el) => {
                      rowRefs.current[i] = el
                    }}
                    className="flex items-start gap-2.5 rounded-lg px-2.5 py-2"
                    style={{
                      background: isWinner ? "#FFFFFF" : isActive ? "#3A3A3A" : "transparent",
                      /* Dim the field once a winner exists so the result reads
                         first, but keep it present — it is the proof of fairness. */
                      opacity: landed && !isWinner ? 0.35 : 1,
                      transition: "background 140ms ease-out, opacity 220ms ease-out",
                    }}
                  >
                    {/* The number is the durable identity: it is what a buyer
                        owns, and it is unaffected by relabelling or trades. */}
                    <span
                      className="mt-px flex-shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                      style={{
                        background: isWinner ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
                        color: isWinner ? "#111111" : "rgba(255,255,255,0.55)",
                      }}
                    >
                      {String(spot.n).padStart(2, "0")}
                    </span>

                    <span className="flex min-w-0 flex-col gap-0.5">
                      {/* One line per entry: never joined into a single string,
                          so a multi-entry spot cannot read as one long name and
                          nothing implies the entries belong to each other. */}
                      {spot.entries.map((e) => (
                        <span
                          key={e.name}
                          className="text-[15px] font-semibold leading-snug text-pretty"
                          style={{ color: isWinner ? "#111111" : "rgba(255,255,255,0.92)" }}
                        >
                          {e.name}
                        </span>
                      ))}
                      <span
                        className="text-[10px] uppercase tracking-wide"
                        style={{ color: isWinner ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.35)" }}
                      >
                        {composition(spot)}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <p className="sr-only" role="status">
            {landed ? `Winner: spot ${activeSpot.n}, ${spotLabel(activeSpot)}` : ""}
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
        <p>
          <span className="text-white">Length stops being a layout problem.</span> Each row is
          ordinary wrapping text at <span className="text-white">15px</span> — no cylinder, no
          magnification, no fixed row height. A three-player spot takes three lines instead of
          shrinking to fit a pill.
        </p>
        <p>
          <span className="text-white">It survives trades.</span> Entries are rendered verbatim
          and a spot&apos;s number never changes, so nothing is derived from a roster that can
          go stale. Mixed spots — a team and a player together — are just two lines.
        </p>
        <p>
          <span className="text-white">Tradeoff, honestly.</span> You only see about three spots
          at a time, so this gives up the &quot;whole field visible&quot; claim I made for the
          token grid; at {count} spots the scroll is the motion. It also drops the slot-machine
          shape, so the tension rests entirely on the hop cadence slowing down.
        </p>
      </div>
    </section>
  )
}
