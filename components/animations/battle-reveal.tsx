"use client"

// Battle reveal with tension building - v5
import { useState, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const STARS_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBayLiveApp_Stars_DW_CC_v007_CC%202-OGJYd3jy5o3bamd4lN3498JekCYscy.png"
const FIRE_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBay_Live_Emoji_a_v008_Fire.0072%202-IVWHtqVd8MJLUNA3EfYsVshGT1EjUg.png"

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

interface Team {
  name: string
  city: string
  color: string
  secondary: string
}

interface BattleRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function BattleReveal({ isRevealing, onComplete }: BattleRevealProps) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "slowing" | "locked" | "tension1" | "tension2" | "tension3" | "tension4" | "winner">("idle")
  const [leftIndex, setLeftIndex] = useState(0)
  const [rightIndex, setRightIndex] = useState(4)
  const [spinSpeed, setSpinSpeed] = useState(80)
  const [leadingSide, setLeadingSide] = useState<"left" | "right" | "none">("none")
  const audioContextRef = useRef<AudioContext | null>(null)
  
  // Randomly select winner (left or right)
  const [winnerSide] = useMemo(() => {
    return [Math.random() > 0.5 ? "left" : "right"]
  }, [isRevealing])

  // Get the final teams when spinning stops
  const leftTeam = teams[leftIndex]
  const rightTeam = teams[rightIndex]
  const winner = winnerSide === "left" ? leftTeam : rightTeam

  // Play tick sound
  const playTickSound = () => {
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
      
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03)
      oscillator.type = 'square'
      
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.04)
    } catch {
      // Silently fail
    }
  }

  // Play dramatic sound for tension moments
  const playTensionSound = (isWin: boolean) => {
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
      
      oscillator.frequency.setValueAtTime(isWin ? 600 : 400, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(isWin ? 900 : 200, ctx.currentTime + 0.15)
      oscillator.type = 'triangle'
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.2)
    } catch {
      // Silently fail
    }
  }

  // Both cards spinning through teams at different offsets
  useEffect(() => {
    if (phase !== "spinning" && phase !== "slowing") return
    
    const interval = setInterval(() => {
      setLeftIndex(prev => (prev + 1) % teams.length)
      setRightIndex(prev => (prev + 1) % teams.length)
      playTickSound()
    }, spinSpeed)
    
    return () => clearInterval(interval)
  }, [phase, spinSpeed])

  // Slow down spinning
  useEffect(() => {
    if (phase !== "slowing") return
    
    const slowDown = setInterval(() => {
      setSpinSpeed(prev => {
        if (prev >= 350) {
          clearInterval(slowDown)
          return prev
        }
        return prev + 40
      })
    }, 150)
    
    return () => clearInterval(slowDown)
  }, [phase])

  // Tension phase animations - alternate which side is "winning"
  useEffect(() => {
    if (phase === "tension1") {
      setLeadingSide("left")
      playTensionSound(true)
    } else if (phase === "tension2") {
      setLeadingSide("right")
      playTensionSound(true)
    } else if (phase === "tension3") {
      setLeadingSide("left")
      playTensionSound(true)
    } else if (phase === "tension4") {
      setLeadingSide(winnerSide)
      playTensionSound(true)
    } else if (phase === "winner") {
      setLeadingSide(winnerSide)
    }
  }, [phase, winnerSide])

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      setSpinSpeed(80)
      setLeftIndex(0)
      setRightIndex(4)
      setLeadingSide("none")
      
      // Phase 0: Start spinning both cards
      const spinTimer = setTimeout(() => setPhase("spinning"), 100)
      
      // Phase 1: Start slowing down
      const slowTimer = setTimeout(() => setPhase("slowing"), 1500)
      
      // Phase 2: Cards locked in - brief pause
      const lockedTimer = setTimeout(() => setPhase("locked"), 3000)
      
      // Phase 3-6: Tension building - cards battle back and forth
      const tension1Timer = setTimeout(() => setPhase("tension1"), 3500)
      const tension2Timer = setTimeout(() => setPhase("tension2"), 4200)
      const tension3Timer = setTimeout(() => setPhase("tension3"), 4900)
      const tension4Timer = setTimeout(() => setPhase("tension4"), 5600)
      
      // Phase 7: Winner revealed
      const winnerTimer = setTimeout(() => {
        setPhase("winner")
        onComplete()
      }, 6500)

      return () => {
        clearTimeout(spinTimer)
        clearTimeout(slowTimer)
        clearTimeout(lockedTimer)
        clearTimeout(tension1Timer)
        clearTimeout(tension2Timer)
        clearTimeout(tension3Timer)
        clearTimeout(tension4Timer)
        clearTimeout(winnerTimer)
      }
    }
  }, [isRevealing, onComplete])

  // Calculate card scales and positions based on phase
  const getLeftCardStyle = () => {
    if (phase === "winner") {
      return {
        scale: winnerSide === "left" ? 1.3 : 0.7,
        x: winnerSide === "left" ? 60 : -30,
        opacity: winnerSide === "left" ? 1 : 0.3,
        filter: winnerSide === "left" ? "brightness(1.1)" : "grayscale(0.8) brightness(0.5)",
      }
    }
    if (phase === "tension1" || phase === "tension3") {
      return { scale: 1.2, x: 10, opacity: 1, filter: "brightness(1.1)" }
    }
    if (phase === "tension2" || phase === "tension4") {
      return { 
        scale: phase === "tension4" && winnerSide === "left" ? 1.2 : 0.9, 
        x: phase === "tension4" && winnerSide === "left" ? 10 : -10, 
        opacity: 1, 
        filter: phase === "tension4" && winnerSide === "left" ? "brightness(1.1)" : "brightness(0.9)" 
      }
    }
    if (phase === "locked") {
      return { scale: 1.05, x: 0, opacity: 1, filter: "brightness(1)" }
    }
    return { scale: 1, x: 0, opacity: 1, filter: "brightness(1)" }
  }

  const getRightCardStyle = () => {
    if (phase === "winner") {
      return {
        scale: winnerSide === "right" ? 1.3 : 0.7,
        x: winnerSide === "right" ? -60 : 30,
        opacity: winnerSide === "right" ? 1 : 0.3,
        filter: winnerSide === "right" ? "brightness(1.1)" : "grayscale(0.8) brightness(0.5)",
      }
    }
    if (phase === "tension2") {
      return { scale: 1.2, x: -10, opacity: 1, filter: "brightness(1.1)" }
    }
    if (phase === "tension1" || phase === "tension3") {
      return { scale: 0.9, x: 10, opacity: 1, filter: "brightness(0.9)" }
    }
    if (phase === "tension4") {
      return { 
        scale: winnerSide === "right" ? 1.2 : 0.9, 
        x: winnerSide === "right" ? -10 : 10, 
        opacity: 1, 
        filter: winnerSide === "right" ? "brightness(1.1)" : "brightness(0.9)" 
      }
    }
    if (phase === "locked") {
      return { scale: 1.05, x: 0, opacity: 1, filter: "brightness(1)" }
    }
    return { scale: 1, x: 0, opacity: 1, filter: "brightness(1)" }
  }

  if (!isRevealing && phase === "idle") return null

  const leftStyle = getLeftCardStyle()
  const rightStyle = getRightCardStyle()
  const isTensionPhase = phase.startsWith("tension") || phase === "locked"
  const showBattleEffects = isTensionPhase || phase === "winner"

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          className="text-white/70 text-sm mb-6 uppercase tracking-widest"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {phase === "spinning" && "Selecting matchup..."}
          {phase === "slowing" && "Locking in..."}
          {phase === "locked" && "Teams locked!"}
          {isTensionPhase && phase !== "locked" && "BATTLE!"}
          {phase === "winner" && ""}
        </motion.p>
      </AnimatePresence>
      
      {/* Cards container */}
      <div className="flex items-center gap-4 relative">
        {/* Left card */}
        <motion.div
          className="relative w-28 h-40 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${leftTeam.color}dd, ${leftTeam.color}99)`,
            boxShadow: leadingSide === "left" || (phase === "winner" && winnerSide === "left")
              ? `0 0 40px ${leftTeam.color}90, 0 0 60px ${leftTeam.color}50`
              : `0 0 25px ${leftTeam.color}60`,
          }}
          animate={{
            scale: leftStyle.scale,
            x: leftStyle.x,
            opacity: leftStyle.opacity,
            filter: leftStyle.filter,
          }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          {/* Shine effect on winning moments */}
          {(leadingSide === "left" || (phase === "winner" && winnerSide === "left")) && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(105deg, 
                  transparent 0%,
                  rgba(255,255,255,0.3) 45%, 
                  rgba(255,255,255,0.5) 50%,
                  rgba(255,255,255,0.3) 55%, 
                  transparent 100%
                )`,
              }}
              initial={{ x: -150 }}
              animate={{ x: 150 }}
              transition={{ duration: 0.5, repeat: phase === "winner" ? Infinity : 0, repeatDelay: 0.5 }}
            />
          )}
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-4xl font-black text-white drop-shadow-lg"
              style={{ textShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
              key={`left-${leftIndex}`}
              initial={phase === "spinning" || phase === "slowing" ? { y: 15, opacity: 0.5 } : false}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.05 }}
            >
              {leftTeam.name.slice(0, 2).toUpperCase()}
            </motion.span>
            <span className="text-[10px] font-bold text-white/90 mt-1 uppercase tracking-wider">
              {leftTeam.city}
            </span>
            <span className="text-[9px] font-medium text-white/60 uppercase">
              {leftTeam.name}
            </span>
          </div>
          
          {/* Pulsing border on tension */}
          {leadingSide === "left" && (
            <motion.div
              className="absolute inset-0 rounded-xl border-4 pointer-events-none"
              style={{ borderColor: leftTeam.secondary }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* VS indicator - hide when winner selected */}
        <AnimatePresence>
          {phase !== "winner" && (
            <motion.div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center z-10"
              initial={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: showBattleEffects ? [1, 1.2, 1] : 1,
                rotate: showBattleEffects ? [0, 5, -5, 0] : 0,
              }}
              transition={{ duration: 0.3, repeat: showBattleEffects && phase !== "winner" ? Infinity : 0 }}
            >
              <span className="text-sm font-black text-black">VS</span>
              
              {/* Energy sparks during battle */}
              {isTensionPhase && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-3 bg-yellow-300 rounded-full"
                      style={{
                        transformOrigin: "center",
                      }}
                      animate={{
                        x: Math.cos(i * 45 * Math.PI / 180) * 30,
                        y: Math.sin(i * 45 * Math.PI / 180) * 30,
                        opacity: [1, 0],
                        scale: [1, 0.5],
                      }}
                      transition={{
                        duration: 0.4,
                        repeat: Infinity,
                        delay: i * 0.05,
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right card */}
        <motion.div
          className="relative w-28 h-40 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${rightTeam.color}dd, ${rightTeam.color}99)`,
            boxShadow: leadingSide === "right" || (phase === "winner" && winnerSide === "right")
              ? `0 0 40px ${rightTeam.color}90, 0 0 60px ${rightTeam.color}50`
              : `0 0 25px ${rightTeam.color}60`,
          }}
          animate={{
            scale: rightStyle.scale,
            x: rightStyle.x,
            opacity: rightStyle.opacity,
            filter: rightStyle.filter,
          }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          {/* Shine effect on winning moments */}
          {(leadingSide === "right" || (phase === "winner" && winnerSide === "right")) && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(105deg, 
                  transparent 0%,
                  rgba(255,255,255,0.3) 45%, 
                  rgba(255,255,255,0.5) 50%,
                  rgba(255,255,255,0.3) 55%, 
                  transparent 100%
                )`,
              }}
              initial={{ x: -150 }}
              animate={{ x: 150 }}
              transition={{ duration: 0.5, repeat: phase === "winner" ? Infinity : 0, repeatDelay: 0.5 }}
            />
          )}
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-4xl font-black text-white drop-shadow-lg"
              style={{ textShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
              key={`right-${rightIndex}`}
              initial={phase === "spinning" || phase === "slowing" ? { y: -15, opacity: 0.5 } : false}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.05 }}
            >
              {rightTeam.name.slice(0, 2).toUpperCase()}
            </motion.span>
            <span className="text-[10px] font-bold text-white/90 mt-1 uppercase tracking-wider">
              {rightTeam.city}
            </span>
            <span className="text-[9px] font-medium text-white/60 uppercase">
              {rightTeam.name}
            </span>
          </div>
          
          {/* Pulsing border on tension */}
          {leadingSide === "right" && (
            <motion.div
              className="absolute inset-0 rounded-xl border-4 pointer-events-none"
              style={{ borderColor: rightTeam.secondary }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>

      {/* Lightning bolts during tension */}
      <AnimatePresence>
        {isTensionPhase && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 w-0.5 bg-gradient-to-b from-yellow-300 via-white to-yellow-300"
                style={{
                  height: 40 + Math.random() * 30,
                  transformOrigin: "top center",
                }}
                initial={{ opacity: 0, rotate: -20 + i * 10, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 0.25,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner celebration */}
      <AnimatePresence>
        {phase === "winner" && (
          <>
            {/* Floating stars */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute z-40"
                style={{
                  left: winnerSide === "left" ? `${10 + i * 15}%` : `${50 + i * 12}%`,
                  top: `${15 + (i % 2) * 50}%`,
                }}
                initial={{ scale: 0, rotate: -30, opacity: 0 }}
                animate={{ 
                  scale: 1,
                  rotate: 0,
                  opacity: 1,
                  y: [0, -10, 0],
                }}
                transition={{ 
                  delay: i * 0.1,
                  y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <div className="relative w-12 h-12">
                  <Image src={STARS_URL} alt="" fill className="object-contain" />
                </div>
              </motion.div>
            ))}

            {/* Fire icons */}
            <motion.div
              className="absolute z-40"
              style={{
                left: winnerSide === "left" ? "5%" : "75%",
                top: "40%",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: [0, 5, -5, 0] }}
              transition={{ delay: 0.2, rotate: { duration: 0.5, repeat: Infinity } }}
            >
              <div className="relative w-14 h-14">
                <Image src={FIRE_URL} alt="" fill className="object-contain" />
              </div>
            </motion.div>

            {/* Winner text */}
            <motion.div
              className="absolute -bottom-24 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                {winner.city}
              </span>
              <span 
                className="text-3xl font-black"
                style={{ color: winner.color }}
              >
                {winner.name.toUpperCase()}
              </span>
              <span className="text-violet-300 text-sm font-semibold tracking-widest mt-1">
                WINS!
              </span>
            </motion.div>

            {/* Confetti burst */}
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={`confetti-${i}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? winner.color : winner.secondary,
                  left: winnerSide === "left" ? "25%" : "75%",
                  top: "50%",
                }}
                initial={{ scale: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 250,
                  y: (Math.random() - 0.5) * 250,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1.2,
                  delay: 0.1 + i * 0.02,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
