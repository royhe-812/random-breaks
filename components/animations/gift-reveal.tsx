"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HolographicShine } from "./celebration-elements"
import Lottie, { LottieRefCurrentProps } from "lottie-react"
import giftBoxAnimation from "@/public/animations/gift-box-open.json"

const SWOOSH_SOUND_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/universfield-swoosh-07-351043-l81HTAvQZ8cfxNXFm9ZreRxb1nKXNB.mp3"

// Shaking/wobble sound for gift box - complements the randomizer tick sound
const useShakeSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  // Play a wobble sound - uses sine wave like the tick but with a wobble effect
  const playWobbleSound = useCallback((intensity: number = 1) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      // Create two oscillators for a wobble effect (like the tick but lower and wobbly)
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      osc1.connect(gainNode)
      osc2.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      // Lower frequency than the tick (400-500Hz vs 600-800Hz) for a complementary sound
      const baseFreq = 400 + Math.random() * 100
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, ctx.currentTime + 0.06)
      osc1.type = 'sine'
      
      // Second oscillator slightly detuned for wobble
      osc2.frequency.setValueAtTime(baseFreq * 1.02, ctx.currentTime)
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.82, ctx.currentTime + 0.06)
      osc2.type = 'sine'
      
      // Quick envelope
      gainNode.gain.setValueAtTime(0.06 * intensity, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
      
      osc1.start(ctx.currentTime)
      osc2.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.08)
      osc2.stop(ctx.currentTime + 0.08)
    } catch {
      // Silently fail
    }
  }, [])

  const startShaking = useCallback(() => {
    // Clear any existing timeouts
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []
    
    // Lottie animation shakes at frames 0, 5, 10, 15, 20, 25, 30, 35, 40, 45
    // At 25fps, each frame is 40ms, so shake events are every 200ms (5 frames)
    // The animation starts after a 200ms delay, so offset accordingly
    const shakeTimes = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800]
    
    shakeTimes.forEach((time, index) => {
      const timeout = setTimeout(() => {
        // Intensity decreases as we approach the opening
        const intensity = 1 - (index * 0.05)
        playWobbleSound(intensity)
      }, time)
      timeoutsRef.current.push(timeout)
    })
  }, [playWobbleSound])

  const stopShaking = useCallback(() => {
    timeoutsRef.current.forEach(t => clearTimeout(t))
    timeoutsRef.current = []
  }, [])

  return { startShaking, stopShaking }
}

const teams = [
  { name: "Submariner", city: "Rolex", abbrev: "SUB", color: "#E31837", secondary: "#FFB81C" },
  { name: "Speedmaster", city: "Omega", abbrev: "SPD", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Tank", city: "Cartier", abbrev: "TNK", color: "#003594", secondary: "#869397" },
  { name: "Nautilus", city: "Patek Philippe", abbrev: "NAU", color: "#AA0000", secondary: "#B3995D" },
  { name: "Presage", city: "Seiko", abbrev: "PRS", color: "#00338D", secondary: "#C60C30" },
  { name: "Black Bay", city: "Tudor", abbrev: "BBY", color: "#008E97", secondary: "#FC4C02" },
  { name: "Navitimer", city: "Breitling", abbrev: "NAV", color: "#241773", secondary: "#9E7C0C" },
  { name: "Carrera", city: "TAG Heuer", abbrev: "CRR", color: "#0076B6", secondary: "#B0B7BC" },
  { name: "Snowflake", city: "Grand Seiko", abbrev: "SNW", color: "#203731", secondary: "#FFB612" },
  { name: "Khaki Field", city: "Hamilton", abbrev: "KHK", color: "#FB4F14", secondary: "#000000" },
  { name: "G-Shock", city: "Casio", abbrev: "GSK", color: "#125740", secondary: "#000000" },
  { name: "Spirit", city: "Longines", abbrev: "SPT", color: "#FB4F14", secondary: "#002244" },
  { name: "Promaster", city: "Citizen", abbrev: "PRO", color: "#0080C6", secondary: "#FFC20E" },
  { name: "Aquis", city: "Oris", abbrev: "AQU", color: "#002C5F", secondary: "#A2AAAD" },
  { name: "Luminor", city: "Panerai", abbrev: "LUM", color: "#03202F", secondary: "#A71930" },
  { name: "Pilot", city: "IWC", abbrev: "PLT", color: "#FFB612", secondary: "#101820" },
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
  onTeamSelected?: (team: Team) => void
}

export function GiftReveal({ isRevealing, onComplete, team: propTeam, onTeamSelected }: GiftRevealProps) {
  const [phase, setPhase] = useState<"idle" | "opening" | "revealed">("idle")
  const [randomTeam, setRandomTeam] = useState(() => teams[Math.floor(Math.random() * teams.length)])
  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const swooshAudioRef = useRef<HTMLAudioElement | null>(null)
  const { startShaking, stopShaking } = useShakeSound()
  const team = propTeam || randomTeam

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
      // Pick a new random team each reveal
      const newTeam = propTeam || teams[Math.floor(Math.random() * teams.length)]
      setRandomTeam(newTeam)
      onTeamSelected?.(newTeam)
      setPhase("idle")
      
      // Start the animation and shake sound together
      const openTimer = setTimeout(() => {
        setPhase("opening")
        if (lottieRef.current) {
          lottieRef.current.goToAndPlay(0)
        }
        // Start shake sound synced with animation start
        startShaking()
      }, 200)
      
      // The Lottie is 75 frames at 25fps = 3 seconds
      // Reveal the team about 2 seconds in when the box is fully open
      const revealTimer = setTimeout(() => {
        setPhase("revealed")
        // Play swoosh sound as team emerges from the box
        if (swooshAudioRef.current) {
          swooshAudioRef.current.currentTime = 0
          swooshAudioRef.current.play().catch(() => {})
        }
      }, 2200)
      const completeTimer = setTimeout(() => onComplete(), 4500)
      
      return () => {
        clearTimeout(openTimer)
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

      {/* Revealed team logo - emerges from the box */}
      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div
            className="flex flex-col items-center relative z-10"
            initial={{ scale: 0.3, y: 150, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 150, 
              damping: 12,
              mass: 0.8,
            }}
          >
            {/* Rising glow trail effect */}
            <motion.div
              className="absolute w-32 h-64 -z-10"
              style={{
                background: `linear-gradient(to top, ${team.color}00, ${team.color}40, ${team.color}00)`,
                filter: 'blur(20px)',
              }}
              initial={{ y: 100, opacity: 0, scaleY: 0.5 }}
              animate={{ y: -20, opacity: [0, 1, 0], scaleY: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            
            {/* Team logo container with rounded square */}
            <motion.div
              className="relative w-28 h-28 rounded-2xl flex items-center justify-center"
              style={{
                background: team.color,
              }}
              initial={{ rotateX: 45 }}
              animate={{ 
                rotateX: 0,
                y: [0, -6, 0],
                boxShadow: [
                  `0 0 40px ${team.color}60, 0 0 80px ${team.color}40`,
                  `0 0 60px ${team.color}80, 0 0 100px ${team.color}50`,
                  `0 0 40px ${team.color}60, 0 0 80px ${team.color}40`,
                ],
              }}
              transition={{ 
                rotateX: { duration: 0.4, ease: "easeOut" },
                y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
              }}
            >
              <HolographicShine />
              <span className="text-4xl font-black text-white relative z-10 drop-shadow-lg">
                {(team as typeof teams[0]).abbrev || team.name.slice(0, 2).toUpperCase()}
              </span>
            </motion.div>
            
            {/* Team info */}
            <motion.div
              className="mt-6 text-center relative z-20"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                {(team as typeof teams[0]).city || ""}
              </p>
              <p className="text-2xl font-black text-white drop-shadow-lg">
                {team.name}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
