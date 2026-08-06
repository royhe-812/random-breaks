"use client"

/**
 * Shared-element transition tester: ties the spin and the reveal together.
 *
 * The story, in five beats:
 *   1. a compact spinner row cycles team names and lands on the winner
 *   2. it holds on the full "City Name" for a beat so viewers read it
 *   3. that same text lifts out of the row and flies to the centre of the phone,
 *      and *as it travels* the non-abbreviation letters collapse away so
 *      "DETROIT LIONS" compresses into "DET"
 *   4. the centre pill runs its staged stroke-and-fill reveal around the abbrev
 *   5. a "Claimed by @user" tag rises in — the team is gone from the spots
 *
 * The flight is a manual FLIP: the flying copy is a single element that lives in
 * an overlay for the whole trip, so it can own every letter. A `layoutId`
 * crossfade between two separate elements (row copy → centre copy) can't express
 * a per-letter collapse, because the two elements have different content.
 *
 * The overlay is portalled into the phone-frame element (passed as `frameRef`)
 * rather than rendered in the spinner slot, so "centre" means the centre of the
 * whole screen and the row keeps its natural place in the bottom stack.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion"
import { teams, type Team } from "@/components/team-spinner"
import { RevealPill, useRevealStage, type RevealTuning } from "@/components/pill-reveal"

/** Black or white foreground per WCAG relative luminance. */
function readableOn(hex: string) {
  const h = hex.replace("#", "")
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const r = lin(parseInt(h.slice(0, 2), 16) / 255)
  const g = lin(parseInt(h.slice(2, 4), 16) / 255)
  const b = lin(parseInt(h.slice(4, 6), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42 ? "#101820" : "#ffffff"
}

/**
 * The source-string indices to KEEP so the remaining glyphs spell the abbrev.
 *
 * Every NFL abbrev here is a subsequence of its uppercased "CITY NAME"
 * (KANSAS CITY → KC, DETROIT LIONS → DET, NEW YORK JETS → NYJ), so a greedy
 * left-to-right match always succeeds. Returns null if it somehow doesn't, so
 * the caller can fall back to a plain crossfade rather than dropping letters.
 */
function keptIndices(display: string, abbrev: string): Set<number> | null {
  const up = display.toUpperCase()
  const kept = new Set<number>()
  let a = 0
  for (let i = 0; i < up.length && a < abbrev.length; i++) {
    if (up[i] === abbrev[a]) {
      kept.add(i)
      a++
    }
  }
  return a === abbrev.length ? kept : null
}

/**
 * One glyph of the flying name. Kept glyphs hold their measured width for the
 * whole trip; collapsing glyphs shrink their width to 0 and fade, which pulls
 * the kept glyphs together into the abbreviation. Width (not scaleX) is what
 * makes the neighbours actually slide in rather than leave a gap.
 */
function Glyph({
  ch,
  keep,
  width,
  morph,
}: {
  ch: string
  keep: boolean
  width: number | undefined
  morph: ReturnType<typeof useMotionValue<number>>
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (keep || width == null) return
    const apply = (m: number) => {
      const el = ref.current
      if (!el) return
      el.style.width = `${width * (1 - m)}px`
      el.style.opacity = String(Math.max(0, 1 - m * 1.4))
    }
    // Apply the current value on mount, not just future changes — a glyph that
    // first renders after (or mid-) the morph would otherwise stay full width.
    apply(morph.get())
    return morph.on("change", apply)
  }, [keep, width, morph])
  if (keep) {
    return <span style={{ display: "inline-block", whiteSpace: "pre" }}>{ch}</span>
  }
  return (
    <span
      ref={ref}
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        overflow: "hidden",
        width: width != null ? width : "auto",
      }}
    >
      {ch}
    </span>
  )
}

interface SharedTransitionStageProps {
  frameRef: React.RefObject<HTMLDivElement | null>
  forcedTeam: Team | null
  spinKey: number
  isSpinning: boolean
  onLanded?: (team: Team) => void
  reveal: RevealTuning
  winnerName?: string
  /** Initial name-cycle before the row lands. */
  spinCycleMs?: number
  /** Beat on the landed full name before the flight begins. */
  landHoldMs?: number
  /** Flight duration, row → centre. */
  flightMs?: number
  /** Peak lift of the flight arc, in px. 0 is a straight line. */
  arc?: number
  /** When the letter collapse starts/ends within the flight, as fractions. */
  morphStart?: number
  morphEnd?: number
  /** Abbreviation font size at the centre, in px. */
  centerFont?: number
}

type Phase = "idle" | "cycling" | "landed" | "flying" | "reveal"

const PILL_W = 200
const PILL_H = 64
const PILL_R = 16
const PILL_IDLE = "#1c1c1e"

export function SharedTransitionStage({
  frameRef,
  forcedTeam,
  spinKey,
  isSpinning,
  onLanded,
  reveal,
  winnerName = "Adam007",
  spinCycleMs = 1400,
  landHoldMs = 440,
  flightMs = 740,
  arc = 40,
  morphStart = 0.18,
  morphEnd = 0.82,
  centerFont = 30,
}: SharedTransitionStageProps) {
  /* Winner: the forced outcome, or a mount-stable random team for "Random".
     Only the random fallback is memoised — reading `forcedTeam` live lets the
     idle row reflect a newly picked outcome without waiting for a respin, while
     a run stays stable because a spin remounts this whole component (keyed on
     spinKey) and the timeline captures `target` in its closure. */
  const randomTeam = useMemo(
    () => teams[Math.floor(Math.random() * teams.length)],
    [],
  )
  const target = forcedTeam ?? randomTeam
  const display = `${target.city} ${target.name}`
  const displayUpper = display.toUpperCase()
  const kept = useMemo(() => keptIndices(display, target.abbrev), [display, target.abbrev])

  const [phase, setPhase] = useState<Phase>("idle")
  const [cycleIdx, setCycleIdx] = useState(0)
  const [hideRowName, setHideRowName] = useState(false)
  const [showTag, setShowTag] = useState(false)
  const [portalReady, setPortalReady] = useState(false)

  const rowNameRef = useRef<HTMLDivElement>(null)

  // Flight motion values, owned here so they persist across phase changes.
  const fx = useMotionValue(0)
  const fy = useMotionValue(0)
  const fscale = useMotionValue(1)
  const morph = useMotionValue(0)
  const color = useMotionValue("#ffffff")

  // Glyph widths, measured once at the centre font size (pre-scale space).
  const measureRef = useRef<HTMLDivElement>(null)
  const [widths, setWidths] = useState<number[] | null>(null)

  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  )

  useEffect(() => setPortalReady(true), [])

  /* Measure each glyph's natural width from a hidden copy rendered at centerFont.
     `portalReady` is a dep because the measurement copy lives in the portalled
     overlay, which only mounts after the first render sets portalReady — without
     it this runs once while measureRef is still null and `widths` stays null,
     so no glyph ever collapses. */
  useLayoutEffect(() => {
    const root = measureRef.current
    if (!root) return
    const els = Array.from(root.children) as HTMLElement[]
    setWidths(els.map((el) => el.getBoundingClientRect().width))
  }, [display, centerFont, portalReady])

  const pillTeam = phase === "reveal" ? target : null
  const stage = useRevealStage(pillTeam, { drawMs: reveal.drawMs, holdMs: reveal.holdMs })

  const beginFlight = useCallback(() => {
    const frame = frameRef.current
    const rowName = rowNameRef.current
    if (!frame || !rowName) {
      setPhase("reveal")
      return
    }
    // Mount the flying copy for the whole trip so it's visible in motion.
    setPhase("flying")
    const fRect = frame.getBoundingClientRect()
    const sRect = rowName.getBoundingClientRect()
    // Source centre and target (frame) centre, both in frame-local coords.
    const sx = sRect.left - fRect.left + sRect.width / 2
    const sy = sRect.top - fRect.top + sRect.height / 2
    const tx = fRect.width / 2
    const ty = fRect.height / 2
    const dx = sx - tx
    const dy = sy - ty
    // The row name renders at ~14px; match it at flight start, grow to 1.
    const s0 = 14 / centerFont

    fx.set(dx)
    fy.set(dy)
    fscale.set(s0)
    morph.set(0)
    color.set("#ffffff")
    setHideRowName(true)

    if (reduce) {
      fx.set(0)
      fy.set(0)
      fscale.set(1)
      morph.set(1)
      setPhase("reveal")
      return
    }

    const dur = flightMs / 1000
    animate(fx, 0, { duration: dur, ease: [0.22, 0.61, 0.36, 1] })
    // Arc: lift toward the centre, then settle. A straight tween when arc is 0.
    animate(fy, arc > 0 ? [dy, Math.min(dy, 0) - arc, 0] : 0, {
      duration: dur,
      ease: [0.22, 0.61, 0.36, 1],
    })
    animate(fscale, 1, { duration: dur, ease: [0.33, 0, 0.2, 1] })
    animate(morph, 1, {
      duration: (flightMs * (morphEnd - morphStart)) / 1000,
      delay: (flightMs * morphStart) / 1000,
      ease: "easeInOut",
    })
  }, [frameRef, centerFont, flightMs, arc, morphStart, morphEnd, reduce, fx, fy, fscale, morph, color])

  // Master timeline. Remounts per spinKey, so this runs once per spin.
  useEffect(() => {
    if (!isSpinning) return
    let cyc: ReturnType<typeof setInterval> | null = null
    const timers: ReturnType<typeof setTimeout>[] = []

    setPhase("cycling")
    setHideRowName(false)
    setShowTag(false)
    cyc = setInterval(() => setCycleIdx((i) => (i + 1) % teams.length), 70)

    timers.push(
      setTimeout(() => {
        if (cyc) clearInterval(cyc)
        onLanded?.(target)
        setPhase("landed")
      }, spinCycleMs),
    )
    timers.push(setTimeout(() => beginFlight(), spinCycleMs + landHoldMs))
    timers.push(
      setTimeout(() => setPhase("reveal"), spinCycleMs + landHoldMs + flightMs),
    )
    // Tag + colour swap land as the fill starts.
    const fillAt = spinCycleMs + landHoldMs + flightMs + (reveal.drawMs ?? 420) + (reveal.holdMs ?? 140)
    timers.push(
      setTimeout(() => {
        animate(color, readableOn(target.color), { duration: (reveal.fillMs ?? 320) / 1000 })
        setShowTag(true)
      }, fillAt),
    )

    return () => {
      if (cyc) clearInterval(cyc)
      timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cycleTeam = teams[cycleIdx]
  const rowTeam = phase === "cycling" ? cycleTeam : target
  const rowName = phase === "cycling" ? `${cycleTeam.city} ${cycleTeam.name}` : display
  const claimed = phase === "reveal"
  const flying = phase === "flying" || phase === "reveal"

  // ─── Bottom spinner row (lives in the normal slot) ───────────────────────
  const row = (
    <div className="flex flex-col gap-1">
      <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold px-1">
        Shared Element Transition
      </p>
      <motion.div
        className="relative bg-[#212121] rounded-2xl overflow-hidden"
        animate={{ opacity: claimed ? 0.55 : 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <motion.div
            className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-xs"
            style={{ backgroundColor: rowTeam.color, color: readableOn(rowTeam.color) }}
            animate={{ filter: claimed ? "grayscale(1)" : "grayscale(0)" }}
            transition={{ duration: 0.4 }}
          >
            {rowTeam.abbrev}
          </motion.div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="h-5 flex items-center">
              {claimed ? (
                <span className="text-white/50 text-sm font-semibold line-through">{display}</span>
              ) : (
                <div
                  ref={rowNameRef}
                  className="font-semibold text-sm truncate"
                  style={{
                    color: phase === "landed" || phase === "flying" ? target.color : "#ffffff",
                    opacity: hideRowName ? 0 : 1,
                  }}
                >
                  {rowName}
                </div>
              )}
            </div>
            <span className="text-white/50 text-xs mt-0.5">
              {claimed ? "Claimed — removed from spots" : "14/32 spots available"}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )

  // ─── Centre overlay (portalled into the phone frame) ─────────────────────
  const overlay = (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* Hidden measurement copy at the centre font size. */}
      <div
        ref={measureRef}
        aria-hidden
        className="absolute left-0 top-0 font-semibold"
        style={{ visibility: "hidden", whiteSpace: "pre", fontSize: centerFont, letterSpacing: "0.02em" }}
      >
        {[...displayUpper].map((ch, i) => (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre" }}>
            {ch}
          </span>
        ))}
      </div>

      {/* The staged pill reveal, centred in the frame. */}
      {(phase === "reveal") && (
        <RevealPill
          team={pillTeam}
          stage={stage}
          width={PILL_W}
          height={PILL_H}
          radius={PILL_R}
          idleColor={PILL_IDLE}
          drawMs={reveal.drawMs}
          fillMs={reveal.fillMs}
          drawEase={reveal.drawEase}
          lapTurns={reveal.lapTurns}
          headLen={reveal.headLen}
          strokeWidth={reveal.strokeWidth}
          popScale={reveal.popScale}
          glow={reveal.glow}
        />
      )}

      {/* The flying name: one element for the whole trip, so it owns each glyph.
          Wrapper is CSS-centred on the frame; the inner motion layer carries the
          FLIP translate + grow. */}
      {flying && (
        <div
          className="absolute"
          style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
        >
          <motion.div
            className="font-semibold"
            style={{
              x: fx,
              y: fy,
              scale: fscale,
              color,
              fontSize: centerFont,
              letterSpacing: "0.02em",
              whiteSpace: "pre",
              lineHeight: 1,
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            }}
          >
            {kept
              ? [...displayUpper].map((ch, i) => (
                  <Glyph key={i} ch={ch} keep={kept.has(i)} width={widths?.[i]} morph={morph} />
                ))
              : target.abbrev}
          </motion.div>
        </div>
      )}

      {/* Claimed-by tag, rising in under the pill as the fill lands. */}
      <AnimatePresence>
        {showTag && (
          <motion.div
            key="tag"
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
            style={{ top: `calc(50% + ${PILL_H / 2 + 18}px)` }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <span className="text-white/90 text-sm font-semibold">
              Claimed by <span style={{ color: target.secondary }}>@{winnerName}</span>
            </span>
            <span className="text-white/40 text-[11px] uppercase tracking-widest">
              Removed from available spots
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <>
      {row}
      {portalReady && frameRef.current ? createPortal(overlay, frameRef.current) : null}
    </>
  )
}
