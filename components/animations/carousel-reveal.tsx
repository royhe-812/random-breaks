"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"

const teams = [
  { name: "Chiefs", city: "Kansas City", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", city: "Philadelphia", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", city: "Dallas", color: "#003594", secondary: "#869397" },
  { name: "Patriots", city: "New England", color: "#002244", secondary: "#C60C30" },
  { name: "Packers", city: "Green Bay", color: "#203731", secondary: "#FFB612" },
  { name: "49ers", city: "San Francisco", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", city: "Buffalo", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", city: "Miami", color: "#008E97", secondary: "#FC4C02" },
  { name: "Ravens", city: "Baltimore", color: "#241773", secondary: "#9E7C0C" },
  { name: "Bengals", city: "Cincinnati", color: "#FB4F14", secondary: "#000000" },
  { name: "Browns", city: "Cleveland", color: "#311D00", secondary: "#FF3C00" },
  { name: "Steelers", city: "Pittsburgh", color: "#FFB612", secondary: "#101820" },
  { name: "Texans", city: "Houston", color: "#03202F", secondary: "#A71930" },
  { name: "Colts", city: "Indianapolis", color: "#002C5F", secondary: "#A2AAAD" },
  { name: "Jaguars", city: "Jacksonville", color: "#101820", secondary: "#D7A22A" },
  { name: "Titans", city: "Tennessee", color: "#0C2340", secondary: "#4B92DB" },
  { name: "Broncos", city: "Denver", color: "#FB4F14", secondary: "#002244" },
  { name: "Chargers", city: "Los Angeles", color: "#0080C6", secondary: "#FFC20E" },
  { name: "Raiders", city: "Las Vegas", color: "#000000", secondary: "#A5ACAF" },
  { name: "Jets", city: "New York", color: "#125740", secondary: "#000000" },
  { name: "Giants", city: "New York", color: "#0B2265", secondary: "#A71930" },
  { name: "Commanders", city: "Washington", color: "#5A1414", secondary: "#FFB612" },
  { name: "Bears", city: "Chicago", color: "#0B162A", secondary: "#C83803" },
  { name: "Lions", city: "Detroit", color: "#0076B6", secondary: "#B0B7BC" },
  { name: "Vikings", city: "Minnesota", color: "#4F2683", secondary: "#FFC62F" },
  { name: "Falcons", city: "Atlanta", color: "#A71930", secondary: "#000000" },
  { name: "Panthers", city: "Carolina", color: "#0085CA", secondary: "#101820" },
  { name: "Saints", city: "New Orleans", color: "#D3BC8D", secondary: "#101820" },
  { name: "Buccaneers", city: "Tampa Bay", color: "#D50A0A", secondary: "#FF7900" },
  { name: "Cardinals", city: "Arizona", color: "#97233F", secondary: "#000000" },
  { name: "Rams", city: "Los Angeles", color: "#003594", secondary: "#FFA300" },
  { name: "Seahawks", city: "Seattle", color: "#002244", secondary: "#69BE28" },
]

interface CarouselRevealProps {
  onComplete: (team: typeof teams[0]) => void
  isRevealing: boolean
}

export function CarouselReveal({ onComplete, isRevealing }: CarouselRevealProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<"idle" | "spinning" | "slowing" | "stopped" | "revealed">("idle")
  const [speed, setSpeed] = useState(80)
  const targetIndexRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

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
    if (isRevealing && phase === "idle") {
      const randomIndex = Math.floor(Math.random() * teams.length)
      targetIndexRef.current = randomIndex
      setPhase("spinning")
      setSpeed(80)
    }
  }, [isRevealing, phase])

  // Spinning animation
  useEffect(() => {
    if (phase === "spinning" || phase === "slowing") {
      const interval = setInterval(() => {
        setCurrentIndex(prev => {
          const next = (prev + 1) % teams.length
          playTickSound()
          return next
        })
      }, speed)

      return () => clearInterval(interval)
    }
  }, [phase, speed])

  // Slow down after spinning for a bit
  useEffect(() => {
    if (phase === "spinning") {
      const timeout = setTimeout(() => {
        setPhase("slowing")
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [phase])

  // Gradually slow down
  useEffect(() => {
    if (phase === "slowing") {
      const interval = setInterval(() => {
        setSpeed(prev => {
          const newSpeed = prev + 40
          if (newSpeed >= 500) {
            clearInterval(interval)
            // Land on target
            setCurrentIndex(targetIndexRef.current!)
            setPhase("stopped")
            return 500
          }
          return newSpeed
        })
      }, 200)
      return () => clearInterval(interval)
    }
  }, [phase])

  // Call onComplete when stopped (no separate reveal phase)
  useEffect(() => {
    if (phase === "stopped") {
      onComplete(teams[targetIndexRef.current!])
    }
  }, [phase, onComplete])

  const selectedTeam = teams[currentIndex]
  
  // Use only 8 cards in the 3D ring for better spacing
  const cardsInRing = 8
  const anglePerCard = 360 / cardsInRing
  const radius = 220 // Distance from center
  
  // Calculate rotation based on current index
  const rotation = -currentIndex * anglePerCard

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] relative">
      {/* 3D Carousel Ring */}
      <div 
        className="relative h-56 w-full flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Rotating container */}
        <div
          className="relative w-32 h-44 flex items-center justify-center"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotation}deg)`,
            transition: phase === "spinning" ? "transform 0.08s linear" : 
                       phase === "slowing" ? `transform ${speed / 1000}s ease-out` :
                       "transform 0.4s ease-out",
          }}
        >
          {/* Cards arranged in a circle */}
          {Array.from({ length: cardsInRing }).map((_, i) => {
            const team = teams[i % teams.length]
            const angle = i * anglePerCard
            const isFront = Math.abs(((currentIndex % cardsInRing) - i + cardsInRing) % cardsInRing) === 0 ||
                           Math.abs(((currentIndex % cardsInRing) - i + cardsInRing) % cardsInRing) === cardsInRing
            
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
                <div
                  className="w-full h-full rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, ${team.color} 0%, ${team.color}dd 100%)`,
                    boxShadow: isFront && (phase === "stopped" || phase === "revealed")
                      ? `0 0 50px ${team.color}80, 0 0 80px ${team.color}40, 0 20px 40px rgba(0,0,0,0.5)`
                      : `0 10px 25px rgba(0,0,0,0.4)`,
                  }}
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
                    {team.name.slice(0, 2).toUpperCase()}
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
                </div>
              </div>
            )
          })}
        </div>

        {/* Center glow when stopped */}
        <AnimatePresence>
          {phase === "stopped" && (
            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="w-44 h-52 rounded-2xl"
                style={{
                  background: `radial-gradient(circle, ${selectedTeam.color}50 0%, ${selectedTeam.color}20 40%, transparent 70%)`,
                  filter: "blur(20px)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status indicator while spinning */}
      {phase !== "stopped" && phase !== "idle" && (
        <motion.div
          className="mt-4 text-white/50 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          Spinning...
        </motion.div>
      )}
    </div>
  )
}
