"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BackAndForthMarquee } from "@/components/back-and-forth-marquee"

// Helper function for progress color - 4-tier: green -> yellow -> orange -> red
const getProgressColor = (percentage: number) => {
  const ratio = percentage / 100
  if (ratio <= 0.25) return "#ef4444" // red
  if (ratio <= 0.5) return "#f97316" // orange
  if (ratio <= 0.75) return "#eab308" // yellow
  return "#22c55e" // green
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
  { name: "Patriots", city: "New England", color: "#002244", abbrev: "NE", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png" },
  { name: "Giants", city: "New York", color: "#0B2265", abbrev: "NYG", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png" },
  { name: "Commanders", city: "Washington", color: "#5A1414", abbrev: "WAS", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png" },
  { name: "Bears", city: "Chicago", color: "#0B162A", abbrev: "CHI", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png" },
  { name: "Vikings", city: "Minnesota", color: "#4F2683", abbrev: "MIN", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/min.png" },
  { name: "Saints", city: "New Orleans", color: "#D3BC8D", abbrev: "NO", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/no.png" },
  { name: "Falcons", city: "Atlanta", color: "#A71930", abbrev: "ATL", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png" },
  { name: "Panthers", city: "Carolina", color: "#0085CA", abbrev: "CAR", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png" },
  { name: "Buccaneers", city: "Tampa Bay", color: "#D50A0A", abbrev: "TB", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png" },
  { name: "Cardinals", city: "Arizona", color: "#97233F", abbrev: "ARI", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png" },
  { name: "Rams", city: "Los Angeles", color: "#003594", abbrev: "LAR", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png" },
  { name: "Seahawks", city: "Seattle", color: "#002244", abbrev: "SEA", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png" },
  { name: "Raiders", city: "Las Vegas", color: "#000000", abbrev: "LV", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png" },
  { name: "Jaguars", city: "Jacksonville", color: "#006778", abbrev: "JAX", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png" },
  { name: "Titans", city: "Tennessee", color: "#0C2340", abbrev: "TEN", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png" },
  { name: "Browns", city: "Cleveland", color: "#311D00", abbrev: "CLE", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png" },
]

// Pre-sold team indices (16 teams already sold to match 16/32 spots available)
const initialSoldTeams = [0, 3, 5, 7, 10, 12, 14, 17, 19, 21, 23, 25, 27, 29, 30, 31]

interface Team {
  name: string
  city?: string
  color: string
  abbrev?: string
  logo?: string
}

interface ThumbnailsInlineRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
  onTeamSelected?: (team: Team) => void
  /** Optional controlled spots count for the top arc (overrides internal state). */
  availableSpots?: number
  /** Tapping the spots arc cycles the available count through the color tiers. */
  onCycleSpots?: () => void
  onViewSpots?: () => void
}

export function ThumbnailsInlineReveal({ isRevealing, onComplete, team: propTeam, onTeamSelected, availableSpots, onCycleSpots, onViewSpots }: ThumbnailsInlineRevealProps) {
  const [phase, setPhase] = useState<"idle" | "pending" | "cycling" | "selected" | "done">("idle")
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
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
        {/* Case break title marquee */}
        <BackAndForthMarquee duration={26} className="mb-2">
          <span className="text-white font-semibold text-sm whitespace-nowrap">
            2025 Panini Luminance Football Hobby PYT Box Break #903
          </span>
        </BackAndForthMarquee>

        {/* Top stats: spots available (state indicator) + view spots, with a divider below */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10">
          {/* Spots available with progress bar - tap to cycle the color tiers */}
          <button
            type="button"
            onClick={onCycleSpots}
            className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
          >
            <CircularProgress available={availableSpots ?? spotsLeft} total={32} size={16} />
            <span className="text-white text-xs font-medium whitespace-nowrap">{availableSpots ?? spotsLeft}/32 spots</span>
          </button>

          {/* View spots (opens the sheet) */}
          <button
            onClick={onViewSpots}
            className="flex items-center gap-0.5 text-white/60 hover:text-white text-xs whitespace-nowrap transition-colors shrink-0"
          >
            View spots
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Grid of team thumbnails - 8x2 horizontal grid to span width */}
        <div className="grid grid-cols-8 gap-2">
          {teams
            .map((team, index) => ({ team, originalIndex: index }))
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
                
                {/* Team color tile with initials (matches randomizer in other concepts) */}
                <div 
                  className={`relative w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center transition-all duration-150 ${
                    isSelected 
                      ? 'ring-2 ring-white' 
                      : isHighlighted 
                        ? 'ring-1 ring-white/60' 
                        : ''
                  }`}
                  style={{ backgroundColor: team.color, opacity: isSold ? 0.4 : 1 }}
                >
                  <span className="font-bold text-white text-xs tracking-tight">
                    {team.abbrev ?? team.name.slice(0, 3).toUpperCase()}
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
        
        {/* Pending + assigned section - below the board, with a divider above */}
        {selectedTeam && (
          <div className="mt-3 pt-3 border-t border-white/10">
            {/* Assigned team chip - white outline while pending, green-filled once assigned */}
            <motion.div
              className="flex"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span
                className="inline-flex h-4 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3 text-[10px] leading-none font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: phase === "done" ? "#4CE160" : "transparent",
                  color: phase === "done" ? "#101820" : "#ffffff",
                  boxShadow: phase === "done" ? "none" : "inset 0 0 0 1px rgba(255,255,255,0.6)",
                }}
              >
                {selectedTeam.city} {selectedTeam.name}
              </span>
            </motion.div>

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
          </div>
        )}
      </div>
    </div>
  )
}
