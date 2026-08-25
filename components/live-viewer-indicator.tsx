"use client"

/**
 * Live viewer indicator — the top item in the stream's right-hand action rail.
 *
 * Replaces the old raster avatar (`Stream navigation avatar…png`) with the
 * ".Nav item" frame from the 2026 Buyer Handoff file (node 25300:8726). That
 * frame is three concentric circles in one green, so it is drawn in CSS rather
 * than exported as artwork: it has to animate, and a PNG could not pulse.
 *
 * Figma geometry, kept literal:
 *   - 14px icon box, 4px gap, count below, centred
 *   - Ellipse 3 — 14px, #4ce160 @ 20%
 *   - Ellipse 2 — 10px, #4ce160 @ 20%
 *   - Ellipse 1 —  6px, #4ce160 @ 100%
 *   - label — 10px/12px, #f7f7f7
 *
 * The 14px icon is deliberately smaller than the 24px icons below it in the
 * rail: in the source frame this is a status dot, not an icon, and scaling it up
 * to match would turn a quiet indicator into the loudest thing in the rail.
 */

/** Single green used by all three circles (Figma `#4ce160`). */
const LIVE_GREEN = "#4ce160"
/** Off-white label colour (Figma `#f7f7f7`), not pure white. */
const LIVE_LABEL = "#f7f7f7"

export function LiveViewerIndicator({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Icon box matches the Figma 14px frame. `relative` anchors the two
          absolutely-positioned halos so all three circles share one centre. */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 14, height: 14 }}
      >
        {/* Ellipse 3 — outer halo. aria-hidden: the accessible name comes from
            the count's own label below, so screen readers get one string
            instead of three decorative rings. */}
        <span
          aria-hidden="true"
          className="live-dot-halo absolute rounded-full"
          style={{ width: 14, height: 14, backgroundColor: LIVE_GREEN, opacity: 0.2 }}
        />
        {/* Ellipse 2 — inner halo, offset so the breath expands outward. */}
        <span
          aria-hidden="true"
          className="live-dot-halo live-dot-halo--inner absolute rounded-full"
          style={{ width: 10, height: 10, backgroundColor: LIVE_GREEN, opacity: 0.2 }}
        />
        {/* Ellipse 1 — solid core. Static: it carries the "live" signal, and
            moving it would read as a glitch at this size. */}
        <span
          aria-hidden="true"
          className="absolute rounded-full"
          style={{ width: 6, height: 6, backgroundColor: LIVE_GREEN }}
        />
      </div>

      {/* Tabular figures so a fluctuating count does not shift the rail's width
          as digits change. `leading-3` is the Figma 12px line-height on 10px. */}
      <span
        className="font-normal leading-3 tabular-nums"
        style={{ fontSize: 10, color: LIVE_LABEL }}
      >
        <span className="sr-only">{"Viewers watching: "}</span>
        {count.toLocaleString()}
      </span>
    </div>
  )
}
