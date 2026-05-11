"use client"

import { useState, useEffect } from "react"
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

interface ThumbnailsRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
  onTeamSelected?: (team: Team) => void
}

export function ThumbnailsReveal({ isRevealing, onComplete, team: propTeam, onTeamSelected }: ThumbnailsRevealProps) {
  const [phase, setPhase] = useState<"idle" | "cycling" | "selected" | "zooming" | "done">("idle")
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [cycleSpeed, setCycleSpeed] = useState(50)

  useEffect(() => {
    if (isRevealing && phase === "idle") {
      setPhase("cycling")
      
      // Determine target team
      const targetTeam = propTeam || teams[Math.floor(Math.random() * teams.length)]
      const targetIndex = teams.findIndex(t => t.name === targetTeam.name)
      const finalIndex = targetIndex >= 0 ? targetIndex : Math.floor(Math.random() * teams.length)
      
      // Fast cycling through teams
      let currentIndex = 0
      let speed = 50
      let cycles = 0
      const maxCycles = 40 + Math.floor(Math.random() * 20) // 40-60 cycles
      
      const cycleInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % teams.length
        setHighlightedIndex(currentIndex)
        cycles++
        
        // Gradually slow down after halfway
        if (cycles > maxCycles / 2) {
          speed = Math.min(speed + 15, 400)
          setCycleSpeed(speed)
        }
        
        // Stop on the target team
        if (cycles >= maxCycles && currentIndex === finalIndex) {
          clearInterval(cycleInterval)
          setSelectedIndex(finalIndex)
          setPhase("selected")
          
          const selectedTeam = teams[finalIndex]
          if (onTeamSelected) {
            onTeamSelected({
              name: selectedTeam.name,
              city: selectedTeam.city,
              color: selectedTeam.color,
              logo: selectedTeam.logo,
            })
          }
          
          // Zoom in on selected team after a pause
          setTimeout(() => {
            setPhase("zooming")
            
            // Complete after zoom animation
            setTimeout(() => {
              setPhase("done")
              onComplete()
            }, 2500)
          }, 800)
        }
      }, speed)
      
      // Update interval speed dynamically
      const speedUpdateInterval = setInterval(() => {
        if (phase === "cycling") {
          // Speed already updated in main interval
        }
      }, 100)
      
      return () => {
        clearInterval(cycleInterval)
        clearInterval(speedUpdateInterval)
      }
    }
  }, [isRevealing, phase, propTeam, onTeamSelected, onComplete])

  // Reset when not revealing
  useEffect(() => {
    if (!isRevealing) {
      setPhase("idle")
      setHighlightedIndex(null)
      setSelectedIndex(null)
      setCycleSpeed(50)
    }
  }, [isRevealing])

  const selectedTeam = selectedIndex !== null ? teams[selectedIndex] : null

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "zooming" && selectedTeam ? (
          // Zoomed in view of selected team
          <motion.div
            key="zoomed"
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Glow background */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at center, ${selectedTeam.color}40 0%, transparent 70%)`,
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            
            {/* Large logo */}
            <motion.div
              className="relative w-48 h-48 mb-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: selectedTeam.color, opacity: 0.5 }}
              />
              <Image
                src={selectedTeam.logo}
                alt={selectedTeam.name}
                fill
                className="object-contain relative z-10 drop-shadow-2xl"
                unoptimized
              />
            </motion.div>
            
            {/* Team name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className="text-white/60 text-lg">{selectedTeam.city}</p>
              <h2 
                className="text-4xl font-bold"
                style={{ color: selectedTeam.color }}
              >
                {selectedTeam.name}
              </h2>
            </motion.div>
            
            {/* Celebration particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? selectedTeam.color : "#fff",
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  y: [0, -30, -60],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.3 + i * 0.05,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            ))}
          </motion.div>
        ) : (
          // Grid of team thumbnails
          <motion.div
            key="grid"
            className="grid grid-cols-4 gap-2 p-4"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            {teams.map((team, index) => {
              const isHighlighted = highlightedIndex === index
              const isSelected = selectedIndex === index
              
              return (
                <motion.div
                  key={team.name}
                  className="relative w-16 h-16 rounded-lg overflow-hidden"
                  style={{
                    background: isSelected 
                      ? team.color 
                      : isHighlighted 
                        ? `${team.color}80` 
                        : "rgba(255,255,255,0.1)",
                  }}
                  animate={{
                    scale: isHighlighted || isSelected ? 1.15 : 1,
                    borderWidth: isHighlighted || isSelected ? 2 : 0,
                    borderColor: isHighlighted || isSelected ? "#fff" : "transparent",
                  }}
                  transition={{ duration: 0.1 }}
                >
                  {/* Glow effect for highlighted/selected */}
                  {(isHighlighted || isSelected) && (
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        boxShadow: `0 0 20px ${team.color}, 0 0 40px ${team.color}80`,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                  
                  <div className="relative w-full h-full p-2">
                    <Image
                      src={team.logo}
                      alt={team.name}
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 border-4 border-white rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
