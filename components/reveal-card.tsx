"use client"

/**
 * The trading-card reveal for the shared-transition playground.
 *
 * Replaces the flat centre pill with a portrait card: a vertical gradient in the
 * team's colour, the abbreviation large at the top, a generic team-tinted helmet
 * in the centre, and the full "City Name" at the bottom.
 *
 * It reuses the pill's tuned reveal language — the two-headed lap stroke draws
 * the outline, a short hold, then the colour + content wash in with a pop and
 * glow — via the shared `LapStrokeOutline`. On top of that it adds a subtle 3D
 * `rotateY` turn-in, so the card reads as being turned to face the viewer.
 */

import { motion, useReducedMotion } from "framer-motion"
import type { Team } from "@/components/team-spinner"
import { LapStrokeOutline, readableOn, strokeColorFor, type RevealStage } from "@/components/pill-reveal"

/** Mix a hex colour toward white by `amt` (0–1). */
function lighten(hex: string, amt: number) {
  const h = hex.replace("#", "")
  if (h.length !== 6) return hex
  const mix = (c: number) =>
    Math.round(c + (255 - c) * amt)
      .toString(16)
      .padStart(2, "0")
  return `#${mix(parseInt(h.slice(0, 2), 16))}${mix(parseInt(h.slice(2, 4), 16))}${mix(parseInt(h.slice(4, 6), 16))}`
}

/** Mix a hex colour toward black by `amt` (0–1). */
function darken(hex: string, amt: number) {
  const h = hex.replace("#", "")
  if (h.length !== 6) return hex
  const mix = (c: number) =>
    Math.round(c * (1 - amt))
      .toString(16)
      .padStart(2, "0")
  return `#${mix(parseInt(h.slice(0, 2), 16))}${mix(parseInt(h.slice(2, 4), 16))}${mix(parseInt(h.slice(4, 6), 16))}`
}

/**
 * A simple side-profile football helmet, tinted with two team colours: `shell`
 * is the dome, `accent` the facemask and trim. Deliberately icon-simple — a
 * recognizable silhouette, not a detailed illustration.
 */
function TeamHelmet({ shell, accent, size }: { shell: string; accent: string; size: number }) {
  return (
    <svg
      width={size}
      height={size * 0.8}
      viewBox="0 0 200 160"
      fill="none"
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}
    >
      {/* Shell + jaw */}
      <path
        d="M64 150C31 150 12 118 12 84 12 43 46 14 96 14 150 14 190 45 190 86c0 15-10 24-26 24H98c-3 20-13 40-34 40Z"
        fill={shell}
      />
      {/* Chin bar */}
      <path
        d="M98 110c34 0 60-2 66-16"
        stroke={accent}
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Lower facemask bar */}
      <path
        d="M92 138c38-1 66-6 78-22"
        stroke={accent}
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Ear hole */}
      <circle cx="74" cy="86" r="16" fill={accent} />
      <circle cx="74" cy="86" r="7" fill={darken(shell, 0.35)} />
    </svg>
  )
}

interface RevealCardProps {
  team: Team | null
  stage: RevealStage
  width: number
  height: number
  radius?: number
  idleColor: string
  strokeWidth?: number
  drawMs?: number
  holdMs?: number
  fillMs?: number
  drawEase?: number
  lapTurns?: number
  headLen?: number
  popScale?: number
  glow?: number
  /** Peak of the subtle 3D turn-in, in degrees of rotateY. 0 disables it. */
  tiltDeg?: number
}

export function RevealCard({
  team,
  stage,
  width,
  height,
  radius = 18,
  idleColor,
  strokeWidth = 1.5,
  drawMs = 420,
  holdMs = 140,
  fillMs = 320,
  drawEase = 0,
  lapTurns = 1,
  headLen = 34,
  popScale = 1.04,
  glow = 1,
  tiltDeg = 16,
}: RevealCardProps) {
  const reduceMotion = useReducedMotion()
  const stroke = team ? strokeColorFor(team, idleColor) : "transparent"
  const filled = stage === 2 && team !== null

  const ink = team ? readableOn(team.color) : "#ffffff"
  const gradient = team
    ? `linear-gradient(180deg, ${lighten(team.color, 0.22)} 0%, ${team.color} 46%, ${darken(team.color, 0.42)} 100%)`
    : idleColor
  // Helmet reads as team-tinted: shell in the secondary, facemask in a lighter
  // wash of it, so it stays legible against the primary-colour gradient.
  const helmetShell = team ? team.secondary : "#888"
  const helmetAccent = team ? lighten(team.secondary, 0.4) : "#aaa"

  return (
    // Perspective lives on the parent so the child's rotateY reads as a real turn.
    <div
      className="absolute"
      style={{
        width,
        height,
        top: "50%",
        left: "50%",
        marginTop: -height / 2,
        marginLeft: -width / 2,
        perspective: 900,
      }}
    >
      <motion.div
        className="relative h-full w-full overflow-hidden"
        style={{ borderRadius: radius, backgroundColor: idleColor, transformStyle: "preserve-3d" }}
        initial={{ rotateY: reduceMotion ? 0 : -tiltDeg, opacity: 0 }}
        animate={{
          // The turn-in settles to flat; the pop rides the fill (stage 2).
          rotateY: 0,
          opacity: 1,
          scale: filled && !reduceMotion && popScale !== 1 ? [1, popScale, 1] : 1,
          boxShadow:
            filled && team && glow > 0
              ? `0 0 ${26 * glow}px ${team.color}${alphaHex(0.34 * glow)}, 0 0 ${52 * glow}px ${team.color}${alphaHex(0.16 * glow)}`
              : "0 10px 30px rgba(0,0,0,0.45)",
        }}
        transition={{
          // The turn finishes exactly as the fill begins (draw + hold).
          rotateY: { duration: reduceMotion ? 0 : (drawMs + holdMs) / 1000, ease: [0.22, 0.61, 0.36, 1] },
          opacity: { duration: 0.3 },
          scale: { duration: 0.3 },
          boxShadow: { duration: fillMs / 1000 },
        }}
      >
        {/* Gradient face — fades in with the fill, over the dark idle card. */}
        <motion.div
          className="absolute inset-0"
          style={{ background: gradient }}
          initial={{ opacity: 0 }}
          animate={{ opacity: filled ? 1 : 0 }}
          transition={{ duration: fillMs / 1000 }}
        />

        {/* Card content — abbreviation, helmet, full name. Rides in on the fill. */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-between px-4 py-5"
          style={{ color: ink }}
          initial={{ opacity: 0 }}
          animate={{ opacity: filled ? 1 : 0 }}
          transition={{ duration: fillMs / 1000, delay: filled ? 0.06 : 0 }}
        >
          <span
            className="font-bold leading-none"
            style={{ fontSize: Math.round(height * 0.16), letterSpacing: "0.04em" }}
          >
            {team?.abbrev}
          </span>

          <TeamHelmet shell={helmetShell} accent={helmetAccent} size={Math.round(width * 0.62)} />

          <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] opacity-80">
              {team?.city}
            </span>
            <span className="text-lg font-bold leading-tight">{team?.name}</span>
          </div>
        </motion.div>

        {/* The shared two-headed lap-stroke outline, drawn around the card. */}
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
    </div>
  )
}

/** 0–1 alpha as the 2-digit hex suffix an 8-digit colour needs. */
function alphaHex(a: number) {
  return Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, "0")
}
