"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const STARS_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBayLiveApp_Stars_DW_CC_v007_CC%202-OGJYd3jy5o3bamd4lN3498JekCYscy.png"
const FIRE_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBay_Live_Emoji_a_v008_Fire.0072%202-IVWHtqVd8MJLUNA3EfYsVshGT1EjUg.png"

const teams = [
  { name: "Chiefs", city: "Kansas City", color: "#E31837", abbrev: "KC" },
  { name: "Eagles", city: "Philadelphia", color: "#004C54", abbrev: "PHI" },
  { name: "Cowboys", city: "Dallas", color: "#003594", abbrev: "DAL" },
  { name: "49ers", city: "San Francisco", color: "#AA0000", abbrev: "SF" },
  { name: "Bills", city: "Buffalo", color: "#00338D", abbrev: "BUF" },
  { name: "Dolphins", city: "Miami", color: "#008E97", abbrev: "MIA" },
  { name: "Ravens", city: "Baltimore", color: "#241773", abbrev: "BAL" },
  { name: "Lions", city: "Detroit", color: "#0076B6", abbrev: "DET" },
  { name: "Packers", city: "Green Bay", color: "#203731", abbrev: "GB" },
  { name: "Bengals", city: "Cincinnati", color: "#FB4F14", abbrev: "CIN" },
  { name: "Jets", city: "New York", color: "#125740", abbrev: "NYJ" },
  { name: "Broncos", city: "Denver", color: "#FB4F14", abbrev: "DEN" },
  { name: "Chargers", city: "Los Angeles", color: "#0080C6", abbrev: "LAC" },
  { name: "Colts", city: "Indianapolis", color: "#002C5F", abbrev: "IND" },
  { name: "Texans", city: "Houston", color: "#03202F", abbrev: "HOU" },
  { name: "Steelers", city: "Pittsburgh", color: "#FFB612", abbrev: "PIT" },
  { name: "Panthers", city: "Carolina", color: "#0085CA", abbrev: "CAR" },
  { name: "Seahawks", city: "Seattle", color: "#002244", abbrev: "SEA" },
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
  username?: string
}

export function SlotMachineReveal({ isRevealing, onComplete, team: propTeam, username = "CardboardHero" }: SlotMachineRevealProps) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "slowing" | "landed" | "celebrate">("idle")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [finalIndex, setFinalIndex] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  const finalTeam = propTeam 
    ? { ...propTeam, city: "", abbrev: propTeam.name.slice(0, 3).toUpperCase() } 
    : teams[finalIndex]

  const itemHeight = 48

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  // Play tick sound
  const playTickSound = (frequency = 600) => {
    if (!audioContextRef.current) return
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.value = frequency + Math.random() * 200
    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.05)
  }

  // Play win sound
  const playWinSound = () => {
    if (!audioContextRef.current) return
    const ctx = audioContextRef.current
    const frequencies = [523.25, 659.25, 783.99, 1046.50]
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = "sine"
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.3)
      }, i * 100)
    })
  }

  // Get visible teams (prev, current, next)
  const getVisibleTeams = () => {
    const prevIndex = (currentIndex - 1 + teams.length) % teams.length
    const nextIndex = (currentIndex + 1) % teams.length
    return [
      teams[prevIndex],
      teams[currentIndex],
      teams[nextIndex],
    ]
  }

  useEffect(() => {
    if (isRevealing && phase === "idle") {
      // Pick random final team
      const targetIndex = Math.floor(Math.random() * teams.length)
      setFinalIndex(targetIndex)
      setPhase("spinning")
      
      let speed = 30 // Start very fast
      let spins = 0
      const minSpins = teams.length * 4 // At least 4 full rotations
      
      const spin = () => {
        setCurrentIndex(prev => {
          const next = (prev + 1) % teams.length
          spins++
          playTickSound(600 + (spins % 5) * 50)
          return next
        })
      }
      
      // Fast spinning phase
      intervalRef.current = setInterval(spin, speed)
      
      // Start slowing down after 1.2 seconds
      setTimeout(() => {
        setPhase("slowing")
        
        let currentSpeed = speed
        const slowDown = () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          
          currentSpeed += 20 // Slow down gradually
          
          if (currentSpeed < 350 && spins < minSpins + targetIndex) {
            intervalRef.current = setInterval(() => {
              setCurrentIndex(prev => {
                const next = (prev + 1) % teams.length
                spins++
                playTickSound(500 - currentSpeed)
                
                // Check if we should stop
                if (spins >= minSpins && next === targetIndex) {
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                  }
                  setTimeout(() => {
                    setPhase("landed")
                    playWinSound()
                    setTimeout(() => {
                      setPhase("celebrate")
                    }, 300)
                  }, 100)
                }
                return next
              })
            }, currentSpeed)
            
            setTimeout(slowDown, currentSpeed * 2)
          }
        }
        
        slowDown()
      }, 1200)

      // Complete after animation
      const completeTimer = setTimeout(() => {
        onComplete()
      }, 5000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, phase, onComplete])

  // Reset when not revealing
  useEffect(() => {
    if (!isRevealing) {
      setPhase("idle")
      setCurrentIndex(0)
    }
  }, [isRevealing])

  const visibleTeams = getVisibleTeams()

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Screen flash on landing */}
      <AnimatePresence>
        {phase === "landed" && (
          <motion.div
            className="fixed inset-0 bg-white pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Main container */}
      <motion.div
        className="relative w-72"
        animate={
          phase === "landed" 
            ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
            : {}
        }
        transition={{ duration: 0.4 }}
      >
        {/* Slot machine container - dark blurred style matching item card */}
        <div 
          className="relative rounded-2xl overflow-hidden backdrop-blur-xl"
          style={{
            background: "rgba(24, 24, 27, 0.85)",
            borderWidth: phase === "celebrate" ? 2 : 0,
            borderColor: phase === "celebrate" ? finalTeam.color : "transparent",
            boxShadow: phase === "celebrate" 
              ? `0 0 40px ${finalTeam.color}60`
              : "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-white font-bold text-lg text-center">
              Break spot: {username}
            </h3>
          </div>

          {/* Slot window */}
          <div className="relative py-3 overflow-hidden">
            {/* Team list */}
            <div className="flex flex-col items-center">
              {visibleTeams.map((team, index) => {
                const isCenter = index === 1
                const isLanded = phase === "landed" || phase === "celebrate"
                
                return (
                  <motion.div
                    key={`${team.abbrev}-${index}`}
                    className={`w-full px-4 py-2 flex items-center justify-center ${
                      isCenter ? "my-1" : ""
                    }`}
                    initial={false}
                    animate={{
                      opacity: isCenter ? 1 : 0.4,
                    }}
                    transition={{ duration: 0.1 }}
                  >
                    {isCenter ? (
                      <motion.div 
                        className="w-full py-3 px-4 rounded-xl text-center"
                        style={{
                          backgroundColor: isLanded ? `${finalTeam.color}30` : "rgba(255,255,255,0.1)",
                          borderWidth: isLanded ? 2 : 0,
                          borderColor: isLanded ? finalTeam.color : "transparent",
                        }}
                        animate={isLanded ? { scale: [1, 1.02, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <span 
                          className="font-bold text-xl"
                          style={{ color: isLanded ? finalTeam.color : "white" }}
                        >
                          {team.city} {team.name}
                        </span>
                      </motion.div>
                    ) : (
                      <span className="text-white/40 text-lg font-medium">
                        {team.city} {team.name}
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Celebration elements */}
        <AnimatePresence>
          {phase === "celebrate" && (
            <>
              {/* Stars */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute z-30"
                  style={{
                    left: `${10 + i * 25}%`,
                    top: i % 2 === 0 ? "-10%" : "90%",
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    delay: i * 0.1,
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                >
                  <div className="relative w-8 h-8">
                    <Image src={STARS_URL} alt="" fill className="object-contain" />
                  </div>
                </motion.div>
              ))}

              {/* Fire icons */}
              <motion.div
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-30"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [0, 5, -5, 0] }}
                transition={{ rotate: { duration: 0.5, repeat: Infinity } }}
              >
                <div className="relative w-10 h-10">
                  <Image src={FIRE_URL} alt="" fill className="object-contain" />
                </div>
              </motion.div>
              <motion.div
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-30"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [0, -5, 5, 0] }}
                transition={{ rotate: { duration: 0.5, repeat: Infinity } }}
              >
                <div className="relative w-10 h-10">
                  <Image src={FIRE_URL} alt="" fill className="object-contain" />
                </div>
              </motion.div>

              {/* Confetti */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute w-2 h-2 rounded-full z-20"
                  style={{
                    backgroundColor: i % 2 === 0 ? finalTeam.color : "#3b82f6",
                    left: "50%",
                    top: "50%",
                  }}
                  initial={{ scale: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: (Math.random() - 0.5) * 250,
                    y: (Math.random() - 0.5) * 200,
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 1.2,
                    delay: Math.random() * 0.2,
                    ease: "easeOut",
                  }}
                />
              ))}

              {/* Ring burst */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 z-0"
                style={{ borderColor: finalTeam.color }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: 300, height: 300, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Winner text below */}
      <AnimatePresence>
        {phase === "celebrate" && (
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-white/80 text-sm font-semibold uppercase tracking-wider block">
              {finalTeam.city}
            </span>
            <span 
              className="text-3xl font-black block"
              style={{ color: finalTeam.color }}
            >
              {finalTeam.name.toUpperCase()}
            </span>
            <span className="text-blue-400 text-sm font-semibold tracking-widest mt-1 block">
              WINS!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
