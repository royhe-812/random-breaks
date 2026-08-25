"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import Image from "next/image"

interface WinnerCrownRevealProps {
  isRevealing: boolean
  onComplete: () => void
  /** "subtle" swaps the full-screen takeover for ambient floaters. See FLOATERS. */
  variant?: "default" | "subtle"
}

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
   text-6xl — at that scale two words span the frame and stop reading as ambient. */
const FLOATERS = [
  { side: "left", kind: "text", lane: 8, delay: 0, duration: 1.75, drift: 20, rise: 0.54, size: "text-xl", crown: 30 },
  { side: "right", kind: "crown", lane: 16, delay: 0.22, duration: 1.8, drift: -16, rise: 0.6, size: "text-lg", crown: 26 },
  { side: "left", kind: "crown", lane: 26, delay: 0.44, duration: 1.7, drift: 14, rise: 0.48, size: "text-lg", crown: 22 },
  { side: "right", kind: "text", lane: 6, delay: 0.6, duration: 1.85, drift: -22, rise: 0.62, size: "text-2xl", crown: 30 },
  { side: "left", kind: "text", lane: 20, delay: 0.78, duration: 1.7, drift: 12, rise: 0.5, size: "text-lg", crown: 22 },
  { side: "right", kind: "text", lane: 22, delay: 0.9, duration: 1.65, drift: -14, rise: 0.56, size: "text-xl", crown: 26 },
] as const

// Crown + stacked "WINNER" celebration that plays right after a bid is won,
// before the randomizer runs. No team is shown here (none is decided yet).
export function WinnerCrownReveal({ isRevealing, onComplete, variant = "default" }: WinnerCrownRevealProps) {
  const [phase, setPhase] = useState<"idle" | "show" | "out">("idle")

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
        /* Establishes the container that the floaters' `cqh` travel resolves
           against, i.e. the device frame this overlay fills. */
        style={{ containerType: "size" }}
      >
        {FLOATERS.map((f, i) => (
          <motion.div
            key={i}
            /* Parked just below the frame's bottom edge, then translated upward
               with a transform. Distances are `cqh` (percent of the device
               frame, made a container below) rather than `vh`, so the travel
               tracks the phone rather than the desktop viewport, and rather than
               a percentage transform, which would resolve against the element's
               own height instead of the frame's. */
            className="absolute bottom-0"
            style={f.side === "left" ? { left: f.lane } : { right: f.lane }}
            initial={{ y: 0, x: 0, opacity: 0, scale: 0.9 }}
            animate={{
              /* Rise from the bottom edge to above the vertical middle. Each
                 floater ends on its own line so they don't all stop in a row. */
              y: [0, `-${f.rise * 100}cqh`],
              /* Slight inward lean, with a small mid-flight wobble so the drift
                 reads as buoyant rather than as a straight linear slide. */
              x: [0, f.drift * 0.35, f.drift * 0.7, f.drift],
              opacity: [0, 1, 1, 0],
              scale: [0.9, 1, 1, 1.02],
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
                className={`${f.size} font-black italic text-[#4CE160] leading-none tracking-tight whitespace-nowrap`}
                /* With no scrim behind it, the text needs its own contrast
                   against a bright stream frame. */
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}
              >
                WINNER
              </span>
            )}
          </motion.div>
        ))}
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
