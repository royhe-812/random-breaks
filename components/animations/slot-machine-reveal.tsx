"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const STARS_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBayLiveApp_Stars_DW_CC_v007_CC%202-OGJYd3jy5o3bamd4lN3498JekCYscy.png"
const FIRE_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBay_Live_Emoji_a_v008_Fire.0072%202-IVWHtqVd8MJLUNA3EfYsVshGT1EjUg.png"

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
  color: string
  secondary?: string
}

interface SlotMachineRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function SlotMachineReveal({ isRevealing, onComplete, team: propTeam }: SlotMachineRevealProps) {
  const [spinning, setSpinning] = useState([true, true, true])
  const [results, setResults] = useState([0, 0, 0])
  const [phase, setPhase] = useState<"idle" | "spinning" | "stopping" | "won">("idle")
  const audioContextRef = useRef<AudioContext | null>(null)
  
  const finalTeam = propTeam || teams[results[0]]

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  const playTickSound = () => {
    if (!audioContextRef.current) return
    const ctx = audioContextRef.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.frequency.value = 800 + Math.random() * 400
    oscillator.type = "sine"
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.05)
  }

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

  useEffect(() => {
    if (isRevealing && phase === "idle") {
      setPhase("spinning")
      setSpinning([true, true, true])
      
      // Pick the winning team
      const winningIndex = Math.floor(Math.random() * teams.length)
      
      // Stop reels one by one
      setTimeout(() => {
        setSpinning([false, true, true])
        setResults(prev => [winningIndex, prev[1], prev[2]])
        playTickSound()
      }, 1500)
      
      setTimeout(() => {
        setSpinning([false, false, true])
        setResults(prev => [prev[0], winningIndex, prev[2]])
        playTickSound()
      }, 2200)
      
      setTimeout(() => {
        setSpinning([false, false, false])
        setResults([winningIndex, winningIndex, winningIndex])
        setPhase("stopping")
        playTickSound()
      }, 2900)
      
      setTimeout(() => {
        setPhase("won")
        playWinSound()
      }, 3200)
      
      setTimeout(() => {
        onComplete()
      }, 5500)
    }
  }, [isRevealing, phase, onComplete])

  // Reset when not revealing
  useEffect(() => {
    if (!isRevealing) {
      setPhase("idle")
      setSpinning([true, true, true])
    }
  }, [isRevealing])

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      {/* Dark overlay */}
      <motion.div
        className="absolute inset-0 bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Slot Machine */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
      >
        {/* Machine frame */}
        <div 
          className="rounded-3xl p-6 backdrop-blur-xl"
          style={{
            background: "rgba(24, 24, 27, 0.95)",
            boxShadow: phase === "won" 
              ? `0 0 60px ${finalTeam.color}80, 0 20px 60px rgba(0,0,0,0.5)`
              : "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-white font-bold text-xl">TEAM SLOTS</h2>
            <div className="w-full h-0.5 bg-white/20 mt-2" />
          </div>

          {/* Reels container */}
          <div className="flex gap-2 p-4 rounded-2xl bg-black/50">
            {[0, 1, 2].map((reelIndex) => (
              <div
                key={reelIndex}
                className="w-20 h-24 rounded-xl overflow-hidden relative"
                style={{
                  background: "linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(30,30,30,0.9) 50%, rgba(0,0,0,0.8) 100%)",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
                }}
              >
                {/* Spinning reel */}
                {spinning[reelIndex] ? (
                  <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    animate={{ y: [0, -80, 0] }}
                    transition={{
                      duration: 0.12,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    {teams.slice(0, 3).map((team, i) => (
                      <div
                        key={i}
                        className="w-16 h-20 flex items-center justify-center text-2xl font-black"
                        style={{ color: team.color }}
                      >
                        {team.abbrev}
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", damping: 10 }}
                  >
                    <div
                      className="text-3xl font-black"
                      style={{ color: teams[results[reelIndex]].color }}
                    >
                      {teams[results[reelIndex]].abbrev}
                    </div>
                  </motion.div>
                )}

                {/* Reel shine overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Winner display */}
          <AnimatePresence>
            {phase === "won" && (
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                  }}
                >
                  <span className="text-white/60 text-sm">YOU GOT</span>
                  <div 
                    className="text-2xl font-black"
                    style={{ color: finalTeam.color }}
                  >
                    {teams[results[0]].city} {teams[results[0]].name}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Celebration effects */}
        <AnimatePresence>
          {phase === "won" && (
            <>
              {/* Stars */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute"
                  style={{
                    left: `${20 + i * 20}%`,
                    top: `${10 + (i % 2) * 60}%`,
                  }}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ 
                    scale: 1, 
                    rotate: 0,
                    y: [0, -10, 0],
                  }}
                  transition={{
                    delay: i * 0.1,
                    y: { duration: 2, repeat: Infinity },
                  }}
                >
                  <div className="relative w-10 h-10">
                    <Image src={STARS_URL} alt="" fill className="object-contain" />
                  </div>
                </motion.div>
              ))}

              {/* Fire icons */}
              <motion.div
                className="absolute left-4 top-1/2"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                transition={{ rotate: { duration: 0.5, repeat: Infinity } }}
              >
                <div className="relative w-12 h-12">
                  <Image src={FIRE_URL} alt="" fill className="object-contain" />
                </div>
              </motion.div>
              <motion.div
                className="absolute right-4 top-1/2"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
                transition={{ rotate: { duration: 0.5, repeat: Infinity } }}
              >
                <div className="relative w-12 h-12">
                  <Image src={FIRE_URL} alt="" fill className="object-contain" />
                </div>
              </motion.div>

              {/* Confetti */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: i % 2 === 0 ? finalTeam.color : teams[results[0]].secondary,
                    left: "50%",
                    top: "50%",
                  }}
                  initial={{ scale: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: (Math.random() - 0.5) * 200,
                    y: (Math.random() - 0.5) * 200,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: Math.random() * 0.3,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
