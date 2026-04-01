"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

const teams = [
  { name: "Chiefs", color: "#E31837", abbr: "KC" },
  { name: "Eagles", color: "#004C54", abbr: "PHI" },
  { name: "Cowboys", color: "#003594", abbr: "DAL" },
  { name: "49ers", color: "#AA0000", abbr: "SF" },
  { name: "Bills", color: "#00338D", abbr: "BUF" },
  { name: "Dolphins", color: "#008E97", abbr: "MIA" },
  { name: "Ravens", color: "#241773", abbr: "BAL" },
  { name: "Bengals", color: "#FB4F14", abbr: "CIN" },
]

interface SlotMachineRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

export function SlotMachineReveal({ isRevealing, onComplete }: SlotMachineRevealProps) {
  const [spinning, setSpinning] = useState(false)
  const [finalTeam, setFinalTeam] = useState(teams[0])
  const [showConfetti, setShowConfetti] = useState(false)
  const [visibleTeams, setVisibleTeams] = useState(teams.slice(0, 3))
  const [locked, setLocked] = useState(false)

  const spinTeams = useCallback(() => {
    if (!spinning) return
    setVisibleTeams(prev => {
      const shuffled = [...teams].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, 3)
    })
  }, [spinning])

  useEffect(() => {
    if (isRevealing) {
      setSpinning(true)
      setShowConfetti(false)
      setLocked(false)
      const selected = teams[Math.floor(Math.random() * teams.length)]
      setFinalTeam(selected)
      
      const spinInterval = setInterval(spinTeams, 80)
      
      const stopTimer = setTimeout(() => {
        clearInterval(spinInterval)
        setSpinning(false)
        setVisibleTeams([teams[0], selected, teams[2]])
        setLocked(true)
      }, 1500)
      
      const confettiTimer = setTimeout(() => {
        setShowConfetti(true)
      }, 1700)
      
      const completeTimer = setTimeout(() => {
        onComplete()
      }, 3000)
      
      return () => {
        clearInterval(spinInterval)
        clearTimeout(stopTimer)
        clearTimeout(confettiTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, spinTeams, onComplete])

  return (
    <div className="relative w-56 h-72 flex flex-col items-center justify-center">
      {/* Slot machine frame */}
      <div className="relative w-full h-56 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl border-4 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)] overflow-hidden">
        {/* Top chrome bar */}
        <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center">
          <span className="text-zinc-900 font-black text-sm tracking-wider">RANDOM TEAM</span>
        </div>
        
        {/* Viewing window */}
        <div className="absolute top-12 inset-x-4 bottom-4 bg-zinc-950 rounded-lg overflow-hidden border-2 border-zinc-700">
          {/* Spinning reels container */}
          <div className="relative h-full flex flex-col items-center justify-center">
            <AnimatePresence mode="popLayout">
              {visibleTeams.map((team, index) => (
                <motion.div
                  key={spinning ? `${team.abbr}-${index}-${Date.now()}` : `${team.abbr}-${index}`}
                  className={`w-full py-2 flex items-center justify-center gap-3 ${
                    index === 1 ? "bg-zinc-800/50" : ""
                  }`}
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: index === 1 ? 1 : 0.4 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{ duration: spinning ? 0.08 : 0.3 }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.abbr}
                  </div>
                  <span className={`font-bold ${index === 1 ? "text-white text-lg" : "text-zinc-500 text-sm"}`}>
                    {team.name}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Center highlight */}
            <div className="absolute inset-y-0 left-0 right-0 pointer-events-none">
              <div className="absolute top-1/3 h-1/3 inset-x-0 border-y-2 border-amber-500/50" />
            </div>
            
            {/* Lock indicator */}
            <AnimatePresence>
              {locked && (
                <motion.div
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Scan lines effect */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0,0,0,0.5) 2px,
                rgba(0,0,0,0.5) 4px
              )`
            }}
          />
        </div>
        
        {/* Side lights */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: i % 2 === 0 ? 4 : "auto",
              right: i % 2 === 1 ? 4 : "auto",
              top: `${30 + (i < 2 ? 0 : 30)}%`,
            }}
            animate={{
              backgroundColor: spinning 
                ? ["#ef4444", "#22c55e", "#3b82f6", "#eab308"]
                : locked ? "#22c55e" : "#6b7280"
            }}
            transition={{ duration: 0.2, repeat: spinning ? Infinity : 0 }}
          />
        ))}
      </div>

      {/* Result display */}
      <AnimatePresence>
        {locked && (
          <motion.div
            className="mt-4 px-6 py-2 rounded-full font-bold text-white"
            style={{ backgroundColor: finalTeam.color }}
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
          >
            YOU GOT: {finalTeam.name.toUpperCase()}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <>
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2"
                style={{
                  backgroundColor: ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#ec4899"][i % 5],
                  borderRadius: i % 2 === 0 ? "50%" : "0",
                  left: "50%",
                  top: "40%",
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  opacity: 0,
                  scale: 1,
                  rotate: Math.random() * 720,
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
