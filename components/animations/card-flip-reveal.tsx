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

interface CardFlipRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

export function CardFlipReveal({ isRevealing, onComplete }: CardFlipRevealProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [team, setTeam] = useState(teams[0])
  const [showShine, setShowShine] = useState(false)

  useEffect(() => {
    if (isRevealing) {
      setIsFlipped(false)
      setShowShine(false)
      setTeam(teams[Math.floor(Math.random() * teams.length)])
      
      const flipTimer = setTimeout(() => {
        setIsFlipped(true)
      }, 300)
      
      const shineTimer = setTimeout(() => {
        setShowShine(true)
      }, 900)
      
      const completeTimer = setTimeout(() => {
        onComplete()
      }, 2000)
      
      return () => {
        clearTimeout(flipTimer)
        clearTimeout(shineTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-48 h-72 perspective-1000">
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Card Back */}
        <div 
          className="absolute inset-0 rounded-xl overflow-hidden backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700 rounded-xl flex items-center justify-center">
            <div className="relative">
              <motion.div
                className="w-20 h-20 rounded-full border-4 border-amber-500/50 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <span className="text-4xl font-bold text-amber-500">?</span>
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, transparent, rgba(245, 158, 11, 0.3), transparent)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
            {/* Pattern */}
            <div className="absolute inset-4 border border-zinc-700 rounded-lg opacity-50" />
            <div className="absolute inset-8 border border-zinc-700 rounded-lg opacity-30" />
          </div>
        </div>

        {/* Card Front */}
        <div 
          className="absolute inset-0 rounded-xl overflow-hidden backface-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div 
            className="w-full h-full rounded-xl border-2 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 100%)`,
              borderColor: team.secondary
            }}
          >
            {/* Shine effect */}
            <AnimatePresence>
              {showShine && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0, x: "-100%" }}
                  animate={{ opacity: 1, x: "200%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                    width: "50%",
                  }}
                />
              )}
            </AnimatePresence>
            
            {/* Team Logo Placeholder */}
            <motion.div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: team.secondary }}
              initial={{ scale: 0 }}
              animate={isFlipped ? { scale: 1 } : { scale: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <span className="text-3xl font-bold" style={{ color: team.color }}>
                {team.name.slice(0, 2).toUpperCase()}
              </span>
            </motion.div>
            
            <motion.h3 
              className="text-2xl font-bold text-white text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isFlipped ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.4 }}
            >
              {team.name}
            </motion.h3>
            
            {/* Holographic effect */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
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
      
      {/* Confetti particles */}
      <AnimatePresence>
        {isFlipped && showShine && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: i % 2 === 0 ? team.color : team.secondary,
                  left: "50%",
                  top: "50%",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                  opacity: 0,
                  scale: 1,
                }}
                transition={{ duration: 0.8, delay: i * 0.02 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
