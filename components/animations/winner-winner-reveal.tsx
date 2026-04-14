"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import Image from "next/image"

interface Team {
  name: string
  city: string
  abbrev: string
  color: string
}

interface WinnerWinnerRevealProps {
  isRevealing: boolean
  team: Team | null
  onComplete: () => void
  username?: string
}

export function WinnerWinnerReveal({ isRevealing, team, onComplete, username = "KemMajed90" }: WinnerWinnerRevealProps) {
  const [phase, setPhase] = useState<"idle" | "winner-text" | "team-card" | "done">("idle")

  useEffect(() => {
    if (isRevealing && team) {
      // Start with winner text phase
      setPhase("winner-text")
      
      // After 2.5 seconds, transition to team card
      const teamCardTimer = setTimeout(() => setPhase("team-card"), 2500)
      
      // After 5.5 seconds total (3 seconds on card), complete
      const completeTimer = setTimeout(() => {
        setPhase("done")
        onComplete()
      }, 5500)
      
      return () => {
        clearTimeout(teamCardTimer)
        clearTimeout(completeTimer)
      }
    } else {
      setPhase("idle")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRevealing])

  // Don't render anything when done or not revealing
  if (!isRevealing || !team || phase === "done") return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background - similar to mystery pack with radial glow */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, rgba(76, 225, 96, 0.15) 0%, rgba(76, 225, 96, 0.05) 40%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Team Card - Always rendered underneath, revealed when winner text slides up */}
      <motion.div
        className="absolute flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ 
          opacity: phase === "team-card" ? 1 : 0, 
          y: phase === "team-card" ? 0 : 50 
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Username banner */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase === "team-card" ? 1 : 0, y: phase === "team-card" ? 0 : 20 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <span className="text-white font-bold text-xl">{username}</span>
          <span className="text-white/70 text-xl">Won!</span>
        </motion.div>

        {/* Team Card */}
        <motion.div
          className="relative rounded-2xl overflow-hidden p-8"
          style={{
            background: `linear-gradient(145deg, ${team.color} 0%, ${team.color}DD 50%, ${team.color}BB 100%)`,
            boxShadow: `0 0 60px ${team.color}80, 0 0 120px ${team.color}50`,
          }}
          initial={{ scale: 0.9 }}
          animate={{ scale: phase === "team-card" ? 1 : 0.9 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        >
          {/* Animated glow border */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ border: `2px solid ${team.color}` }}
            animate={{
              boxShadow: [
                `inset 0 0 20px ${team.color}30`,
                `inset 0 0 40px ${team.color}50`,
                `inset 0 0 20px ${team.color}30`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Sweeping gradient */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${team.color}30 50%, transparent 100%)`,
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Team abbreviation badge */}
            <motion.div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-2xl border-2 border-white"
              style={{ backgroundColor: team.color }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {team.abbrev}
            </motion.div>

            {/* Team name */}
            <div className="text-center">
              <p className="text-white/70 text-lg">{team.city}</p>
              <motion.p 
                className="text-white font-black text-3xl"
                style={{ textShadow: `0 0 20px ${team.color}` }}
              >
                {team.name}
              </motion.p>
            </div>

            {/* Your spot label */}
            <p className="text-white/50 text-sm mt-2">Your spot is assigned!</p>
          </div>
        </motion.div>

        {/* Floating sparkles around card */}
        {phase === "team-card" && [...Array(8)].map((_, i) => (
          <motion.div
            key={`card-sparkle-${i}`}
            className="absolute rounded-full"
            style={{
              width: 6,
              height: 6,
              background: i % 2 === 0 ? team.color : "#4CE160",
              left: `${15 + (i * 10)}%`,
              top: `${25 + (i % 3) * 25}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, -15, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>

      {/* Winner Text Phase - slides up with parallax to reveal card */}
      <AnimatePresence>
        {phase === "winner-text" && (
          <motion.div
            key="winner-text"
            className="relative flex flex-col items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stacked WINNER text - each line animates in smoothly then exits with parallax */}
            <div className="relative flex flex-col items-center -space-y-3">
              {[...Array(7)].map((_, i) => (
                <motion.span
                  key={i}
                  className="text-6xl font-black italic text-[#4CE160] leading-none tracking-tight"
                  style={{ 
                    opacity: 1 - (i * 0.1),
                  }}
                  initial={{ opacity: 0, y: 60, scale: 0.7 }}
                  animate={{ 
                    opacity: 1 - (i * 0.1), 
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    // Parallax effect - opposite of entrance (go back down with staggered speeds)
                    y: 200 + (i * 40),
                    opacity: 0,
                    scale: 0.7,
                  }}
                  transition={{ 
                    delay: i * 0.12,
                    duration: 0.5,
                    ease: [0.34, 1.56, 0.64, 1], // Spring-like easing
                    exit: { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
                  }}
                >
                  WINNER
                </motion.span>
              ))}
              
              {/* Animated Crown - 3x larger, centered over text */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ opacity: 0, scale: 0, y: 100 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                }}
                exit={{
                  // Crown exits fastest going back down (opposite of entrance)
                  y: 300,
                  opacity: 0,
                  scale: 0.3,
                }}
                transition={{ 
                  opacity: { delay: 0.8, duration: 0.4 },
                  scale: { delay: 0.8, duration: 0.6, type: "spring", stiffness: 200 },
                  y: { delay: 0.8, duration: 0.6 },
                  exit: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.08, 1],
                  }}
                  transition={{ 
                    rotate: { duration: 0.6, repeat: Infinity, repeatDelay: 1.2 },
                    scale: { duration: 0.8, repeat: Infinity, repeatDelay: 0.4 }
                  }}
                >
                  <Image 
                    src="/images/crown.png" 
                    alt="Crown" 
                    width={900} 
                    height={900}
                    className="drop-shadow-2xl"
                    style={{ filter: "drop-shadow(0 0 80px rgba(255, 215, 0, 0.7))" }}
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* Sparkle particles */}
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute rounded-full"
                style={{
                  width: 4 + (i % 4) * 2,
                  height: 4 + (i % 4) * 2,
                  background: i % 3 === 0 ? "#4CE160" : i % 3 === 1 ? "#FFD700" : "#fff",
                  left: `${10 + (i * 5)}%`,
                  top: `${15 + (i % 5) * 18}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                exit={{
                  y: 100 + (i * 20),
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: 0.5 + i * 0.1,
                  exit: { duration: 0.5 }
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
