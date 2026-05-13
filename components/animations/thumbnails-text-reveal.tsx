"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const teams = [
  { name: "Chiefs", city: "Kansas City", abbrev: "KC" },
  { name: "Eagles", city: "Philadelphia", abbrev: "PHI" },
  { name: "Cowboys", city: "Dallas", abbrev: "DAL" },
  { name: "49ers", city: "San Francisco", abbrev: "SF" },
  { name: "Bills", city: "Buffalo", abbrev: "BUF" },
  { name: "Dolphins", city: "Miami", abbrev: "MIA" },
  { name: "Ravens", city: "Baltimore", abbrev: "BAL" },
  { name: "Lions", city: "Detroit", abbrev: "DET" },
  { name: "Packers", city: "Green Bay", abbrev: "GB" },
  { name: "Bengals", city: "Cincinnati", abbrev: "CIN" },
  { name: "Jets", city: "New York", abbrev: "NYJ" },
  { name: "Broncos", city: "Denver", abbrev: "DEN" },
  { name: "Chargers", city: "Los Angeles", abbrev: "LAC" },
  { name: "Colts", city: "Indianapolis", abbrev: "IND" },
  { name: "Texans", city: "Houston", abbrev: "HOU" },
  { name: "Steelers", city: "Pittsburgh", abbrev: "PIT" },
  { name: "Patriots", city: "New England", abbrev: "NE" },
  { name: "Giants", city: "New York", abbrev: "NYG" },
  { name: "Commanders", city: "Washington", abbrev: "WAS" },
  { name: "Bears", city: "Chicago", abbrev: "CHI" },
  { name: "Vikings", city: "Minnesota", abbrev: "MIN" },
  { name: "Saints", city: "New Orleans", abbrev: "NO" },
  { name: "Falcons", city: "Atlanta", abbrev: "ATL" },
  { name: "Panthers", city: "Carolina", abbrev: "CAR" },
  { name: "Buccaneers", city: "Tampa Bay", abbrev: "TB" },
  { name: "Cardinals", city: "Arizona", abbrev: "ARI" },
  { name: "Rams", city: "Los Angeles", abbrev: "LAR" },
  { name: "Seahawks", city: "Seattle", abbrev: "SEA" },
  { name: "Raiders", city: "Las Vegas", abbrev: "LV" },
  { name: "Jaguars", city: "Jacksonville", abbrev: "JAX" },
  { name: "Titans", city: "Tennessee", abbrev: "TEN" },
  { name: "Browns", city: "Cleveland", abbrev: "CLE" },
]

// Pre-sold team indices (16 teams already sold to match 16/32 spots available)
const initialSoldTeams = [0, 3, 5, 7, 10, 12, 14, 17, 19, 21, 23, 25, 27, 29, 30, 31]

interface Team {
  name: string
  city?: string
  color?: string
  abbrev?: string
}

interface ThumbnailsTextRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
  onTeamSelected?: (team: Team) => void
}

export function ThumbnailsTextReveal({ isRevealing, onComplete, team: propTeam, onTeamSelected }: ThumbnailsTextRevealProps) {
  const [phase, setPhase] = useState<"idle" | "cycling" | "selected" | "done">("idle")
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hideSold, setHideSold] = useState(false)
  const [spotsLeft, setSpotsLeft] = useState(16)
  const [lastWinner, setLastWinner] = useState<{ username: string; team: string } | null>(null)
  const [soldTeams, setSoldTeams] = useState<number[]>(initialSoldTeams)
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
            onTeamSelected({
              name: selectedTeam.name,
              city: selectedTeam.city,
              abbrev: selectedTeam.abbrev,
              color: "#ffffff",
            })
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

  return (
    <div className="absolute top-28 left-4 right-20 z-30">
      {/* Container matching stream UI style - full width panel */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
        {/* Grid of team names - 4 columns for readability */}
        <div className="grid grid-cols-4 gap-x-4 gap-y-2">
          {teams.map((team, index) => {
            const isHighlighted = highlightedIndex === index
            const isSelected = selectedIndex === index && phase === "selected"
            const isOther = phase === "selected" && selectedIndex !== index
            const isSold = soldTeams.includes(index)
            
            // Hide sold teams if toggle is on
            if (hideSold && isSold) {
              return <div key={team.name} className="h-7" />
            }
            
            return (
              <motion.div
                key={team.name}
                className={`relative px-2 py-1 rounded-md transition-all duration-100 ${
                  isSold
                    ? 'text-white/30 line-through'
                    : isSelected 
                      ? 'bg-white text-black' 
                      : isHighlighted 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/70'
                }`}
                animate={{
                  scale: isSelected && !isSold ? 1.05 : 1,
                  opacity: isOther ? 0.4 : 1,
                }}
                transition={{ duration: 0.1 }}
              >
                <span className={`text-sm font-medium ${isSelected && !isSold ? 'font-bold' : ''}`}>
                  {team.name}
                </span>
              </motion.div>
            )
          })}
        </div>
        
        {/* Footer stats section */}
        <div className="mt-3 pt-2 border-t border-white/10">
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
