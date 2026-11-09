"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

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
  { name: "El Primero", city: "Zenith", color: "#002244", abbrev: "ELP" },
  { name: "Royal Oak", city: "Audemars Piguet", color: "#0B2265", abbrev: "ROK" },
  { name: "Overseas", city: "Vacheron Constantin", color: "#5A1414", abbrev: "OVS" },
  { name: "Reverso", city: "Jaeger-LeCoultre", color: "#0B162A", abbrev: "REV" },
  { name: "Big Bang", city: "Hublot", color: "#4F2683", abbrev: "BGB" },
  { name: "Datejust", city: "Rolex", color: "#D3BC8D", abbrev: "DTJ" },
  { name: "Seamaster", city: "Omega", color: "#A71930", abbrev: "SEA" },
  { name: "Pelagos", city: "Tudor", color: "#0085CA", abbrev: "PEL" },
  { name: "Tangente", city: "Nomos", color: "#D50A0A", abbrev: "TAN" },
  { name: "BR 03", city: "Bell & Ross", color: "#97233F", abbrev: "BR3" },
  { name: "GMT-Master", city: "Rolex", color: "#003594", abbrev: "GMT" },
  { name: "Prospex", city: "Seiko", color: "#002244", abbrev: "PSX" },
  { name: "Marine", city: "Breguet", color: "#000000", abbrev: "MAR" },
  { name: "556", city: "Sinn", color: "#006778", abbrev: "S56" },
  { name: "PRX", city: "Tissot", color: "#0C2340", abbrev: "PRX" },
  { name: "Marlin", city: "Timex", color: "#311D00", abbrev: "MRL" },
]

// Pre-sold team indices (16 teams already sold to match 16/32 spots available)
const initialSoldTeams = [0, 3, 5, 7, 10, 12, 14, 17, 19, 21, 23, 25, 27, 29, 30, 31]

// Team the board sits on before a spin starts (first team not already sold).
const defaultPreselectedIndex = teams.findIndex((_, i) => !initialSoldTeams.includes(i))

interface Team {
  name: string
  city?: string
  color: string
  abbrev?: string
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
  /** When true, the compact randomizer view shows the radial progress + spots
      available under the team title (used by the "no-spots card" board copy). */
  showMiniSpots?: boolean
  /** When true, the pre-selected board tile (before spinning) is outlined in a
      green stroke instead of the default white (used by the Board concept). */
  preselectGreen?: boolean
  /** When true (board view + stream UI hidden), the board panel extends to the
      right edge with padding matching the left, since the right nav is hidden. */
  streamUiHidden?: boolean
}

// Ported from the "Board" concept (thumbnails-5) in the Live Board chat. Kept
// separate from ThumbnailsInlineReveal so the older concept here is unaffected.
export function BoardReveal({ isRevealing, onComplete, team: propTeam, onTeamSelected, availableSpots, onCycleSpots, onViewSpots, showMiniSpots = false, preselectGreen = false, streamUiHidden = false }: ThumbnailsInlineRevealProps) {
  const [phase, setPhase] = useState<"idle" | "pending" | "cycling" | "selected" | "done">("idle")
  // Which presentation to show: the full board grid or the compact single-row
  // randomizer. Both share the same cycling state below, so switching between
  // them stays perfectly in sync and can happen at any time (even mid-spin).
  const [viewMode, setViewMode] = useState<"board" | "randomizer">("board")
  // Portal target for the randomizer view (a slot in the bottom stack, between
  // the comment input and the auction card). Resolved after mount.
  const [randomizerSlot, setRandomizerSlot] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setRandomizerSlot(document.getElementById("board-randomizer-slot"))
  }, [])
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(defaultPreselectedIndex)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [spotsLeft, setSpotsLeft] = useState(16)
  // Seeded from a pre-assigned team so the attribution shows before the first
  // spin (some teams are already sold).
  const [lastWinner, setLastWinner] = useState<{ username: string; team: string } | null>({
    username: "mikeys_breaks",
    team: teams[initialSoldTeams[initialSoldTeams.length - 1]].name,
  })
  const [soldTeams, setSoldTeams] = useState<number[]>(initialSoldTeams)
  const hasStartedRef = useRef(false)
  // Remembers the last team the spin landed on so the board keeps that spot
  // highlighted instead of reverting to the original pre-selection.
  const lastLandedRef = useRef<number | null>(null)
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
      // Keep the highlight on the team we last landed on so the board doesn't
      // revert to the original pre-selection after a spin. Falls back to the
      // default pre-selected team before the first spin.
      setHighlightedIndex(lastLandedRef.current ?? defaultPreselectedIndex)
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
      const totalCycles = 45 + Math.floor(Math.random() * 15)
      let cycleCount = 0
      
      const cycle = () => {
        if (cycleCount >= totalCycles) {
          // Land on final selection - buyer sees the team they were assigned
          lastLandedRef.current = finalIndex
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
        // Gradually slow down over a longer wind-down for a more drawn-out finish
        if (cycleCount > totalCycles - 18) {
          delay = Math.min(delay * 1.12, maxDelay)
        }
        
        setTimeout(cycle, delay)
      }
      
      setTimeout(cycle, 500)
    }
  }, [isRevealing, phase, onComplete, onTeamSelected])

  {/* Last winner attribution - shared between both views. */}
  const lastWinnerText = (
    <p className="text-xs truncate min-w-0">
      {lastWinner ? (
        <>
          <span className="text-white font-semibold">{lastWinner.username}</span>
          <span className="text-white/60"> won </span>
          <span className="text-[#4CE160] font-semibold">{lastWinner.team}</span>
        </>
      ) : null}
    </p>
  )

  {/* Expand toggle - shared between both views. */}
  const expandToggle = (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-white/70 text-xs font-medium">Expand</span>
      <button
        type="button"
        role="switch"
        aria-checked={viewMode === "board"}
        aria-label="Expand board"
        onClick={() => setViewMode(viewMode === "board" ? "randomizer" : "board")}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          viewMode === "board" ? "bg-[#4CE160]" : "bg-white/20"
        }`}
      >
        <motion.span
          className="inline-block h-4 w-4 rounded-full bg-white shadow"
          animate={{ x: viewMode === "board" ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )

  {/* Container matching stream UI style - full width panel */}
  const panel = (
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
        {/* Randomizer view - single-row component: box/team thumbnail on the
            left with a single team name. Idle shows a starting spot (the first
            unsold team); during a spin it cycles and lands on a team. Reuses the
            same cycling state as the board. */}
        {viewMode === "randomizer" && (() => {
          const activeIndex = selectedIndex ?? highlightedIndex
          const activeTeam = activeIndex !== null ? teams[activeIndex] : null
          const isLanded = selectedIndex !== null && (phase === "selected" || phase === "pending" || phase === "done")
          // Starting spot: first team not already sold.
          const startingTeam = teams.find((_, i) => !initialSoldTeams.includes(i)) ?? teams[0]
          const displayTeam = activeTeam ?? startingTeam
          return (
            <div className="flex items-center gap-3">
              {/* Thumbnail: team color/abbrev */}
              <motion.div
                className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-white text-xs"
                style={{ backgroundColor: displayTeam.color }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
              >
                {displayTeam.abbrev ?? displayTeam.name.slice(0, 3).toUpperCase()}
              </motion.div>

              {/* Team name: cycling/landed team (green once landed), else starting spot */}
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeTeam ? (isLanded ? "landed" : activeTeam.name) : "start"}
                    className="block font-semibold text-sm truncate"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, color: isLanded ? "#4CE160" : "#ffffff" }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: isLanded ? 0.2 : 0.05 }}
                  >
                    {displayTeam.city} {displayTeam.name}
                  </motion.span>
                </AnimatePresence>

                {/* Radial progress + spots available under the team title */}
                {showMiniSpots && (
                  <button
                    type="button"
                    onClick={onCycleSpots}
                    className="flex items-center gap-1.5 mt-1 hover:opacity-80 transition-opacity"
                  >
                    <CircularProgress available={availableSpots ?? spotsLeft} total={32} size={14} />
                    <span className="text-white/80 text-xs font-medium whitespace-nowrap">
                      {availableSpots ?? spotsLeft}/32 items available
                    </span>
                  </button>
                )}
              </div>

              {/* View all - opens the break spots sheet. Shown only on the
                  Board version (showMiniSpots), hidden on the Buy Box version. */}
              {showMiniSpots && (
                <button
                  type="button"
                  onClick={onViewSpots}
                  className="flex items-center gap-0.5 text-white/60 hover:text-white text-sm whitespace-nowrap transition-colors shrink-0"
                >
                  View items
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}
            </div>
          )
        })()}

        {/* Board view: team title + View items button above the thumbnails,
            with a divider separating this row from the grid. The title shows
            the pre-selected team before a spin, cycles during the spin, and
            turns green once it lands on the winning team. */}
        {viewMode === "board" && (() => {
          const activeIndex = selectedIndex ?? highlightedIndex
          const startingTeam = teams.find((_, i) => !initialSoldTeams.includes(i)) ?? teams[0]
          const displayTeam = activeIndex !== null ? teams[activeIndex] : startingTeam
          const isLanded = selectedIndex !== null && (phase === "selected" || phase === "pending" || phase === "done")
          return (
            <div className="mb-3 pb-3 border-b border-white/10 flex items-center justify-between gap-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={isLanded ? "landed" : displayTeam.name}
                  className="block font-semibold text-sm truncate"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, color: isLanded ? "#4CE160" : "#ffffff" }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: isLanded ? 0.2 : 0.05 }}
                >
                  {displayTeam.city} {displayTeam.name}
                </motion.span>
              </AnimatePresence>
              <button
                type="button"
                onClick={onViewSpots}
                className="flex items-center gap-0.5 text-white/60 hover:text-white text-sm whitespace-nowrap transition-colors shrink-0"
              >
                View items
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )
        })()}

        {/* Grid of team thumbnails - 6 columns, tiles sized to match the randomizer thumbnail */}
        {viewMode === "board" && (
        <div className="grid grid-cols-6 gap-2 justify-items-center">
          {teams
            .map((team, index) => ({ team, originalIndex: index }))
            .map(({ team, originalIndex }) => {
            const isHighlighted = highlightedIndex === originalIndex
            const isSelected = selectedIndex === originalIndex && (phase === "selected" || phase === "pending")
            const isOther = (phase === "selected" || phase === "pending") && selectedIndex !== originalIndex
            const isSold = soldTeams.includes(originalIndex) && !isSelected
            // Board concept only: the pre-selected tile (before a spin starts)
            // gets a green stroke instead of the default white highlight.
            const isPreselected = preselectGreen && isHighlighted && phase === "idle"
            
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
                {/* Glow effect only for the final landed selection. The
                    rotating highlight and the pre-selected board tile show a
                    crisp ring only (no blurry glow halo). */}
                {isSelected && (
                  <motion.div
                    className="absolute -inset-1 rounded-lg"
                    style={{
                      background: `radial-gradient(circle, #4CE16060 0%, transparent 70%)`,
                      boxShadow: `0 0 12px #4CE160, 0 0 24px #4CE16050`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                
                {/* Team color tile with initials (matches randomizer in other concepts) */}
                <div 
                  className={`relative w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-150 ${
                    isSelected 
                      ? 'ring-2 ring-[#4CE160] ring-offset-2 ring-offset-black/40' 
                      : isPreselected
                        ? 'ring-2 ring-[#4CE160]'
                        : isHighlighted 
                          ? (preselectGreen ? 'ring-2 ring-[#4CE160]' : 'ring-1 ring-white/60')
                          : ''
                  }`}
                  style={{ backgroundColor: team.color, opacity: isSold ? 0.4 : 1 }}
                >
                  <span className="font-bold text-white text-xs tracking-tight">
                    {team.abbrev ?? team.name.slice(0, 3).toUpperCase()}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
        )}

        {/* Last winner + Expand toggle in a bottom row with a divider - shared
            by both the board and randomizer views. */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          {lastWinnerText}
          {expandToggle}
        </div>
      </div>
  )

  // Board view stays up top, under the seller name. The randomizer view portals
  // into the bottom stack (between the comment input and the auction card).
  if (viewMode === "randomizer") {
    return randomizerSlot ? createPortal(panel, randomizerSlot) : null
  }

  return <div className={`absolute top-[108px] left-4 z-30 transition-all duration-300 ${streamUiHidden ? "right-4" : "right-20"}`}>{panel}</div>
}
