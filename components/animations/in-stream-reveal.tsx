"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

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

interface Team {
  name: string
  city?: string
  abbrev?: string
  color: string
  secondary: string
}

interface InStreamRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
  username?: string
  onWinnerAnnouncement?: (team: Team) => void
}

export function InStreamReveal({ 
  isRevealing, 
  onComplete, 
  team: propTeam, 
  username = "KemMajed90",
  onWinnerAnnouncement 
}: InStreamRevealProps) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "slowing" | "stopped">("idle")
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const [winningTeam, setWinningTeam] = useState<Team | null>(null)
  const [spinSpeed, setSpinSpeed] = useState(50) // ms between team changes

  const selectWinningTeam = useCallback(() => {
    if (propTeam) return propTeam
    return teams[Math.floor(Math.random() * teams.length)]
  }, [propTeam])

  useEffect(() => {
    if (!isRevealing) {
      setPhase("idle")
      setWinningTeam(null)
      setSpinSpeed(50)
      return
    }

    // Start spinning
    setPhase("spinning")
    const winner = selectWinningTeam()
    setWinningTeam(winner)

    // Fast spin for 1.5 seconds
    const slowDownTimer = setTimeout(() => {
      setPhase("slowing")
    }, 1500)

    // Stop after 3 seconds total
    const stopTimer = setTimeout(() => {
      setPhase("stopped")
      // Find the index of the winning team
      const winnerIndex = teams.findIndex(t => t.name === winner.name)
      setCurrentTeamIndex(winnerIndex >= 0 ? winnerIndex : 0)
      
      // Trigger the winner announcement callback
      if (onWinnerAnnouncement) {
        onWinnerAnnouncement(winner)
      }
    }, 3000)

    // Complete after showing result
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 3500)

    return () => {
      clearTimeout(slowDownTimer)
      clearTimeout(stopTimer)
      clearTimeout(completeTimer)
    }
  }, [isRevealing, onComplete, selectWinningTeam, onWinnerAnnouncement])

  // Spin through teams
  useEffect(() => {
    if (phase === "idle" || phase === "stopped") return

    const interval = setInterval(() => {
      setCurrentTeamIndex(prev => (prev + 1) % teams.length)
    }, spinSpeed)

    return () => clearInterval(interval)
  }, [phase, spinSpeed])

  // Gradually slow down during slowing phase
  useEffect(() => {
    if (phase !== "slowing") return

    const slowInterval = setInterval(() => {
      setSpinSpeed(prev => {
        const newSpeed = prev + 30
        if (newSpeed >= 300) {
          clearInterval(slowInterval)
          return 300
        }
        return newSpeed
      })
    }, 150)

    return () => clearInterval(slowInterval)
  }, [phase])

  const currentTeam = teams[currentTeamIndex]
  const displayTeam = phase === "stopped" && winningTeam ? winningTeam : currentTeam

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Spinning team display */}
      <motion.div
        className="relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${displayTeam.color} 0%, ${displayTeam.color}dd 100%)`,
          boxShadow: phase === "stopped" 
            ? `0 0 40px ${displayTeam.color}80, 0 0 80px ${displayTeam.color}40`
            : `0 0 20px ${displayTeam.color}60`,
        }}
        animate={{
          scale: phase === "stopped" ? [1, 1.1, 1] : 1,
        }}
        transition={{
          scale: { duration: 0.3 }
        }}
      >
        {/* Team abbreviation */}
        <motion.span
          key={displayTeam.abbrev}
          className="text-4xl font-black text-white drop-shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.05 }}
        >
          {displayTeam.abbrev}
        </motion.span>

        {/* Inner shine */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)",
          }}
        />
      </motion.div>

      {/* Speed lines during spin */}
      <AnimatePresence>
        {(phase === "spinning" || phase === "slowing") && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-8 rounded-full"
                style={{
                  background: `linear-gradient(to bottom, ${displayTeam.color}80, transparent)`,
                  transformOrigin: "center 80px",
                  rotate: `${i * 45}deg`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: phase === "spinning" ? 0.6 : 0.3, 
                  scale: 1,
                  rotate: `${i * 45 + 360}deg`
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ 
                  rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 0.2 }
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Flash effect when stopped */}
      <AnimatePresence>
        {phase === "stopped" && (
          <motion.div
            className="absolute inset-0 rounded-full bg-white pointer-events-none"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Chat winner announcement component
interface WinnerAnnouncementProps {
  username: string
  team: Team
  show: boolean
}

export function WinnerChatAnnouncement({ username, team, show }: WinnerAnnouncementProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="relative px-3 py-2.5 rounded-xl overflow-hidden bg-black/40 backdrop-blur w-full whitespace-nowrap"
          style={{
            boxShadow: `0 0 30px ${team.color}50, 0 0 60px ${team.color}30, 0 0 90px ${team.color}15`,
          }}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Animated glow border */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: `0 0 25px ${team.color}70, inset 0 0 20px ${team.color}20`,
              border: `1px solid ${team.color}50`,
            }}
            animate={{
              boxShadow: [
                `0 0 25px ${team.color}70, inset 0 0 20px ${team.color}20`,
                `0 0 50px ${team.color}90, inset 0 0 35px ${team.color}35`,
                `0 0 25px ${team.color}70, inset 0 0 20px ${team.color}20`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Sweeping gradient glow (left to right) */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-xl pointer-events-none"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Sparkle particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="text-xl">👑</span>
            <p className="text-sm">
              <span className="font-bold text-white">{username}</span>
              <span className="text-white/80"> Won the </span>
              <span 
                className="font-bold"
                style={{ color: team.color === "#FFB612" ? "#fff" : team.color }}
              >
                {team.city} {team.name}!
              </span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
