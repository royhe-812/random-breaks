"use client"

// Team spinner with wheel click sound - v13
import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"

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

export interface Team {
  name: string
  city: string
  color: string
  secondary: string
}

interface TeamSpinnerProps {
  totalSpots: number
  availableSpots: number
  onSpinComplete: (team: Team) => void
  isSpinning: boolean
  onStartSpin: () => void
}

export function TeamSpinner({ 
  totalSpots, 
  availableSpots, 
  onSpinComplete, 
  isSpinning, 
  onStartSpin 
}: TeamSpinnerProps) {
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const [spinPhase, setSpinPhase] = useState<"idle" | "fast" | "slowing" | "stopped">("idle")
  const [spinSpeed, setSpinSpeed] = useState(50)
  const [finalTeamIndex, setFinalTeamIndex] = useState<number | null>(null)
  const targetTeamIndexRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Play tick sound using Web Audio API - classic wheel clicker sound
  const playTickSoundRef = useRef(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      
      // Create a short click/tick sound like a wheel peg hitting a flipper
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      // Higher frequency for a sharper click
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03)
      oscillator.type = 'square'
      
      // Quick attack, fast decay for a click sound
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.04)
    } catch {
      // Silently fail if audio context isn't available
    }
  })

  // Reset to idle when isSpinning becomes false
  useEffect(() => {
    if (!isSpinning && spinPhase !== "idle") {
      setSpinPhase("idle")
      setSpinSpeed(50)
      setFinalTeamIndex(null)
    }
  }, [isSpinning, spinPhase])

  const startSpin = useCallback(() => {
    // Pick a completely random team at the start of the spin
    const randomIndex = Math.floor(Math.random() * teams.length)
    targetTeamIndexRef.current = randomIndex
    setSpinPhase("fast")
    setSpinSpeed(50)
    onStartSpin()
  }, [onStartSpin])

  useEffect(() => {
    if (spinPhase === "idle" || spinPhase === "stopped") return

    const interval = setInterval(() => {
      setCurrentTeamIndex(prev => (prev + 1) % teams.length)
      playTickSoundRef.current()
    }, spinSpeed)

    return () => clearInterval(interval)
  }, [spinPhase, spinSpeed])

  useEffect(() => {
    if (spinPhase === "fast") {
      // Fast phase for 1.5 seconds
      const timer = setTimeout(() => {
        setSpinPhase("slowing")
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [spinPhase])

  useEffect(() => {
    if (spinPhase === "slowing" && targetTeamIndexRef.current !== null) {
      // Gradually slow down and land on the pre-selected random team
      const targetIndex = targetTeamIndexRef.current
      const slowdownInterval = setInterval(() => {
        setSpinSpeed(prev => {
          const newSpeed = prev + 30
          if (newSpeed >= 400) {
            clearInterval(slowdownInterval)
            // Land on the randomly selected target team
            setCurrentTeamIndex(targetIndex)
            setFinalTeamIndex(targetIndex)
            setSpinPhase("stopped")
            return 400
          }
          return newSpeed
        })
      }, 200)
      return () => clearInterval(slowdownInterval)
    }
  }, [spinPhase])

  // Trigger winning moment when finalTeamIndex is set
  useEffect(() => {
    if (finalTeamIndex !== null && spinPhase === "stopped") {
      const timer = setTimeout(() => {
        onSpinComplete(teams[finalTeamIndex])
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [finalTeamIndex, spinPhase, onSpinComplete])

  const currentTeam = teams[currentTeamIndex]

  return (
    <div className="w-full">
      {/* Main Container */}
      <motion.div 
        className="relative bg-zinc-900/90 backdrop-blur rounded-xl overflow-hidden"
        animate={{
          boxShadow: spinPhase !== "idle" 
            ? `0 0 20px ${currentTeam.color}40, 0 0 40px ${currentTeam.color}20`
            : "none"
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Header Row - Spots Available */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-white/70 text-sm">
            {availableSpots}/{totalSpots} spots available
          </span>
          <button className="flex items-center gap-1 text-white font-medium text-sm">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Team Display Row */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Team Color Indicator - blur when stopped to hide result */}
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg relative overflow-hidden"
                style={{ backgroundColor: spinPhase === "stopped" ? "#666" : currentTeam.color }}
                animate={{
                  scale: 1,
                }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
              >
                {spinPhase === "stopped" ? "?" : currentTeam.name.slice(0, 2).toUpperCase()}
                {/* Shimmer effect when stopped */}
                {spinPhase === "stopped" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: [-50, 50] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>

              {/* Team Name - hide when stopped */}
              <div className="flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={spinPhase === "stopped" ? "hidden" : currentTeam.name}
                    className="text-white font-semibold text-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: spinPhase === "fast" ? 0.05 : 0.15 }}
                  >
                    {spinPhase === "stopped" ? "???" : `${currentTeam.city} ${currentTeam.name}`}
                  </motion.span>
                </AnimatePresence>
                <span className="text-white/50 text-xs">
                  {spinPhase === "idle" ? "Tap to spin" : 
                   spinPhase === "stopped" ? "Get ready..." : "Spinning..."}
                </span>
              </div>
            </div>

            {/* Spin Button / Status */}
            {spinPhase === "idle" ? (
              <motion.button
                onClick={startSpin}
                className="px-5 py-2.5 bg-green-500 hover:bg-green-600 rounded-xl text-black font-semibold text-sm transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Spin
              </motion.button>
            ) : (
              <motion.div
                className="px-4 py-2 rounded-xl font-medium text-sm"
                style={{ 
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "white"
                }}
                animate={{
                  scale: 1,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {spinPhase === "stopped" ? "Revealing..." : "..."}
              </motion.div>
            )}
          </div>


        </div>


      </motion.div>
    </div>
  )
}

export { teams }
