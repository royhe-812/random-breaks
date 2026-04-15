"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HolographicShine } from "./celebration-elements"
import Image from "next/image"

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

interface CardFlipRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function CardFlipReveal({ isRevealing, onComplete, team: propTeam }: CardFlipRevealProps) {
  const [phase, setPhase] = useState<"idle" | "winner-text" | "card-flip">("idle")
  const [isFlipped, setIsFlipped] = useState(false)
  const [randomTeam, setRandomTeam] = useState(() => teams[Math.floor(Math.random() * teams.length)])
  const team = propTeam || randomTeam
  const [showShine, setShowShine] = useState(false)

  useEffect(() => {
    if (isRevealing) {
      // Pick a new random team each reveal
      setRandomTeam(teams[Math.floor(Math.random() * teams.length)])
      setIsFlipped(false)
      setShowShine(false)
      setPhase("winner-text")
      
      // After 2.5 seconds, transition to card flip phase
      const cardPhaseTimer = setTimeout(() => {
        setPhase("card-flip")
      }, 2500)
      
      // Flip the card shortly after entering card-flip phase
      const flipTimer = setTimeout(() => {
        setIsFlipped(true)
      }, 2800)
      
      const shineTimer = setTimeout(() => {
        setShowShine(true)
      }, 3400)
      
      const completeTimer = setTimeout(() => {
        onComplete()
      }, 5000)
      
      return () => {
        clearTimeout(cardPhaseTimer)
        clearTimeout(flipTimer)
        clearTimeout(shineTimer)
        clearTimeout(completeTimer)
      }
    } else {
      setPhase("idle")
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-52 h-80 perspective-1000">
      {/* Winner Text Phase - appears before card flip */}
      <AnimatePresence>
        {phase === "winner-text" && (
          <motion.div
            key="winner-text"
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stacked WINNER text */}
            <div className="relative flex flex-col items-center -space-y-2">
              {[...Array(7)].map((_, i) => (
                <motion.span
                  key={i}
                  className="text-4xl font-black italic text-[#4CE160] leading-none tracking-tight"
                  style={{ 
                    opacity: 1 - (i * 0.1),
                  }}
                  initial={{ opacity: 0, y: 40, scale: 0.7 }}
                  animate={{ 
                    opacity: 1 - (i * 0.1), 
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    y: -150 - (i * 30),
                    opacity: 0,
                    scale: 0.7,
                  }}
                  transition={{ 
                    delay: i * 0.1,
                    duration: 0.4,
                    ease: [0.34, 1.56, 0.64, 1],
                    exit: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                  }}
                >
                  WINNER
                </motion.span>
              ))}
              
              {/* Animated Crown */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ opacity: 0, scale: 0, y: 60 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                }}
                exit={{
                  y: -200,
                  opacity: 0,
                  scale: 0.3,
                }}
                transition={{ 
                  opacity: { delay: 0.6, duration: 0.3 },
                  scale: { delay: 0.6, duration: 0.5, type: "spring", stiffness: 200 },
                  y: { delay: 0.6, duration: 0.5 },
                  exit: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, -8, 8, -8, 0],
                    scale: [1, 1.06, 1],
                  }}
                  transition={{ 
                    rotate: { duration: 0.5, repeat: Infinity, repeatDelay: 1 },
                    scale: { duration: 0.6, repeat: Infinity, repeatDelay: 0.3 }
                  }}
                >
                  <Image 
                    src="/images/crown.png" 
                    alt="Crown" 
                    width={200} 
                    height={200}
                    className="drop-shadow-2xl"
                    style={{ filter: "drop-shadow(0 0 40px rgba(255, 215, 0, 0.6))" }}
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* Sparkle particles */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute rounded-full"
                style={{
                  width: 3 + (i % 3) * 2,
                  height: 3 + (i % 3) * 2,
                  background: i % 3 === 0 ? "#4CE160" : i % 3 === 1 ? "#FFD700" : "#fff",
                  left: `${15 + (i * 7)}%`,
                  top: `${20 + (i % 4) * 18}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.3, 0],
                }}
                exit={{
                  y: -80,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: 0.4 + i * 0.08,
                  exit: { duration: 0.4 }
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Card Back - Premium holographic style */}
        <div 
          className="absolute inset-0 rounded-2xl overflow-hidden backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border-2 border-violet-500/30 rounded-2xl flex items-center justify-center">
            {/* Holographic pattern */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(135deg, 
                  rgba(167, 139, 250, 0.2) 0%,
                  rgba(196, 181, 253, 0.1) 25%,
                  rgba(233, 213, 255, 0.2) 50%,
                  rgba(167, 139, 250, 0.1) 75%,
                  rgba(196, 181, 253, 0.2) 100%
                )`,
              }}
            />
            <div className="relative">
              <motion.div
                className="w-24 h-24 rounded-full border-4 border-violet-400/50 flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(196,181,253,0.1))",
                  boxShadow: "0 0 30px rgba(167, 139, 250, 0.3)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <span className="text-5xl font-bold text-violet-300">?</span>
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, transparent, rgba(167, 139, 250, 0.4), transparent)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
            {/* Premium border patterns */}
            <div className="absolute inset-3 border border-violet-500/20 rounded-xl" />
            <div className="absolute inset-6 border border-violet-500/10 rounded-lg" />
          </div>
        </div>

        {/* Card Front - Team reveal with premium finish */}
        <div 
          className="absolute inset-0 rounded-2xl overflow-hidden backface-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div 
            className="w-full h-full rounded-2xl border-2 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 50%, ${team.color}bb 100%)`,
              borderColor: team.secondary,
              boxShadow: `0 0 40px ${team.color}40`,
            }}
          >
            <HolographicShine />
            
            {/* Premium shine effect */}
            <AnimatePresence>
              {showShine && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0, x: "-100%" }}
                  animate={{ opacity: 1, x: "200%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                    width: "50%",
                  }}
                />
              )}
            </AnimatePresence>
            
            {/* Team Logo */}
            <motion.div
              className="w-28 h-28 rounded-full flex items-center justify-center mb-4 relative"
              style={{ 
                backgroundColor: team.secondary,
                boxShadow: `0 8px 32px ${team.color}60, inset 0 -4px 12px rgba(0,0,0,0.2)`,
              }}
              initial={{ scale: 0 }}
              animate={isFlipped ? { scale: 1 } : { scale: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <span className="text-4xl font-black" style={{ color: team.color }}>
                {(team as typeof teams[0]).abbrev || team.name.slice(0, 2).toUpperCase()}
              </span>
              {/* Inner shine */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)",
                }}
              />
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isFlipped ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                {(team as typeof teams[0]).city || ""}
              </p>
              <h3 className="text-3xl font-black text-white drop-shadow-lg">
                {team.name}
              </h3>
            </motion.div>
            
            {/* Premium holographic overlay */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.1) 2px,
                  rgba(255,255,255,0.1) 4px
                )`
              }}
            />
          </div>
        </div>
      </motion.div>
      

    </div>
  )
}
