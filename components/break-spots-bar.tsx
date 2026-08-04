"use client"

interface BreakSpotsBarProps {
  /** Spots still unclaimed. */
  availableSpots?: number
  /** Total spots in the break. */
  totalSpots?: number
  /** Opens the break spots sheet. The whole banner is the tap target. */
  onViewSpots?: () => void
}

/**
 * Progress ring for the spots counter.
 *
 * Geometry follows the Figma frame — 16px box, 2px stroke, #707070 track — while
 * the arc colour keeps the threshold scale already used by the spinner cards so
 * a nearly-full break reads green and a nearly-sold-out one reads red.
 */
function SpotsRing({ available, total, size = 16 }: { available: number; total: number; size?: number }) {
  const pct = total > 0 ? (available / total) * 100 : 0
  const sw = 2
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct <= 25 ? "#ef4444" : pct <= 50 ? "#f97316" : pct <= 75 ? "#eab308" : "#4ce160"
  return (
    <svg className="transform -rotate-90 flex-shrink-0" width={size} height={size} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#707070" strokeWidth={sw} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
      />
    </svg>
  )
}

/**
 * Inline contextual "N/M spots available" banner (Figma "Incentive Tile").
 *
 * Rather than a standalone box, this sits flush on top of the spinner card and
 * rounds only its top corners, so banner + card read as one attached unit. The
 * parent must render it immediately before the card, in a wrapper with no gap,
 * and the card must round only its bottom corners.
 *
 * The Figma tile is 52px tall with 16px of bottom padding tucked *behind* an
 * opaque buy box. That trick can't be reused here because the spinner card is
 * translucent glass over the video — a tucked strip bleeds through it. Matching
 * the tile's 36px visible height instead reproduces the same result exactly.
 *
 * The entire banner is one button so the counter and the label open the same
 * sheet. That's also why "View all" is a span — a nested <button> would be
 * invalid HTML.
 */
export function BreakSpotsBar({ availableSpots = 15, totalSpots = 32, onViewSpots }: BreakSpotsBarProps) {
  return (
    <button
      type="button"
      onClick={onViewSpots}
      aria-label={`${availableSpots} of ${totalSpots} spots available. View all spots.`}
      className="flex min-h-9 w-full items-center justify-between gap-2 rounded-t-2xl bg-[#363636] px-3 py-2 text-left transition-opacity hover:opacity-90"
    >
      {/* Counter — 4px between ring and label */}
      <span className="flex min-w-0 items-center gap-1">
        <SpotsRing available={availableSpots} total={totalSpots} />
        <span className="truncate text-xs leading-4 text-[#f7f7f7]">
          {availableSpots}/{totalSpots} spots available
        </span>
      </span>

      {/* Text-only CTA — the frame drops the chevron and underlines the label */}
      <span className="flex-shrink-0 text-xs leading-4 text-[#4d93fc] underline">View all</span>
    </button>
  )
}
