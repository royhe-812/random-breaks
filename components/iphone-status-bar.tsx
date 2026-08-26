"use client"

/**
 * iOS hardware chrome for the prototype's device frame: the Dynamic Island plus
 * the status bar (clock, cellular, Wi-Fi, battery).
 *
 * Geometry is taken from the iPhone 17 Pro Max the frame is already sized to
 * (440 x 956 CSS px), so these are real device numbers rather than eyeballed
 * ones: the island is 126 x 37 sitting 11px below the top edge, and the status
 * bar band is 54px tall.
 *
 * The icons are hand-drawn SVGs rather than font glyphs. The earlier status bar
 * in testing-zone.tsx used "▮▮▮" as a stand-in for the indicators, which is
 * exactly the kind of glyph that renders as tofu once a display font without
 * that codepoint is in play.
 *
 * `pointer-events-none` on the root matters: this sits above the whole
 * prototype at z-[60], so without it the island would swallow clicks aimed at
 * the stream UI underneath.
 */

/** Signal strength as 4 stepped bars. */
function CellularIcon() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
      {[
        { x: 0, h: 4 },
        { x: 4.7, h: 6.7 },
        { x: 9.4, h: 9.3 },
        { x: 14.1, h: 12 },
      ].map((bar) => (
        // Bars are bottom-anchored, so y is derived from the icon height.
        <rect key={bar.x} x={bar.x} y={12 - bar.h} width="3.2" height={bar.h} rx="1" fill="currentColor" />
      ))}
    </svg>
  )
}

function WifiIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
      <path d="M1.4 4.2a10.4 10.4 0 0 1 14.2 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.2 7.1a6.3 6.3 0 0 1 8.6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8.5" cy="10.3" r="1.5" fill="currentColor" />
    </svg>
  )
}

/** @param level 0–1. Drives the fill width so the icon can't lie about charge. */
function BatteryIcon({ level }: { level: number }) {
  const clamped = Math.max(0, Math.min(1, level))
  // Inner track runs from x=2 to x=22 inside the 24-wide shell.
  const fillWidth = 20 * clamped

  return (
    <svg width="28" height="13" viewBox="0 0 28 13" fill="none" aria-hidden="true">
      <rect x="0.6" y="0.6" width="22.8" height="11.8" rx="3.7" stroke="currentColor" strokeOpacity="0.38" strokeWidth="1.2" />
      <rect x="2" y="2" width={fillWidth} height="9" rx="2.4" fill="currentColor" />
      {/* Positive terminal nub */}
      <path d="M25.4 4.7c1 .35 1 3.25 0 3.6V4.7Z" fill="currentColor" fillOpacity="0.38" />
    </svg>
  )
}

export function IPhoneStatusBar({
  time = "9:41",
  batteryLevel = 0.9,
}: {
  time?: string
  batteryLevel?: number
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[60] h-[54px]">
      {/* Dynamic Island. Pure black rather than a token colour — it represents a
          cutout in the display, not a themed surface. */}
      <div className="absolute left-1/2 top-[11px] h-[37px] w-[126px] -translate-x-1/2 rounded-full bg-black" />

      <div className="flex h-[48px] items-center justify-between px-[30px] text-white">
        {/* tabular-nums so the clock doesn't reflow if the time is changed. */}
        <span className="text-[17px] font-semibold tracking-tight tabular-nums">{time}</span>
        <div className="flex items-center gap-[7px]">
          <CellularIcon />
          <WifiIcon />
          <BatteryIcon level={batteryLevel} />
        </div>
      </div>
    </div>
  )
}
