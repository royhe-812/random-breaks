"use client"

// Imports
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"


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
  isRevealing,
  username
}: TeamSpinnerProps) {
  const [phase, setPhase] = useState<"idle" | "revealing">("idle")
  const targetTeamRef = useRef<typeof teams[0] | null>(null)

  // Start revealing when isRevealing becomes true
  useEffect(() => {
    if (isRevealing && phase === "idle") {
      // Pick a random team
      const randomTeam = teams[Math.floor(Math.random() * teams.length)]
      targetTeamRef.current = randomTeam
      setPhase("revealing")
      
      // After 1.5 seconds, trigger completion
      const timer = setTimeout(() => {
        if (targetTeamRef.current) {
          onSpinComplete(targetTeamRef.current)
        }
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [isRevealing, phase, onSpinComplete])

  // Reset when isRevealing becomes false
  useEffect(() => {
    if (!isRevealing && phase !== "idle") {
      setPhase("idle")
      targetTeamRef.current = null
    }
  }, [isRevealing, phase])

  return (
    <div className="w-full">
      <motion.div 
        className="relative bg-black/40 backdrop-blur rounded-xl overflow-hidden"
        animate={{
          boxShadow: phase === "revealing" 
            ? "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)"
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
                  backgroundColor: phase === "idle" ? "#3f3f46" : "#666"
                }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
              >
                {phase === "idle" ? (
                  <SpotsIcon className="h-6 w-auto" />
                ) : (
                  "?"
                )}
                {phase === "revealing" && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: [-50, 50] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>

              {/* Team Name / Spot Assignment */}
              <div className="flex flex-col">
                <motion.span
                  className="text-white font-semibold text-lg"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                >
                  {phase === "idle" ? "Your Spot Assignment" : "???"}
                </motion.span>
                <span className="text-white/50 text-sm">
                  {username ? `${username}'s Spot` : "Spot assigned"}
                </span>
              </div>
            </div>

            {/* Status indicator */}
            <div
              className={`px-5 py-2.5 rounded-full font-semibold text-sm ${
                phase === "revealing"
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : 'bg-zinc-700 text-white/40'
              }`}
            >
              {phase === "idle" ? "Spot assigned" : "Revealing..."}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export { teams }
