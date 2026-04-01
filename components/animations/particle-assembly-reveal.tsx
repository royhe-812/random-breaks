"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

const teams = [
  { name: "Chiefs", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", color: "#003594", secondary: "#869397" },
  { name: "49ers", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", color: "#008E97", secondary: "#FC4C02" },
]

interface ParticleAssemblyRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

export function ParticleAssemblyReveal({ isRevealing, onComplete }: ParticleAssemblyRevealProps) {
  const [phase, setPhase] = useState<"idle" | "scattering" | "assembling" | "revealed">("idle")
  const team = teams[0] // Fixed team - Chiefs
  
  const particles = useMemo(() => 
    [...Array(40)].map((_, i) => ({
      id: i,
      startX: (Math.random() - 0.5) * 300,
      startY: (Math.random() - 0.5) * 300,
      delay: Math.random() * 0.5,
      size: 3 + Math.random() * 6,
    })), []
  )

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      
      const scatterTimer = setTimeout(() => setPhase("scattering"), 100)
      const assembleTimer = setTimeout(() => setPhase("assembling"), 600)
      const revealTimer = setTimeout(() => setPhase("revealed"), 2000)
      const completeTimer = setTimeout(() => onComplete(), 3500)
      
      return () => {
        clearTimeout(scatterTimer)
        clearTimeout(assembleTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-56 h-72 flex items-center justify-center overflow-hidden">
      {/* Scattered particles */}
      <AnimatePresence>
        {(phase === "scattering" || phase === "assembling") && (
          <>
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute rounded-full"
                style={{
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.id % 3 === 0 ? team.color : particle.id % 3 === 1 ? team.secondary : "#ffffff",
                  boxShadow: `0 0 ${particle.size * 2}px ${particle.id % 2 === 0 ? team.color : team.secondary}`,
                }}
                initial={{
                  x: particle.startX,
                  y: particle.startY,
                  opacity: 0,
                  scale: 0,
                }}
                animate={
                  phase === "scattering"
                    ? {
                        x: particle.startX,
                        y: particle.startY,
                        opacity: 1,
                        scale: 1,
                      }
                    : {
                        x: (Math.random() - 0.5) * 40,
                        y: (Math.random() - 0.5) * 40,
                        opacity: 1,
                        scale: 1,
                      }
                }
                exit={{
                  opacity: 0,
                  scale: 2,
                }}
                transition={{
                  duration: phase === "scattering" ? 0.4 : 1.2,
                  delay: particle.delay,
                  ease: phase === "assembling" ? [0.2, 0.8, 0.2, 1] : "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Swirling effect during assembly */}
      <AnimatePresence>
        {phase === "assembling" && (
          <motion.div
            className="absolute w-32 h-32 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${team.color}00, ${team.color}40, ${team.secondary}40, ${team.color}00)`,
            }}
            initial={{ scale: 2, opacity: 0, rotate: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 360 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* Revealed logo */}
      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div
            className="flex flex-col items-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute w-40 h-40 rounded-full"
              style={{
                background: `radial-gradient(circle, ${team.color}40 0%, transparent 70%)`,
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Logo circle */}
            <motion.div
              className="relative w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 100%)`,
                boxShadow: `0 0 50px ${team.color}80, inset 0 0 30px ${team.secondary}30`,
              }}
              initial={{ rotate: -180 }}
              animate={{ rotate: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <motion.span 
                className="text-4xl font-black text-white relative z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {team.name.slice(0, 2).toUpperCase()}
              </motion.span>
              
              {/* Inner shine */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              />
            </motion.div>
            
            {/* Orbiting particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: i % 2 === 0 ? team.secondary : team.color,
                }}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.2,
                }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i % 2 === 0 ? team.secondary : team.color,
                    transform: `translateX(${50 + i * 5}px)`,
                  }}
                />
              </motion.div>
            ))}
            
            <motion.h3
              className="mt-6 text-2xl font-black text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {team.name}
            </motion.h3>
            
            <motion.div
              className="mt-2 px-4 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: `${team.secondary}30`, color: team.secondary }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              Drafted to your team!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
