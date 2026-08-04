"use client"

interface BreakSpotsBarProps {
  /** Spots still unclaimed. */
  availableSpots?: number
  /** Total spots in the break. */
  totalSpots?: number
  /** Opens the break spots sheet. The whole bar is the tap target. */
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
 * Standalone "N/M spots available" bar that sits above the spinner card.
 *
 * The entire bar is one button rather than just the "View all" affordance, so
 * the counter and the label open the same break spots sheet. That's also why
 * "View all" is a span — a nested <button> would be invalid HTML.
 */
export function BreakSpotsBar({ availableSpots = 15, totalSpots = 32, onViewSpots }: BreakSpotsBarProps) {
  return (
    <button
      type="button"
      onClick={onViewSpots}
      aria-label={`${availableSpots} of ${totalSpots} spots available. View all spots.`}
      className="w-full flex items-center justify-between gap-3 rounded-2xl bg-[#363636]/50 px-3 backdrop-blur transition-opacity hover:opacity-90"
    >
      {/* Counter — 4px between ring and label */}
      <span className="flex items-center gap-1 min-w-0">
        <SpotsRing available={availableSpots} total={totalSpots} />
        <span className="truncate text-xs leading-4 text-[#f7f7f7]">
          {availableSpots}/{totalSpots} spots available
        </span>
      </span>

      {/* View all — its 6px vertical padding is what gives the bar its 32px height */}
      <span className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-full px-2 py-1.5">
        <span className="text-sm leading-5 text-[#f7f7f7]">View all</span>
        <img src="/figma/spots-chevron.svg" alt="" aria-hidden="true" className="h-4 w-4" />
      </span>
    </button>
  )
}
