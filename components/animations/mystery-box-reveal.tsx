"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HolographicShine } from "./celebration-elements"
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

interface MysteryBoxRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function MysteryBoxReveal({ isRevealing, onComplete, team: propTeam }: MysteryBoxRevealProps) {
  const [phase, setPhase] = useState<"idle" | "shaking" | "glowing" | "burst" | "revealed">("idle")
  const [randomTeam, setRandomTeam] = useState(() => teams[Math.floor(Math.random() * teams.length)])
  const team = propTeam || randomTeam

  useEffect(() => {
    if (isRevealing) {
      // Pick a new random team each reveal
      setRandomTeam(teams[Math.floor(Math.random() * teams.length)])
      setPhase("idle")
      
      const shakeTimer = setTimeout(() => setPhase("shaking"), 200)
      const glowTimer = setTimeout(() => setPhase("glowing"), 800)
      const burstTimer = setTimeout(() => setPhase("burst"), 1400)
      const revealTimer = setTimeout(() => setPhase("revealed"), 1600)
      const completeTimer = setTimeout(() => onComplete(), 3500)
      
      return () => {
        clearTimeout(shakeTimer)
        clearTimeout(glowTimer)
        clearTimeout(burstTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-60 h-80 flex items-center justify-center">
      {/* Holographic glow backdrop */}
      <AnimatePresence>
        {(phase === "glowing" || phase === "burst") && (
          <motion.div
            className="absolute w-48 h-48 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(167,139,250,0.5) 0%, rgba(139,92,246,0.3) 40%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2.5, opacity: 1 }}
            exit={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* Mystery Box */}
      <AnimatePresence>
        {phase !== "revealed" && (
          <motion.div
            className="relative w-44 h-52"
            animate={
              phase === "shaking" 
                ? { 
                    x: [0, -6, 6, -6, 6, -4, 4, 0],
                    rotate: [0, -3, 3, -3, 3, -1, 1, 0]
                  }
                : phase === "burst"
                ? { scale: 1.3, opacity: 0 }
                : {}
            }
            transition={
              phase === "shaking"
                ? { duration: 0.4, repeat: Infinity }
                : { duration: 0.2 }
            }
            exit={{ scale: 1.5, opacity: 0 }}
          >
            {/* Box body with premium holographic finish */}
            <div 
              className="absolute inset-0 rounded-2xl border-2 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 50%, #0f0f1a 100%)",
                borderColor: phase === "glowing" ? "#a78bfa" : "#4a4a6a",
                boxShadow: phase === "glowing" 
                  ? "0 0 40px rgba(167,139,250,0.5), inset 0 0 30px rgba(167,139,250,0.1)"
                  : "0 10px 40px rgba(0,0,0,0.5)",
              }}
            >
              {/* Holographic pattern overlay */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  background: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(167,139,250,0.1) 10px,
                    rgba(167,139,250,0.1) 12px
                  )`
                }}
              />
              
              {/* Box face pattern */}
              <div className="absolute inset-5 border-2 border-violet-500/30 rounded-xl flex items-center justify-center">
                <motion.div
                  className="text-7xl font-black text-violet-400/60"
animate={phase === "glowing" ? {
                scale: 1.1,
                opacity: 0.9,
                textShadow: "0 0 40px rgba(167,139,250,0.8)",
              } : {}}
                  transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  ?
                </motion.div>
              </div>
              
              {/* Glow seams */}
              <AnimatePresence>
                {phase === "glowing" && (
                  <>
                    <motion.div
                      className="absolute inset-x-0 top-0 h-1 rounded-full"
                      style={{ background: "linear-gradient(90deg, transparent, #a78bfa, transparent)" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute inset-x-0 bottom-0 h-1 rounded-full"
                      style={{ background: "linear-gradient(90deg, transparent, #c4b5fd, transparent)" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.2, repeat: Infinity, delay: 0.1, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute inset-y-0 left-0 w-1 rounded-full"
                      style={{ background: "linear-gradient(180deg, transparent, #a78bfa, transparent)" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.2, repeat: Infinity, delay: 0.15, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute inset-y-0 right-0 w-1 rounded-full"
                      style={{ background: "linear-gradient(180deg, transparent, #c4b5fd, transparent)" }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.2, repeat: Infinity, delay: 0.2, ease: "easeInOut" }}
                    />
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Box lid with holographic bow */}
            <motion.div
              className="absolute -top-5 inset-x-0 h-10 rounded-t-2xl border-2 border-b-0 overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #3a3a5e 0%, #2a2a4e 100%)",
                borderColor: phase === "glowing" ? "#a78bfa" : "#4a4a6a",
              }}
              animate={
                phase === "glowing"
                  ? { y: [0, -6, 0] }
                  : phase === "burst"
                  ? { y: -80, rotateX: -45, opacity: 0 }
                  : {}
              }
              transition={
                phase === "glowing"
                  ? { duration: 0.25, repeat: Infinity }
                  : { duration: 0.3 }
              }
            >
              {/* Holographic ribbon/bow */}
              <div 
                className="absolute inset-x-1/4 top-1/2 h-3 -translate-y-1/2 rounded-full"
                style={{
                  background: "linear-gradient(90deg, #a78bfa, #c4b5fd, #e9d5ff, #c4b5fd, #a78bfa)",
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Burst particles - holographic style */}
      <AnimatePresence>
        {phase === "burst" && (
          <>
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: 5 + Math.random() * 10,
                  height: 5 + Math.random() * 10,
                  background: i % 3 === 0 
                    ? `linear-gradient(135deg, #a78bfa, #c4b5fd)` 
                    : i % 3 === 1 
                    ? team.color 
                    : team.secondary,
                  borderRadius: i % 4 === 0 ? "50%" : "3px",
                  boxShadow: `0 0 8px ${i % 2 === 0 ? "#a78bfa" : team.color}`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  opacity: 0,
                  scale: 0,
                  rotate: Math.random() * 540,
                }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            ))}
            {/* Stars burst out */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute w-10 h-10"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
              >
                <Image src={STARS_URL} alt="" fill className="object-contain" />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Revealed team logo */}
      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div
            className="flex flex-col items-center relative z-10"
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Team logo container with circular glow */}
            <motion.div
              className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: team.color,
              }}
              animate={{ 
                y: [0, -6, 0],
                boxShadow: [
                  `0 0 40px ${team.color}60, 0 0 80px ${team.color}40`,
                  `0 0 60px ${team.color}80, 0 0 100px ${team.color}50`,
                  `0 0 40px ${team.color}60, 0 0 80px ${team.color}40`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <HolographicShine />
              <span className="text-4xl font-black text-white relative z-10 drop-shadow-lg">
                {(team as typeof teams[0]).abbrev || team.name.slice(0, 2).toUpperCase()}
              </span>
              
              {/* Floating stars next to the circle */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute w-12 h-12"
                  style={{
                    left: i === 0 ? -38 : i === 1 ? 'auto' : -28,
                    right: i === 1 ? -38 : i === 2 ? -32 : 'auto',
                    top: i === 0 ? 5 : i === 1 ? 15 : 'auto',
                    bottom: i === 2 ? 0 : 'auto',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    y: [0, -5, 0],
                  }}
                  transition={{ 
                    delay: 0.2 + i * 0.1,
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
                  }}
                >
                  <Image src={STARS_URL} alt="" fill className="object-contain" />
                </motion.div>
              ))}
            </motion.div>
            
            {/* Team info */}
            <motion.div
              className="mt-6 text-center relative z-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                {(team as typeof teams[0]).city || ""}
              </p>
              <p className="text-2xl font-black text-white drop-shadow-lg">
                {team.name}
              </p>
            </motion.div>
            
            <motion.p
              className="text-green-400 text-xs mt-3 font-medium relative z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Your spot has been revealed!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
