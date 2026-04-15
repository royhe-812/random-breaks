"use client"

// Imports
import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"


// NFL teams data with official abbreviations
const teams = [
  { name: "Chiefs", city: "Kansas City", abbrev: "KC", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", city: "Philadelphia", abbrev: "PHI", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", city: "Dallas", abbrev: "DAL", color: "#003594", secondary: "#869397" },
  { name: "49ers", city: "San Francisco", abbrev: "SF", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", city: "Buffalo", abbrev: "BUF", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", city: "Miami", abbrev: "MIA", color: "#008E97", secondary: "#FC4C02" },
  { name: "Ravens", city: "Baltimore", abbrev: "BAL", color: "#241773", secondary: "#9E7C0C" },
  { name: "Lions", city: "Detroit", abbrev: "DET", color: "#0076B6", secondary: "#B0B7BC" },
  { name: "Packers", city: "Green Bay", abbrev: "GB", color: "#203731", secondary: "#FFB612" },
  { name: "Bengals", city: "Cincinnati", abbrev: "CIN", color: "#FB4F14", secondary: "#000000" },
  { name: "Jets", city: "New York", abbrev: "NYJ", color: "#125740", secondary: "#000000" },
  { name: "Broncos", city: "Denver", abbrev: "DEN", color: "#FB4F14", secondary: "#002244" },
  { name: "Chargers", city: "Los Angeles", abbrev: "LAC", color: "#0080C6", secondary: "#FFC20E" },
  { name: "Colts", city: "Indianapolis", abbrev: "IND", color: "#002C5F", secondary: "#A2AAAD" },
  { name: "Texans", city: "Houston", abbrev: "HOU", color: "#03202F", secondary: "#A71930" },
  { name: "Steelers", city: "Pittsburgh", abbrev: "PIT", color: "#FFB612", secondary: "#101820" },
]

// Types
export interface Team {
  name: string
  city: string
  abbrev: string
  color: string
  secondary: string
}

interface TeamSpinnerProps {
  totalSpots: number
  availableSpots: number
  onSpinComplete: (team: Team) => void
  isSpinning: boolean
  onStartSpin: () => void
  disabled?: boolean
  username?: string
}

// Spots icon component (trading card with person profile)
const SpotsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="28" height="36" rx="3" stroke="currentColor" strokeWidth="2.5"/>
    <rect x="6" y="6" width="20" height="4" rx="1" fill="currentColor"/>
    <circle cx="16" cy="20" r="5" fill="currentColor"/>
    <path d="M8 34c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

export function TeamSpinner({ 
  totalSpots, 
  availableSpots, 
  onSpinComplete, 
  isSpinning, 
  onStartSpin,
  disabled = false,
  username
}: TeamSpinnerProps) {
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const [spinPhase, setSpinPhase] = useState<"idle" | "fast" | "slowing" | "stopped">("idle")
  const [spinSpeed, setSpinSpeed] = useState(50)
  const [finalTeamIndex, setFinalTeamIndex] = useState<number | null>(null)
  const targetTeamIndexRef = useRef<number | null>(null)
  const spinAudioRef = useRef<HTMLAudioElement | null>(null)

  // Play spin sound effect
  const playSpinSound = useCallback(() => {
    try {
      if (!spinAudioRef.current) {
        spinAudioRef.current = new Audio('/sounds/spin.mp3')
        spinAudioRef.current.volume = 0.5
      }
      spinAudioRef.current.currentTime = 0
      spinAudioRef.current.play()
    } catch {
      // Silently fail if audio isn't available
    }
  }, [])

  // Stop spin sound
  const stopSpinSound = useCallback(() => {
    if (spinAudioRef.current) {
      spinAudioRef.current.pause()
      spinAudioRef.current.currentTime = 0
    }
  }, [])

  // Reset to idle when isSpinning becomes false
  useEffect(() => {
    if (!isSpinning && spinPhase !== "idle") {
      setSpinPhase("idle")
      setSpinSpeed(50)
      setFinalTeamIndex(null)
      stopSpinSound()
    }
  }, [isSpinning, spinPhase, stopSpinSound])

  const startSpin = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * teams.length)
    targetTeamIndexRef.current = randomIndex
    setSpinPhase("fast")
    setSpinSpeed(50)
    playSpinSound()
    onStartSpin()
  }, [onStartSpin, playSpinSound])

  useEffect(() => {
    if (spinPhase === "idle" || spinPhase === "stopped") return

    const interval = setInterval(() => {
      setCurrentTeamIndex(prev => (prev + 1) % teams.length)
    }, spinSpeed)

    return () => clearInterval(interval)
  }, [spinPhase, spinSpeed])

  useEffect(() => {
    if (spinPhase === "fast") {
      const timer = setTimeout(() => {
        setSpinPhase("slowing")
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [spinPhase])

  useEffect(() => {
    if (spinPhase === "slowing" && targetTeamIndexRef.current !== null) {
      const targetIndex = targetTeamIndexRef.current
      const slowdownInterval = setInterval(() => {
        setSpinSpeed(prev => {
          const newSpeed = prev + 30
          if (newSpeed >= 400) {
            clearInterval(slowdownInterval)
            setCurrentTeamIndex(targetIndex)
            setFinalTeamIndex(targetIndex)
            setSpinPhase("stopped")
            stopSpinSound()
            return 400
          }
          return newSpeed
        })
      }, 200)
      return () => clearInterval(slowdownInterval)
    }
  }, [spinPhase, stopSpinSound])

  // Stay on "Revealing..." for 1 second then trigger the win animation
  useEffect(() => {
    if (finalTeamIndex !== null && spinPhase === "stopped") {
      const timer = setTimeout(() => {
        onSpinComplete(teams[finalTeamIndex])
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [finalTeamIndex, spinPhase, onSpinComplete])

  const currentTeam = teams[currentTeamIndex]

  return (
    <div className="w-full">
      <motion.div 
        className="relative bg-black/40 backdrop-blur rounded-xl overflow-hidden"
        animate={{
          boxShadow: spinPhase !== "idle" 
            ? `0 0 20px ${currentTeam.color}40, 0 0 40px ${currentTeam.color}20`
            : "none"
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Team Display Row */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Team/Spot Indicator */}
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg relative overflow-hidden"
                style={{ 
                  backgroundColor: spinPhase === "idle" ? "#3f3f46" : 
                                   spinPhase === "stopped" ? "#666" : currentTeam.color 
                }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
              >
                {spinPhase === "idle" ? (
                  <SpotsIcon className="h-6 w-auto" />
                ) : spinPhase === "stopped" ? (
                  "?"
                ) : (
                  currentTeam.abbrev
                )}
                {spinPhase === "stopped" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: [-50, 50] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>

              {/* Team Name / Spot Assignment */}
              <div className="flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={spinPhase === "idle" ? "idle" : spinPhase === "stopped" ? "hidden" : currentTeam.name}
                    className="text-white font-semibold text-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: spinPhase === "fast" ? 0.05 : 0.15 }}
                  >
                    {spinPhase === "idle" ? "Your Spot Assignment" : 
                     spinPhase === "stopped" ? "???" : 
                     `${currentTeam.city} ${currentTeam.name}`}
                  </motion.span>
                </AnimatePresence>
                <span className="text-white/50 text-sm">
                  {username ? `${username}'s Spot` : "Win a spot to spin"}
                </span>
              </div>
            </div>

            {/* Spin Button */}
            <motion.button
              onClick={spinPhase === "idle" ? startSpin : undefined}
              disabled={disabled || spinPhase !== "idle"}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-colors ${
                disabled || spinPhase !== "idle"
                  ? 'bg-zinc-700 text-white/40 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 text-black'
              }`}
              whileHover={disabled || spinPhase !== "idle" ? {} : { scale: 1.02 }}
              whileTap={disabled || spinPhase !== "idle" ? {} : { scale: 0.98 }}
            >
              {spinPhase === "idle" ? "Tap to spin" : spinPhase === "stopped" ? "Revealing..." : "Spinning"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export { teams }
