"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Sparkle component for the reveal effect - continuously shimmering
const Sparkle = ({ delay, x, y, size = 8 }: { delay: number; x: number; y: number; size?: number }) => (
  <motion.div
    className="absolute pointer-events-none z-20"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0.3, 1, 0],
      scale: [0, 1, 0.7, 1, 0],
    }}
    transition={{ 
      duration: 2, 
      delay,
      times: [0, 0.2, 0.5, 0.8, 1],
      ease: "easeInOut",
      repeat: Infinity,
      repeatDelay: 0.5,
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
        fill="white"
        style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }}
      />
    </svg>
  </motion.div>
)

// Rainbow glow effect during reveal
const RevealGlow = ({ isActive, teamColor }: { isActive: boolean; teamColor: string }) => (
  <AnimatePresence>
    {isActive && (
      <motion.div
        className="absolute inset-0 -z-10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Rainbow gradient glow */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, 
              #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b
            )`,
            filter: "blur(40px)",
            opacity: 0.5,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        {/* Team color glow overlay */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full"
          style={{
            background: teamColor,
            filter: "blur(50px)",
            opacity: 0.4,
          }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    )}
  </AnimatePresence>
)

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
  
  // Generate random sparkle positions
  const sparkles = useRef(
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60, // Center around the carousel
      y: 10 + Math.random() * 60,
      delay: Math.random() * 0.8,
      size: 6 + Math.random() * 12,
    }))
  ).current

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

  // Play soft tick sound - same as randomizer and team picker
  const playTickSound = () => {
    if (!audioContextRef.current) return
    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    // Soft, pleasant tick - higher pitch, sine wave for smoothness
    oscillator.frequency.setValueAtTime(800, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.02)
    oscillator.type = 'sine'
    
    // Quick fade out for a soft click
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.03)
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
      
      // Play tick sounds synced to actual card passes using the same easing as CSS
      const duration = 3500 // matches CSS transition duration
      const startTime = performance.now() + 100 // account for the 100ms delay before spin starts
      let lastCardIndex = 0
      
      // Attempt to match cubic-bezier(0.15, 0.6, 0.2, 1) using bezier math
      const bezierAt = (t: number, p1: number, p2: number) => {
        // Attempt to get cubic-bezier y value at time t
        // Using simplified bezier formula: 3*(1-t)^2*t*p1 + 3*(1-t)*t^2*p2 + t^3
        const oneMinusT = 1 - t
        return 3 * oneMinusT * oneMinusT * t * p1 + 3 * oneMinusT * t * t * p2 + t * t * t
      }
      
      // For cubic-bezier(0.15, 0.6, 0.2, 1), we need to solve for t given x, then get y
      // Simplified: use y1=0.6, y2=1 for the y curve
      const getEasedProgress = (linearProgress: number) => {
        // Newton-Raphson to find t for given x (linearProgress)
        let t = linearProgress
        for (let i = 0; i < 8; i++) {
          const x = bezierAt(t, 0.15, 0.2) - linearProgress
          if (Math.abs(x) < 0.001) break
          const dx = 3 * (1 - t) * (1 - t) * 0.15 + 6 * (1 - t) * t * (0.2 - 0.15) + 3 * t * t * (1 - 0.2)
          t -= x / dx
        }
        return bezierAt(t, 0.6, 1)
      }
      
      const trackRotation = () => {
        const elapsed = performance.now() - startTime
        if (elapsed < 0) {
          requestAnimationFrame(trackRotation)
          return
        }
        
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = getEasedProgress(progress)
        const currentRotation = easedProgress * targetRotation
        const currentCardIndex = Math.floor(currentRotation / anglePerCard)
        
        // Play tick when a new card passes
        if (currentCardIndex > lastCardIndex) {
          playTickSound()
          lastCardIndex = currentCardIndex
        }
        
        if (progress < 1) {
          requestAnimationFrame(trackRotation)
        }
      }
      requestAnimationFrame(trackRotation)
      
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
      {/* Rainbow glow effect when stopped */}
      <RevealGlow isActive={hasStopped} teamColor={winningTeam.color} />
      
      {/* Sparkles when stopped */}
      {hasStopped && sparkles.map((sparkle) => (
        <Sparkle
          key={sparkle.id}
          x={sparkle.x}
          y={sparkle.y}
          delay={sparkle.delay}
          size={sparkle.size}
        />
      ))}
      
      {/* 3D Carousel Ring */}
      <div 
        className="relative h-56 w-full flex items-center justify-center"
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
                {/* Card - matching card flip style */}
                <motion.div
                  className="w-full h-full rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 50%, ${team.color}bb 100%)`,
                    borderWidth: 2,
                    borderColor: team.secondary,
                  }}
                  animate={hasStopped && i === winningIndex ? {
                    boxShadow: [
                      `0 0 40px ${team.color}90, 0 0 80px ${team.color}60`,
                      `0 0 60px ${team.color}aa, 0 0 100px ${team.color}80`,
                      `0 0 40px ${team.color}90, 0 0 80px ${team.color}60`,
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
                  {/* Holographic shine overlay */}
                  <div 
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, 
                        rgba(255,255,255,0.3) 0%,
                        transparent 40%,
                        transparent 60%,
                        rgba(255,255,255,0.2) 100%
                      )`,
                    }}
                  />
                  
                  {/* Team logo circle */}
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-2 relative"
                    style={{ 
                      backgroundColor: team.secondary,
                      boxShadow: `0 4px 16px ${team.color}60, inset 0 -2px 8px rgba(0,0,0,0.2)`,
                    }}
                  >
                    <span className="text-2xl font-black text-white drop-shadow-lg">
                      {team.abbrev}
                    </span>
                  </div>
                  
                  {/* Team info */}
                  <div className="text-center relative z-10">
                    <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                      {team.city}
                    </p>
                    <p className="text-sm font-black text-white drop-shadow-lg">
                      {team.name}
                    </p>
                  </div>
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>



      {/* Winner text - below carousel with fixed height container */}
      <div className="h-24 flex items-center justify-center">
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
              <span className="text-3xl font-black text-white">
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
