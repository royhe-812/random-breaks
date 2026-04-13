"use client"

// Pick a card reveal animation - v1
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CelebrationElements, HolographicShine } from "./celebration-elements"

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
  city?: string
  abbrev?: string
  color: string
  secondary: string
}

interface PickCardRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function PickCardReveal({ isRevealing, onComplete, team: propTeam }: PickCardRevealProps) {
  const [phase, setPhase] = useState<"shuffle" | "spread" | "pick" | "reveal" | "celebrate">("shuffle")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showShine, setShowShine] = useState(false)
  
  // Generate 3 random teams for the cards
  const cardTeams = useMemo(() => {
    const shuffled = [...teams].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3)
  }, [isRevealing])
  
  // The winning team is always the one the user picks
  const winningTeam = selectedIndex !== null ? cardTeams[selectedIndex] : (propTeam || cardTeams[0])

  useEffect(() => {
    if (isRevealing) {
      setPhase("shuffle")
      setSelectedIndex(null)
      setShowShine(false)
      
      // Shuffle animation
      const shuffleTimer = setTimeout(() => {
        setPhase("spread")
      }, 800)
      
      // Spread cards and wait for pick
      const spreadTimer = setTimeout(() => {
        setPhase("pick")
      }, 1500)
      
      return () => {
        clearTimeout(shuffleTimer)
        clearTimeout(spreadTimer)
      }
    }
  }, [isRevealing])

  const handleCardPick = (index: number) => {
    if (phase !== "pick") return
    
    setSelectedIndex(index)
    setPhase("reveal")
    
    setTimeout(() => {
      setShowShine(true)
      setPhase("celebrate")
    }, 800)
    
    setTimeout(() => {
      onComplete()
    }, 3000)
  }

  // Card positions for spread
  const getCardPosition = (index: number) => {
    if (phase === "shuffle") {
      return { x: 0, y: 0, rotate: 0, scale: 1 }
    }
    
    if (phase === "spread" || phase === "pick") {
      const positions = [
        { x: -90, y: 0, rotate: -10 },
        { x: 0, y: -10, rotate: 0 },
        { x: 90, y: 0, rotate: 10 },
      ]
      return { ...positions[index], scale: 1 }
    }
    
    if (phase === "reveal" || phase === "celebrate") {
      if (index === selectedIndex) {
        return { x: 0, y: -20, rotate: 0, scale: 1.15 }
      }
      // Move non-selected cards away
      const direction = index < (selectedIndex || 0) ? -1 : 1
      return { x: direction * 150, y: 50, rotate: direction * 20, scale: 0.8 }
    }
    
    return { x: 0, y: 0, rotate: 0, scale: 1 }
  }

  return (
    <div className="relative w-full h-[320px] flex items-center justify-center">
      {/* Instruction text */}
      <AnimatePresence>
        {phase === "pick" && (
          <motion.p
            className="absolute -top-2 text-white/80 text-sm font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Pick a card!
          </motion.p>
        )}
      </AnimatePresence>

      {/* Cards container */}
      <div className="relative w-[280px] h-[200px] flex items-center justify-center">
        {cardTeams.map((team, index) => {
          const position = getCardPosition(index)
          const isSelected = index === selectedIndex
          const isFlipped = phase === "reveal" || phase === "celebrate" ? isSelected : false
          
          return (
            <motion.div
              key={`card-${index}`}
              className="absolute w-[100px] h-[140px] cursor-pointer"
              style={{ 
                perspective: "1000px",
                zIndex: isSelected ? 20 : 10 - index,
              }}
              initial={{ x: 0, y: 0, rotate: 0, scale: 0.8, opacity: 0 }}
              animate={{
                x: position.x,
                y: position.y,
                rotate: position.rotate,
                scale: position.scale,
                opacity: phase === "celebrate" && !isSelected ? 0.3 : 1,
              }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                delay: phase === "shuffle" ? index * 0.1 : 0,
              }}
              onClick={() => handleCardPick(index)}
              whileHover={phase === "pick" ? { scale: 1.1, y: -15 } : {}}
            >
              <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                {/* Card Back */}
                <div
                  className="absolute inset-0 rounded-xl overflow-hidden"
                  style={{ 
                    backfaceVisibility: "hidden",
                    background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
                    border: "2px solid rgba(167, 139, 250, 0.4)",
                    boxShadow: phase === "pick" 
                      ? "0 8px 32px rgba(167, 139, 250, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
                      : "0 4px 16px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* Card back pattern */}
                  <div className="absolute inset-2 rounded-lg border border-violet-500/30 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 flex items-center justify-center">
                      <span className="text-violet-300 text-xl font-bold">?</span>
                    </div>
                  </div>
                  
                  {/* Shimmer effect on hover state */}
                  {phase === "pick" && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </div>

                {/* Card Front */}
                <div
                  className="absolute inset-0 rounded-xl overflow-hidden flex flex-col items-center justify-center"
                  style={{ 
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background: `linear-gradient(145deg, ${team.color} 0%, ${team.color}ee 100%)`,
                    border: `3px solid ${team.secondary}`,
                    boxShadow: showShine && isSelected 
                      ? `0 20px 50px ${team.color}60, 0 0 80px rgba(255,255,255,0.3)`
                      : `0 8px 24px ${team.color}40`,
                  }}
                >
                  {/* Team abbreviation */}
                  <motion.span
                    className="text-4xl font-black text-white drop-shadow-lg"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={isFlipped ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                    transition={{ delay: 0.3 }}
                  >
                    {team.abbrev || team.name.slice(0, 2).toUpperCase()}
                  </motion.span>
                  
                  {/* Team info */}
                  <motion.div
                    className="mt-2 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={isFlipped ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-[9px] font-semibold text-white/80 uppercase tracking-wider">
                      {team.city}
                    </p>
                    <p className="text-xs font-bold text-white">
                      {team.name}
                    </p>
                  </motion.div>

                  {/* Holographic shine */}
                  {showShine && isSelected && <HolographicShine />}
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Winner text */}
      <AnimatePresence>
        {phase === "celebrate" && selectedIndex !== null && (
          <motion.div
            className="absolute -bottom-4 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-white/80 text-xs uppercase tracking-wider">
              {winningTeam.city}
            </p>
            <p className="text-2xl font-black text-white">
              {winningTeam.name.toUpperCase()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration particles */}
      {phase === "celebrate" && selectedIndex !== null && (
        <CelebrationElements color={winningTeam.color} secondaryColor={winningTeam.secondary} />
      )}
    </div>
  )
}
