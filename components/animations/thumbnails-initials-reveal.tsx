"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Helper function for progress color
const getProgressColor = (percentage: number) => {
  if (percentage > 50) return "#4CE160" // Green
  if (percentage > 30) return "#F5A623" // Yellow/Orange
  return "#FF4444" // Red
}

// Circular progress component
const CircularProgress = ({ available, total, size = 16 }: { available: number; total: number; size?: number }) => {
  const percentage = (available / total) * 100
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  return (
    <svg className="transform -rotate-90" width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getProgressColor(percentage)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
      />
    </svg>
  )
}

const teams = [
  { name: "Chiefs", city: "Kansas City", color: "#E31837", initials: "KC", abbrev: "KC" },
  { name: "Eagles", city: "Philadelphia", color: "#004C54", initials: "PHI", abbrev: "PHI" },
  { name: "Cowboys", city: "Dallas", color: "#003594", initials: "DAL", abbrev: "DAL" },
  { name: "49ers", city: "San Francisco", color: "#AA0000", initials: "SF", abbrev: "SF" },
  { name: "Bills", city: "Buffalo", color: "#00338D", initials: "BUF", abbrev: "BUF" },
  { name: "Dolphins", city: "Miami", color: "#008E97", initials: "MIA", abbrev: "MIA" },
  { name: "Ravens", city: "Baltimore", color: "#241773", initials: "BAL", abbrev: "BAL" },
  { name: "Lions", city: "Detroit", color: "#0076B6", initials: "DET", abbrev: "DET" },
  { name: "Packers", city: "Green Bay", color: "#203731", initials: "GB", abbrev: "GB" },
  { name: "Bengals", city: "Cincinnati", color: "#FB4F14", initials: "CIN", abbrev: "CIN" },
  { name: "Jets", city: "New York", color: "#125740", initials: "NYJ", abbrev: "NYJ" },
  { name: "Broncos", city: "Denver", color: "#FB4F14", initials: "DEN", abbrev: "DEN" },
  { name: "Chargers", city: "Los Angeles", color: "#0080C6", initials: "LAC", abbrev: "LAC" },
  { name: "Colts", city: "Indianapolis", color: "#002C5F", initials: "IND", abbrev: "IND" },
  { name: "Texans", city: "Houston", color: "#03202F", initials: "HOU", abbrev: "HOU" },
  { name: "Steelers", city: "Pittsburgh", color: "#FFB612", initials: "PIT", abbrev: "PIT" },
  { name: "Patriots", city: "New England", color: "#002244", initials: "NE", abbrev: "NE" },
  { name: "Giants", city: "New York", color: "#0B2265", initials: "NYG", abbrev: "NYG" },
  { name: "Commanders", city: "Washington", color: "#5A1414", initials: "WAS", abbrev: "WAS" },
  { name: "Bears", city: "Chicago", color: "#0B162A", initials: "CHI", abbrev: "CHI" },
  { name: "Vikings", city: "Minnesota", color: "#4F2683", initials: "MIN", abbrev: "MIN" },
  { name: "Saints", city: "New Orleans", color: "#D3BC8D", initials: "NO", abbrev: "NO" },
  { name: "Falcons", city: "Atlanta", color: "#A71930", initials: "ATL", abbrev: "ATL" },
  { name: "Panthers", city: "Carolina", color: "#0085CA", initials: "CAR", abbrev: "CAR" },
  { name: "Buccaneers", city: "Tampa Bay", color: "#D50A0A", initials: "TB", abbrev: "TB" },
  { name: "Cardinals", city: "Arizona", color: "#97233F", initials: "ARI", abbrev: "ARI" },
  { name: "Rams", city: "Los Angeles", color: "#003594", initials: "LAR", abbrev: "LAR" },
  { name: "Seahawks", city: "Seattle", color: "#002244", initials: "SEA", abbrev: "SEA" },
  { name: "Raiders", city: "Las Vegas", color: "#000000", initials: "LV", abbrev: "LV" },
  { name: "Jaguars", city: "Jacksonville", color: "#006778", initials: "JAX", abbrev: "JAX" },
  { name: "Titans", city: "Tennessee", color: "#0C2340", initials: "TEN", abbrev: "TEN" },
  { name: "Browns", city: "Cleveland", color: "#311D00", initials: "CLE", abbrev: "CLE" },
]

// Pre-sold team indices (16 teams already sold to match 16/32 spots available)
const initialSoldTeams = [0, 3, 5, 7, 10, 12, 14, 17, 19, 21, 23, 25, 27, 29, 30, 31]

interface Team {
  name: string
  city?: string
  color: string
  initials?: string
}

interface ThumbnailsInitialsRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
  onTeamSelected?: (team: Team) => void
}

export function ThumbnailsInitialsReveal({ isRevealing, onComplete, team: propTeam, onTeamSelected }: ThumbnailsInitialsRevealProps) {
  const [phase, setPhase] = useState<"idle" | "pending" | "cycling" | "selected" | "done">("idle")
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

      // Get available (not sold) team indices
      const availableIndices = teams
        .map((_, index) => index)
        .filter(index => !soldTeams.includes(index))
      
      // Random final selection from available teams only
      const finalIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
      
      // Cycling animation with slowdown - only cycle through available teams
      let currentAvailableIndex = 0
      let delay = 50
      const maxDelay = 300
      const totalCycles = 25 + Math.floor(Math.random() * 10)
      let cycleCount = 0
      
      const cycle = () => {
        if (cycleCount >= totalCycles) {
          // Land on final selection - buyer sees the team they were assigned
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
          
          // After buyer sees their team, enter "pending" while the seller
          // assigns it on the backend, then trigger the in-chat winner moment
          setTimeout(() => {
            setPhase("pending")
            setTimeout(() => {
              setPhase("done")
              onComplete()
            }, 3000)
          }, 1500)
          return
        }
        
        currentAvailableIndex = (currentAvailableIndex + 1) % availableIndices.length
        setHighlightedIndex(availableIndices[currentAvailableIndex])
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
        {/* Grid of team thumbnails - 6 columns for larger, more legible initials */}
        <div className="grid grid-cols-6 gap-3">
          {teams
            .map((team, index) => ({ team, originalIndex: index }))
            .filter(({ originalIndex }) => !hideSold || !soldTeams.includes(originalIndex))
            .map(({ team, originalIndex }) => {
            const isHighlighted = highlightedIndex === originalIndex
            const isSelected = selectedIndex === originalIndex && (phase === "selected" || phase === "pending")
            const isOther = (phase === "selected" || phase === "pending") && selectedIndex !== originalIndex
            const isSold = soldTeams.includes(originalIndex) && !isSelected
            
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
                
                {/* Team color box with initials */}
                <div 
                  className={`relative w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center transition-all duration-150 ${
                    isSelected 
                      ? 'ring-2 ring-white' 
                      : isHighlighted
                        ? 'ring-2 ring-white'
                        : isSold
                          ? 'opacity-50'
                          : ''
                  }`}
                  style={{ backgroundColor: team.color }}
                >
                  <span 
                    className={`font-bold text-white text-sm ${isSold ? 'opacity-40' : ''}`}
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                  >
                    {team.initials}
                  </span>
                  {/* Sold X overlay */}
                  {isSold && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
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
          {/* Spots available with progress bar */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-1 mr-4">
              <CircularProgress available={spotsLeft} total={32} size={16} />
              <span className="text-white text-xs font-medium">{spotsLeft}/32 spots available</span>
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

          {/* Pending assignment indicator */}
          {phase === "pending" && (
            <motion.div
              className="flex items-center gap-1.5 mt-1.5"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="text-white text-xs font-medium">Pending seller assignment</span>
              <span className="flex items-center gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1 h-1 rounded-full bg-white/70"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </span>
            </motion.div>
          )}
          
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
