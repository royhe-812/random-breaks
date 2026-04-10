"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"


const teams = [
  { name: "Chiefs", city: "Kansas City", abbrev: "KC", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", city: "Philadelphia", abbrev: "PHI", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", city: "Dallas", abbrev: "DAL", color: "#003594", secondary: "#869397" },
  { name: "Patriots", city: "New England", abbrev: "NE", color: "#002244", secondary: "#C60C30" },
  { name: "Packers", city: "Green Bay", abbrev: "GB", color: "#203731", secondary: "#FFB612" },
  { name: "49ers", city: "San Francisco", abbrev: "SF", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", city: "Buffalo", abbrev: "BUF", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", city: "Miami", abbrev: "MIA", color: "#008E97", secondary: "#FC4C02" },
]

interface CarouselRevealProps {
  onComplete: (team: typeof teams[0]) => void
  isRevealing: boolean
}

export function CarouselReveal({ onComplete, isRevealing }: CarouselRevealProps) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasStopped, setHasStopped] = useState(false)
  const [winningTeam, setWinningTeam] = useState(teams[0])
  const [winningIndex, setWinningIndex] = useState(0)
  const hasStartedRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Reset the hasStartedRef when isRevealing changes to false so next reveal works
  useEffect(() => {
    if (!isRevealing) {
      hasStartedRef.current = false
      setIsSpinning(false)
    }
  }, [isRevealing])

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  // Play tick sound
  const playTickSound = () => {
    if (!audioContextRef.current) return
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.value = 800 + Math.random() * 400
    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.05)
  }

  // Start spinning when isRevealing becomes true
  useEffect(() => {
    if (isRevealing && !hasStartedRef.current) {
      hasStartedRef.current = true
      // Reset states for new reveal
      setRotation(0)
      setHasStopped(false)
      
      // Pick random target card
      const targetIndex = Math.floor(Math.random() * teams.length)
      const anglePerCard = 360 / teams.length
      // To land on a card, we need to rotate so that card faces front (its angle becomes 0)
      // Card at index i is at angle (i * anglePerCard), so we need to rotate by -(i * anglePerCard)
      // Plus multiple full rotations for the spinning effect
      const spins = 3 + Math.floor(Math.random() * 2) // 3-4 full rotations
      const targetRotation = (spins * 360) + (targetIndex * anglePerCard)
      
      setWinningTeam(teams[targetIndex])
      setWinningIndex(targetIndex)
      
      // Small delay before starting spin
      setTimeout(() => {
        setIsSpinning(true)
        setRotation(targetRotation)
      }, 100)
      
      // Play tick sounds during spin
      let tickCount = 0
      const maxTicks = 30
      const tickInterval = setInterval(() => {
        playTickSound()
        tickCount++
        if (tickCount >= maxTicks) {
          clearInterval(tickInterval)
        }
      }, 100)
      
      // Mark as stopped and call onComplete after spin finishes
      setTimeout(() => {
        setHasStopped(true)
        onComplete(teams[targetIndex])
      }, 3600)
    }
  }, [isRevealing, onComplete])

  const cardsInRing = teams.length
  const anglePerCard = 360 / cardsInRing
  const radius = 200

  return (
    <div className="flex flex-col items-center justify-center h-[400px] relative">
      {/* 3D Carousel Ring - fixed position */}
      <div 
        className="absolute top-8 left-0 right-0 h-56 flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Rotating container */}
        <div
          className="relative w-32 h-44"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${-rotation}deg)`,
            transition: isSpinning 
              ? "transform 3.5s cubic-bezier(0.15, 0.6, 0.2, 1)" 
              : "none",
          }}
        >
          {/* Cards arranged in a circle */}
          {teams.map((team, i) => {
            const angle = i * anglePerCard
            
            return (
              <div
                key={i}
                className="absolute w-32 h-44"
                style={{
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: "hidden",
                }}
              >
                {/* Card */}
                <motion.div
                  className="w-full h-full rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, ${team.color} 0%, ${team.color}dd 100%)`,
                  }}
                  animate={hasStopped && i === winningIndex ? {
                    boxShadow: [
                      `0 0 40px ${team.color}90, 0 0 80px ${team.color}60, 0 0 120px ${team.color}40`,
                      `0 0 60px ${team.color}aa, 0 0 100px ${team.color}80, 0 0 150px ${team.color}50`,
                      `0 0 40px ${team.color}90, 0 0 80px ${team.color}60, 0 0 120px ${team.color}40`,
                    ],
                  } : {
                    boxShadow: `0 10px 25px rgba(0,0,0,0.4)`,
                  }}
                  transition={hasStopped && i === winningIndex ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  } : {}}
                >
                  {/* Card shine */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(255,255,255,0.1) 100%)",
                    }}
                  />
                  
                  {/* Team initials */}
                  <span className="text-4xl font-black text-white drop-shadow-lg relative z-10">
                    {team.abbrev}
                  </span>
                  
                  {/* Team name */}
                  <span className="text-sm font-semibold text-white/90 mt-2 relative z-10">
                    {team.name}
                  </span>
                  
                  {/* Secondary color accent */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-3"
                    style={{ backgroundColor: team.secondary }}
                  />
                  
                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: team.secondary }}
                  />
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>



      {/* Winner text - fixed position below carousel */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <AnimatePresence>
          {hasStopped && (
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                {winningTeam.city}
              </span>
              <span 
                className="text-3xl font-black"
                style={{ color: winningTeam.color }}
              >
                {winningTeam.name.toUpperCase()}
              </span>
              <span className="text-green-400 text-sm font-semibold tracking-widest mt-1">
                WINS!
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
