"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"

const SWOOSH_SOUND_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/universfield-swoosh-07-351043-l81HTAvQZ8cfxNXFm9ZreRxb1nKXNB.mp3"

interface Team {
  name: string
  city: string
  abbrev: string
  color: string
}

interface WinnerWinnerRevealProps {
  isRevealing: boolean
  team?: Team | null
  onComplete: () => void
  username?: string
  onTeamSelected?: (team: Team) => void
}

const defaultTeams = [
  { name: "Chiefs", city: "Kansas City", color: "#E31837", secondary: "#FFB81C", abbrev: "KC" },
  { name: "49ers", city: "San Francisco", color: "#AA0000", secondary: "#B3995D", abbrev: "SF" },
  { name: "Eagles", city: "Philadelphia", color: "#004C54", secondary: "#A5ACAF", abbrev: "PHI" },
  { name: "Cowboys", city: "Dallas", color: "#003594", secondary: "#869397", abbrev: "DAL" },
  { name: "Bills", city: "Buffalo", color: "#00338D", secondary: "#C60C30", abbrev: "BUF" },
  { name: "Dolphins", city: "Miami", color: "#008E97", secondary: "#FC4C02", abbrev: "MIA" },
]

export function WinnerWinnerReveal({ isRevealing, team: propTeam, onComplete, username = "Adam007", onTeamSelected }: WinnerWinnerRevealProps) {
  const [randomTeam, setRandomTeam] = useState(() => defaultTeams[Math.floor(Math.random() * defaultTeams.length)])
  const team = propTeam || randomTeam
  const [phase, setPhase] = useState<"idle" | "winner-text" | "team-card" | "done">("idle")
  const swooshAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element
  useEffect(() => {
    swooshAudioRef.current = new Audio(SWOOSH_SOUND_URL)
    swooshAudioRef.current.volume = 0.5
    return () => {
      if (swooshAudioRef.current) {
        swooshAudioRef.current.pause()
        swooshAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isRevealing) {
      // Pick a new random team if none provided
      const newTeam = propTeam || defaultTeams[Math.floor(Math.random() * defaultTeams.length)]
      setRandomTeam(newTeam)
      onTeamSelected?.(newTeam)
      
      // Start with winner text phase
      setPhase("winner-text")
      
      // After 2.5 seconds, transition to team card
      const teamCardTimer = setTimeout(() => {
        setPhase("team-card")
        // Play swoosh sound as the team card appears
        if (swooshAudioRef.current) {
          swooshAudioRef.current.currentTime = 0
          swooshAudioRef.current.play().catch(() => {})
        }
      }, 2500)
      
      // After 5.5 seconds total (3 seconds on card), complete
      const completeTimer = setTimeout(() => {
        setPhase("done")
        onComplete()
      }, 5500)
      
      return () => {
        clearTimeout(teamCardTimer)
        clearTimeout(completeTimer)
      }
    } else {
      setPhase("idle")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRevealing])

  // Don't render anything when done or not revealing
  if (!isRevealing || !team || phase === "done") return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background - matching card flip darker background */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, rgba(76, 225, 96, 0.15) 0%, rgba(76, 225, 96, 0.05) 40%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Team Card - Always rendered underneath, revealed when winner text slides up */}
      <motion.div
        className="absolute flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ 
          opacity: phase === "team-card" ? 1 : 0, 
          y: phase === "team-card" ? 0 : 50 
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Username banner */}
        <motion.div
          className="flex flex-col items-center mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase === "team-card" ? 1 : 0, y: phase === "team-card" ? 0 : 20 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xl">{username}</span>
            <span className="text-white/70 text-xl">Won!</span>
          </div>
          <span className="text-white/50 text-sm mt-1">Your spot is revealed!</span>
        </motion.div>

        {/* Team Card - matching card flip style */}
        <motion.div
          className="relative w-52 h-80 rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}dd 50%, ${team.color}bb 100%)`,
            borderWidth: 2,
            borderColor: team.secondary,
            boxShadow: `0 0 40px ${team.color}40`,
          }}
          initial={{ scale: 0.9 }}
          animate={{ scale: phase === "team-card" ? 1 : 0.9 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
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

          {/* Sweeping shine effect - continuous glow sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: [0, 1, 1, 0], x: ["-100%", "0%", "100%", "200%"] }}
            transition={{ 
              duration: 2, 
              ease: "easeInOut", 
              delay: 0.3,
              repeat: Infinity,
              repeatDelay: 1,
            }}
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
              width: "50%",
            }}
          />

          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
            {/* Team Logo - circular like card flip */}
            <motion.div
              className="w-28 h-28 rounded-full flex items-center justify-center mb-4 relative"
              style={{ 
                backgroundColor: team.secondary,
                boxShadow: `0 8px 32px ${team.color}60, inset 0 -4px 12px rgba(0,0,0,0.2)`,
              }}
              initial={{ scale: 0 }}
              animate={phase === "team-card" ? { scale: 1 } : { scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
            >
              <span className="text-4xl font-black text-white drop-shadow-lg">
                {team.abbrev}
              </span>
            </motion.div>

            {/* Team name */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={phase === "team-card" ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-1">
                {team.city}
              </p>
              <p className="text-2xl font-black text-white drop-shadow-lg">
                {team.name}
              </p>
            </motion.div>
          </div>
        </motion.div>

      </motion.div>

      {/* Winner Text Phase - slides up with parallax to reveal card */}
      <AnimatePresence>
        {phase === "winner-text" && (
          <motion.div
            key="winner-text"
            className="relative flex flex-col items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stacked WINNER text - each line animates in smoothly then exits with parallax */}
            <div className="relative flex flex-col items-center -space-y-3">
              {[...Array(7)].map((_, i) => (
                <motion.span
                  key={i}
                  className="text-6xl font-black italic text-[#4CE160] leading-none tracking-tight"
                  style={{ 
                    opacity: 1 - (i * 0.1),
                  }}
                  initial={{ opacity: 0, y: 60, scale: 0.7 }}
                  animate={{ 
                    opacity: 1 - (i * 0.1), 
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    // Parallax effect - opposite of entrance (go back down with staggered speeds)
                    y: 200 + (i * 40),
                    opacity: 0,
                    scale: 0.7,
                  }}
                  transition={{ 
                    delay: i * 0.12,
                    duration: 0.5,
                    ease: [0.34, 1.56, 0.64, 1], // Spring-like easing
                    exit: { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
                  }}
                >
                  WINNER
                </motion.span>
              ))}
              
              {/* Animated Crown - 3x larger, centered over text */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ opacity: 0, scale: 0, y: 100 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                }}
                exit={{
                  // Crown exits fastest going back down (opposite of entrance)
                  y: 300,
                  opacity: 0,
                  scale: 0.3,
                }}
                transition={{ 
                  opacity: { delay: 0.8, duration: 0.4 },
                  scale: { delay: 0.8, duration: 0.6, type: "spring", stiffness: 200 },
                  y: { delay: 0.8, duration: 0.6 },
                  exit: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.08, 1],
                  }}
                  transition={{ 
                    rotate: { duration: 0.6, repeat: Infinity, repeatDelay: 1.2 },
                    scale: { duration: 0.8, repeat: Infinity, repeatDelay: 0.4 }
                  }}
                >
                  <Image 
                    src="/images/crown.png" 
                    alt="Crown" 
                    width={1200} 
                    height={1200}
                    className="drop-shadow-2xl"
                    style={{ filter: "drop-shadow(0 0 100px rgba(255, 215, 0, 0.7))" }}
                  />
                </motion.div>
              </motion.div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
