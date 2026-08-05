"use client"

/**
 * Staged reveal for the roller's centre selection pill.
 *
 * Three beats, matching the storyboard:
 *   1. the team's secondary colour draws itself around the pill's edge as a
 *      stroke, two halves travelling from top-centre and meeting at the bottom
 *   2. a brief hold on the completed outline
 *   3. the team's primary colour fills the pill, carrying the pop + glow
 *
 * Lives in its own module rather than being duplicated into the two roller
 * components: single and multi have already drifted apart twice (row pitch, pill
 * width) and this is far more logic to keep in sync by hand.
 */

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import type { Team } from "@/components/team-spinner"

/** Stage 1 — time for the two halves to travel from top-centre to bottom. */
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
 * The pill outline, split at top-centre into two halves that both end at
 * bottom-centre — so animating each from `pathLength` 0 to 1 sends them down
 * opposite sides to meet at the bottom.
 *
 * Both are inset by half the stroke width: SVG centres a stroke on its path, so
 * without the inset the outer half would sit outside the pill and read as a
 * fractionally oversized, softer edge.
 */
function halfPaths(w: number, h: number, r: number, sw: number) {
  const i = sw / 2
  const x0 = i
  const y0 = i
  const x1 = w - i
  const y1 = h - i
  // Corner radius shrinks with the inset so the stroke stays concentric.
  const rr = Math.max(0, r - i)
  const midX = w / 2
  return {
    // Clockwise: top-centre → right edge → bottom-centre. Sweep flag 1.
    right:
      `M ${midX} ${y0} L ${x1 - rr} ${y0} A ${rr} ${rr} 0 0 1 ${x1} ${y0 + rr} ` +
      `L ${x1} ${y1 - rr} A ${rr} ${rr} 0 0 1 ${x1 - rr} ${y1} L ${midX} ${y1}`,
    // Counter-clockwise: top-centre → left edge → bottom-centre. Sweep flag 0.
    left:
      `M ${midX} ${y0} L ${x0 + rr} ${y0} A ${rr} ${rr} 0 0 0 ${x0} ${y0 + rr} ` +
      `L ${x0} ${y1 - rr} A ${rr} ${rr} 0 0 0 ${x0 + rr} ${y1} L ${midX} ${y1}`,
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
  const { left, right } = halfPaths(width, height, radius, strokeWidth)
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
        {[left, right].map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: stage >= 1 ? 1 : 0 }}
            transition={{
              duration: reduceMotion ? 0 : STROKE_DRAW_MS / 1000,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </motion.div>
  )
}
