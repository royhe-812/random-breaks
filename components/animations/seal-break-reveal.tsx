"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CelebrationElements, HolographicShine } from "./celebration-elements"
import Image from "next/image"

const FIRE_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBay_Live_Emoji_a_v008_Fire.0072%202-IVWHtqVd8MJLUNA3EfYsVshGT1EjUg.png"

const teams = [
  { name: "Chiefs", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", color: "#003594", secondary: "#869397" },
  { name: "49ers", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", color: "#008E97", secondary: "#FC4C02" },
]

interface SealBreakRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

export function SealBreakReveal({ isRevealing, onComplete }: SealBreakRevealProps) {
  const [phase, setPhase] = useState<"idle" | "heating" | "cracking" | "breaking" | "revealed">("idle")
  const team = teams[0]

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      
      const heatTimer = setTimeout(() => setPhase("heating"), 200)
      const crackTimer = setTimeout(() => setPhase("cracking"), 900)
      const breakTimer = setTimeout(() => setPhase("breaking"), 1400)
      const revealTimer = setTimeout(() => setPhase("revealed"), 1700)
      const completeTimer = setTimeout(() => onComplete(), 3700)
      
      return () => {
        clearTimeout(heatTimer)
        clearTimeout(crackTimer)
        clearTimeout(breakTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-60 h-80 flex items-center justify-center">
      {/* Heat glow - now with holographic purple tint */}
      <AnimatePresence>
        {(phase === "heating" || phase === "cracking") && (
          <motion.div
            className="absolute w-48 h-48 rounded-full"
            style={{
              background: `radial-gradient(circle, 
                rgba(167,139,250,0.3) 0%, 
                rgba(239,68,68,0.3) 30%, 
                transparent 70%
              )`,
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: phase === "cracking" ? 1.8 : 1.2, 
              opacity: phase === "cracking" ? 1 : 0.6 
            }}
            exit={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Wax Seal - Premium holographic finish */}
      <AnimatePresence>
        {phase !== "revealed" && (
          <motion.div
            className="relative"
            animate={
              phase === "breaking"
                ? { scale: 1.4, opacity: 0 }
                : {}
            }
            transition={{ duration: 0.3 }}
          >
            {/* Seal base with premium gradient */}
            <motion.div
              className="relative w-36 h-36 rounded-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, 
                  #a78bfa 0%, 
                  #8b5cf6 30%, 
                  #7c3aed 60%, 
                  #6d28d9 100%
                )`,
                boxShadow: phase === "heating" || phase === "cracking"
                  ? "0 0 40px rgba(167,139,250,0.7), inset 0 -8px 20px rgba(0,0,0,0.3)"
                  : "0 12px 30px rgba(0,0,0,0.5), inset 0 -8px 20px rgba(0,0,0,0.3)",
              }}
              animate={
                phase === "heating"
                  ? { scale: 1.02 }
                  : {}
              }
              transition={{ duration: 0.25, repeat: phase === "heating" ? Infinity : 0, ease: "easeInOut" }}
            >
              {/* Holographic sheen */}
              <motion.div
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{
                  background: `linear-gradient(
                    135deg,
                    rgba(255,255,255,0.3) 0%,
                    transparent 40%,
                    rgba(255,255,255,0.1) 60%,
                    transparent 100%
                  )`,
                }}
                animate={{
                  rotate: phase === "heating" || phase === "cracking" ? 360 : 0,
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Seal emblem */}
              <div className="absolute inset-5 rounded-full border-4 border-violet-300/30 flex items-center justify-center">
                <motion.span
                  className="text-6xl font-black text-violet-200/70"
                  animate={
                    phase === "heating" || phase === "cracking"
                      ? { 
                          opacity: [0.7, 0.4, 0.7],
                          textShadow: [
                            "0 0 10px rgba(255,255,255,0.3)",
                            "0 0 30px rgba(255,255,255,0.6)",
                            "0 0 10px rgba(255,255,255,0.3)",
                          ]
                        }
                      : {}
                  }
                  transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  ?
                </motion.span>
              </div>
              
              {/* Decorative drips */}
              <div className="absolute -bottom-3 left-1/4 w-5 h-7 bg-gradient-to-b from-violet-500 to-violet-700 rounded-b-full" />
              <div className="absolute -bottom-4 right-1/3 w-4 h-6 bg-gradient-to-b from-violet-500 to-violet-700 rounded-b-full" />
              <div className="absolute -right-2 top-1/3 w-6 h-4 bg-gradient-to-r from-violet-500 to-violet-700 rounded-r-full" />
              
              {/* Crack lines - glowing */}
              <AnimatePresence>
                {phase === "cracking" && (
                  <>
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-full h-1 origin-left rounded-full"
                      style={{ 
                        transform: "translate(-50%, -50%) rotate(30deg)",
                        background: "linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)",
                        boxShadow: "0 0 15px #fbbf24",
                      }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    />
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-full h-1 origin-left rounded-full"
                      style={{ 
                        transform: "translate(-50%, -50%) rotate(-45deg)",
                        background: "linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)",
                        boxShadow: "0 0 15px #fbbf24",
                      }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.15, delay: 0.08 }}
                    />
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-full h-1 origin-left rounded-full"
                      style={{ 
                        transform: "translate(-50%, -50%) rotate(120deg)",
                        background: "linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)",
                        boxShadow: "0 0 15px #fbbf24",
                      }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.15, delay: 0.16 }}
                    />
                    {/* Glow from cracks */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 60%)",
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.6] }}
                      transition={{ duration: 0.3 }}
                    />
                  </>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Premium ribbon */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
              <div 
                className="w-5 h-12 rounded-b-sm transform -rotate-15"
                style={{
                  background: "linear-gradient(180deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)",
                }}
              />
              <div 
                className="w-5 h-14 rounded-b-sm transform rotate-15"
                style={{
                  background: "linear-gradient(180deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breaking pieces - holographic shards */}
      <AnimatePresence>
        {phase === "breaking" && (
          <>
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-sm"
                style={{
                  width: 12 + Math.random() * 18,
                  height: 12 + Math.random() * 18,
                  background: `linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)`,
                  boxShadow: "0 0 10px rgba(167,139,250,0.5)",
                }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 250,
                  y: (Math.random() - 0.5) * 250 + 60,
                  opacity: 0,
                  rotate: Math.random() * 540,
                }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            ))}
            {/* Fire embers with actual fire icons */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`fire-${i}`}
                className="absolute w-8 h-8"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 180,
                  y: -60 - Math.random() * 120,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                }}
                transition={{ duration: 1.2, ease: "easeOut", delay: Math.random() * 0.2 }}
              >
                <Image src={FIRE_URL} alt="" fill className="object-contain" />
              </motion.div>
            ))}
            {/* Holographic sparkles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`spark-${i}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 
                    ? "linear-gradient(135deg, #fbbf24, #f59e0b)" 
                    : "linear-gradient(135deg, #a78bfa, #c4b5fd)",
                  boxShadow: `0 0 8px ${i % 2 === 0 ? "#fbbf24" : "#a78bfa"}`,
                }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 200,
                  y: -80 - Math.random() * 150,
                  opacity: 0,
                }}
                transition={{ duration: 1.2, ease: "easeOut", delay: Math.random() * 0.25 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Revealed team */}
      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div
            className="flex flex-col items-center relative"
            initial={{ scale: 0, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Celebration elements */}
            <CelebrationElements show={true} teamColor={team.color} />
            
            {/* Glow backdrop */}
            <motion.div
              className="absolute w-52 h-52 rounded-full -z-10"
              style={{
                background: `radial-gradient(circle, 
                  rgba(167,139,250,0.3) 0%, 
                  ${team.color}20 40%, 
                  transparent 70%
                )`,
              }}
              animate={{ scale: 1.1 }}
              transition={{ duration: 1 }}
            />
            
            {/* Team emblem - premium seal style */}
            <motion.div
              className="relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${team.color} 0%, ${team.color}cc 100%)`,
                boxShadow: `
                  0 12px 40px ${team.color}60, 
                  0 0 80px rgba(167,139,250,0.4),
                  inset 0 -8px 20px rgba(0,0,0,0.25)
                `,
              }}
            >
              <HolographicShine />
              
              {/* Inner ring */}
              <div 
                className="absolute inset-4 rounded-full border-3"
                style={{ borderColor: team.secondary + "60" }}
              />
              
              <motion.span
                className="text-4xl font-black text-white drop-shadow-lg relative z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {team.name.slice(0, 2).toUpperCase()}
              </motion.span>
            </motion.div>
            
            <motion.h3
              className="mt-6 text-3xl font-black text-white drop-shadow-lg"
              initial={{ opacity: 0, y: 10 }}
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
              The seal has been broken!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
