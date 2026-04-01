"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CelebrationElements, HolographicShine } from "./celebration-elements"

const teams = [
  { name: "Chiefs", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", color: "#003594", secondary: "#869397" },
  { name: "49ers", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", color: "#008E97", secondary: "#FC4C02" },
]

interface PackRipRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

export function PackRipReveal({ isRevealing, onComplete }: PackRipRevealProps) {
  const [phase, setPhase] = useState<"closed" | "ripping" | "revealed">("closed")
  const team = teams[0]

  useEffect(() => {
    if (isRevealing) {
      setPhase("closed")
      
      const ripTimer = setTimeout(() => setPhase("ripping"), 400)
      const revealTimer = setTimeout(() => setPhase("revealed"), 900)
      const completeTimer = setTimeout(() => onComplete(), 3000)
      
      return () => {
        clearTimeout(ripTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-52 h-80 flex items-center justify-center">
      {/* Pack Wrapper */}
      <div className="relative w-full h-full">
        {/* Base pack with holographic finish */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div 
            className="w-full h-full border-2 border-violet-400/40"
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 30%, #7c3aed 60%, #6d28d9 100%)",
            }}
          >
            {/* Holographic foil pattern */}
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                background: `repeating-linear-gradient(
                  110deg,
                  transparent,
                  transparent 8px,
                  rgba(255,255,255,0.3) 8px,
                  rgba(255,255,255,0.3) 10px
                )`
              }}
            />
            {/* Iridescent shimmer */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(
                  105deg,
                  transparent 30%,
                  rgba(233, 213, 255, 0.3) 45%,
                  rgba(196, 181, 253, 0.4) 50%,
                  rgba(167, 139, 250, 0.3) 55%,
                  transparent 70%
                )`,
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
            {/* Pack label */}
            <div className="absolute inset-x-4 top-20 bottom-20 bg-zinc-900/95 rounded-xl flex flex-col items-center justify-center p-4 border border-violet-500/30">
              <div className="text-violet-300 font-bold text-sm tracking-wider">2023 PANINI</div>
              <div className="text-white font-black text-2xl mt-1">MOSAIC</div>
              <div className="text-violet-300 text-xs mt-2 tracking-widest">NFL FOOTBALL</div>
              <div className="mt-4 w-16 h-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Ripping top portion */}
        <motion.div
          className="absolute inset-x-0 top-0 h-16 rounded-t-2xl overflow-hidden origin-top"
          initial={{ rotateX: 0, y: 0 }}
          animate={
            phase === "ripping" || phase === "revealed"
              ? { rotateX: -120, y: -20, opacity: 0.5 }
              : { rotateX: 0, y: 0, opacity: 1 }
          }
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div 
            className="w-full h-full border-2 border-b-0 border-violet-400/40 rounded-t-2xl"
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)",
            }}
          >
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                background: `repeating-linear-gradient(
                  110deg,
                  transparent,
                  transparent 8px,
                  rgba(255,255,255,0.3) 8px,
                  rgba(255,255,255,0.3) 10px
                )`
              }}
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-transparent to-zinc-800" />
        </motion.div>

        {/* Light rays with purple tint */}
        <AnimatePresence>
          {phase === "revealed" && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-8 w-1 origin-top"
                  style={{
                    height: "150%",
                    background: `linear-gradient(to bottom, ${i % 2 === 0 ? "rgba(167,139,250,0.6)" : team.secondary + "80"}, transparent)`,
                    transform: `rotate(${i * 45}deg)`,
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: [0, 0.8, 0.4] }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card sliding out */}
        <AnimatePresence>
          {(phase === "ripping" || phase === "revealed") && (
            <motion.div
              className="absolute inset-x-5 top-10 bottom-10 rounded-xl overflow-hidden shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}cc 100%)`,
                border: `3px solid ${team.secondary}`,
                boxShadow: `0 20px 60px ${team.color}40, 0 0 30px rgba(167,139,250,0.3)`,
              }}
              initial={{ y: 60, opacity: 0, scale: 0.9 }}
              animate={{ y: phase === "revealed" ? -50 : 20, opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.2, 0.8, 0.2, 1],
                delay: phase === "ripping" ? 0 : 0.2
              }}
            >
              <HolographicShine />
              
              <div className="w-full h-full flex flex-col items-center justify-center p-4 relative">
                {/* Celebration elements */}
                <CelebrationElements show={phase === "revealed"} teamColor={team.color} />
                
                <motion.div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-3 relative"
                  style={{ 
                    backgroundColor: team.secondary,
                    boxShadow: `0 8px 24px ${team.color}60`,
                  }}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  <span className="text-2xl font-black" style={{ color: team.color }}>
                    {team.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)",
                    }}
                  />
                </motion.div>
                <motion.div
                  className="text-white font-black text-xl text-center drop-shadow-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {team.name}
                </motion.div>
              </div>
              
              {/* Card shine */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1, delay: 0.6 }}
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                  width: "50%",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Holographic foil particles */}
        <AnimatePresence>
          {phase === "ripping" && (
            <>
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-3 rounded-full"
                  style={{
                    backgroundColor: i % 3 === 0 ? "#a78bfa" : i % 3 === 1 ? "#c4b5fd" : "#e9d5ff",
                    boxShadow: "0 0 6px rgba(167, 139, 250, 0.6)",
                    left: `${20 + Math.random() * 60}%`,
                    top: "10%",
                  }}
                  initial={{ y: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    y: 100 + Math.random() * 100,
                    x: (Math.random() - 0.5) * 80,
                    opacity: 0,
                    rotate: Math.random() * 360,
                  }}
                  transition={{ duration: 0.8, delay: Math.random() * 0.2 }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
