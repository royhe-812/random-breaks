"use client"

// Particle assembly reveal animation - v7 - fixed JSX
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"


const teams = [
  { name: "Chiefs", city: "Kansas City", abbrev: "KC", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", city: "Philadelphia", abbrev: "PHI", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", city: "Dallas", abbrev: "DAL", color: "#003594", secondary: "#869397" },
  { name: "49ers", city: "San Francisco", abbrev: "SF", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", city: "Buffalo", abbrev: "BUF", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", city: "Miami", abbrev: "MIA", color: "#008E97", secondary: "#FC4C02" },
  { name: "Ravens", city: "Baltimore", abbrev: "BAL", color: "#241773", secondary: "#9E7C0C" },
  { name: "Lions", city: "Detroit", abbrev: "DET", color: "#0076B6", secondary: "#B0B7BC" },
  { name: "Packers", city: "Green Bay", abbrev: "GB", color: "#203731", secondary: "#FFB612" },
  { name: "Bengals", city: "Cincinnati", abbrev: "CIN", color: "#FB4F14", secondary: "#000000" },
  { name: "Jets", city: "New York", abbrev: "NYJ", color: "#125740", secondary: "#000000" },
  { name: "Broncos", city: "Denver", abbrev: "DEN", color: "#FB4F14", secondary: "#002244" },
  { name: "Chargers", city: "Los Angeles", abbrev: "LAC", color: "#0080C6", secondary: "#FFC20E" },
  { name: "Colts", city: "Indianapolis", abbrev: "IND", color: "#002C5F", secondary: "#A2AAAD" },
  { name: "Texans", city: "Houston", abbrev: "HOU", color: "#03202F", secondary: "#A71930" },
  { name: "Steelers", city: "Pittsburgh", abbrev: "PIT", color: "#FFB612", secondary: "#101820" },
]

interface Team {
  name: string
  abbrev?: string
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
  const [randomTeam, setRandomTeam] = useState(() => teams[Math.floor(Math.random() * teams.length)])
  const team = propTeam || randomTeam
  
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
      // Pick a new random team each reveal
      setRandomTeam(teams[Math.floor(Math.random() * teams.length)])
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

  // Offset to align particles/swirl with the final logo circle position
  const logoOffsetY = -50

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
                  top: "50%",
                  left: "50%",
                  marginTop: logoOffsetY,
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
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                marginTop: logoOffsetY,
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
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                marginTop: logoOffsetY,
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
            className="absolute flex flex-col items-center"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              marginTop: logoOffsetY,
            }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
          >
            {/* Logo circle */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Logo circle with premium finish */}
              <motion.div
                className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 100%)`,
                  boxShadow: `0 0 40px ${team.color}60`,
                }}
                initial={{ rotate: -180 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                <motion.span 
                  className="text-5xl font-black text-white relative z-10 drop-shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  {(team as typeof teams[0]).abbrev || team.name.slice(0, 2).toUpperCase()}
                </motion.span>
                
                {/* Inner shine */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
                  }}
                />
              </motion.div>
            </div>
            
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                {(team as typeof teams[0]).city || ""}
              </p>
              <p className="text-3xl font-black text-white drop-shadow-lg">
                {team.name}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
