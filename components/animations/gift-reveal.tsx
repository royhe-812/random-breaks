"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HolographicShine } from "./celebration-elements"
import Lottie, { LottieRefCurrentProps } from "lottie-react"
import giftBoxAnimation from "@/public/animations/gift-box-open.json"

// Shaking/rattling sound for gift box
const useShakeSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const playRattleSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      // Create a short rattle/shake sound
      const noise = ctx.createBufferSource()
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      
      // Fill with noise
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1
      }
      
      noise.buffer = noiseBuffer
      
      // Filter to make it sound more like rattling
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(2000 + Math.random() * 1000, ctx.currentTime)
      filter.Q.setValueAtTime(5, ctx.currentTime)
      
      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      
      noise.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      noise.start(ctx.currentTime)
      noise.stop(ctx.currentTime + 0.05)
    } catch {
      // Silently fail
    }
  }, [])

  const startShaking = useCallback(() => {
    // Play rattles rapidly during shake
    intervalRef.current = setInterval(() => {
      playRattleSound()
    }, 80)
  }, [playRattleSound])

  const stopShaking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  return { startShaking, stopShaking }
}

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
  abbrev?: string
  color: string
  secondary: string
  city?: string
}

interface GiftRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function GiftReveal({ isRevealing, onComplete, team: propTeam }: GiftRevealProps) {
  const [phase, setPhase] = useState<"idle" | "opening" | "revealed">("idle")
  const [randomTeam, setRandomTeam] = useState(() => teams[Math.floor(Math.random() * teams.length)])
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const { startShaking, stopShaking } = useShakeSound()
  const team = propTeam || randomTeam

  useEffect(() => {
    if (isRevealing) {
      // Pick a new random team each reveal
      setRandomTeam(teams[Math.floor(Math.random() * teams.length)])
      setPhase("idle")
      
      // Start the shake sound
      startShaking()
      
      // Start the animation
      const openTimer = setTimeout(() => {
        setPhase("opening")
        if (lottieRef.current) {
          lottieRef.current.goToAndPlay(0)
        }
      }, 200)
      
      // Stop shaking when box opens (around 1 second in)
      const stopShakeTimer = setTimeout(() => {
        stopShaking()
      }, 1000)
      
      // The Lottie is 75 frames at 25fps = 3 seconds
      // Reveal the team about 2 seconds in when the box is fully open
      const revealTimer = setTimeout(() => setPhase("revealed"), 2200)
      const completeTimer = setTimeout(() => onComplete(), 4500)
      
      return () => {
        clearTimeout(openTimer)
        clearTimeout(stopShakeTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
        stopShaking()
      }
    }
  }, [isRevealing, onComplete, startShaking, stopShaking])

  return (
    <div className="relative w-72 h-80 flex items-center justify-center overflow-visible">
      {/* Lottie Gift Box Animation */}
      <AnimatePresence>
        {phase !== "revealed" && (
          <motion.div
            className="absolute flex items-center justify-center"
            style={{ width: 600, height: 600 }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.3 }}
          >
            <Lottie
              lottieRef={lottieRef}
              animationData={giftBoxAnimation}
              loop={false}
              autoplay={false}
              style={{ width: 600, height: 600 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glow effect during opening */}
      <AnimatePresence>
        {phase === "opening" && (
          <motion.div
            className="absolute w-48 h-48 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(255,200,100,0.4) 0%, rgba(255,150,50,0.2) 40%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 1 }}
            exit={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1.5 }}
          />
        )}
      </AnimatePresence>

      {/* Revealed team logo */}
      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div
            className="flex flex-col items-center relative z-10"
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Team logo container with circular glow */}
            <motion.div
              className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: team.color,
              }}
              animate={{ 
                y: [0, -6, 0],
                boxShadow: [
                  `0 0 40px ${team.color}60, 0 0 80px ${team.color}40`,
                  `0 0 60px ${team.color}80, 0 0 100px ${team.color}50`,
                  `0 0 40px ${team.color}60, 0 0 80px ${team.color}40`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <HolographicShine />
              <span className="text-4xl font-black text-white relative z-10 drop-shadow-lg">
                {(team as typeof teams[0]).abbrev || team.name.slice(0, 2).toUpperCase()}
              </span>
            </motion.div>
            
            {/* Team info */}
            <motion.div
              className="mt-6 text-center relative z-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                {(team as typeof teams[0]).city || ""}
              </p>
              <p className="text-2xl font-black text-white drop-shadow-lg">
                {team.name}
              </p>
            </motion.div>
            
            <motion.p
              className="text-green-400 text-xs mt-3 font-medium relative z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Your spot has been revealed!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
