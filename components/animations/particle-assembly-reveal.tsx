"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CelebrationElements, HolographicShine } from "./celebration-elements"

const teams = [
  { name: "Chiefs", city: "Kansas City", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", city: "Philadelphia", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", city: "Dallas", color: "#003594", secondary: "#869397" },
  { name: "49ers", city: "San Francisco", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", city: "Buffalo", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", city: "Miami", color: "#008E97", secondary: "#FC4C02" },
  { name: "Ravens", city: "Baltimore", color: "#241773", secondary: "#9E7C0C" },
  { name: "Lions", city: "Detroit", color: "#0076B6", secondary: "#B0B7BC" },
  { name: "Packers", city: "Green Bay", color: "#203731", secondary: "#FFB612" },
  { name: "Bengals", city: "Cincinnati", color: "#FB4F14", secondary: "#000000" },
  { name: "Jets", city: "New York", color: "#125740", secondary: "#000000" },
  { name: "Broncos", city: "Denver", color: "#FB4F14", secondary: "#002244" },
  { name: "Chargers", city: "Los Angeles", color: "#0080C6", secondary: "#FFC20E" },
  { name: "Colts", city: "Indianapolis", color: "#002C5F", secondary: "#A2AAAD" },
  { name: "Texans", city: "Houston", color: "#03202F", secondary: "#A71930" },
  { name: "Steelers", city: "Pittsburgh", color: "#FFB612", secondary: "#101820" },
]

interface Team {
  name: string
  color: string
  secondary: string
}

interface ParticleAssemblyRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function ParticleAssemblyReveal({ isRevealing, onComplete, team: propTeam }: ParticleAssemblyRevealProps) {
  const [phase, setPhase] = useState<"idle" | "scattering" | "assembling" | "revealed">("idle")
  const team = propTeam || teams[0]
  
  const particles = useMemo(() => 
    [...Array(50)].map((_, i) => ({
      id: i,
      startX: (Math.random() - 0.5) * 350,
      startY: (Math.random() - 0.5) * 350,
      delay: Math.random() * 0.5,
      size: 3 + Math.random() * 8,
    })), []
  )

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      
      const scatterTimer = setTimeout(() => setPhase("scattering"), 100)
      const assembleTimer = setTimeout(() => setPhase("assembling"), 600)
      const revealTimer = setTimeout(() => setPhase("revealed"), 2200)
      const completeTimer = setTimeout(() => onComplete(), 4000)
      
      return () => {
        clearTimeout(scatterTimer)
        clearTimeout(assembleTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-64 h-80 flex items-center justify-center overflow-visible">
      {/* Scattered particles - holographic style */}
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
                  background: particle.id % 4 === 0 
                    ? `linear-gradient(135deg, #a78bfa, #c4b5fd)` 
                    : particle.id % 4 === 1 
                    ? `linear-gradient(135deg, #c4b5fd, #e9d5ff)`
                    : particle.id % 4 === 2
                    ? team.color 
                    : team.secondary,
                  boxShadow: `0 0 ${particle.size * 2}px ${
                    particle.id % 2 === 0 ? "rgba(167,139,250,0.6)" : team.color + "80"
                  }`,
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
                        x: (Math.random() - 0.5) * 30,
                        y: (Math.random() - 0.5) * 30,
                        opacity: 1,
                        scale: 1,
                      }
                }
                exit={{
                  opacity: 0,
                  scale: 2,
                }}
                transition={{
                  duration: phase === "scattering" ? 0.4 : 1.4,
                  delay: particle.delay,
                  ease: phase === "assembling" ? [0.2, 0.8, 0.2, 1] : "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Swirling effect during assembly - holographic */}
      <AnimatePresence>
        {phase === "assembling" && (
          <>
            <motion.div
              className="absolute w-40 h-40 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, 
                  rgba(167,139,250,0) 0%, 
                  rgba(167,139,250,0.4) 25%, 
                  rgba(196,181,253,0.4) 50%, 
                  rgba(233,213,255,0.4) 75%, 
                  rgba(167,139,250,0) 100%
                )`,
              }}
              initial={{ scale: 2.5, opacity: 0, rotate: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 720 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute w-28 h-28 rounded-full"
              style={{
                background: `conic-gradient(from 180deg, 
                  ${team.color}00 0%, 
                  ${team.color}60 25%, 
                  ${team.secondary}60 50%, 
                  ${team.color}60 75%, 
                  ${team.color}00 100%
                )`,
              }}
              initial={{ scale: 2, opacity: 0, rotate: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: -540 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.1 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Revealed logo */}
      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div
            className="flex flex-col items-center relative"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
          >
            {/* Celebration elements */}
            <CelebrationElements show={true} teamColor={team.color} />
            
            {/* Multi-ring glow effect */}
            <motion.div
              className="absolute w-48 h-48 rounded-full -z-10"
              style={{
                background: `radial-gradient(circle, 
                  rgba(167,139,250,0.3) 0%, 
                  ${team.color}20 40%, 
                  transparent 70%
                )`,
              }}
              animate={{ scale: 1.15, opacity: 0.7 }}
              transition={{ duration: 1 }}
            />
            
            {/* Logo circle with premium finish */}
            <motion.div
              className="relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 100%)`,
                boxShadow: `
                  0 0 60px ${team.color}60, 
                  0 0 100px rgba(167,139,250,0.4),
                  inset 0 -8px 20px rgba(0,0,0,0.3)
                `,
              }}
              initial={{ rotate: -180 }}
              animate={{ rotate: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              <HolographicShine />
              <motion.span 
                className="text-5xl font-black text-white relative z-10 drop-shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {team.name.slice(0, 2).toUpperCase()}
              </motion.span>
              
              {/* Inner shine */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 50%)",
                }}
              />
            </motion.div>
            
            {/* Orbiting holographic particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-56 h-56"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ transform: `rotate(${i * 45}deg)` }}
              >
                <motion.div
                  className="absolute w-3 h-3 rounded-full -top-1"
                  style={{
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: i % 2 === 0 
                      ? "linear-gradient(135deg, #a78bfa, #c4b5fd)" 
                      : `linear-gradient(135deg, ${team.secondary}, ${team.color})`,
                    boxShadow: `0 0 10px ${i % 2 === 0 ? "#a78bfa" : team.secondary}`,
                  }}
                  animate={{ scale: 1.2 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                />
              </motion.div>
            ))}
            
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                {(team as typeof teams[0]).city || ""}
              </p>
              <h3 className="text-3xl font-black text-white drop-shadow-lg">
                {team.name}
              </h3>
            </motion.div>
            
            <motion.div
              className="mt-3 px-5 py-2 rounded-full text-sm font-bold"
              style={{ 
                background: "linear-gradient(135deg, rgba(167,139,250,0.3), rgba(196,181,253,0.2))",
                color: "#c4b5fd",
                border: "1px solid rgba(167,139,250,0.4)",
              }}
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
