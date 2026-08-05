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
import { motion, useReducedMotion } from "framer-motion"
import type { Team } from "@/components/team-spinner"

/** Stage 1 — time for the two brackets to open and seal, measured on the longest
 *  arm. Shorter arms finish proportionally sooner to keep one constant speed. */
export const STROKE_DRAW_MS = 420
/** Stage 2 — hold on the finished outline before the fill starts. Short; this is
 *  a beat to let the closed shape register, not a pause. */
export const STROKE_HOLD_MS = 140
/** Stage 3 — the primary colour washing in. */
export const FILL_MS = 320
/** Total reveal, exported so callers can pace their own timers against it. */
export const REVEAL_TOTAL_MS = STROKE_DRAW_MS + STROKE_HOLD_MS + FILL_MS

/** 0 = idle, 1 = stroke drawing, 2 = filled. */
export type RevealStage = 0 | 1 | 2

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
 * The pill outline as four arms, forming two L-shaped brackets anchored at the
 * top-left and bottom-right corners.
 *
 * Each bracket grows in both directions from its own corner, so animating all
 * four from `pathLength` 0 to 1 opens two brackets at once and seals them at the
 * *other* two corners — top-right and bottom-left. The arrangement has 180°
 * rotational symmetry: the bottom-right bracket is the top-left one turned half
 * a turn, which is what makes the two ends meet exactly.
 *
 * Every arm starts and ends at the 45° midpoint of a corner arc rather than at
 * the straight edge, so each corner's curve is shared half-and-half by the two
 * arms that touch it. Anchoring at the edges instead would leave the top-right
 * and bottom-left curves undrawn — a visible notch at each seal.
 *
 * All of it is inset by half the stroke width: SVG centres a stroke on its path,
 * so without the inset the outer half would sit outside the pill and read as a
 * fractionally oversized, softer edge.
 *
 * The arms are wildly unequal — on a 255×30 pill the horizontals are ~9x the
 * verticals — so each one's pixel length is returned alongside its path. The
 * caller scales each arm's duration by that length to hold a single constant
 * speed around the whole outline. Sharing one duration instead would animate
 * them in lockstep as *fractions*, creeping the verticals along at a ninth of
 * the horizontals' speed, which reads as four separate stretching lines rather
 * than one line being traced.
 */
function bracketPaths(w: number, h: number, r: number, sw: number) {
  const i = sw / 2
  const x0 = i
  const y0 = i
  const x1 = w - i
  const y1 = h - i
  // Corner radius shrinks with the inset so the stroke stays concentric.
  const rr = Math.max(0, r - i)
  /* Offset from a corner's straight-edge tangent to the 45° point on its arc. */
  const k = rr * (1 - Math.SQRT1_2)
  // The four corner midpoints every arm runs between.
  const tl = `${x0 + k} ${y0 + k}`
  const tr = `${x1 - k} ${y0 + k}`
  const br = `${x1 - k} ${y1 - k}`
  const bl = `${x0 + k} ${y1 - k}`
  /* Each arm spans two corner half-arcs plus one straight edge. */
  const cornerHalf = (Math.PI * rr) / 4
  const acrossLen = 2 * cornerHalf + (x1 - x0 - 2 * rr)
  const downLen = 2 * cornerHalf + (y1 - y0 - 2 * rr)
  /* Sweep flag 1 traces the outline clockwise, 0 counter-clockwise. */
  return [
    // Top-left bracket, clockwise: TL corner → top edge → TR corner.
    { d: `M ${tl} A ${rr} ${rr} 0 0 1 ${x0 + rr} ${y0} L ${x1 - rr} ${y0} A ${rr} ${rr} 0 0 1 ${tr}`, len: acrossLen },
    // Top-left bracket, counter-clockwise: TL corner → left edge → BL corner.
    { d: `M ${tl} A ${rr} ${rr} 0 0 0 ${x0} ${y0 + rr} L ${x0} ${y1 - rr} A ${rr} ${rr} 0 0 0 ${bl}`, len: downLen },
    // Bottom-right bracket, clockwise: BR corner → bottom edge → BL corner.
    { d: `M ${br} A ${rr} ${rr} 0 0 1 ${x1 - rr} ${y1} L ${x0 + rr} ${y1} A ${rr} ${rr} 0 0 1 ${bl}`, len: acrossLen },
    // Bottom-right bracket, counter-clockwise: BR corner → right edge → TR corner.
    { d: `M ${br} A ${rr} ${rr} 0 0 0 ${x1} ${y1 - rr} L ${x1} ${y0 + rr} A ${rr} ${rr} 0 0 0 ${tr}`, len: downLen },
  ]
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
export function useRevealStage(team: Team | null): RevealStage {
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
    const t = setTimeout(() => setStage(2), STROKE_DRAW_MS + STROKE_HOLD_MS)
    return () => clearTimeout(t)
  }, [team, reduceMotion])

  return stage
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
  strokeWidth = 1.5,
}: RevealPillProps) {
  const reduceMotion = useReducedMotion()
  const arms = useMemo(
    () => bracketPaths(width, height, radius, strokeWidth),
    [width, height, radius, strokeWidth],
  )
  const longestArm = Math.max(...arms.map((a) => a.len))
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
        scale: filled && !reduceMotion ? [1, 1.04, 1] : 1,
        backgroundColor: filled && team ? team.color : idleColor,
        boxShadow:
          filled && team
            ? `0 0 20px ${team.color}40, 0 0 40px ${team.color}20`
            : "0 0 0 rgba(0,0,0,0)",
      }}
      transition={{
        scale: { duration: 0.3 },
        backgroundColor: { duration: FILL_MS / 1000 },
        boxShadow: { duration: FILL_MS / 1000 },
      }}
    >
      {/* Outline overlay. `overflow: visible` matters — the stroke's outer edge
          would otherwise be clipped by the svg's own box at the corners. */}
      <svg
        className="pointer-events-none absolute inset-0"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        {arms.map((arm, i) => (
          <motion.path
            key={i}
            d={arm.d}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: stage >= 1 ? 1 : 0 }}
            transition={{
              /* Proportional to arm length, so every arm draws at the same
                 px/sec and STROKE_DRAW_MS is set by the longest one. The short
                 verticals therefore seal early and the horizontals close last —
                 the near-complete verticals in the storyboard's opening frame. */
              duration: reduceMotion ? 0 : (STROKE_DRAW_MS / 1000) * (arm.len / longestArm),
              /* Linear, not eased: each arm runs its own duration, so any easing
                 curve would be re-fitted per arm and desynchronise the speeds
                 this proportional timing exists to match. */
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </motion.div>
  )
}
