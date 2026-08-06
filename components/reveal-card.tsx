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
 * The supplied side-profile football helmet, tinted per team. The artwork has
 * four ink layers: a white outer outline (kept white for a clean edge against
 * the card), a base coat under the shell (a darker shade of the shell colour), the
 * main shell (the team colour), a white earhole with a dark pupil, and dark vent
 * details. Only the shell + base pick up the team colour; the outline, earhole
 * and vents stay fixed so the helmet stays legible on any gradient.
 */
function TeamHelmet({ shell, base, size }: { shell: string; base: string; size: number }) {
  // Preserve the artwork's own aspect ratio (96 × 92).
  return (
    <svg
      width={size}
      height={(size * 92) / 96}
      viewBox="0 0 96 92"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g filter="url(#helmetShadow)">
        {/* White outer outline. */}
        <path
          d="M46.7897 9.33594C47.5076 9.28009 48.4877 9.32214 49.208 9.35303C52.7999 9.48771 56.3481 10.1859 59.7221 11.4219C67.0511 14.1028 73.2603 19.1717 77.3466 25.8099C78.1814 27.1648 78.7948 28.3837 79.4591 29.8123C79.9599 29.5845 80.4688 29.5142 81.0009 29.6761C81.511 29.8334 81.9354 30.1901 82.1773 30.6649C82.4235 31.1425 82.4651 31.6995 82.2926 32.2083C82.0543 32.9108 81.6415 33.1901 80.9985 33.5164C80.4688 33.7853 79.9331 34.0462 79.4006 34.3103L75.4524 36.2684L61.9374 42.9778L64.1183 53.8817C67.9444 53.9196 71.8413 53.8797 75.6754 53.8793L78.6839 53.8789C79.3473 53.8777 80.0748 53.8393 80.7171 53.9328C82.3098 54.171 82.9732 56.1553 81.8149 57.2959C80.9733 58.1244 79.4775 57.9122 78.3544 57.9114C78.3127 61.9424 78.3428 66.0464 78.3544 70.0822C79.3305 70.1217 80.6666 69.9135 81.4834 70.4295C81.9314 70.7156 82.2453 71.1696 82.355 71.6892C82.4663 72.2076 82.3642 72.7483 82.0724 73.1907C81.7869 73.6355 81.3316 73.9445 80.8128 74.0452C80.2882 74.1511 79.3429 74.1211 78.78 74.1215L75.7111 74.1199L71.2332 74.1203C70.253 74.1199 69.0262 74.1599 68.0805 74.0096C67.2185 73.8705 66.3973 73.5468 65.6726 73.0608C63.4217 71.5501 63.1866 69.6166 62.721 67.2202C62.6165 66.777 62.5244 66.2886 62.4411 65.8398C61.9518 63.1981 61.3228 60.5536 60.8608 57.9098C58.9754 57.9014 58.364 57.891 56.5451 57.3243C56.7509 58.4985 57.0183 59.6883 57.2453 60.8605C57.4251 61.7893 57.6129 62.615 57.6613 63.5694C57.7762 66.2179 56.8413 68.8049 55.0596 70.7704C53.1578 72.8638 50.6258 74.0012 47.8139 74.0971C46.8329 74.1303 45.8514 74.1195 44.87 74.1199L39.9685 74.1207C38.3659 74.1203 36.6359 74.1647 35.047 74.0859C30.6016 73.8657 27.7684 72.0921 24.5531 69.1642C17.6882 62.9583 13.6039 54.2634 13.2151 45.0269C12.8511 35.9918 16.1033 27.1833 22.2541 20.5448C27.2114 15.1494 33.7505 11.4563 40.9367 9.99334C43.0272 9.57667 44.6976 9.4291 46.7897 9.33594Z"
          fill="white"
        />
      </g>
      {/* Base coat under the shell — a darker shade of the team colour. */}
      <path
        d="M45.8596 13.3744C50.0788 13.1168 54.3065 13.719 58.2851 15.1442C64.6136 17.4193 70.0092 21.7227 73.6282 27.3823C74.5387 28.8087 75.1701 30.0723 75.8852 31.5918C74.2781 32.3606 72.6501 33.1932 71.0498 33.9881L62.2149 38.3729L57.942 40.4915C56.7224 41.0966 55.2122 41.7619 54.1764 42.6061C53.2258 43.3831 52.4539 44.3555 51.9134 45.4571C50.3455 48.6208 51.2055 51.1146 51.8565 54.3539L53.1101 60.6061C53.5329 62.7027 54.0827 64.4136 53.1282 66.4946C52.3834 68.1189 51.1815 69.1516 49.5259 69.7734C49.0522 69.9313 48.5606 70.0284 48.0625 70.0624C47.2817 70.1131 46.3114 70.0896 45.5132 70.0884L41.1549 70.0816L37.1915 70.0868C36.3941 70.0876 35.391 70.1115 34.6083 70.0416C33.8161 69.9681 33.0353 69.8006 32.2825 69.5432C30.4646 68.929 29.0706 67.8163 27.6439 66.5614C21.5546 61.2188 17.8188 53.6964 17.2455 45.6241C16.7527 37.5561 19.5271 29.6286 24.9458 23.622C30.2759 17.5678 37.8011 13.8805 45.8596 13.3744Z"
        fill={base}
      />
      {/* Main shell — the team colour. */}
      <path
        d="M45.8596 13.3744C50.0788 13.1168 54.3065 13.719 58.2851 15.1442C64.6136 17.4193 70.0092 21.7227 73.6282 27.3823C74.5387 28.8087 75.1701 30.0723 75.8852 31.5918C74.2781 32.3606 72.6501 33.1932 71.0498 33.9881L62.2149 38.3729L57.942 40.4915C56.7224 41.0966 55.2122 41.7619 54.1764 42.6061C53.2258 43.3831 52.4539 44.3555 51.9134 45.4571C50.3455 48.6208 51.2055 51.1146 51.8565 54.3539L53.1101 60.6061C53.5329 62.7027 54.0827 64.4136 53.1282 66.4946C52.3834 68.1189 51.1815 69.1516 49.5259 69.7734C49.0522 69.9313 48.5606 70.0284 48.0625 70.0624C47.2817 70.1131 46.3114 70.0896 45.5132 70.0884L41.1549 70.0816L37.1915 70.0868C36.3941 70.0876 35.391 70.1115 34.6083 70.0416C33.8161 69.9681 33.0353 69.8006 32.2825 69.5432C30.4646 68.929 29.0706 67.8163 27.6439 66.5614C21.5546 61.2188 17.8188 53.6964 17.2455 45.6241C16.7527 37.5561 19.5271 29.6286 24.9458 23.622C30.2759 17.5678 37.8011 13.8805 45.8596 13.3744Z"
        fill={shell}
      />
      {/* Earhole — white ring with a dark pupil. */}
      <path
        d="M39.5421 53.9037C42.8801 53.8326 45.646 56.4719 45.7245 59.8039C45.803 63.1358 43.1646 65.9023 39.8269 65.9874C36.4792 66.0733 33.6977 63.43 33.6189 60.088C33.5401 56.7465 36.1941 53.9753 39.5421 53.9037Z"
        fill="white"
      />
      <path
        d="M39.2974 57.937C40.4046 57.732 41.4699 58.4581 41.6816 59.5624C41.8933 60.6662 41.1719 61.7337 40.0671 61.9515C38.9533 62.1705 37.8733 61.4436 37.6599 60.3305C37.4466 59.2175 38.1811 58.1436 39.2974 57.937Z"
        fill="black"
      />
      {/* Dark vent details. */}
      <path
        d="M64.9453 57.9129C67.9706 57.8646 71.3018 57.8878 74.3303 57.9137L74.3251 66.0791C74.3255 67.3265 74.3732 68.8663 74.3147 70.0857L70.7545 70.0913C70.0859 70.0925 69.2583 70.1448 68.6112 70.0337C67.1847 69.7891 67.0285 68.4063 66.8083 67.3053L66.3467 64.9937L65.4574 60.5587C65.2852 59.697 65.0838 58.7762 64.9453 57.9129Z"
        fill="black"
      />
      <path
        d="M58.1497 44.8516L58.2041 44.8658C58.3094 45.0506 58.6538 46.9578 58.7246 47.3119L60.0339 53.877C58.9853 53.8898 58.4712 53.8247 57.5275 53.3767C56.6246 52.8939 55.8987 52.1709 55.4559 51.2449C54.9318 50.1446 54.8689 48.8813 55.2809 47.7347C55.8082 46.2471 56.7892 45.502 58.1497 44.8516Z"
        fill="black"
      />
      <defs>
        <filter
          id="helmetShadow"
          x="0.000964165"
          y="0.00045085"
          width="95.586"
          height="91.1973"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="3.87839" />
          <feGaussianBlur stdDeviation="6.59327" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1.55136" />
          <feGaussianBlur stdDeviation="2.71487" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
          <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape" />
        </filter>
      </defs>
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
  glow?: number
  /**
   * Reserve the abbreviation's space without painting it. Used when the caller
   * owns the abbreviation itself — the short form that flew in from the roller
   * stays as the card's abbreviation, so the card must not draw a second copy.
   */
  hideAbbrev?: boolean
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
  glow = 1,
  tiltDeg = 16,
  hideAbbrev = false,
}: RevealCardProps) {
  const reduceMotion = useReducedMotion()
  const stroke = team ? strokeColorFor(team, idleColor) : "transparent"
  const filled = stage === 2 && team !== null

  const ink = team ? readableOn(team.color) : "#ffffff"
  const gradient = team
    ? `linear-gradient(180deg, ${lighten(team.color, 0.22)} 0%, ${team.color} 46%, ${darken(team.color, 0.42)} 100%)`
    : idleColor
  // Helmet reads as team-tinted: the shell takes the secondary colour so it
  // stands out against the primary-colour gradient, with a darker shade beneath
  // as the base coat for depth.
  const helmetShell = team ? team.secondary : "#888"
  const helmetBase = team ? darken(team.secondary, 0.32) : "#5a5a5a"

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
          // The turn-in settles to flat. No post-turn scale pulse — the fill and
          // glow carry the payoff on their own.
          rotateY: 0,
          opacity: 1,
          boxShadow:
            filled && team && glow > 0
              ? `0 0 ${26 * glow}px ${team.color}${alphaHex(0.34 * glow)}, 0 0 ${52 * glow}px ${team.color}${alphaHex(0.16 * glow)}`
              : "0 10px 30px rgba(0,0,0,0.45)",
        }}
        transition={{
          // The turn finishes exactly as the fill begins (draw + hold).
          rotateY: { duration: reduceMotion ? 0 : (drawMs + holdMs) / 1000, ease: [0.22, 0.61, 0.36, 1] },
          opacity: { duration: 0.3 },
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
          className="absolute inset-0 flex flex-col items-center justify-between px-4"
          style={{ color: ink, paddingTop: CARD_PAD_Y, paddingBottom: CARD_PAD_Y }}
          initial={{ opacity: 0 }}
          animate={{ opacity: filled ? 1 : 0 }}
          transition={{ duration: fillMs / 1000, delay: filled ? 0.06 : 0 }}
        >
          {/* When the caller owns the abbreviation (the short form that flew in
              from the roller), this only reserves its space in the column. */}
          <span
            className="font-bold leading-none"
            style={{
              fontSize: cardAbbrevFontSize(height),
              letterSpacing: "0.04em",
              visibility: hideAbbrev ? "hidden" : "visible",
            }}
          >
            {team?.abbrev}
          </span>

          <TeamHelmet shell={helmetShell} base={helmetBase} size={Math.round(width * 0.62)} />

          <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] opacity-80">
              {team?.city}
            </span>
            <span className="text-lg font-bold leading-tight">{team?.name}</span>
          </div>
        </motion.div>

        {/* One-shot gloss shimmer — a single diagonal light band that sweeps
            across the face while the card turns in, then never repeats. It rides
            above the content but below the outline, is clipped by the card's
            overflow-hidden, and is skipped entirely for reduced motion. The band
            is wider than the card and starts fully off the left edge so no seam
            is visible at rest; `mix-blend-screen` makes it read as light on the
            gradient rather than a grey overlay. */}
        {!reduceMotion && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ mixBlendMode: "screen" }}
            aria-hidden="true"
            initial={{ x: "-140%", opacity: 0 }}
            animate={{ x: "140%", opacity: [0, 1, 1, 0] }}
            transition={{
              // Sweep spans the turn-in window so the shine tracks the tilt.
              duration: (drawMs + holdMs) / 1000,
              ease: [0.4, 0, 0.2, 1],
              opacity: { duration: (drawMs + holdMs) / 1000, times: [0, 0.15, 0.85, 1] },
            }}
          >
            <div
              className="absolute top-0 h-full"
              style={{
                // A band ~55% of the card width, angled and feathered at the edges.
                left: "-10%",
                width: "45%",
                transform: "skewX(-18deg)",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.15) 65%, transparent 100%)",
              }}
            />
          </motion.div>
        )}

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

/* ── Abbreviation geometry ────────────────────────────────────────────────────
   Shared so the flying short form can land exactly in the card's abbreviation
   slot. The flight is the *same* text element the card ends up showing, so these
   numbers have to come from one place rather than being guessed twice. */

/** Vertical padding of the card's content column, in px. */
export const CARD_PAD_Y = 20

/** Font size of the card's abbreviation for a given card height. */
export function cardAbbrevFontSize(height: number) {
  return Math.round(height * 0.16)
}

/**
 * Offset of the abbreviation's visual centre from the card's centre, in px
 * (negative = above centre). `leading-none` makes the line box the font size,
 * so the glyph centre sits half a font size below the content padding.
 */
export function cardAbbrevCenterOffset(height: number) {
  return -height / 2 + CARD_PAD_Y + cardAbbrevFontSize(height) / 2
}

/** 0–1 alpha as the 2-digit hex suffix an 8-digit colour needs. */
function alphaHex(a: number) {
  return Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, "0")
}
