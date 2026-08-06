"use client"

/**
 * Shared-element transition tester: ties the spin and the reveal together.
 *
 * The story, in five beats:
 *   1. the roller drum (the real SpinRollerSpinner) spins and lands on the winner
 *   2. it holds on the full "City Name" for a beat so viewers read it
 *   3. that same text lifts out of the drum's centre row and flies to the centre
 *      of the phone, and *as it travels* the non-abbreviation letters collapse
 *      away so "DETROIT LIONS" compresses into "DET"
 *   4. the centre pill runs its staged stroke-and-fill reveal around the abbrev
 *   5. a "Claimed by @user" tag rises in — the team is gone from the spots
 *
 * The spin is the actual roller, not a bespoke cycler: it is driven with
 * `disableReveal` so it only spins and lands, handing the reveal off to screen
 * centre. Its centre row is measured (via `centreRowRef`) as the flight origin,
 * and hidden (via `hideCentreLabel`) the instant the flying copy takes over.
 *
 * The flight is a manual FLIP: the flying copy is a single element that lives in
 * an overlay for the whole trip, so it can own every letter. A `layoutId`
 * crossfade between two separate elements can't express a per-letter collapse,
 * because the two elements have different content.
 *
 * The overlay is portalled into the phone-frame element (passed as `frameRef`)
 * rather than rendered in the spinner slot, so "centre" means the centre of the
 * whole screen and the drum keeps its natural place in the bottom stack.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion"
import { teams, type Team } from "@/components/team-spinner"
import { SpinRollerSpinner } from "@/components/spin-roller-spinner"
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
  /** Forces the drum to land on this index; leave null for random. */
  forcedIndex: number | null
  spinKey: number
  isSpinning: boolean
  onLanded?: (team: Team) => void
  reveal: RevealTuning
  winnerName?: string
  /** Roller spin feel — forwarded straight to SpinRollerSpinner. */
  spinDuration?: number
  startSpeed?: number
  rampUp?: number
  stopEase?: number
  rowPitch?: number
  /** Roller chrome, kept in sync with the other variants' bid box card. */
  breakNumber?: number
  availableSpots?: number
  totalSpots?: number
  onViewSpots?: () => void
  /** Extra beat on the landed full name (after the drum's own settle) before flight. */
  landHoldMs?: number
  /** Flight duration, drum centre → screen centre. */
  flightMs?: number
  /** Peak lift of the flight arc, in px. 0 is a straight line. */
  arc?: number
  /** When the letter collapse starts/ends within the flight, as fractions. */
  morphStart?: number
  morphEnd?: number
  /** Abbreviation font size at the centre, in px. */
  centerFont?: number
  /** Peak darkness of the scrim behind the flight, 0–1. 0 disables it. */
  scrimOpacity?: number
}

type Phase = "spinning" | "landed" | "flying" | "reveal"

const PILL_W = 200
const PILL_H = 64
const PILL_R = 16
const PILL_IDLE = "#1c1c1e"

export function SharedTransitionStage({
  frameRef,
  forcedIndex,
  spinKey,
  isSpinning,
  onLanded,
  reveal,
  winnerName = "Adam007",
  spinDuration = 4000,
  startSpeed = 0.09,
  rampUp = 0.35,
  stopEase = 3,
  rowPitch = 26,
  breakNumber = 15,
  availableSpots = 15,
  totalSpots = 32,
  onViewSpots,
  landHoldMs = 440,
  flightMs = 740,
  arc = 40,
  morphStart = 0.18,
  morphEnd = 0.82,
  centerFont = 30,
  scrimOpacity = 0.72,
}: SharedTransitionStageProps) {
  const [phase, setPhase] = useState<Phase>("spinning")
  const [landed, setLanded] = useState<Team | null>(null)
  const [hideCentre, setHideCentre] = useState(false)
  const [showTag, setShowTag] = useState(false)
  const [portalReady, setPortalReady] = useState(false)

  // Attached to the drum's resting centre row — the flight origin.
  const rowNameRef = useRef<HTMLSpanElement>(null)
  // Sequence timers, cleared on unmount so a mid-flight respin can't fire stale steps.
  const stageTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const display = landed ? `${landed.city} ${landed.name}` : ""
  const displayUpper = display.toUpperCase()
  const kept = useMemo(
    () => (landed ? keptIndices(display, landed.abbrev) : null),
    [display, landed],
  )

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
     `portalReady` and `display` are deps because the measurement copy lives in
     the portalled overlay and only has content once the drum has landed — without
     them this runs while measureRef is empty and `widths` stays null, so no glyph
     ever collapses. */
  useLayoutEffect(() => {
    const root = measureRef.current
    if (!root || !display) return
    const els = Array.from(root.children) as HTMLElement[]
    setWidths(els.map((el) => el.getBoundingClientRect().width))
  }, [display, centerFont, portalReady])

  const pillTeam = phase === "reveal" ? landed : null
  const stage = useRevealStage(pillTeam, { drawMs: reveal.drawMs, holdMs: reveal.holdMs })

  const beginFlight = useCallback(
    (team: Team) => {
      const frame = frameRef.current
      const rowName = rowNameRef.current
      if (!frame || !rowName || reduce) {
        setHideCentre(true)
        morph.set(1)
        setPhase("reveal")
        return
      }
      const fRect = frame.getBoundingClientRect()
      const sRect = rowName.getBoundingClientRect()
      // Source centre and target (frame) centre, in frame-local coords.
      const sx = sRect.left - fRect.left + sRect.width / 2
      const sy = sRect.top - fRect.top + sRect.height / 2
      const tx = fRect.width / 2
      const ty = fRect.height / 2
      const dx = sx - tx
      const dy = sy - ty
      /* Match the drum row's *rendered* size, not its 14px nominal size: the
         centre row sits on translateZ(RADIUS) under perspective, so it renders
         larger than 14px. Deriving s0 from the measured height makes the flying
         copy start exactly the size of the text it lifts off. */
      const s0 = sRect.height / centerFont

      fx.set(dx)
      fy.set(dy)
      fscale.set(s0)
      morph.set(0)
      color.set("#ffffff")
      setHideCentre(true)
      setPhase("flying")

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
    },
    [frameRef, centerFont, flightMs, arc, morphStart, morphEnd, reduce, fx, fy, fscale, morph, color],
  )

  /* The drum owns the spin and calls this once it rests on the winner (after its
     own settle flash). From here the stage schedules the rest of the sequence. */
  const handleLanded = useCallback(
    (team: Team) => {
      setLanded(team)
      setPhase("landed")
      onLanded?.(team)

      const timers: ReturnType<typeof setTimeout>[] = []
      timers.push(setTimeout(() => beginFlight(team), landHoldMs))
      timers.push(setTimeout(() => setPhase("reveal"), landHoldMs + flightMs))
      const fillAt = landHoldMs + flightMs + (reveal.drawMs ?? 420) + (reveal.holdMs ?? 140)
      timers.push(
        setTimeout(() => {
          animate(color, readableOn(team.color), { duration: (reveal.fillMs ?? 320) / 1000 })
          setShowTag(true)
        }, fillAt),
      )
      stageTimers.current = timers
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [landHoldMs, flightMs, reveal.drawMs, reveal.holdMs, reveal.fillMs, beginFlight, onLanded, color],
  )

  useEffect(() => () => stageTimers.current.forEach(clearTimeout), [])

  const claimed = phase === "reveal"
  const flying = phase === "flying" || phase === "reveal"

  // ─── Bottom slot: the real roller, driven to spin-and-land only ───────────
  const row = (
    <motion.div
      className="relative bg-[#212121] rounded-2xl p-3"
      animate={{ opacity: claimed ? 0.55 : 1 }}
      transition={{ duration: 0.4 }}
    >
      <SpinRollerSpinner
        key={`shared-roller-${spinKey}`}
        isSpinning={isSpinning}
        onLanded={handleLanded}
        winnerName={winnerName}
        breakNumber={breakNumber}
        availableSpots={availableSpots}
        totalSpots={totalSpots}
        onViewSpots={onViewSpots}
        forceTeamIndex={forcedIndex}
        spinDuration={spinDuration}
        startSpeed={startSpeed}
        rampUp={rampUp}
        stopEase={stopEase}
        rowPitch={rowPitch}
        reveal={reveal}
        disableReveal
        centreRowRef={rowNameRef}
        hideCentreLabel={hideCentre}
      />
    </motion.div>
  )

  // ─── Centre overlay (portalled into the phone frame) ─────────────────────
  const overlay = (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* Scrim: darkens the whole frame behind the flight so the flying name and
          the centre reveal read against the drum and chrome. Fades in with the
          flight and holds through the reveal; a radial gradient keeps the centre
          darkest without hard edges. Rendered first, so it sits under the pill,
          the flying text, and the tag. */}
      {scrimOpacity > 0 && (
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,${scrimOpacity}) 0%, rgba(0,0,0,${Math.min(1, scrimOpacity + 0.12)}) 100%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: flying ? 1 : 0 }}
          transition={{ duration: flightMs / 1000, ease: "easeOut" }}
        />
      )}

      {/* Hidden measurement copy at the centre font size. */}
      {display && (
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
      )}

      {/* The staged pill reveal, centred in the frame. */}
      {phase === "reveal" && (
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
      {flying && landed && (
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
              : landed.abbrev}
          </motion.div>
        </div>
      )}

      {/* Claimed-by tag, rising in under the pill as the fill lands. */}
      <AnimatePresence>
        {showTag && landed && (
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
              Claimed by <span style={{ color: landed.secondary }}>@{winnerName}</span>
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
