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

  // Transition to revealed
  useEffect(() => {
    if (phase === "stopped") {
      const timeout = setTimeout(() => {
        setPhase("revealed")
        onComplete(teams[targetIndexRef.current!])
      }, 800)
      return () => clearTimeout(timeout)
    }
  }, [phase, onComplete])

  // Get visible cards (5 cards: 2 left, center, 2 right)
  const getVisibleCards = () => {
    const cards = []
    for (let i = -2; i <= 2; i++) {
      const index = (currentIndex + i + teams.length) % teams.length
      cards.push({ team: teams[index], position: i })
    }
    return cards
  }

  const visibleCards = getVisibleCards()
  const selectedTeam = teams[currentIndex]

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] relative">
      {/* Winner announcement */}
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-green-400 text-sm font-medium uppercase tracking-wider mb-1">
          KemMajed90 Won!
        </p>
        <p className="text-white/70 text-sm">Your team is...</p>
      </motion.div>

      {/* 3D Carousel */}
      <div 
        className="relative h-64 w-full flex items-center justify-center"
        style={{ perspective: "1200px" }}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {visibleCards.map(({ team, position }) => {
            const isCenter = position === 0
            const absPos = Math.abs(position)
            
            // Calculate 3D transforms for horizontal carousel
            const rotateY = position * 45
            const translateX = position * 120
            const translateZ = isCenter ? 100 : -80 * absPos
            const scale = isCenter ? 1.1 : 0.75 - absPos * 0.1
            const cardOpacity = isCenter ? 1 : 0.6 - absPos * 0.2
            const zIndex = 10 - absPos

            return (
              <motion.div
                key={`${team.name}-${position}`}
                className="absolute"
                animate={{ opacity: cardOpacity }}
                transition={{ duration: 0.15 }}
                style={{
                  zIndex,
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  transformStyle: "preserve-3d",
                  transition: "transform 0.15s ease-out",
                }}
              >
                {/* Card */}
                <div
                  className="w-32 h-44 rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, ${team.color} 0%, ${team.color}dd 100%)`,
                    boxShadow: isCenter && (phase === "stopped" || phase === "revealed")
                      ? `0 0 60px ${team.color}80, 0 0 100px ${team.color}40, 0 25px 50px rgba(0,0,0,0.5)`
                      : `0 15px 35px rgba(0,0,0,0.4)`,
                    backfaceVisibility: "hidden",
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

                {/* Reflection - only for center card */}
                {isCenter && (
                  <div
                    className="w-32 h-24 mt-1 rounded-xl overflow-hidden pointer-events-none"
                    style={{
                      background: `linear-gradient(to bottom, ${team.color}50 0%, transparent 100%)`,
                      transform: "scaleY(-1) rotateX(180deg)",
                      opacity: 0.35,
                      filter: "blur(3px)",
                      maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
                      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
                    }}
                  />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Center glow when stopped */}
        <AnimatePresence>
          {(phase === "stopped" || phase === "revealed") && (
            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="w-48 h-56 rounded-2xl"
                style={{
                  background: `radial-gradient(circle, ${selectedTeam.color}50 0%, ${selectedTeam.color}20 40%, transparent 70%)`,
                  filter: "blur(25px)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Team info when revealed */}
      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
              {selectedTeam.city}
            </p>
            <h3 className="text-2xl font-black text-white drop-shadow-lg">
              {selectedTeam.name}
            </h3>
            <motion.p
              className="text-green-400 text-xs mt-3 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Your team has been revealed!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status indicator */}
      {phase !== "revealed" && phase !== "idle" && (
        <motion.div
          className="mt-6 text-white/50 text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {phase === "spinning" || phase === "slowing" ? "Spinning..." : "Revealing..."}
        </motion.div>
      )}
    </div>
  )
}
