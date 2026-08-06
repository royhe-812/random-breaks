"use client"

/**
 * Staged reveal for the roller's centre selection pill.
 *
 * Three beats, matching the storyboard:
 *   1. the team's secondary colour draws itself around the pill's edge as two
 *      brackets, opening from the top-left and bottom-right corners at the same
 *      time and sealing at the top-right and bottom-left
 *   2. a brief hold on the completed outline
 *   3. the team's primary colour fills the pill, carrying the pop + glow
 *
 * Lives in its own module rather than being duplicated into the two roller
 * components: single and multi have already drifted apart twice (row pitch, pill
 * width) and this is far more logic to keep in sync by hand.
 */

import { useEffect, useMemo, useState } from "react"
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion"
import type { Team } from "@/components/team-spinner"

/* ── Timing defaults ──
   Every one of these is overridable per-call so the testing zone can put them on
   dials; these are the tuned values the app ships with. */

/** Stage 1 — time for the two brackets to open and seal. */
export const STROKE_DRAW_MS = 420
/** Stage 2 — hold on the finished outline before the fill starts. Short; this is
 *  a beat to let the closed shape register, not a pause. */
export const STROKE_HOLD_MS = 140
/** Stage 3 — the primary colour washing in. */
export const FILL_MS = 320
/** Total reveal at default timings, so callers can pace their own timers. */
export const REVEAL_TOTAL_MS = STROKE_DRAW_MS + STROKE_HOLD_MS + FILL_MS
/** Linear draw. See `drawEase` on RevealPill for what the number means. */
export const STROKE_DRAW_EASE = 0
/** Outline thickness in px. */
export const STROKE_WIDTH = 1.5
/** One full turn of the outline before the fill. */
export const LAP_TURNS = 1
/** Length of the bright leading head, in px of outline. */
export const HEAD_LEN = 34

/**
 * Where each head starts, as a fraction of the perimeter clockwise from the
 * top-left corner. Half a lap apart, which on a rounded rect lands the second
 * head exactly on the bottom-right corner — the storyboard's two anchors.
 */
const LAP_OFFSETS = [0, 0.5]

/**
 * One signed number describing how the traced line paces itself, in the same
 * spirit as the spin dials' `stopEase`:
 *
 *   0   linear — constant speed all the way round
 *   >0  ease-out — leaps away from the corners and glides into the seal
 *   <0  ease-in — creeps out of the corners then whips shut
 *
 * Returned as a cubic bezier because it interpolates continuously, so the dial
 * sweeps smoothly through linear instead of snapping between named curves.
 */
function drawEaseCurve(k: number): [number, number, number, number] {
  const a = Math.min(1, Math.abs(k))
  // Endpoints are the standard easeOut/easeIn control points, lerped from linear.
  if (k >= 0) return [0, 0, 1 - 0.42 * a, 1]
  return [0.42 * a, 0, 1, 1]
}

/** 0 = idle, 1 = stroke drawing, 2 = filled. */
export type RevealStage = 0 | 1 | 2

/**
 * The whole feel of the reveal in one object, so the rollers can forward it from
 * a dial panel as a single prop rather than seven parallel ones. Every field is
 * optional and falls back to the tuned default.
 */
export interface RevealTuning {
  drawMs?: number
  holdMs?: number
  fillMs?: number
  drawEase?: number
  lapTurns?: number
  headLen?: number
  strokeWidth?: number
  popScale?: number
  glow?: number
}

/* ── Stroke colour selection ──
   The stroke sits on a dark pill, so a plain WCAG contrast ratio is the wrong
   test: it is symmetric, which scores pure black (#000) *higher* than a mid red
   like the Texans' #A71930 purely for being far darker than the pill. A dark
   line on a dark pill is exactly what we're trying to avoid, so the test is
   directional instead — the stroke must be meaningfully BRIGHTER than the pill. */

/** WCAG relative luminance, linear-light. */
function relativeLuminance(hex: string) {
  const h = hex.replace("#", "")
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const r = toLinear(parseInt(h.slice(0, 2), 16) / 255)
  const g = toLinear(parseInt(h.slice(2, 4), 16) / 255)
  const b = toLinear(parseInt(h.slice(4, 6), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Black or white label for a given fill, per WCAG relative luminance. Team
 * primaries run from near-black (Packers #203731) to bright yellow (Steelers
 * #FFB612), so the landed row's label colour can't be a constant.
 */
export function readableOn(hex: string) {
  return relativeLuminance(hex) > 0.42 ? "#101820" : "#ffffff"
}

/** How much brighter than the pill a colour must be to work as the stroke. */
const MIN_STROKE_LUMA_RATIO = 1.6
/** Last resort when neither team colour is bright enough (only the Jets, whose
 *  secondary is pure black and whose primary is a very dark green). Deliberately
 *  not pure white so it still reads as a stroke rather than a UI highlight. */
const NEUTRAL_STROKE = "#E6E6E6"

/**
 * The team's secondary colour where it is visible, else the primary, else a
 * light neutral. Four teams have a near-black secondary (Bengals and Jets pure
 * black, Steelers #101820, Broncos #002244) and would otherwise draw an
 * invisible stroke.
 */
export function strokeColorFor(team: Team, pillBg: string) {
  const floor = relativeLuminance(pillBg) * MIN_STROKE_LUMA_RATIO
  if (relativeLuminance(team.secondary) >= floor) return team.secondary
  if (relativeLuminance(team.color) >= floor) return team.color
  return NEUTRAL_STROKE
}

/**
 * The pill outline as one continuous closed loop, starting at the 45° midpoint of
 * the top-left corner and running clockwise.
 *
 * A single path rather than four arms because the reveal is now a *lap*: two
 * heads chase all the way around this one loop, and both the painted trail and
 * the travelling head are cut out of it with `stroke-dasharray`. Four separate
 * arms cannot express a segment that crosses a corner mid-travel.
 *
 * Starting at a corner's 45° point rather than on a straight edge is what makes
 * the two heads exactly antipodal. A rounded rect has 180° rotational symmetry,
 * so the point exactly half a perimeter clockwise from the top-left 45° point is
 * the bottom-right 45° point — the two corners in the storyboard. Anchoring on an
 * edge instead would put the second head slightly off its corner.
 *
 * Inset by half the stroke width: SVG centres a stroke on its path, so without
 * the inset the outer half would sit outside the pill and read as a fractionally
 * oversized, softer edge.
 *
 * `len` is the perimeter in px, computed analytically rather than measured, so
 * the caller can size the head in px and convert to the normalised 0–1 space the
 * dash maths runs in without touching the DOM.
 */
function perimeterPath(w: number, h: number, r: number, sw: number) {
  const i = sw / 2
  const x0 = i
  const y0 = i
  const x1 = w - i
  const y1 = h - i
  // Corner radius shrinks with the inset so the stroke stays concentric.
  const rr = Math.max(0, r - i)
  /* Offset from a corner's straight-edge tangent to the 45° point on its arc. */
  const k = rr * (1 - Math.SQRT1_2)
  const straightW = x1 - x0 - 2 * rr
  const straightH = y1 - y0 - 2 * rr
  /* Sweep flag 1 traces the outline clockwise. The first and last arcs are the
     two halves of the top-left corner, split at the 45° point we start from. */
  const d = [
    `M ${x0 + k} ${y0 + k}`,
    `A ${rr} ${rr} 0 0 1 ${x0 + rr} ${y0}`,
    `L ${x1 - rr} ${y0}`,
    `A ${rr} ${rr} 0 0 1 ${x1} ${y0 + rr}`,
    `L ${x1} ${y1 - rr}`,
    `A ${rr} ${rr} 0 0 1 ${x1 - rr} ${y1}`,
    `L ${x0 + rr} ${y1}`,
    `A ${rr} ${rr} 0 0 1 ${x0} ${y1 - rr}`,
    `L ${x0} ${y0 + rr}`,
    `A ${rr} ${rr} 0 0 1 ${x0 + k} ${y0 + k}`,
  ].join(" ")
  // Four quarter-arcs make exactly one circle of radius rr.
  return { d, len: 2 * straightW + 2 * straightH + 2 * Math.PI * rr }
}

/**
 * One dash cut out of the closed perimeter, expressed in laps.
 *
 * `start` is where the dash begins (0 = top-left corner, 0.5 = bottom-right) and
 * `len` how far it runs, both as a fraction of the perimeter. The pair sums to
 * exactly 1 so the pattern tiles once around the loop, which is what lets a dash
 * cross the seam at the start point without a second copy appearing.
 *
 * `stroke-dashoffset` is negated because it means "distance into the pattern that
 * path position 0 maps to" — the inverse of where the dash lands.
 */
function dashFor(start: number, len: number) {
  const wrapped = ((start % 1) + 1) % 1
  return {
    // A zero gap would tile a hairline seam, so go fully solid at a whole lap.
    strokeDasharray: len >= 1 ? "none" : `${len} ${1 - len}`,
    strokeDashoffset: -wrapped,
  }
}

/**
 * Drives the three-stage sequence off the landed team.
 *
 * Returned so the *caller* owns the stage too, not just the pill: the landed
 * row's text colour has to flip in step with the fill. Picking a dark label for
 * a bright primary (Steelers gold) any earlier would put dark text on the still
 * dark pill.
 *
 * Callers must reset `team` to null between spins — the transition null → team
 * is what restarts the sequence, and without it a team landing twice in a row
 * would not re-trigger.
 */
export function useRevealStage(
  team: Team | null,
  /* Must match the values handed to RevealPill, or the fill fires at the wrong
     moment — this hook owns *when* stage 3 starts, the pill only renders it. */
  timings: { drawMs?: number; holdMs?: number } = {},
): RevealStage {
  const { drawMs = STROKE_DRAW_MS, holdMs = STROKE_HOLD_MS } = timings
  const [stage, setStage] = useState<RevealStage>(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!team) {
      setStage(0)
      return
    }
    // With reduced motion there is no draw to wait for, so land on the final
    // state immediately rather than timing a sequence nobody sees.
    if (reduceMotion) {
      setStage(2)
      return
    }
    setStage(1)
    const t = setTimeout(() => setStage(2), drawMs + holdMs)
    return () => clearTimeout(t)
  }, [team, reduceMotion, drawMs, holdMs])

  return stage
}

/** 0–1 alpha as the 2-digit hex suffix an 8-digit colour needs. */
function alphaHex(a: number) {
  return Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, "0")
}

/** Mix a hex colour toward white, for the brighter leading head. */
function lighten(hex: string, amt: number) {
  const h = hex.replace("#", "")
  if (h.length !== 6) return hex
  const mix = (c: number) =>
    Math.round(c + (255 - c) * amt)
      .toString(16)
      .padStart(2, "0")
  return `#${mix(parseInt(h.slice(0, 2), 16))}${mix(parseInt(h.slice(2, 4), 16))}${mix(parseInt(h.slice(4, 6), 16))}`
}

/**
 * The trail one head paints behind it: a dash anchored at `offset` that grows
 * from nothing to the whole loop as the head travels.
 *
 * Capped at one lap, so a head making more than a single turn stops repainting
 * what it already covered instead of the dash overflowing the pattern.
 */
function LapTrail({
  d,
  offset,
  travelled,
  stroke,
  strokeWidth,
}: {
  d: string
  offset: number
  travelled: MotionValue<number>
  stroke: string
  strokeWidth: number
}) {
  const strokeDasharray = useTransform(travelled, (s) => dashFor(offset, Math.min(1, s)).strokeDasharray)
  return (
    <motion.path
      d={d}
      pathLength={1}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      /* Anchored, so only the dash *length* animates — the trail grows forward
         from its corner rather than sliding around the loop. */
      strokeDashoffset={dashFor(offset, 0).strokeDashoffset}
      style={{ strokeDasharray }}
    />
  )
}

/**
 * The bright leading head, a short fixed-length dash riding at the front of its
 * trail. Drawn thicker and lighter than the trail so it still reads while
 * crossing outline the *other* head has already painted.
 *
 * Fades out over the last stretch of the lap rather than vanishing on arrival,
 * which would pop a hard edge off the corner right before the fill.
 */
function LapHead({
  d,
  offset,
  travelled,
  lapTurns,
  headFrac,
  stroke,
  strokeWidth,
}: {
  d: string
  offset: number
  travelled: MotionValue<number>
  lapTurns: number
  headFrac: number
  stroke: string
  strokeWidth: number
}) {
  const strokeDashoffset = useTransform(
    travelled,
    (s) => dashFor(offset + s - headFrac, headFrac).strokeDashoffset,
  )
  /* Fades in off the corner and out on arrival. Both ramps are driven by
     `travelled` rather than by mount, so a head that mounts mid-lap still
     resolves correctly — a plain `s <= 0` guard would latch at 0 for a head
     first rendered after the animation had already begun. */
  const opacity = useTransform(travelled, (s) => {
    const fade = Math.min(0.12, lapTurns / 2)
    const inRamp = Math.min(1, s / Math.min(0.04, lapTurns / 4))
    const outRamp = Math.min(1, Math.max(0, (lapTurns - s) / fade))
    return Math.max(0, Math.min(inRamp, outRamp))
  })
  return (
    <motion.path
      d={d}
      pathLength={1}
      fill="none"
      stroke={lighten(stroke, 0.45)}
      strokeWidth={strokeWidth * 2.1}
      strokeLinecap="round"
      strokeDasharray={dashFor(0, headFrac).strokeDasharray}
      style={{ strokeDashoffset, opacity }}
    />
  )
}

/**
 * The two-headed lap-stroke outline, extracted so both the flat centre pill and
 * the trading-card reveal draw the exact same tuned line rather than keeping two
 * copies of this dash maths in sync. Owns its own `travelled` timeline, driven
 * off the `drawing` flag (stage ≥ 1). Purely an overlay — the caller supplies the
 * box (width/height/radius) and the stroke colour.
 */
export function LapStrokeOutline({
  width,
  height,
  radius,
  stroke,
  strokeWidth = STROKE_WIDTH,
  drawMs = STROKE_DRAW_MS,
  drawEase = STROKE_DRAW_EASE,
  lapTurns = LAP_TURNS,
  headLen = HEAD_LEN,
  drawing,
}: {
  width: number
  height: number
  radius: number
  stroke: string
  strokeWidth?: number
  drawMs?: number
  drawEase?: number
  lapTurns?: number
  headLen?: number
  /** True once the outline should be tracing (stage ≥ 1). */
  drawing: boolean
}) {
  const reduceMotion = useReducedMotion()
  const loop = useMemo(
    () => perimeterPath(width, height, radius, strokeWidth),
    [width, height, radius, strokeWidth],
  )
  /* Head length is authored in px but the dash maths runs in laps. Capped well
     short of a full turn so the head never eats its own tail. */
  const headFrac = Math.min(0.4, headLen / loop.len)

  /* One shared timeline for both heads, measured in laps travelled. Every trail
     and head reads its dash off this single value, so the two are matched in
     speed by construction and the easing curve applies once to the whole lap. */
  const travelled = useMotionValue(0)

  useEffect(() => {
    if (reduceMotion) {
      travelled.set(drawing ? lapTurns : 0)
      return
    }
    if (!drawing) {
      travelled.set(0)
      return
    }
    const controls = animate(travelled, lapTurns, {
      /* The whole lap fits inside drawMs regardless of lapTurns, so raising the
         turns speeds the head up rather than stretching the reveal. */
      duration: drawMs / 1000,
      ease: drawEaseCurve(drawEase),
    })
    return () => controls.stop()
  }, [drawing, lapTurns, drawMs, drawEase, travelled, reduceMotion])

  return (
    /* `overflow: visible` matters — the stroke's outer edge would otherwise be
       clipped by the svg's own box at the corners. */
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      {/* Two heads half a lap apart — the storyboard's top-left and bottom-right
          corners. Trails first so the heads ride over them. */}
      {LAP_OFFSETS.map((offset) => (
        <LapTrail
          key={`trail-${offset}`}
          d={loop.d}
          offset={offset}
          travelled={travelled}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      ))}
      {/* Mounted for the whole reveal, not gated on the landed team: a path that
          first renders mid-lap has no further `travelled` change to react to, so
          its transforms would latch at their mount-time value. Opacity keeps it
          invisible until the lap starts. */}
      {!reduceMotion &&
        headFrac > 0 &&
        LAP_OFFSETS.map((offset) => (
          <LapHead
            key={`head-${offset}`}
            d={loop.d}
            offset={offset}
            travelled={travelled}
            lapTurns={lapTurns}
            headFrac={headFrac}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        ))}
    </svg>
  )
}

interface RevealPillProps {
  /** The landed team, or null while spinning / idle. */
  team: Team | null
  /** Current stage, from `useRevealStage`. */
  stage: RevealStage
  width: number
  height: number
  /** Pill fill before the team colour arrives. */
  idleColor: string
  radius?: number
  strokeWidth?: number
  /** Time for the two heads to complete their lap, whatever `lapTurns` is. */
  drawMs?: number
  /** Time for the primary colour to wash in. */
  fillMs?: number
  /** Pacing of the traced line: 0 linear, >0 ease-out, <0 ease-in. */
  drawEase?: number
  /** Turns each head makes before the fill. 1 is one full lap. */
  lapTurns?: number
  /** Length of the bright leading head in px. 0 draws the trail only. */
  headLen?: number
  /** Peak of the pop that rides the fill. 1 disables it. */
  popScale?: number
  /** Multiplier on the glow that rides the fill. 0 disables it. */
  glow?: number
}

/**
 * The centre selection pill, including its staged reveal. Absolutely positioned
 * and self-centring, so it drops straight into the drum in place of a plain div.
 */
export function RevealPill({
  team,
  stage,
  width,
  height,
  idleColor,
  radius = 4,
  strokeWidth = STROKE_WIDTH,
  drawMs = STROKE_DRAW_MS,
  fillMs = FILL_MS,
  drawEase = STROKE_DRAW_EASE,
  lapTurns = LAP_TURNS,
  headLen = HEAD_LEN,
  popScale = 1.04,
  glow = 1,
}: RevealPillProps) {
  const reduceMotion = useReducedMotion()
  const stroke = team ? strokeColorFor(team, idleColor) : "transparent"
  const filled = stage === 2 && team !== null

  return (
    <motion.div
      className="absolute"
      style={{
        width,
        height,
        top: "50%",
        marginTop: -height / 2,
        left: "50%",
        marginLeft: -width / 2,
        borderRadius: radius,
        backgroundColor: idleColor,
      }}
      animate={{
        // Pop and glow ride the fill, so the celebration beat lands on stage 3
        // instead of competing with the quiet stroke draw.
        scale: filled && !reduceMotion && popScale !== 1 ? [1, popScale, 1] : 1,
        backgroundColor: filled && team ? team.color : idleColor,
        boxShadow:
          filled && team && glow > 0
            ? /* Alpha scales with the glow dial. Clamped and rounded to a 2-digit
                 hex pair, since a bare template would emit e.g. "#E318374d.8". */
              `0 0 ${20 * glow}px ${team.color}${alphaHex(0.3 * glow)}, 0 0 ${40 * glow}px ${team.color}${alphaHex(0.13 * glow)}`
            : "0 0 0 rgba(0,0,0,0)",
      }}
      transition={{
        scale: { duration: 0.3 },
        backgroundColor: { duration: fillMs / 1000 },
        boxShadow: { duration: fillMs / 1000 },
      }}
    >
      {/* Outline overlay — the shared two-headed lap stroke. */}
      <LapStrokeOutline
        width={width}
        height={height}
        radius={radius}
        stroke={stroke}
        strokeWidth={strokeWidth}
        drawMs={drawMs}
        drawEase={drawEase}
        lapTurns={lapTurns}
        headLen={headLen}
        drawing={stage >= 1}
      />
    </motion.div>
  )
}
