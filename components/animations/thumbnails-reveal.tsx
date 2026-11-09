"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const teams = [
  { name: "Submariner", city: "Rolex", color: "#E31837", abbrev: "SUB" },
  { name: "Speedmaster", city: "Omega", color: "#004C54", abbrev: "SPD" },
  { name: "Tank", city: "Cartier", color: "#003594", abbrev: "TNK" },
  { name: "Nautilus", city: "Patek Philippe", color: "#AA0000", abbrev: "NAU" },
  { name: "Presage", city: "Seiko", color: "#00338D", abbrev: "PRS" },
  { name: "Black Bay", city: "Tudor", color: "#008E97", abbrev: "BBY" },
  { name: "Navitimer", city: "Breitling", color: "#241773", abbrev: "NAV" },
  { name: "Carrera", city: "TAG Heuer", color: "#0076B6", abbrev: "CRR" },
  { name: "Snowflake", city: "Grand Seiko", color: "#203731", abbrev: "SNW" },
  { name: "Khaki Field", city: "Hamilton", color: "#FB4F14", abbrev: "KHK" },
  { name: "G-Shock", city: "Casio", color: "#125740", abbrev: "GSK" },
  { name: "Spirit", city: "Longines", color: "#FB4F14", abbrev: "SPT" },
  { name: "Promaster", city: "Citizen", color: "#0080C6", abbrev: "PRO" },
  { name: "Aquis", city: "Oris", color: "#002C5F", abbrev: "AQU" },
  { name: "Luminor", city: "Panerai", color: "#03202F", abbrev: "LUM" },
  { name: "Pilot", city: "IWC", color: "#FFB612", abbrev: "PLT" },
]

interface Team {
  name: string
  city?: string
  color: string
  abbrev?: string
}

interface ThumbnailsRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
  onTeamSelected?: (team: Team) => void
}

export function ThumbnailsReveal({ isRevealing, onComplete, team: propTeam, onTeamSelected }: ThumbnailsRevealProps) {
  const [phase, setPhase] = useState<"idle" | "cycling" | "selected" | "done">("idle")
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const hasStartedRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  // Play tick sound
  const playTickSound = () => {
    if (!audioContextRef.current) return
    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.frequency.setValueAtTime(800, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.02)
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.03)
  }

  // Reset when isRevealing changes to false, but only if we're in idle or done phase
  useEffect(() => {
    if (!isRevealing && phase === "done") {
      hasStartedRef.current = false
      setPhase("idle")
      setHighlightedIndex(null)
      setSelectedIndex(null)
    }
  }, [isRevealing, phase])

  useEffect(() => {
    if (isRevealing && !hasStartedRef.current) {
      hasStartedRef.current = true
      setPhase("cycling")
      
      // Determine target team
      const targetTeam = propTeam || teams[Math.floor(Math.random() * teams.length)]
      const targetIndex = teams.findIndex(t => t.name === targetTeam.name)
      const finalIndex = targetIndex >= 0 ? targetIndex : Math.floor(Math.random() * teams.length)
      
      // Cycling animation with decreasing speed
      let currentIndex = 0
      let cycleCount = 0
      const totalCycles = 30 + Math.floor(Math.random() * 15) // 30-45 cycles
      
      const runCycle = () => {
        if (cycleCount >= totalCycles) {
          // Land on target
          setHighlightedIndex(finalIndex)
          setSelectedIndex(finalIndex)
          setPhase("selected")
          playTickSound()
          
          const selectedTeam = teams[finalIndex]
          if (onTeamSelected) {
            onTeamSelected({
              name: selectedTeam.name,
              city: selectedTeam.city,
              color: selectedTeam.color,
              abbrev: selectedTeam.abbrev,
            })
          }
          
          // Complete after showing selection
          setTimeout(() => {
            setPhase("done")
            onComplete()
          }, 3000)
          return
        }
        
        // Move towards target in final cycles
        if (cycleCount >= totalCycles - 5) {
          // Final approach - move towards target
          const stepsToTarget = (finalIndex - currentIndex + teams.length) % teams.length
          if (stepsToTarget > 0) {
            currentIndex = (currentIndex + 1) % teams.length
          }
        } else {
          // Random jumping during fast phase
          currentIndex = (currentIndex + 1 + Math.floor(Math.random() * 3)) % teams.length
        }
        
        setHighlightedIndex(currentIndex)
        playTickSound()
        cycleCount++
        
        // Calculate delay - starts fast, slows down
        const progress = cycleCount / totalCycles
        const baseDelay = 50
        const maxDelay = 300
        const delay = baseDelay + (maxDelay - baseDelay) * Math.pow(progress, 2)
        
        setTimeout(runCycle, delay)
      }
      
      // Start cycling after brief delay
      setTimeout(runCycle, 300)
    }
  }, [isRevealing, propTeam, onTeamSelected, onComplete])

  const selectedTeam = selectedIndex !== null ? teams[selectedIndex] : null

  return (
    <div className="absolute inset-0 z-40">
      {/* Black overlay backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Content container */}
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden z-10">
      {/* Winner announcement - shows above grid during reveal */}
      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            className="mb-4 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-white font-bold text-xl">Adam007</span>
              <span className="text-white/70 text-xl">Won!</span>
            </div>
            <p className="text-white/50 text-sm mt-1">Your spot is revealed!</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Grid of team thumbnails - always visible */}
      <motion.div
        className="grid grid-cols-4 gap-3 p-4"
        layout
      >
        {teams.map((team, index) => {
          const isHighlighted = highlightedIndex === index
          const isSelected = selectedIndex === index && phase === "selected"
          
          return (
            <motion.div
              key={team.name}
              className="relative w-14 h-14 rounded-xl overflow-hidden cursor-pointer"
              style={{
                background: isSelected 
                  ? team.color 
                  : isHighlighted 
                    ? `${team.color}90` 
                    : "rgba(255,255,255,0.08)",
              }}
              animate={{
                scale: isSelected ? 1.25 : isHighlighted ? 1.1 : 1,
                zIndex: isSelected ? 20 : isHighlighted ? 10 : 1,
              }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                duration: 0.15 
              }}
            >
              {/* Glow effect for highlighted/selected */}
              <AnimatePresence>
                {(isHighlighted || isSelected) && (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      boxShadow: isSelected 
                        ? `0 0 30px ${team.color}, 0 0 60px ${team.color}80, inset 0 0 20px ${team.color}40`
                        : `0 0 15px ${team.color}80`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  />
                )}
              </AnimatePresence>
              
              {/* Border for selected */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-3 border-white pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              
              <div
                className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white"
                aria-label={`${team.city} ${team.name}`}
              >
                {team.abbrev}
              </div>
            </motion.div>
          )
        })}
      </motion.div>
      
      {/* Winner display below grid */}
      <div className="h-20 flex items-center justify-center mt-2">
        <AnimatePresence>
          {phase === "selected" && selectedTeam && (
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                {selectedTeam.city}
              </span>
              <span 
                className="text-2xl font-black"
                style={{ color: selectedTeam.color }}
              >
                {selectedTeam.name.toUpperCase()}
              </span>
              <motion.span 
                className="text-green-400 text-xs font-bold tracking-widest mt-0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                WINNER!
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  )
}
