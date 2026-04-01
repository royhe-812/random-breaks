"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CelebrationElements, HolographicShine } from "./celebration-elements"
import Image from "next/image"

const STARS_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBayLiveApp_Stars_DW_CC_v007_CC%202-OGJYd3jy5o3bamd4lN3498JekCYscy.png"

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
  const team = teams[0]

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      
      const shakeTimer = setTimeout(() => setPhase("shaking"), 200)
      const glowTimer = setTimeout(() => setPhase("glowing"), 800)
      const burstTimer = setTimeout(() => setPhase("burst"), 1400)
      const revealTimer = setTimeout(() => setPhase("revealed"), 1600)
      const completeTimer = setTimeout(() => onComplete(), 3500)
      
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
    <div className="relative w-60 h-80 flex items-center justify-center">
      {/* Holographic glow backdrop */}
      <AnimatePresence>
        {(phase === "glowing" || phase === "burst") && (
          <motion.div
            className="absolute w-48 h-48 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(167,139,250,0.5) 0%, rgba(139,92,246,0.3) 40%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2.5, opacity: 1 }}
            exit={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* Mystery Box */}
      <AnimatePresence>
        {phase !== "revealed" && (
          <motion.div
            className="relative w-44 h-52"
            animate={
              phase === "shaking" 
                ? { 
                    x: [0, -6, 6, -6, 6, -4, 4, 0],
                    rotate: [0, -3, 3, -3, 3, -1, 1, 0]
                  }
                : phase === "burst"
                ? { scale: 1.3, opacity: 0 }
                : {}
            }
            transition={
              phase === "shaking"
                ? { duration: 0.4, repeat: Infinity }
                : { duration: 0.2 }
            }
            exit={{ scale: 1.5, opacity: 0 }}
          >
            {/* Box body with premium holographic finish */}
            <div 
              className="absolute inset-0 rounded-2xl border-2 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 50%, #0f0f1a 100%)",
                borderColor: phase === "glowing" ? "#a78bfa" : "#4a4a6a",
                boxShadow: phase === "glowing" 
                  ? "0 0 40px rgba(167,139,250,0.5), inset 0 0 30px rgba(167,139,250,0.1)"
                  : "0 10px 40px rgba(0,0,0,0.5)",
              }}
            >
              {/* Holographic pattern overlay */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  background: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(167,139,250,0.1) 10px,
                    rgba(167,139,250,0.1) 12px
                  )`
                }}
              />
              
              {/* Box face pattern */}
              <div className="absolute inset-5 border-2 border-violet-500/30 rounded-xl flex items-center justify-center">
                <motion.div
                  className="text-7xl font-black text-violet-400/60"
                  animate={phase === "glowing" ? { 
                    scale: [1, 1.15, 1],
                    opacity: [0.6, 1, 0.6],
                    textShadow: [
                      "0 0 20px rgba(167,139,250,0.5)",
                      "0 0 40px rgba(167,139,250,0.8)",
                      "0 0 20px rgba(167,139,250,0.5)",
                    ]
                  } : {}}
                  transition={{ duration: 0.4, repeat: Infinity }}
                >
                  ?
                </motion.div>
              </div>
              
              {/* Glow seams */}
              <AnimatePresence>
                {phase === "glowing" && (
                  <>
                    <motion.div
                      className="absolute inset-x-0 top-0 h-1 rounded-full"
                      style={{ background: "linear-gradient(90deg, transparent, #a78bfa, transparent)" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-x-0 bottom-0 h-1 rounded-full"
                      style={{ background: "linear-gradient(90deg, transparent, #c4b5fd, transparent)" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.2, repeat: Infinity, delay: 0.1 }}
                    />
                    <motion.div
                      className="absolute inset-y-0 left-0 w-1 rounded-full"
                      style={{ background: "linear-gradient(180deg, transparent, #a78bfa, transparent)" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.2, repeat: Infinity, delay: 0.15 }}
                    />
                    <motion.div
                      className="absolute inset-y-0 right-0 w-1 rounded-full"
                      style={{ background: "linear-gradient(180deg, transparent, #c4b5fd, transparent)" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.2, repeat: Infinity, delay: 0.2 }}
                    />
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Box lid with holographic bow */}
            <motion.div
              className="absolute -top-5 inset-x-0 h-10 rounded-t-2xl border-2 border-b-0 overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #3a3a5e 0%, #2a2a4e 100%)",
                borderColor: phase === "glowing" ? "#a78bfa" : "#4a4a6a",
              }}
              animate={
                phase === "glowing"
                  ? { y: [0, -6, 0] }
                  : phase === "burst"
                  ? { y: -80, rotateX: -45, opacity: 0 }
                  : {}
              }
              transition={
                phase === "glowing"
                  ? { duration: 0.25, repeat: Infinity }
                  : { duration: 0.3 }
              }
            >
              {/* Holographic ribbon/bow */}
              <div 
                className="absolute inset-x-1/4 top-1/2 h-3 -translate-y-1/2 rounded-full"
                style={{
                  background: "linear-gradient(90deg, #a78bfa, #c4b5fd, #e9d5ff, #c4b5fd, #a78bfa)",
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Burst particles - holographic style */}
      <AnimatePresence>
        {phase === "burst" && (
          <>
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: 5 + Math.random() * 10,
                  height: 5 + Math.random() * 10,
                  background: i % 3 === 0 
                    ? `linear-gradient(135deg, #a78bfa, #c4b5fd)` 
                    : i % 3 === 1 
                    ? team.color 
                    : team.secondary,
                  borderRadius: i % 4 === 0 ? "50%" : "3px",
                  boxShadow: `0 0 8px ${i % 2 === 0 ? "#a78bfa" : team.color}`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  opacity: 0,
                  scale: 0,
                  rotate: Math.random() * 540,
                }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            ))}
            {/* Stars burst out */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute w-10 h-10"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
              >
                <Image src={STARS_URL} alt="" fill className="object-contain" />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Revealed team logo */}
      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div
            className="flex flex-col items-center relative"
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Celebration elements */}
            <CelebrationElements show={true} teamColor={team.color} />
            
            {/* Team logo container */}
            <motion.div
              className="relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}cc 100%)`,
                boxShadow: `0 0 60px ${team.color}60, 0 0 100px rgba(167,139,250,0.3)`,
              }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <HolographicShine />
              <span className="text-5xl font-black text-white relative z-10 drop-shadow-lg">
                {team.name.slice(0, 2).toUpperCase()}
              </span>
              
              {/* Orbit ring */}
              <motion.div
                className="absolute inset-[-12px] rounded-full border-2"
                style={{ borderColor: "#a78bfa" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              >
                <div 
                  className="absolute w-4 h-4 rounded-full -top-2 left-1/2 -translate-x-1/2"
                  style={{ 
                    background: "linear-gradient(135deg, #a78bfa, #c4b5fd)",
                    boxShadow: "0 0 10px #a78bfa",
                  }}
                />
              </motion.div>
            </motion.div>
            
            <motion.h3
              className="mt-8 text-3xl font-black text-white drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {team.name}
            </motion.h3>
            
            <motion.p
              className="text-violet-300 text-sm mt-2 font-medium"
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
