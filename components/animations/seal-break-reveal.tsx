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

interface SealBreakRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

export function SealBreakReveal({ isRevealing, onComplete }: SealBreakRevealProps) {
  const [phase, setPhase] = useState<"idle" | "heating" | "cracking" | "breaking" | "revealed">("idle")
  const team = teams[0] // Fixed team - Chiefs

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      
      const heatTimer = setTimeout(() => setPhase("heating"), 200)
      const crackTimer = setTimeout(() => setPhase("cracking"), 900)
      const breakTimer = setTimeout(() => setPhase("breaking"), 1400)
      const revealTimer = setTimeout(() => setPhase("revealed"), 1700)
      const completeTimer = setTimeout(() => onComplete(), 3200)
      
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
    <div className="relative w-56 h-72 flex items-center justify-center">
      {/* Heat glow */}
      <AnimatePresence>
        {(phase === "heating" || phase === "cracking") && (
          <motion.div
            className="absolute w-40 h-40 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)",
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: phase === "cracking" ? 1.5 : 1, 
              opacity: phase === "cracking" ? 1 : 0.6 
            }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Wax Seal */}
      <AnimatePresence>
        {phase !== "revealed" && (
          <motion.div
            className="relative"
            animate={
              phase === "breaking"
                ? { scale: 1.3, opacity: 0 }
                : {}
            }
            transition={{ duration: 0.3 }}
          >
            {/* Seal base */}
            <motion.div
              className="relative w-32 h-32 rounded-full"
              style={{
                background: "radial-gradient(circle at 30% 30%, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)",
                boxShadow: phase === "heating" || phase === "cracking"
                  ? "0 0 30px rgba(239,68,68,0.6), inset 0 -5px 15px rgba(0,0,0,0.3)"
                  : "0 8px 20px rgba(0,0,0,0.4), inset 0 -5px 15px rgba(0,0,0,0.3)",
              }}
              animate={
                phase === "heating"
                  ? { scale: [1, 1.02, 1] }
                  : {}
              }
              transition={{ duration: 0.3, repeat: phase === "heating" ? Infinity : 0 }}
            >
              {/* Seal emblem */}
              <div className="absolute inset-4 rounded-full border-4 border-red-800/50 flex items-center justify-center">
                <motion.span
                  className="text-5xl font-black text-red-900/70"
                  animate={
                    phase === "heating" || phase === "cracking"
                      ? { opacity: [0.7, 0.5, 0.7] }
                      : {}
                  }
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  ?
                </motion.span>
              </div>
              
              {/* Drip edges */}
              <div className="absolute -bottom-2 left-1/4 w-4 h-6 bg-red-700 rounded-b-full" />
              <div className="absolute -bottom-3 right-1/3 w-3 h-5 bg-red-700 rounded-b-full" />
              <div className="absolute -right-1 top-1/3 w-5 h-3 bg-red-700 rounded-r-full" />
              
              {/* Crack lines */}
              <AnimatePresence>
                {phase === "cracking" && (
                  <>
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-full h-0.5 bg-amber-400 origin-left"
                      style={{ transform: "translate(-50%, -50%) rotate(30deg)" }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-full h-0.5 bg-amber-400 origin-left"
                      style={{ transform: "translate(-50%, -50%) rotate(-45deg)" }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    />
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-full h-0.5 bg-amber-400 origin-left"
                      style={{ transform: "translate(-50%, -50%) rotate(120deg)" }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.2 }}
                    />
                    {/* Glow from cracks */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 60%)",
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.5] }}
                      transition={{ duration: 0.4 }}
                    />
                  </>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Ribbon */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              <div className="w-4 h-10 bg-gradient-to-b from-amber-500 to-amber-600 rounded-b-sm transform -rotate-12" />
              <div className="w-4 h-12 bg-gradient-to-b from-amber-500 to-amber-600 rounded-b-sm transform rotate-12" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breaking pieces */}
      <AnimatePresence>
        {phase === "breaking" && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-sm"
                style={{
                  width: 10 + Math.random() * 15,
                  height: 10 + Math.random() * 15,
                  background: `linear-gradient(135deg, #dc2626 0%, #991b1b 100%)`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200 + 50,
                  opacity: 0,
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
            {/* Embers */}
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={`ember-${i}`}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  backgroundColor: i % 2 === 0 ? "#fbbf24" : "#f97316",
                }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 150,
                  y: -50 - Math.random() * 100,
                  opacity: 0,
                }}
                transition={{ duration: 1, ease: "easeOut", delay: Math.random() * 0.2 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Revealed team */}
      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div
            className="flex flex-col items-center"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Glow backdrop */}
            <motion.div
              className="absolute w-48 h-48 rounded-full"
              style={{
                background: `radial-gradient(circle, ${team.secondary}30 0%, transparent 70%)`,
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Team emblem - now looks like a premium seal */}
            <motion.div
              className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${team.color} 0%, ${team.color}cc 100%)`,
                boxShadow: `0 8px 30px ${team.color}60, inset 0 -5px 15px rgba(0,0,0,0.2)`,
              }}
            >
              {/* Inner ring */}
              <div 
                className="absolute inset-3 rounded-full border-2"
                style={{ borderColor: team.secondary }}
              />
              
              <motion.span
                className="text-3xl font-black text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {team.name.slice(0, 2).toUpperCase()}
              </motion.span>
            </motion.div>
            
            <motion.h3
              className="mt-5 text-2xl font-black text-white"
              initial={{ opacity: 0, y: 10 }}
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
              The seal has been broken!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
