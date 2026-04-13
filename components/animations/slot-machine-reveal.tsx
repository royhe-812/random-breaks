"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const teams = [
  { name: "Chiefs", city: "Kansas City", color: "#E31837", abbr: "KC" },
  { name: "Eagles", city: "Philadelphia", color: "#004C54", abbr: "PHI" },
  { name: "Cowboys", city: "Dallas", color: "#003594", abbr: "DAL" },
  { name: "49ers", city: "San Francisco", color: "#AA0000", abbr: "SF" },
  { name: "Bills", city: "Buffalo", color: "#00338D", abbr: "BUF" },
  { name: "Dolphins", city: "Miami", color: "#008E97", abbr: "MIA" },
  { name: "Ravens", city: "Baltimore", color: "#241773", abbr: "BAL" },
  { name: "Lions", city: "Detroit", color: "#0076B6", abbr: "DET" },
  { name: "Packers", city: "Green Bay", color: "#203731", abbr: "GB" },
  { name: "Bengals", city: "Cincinnati", color: "#FB4F14", abbr: "CIN" },
  { name: "Jets", city: "New York", color: "#125740", abbr: "NYJ" },
  { name: "Broncos", city: "Denver", color: "#FB4F14", abbr: "DEN" },
  { name: "Chargers", city: "Los Angeles", color: "#0080C6", abbr: "LAC" },
  { name: "Colts", city: "Indianapolis", color: "#002C5F", abbr: "IND" },
  { name: "Texans", city: "Houston", color: "#03202F", abbr: "HOU" },
  { name: "Steelers", city: "Pittsburgh", color: "#FFB612", abbr: "PIT" },
]

interface Team {
  name: string
  color: string
  secondary?: string
}

interface SlotMachineRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function SlotMachineReveal({ isRevealing, onComplete, team: propTeam }: SlotMachineRevealProps) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "slowing" | "landed" | "explode">("idle")
  const [randomTeam, setRandomTeam] = useState(() => teams[Math.floor(Math.random() * teams.length)])
  const finalTeam = propTeam ? { ...propTeam, abbr: propTeam.name.slice(0, 3).toUpperCase() } : randomTeam
  
  // Pick a new random team each time isRevealing becomes true
  useEffect(() => {
    if (isRevealing) {
      setRandomTeam(teams[Math.floor(Math.random() * teams.length)])
    }
  }, [isRevealing])
  const [spinOffset, setSpinOffset] = useState(0)
  const animationRef = useRef<number | null>(null)
  const speedRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastTickRef = useRef(0)

  const repeatedTeams = [...teams, ...teams, ...teams, ...teams, ...teams]
  const itemHeight = 64

  // Play tick sound using Web Audio API (same as randomizer)
  const playTickSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03)
      oscillator.type = 'square'
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.04)
    } catch {
      // Silently fail if audio context isn't available
    }
  }

  useEffect(() => {
    if (isRevealing) {
      setPhase("spinning")
      setSpinOffset(0)
      speedRef.current = 50

      let lastTime = performance.now()
      
      const animate = (currentTime: number) => {
        const delta = (currentTime - lastTime) / 16.67
        lastTime = currentTime

        setSpinOffset(prev => {
          const newOffset = prev + speedRef.current * delta
          
          // Play tick sound when passing each team (every itemHeight pixels)
          const prevTeamIndex = Math.floor(prev / itemHeight)
          const newTeamIndex = Math.floor(newOffset / itemHeight)
          if (newTeamIndex !== prevTeamIndex && speedRef.current > 0) {
            playTickSound()
          }
          
          if (newOffset > teams.length * itemHeight) {
            return newOffset - teams.length * itemHeight
          }
          return newOffset
        })

        animationRef.current = requestAnimationFrame(animate)
      }

      animationRef.current = requestAnimationFrame(animate)

      const slowTimer = setTimeout(() => {
        setPhase("slowing")
        
        const slowDown = () => {
          speedRef.current *= 0.94
          
          if (speedRef.current > 2) {
            setTimeout(slowDown, 30)
          } else {
            speedRef.current = 0
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current)
            }
            
            const targetOffset = 0 * itemHeight
            setSpinOffset(targetOffset)
            setPhase("landed")
            
            setTimeout(() => {
              setPhase("explode")
            }, 300)
          }
        }
        slowDown()
      }, 1500)

      const completeTimer = setTimeout(() => {
        onComplete()
      }, 4500)

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        clearTimeout(slowTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Screen flash on landing */}
      <AnimatePresence>
        {phase === "landed" && (
          <motion.div
            className="fixed inset-0 bg-green-200 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Main container with shake effect */}
      <motion.div
        className="relative w-80"
        animate={
          phase === "landed" 
            ? { x: [0, -10, 10, -8, 8, -5, 5, -2, 2, 0], y: [0, -5, 5, -4, 4, -2, 2, -1, 1, 0] }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        {/* Premium slot machine frame - matching item card/randomizer style */}
        <div 
          className="relative rounded-3xl overflow-hidden backdrop-blur-xl"
          style={{
            background: "rgba(24, 24, 27, 0.85)",
            borderWidth: phase === "explode" ? 2 : 1,
            borderStyle: "solid",
            borderColor: phase === "explode" ? "#22c55e" : "rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Top chrome bar with holographic finish */}
          <div 
            className="h-14 flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)",
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(
                  90deg,
                  transparent 20%,
                  rgba(255,255,255,0.4) 50%,
                  transparent 80%
                )`,
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
            />
            <span className="text-white font-black text-lg tracking-wider drop-shadow-lg relative z-10">
              YOUR TEAM
            </span>
          </div>

          {/* Viewing window */}
          <motion.div 
            className="relative h-24 mx-5 my-5 rounded-xl overflow-hidden" 
            style={{ 
              background: "rgba(0, 0, 0, 0.4)", 
              borderWidth: 1, 
              borderStyle: "solid", 
              borderColor: "rgba(255, 255, 255, 0.1)",
              boxShadow: phase === "explode" ? `0 0 30px #4CE16080, 0 0 60px ${finalTeam.color}50` : "none",
            }}
            animate={phase === "explode" ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.5 }}
          >
            {/* Winner celebration effects - only show when explode */}
            {phase === "explode" && (
              <>
                {/* Animated glow border */}
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  animate={{
                    boxShadow: [
                      `inset 0 0 25px #4CE16040, 0 0 20px #4CE16060`,
                      `inset 0 0 50px #4CE16060, 0 0 40px #4CE16080`,
                      `inset 0 0 25px #4CE16040, 0 0 20px #4CE16060`,
                    ],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                />

                {/* Primary sweeping wipe gradient - green */}
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, #4CE16030 40%, #4CE160 50%, #4CE16030 60%, transparent 100%)",
                  }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />

                {/* Secondary wipe gradient - team color */}
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${finalTeam.color}20 40%, ${finalTeam.color}60 50%, ${finalTeam.color}20 60%, transparent 100%)`,
                  }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: 0.4 }}
                />

                {/* Sparkle particles */}
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: 3 + (i % 3),
                      height: 3 + (i % 3),
                      left: `${8 + i * 9}%`,
                      top: `${15 + (i % 3) * 30}%`,
                      background: i % 3 === 0 ? "#4CE160" : i % 3 === 1 ? finalTeam.color : "#fff",
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.12,
                      ease: "easeOut",
                    }}
                  />
                ))}

                {/* Firework bursts on edges */}
                <motion.div
                  className="absolute -left-1 top-1/2 w-3 h-3 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${finalTeam.color} 0%, transparent 70%)` }}
                  animate={{ scale: [0, 2, 0], opacity: [0, 0.8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="absolute -right-1 top-1/2 w-3 h-3 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, #4CE160 0%, transparent 70%)` }}
                  animate={{ scale: [0, 2, 0], opacity: [0, 0.8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
                />
              </>
            )}

            {/* Scrolling reel */}
            <div 
              className="absolute inset-x-0"
              style={{ 
                transform: `translateY(${-spinOffset + itemHeight/4}px)`,
              }}
            >
              {repeatedTeams.map((team, index) => (
                <div
                  key={`${team.abbr}-${index}`}
                  className="h-16 flex items-center justify-center gap-4 px-5"
                  style={{ height: itemHeight }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg relative"
                    style={{ 
                      backgroundColor: team.color,
                      boxShadow: `0 4px 12px ${team.color}60`,
                    }}
                  >
                    {team.abbr}
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-white text-xl block">
                      {team.city}
                    </span>
                    <span className="text-white/70 text-sm">
                      {team.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Center selection highlight */}
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-16 border-y"
                style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80" />
            </div>


          </motion.div>



          {/* Bottom area with result */}
        </div>


      </motion.div>


    </div>
  )
}
