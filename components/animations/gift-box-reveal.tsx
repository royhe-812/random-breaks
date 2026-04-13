"use client"

// Gift box reveal animation - v7 - fixed imports
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CelebrationElements } from "./celebration-elements"
import Image from "next/image"

const STARS_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBayLiveApp_Stars_DW_CC_v007_CC%202-OGJYd3jy5o3bamd4lN3498JekCYscy.png"

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
  abbrev?: string
  color: string
  secondary: string
}

interface GiftBoxRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function GiftBoxReveal({ isRevealing, onComplete, team: propTeam }: GiftBoxRevealProps) {
  const [phase, setPhase] = useState<"idle" | "shaking" | "opening" | "revealed">("idle")
  const [randomTeam, setRandomTeam] = useState(() => teams[Math.floor(Math.random() * teams.length)])
  const team = propTeam || randomTeam

  useEffect(() => {
    if (isRevealing) {
      // Pick a new random team each reveal
      setRandomTeam(teams[Math.floor(Math.random() * teams.length)])
      setPhase("idle")
      
      const shakeTimer = setTimeout(() => setPhase("shaking"), 200)
      const openTimer = setTimeout(() => setPhase("opening"), 1200)
      const revealTimer = setTimeout(() => setPhase("revealed"), 1800)
      const completeTimer = setTimeout(() => onComplete(), 4000)
      
      return () => {
        clearTimeout(shakeTimer)
        clearTimeout(openTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-72 h-96 flex items-center justify-center">
      {/* Anticipation glow */}
      <AnimatePresence>
        {phase === "shaking" && (
          <motion.div
            className="absolute w-64 h-64 rounded-full -z-10"
            style={{
              background: `radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)`,
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.7 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Gift Box */}
      <AnimatePresence>
        {phase !== "revealed" && (
          <motion.div
            className="relative"
            animate={
              phase === "shaking"
                ? { 
                    rotate: [-3, 3, -3, 3, 0],
                    y: [0, -8, 0, -5, 0],
                  }
                : {}
            }
            transition={
              phase === "shaking"
                ? { duration: 0.25, repeat: Infinity }
                : { duration: 0.3 }
            }
            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.3 } }}
          >
            {/* Glow from inside box when opening */}
            <AnimatePresence>
              {phase === "opening" && (
                <motion.div
                  className="absolute -inset-8 rounded-3xl -z-10"
                  style={{
                    background: `radial-gradient(circle, rgba(251,191,36,0.8) 0%, rgba(139,92,246,0.6) 40%, transparent 70%)`,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1.2, 1], scale: [0.5, 1, 1.3, 1.5] }}
                  exit={{ opacity: 0, scale: 2 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </AnimatePresence>

            {/* Box Base */}
            <motion.div
              className="relative w-40 h-32 rounded-lg"
              style={{
                background: `linear-gradient(145deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)`,
                boxShadow: phase === "shaking" 
                  ? "0 0 40px rgba(139,92,246,0.6), 0 20px 40px rgba(0,0,0,0.4)"
                  : phase === "opening"
                  ? "0 0 60px rgba(251,191,36,0.8), 0 0 100px rgba(139,92,246,0.6)"
                  : "0 20px 40px rgba(0,0,0,0.4), inset 0 -10px 20px rgba(0,0,0,0.2)",
              }}
              animate={phase === "opening" ? { y: 20 } : {}}
              transition={{ duration: 0.4 }}
            >
              {/* Inner glow when opening */}
              <AnimatePresence>
                {phase === "opening" && (
                  <motion.div
                    className="absolute inset-0 rounded-lg overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: `linear-gradient(to top, rgba(251,191,36,0.6), rgba(255,255,255,0.4))`,
                    }}
                  />
                )}
              </AnimatePresence>
              
              {/* Box shine */}
              <div 
                className="absolute inset-0 rounded-lg overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
              
              {/* Vertical ribbon on box */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 w-8 h-full"
                style={{
                  background: `linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)`,
                }}
              />
              
              {/* Question mark */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={
                  phase === "shaking" 
                    ? { opacity: [1, 0.5, 1], scale: [1, 1.1, 1] } 
                    : phase === "opening"
                    ? { opacity: 0, scale: 1.5 }
                    : {}
                }
                transition={{ duration: 0.2, repeat: phase === "shaking" ? Infinity : 0, ease: "easeInOut" }}
              >
                <span className="text-5xl font-black text-white/30 drop-shadow-lg">?</span>
              </motion.div>
            </motion.div>

            {/* Box Lid - flies off to the side */}
            <motion.div
              className="absolute -top-12 left-0 w-40"
              animate={
                phase === "opening"
                  ? { y: -80, x: 60, rotate: 25, opacity: 0 }
                  : {}
              }
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Lid top */}
              <div 
                className="relative w-full h-12 rounded-t-lg"
                style={{
                  background: `linear-gradient(145deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)`,
                  boxShadow: "0 -4px 20px rgba(0,0,0,0.2)",
                }}
              >
                {/* Lid shine */}
                <div 
                  className="absolute inset-0 rounded-t-lg"
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                  }}
                />
                
                {/* Horizontal ribbon on lid */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-full h-8"
                  style={{
                    background: `linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)`,
                  }}
                />
                
                {/* Bow */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <div className="relative">
                    <div 
                      className="absolute -left-6 top-1 w-8 h-5 rounded-full transform -rotate-30"
                      style={{
                        background: `linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)`,
                        boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.3)",
                      }}
                    />
                    <div 
                      className="absolute -right-6 top-1 w-8 h-5 rounded-full transform rotate-30"
                      style={{
                        background: `linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)`,
                        boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.3)",
                      }}
                    />
                    <div 
                      className="relative w-5 h-5 rounded-full z-10"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, #fcd34d 0%, #f59e0b 100%)`,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    />
                    <div 
                      className="absolute top-4 -left-2 w-4 h-8 rounded-b-full transform -rotate-15"
                      style={{
                        background: `linear-gradient(180deg, #f59e0b 0%, #d97706 100%)`,
                      }}
                    />
                    <div 
                      className="absolute top-4 -right-2 w-4 h-8 rounded-b-full transform rotate-15"
                      style={{
                        background: `linear-gradient(180deg, #f59e0b 0%, #d97706 100%)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opening burst particles */}
      <AnimatePresence>
        {phase === "opening" && (
          <>
            {/* Confetti burst */}
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: 8 + Math.random() * 12,
                  height: 8 + Math.random() * 12,
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                  background: i % 4 === 0 
                    ? "#a78bfa" 
                    : i % 4 === 1 
                    ? "#fbbf24" 
                    : i % 4 === 2 
                    ? team.color 
                    : "#fff",
                  boxShadow: `0 0 6px ${i % 2 === 0 ? "#a78bfa" : "#fbbf24"}`,
                }}
                initial={{ y: -20, x: 0, opacity: 1, scale: 0 }}
                animate={{
                  y: -150 - Math.random() * 100,
                  x: (Math.random() - 0.5) * 200,
                  opacity: [1, 1, 0],
                  scale: [0, 1, 0.5],
                  rotate: Math.random() * 360,
                }}
                transition={{ 
                  duration: 1, 
                  ease: "easeOut",
                  delay: Math.random() * 0.2,
                }}
              />
            ))}
            
            {/* Stars burst */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute w-10 h-10"
                initial={{ y: -20, x: 0, opacity: 0, scale: 0 }}
                animate={{
                  y: -120 - Math.random() * 80,
                  x: (Math.random() - 0.5) * 160,
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0.8],
                  rotate: Math.random() * 30 - 15,
                }}
                transition={{ 
                  duration: 1.2, 
                  ease: "easeOut",
                  delay: 0.1 + Math.random() * 0.2,
                }}
              >
                <Image src={STARS_URL} alt="" fill className="object-contain" />
              </motion.div>
            ))}

            {/* Light rays */}
            <motion.div
              className="absolute w-80 h-80 -z-10"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
              transition={{ duration: 0.8 }}
            >
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-1 h-40 origin-bottom"
                  style={{
                    transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                    background: `linear-gradient(to top, rgba(167,139,250,0.8), transparent)`,
                  }}
                />
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Revealed team */}
      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div
            className="flex flex-col items-center relative"
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Celebration elements */}
            <CelebrationElements show={true} teamColor={team.color} />
            
            {/* Pulsing glow */}
            <motion.div
              className="absolute w-56 h-56 rounded-full -z-10"
              style={{
                background: `radial-gradient(circle, 
                  ${team.color}40 0%, 
                  rgba(167,139,250,0.2) 50%, 
                  transparent 70%
                )`,
              }}
              animate={{ scale: 1.1, opacity: 0.9 }}
              transition={{ duration: 1 }}
            />
            
            {/* Sports Card - Vertical */}
            <motion.div
              className="relative w-44 h-64 rounded-xl flex flex-col items-center justify-between overflow-hidden p-4"
              style={{
                background: `linear-gradient(165deg, ${team.color} 0%, ${team.color}dd 40%, ${team.color}99 100%)`,
                boxShadow: `
                  0 25px 60px ${team.color}50, 
                  0 0 80px rgba(167,139,250,0.3),
                  inset 0 2px 4px rgba(255,255,255,0.2),
                  inset 0 -10px 30px rgba(0,0,0,0.3)
                `,
              }}
              initial={{ rotateY: 180, scale: 0.8 }}
              animate={{ rotateY: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Holographic shine sweep */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(105deg, 
                    transparent 0%,
                    rgba(255,255,255,0.4) 45%, 
                    rgba(255,255,255,0.6) 50%,
                    rgba(255,255,255,0.4) 55%, 
                    transparent 100%
                  )`,
                }}
                initial={{ x: -200 }}
                animate={{ x: 200 }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
              />
              
              {/* Card inner border */}
              <div 
                className="absolute inset-2 rounded-lg border-2 pointer-events-none"
                style={{ borderColor: team.secondary + "40" }}
              />
              
              {/* Top section - Team Logo Area */}
              <div className="relative w-full flex-1 flex items-center justify-center">
                {/* Secondary color accent circle */}
                <div 
                  className="absolute w-24 h-24 rounded-full opacity-30"
                  style={{ background: team.secondary }}
                />
                {/* Team abbreviation */}
                <motion.span
                  className="text-6xl font-black text-white drop-shadow-lg relative z-10"
                  style={{ textShadow: `0 4px 12px rgba(0,0,0,0.4)` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                >
                  {(team as typeof teams[0]).abbrev || team.name.slice(0, 2).toUpperCase()}
                </motion.span>
              </div>
              
              {/* Bottom section - Team Name */}
              <div className="w-full text-center pb-2">
                {/* Divider line */}
                <div 
                  className="w-3/4 h-0.5 mx-auto mb-3 rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${team.secondary}, transparent)` }}
                />
                {/* Team name on card */}
                <motion.div
                  className="text-center"
                  style={{ textShadow: `0 2px 8px rgba(0,0,0,0.5)` }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                    {(team as typeof teams[0]).city || ""}
                  </p>
                  <p className="text-2xl font-black text-white tracking-wide">
                    {team.name.toUpperCase()}
                  </p>
                  <p className="text-xs mt-1 font-medium tracking-widest" style={{ color: team.secondary }}>
                    NFL 2024
                  </p>
                </motion.div>
              </div>
              
              {/* Card corner accents */}
              <div className="absolute top-3 left-3 w-3 h-3 border-l-2 border-t-2 rounded-tl-sm" style={{ borderColor: team.secondary + "60" }} />
              <div className="absolute top-3 right-3 w-3 h-3 border-r-2 border-t-2 rounded-tr-sm" style={{ borderColor: team.secondary + "60" }} />
              <div className="absolute bottom-3 left-3 w-3 h-3 border-l-2 border-b-2 rounded-bl-sm" style={{ borderColor: team.secondary + "60" }} />
              <div className="absolute bottom-3 right-3 w-3 h-3 border-r-2 border-b-2 rounded-br-sm" style={{ borderColor: team.secondary + "60" }} />
            </motion.div>
            

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
