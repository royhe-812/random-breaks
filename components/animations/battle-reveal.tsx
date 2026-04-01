"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const STARS_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBayLiveApp_Stars_DW_CC_v007_CC%202-OGJYd3jy5o3bamd4lN3498JekCYscy.png"
const FIRE_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBay_Live_Emoji_a_v008_Fire.0072%202-IVWHtqVd8MJLUNA3EfYsVshGT1EjUg.png"

const teams = [
  { name: "Chiefs", color: "#E31837", secondary: "#FFB612" },
  { name: "Eagles", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", color: "#003594", secondary: "#869397" },
  { name: "49ers", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", color: "#008E97", secondary: "#FC4C02" },
  { name: "Ravens", color: "#241773", secondary: "#9E7C0C" },
  { name: "Lions", color: "#0076B6", secondary: "#B0B7BC" },
]

interface BattleRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

export function BattleReveal({ isRevealing, onComplete }: BattleRevealProps) {
  const [phase, setPhase] = useState<"idle" | "enter" | "clash" | "battle" | "deciding" | "winner">("idle")
  
  // Pick two random different teams
  const [team1, team2] = useMemo(() => {
    const shuffled = [...teams].sort(() => Math.random() - 0.5)
    return [shuffled[0], shuffled[1]]
  }, [])
  
  // Winner is always team1 for this demo
  const winner = team1

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      
      // Phase 1: Cards enter from sides
      const enterTimer = setTimeout(() => setPhase("enter"), 100)
      
      // Phase 2: Cards clash in middle
      const clashTimer = setTimeout(() => setPhase("clash"), 800)
      
      // Phase 3: Battle with energy effects
      const battleTimer = setTimeout(() => setPhase("battle"), 1200)
      
      // Phase 4: Deciding moment - rapid switching highlight
      const decidingTimer = setTimeout(() => setPhase("deciding"), 2200)
      
      // Phase 5: Winner revealed
      const winnerTimer = setTimeout(() => {
        setPhase("winner")
        onComplete()
      }, 3200)

      return () => {
        clearTimeout(enterTimer)
        clearTimeout(clashTimer)
        clearTimeout(battleTimer)
        clearTimeout(decidingTimer)
        clearTimeout(winnerTimer)
      }
    }
  }, [isRevealing, onComplete])

  if (!isRevealing && phase === "idle") return null

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* VS Badge */}
      <AnimatePresence>
        {(phase === "clash" || phase === "battle" || phase === "deciding") && (
          <motion.div
            className="absolute z-30"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: 1,
              rotate: 0,
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300,
              damping: 15,
            }}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-60" />
              
              {/* VS circle */}
              <div 
                className="relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(145deg, #FFD700 0%, #FFA500 100%)",
                  boxShadow: "0 0 30px rgba(255,215,0,0.6), inset 0 2px 4px rgba(255,255,255,0.4)",
                }}
              >
                <span className="text-xl font-black text-black">VS</span>
              </div>
              
              {/* Energy sparks */}
              {phase === "battle" && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-4 bg-yellow-300 rounded-full"
                      style={{
                        left: "50%",
                        top: "50%",
                        transformOrigin: "center",
                      }}
                      animate={{
                        rotate: [i * 45, i * 45 + 360],
                        x: [0, Math.cos(i * 45 * Math.PI / 180) * 40],
                        y: [0, Math.sin(i * 45 * Math.PI / 180) * 40],
                        opacity: [1, 0],
                        scale: [1, 0.5],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Container */}
      <div className="relative flex items-center gap-4">
        {/* Team 1 Card - Left */}
        <motion.div
          className="relative"
          initial={{ x: -200, opacity: 0, rotateY: -30 }}
          animate={{
            x: phase === "idle" ? -200 : 
               phase === "enter" ? -60 :
               phase === "winner" ? 0 : -40,
            opacity: phase === "idle" ? 0 : 1,
            rotateY: phase === "enter" ? -15 : 0,
            scale: phase === "winner" ? 1.1 : 
                   phase === "deciding" ? [1, 1.05, 1] : 1,
            filter: phase === "winner" ? "brightness(1.2)" : "brightness(1)",
          }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 20,
            scale: phase === "deciding" ? { duration: 0.2, repeat: 5 } : undefined,
          }}
        >
          <TeamCard 
            team={team1} 
            isWinner={phase === "winner"} 
            isHighlighted={phase === "deciding" || phase === "winner"}
            side="left"
          />
        </motion.div>

        {/* Team 2 Card - Right */}
        <motion.div
          className="relative"
          initial={{ x: 200, opacity: 0, rotateY: 30 }}
          animate={{
            x: phase === "idle" ? 200 : 
               phase === "enter" ? 60 :
               phase === "winner" ? 100 : 40,
            opacity: phase === "idle" ? 0 : phase === "winner" ? 0.4 : 1,
            rotateY: phase === "enter" ? 15 : 0,
            scale: phase === "winner" ? 0.8 : 
                   phase === "deciding" ? [1, 1.05, 1] : 1,
            filter: phase === "winner" ? "grayscale(0.8) brightness(0.6)" : "brightness(1)",
          }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 20,
            scale: phase === "deciding" ? { duration: 0.2, repeat: 5, delay: 0.1 } : undefined,
          }}
        >
          <TeamCard 
            team={team2} 
            isWinner={false} 
            isHighlighted={phase === "deciding"}
            side="right"
          />
        </motion.div>
      </div>

      {/* Energy clash effect in battle */}
      <AnimatePresence>
        {phase === "battle" && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Lightning bolts */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 w-0.5 bg-gradient-to-b from-yellow-300 via-white to-yellow-300"
                style={{
                  height: 60 + Math.random() * 40,
                  transformOrigin: "top center",
                }}
                initial={{ opacity: 0, rotate: -30 + i * 12, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  rotate: [-30 + i * 12, -25 + i * 12],
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner celebration */}
      <AnimatePresence>
        {phase === "winner" && (
          <>
            {/* Floating stars */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute z-40"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${20 + (i % 2) * 40}%`,
                }}
                initial={{ scale: 0, rotate: -30, opacity: 0 }}
                animate={{ 
                  scale: 1,
                  rotate: 0,
                  opacity: 1,
                  y: [0, -10, 0],
                }}
                transition={{ 
                  delay: i * 0.1,
                  y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <div className="relative w-10 h-10">
                  <Image src={STARS_URL} alt="" fill className="object-contain" />
                </div>
              </motion.div>
            ))}

            {/* Winner text */}
            <motion.div
              className="absolute -bottom-20 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="relative w-8 h-8">
                  <Image src={FIRE_URL} alt="" fill className="object-contain" />
                </div>
                <span 
                  className="text-3xl font-black"
                  style={{ color: winner.color }}
                >
                  {winner.name.toUpperCase()}
                </span>
                <div className="relative w-8 h-8">
                  <Image src={FIRE_URL} alt="" fill className="object-contain" />
                </div>
              </div>
              <span className="text-violet-300 text-sm font-semibold tracking-widest">
                VICTORY
              </span>
            </motion.div>

            {/* Confetti burst */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`confetti-${i}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? winner.color : winner.secondary,
                  left: "50%",
                  top: "50%",
                }}
                initial={{ scale: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1,
                  delay: 0.2 + i * 0.02,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Team Card Component
function TeamCard({ 
  team, 
  isWinner, 
  isHighlighted,
  side,
}: { 
  team: typeof teams[0]
  isWinner: boolean
  isHighlighted: boolean
  side: "left" | "right"
}) {
  return (
    <div 
      className="relative w-32 h-48 rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(165deg, ${team.color} 0%, ${team.color}dd 50%, ${team.color}99 100%)`,
        boxShadow: isWinner 
          ? `0 0 40px ${team.color}80, 0 20px 40px rgba(0,0,0,0.4)`
          : `0 10px 30px rgba(0,0,0,0.3)`,
        border: isHighlighted ? `3px solid ${team.secondary}` : "none",
      }}
    >
      {/* Shine effect */}
      {(isHighlighted || isWinner) && (
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
          transition={{ duration: 0.8, repeat: isWinner ? Infinity : 0, repeatDelay: 1, ease: "easeInOut" }}
        />
      )}
      
      {/* Card inner border */}
      <div 
        className="absolute inset-2 rounded-lg border-2 pointer-events-none"
        style={{ borderColor: team.secondary + "40" }}
      />
      
      {/* Team logo area */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Background accent */}
        <div 
          className="absolute w-20 h-20 rounded-full opacity-30"
          style={{ background: team.secondary }}
        />
        
        {/* Team abbreviation */}
        <span 
          className="text-5xl font-black text-white drop-shadow-lg relative z-10"
          style={{ textShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
        >
          {team.name.slice(0, 2).toUpperCase()}
        </span>
        
        {/* Divider */}
        <div 
          className="w-16 h-0.5 my-3 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${team.secondary}, transparent)` }}
        />
        
        {/* Team name */}
        <span 
          className="text-sm font-bold text-white uppercase tracking-wider"
          style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
        >
          {team.name}
        </span>
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-2 h-2 border-l-2 border-t-2 rounded-tl-sm" style={{ borderColor: team.secondary + "60" }} />
      <div className="absolute top-2 right-2 w-2 h-2 border-r-2 border-t-2 rounded-tr-sm" style={{ borderColor: team.secondary + "60" }} />
      <div className="absolute bottom-2 left-2 w-2 h-2 border-l-2 border-b-2 rounded-bl-sm" style={{ borderColor: team.secondary + "60" }} />
      <div className="absolute bottom-2 right-2 w-2 h-2 border-r-2 border-b-2 rounded-br-sm" style={{ borderColor: team.secondary + "60" }} />
      
      {/* Winner crown indicator */}
      {isWinner && (
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl"
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          👑
        </motion.div>
      )}
    </div>
  )
}
