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
      
      // After 5.5 seconds total, complete
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

  if (!isRevealing || !team) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {/* Winner Text Phase */}
        {phase === "winner-text" && (
          <motion.div
            key="winner-text"
            className="relative flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -300, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            {/* Stacked WINNER text */}
            <div className="relative flex flex-col items-center">
              {[...Array(7)].map((_, i) => (
                <motion.span
                  key={i}
                  className="text-5xl font-black italic text-[#4CE160] leading-tight"
                  style={{ 
                    opacity: 1 - (i * 0.12),
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1 - (i * 0.12), 
                    y: 0,
                  }}
                  transition={{ 
                    delay: i * 0.08,
                    duration: 0.3,
                  }}
                >
                  WINNER
                </motion.span>
              ))}
              
              {/* Animated Crown */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ opacity: 0, scale: 0, y: 50 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  rotate: [0, -8, 8, -8, 0],
                }}
                transition={{ 
                  opacity: { delay: 0.5, duration: 0.3 },
                  scale: { delay: 0.5, duration: 0.5, type: "spring" },
                  y: { delay: 0.5, duration: 0.5 },
                  rotate: { delay: 1, duration: 0.6, repeat: Infinity, repeatDelay: 1 }
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.5 }}
                >
                  <Image 
                    src="/images/crown.png" 
                    alt="Crown" 
                    width={180} 
                    height={180}
                    className="drop-shadow-2xl"
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* Sparkle particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute rounded-full bg-[#4CE160]"
                style={{
                  width: 4 + (i % 3) * 2,
                  height: 4 + (i % 3) * 2,
                  left: `${20 + (i * 5)}%`,
                  top: `${20 + (i % 4) * 20}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Team Card Phase */}
        {phase === "team-card" && (
          <motion.div
            key="team-card"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Username banner */}
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-white font-bold text-xl">{username}</span>
              <span className="text-white/70 text-xl">Won!</span>
            </motion.div>

            {/* Team Card */}
            <motion.div
              className="relative rounded-2xl overflow-hidden p-8"
              style={{
                background: `linear-gradient(135deg, ${team.color}40 0%, ${team.color}20 50%, rgba(0,0,0,0.6) 100%)`,
                boxShadow: `0 0 60px ${team.color}60, 0 0 120px ${team.color}30`,
              }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
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
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
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
            {[...Array(8)].map((_, i) => (
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
        )}
      </AnimatePresence>
    </motion.div>
  )
}
