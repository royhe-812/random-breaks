"use client"

import { useState, useEffect } from "react"
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

interface CardFlipRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function CardFlipReveal({ isRevealing, onComplete, team: propTeam }: CardFlipRevealProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const team = propTeam || teams[0]
  const [showShine, setShowShine] = useState(false)

  useEffect(() => {
    if (isRevealing) {
      setIsFlipped(false)
      setShowShine(false)
      
      const flipTimer = setTimeout(() => {
        setIsFlipped(true)
      }, 300)
      
      const shineTimer = setTimeout(() => {
        setShowShine(true)
      }, 900)
      
      const completeTimer = setTimeout(() => {
        onComplete()
      }, 2500)
      
      return () => {
        clearTimeout(flipTimer)
        clearTimeout(shineTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-52 h-80 perspective-1000">
      {/* Celebration elements */}
      <CelebrationElements show={isFlipped && showShine} teamColor={team.color} />
      
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
                {team.name.slice(0, 2).toUpperCase()}
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
      
      {/* Confetti particles with team colors */}
      <AnimatePresence>
        {isFlipped && showShine && (
          <>
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 4 + Math.random() * 6,
                  height: 4 + Math.random() * 6,
                  backgroundColor: i % 3 === 0 ? team.color : i % 3 === 1 ? team.secondary : "#a78bfa",
                  boxShadow: `0 0 6px ${i % 2 === 0 ? team.color : "#a78bfa"}`,
                  left: "50%",
                  top: "50%",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 250,
                  y: (Math.random() - 0.5) * 250,
                  opacity: 0,
                  scale: 1,
                }}
                transition={{ duration: 1, delay: i * 0.02 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
