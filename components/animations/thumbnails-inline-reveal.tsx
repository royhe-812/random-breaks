"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const teams = [
  { name: "Chiefs", city: "Kansas City", color: "#E31837", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png" },
  { name: "Eagles", city: "Philadelphia", color: "#004C54", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png" },
  { name: "Cowboys", city: "Dallas", color: "#003594", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png" },
  { name: "49ers", city: "San Francisco", color: "#AA0000", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png" },
  { name: "Bills", city: "Buffalo", color: "#00338D", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png" },
  { name: "Dolphins", city: "Miami", color: "#008E97", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png" },
  { name: "Ravens", city: "Baltimore", color: "#241773", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png" },
  { name: "Lions", city: "Detroit", color: "#0076B6", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png" },
  { name: "Packers", city: "Green Bay", color: "#203731", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png" },
  { name: "Bengals", city: "Cincinnati", color: "#FB4F14", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png" },
  { name: "Jets", city: "New York", color: "#125740", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png" },
  { name: "Broncos", city: "Denver", color: "#FB4F14", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png" },
  { name: "Chargers", city: "Los Angeles", color: "#0080C6", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png" },
  { name: "Colts", city: "Indianapolis", color: "#002C5F", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png" },
  { name: "Texans", city: "Houston", color: "#03202F", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png" },
  { name: "Steelers", city: "Pittsburgh", color: "#FFB612", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png" },
]

interface Team {
  name: string
  city?: string
  color: string
  logo?: string
}

interface ThumbnailsInlineRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
  onTeamSelected?: (team: Team) => void
}

export function ThumbnailsInlineReveal({ isRevealing, onComplete, team: propTeam, onTeamSelected }: ThumbnailsInlineRevealProps) {
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
    
    oscillator.frequency.value = 800 + Math.random() * 400
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.05)
  }

  // Play winner sound
  const playWinnerSound = () => {
    if (!audioContextRef.current) return
    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    const frequencies = [523.25, 659.25, 783.99, 1046.50]
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.value = freq
      oscillator.type = 'sine'
      
      const startTime = ctx.currentTime + i * 0.1
      gainNode.gain.setValueAtTime(0.15, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + 0.3)
    })
  }

  // Reset when not revealing
  useEffect(() => {
    if (!isRevealing) {
      setPhase("idle")
      setHighlightedIndex(null)
      setSelectedIndex(null)
      hasStartedRef.current = false
    }
  }, [isRevealing])

  // Start cycling when revealing
  useEffect(() => {
    if (isRevealing && !hasStartedRef.current && phase === "idle") {
      hasStartedRef.current = true
      setPhase("cycling")
      
      // Random final selection
      const finalIndex = Math.floor(Math.random() * teams.length)
      
      // Cycling animation with slowdown
      let currentIndex = 0
      let delay = 50
      const maxDelay = 300
      const totalCycles = 25 + Math.floor(Math.random() * 10)
      let cycleCount = 0
      
      const cycle = () => {
        if (cycleCount >= totalCycles) {
          // Land on final selection
          setHighlightedIndex(finalIndex)
          setSelectedIndex(finalIndex)
          setPhase("selected")
          playWinnerSound()
          
          const selectedTeam = teams[finalIndex]
          if (onTeamSelected) {
            onTeamSelected(selectedTeam)
          }
          
          // Complete after showing winner
          setTimeout(() => {
            setPhase("done")
            onComplete()
          }, 3000)
          return
        }
        
        currentIndex = (currentIndex + 1) % teams.length
        setHighlightedIndex(currentIndex)
        playTickSound()
        
        cycleCount++
        // Gradually slow down
        if (cycleCount > totalCycles - 10) {
          delay = Math.min(delay * 1.15, maxDelay)
        }
        
        setTimeout(cycle, delay)
      }
      
      setTimeout(cycle, 500)
    }
  }, [isRevealing, phase, onComplete, onTeamSelected])

  const selectedTeam = selectedIndex !== null ? teams[selectedIndex] : null

  return (
    <div className="absolute top-16 right-16 z-30">
      {/* Container matching stream UI style */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/10">
        {/* Header */}
        <div className="text-center mb-2">
          <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
            {phase === "idle" ? "Available Teams" : phase === "cycling" ? "Selecting..." : "Your Team"}
          </span>
        </div>
        
        {/* Grid of team thumbnails - 4x4 compact grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {teams.map((team, index) => {
            const isHighlighted = highlightedIndex === index
            const isSelected = selectedIndex === index && phase === "selected"
            const isOther = phase === "selected" && selectedIndex !== index
            
            return (
              <motion.div
                key={team.name}
                className="relative"
                animate={{
                  scale: isSelected ? 1.1 : isHighlighted ? 1.05 : isOther ? 0.9 : 1,
                  opacity: isOther ? 0.3 : 1,
                }}
                transition={{ duration: 0.15 }}
              >
                {/* Glow effect for highlighted/selected */}
                {(isHighlighted || isSelected) && (
                  <motion.div
                    className="absolute -inset-1 rounded-lg"
                    style={{
                      background: isSelected 
                        ? `radial-gradient(circle, ${team.color}60 0%, transparent 70%)`
                        : `radial-gradient(circle, ${team.color}40 0%, transparent 70%)`,
                      boxShadow: isSelected 
                        ? `0 0 12px ${team.color}, 0 0 24px ${team.color}50`
                        : `0 0 8px ${team.color}80`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                
                {/* Team logo container */}
                <div 
                  className={`relative w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-150 ${
                    isSelected 
                      ? 'bg-white/20 ring-2 ring-white' 
                      : isHighlighted 
                        ? 'bg-white/15' 
                        : 'bg-white/5'
                  }`}
                >
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
        
        {/* Winner display */}
        <AnimatePresence>
          {phase === "selected" && selectedTeam && (
            <motion.div
              className="mt-3 pt-2 border-t border-white/10 text-center"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-white/60 text-[10px] uppercase tracking-wider block">
                {selectedTeam.city}
              </span>
              <span 
                className="text-sm font-bold block"
                style={{ color: selectedTeam.color }}
              >
                {selectedTeam.name}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
