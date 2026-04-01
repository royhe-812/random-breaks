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

interface PackRipRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

export function PackRipReveal({ isRevealing, onComplete }: PackRipRevealProps) {
  const [phase, setPhase] = useState<"closed" | "ripping" | "revealed">("closed")
  const [team, setTeam] = useState(teams[0])

  useEffect(() => {
    if (isRevealing) {
      setPhase("closed")
      setTeam(teams[Math.floor(Math.random() * teams.length)])
      
      const ripTimer = setTimeout(() => setPhase("ripping"), 400)
      const revealTimer = setTimeout(() => setPhase("revealed"), 900)
      const completeTimer = setTimeout(() => onComplete(), 2500)
      
      return () => {
        clearTimeout(ripTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-48 h-72 flex items-center justify-center">
      {/* Pack Wrapper */}
      <div className="relative w-full h-full">
        {/* Base pack */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-500 border-2 border-amber-400">
            {/* Foil pattern */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `repeating-linear-gradient(
                  110deg,
                  transparent,
                  transparent 10px,
                  rgba(255,255,255,0.3) 10px,
                  rgba(255,255,255,0.3) 12px
                )`
              }}
            />
            {/* Pack label */}
            <div className="absolute inset-x-4 top-20 bottom-20 bg-zinc-900/90 rounded-lg flex flex-col items-center justify-center p-4">
              <div className="text-amber-400 font-bold text-sm">2023 PANINI</div>
              <div className="text-white font-black text-xl mt-1">MOSAIC</div>
              <div className="text-amber-400 text-xs mt-2">NFL FOOTBALL</div>
            </div>
          </div>
        </div>

        {/* Ripping top portion */}
        <motion.div
          className="absolute inset-x-0 top-0 h-16 rounded-t-xl overflow-hidden origin-top"
          initial={{ rotateX: 0, y: 0 }}
          animate={
            phase === "ripping" || phase === "revealed"
              ? { rotateX: -120, y: -20, opacity: 0.5 }
              : { rotateX: 0, y: 0, opacity: 1 }
          }
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="w-full h-full bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-500 border-2 border-b-0 border-amber-400 rounded-t-xl">
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `repeating-linear-gradient(
                  110deg,
                  transparent,
                  transparent 10px,
                  rgba(255,255,255,0.3) 10px,
                  rgba(255,255,255,0.3) 12px
                )`
              }}
            />
          </div>
          {/* Tear edge */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-transparent to-zinc-800" />
        </motion.div>

        {/* Light rays */}
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
                    background: `linear-gradient(to bottom, ${team.secondary}80, transparent)`,
                    transform: `rotate(${i * 45}deg)`,
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: [0, 0.6, 0.3] }}
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
              className="absolute inset-x-6 top-12 bottom-12 rounded-lg overflow-hidden shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}cc 100%)`,
                border: `2px solid ${team.secondary}`,
              }}
              initial={{ y: 60, opacity: 0, scale: 0.9 }}
              animate={{ y: phase === "revealed" ? -40 : 20, opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.2, 0.8, 0.2, 1],
                delay: phase === "ripping" ? 0 : 0.2
              }}
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <motion.div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: team.secondary }}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  <span className="text-2xl font-bold" style={{ color: team.color }}>
                    {team.name.slice(0, 2).toUpperCase()}
                  </span>
                </motion.div>
                <motion.div
                  className="text-white font-bold text-lg text-center"
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
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                  width: "50%",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Foil particles */}
        <AnimatePresence>
          {phase === "ripping" && (
            <>
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-3 rounded-full"
                  style={{
                    backgroundColor: i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#f59e0b" : "#d97706",
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
