"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { NFL_TEAMS, LEAGUE_SIZE, type NflTeam } from "@/lib/nfl-teams"
import { IPhoneStatusBar } from "@/components/iphone-status-bar"

/**
 * Spinner Explorations
 * ====================
 * A lab for the "how do we show randomization without a casino" question.
 *
 * Three constraints drive the whole design:
 *
 * 1. The set is DYNAMIC. A draw may open with all 32 teams and shrink to 2.
 *    Nothing here may assume a fixed count: the column count, the tile label
 *    (full name vs abbreviation) and the run length are all derived from the
 *    live set size. See `gridFor` and `tickCountFor`.
 *
 * 2. No drum, reel, wheel, or slot machine. Every treatment communicates
 *    "something random is happening" through lightweight motion only —
 *    cycling, shuffling, sweeping, eliminating, pulsing.
 *
 * 3. It must RESOLVE unambiguously. The winner is chosen up front and the
 *    entire animation is precomputed as a `Frame[]` schedule whose final frame
 *    is the winner by construction. That's deliberate: a per-tick "maybe stop
 *    now" random walk can drift and land on the wrong tile, which is the classic
 *    way these prototypes lose credibility.
 */

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------

const TREATMENTS = [
  {
    id: "cycle",
    name: "Vertical cycling",
    blurb: "One focus slot, names cycling upward and decelerating to a stop.",
    watch: "The set stays still; all the motion is in the slot.",
  },
  {
    id: "shuffle",
    name: "Shuffle / reorder",
    blurb: "Tiles physically trade places, then settle with the pick first.",
    watch: "Reads as handling a deck rather than spinning it.",
  },
  {
    id: "scan",
    name: "Cascading scan",
    blurb: "A travelling highlight sweeps the set and slows onto one tile.",
    watch: "Every option is visibly considered on the way past.",
  },
  {
    id: "eliminate",
    name: "Progressive elimination",
    blurb: "Options drop out in random order until a single one is left.",
    watch: "The grid reflows and tiles grow as the set shrinks.",
  },
  {
    id: "pulse",
    name: "Pulse / breathe",
    blurb: "Tiles pulse in random sequence; the rhythm slows and one holds.",
    watch: "Feels like activity, closest to a loading indicator.",
  },
] as const

type TreatmentId = (typeof TREATMENTS)[number]["id"]

// ---------------------------------------------------------------------------
// Schedule construction
// ---------------------------------------------------------------------------

/** One rendered step of a run. Fields are per-treatment and optional. */
type Frame = {
  /** Index into the pool that is currently in the focus slot. */
  focus: number
  /** Pool indices that have been knocked out (elimination). */
  eliminated?: number[]
  /** Pool indices in display order (shuffle). */
  order?: number[]
  /** Pool indices currently lit (pulse). */
  pulse?: number[]
  /**
   * Monotonically increasing step for vertical cycling. Using an absolute
   * counter rather than `focus` lets the strip translate continuously upward:
   * a modulo index would snap backwards every time it wrapped past the end.
   */
  absolute?: number
  /** Seconds this frame should take, so cycling motion is continuous. */
  dur?: number
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

function shuffle<T>(input: T[]): T[] {
  const a = [...input]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Tick interval in ms for a given progress through the run (0â†’1).
 *
 * The exponent keeps most of the slowdown in the last third, which is what
 * makes the landing feel decided instead of arbitrary. A linear ramp reads as
 * the animation simply running out of steam.
 */
function intervalAt(progress: number) {
  return 62 + 330 * Math.pow(Math.min(1, Math.max(0, progress)), 2.4)
}

/** How many steps a run gets. Scales with set size so 2 and 32 both feel right. */
function tickCountFor(treatment: TreatmentId, n: number) {
  switch (treatment) {
    case "cycle":
    case "scan":
      // At least 14 so a 2-team set still reads as a sweep rather than a blink,
      // capped so 32 teams don't drag.
      return Math.max(14, Math.min(n * 2, 34))
    case "shuffle":
      return Math.max(8, Math.min(4 + Math.round(n / 3), 14))
    case "pulse":
      return Math.max(10, Math.min(6 + Math.round(n / 2), 16))
    case "eliminate":
      // Driven by removals instead; see buildSchedule.
      return Math.max(1, Math.min(n - 1, 12))
  }
}

function buildSchedule(treatment: TreatmentId, n: number, winner: number): Frame[] {
  const total = tickCountFor(treatment, n)
  const frames: Frame[] = []
  const durFor = (i: number, t: number) => intervalAt((i + 1) / t) / 1000

  if (treatment === "cycle" || treatment === "scan") {
    // Walk sequentially and work backwards from the winner so the final step
    // lands on it exactly, with no correction jump at the end.
    const start = (((winner - (total - 1)) % n) + n * total) % n
    for (let i = 0; i < total; i++) {
      frames.push({
        focus: (start + i) % n,
        absolute: start + i,
        dur: durFor(i, total),
      })
    }
    return frames
  }

  if (treatment === "shuffle") {
    for (let i = 0; i < total; i++) {
      const last = i === total - 1
      // Final order puts the winner first so the resolution has a stable,
      // predictable home rather than wherever the last shuffle happened to
      // drop it.
      const order = last ? [winner, ...shuffle(range(n).filter((x) => x !== winner))] : shuffle(range(n))
      frames.push({ focus: last ? winner : order[0], order, dur: durFor(i, total) })
    }
    return frames
  }

  if (treatment === "pulse") {
    for (let i = 0; i < total; i++) {
      const last = i === total - 1
      const progress = total === 1 ? 1 : i / (total - 1)
      // Lit count decays toward a single held tile.
      const count = Math.max(1, Math.round(n * 0.55 * (1 - progress)))
      const lit = last ? [winner] : shuffle(range(n)).slice(0, count)
      frames.push({ focus: last ? winner : lit[0], pulse: lit, dur: durFor(i, total) })
    }
    return frames
  }

  // Progressive elimination.
  const losers = shuffle(range(n).filter((i) => i !== winner))
  const removalTicks = Math.max(1, Math.min(losers.length, 12))
  // With few losers the run would be over in one step, so pad the front with
  // "considering" frames. This is why a 2-team elimination still reads as a
  // decision rather than an instant cut.
  const preamble = Math.max(0, 6 - removalTicks)
  const totalTicks = preamble + removalTicks

  for (let p = 0; p < preamble; p++) {
    const survivors = range(n)
    frames.push({
      focus: survivors[Math.floor(Math.random() * survivors.length)],
      eliminated: [],
      dur: durFor(p, totalTicks),
    })
  }

  for (let t = 0; t < removalTicks; t++) {
    // Even distribution guarantees the last tick consumes every loser.
    const upto = Math.round(((t + 1) / removalTicks) * losers.length)
    const gone = losers.slice(0, upto)
    const survivors = range(n).filter((i) => !gone.includes(i))
    frames.push({
      focus: survivors[Math.floor(Math.random() * survivors.length)],
      eliminated: gone,
      dur: durFor(preamble + t, totalTicks),
    })
  }

  // Belt and braces: the last frame is the winner alone, whatever the maths did.
  frames[frames.length - 1] = {
    ...frames[frames.length - 1],
    focus: winner,
    eliminated: losers,
  }
  return frames
}

// ---------------------------------------------------------------------------
// Size-adaptive layout
// ---------------------------------------------------------------------------

/**
 * Columns and label detail for a given count. This is the core of requirement
 * #1: the same component shows 2 big named tiles or 32 dense abbreviations
 * without any per-treatment special casing.
 */
/** Widest a single tile is allowed to get, in px, at small set sizes. */
const TILE_MAX = 150

function gridFor(n: number): { cols: number; label: "full" | "name" | "abbrev" } {
  // A single option needs its own case. Without it `gridFor(1)` fell into the
  // `n <= 4` branch and returned 2 columns, so the last survivor of an
  // elimination run sat in column 1 — visibly off-centre, as though the layout
  // had broken rather than resolved.
  if (n <= 1) return { cols: 1, label: "full" }
  if (n <= 4) return { cols: 2, label: "full" }
  if (n <= 6) return { cols: 2, label: "name" }
  if (n <= 9) return { cols: 3, label: "name" }
  if (n <= 16) return { cols: 4, label: "abbrev" }
  if (n <= 25) return { cols: 5, label: "abbrev" }
  return { cols: 6, label: "abbrev" }
}

const FOCUS_ITEM_H = 68

// ---------------------------------------------------------------------------
// Tile
// ---------------------------------------------------------------------------

function Tile({
  team,
  label,
  state,
}: {
  team: NflTeam
  label: "full" | "name" | "abbrev"
  /** Visual state drives opacity/scale only, so colour stays the team's own. */
  state: "idle" | "focused" | "lit" | "dimmed" | "won"
}) {
  const dim = state === "dimmed"
  return (
    // No `layout` here: the parent wrapper owns position animation. Declaring
    // it on both makes two layout animations fight over the same element.
    <motion.div
      animate={{
        opacity: dim ? 0.22 : 1,
        scale: state === "focused" || state === "won" ? 1.06 : state === "lit" ? 1.03 : 1,
        filter: dim ? "saturate(0.15)" : "saturate(1)",
      }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="flex min-w-0 flex-col items-center justify-center rounded-xl px-1 text-center"
      style={{
        aspectRatio: "1 / 1",
        backgroundColor: team.color,
        boxShadow:
          state === "won"
            ? "0 0 0 3px #fbbf24, 0 8px 24px rgba(0,0,0,0.45)"
            : state === "focused"
            ? "0 0 0 2px rgba(255,255,255,0.85)"
            : state === "lit"
            ? `0 0 0 2px ${team.secondary}`
            : "inset 0 0 0 1px rgba(255,255,255,0.10)",
      }}
    >
      {label === "abbrev" ? (
        <span className="text-[13px] font-bold leading-none text-white">{team.abbrev}</span>
      ) : (
        <>
          {label === "full" && (
            <span className="w-full truncate text-[11px] font-medium leading-tight text-white/70">{team.city}</span>
          )}
          <span className="w-full truncate text-[15px] font-bold leading-tight text-white">{team.name}</span>
        </>
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Focus slot
// ---------------------------------------------------------------------------

/**
 * The shared "what is being looked at right now" readout. For vertical cycling
 * it is a translating strip; for everything else it swaps content in place.
 */
function FocusSlot({
  pool,
  frame,
  treatment,
  phase,
  runId,
}: {
  pool: NflTeam[]
  frame: Frame
  treatment: TreatmentId
  phase: "idle" | "running" | "resolved"
  runId: number
}) {
  const team = pool[frame.focus] ?? pool[0]
  const resolved = phase === "resolved"

  // At rest the slot must not name a team. Showing `pool[0]` here read as
  // "the Bills are already picked" while the header still said "Ready to pick" —
  // the slot claimed a result the randomizer hadn't produced.
  if (phase === "idle") {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02]"
        style={{ height: FOCUS_ITEM_H }}
      >
        <span className="text-[15px] text-white/30">No team picked yet</span>
      </div>
    )
  }

  if (treatment === "cycle") {
    const absolute = frame.absolute ?? frame.focus
    // Enough repeats to cover the highest absolute step this run can reach.
    const copies = Math.ceil((absolute + 2) / pool.length) + 1
    const strip = Array.from({ length: copies }, () => pool).flat()

    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]" style={{ height: FOCUS_ITEM_H }}>
        <motion.div
          animate={{ y: -absolute * FOCUS_ITEM_H }}
          transition={{ duration: phase === "running" ? (frame.dur ?? 0.12) : 0.3, ease: "linear" }}
        >
          {strip.map((t, i) => (
            <div
              key={`${t.abbrev}-${i}`}
              className="flex items-center justify-center gap-2"
              style={{ height: FOCUS_ITEM_H }}
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} aria-hidden="true" />
              <span className="text-[22px] font-bold text-white">{t.name}</span>
            </div>
          ))}
        </motion.div>
        {/* Edge fades sell the strip as continuous rather than a list of rows. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-zinc-950 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
      style={{ height: FOCUS_ITEM_H }}
    >
      {/* Keyed remount animates each change with no AnimatePresence exit to
          queue up — at 62ms ticks, exit animations pile into visible jank. */}
      <motion.div
        key={`${frame.focus}-${runId}-${resolved}`}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        className="flex items-center gap-2"
      >
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} aria-hidden="true" />
        <span className="text-[22px] font-bold text-white">{team.name}</span>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Set view
// ---------------------------------------------------------------------------

function SetView({
  pool,
  frame,
  treatment,
  phase,
  winner,
}: {
  pool: NflTeam[]
  frame: Frame
  treatment: TreatmentId
  phase: "idle" | "running" | "resolved"
  winner: number | null
}) {
  const eliminated = frame.eliminated ?? []
  const lit = frame.pulse ?? []

  // Elimination is the one treatment where the set genuinely shrinks, so the
  // grid is sized to the SURVIVORS. That's what makes tiles grow as the draw
  // narrows, instead of leaving a field of dead squares.
  const survivors = useMemo(
    () => range(pool.length).filter((i) => !eliminated.includes(i)),
    [pool.length, eliminated],
  )
  const visible = treatment === "eliminate" ? survivors : (frame.order ?? range(pool.length))
  const { cols, label } = gridFor(treatment === "eliminate" ? survivors.length : pool.length)

  const stateFor = (idx: number): "idle" | "focused" | "lit" | "dimmed" | "won" => {
    if (phase === "resolved") return idx === winner ? "won" : "dimmed"
    if (phase === "idle") return "idle"
    if (treatment === "eliminate") return eliminated.includes(idx) ? "dimmed" : "idle"
    if (treatment === "pulse") return lit.includes(idx) ? "lit" : "dimmed"
    if (treatment === "scan") return idx === frame.focus ? "focused" : "idle"
    if (treatment === "shuffle") return "idle"
    // Vertical cycling deliberately leaves the set quiet.
    return "idle"
  }

  return (
    <div
      className="mx-auto grid w-full gap-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        // Cap the track width so small sets don't inflate. With a plain
        // `w-full` grid, one surviving tile stretched to the full 360px and
        // read as a full-bleed slab rather than a selected option. Above ~3
        // columns this is wider than the phone, so `w-full` still governs.
        maxWidth: cols * TILE_MAX + (cols - 1) * 8,
      }}
    >
      <AnimatePresence initial={false}>
        {visible.map((idx) => (
          <motion.div
            key={pool[idx].abbrev}
            layout
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.28 } }}
          >
            <Tile team={pool[idx]} label={label} state={stateFor(idx)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Zone
// ---------------------------------------------------------------------------

const PRESETS = [32, 16, 8, 4, 2]

export function SpinnerExplorationsZone() {
  const [treatment, setTreatment] = useState<TreatmentId>("cycle")
  const [size, setSize] = useState(LEAGUE_SIZE)
  const [phase, setPhase] = useState<"idle" | "running" | "resolved">("idle")
  const [runId, setRunId] = useState(0)
  const [winner, setWinner] = useState<number | null>(null)
  const [frame, setFrame] = useState<Frame>({ focus: 0, eliminated: [], pulse: [] })

  const pool = useMemo(() => NFL_TEAMS.slice(0, size), [size])
  const active = TREATMENTS.find((t) => t.id === treatment)!

  // A winner from a 32-team run is meaningless once the set is 4, so any change
  // to the set or the treatment resets to idle rather than leaving a stale pick.
  useEffect(() => {
    setPhase("idle")
    setWinner(null)
    setFrame({ focus: 0, eliminated: [], pulse: [] })
  }, [size, treatment])

  const start = useCallback(() => {
    setWinner(Math.floor(Math.random() * size))
    setRunId((r) => r + 1)
    setPhase("running")
  }, [size])

  // Runs only when runId changes. The closure still sees the winner/treatment/
  // size from the render that incremented it, because those setStates batch
  // into the same commit.
  useEffect(() => {
    if (runId === 0 || winner === null) return
    const schedule = buildSchedule(treatment, size, winner)
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let i = 0

    const step = () => {
      if (cancelled) return
      setFrame(schedule[i])
      i += 1
      if (i >= schedule.length) {
        setPhase("resolved")
        return
      }
      timer = setTimeout(step, intervalAt(i / schedule.length))
    }
    step()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  const remaining =
    treatment === "eliminate" && phase !== "idle"
      ? pool.length - (frame.eliminated?.length ?? 0)
      : pool.length

  const winnerTeam = winner !== null ? pool[winner] : null

  return (
    <div className="min-h-screen w-full bg-zinc-950 px-6 py-6">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-start justify-center gap-6">
        {/* ---------------- Treatment picker ---------------- */}
        <section className="w-[280px] shrink-0 rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Motion treatment</h2>
          <div className="mt-3 flex flex-col gap-2">
            {TREATMENTS.map((t) => {
              const on = t.id === treatment
              return (
                <button
                  key={t.id}
                  onClick={() => setTreatment(t.id)}
                  aria-pressed={on}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    on
                      ? "border-amber-400/70 bg-amber-400/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                  }`}
                >
                  <span className={`block text-sm font-semibold ${on ? "text-amber-300" : "text-white"}`}>
                    {t.name}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-white/55">{t.blurb}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed text-white/45">
            None of these use a drum, reel, or wheel. Each one has to stay legible from 32 options down to 2.
          </p>
        </section>

        {/* ---------------- Phone ---------------- */}
        <div className="relative shrink-0 rounded-[3.3rem] bg-[#0f0f11] p-3 ring-1 ring-inset ring-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.75)]">
          <div aria-hidden="true" className="absolute -left-[3px] top-[112px] h-8 w-[3px] rounded-l-sm bg-zinc-800" />
          <div aria-hidden="true" className="absolute -left-[3px] top-[168px] h-14 w-[3px] rounded-l-sm bg-zinc-800" />
          <div aria-hidden="true" className="absolute -left-[3px] top-[240px] h-14 w-[3px] rounded-l-sm bg-zinc-800" />
          <div aria-hidden="true" className="absolute -right-[3px] top-[196px] h-20 w-[3px] rounded-r-sm bg-zinc-800" />

          <div className="relative h-[860px] w-[400px] overflow-hidden rounded-[2.6rem] bg-zinc-950">
            <IPhoneStatusBar />

            <div className="flex h-full flex-col px-5 pb-6 pt-[62px]">
              {/* Header */}
              <header className="shrink-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Random team draw</p>
                <h1 className="mt-1 text-[26px] font-bold leading-tight text-white">
                  {phase === "resolved" ? "Your team" : phase === "running" ? "Picking a team" : "Ready to pick"}
                </h1>
                <p className="mt-1 text-sm text-white/55">
                  {phase === "resolved"
                    ? "One team from the remaining pool."
                    : `${remaining} ${remaining === 1 ? "team" : "teams"} in the running`}
                </p>
              </header>

              {/* Set view */}
              <div className="mt-5 flex flex-1 items-center justify-center overflow-hidden">
                <SetView pool={pool} frame={frame} treatment={treatment} phase={phase} winner={winner} />
              </div>

              {/* Focus slot */}
              <div className="mt-5 shrink-0">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                  {phase === "resolved" ? "Selected" : "Now considering"}
                </p>
                <FocusSlot pool={pool} frame={frame} treatment={treatment} phase={phase} runId={runId} />
              </div>

              {/* Result / status */}
              <div className="mt-4 shrink-0" aria-live="polite">
                {phase === "resolved" && winnerTeam ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3"
                  >
                    <p className="text-sm text-white/70">
                      Selected from {pool.length} {pool.length === 1 ? "team" : "teams"}
                    </p>
                    <p className="text-[19px] font-bold text-white">
                      {winnerTeam.city} {winnerTeam.name}
                    </p>
                  </motion.div>
                ) : (
                  <p className="text-sm text-white/40">
                    {phase === "running" ? "Randomizing…" : "Use the controls to start a draw."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Randomizer controls ---------------- */}
        <section className="w-[280px] shrink-0 rounded-2xl border border-white/10 bg-zinc-900/80 p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Randomizer</h2>

          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <label htmlFor="set-size" className="text-sm font-medium text-white">
                Teams left
              </label>
              <span className="text-2xl font-bold tabular-nums text-amber-300">{size}</span>
            </div>
            <input
              id="set-size"
              type="range"
              min={2}
              max={LEAGUE_SIZE}
              step={1}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="mt-2 w-full accent-amber-400"
            />
            <div className="mt-1 flex justify-between text-[11px] text-white/40">
              <span>2</span>
              <span>{LEAGUE_SIZE}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setSize(p)}
                aria-pressed={size === p}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  size === p ? "bg-amber-400 text-zinc-950" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.12]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={start}
            disabled={phase === "running"}
            className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
              phase === "running"
                ? "cursor-not-allowed bg-white/10 text-white/40"
                : "bg-amber-400 text-zinc-950 hover:bg-amber-300"
            }`}
          >
            {phase === "running" ? "Randomizing…" : phase === "resolved" ? "Run again" : "Start randomizer"}
          </button>

          <div className="mt-4 border-t border-white/10 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">What to watch</p>
            <p className="mt-1 text-xs leading-relaxed text-white/55">{active.watch}</p>
          </div>

          <div className="mt-3 rounded-xl bg-white/[0.03] p-3">
            <p className="text-[11px] leading-relaxed text-white/45">
              Layout adapts on its own: {gridFor(size).cols} columns at {size}, showing{" "}
              {gridFor(size).label === "abbrev" ? "abbreviations" : "team names"}. Run length scales too, so a 2-team
              draw doesn&apos;t finish in a blink.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
