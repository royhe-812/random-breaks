"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const teams = [
  { name: "Chiefs", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", color: "#003594", secondary: "#869397" },
  { name: "49ers", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", color: "#008E97", secondary: "#FC4C02" },
]

interface MysteryBoxRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

export function MysteryBoxReveal({ isRevealing, onComplete }: MysteryBoxRevealProps) {
  const [phase, setPhase] = useState<"idle" | "shaking" | "glowing" | "burst" | "revealed">("idle")
  const [team, setTeam] = useState(teams[0])

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      setTeam(teams[Math.floor(Math.random() * teams.length)])
      
      const shakeTimer = setTimeout(() => setPhase("shaking"), 200)
      const glowTimer = setTimeout(() => setPhase("glowing"), 800)
      const burstTimer = setTimeout(() => setPhase("burst"), 1400)
      const revealTimer = setTimeout(() => setPhase("revealed"), 1600)
      const completeTimer = setTimeout(() => onComplete(), 3000)
      
      return () => {
        clearTimeout(shakeTimer)
        clearTimeout(glowTimer)
        clearTimeout(burstTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-56 h-72 flex items-center justify-center">
      {/* Glow backdrop */}
      <AnimatePresence>
        {(phase === "glowing" || phase === "burst") && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${team.secondary}40 0%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 1 }}
            exit={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* Mystery Box */}
      <AnimatePresence>
        {phase !== "revealed" && (
          <motion.div
            className="relative w-40 h-48"
            animate={
              phase === "shaking" 
                ? { 
                    x: [0, -5, 5, -5, 5, -3, 3, 0],
                    rotate: [0, -2, 2, -2, 2, -1, 1, 0]
                  }
                : phase === "burst"
                ? { scale: 1.2, opacity: 0 }
                : {}
            }
            transition={
              phase === "shaking"
                ? { duration: 0.5, repeat: Infinity }
                : { duration: 0.2 }
            }
            exit={{ scale: 1.5, opacity: 0 }}
          >
            {/* Box body */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-lg border-2 border-zinc-600">
              {/* Box face pattern */}
              <div className="absolute inset-4 border border-zinc-600 rounded flex items-center justify-center">
                <motion.div
                  className="text-6xl"
                  animate={phase === "glowing" ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  ?
                </motion.div>
              </div>
              
              {/* Glow seams */}
              <AnimatePresence>
                {phase === "glowing" && (
                  <>
                    <motion.div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ backgroundColor: team.secondary }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-x-0 bottom-0 h-1"
                      style={{ backgroundColor: team.secondary }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
                    />
                    <motion.div
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ backgroundColor: team.secondary }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.3, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="absolute inset-y-0 right-0 w-1"
                      style={{ backgroundColor: team.secondary }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.3, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Box lid */}
            <motion.div
              className="absolute -top-4 inset-x-0 h-8 bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-t-lg border-2 border-zinc-500"
              animate={
                phase === "glowing"
                  ? { y: [0, -4, 0] }
                  : phase === "burst"
                  ? { y: -60, rotateX: -45, opacity: 0 }
                  : {}
              }
              transition={
                phase === "glowing"
                  ? { duration: 0.3, repeat: Infinity }
                  : { duration: 0.3 }
              }
            >
              <div className="absolute inset-x-1/3 top-1/2 h-2 -translate-y-1/2 bg-amber-500 rounded-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Burst particles */}
      <AnimatePresence>
        {phase === "burst" && (
          <>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: 4 + Math.random() * 8,
                  height: 4 + Math.random() * 8,
                  backgroundColor: i % 2 === 0 ? team.color : team.secondary,
                  borderRadius: i % 3 === 0 ? "50%" : "2px",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 250,
                  y: (Math.random() - 0.5) * 250,
                  opacity: 0,
                  scale: 0,
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Revealed team logo */}
      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div
            className="flex flex-col items-center"
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Floating glow ring */}
            <motion.div
              className="absolute w-32 h-32 rounded-full"
              style={{
                background: `radial-gradient(circle, ${team.secondary}30 0%, transparent 70%)`,
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Team logo container */}
            <motion.div
              className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}cc 100%)`,
                boxShadow: `0 0 40px ${team.color}60`,
              }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-4xl font-black text-white">
                {team.name.slice(0, 2).toUpperCase()}
              </span>
              
              {/* Orbit ring */}
              <motion.div
                className="absolute inset-[-8px] rounded-full border-2"
                style={{ borderColor: team.secondary }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <div 
                  className="absolute w-3 h-3 rounded-full -top-1.5 left-1/2 -translate-x-1/2"
                  style={{ backgroundColor: team.secondary }}
                />
              </motion.div>
            </motion.div>
            
            <motion.h3
              className="mt-6 text-2xl font-black text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {team.name}
            </motion.h3>
            
            <motion.p
              className="text-zinc-400 text-sm mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Your team has been revealed!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
