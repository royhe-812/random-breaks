"use client"

// Battle reveal with tension building - v5
import { useState, useEffect, useRef } from "react"
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
  city: string
  abbrev: string
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
  const [winnerSide, setWinnerSide] = useState<"left" | "right">("left")
  const audioContextRef = useRef<AudioContext | null>(null)
  
  // Pick new random winner each time isRevealing becomes true
  useEffect(() => {
    if (isRevealing) {
      setWinnerSide(Math.random() > 0.5 ? "left" : "right")
    }
  }, [isRevealing])

  // Get the final teams when spinning stops
  const leftTeam = teams[leftIndex]
  const rightTeam = teams[rightIndex]
  const winner = winnerSide === "left" ? leftTeam : rightTeam

  // Play battle tick sound - deeper, more impactful
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
      
      // Deeper battle tick
      oscillator.frequency.setValueAtTime(400, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04)
      oscillator.type = 'triangle'
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.05)
    } catch {
      // Silently fail
    }
  }

  // Play dramatic tension sound - rising or falling whoosh
  const playTensionSound = (isWin: boolean) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      
      // Main tone
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      
      // Harmonic layer
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      
      if (isWin) {
        // Rising triumphant sound
        osc1.frequency.setValueAtTime(300, ctx.currentTime)
        osc1.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15)
        osc2.frequency.setValueAtTime(450, ctx.currentTime)
        osc2.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15)
      } else {
        // Falling uncertain sound
        osc1.frequency.setValueAtTime(500, ctx.currentTime)
        osc1.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15)
        osc2.frequency.setValueAtTime(750, ctx.currentTime)
        osc2.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15)
      }
      
      osc1.type = 'triangle'
      osc2.type = 'sine'
      
      gain1.gain.setValueAtTime(0.12, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      gain2.gain.setValueAtTime(0.08, ctx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      
      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.2)
      osc2.start(ctx.currentTime)
      osc2.stop(ctx.currentTime + 0.2)
    } catch {
      // Silently fail
    }
  }

  // Play victory fanfare - dramatic winner sound
  const playVictorySound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      
      // Create a short fanfare with multiple notes
      const notes = [523, 659, 784, 1047] // C5, E5, G5, C6 - major chord arpeggio
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08)
        osc.type = 'triangle'
        
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08)
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.08 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25)
        
        osc.start(ctx.currentTime + i * 0.08)
        osc.stop(ctx.currentTime + i * 0.08 + 0.3)
      })
      
      // Add a final shimmer
      const shimmer = ctx.createOscillator()
      const shimmerGain = ctx.createGain()
      shimmer.connect(shimmerGain)
      shimmerGain.connect(ctx.destination)
      
      shimmer.frequency.setValueAtTime(1047, ctx.currentTime + 0.32)
      shimmer.frequency.exponentialRampToValueAtTime(2094, ctx.currentTime + 0.5)
      shimmer.type = 'sine'
      
      shimmerGain.gain.setValueAtTime(0.1, ctx.currentTime + 0.32)
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      
      shimmer.start(ctx.currentTime + 0.32)
      shimmer.stop(ctx.currentTime + 0.6)
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
      playVictorySound()
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
            zIndex: phase === "winner" ? (winnerSide === "left" ? 20 : 5) : (leadingSide === "left" ? 15 : 10),
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
              {leftTeam.abbrev}
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

        {/* VS indicator - always visible until winner is selected */}
        {phase !== "winner" && (
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center z-10"
          >
            <span className="text-sm font-black text-black">VS</span>
          </div>
        )}

        {/* Right card */}
        <motion.div
          className="relative w-28 h-40 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${rightTeam.color}dd, ${rightTeam.color}99)`,
            boxShadow: leadingSide === "right" || (phase === "winner" && winnerSide === "right")
              ? `0 0 40px ${rightTeam.color}90, 0 0 60px ${rightTeam.color}50`
              : `0 0 25px ${rightTeam.color}60`,
            zIndex: phase === "winner" ? (winnerSide === "right" ? 20 : 5) : (leadingSide === "right" ? 15 : 10),
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
              {rightTeam.abbrev}
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

      {/* Winner celebration */}
      <AnimatePresence>
        {phase === "winner" && (
          <>
            {/* Winner text */}
            <motion.div
              className="absolute -bottom-32 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">
                {winner.city}
              </span>
              <span className="text-3xl font-black text-white">
                {winner.name.toUpperCase()}
              </span>
              <span className="text-green-400 text-sm font-semibold tracking-widest mt-1">
                WINS!
              </span>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
