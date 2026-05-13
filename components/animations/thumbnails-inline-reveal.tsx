"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const teams = [
  { name: "Chiefs", city: "Kansas City", color: "#E31837", abbrev: "KC", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png" },
  { name: "Eagles", city: "Philadelphia", color: "#004C54", abbrev: "PHI", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png" },
  { name: "Cowboys", city: "Dallas", color: "#003594", abbrev: "DAL", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png" },
  { name: "49ers", city: "San Francisco", color: "#AA0000", abbrev: "SF", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png" },
  { name: "Bills", city: "Buffalo", color: "#00338D", abbrev: "BUF", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png" },
  { name: "Dolphins", city: "Miami", color: "#008E97", abbrev: "MIA", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png" },
  { name: "Ravens", city: "Baltimore", color: "#241773", abbrev: "BAL", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png" },
  { name: "Lions", city: "Detroit", color: "#0076B6", abbrev: "DET", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png" },
  { name: "Packers", city: "Green Bay", color: "#203731", abbrev: "GB", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png" },
  { name: "Bengals", city: "Cincinnati", color: "#FB4F14", abbrev: "CIN", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png" },
  { name: "Jets", city: "New York", color: "#125740", abbrev: "NYJ", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png" },
  { name: "Broncos", city: "Denver", color: "#FB4F14", abbrev: "DEN", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png" },
  { name: "Chargers", city: "Los Angeles", color: "#0080C6", abbrev: "LAC", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png" },
  { name: "Colts", city: "Indianapolis", color: "#002C5F", abbrev: "IND", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png" },
  { name: "Texans", city: "Houston", color: "#03202F", abbrev: "HOU", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png" },
  { name: "Steelers", city: "Pittsburgh", color: "#FFB612", abbrev: "PIT", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png" },
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
  const [hideSold, setHideSold] = useState(false)
  const [spotsLeft, setSpotsLeft] = useState(16)
  const [lastWinner, setLastWinner] = useState<{ username: string; team: string } | null>(null)
  const [soldTeams, setSoldTeams] = useState<number[]>([])
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
          
          // Update stats
          setSoldTeams(prev => [...prev, finalIndex])
          setSpotsLeft(prev => Math.max(0, prev - 1))
          setLastWinner({ username: "Adam007", team: selectedTeam.name })
          
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
    <div className="absolute top-28 left-4 right-20 z-30">
      {/* Container matching stream UI style - full width panel */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
        {/* Grid of team thumbnails - 8x2 horizontal grid to span width */}
        <div className="grid grid-cols-8 gap-2">
          {teams.map((team, index) => {
            const isHighlighted = highlightedIndex === index
            const isSelected = selectedIndex === index && phase === "selected"
            const isOther = phase === "selected" && selectedIndex !== index
            const isSold = soldTeams.includes(index) && !isSelected
            
            // Hide sold teams if toggle is on
            if (hideSold && isSold) {
              return <div key={team.name} className="aspect-square" />
            }
            
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
                  className={`relative w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center transition-all duration-150 ${
                    isSelected 
                      ? 'bg-white/20 ring-2 ring-white' 
                      : isHighlighted 
                        ? 'bg-white/15' 
                        : isSold
                          ? 'bg-white/5 opacity-50'
                          : 'bg-white/5'
                  }`}
                >
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={40}
                    height={40}
                    className={`object-contain w-3/4 h-3/4 ${isSold ? 'opacity-40' : ''}`}
                  />
                  {/* Sold X overlay */}
                  {isSold && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
        
        {/* Footer stats section */}
        <div className="mt-3 pt-2 border-t border-white/10">
          {/* Top row - Spots left and Hide sold toggle */}
          {/* Spots available with progress bar */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1 flex-1 mr-4">
              <span className="text-white text-xs font-medium">{spotsLeft}/32 spots available</span>
              <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: '#AD9EFA',
                    width: `${((32 - spotsLeft) / 32) * 100}%` 
                  }}
                />
              </div>
            </div>
            
            {/* Hide sold toggle */}
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs">Hide sold</span>
              <button
                onClick={() => setHideSold(!hideSold)}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  hideSold ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div 
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    hideSold ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
          
          {/* Second row - Last winner */}
          {lastWinner && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-white/50 text-xs">Last winner:</span>
              <span className="text-white text-xs">
                <span className="font-semibold">{lastWinner.username}</span>
                <span className="text-white/50"> won </span>
                <span className="font-semibold">{lastWinner.team}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
