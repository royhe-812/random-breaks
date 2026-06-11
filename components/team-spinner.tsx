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
  isRevealing: boolean
  username?: string
  onViewSpots?: () => void
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

// Circular progress component
const CircularProgress = ({ available, total, size = 16 }: { available: number; total: number; size?: number }) => {
  const percentage = (available / total) * 100
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  const getProgressColor = (pct: number) => {
    if (pct > 50) return "#4CE160" // Green
    if (pct > 30) return "#F5A623" // Yellow/Orange
    return "#FF4444" // Red
  }
  
  return (
    <svg className="transform -rotate-90" width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getProgressColor(percentage)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
      />
    </svg>
  )
}
  
  export function TeamSpinner({
  totalSpots, 
  availableSpots, 
  onSpinComplete, 
  isRevealing,
  username,
  onViewSpots,
}: TeamSpinnerProps) {
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const [phase, setPhase] = useState<"idle" | "pending" | "spinning" | "slowing" | "stopped">("idle")
  const [spinSpeed, setSpinSpeed] = useState(50)
  const [demoSpots, setDemoSpots] = useState<number | null>(null) // For demo cycling through color states
  const targetTeamIndexRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Play soft tick sound using Web Audio API - syncs with each team change
  const playTickSound = useCallback(() => {
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
      
      // Soft, pleasant tick - higher pitch, sine wave for smoothness
      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.02)
      oscillator.type = 'sine'
      
      // Quick fade out for a soft click
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.03)
    } catch {
      // Silently fail if audio context isn't available
    }
  }, [])

  // Enter the pending state when isRevealing becomes true
  useEffect(() => {
    if (isRevealing && phase === "idle") {
      const randomIndex = Math.floor(Math.random() * teams.length)
      targetTeamIndexRef.current = randomIndex
      setPhase("pending")
      setSpinSpeed(50)
    }
  }, [isRevealing, phase])

  // After a brief pending period, begin cycling through the teams
  useEffect(() => {
    if (phase === "pending") {
      const timer = setTimeout(() => {
        setPhase("spinning")
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // Reset when isRevealing becomes false
  useEffect(() => {
    if (!isRevealing && phase !== "idle") {
      setPhase("idle")
      setSpinSpeed(50)
      targetTeamIndexRef.current = null
    }
  }, [isRevealing, phase])

  // Spin through teams
  useEffect(() => {
    if (phase === "idle" || phase === "pending" || phase === "stopped") return

    const interval = setInterval(() => {
      setCurrentTeamIndex(prev => (prev + 1) % teams.length)
      playTickSound()
    }, spinSpeed)

    return () => clearInterval(interval)
  }, [phase, spinSpeed, playTickSound])

  // Start slowing down after 1.5 seconds
  useEffect(() => {
    if (phase === "spinning") {
      const timer = setTimeout(() => {
        setPhase("slowing")
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // Slow down and stop
  useEffect(() => {
    if (phase === "slowing" && targetTeamIndexRef.current !== null) {
      const targetIndex = targetTeamIndexRef.current
      const slowdownInterval = setInterval(() => {
        setSpinSpeed(prev => {
          const newSpeed = prev + 30
          if (newSpeed >= 400) {
            clearInterval(slowdownInterval)
            setCurrentTeamIndex(targetIndex)
            setPhase("stopped")
            return 400
          }
          return newSpeed
        })
      }, 200)
      return () => clearInterval(slowdownInterval)
    }
  }, [phase])

  // Trigger completion after stopping - pause on "???" for 2 seconds
  useEffect(() => {
    if (phase === "stopped" && targetTeamIndexRef.current !== null) {
      const timer = setTimeout(() => {
        onSpinComplete(teams[targetTeamIndexRef.current!])
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [phase, onSpinComplete])

  const currentTeam = teams[currentTeamIndex]
  const isSpinning = phase === "spinning" || phase === "slowing"

  return (
    <div className="w-full">
      <motion.div 
        className="relative bg-black/40 backdrop-blur rounded-xl overflow-hidden"
        animate={{
          boxShadow: isSpinning || phase === "stopped"
            ? `0 0 20px ${currentTeam.color}40, 0 0 40px ${currentTeam.color}20`
            : "none"
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Team Display Row */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Team/Spot Indicator */}
            <motion.div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs relative overflow-hidden"
              style={{ 
                backgroundColor: phase === "idle" || phase === "pending" ? "transparent" : 
                                 phase === "stopped" ? "#666" : currentTeam.color 
              }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
            >
              {phase === "idle" || phase === "pending" ? (
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%F0%9F%93%B8%20Image-9iS4XVufx1PUEY9oOKKsmjnhTZzv9F.png" 
                  alt="Panini Mosaic NFL Box"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : phase === "stopped" ? (
                "?"
              ) : (
                currentTeam.abbrev
              )}
              {phase === "stopped" && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: [-50, 50] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Team Name / Spot Assignment */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {phase === "idle" ? (
                  <div className="overflow-hidden">
                    <motion.div
                      className="text-white font-semibold text-sm whitespace-nowrap"
                      animate={{ x: ["0%", "-50%"] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                      2025 Panini Luminance Football Hobby PYT Box Break #903 &nbsp;&nbsp;&nbsp;&nbsp; 2025 Panini Luminance Football Hobby PYT Box Break #903 &nbsp;&nbsp;&nbsp;&nbsp;
                    </motion.div>
                  </div>
                ) : phase === "pending" ? (
                  <motion.div
                    key="pending"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-white font-semibold text-sm">Pending assignment</span>
                    <span className="flex items-center gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1 h-1 rounded-full bg-white/70"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </span>
                  </motion.div>
                ) : (
                  <motion.span
                    key={phase === "stopped" ? "hidden" : currentTeam.name}
                    className="text-white font-semibold text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: isSpinning ? 0.05 : 0.15 }}
                  >
                    {phase === "stopped" ? "???" : `${currentTeam.city} ${currentTeam.name}`}
                  </motion.span>
                )}
              </AnimatePresence>
              <button 
                onClick={() => {
                  // Cycle through demo states: null (actual) -> 20 (green >50%) -> 12 (yellow 30-50%) -> 5 (red <30%) -> null
                  if (demoSpots === null) setDemoSpots(20)
                  else if (demoSpots === 20) setDemoSpots(12)
                  else if (demoSpots === 12) setDemoSpots(5)
                  else setDemoSpots(null)
                }}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <CircularProgress available={demoSpots ?? availableSpots} total={totalSpots} size={16} />
                <span className="text-sm text-white">
                  {demoSpots ?? availableSpots}/{totalSpots} spots available
                </span>
              </button>
            </div>
            
            {/* View all link */}
            <button 
              onClick={onViewSpots}
              className="flex items-center gap-1 text-white/50 hover:text-white/70 transition-colors"
            >
              <span className="text-sm">View spots</span>
              <svg 
                className="w-4 h-4" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export { teams }
