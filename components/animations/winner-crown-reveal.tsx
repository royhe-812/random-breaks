"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import Image from "next/image"

interface WinnerCrownRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

// Crown + stacked "WINNER" celebration that plays right after a bid is won,
// before the randomizer runs. No team is shown here (none is decided yet).
export function WinnerCrownReveal({ isRevealing, onComplete }: WinnerCrownRevealProps) {
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
