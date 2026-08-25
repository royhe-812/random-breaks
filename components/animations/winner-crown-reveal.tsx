"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import Image from "next/image"

interface WinnerCrownRevealProps {
  isRevealing: boolean
  onComplete: () => void
  /**
   * "subtle"   — ambient floaters over the stream (see FLOATERS).
   * "takeover" — the full-screen treatment scoped to the bid box. Must be
   *              rendered INSIDE the bid-box wrapper, since it fills its parent.
   */
  variant?: "default" | "subtle" | "takeover"
}

/* Stacked "WINNER" lines in the in-box takeover, per the Figma frame. Six is
   from the design, and it's also what fills a ~215px box without the type
   getting too small to read. */
const TAKEOVER_LINES = 6

/* Ambient floaters for the "subtle" variant, modelled on the tap-a-heart effect
   in live streams: a few elements rise out of the bottom corners, drift gently
   inward, and fade before they reach the middle.

   Deliberately a fixed table rather than randomised per play — these concepts
   exist to be compared side by side, and randomised sizes/lanes would mean no
   two viewings of the same concept are the same animation.

   `lane` is the inset from that floater's own edge. Kept small so elements hug
   the left/right margins of a ~440px frame and never cross the middle, and every
   floater must FINISH before the 2700ms onComplete that starts the randomizer:
   max here is 0.9 + 1.65 = 2.55s. Text is sized down from the takeover's
   text-6xl — at that scale two words span the frame and stop reading as ambient.

   `size` is a px font-size rather than a Tailwind class: the scale here is tuned
   by percentage, and Tailwind's steps can't express those values (a +30% pass
   turns 24 into 31 and 30 into 39, neither of which is a step). */
const FLOATERS = [
  { side: "left", kind: "text", lane: 6, delay: 0, duration: 1.75, drift: 16, rise: 0.56, tilt: -7, size: 39, crown: 57 },
  { side: "right", kind: "crown", lane: 18, delay: 0.22, duration: 1.8, drift: -18, rise: 0.62, tilt: 9, size: 31, crown: 55 },
  { side: "left", kind: "crown", lane: 30, delay: 0.44, duration: 1.7, drift: 15, rise: 0.5, tilt: -5, size: 31, crown: 44 },
  { side: "right", kind: "text", lane: 5, delay: 0.6, duration: 1.85, drift: -17, rise: 0.64, tilt: 6, size: 39, crown: 57 },
  { side: "left", kind: "text", lane: 26, delay: 0.78, duration: 1.7, drift: 14, rise: 0.52, tilt: -9, size: 31, crown: 44 },
  { side: "right", kind: "text", lane: 24, delay: 0.9, duration: 1.65, drift: -16, rise: 0.58, tilt: 7, size: 31, crown: 49 },
] as const

// Crown + stacked "WINNER" celebration that plays right after a bid is won,
// before the randomizer runs. No team is shown here (none is decided yet).
export function WinnerCrownReveal({ isRevealing, onComplete, variant = "default" }: WinnerCrownRevealProps) {
  const [phase, setPhase] = useState<"idle" | "show" | "out">("idle")
  /* Height of the device frame, measured from the overlay itself. The subtle
     variant's rise is a fraction of it, expressed in PIXELS: Framer Motion
     silently fails on container units (a `cqh` value stopped the whole
     animation, opacity included), and a percentage transform would resolve
     against each floater's own height rather than the frame's. Pixels are also
     scale-safe, since the frame's scale-to-fit transform scales them with it. */
  const [frameH, setFrameH] = useState<number | null>(null)
  /* Height of the bid box, for the takeover variant. The type has to be sized
     off the actual box rather than hardcoded: the box grows in multi mode, and a
     fixed font-size would either overflow it or leave it half empty. Same
     withhold-until-measured guard as above. */
  const [boxH, setBoxH] = useState<number | null>(null)

  useEffect(() => {
    if (isRevealing) {
      setPhase("show")
      // Hold the celebration, then trigger the parallax exit.
      const outTimer = setTimeout(() => setPhase("out"), 2000)
      // After the exit animation completes, hand control back to the caller.
      const doneTimer = setTimeout(() => {
        setPhase("idle")
        onComplete()
      }, 2700)
      return () => {
        clearTimeout(outTimer)
        clearTimeout(doneTimer)
      }
    } else {
      setPhase("idle")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRevealing])

  if (!isRevealing || phase === "idle") return null

  /* Subtle variant: no scrim, no blur, no green pulse — the stream stays fully
     visible and (via pointer-events-none) fully interactive, which is what makes
     this read as ambient rather than as a takeover. Floaters are rendered for
     both "show" and "out" because each one self-terminates on its own keyframes;
     gating them on "show" would cut them off mid-rise when the phase flips at
     2000ms. */
  if (variant === "subtle") {
    return (
      /* `absolute`, not `fixed`: this renders INSIDE the phone frame so the
         floaters travel over the stream. As `fixed` they were laid out against
         the browser viewport and drifted across the desktop background beside
         the device — invisible on a real phone, but wrong in this prototype. */
      <div
        className="absolute inset-0 z-50 overflow-hidden pointer-events-none"
        /* Measured on attach. Floaters are withheld until the height is known
           (one frame) so none of them animates against a stale guess. */
        ref={(el) => {
          if (el && frameH === null) setFrameH(el.offsetHeight)
        }}
      >
        {frameH !== null &&
          FLOATERS.map((f, i) => (
          <motion.div
            key={i}
            /* Parked at the frame's bottom edge, then translated upward. */
            className="absolute bottom-0"
            style={f.side === "left" ? { left: f.lane } : { right: f.lane }}
            initial={{ y: 0, x: 0, opacity: 0, scale: 0.9 }}
            animate={{
              /* Rise from the bottom edge to above the vertical middle. Each
                 floater ends on its own line so they don't all stop in a row. */
              y: [0, -frameH * f.rise],
              /* Slight inward lean, with a small mid-flight wobble so the drift
                 reads as buoyant rather than as a straight linear slide. */
              x: [0, f.drift * 0.35, f.drift * 0.7, f.drift],
              /* Peaks below full opacity: these pass over chat and the bid
                 controls, and at 1.0 they read as UI rather than as an overlay. */
              opacity: [0, 0.92, 0.82, 0],
              scale: [0.9, 1, 1, 1.02],
              /* Settles upright from a slight tilt, which sells the drift as
                 buoyant rather than as a straight mechanical slide. */
              rotate: [f.tilt, f.tilt * 0.4, 0],
            }}
            transition={{
              duration: f.duration,
              delay: f.delay,
              ease: "easeOut",
              /* Fade in fast, hold, then fade out over the last third so nothing
                 pops out of existence at full opacity. */
              opacity: { duration: f.duration, delay: f.delay, times: [0, 0.16, 0.6, 1] },
              x: { duration: f.duration, delay: f.delay, times: [0, 0.35, 0.7, 1] },
              scale: { duration: f.duration, delay: f.delay, times: [0, 0.16, 0.6, 1] },
              rotate: { duration: f.duration, delay: f.delay, times: [0, 0.5, 1] },
            }}
          >
            {f.kind === "crown" ? (
              <Image
                src="/images/crown.png"
                alt=""
                width={f.crown}
                height={f.crown}
                style={{
                  width: f.crown,
                  height: "auto",
                  filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.5))",
                }}
              />
            ) : (
              <span
                className="font-black italic text-[#4CE160] leading-none tracking-tight whitespace-nowrap"
                /* With no scrim behind it, the text needs its own contrast
                   against a bright stream frame. */
                style={{ fontSize: f.size, textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}
              >
                WINNER
              </span>
            )}
          </motion.div>
        ))}
      </div>
    )
  }

  /* Takeover: the full-screen treatment confined to the bid box. `absolute
     inset-0` fills whatever it's mounted in, so the caller controls the
     footprint — it must be a child of the bid-box wrapper, not the device frame.
     Rounded + clipped so the crowns and the dropping text can't spill past the
     card's corners. */
  if (variant === "takeover") {
    const lineH = boxH ? (boxH * 0.9) / TAKEOVER_LINES : 0
    return (
      <div
        className="absolute inset-0 z-40 overflow-hidden rounded-2xl pointer-events-none"
        ref={(el) => {
          if (el && boxH === null) setBoxH(el.offsetHeight)
        }}
      >
        {/* Scrim. Deliberately not fully opaque: the bid box's own content stays
            faintly visible underneath, which is what makes this read as the box
            being taken OVER rather than swapped for a different card. */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "show" ? 1 : 0 }}
          transition={{ duration: phase === "show" ? 0.25 : 0.4 }}
        />
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(76,225,96,0.18) 0%, rgba(76,225,96,0.06) 45%, transparent 72%)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <AnimatePresence>
          {phase === "show" && boxH !== null && (
            <motion.div key="box-takeover" className="absolute inset-0">
              {/* Stacked lines, each fading slightly further back — the same
                  depth cue as the full-screen version, and they rise in on a
                  stagger then drop out together. */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {[...Array(TAKEOVER_LINES)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="font-black text-[#4CE160] tracking-tight whitespace-nowrap"
                    style={{
                      fontSize: lineH / 0.78,
                      lineHeight: `${lineH}px`,
                      opacity: 1 - i * 0.1,
                    }}
                    initial={{ opacity: 0, y: lineH * 1.6, scale: 0.72 }}
                    animate={{ opacity: 1 - i * 0.1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: boxH * 0.75 + i * 14, scale: 0.72 }}
                    transition={{
                      delay: i * 0.07,
                      duration: 0.42,
                      ease: [0.34, 1.56, 0.64, 1],
                      exit: { duration: 0.5, delay: 0, ease: [0.4, 0, 0.2, 1] },
                    }}
                  >
                    WINNER
                  </motion.span>
                ))}
              </div>

              {/* Crowns flank the stack — upper-left and lower-right, sized and
                  placed as percentages of the box so they hold their composition
                  whether the box is in single or multi height. */}
              {([
                { side: "left", w: 27, pos: { left: "1%", top: "4%" }, rot: -12, delay: 0.5 },
                { side: "right", w: 26, pos: { right: "1%", bottom: "4%" }, rot: 12, delay: 0.62 },
              ] as const).map((c) => (
                <motion.div
                  key={c.side}
                  className="absolute"
                  style={{ ...c.pos, width: `${c.w}%` }}
                  initial={{ opacity: 0, scale: 0.3, y: boxH * 0.3, rotate: c.rot }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.4, y: boxH * 0.8, rotate: c.rot }}
                  transition={{
                    opacity: { delay: c.delay, duration: 0.3 },
                    scale: { delay: c.delay, type: "spring", stiffness: 220, damping: 14 },
                    y: { delay: c.delay, duration: 0.45 },
                    rotate: { delay: c.delay, duration: 0.5 },
                    exit: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
                  }}
                >
                  <Image
                    src="/images/crown.png"
                    alt=""
                    width={240}
                    height={240}
                    style={{
                      width: "100%",
                      height: "auto",
                      filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.55))",
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background - matching the card flip reveal */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, rgba(76, 225, 96, 0.15) 0%, rgba(76, 225, 96, 0.05) 40%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* WINNER text + crown */}
      <AnimatePresence>
        {phase === "show" && (
          <motion.div
            key="winner-text"
            className="relative flex flex-col items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative flex flex-col items-center -space-y-3">
              {[...Array(7)].map((_, i) => (
                <motion.span
                  key={i}
                  className="text-6xl font-black italic text-[#4CE160] leading-none tracking-tight"
                  style={{ opacity: 1 - i * 0.1 }}
                  initial={{ opacity: 0, y: 60, scale: 0.7 }}
                  animate={{ opacity: 1 - i * 0.1, y: 0, scale: 1 }}
                  exit={{ y: 200 + i * 40, opacity: 0, scale: 0.7 }}
                  transition={{
                    delay: i * 0.12,
                    duration: 0.5,
                    ease: [0.34, 1.56, 0.64, 1],
                    exit: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                  }}
                >
                  WINNER
                </motion.span>
              ))}

              {/* Animated crown, centered over the text */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ opacity: 0, scale: 0, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ y: 300, opacity: 0, scale: 0.3 }}
                transition={{
                  opacity: { delay: 0.8, duration: 0.4 },
                  scale: { delay: 0.8, duration: 0.6, type: "spring", stiffness: 200 },
                  y: { delay: 0.8, duration: 0.6 },
                  exit: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.08, 1] }}
                  transition={{
                    rotate: { duration: 0.6, repeat: Infinity, repeatDelay: 1.2 },
                    scale: { duration: 0.8, repeat: Infinity, repeatDelay: 0.4 },
                  }}
                >
                  <Image
                    src="/images/crown.png"
                    alt="Crown"
                    width={1200}
                    height={1200}
                    className="drop-shadow-2xl"
                    style={{ filter: "drop-shadow(0 0 100px rgba(255, 215, 0, 0.7))" }}
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
