"use client"

// Gift box reveal animation - using Lottie animation
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

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
  const [phase, setPhase] = useState<"idle" | "animating" | "cardReveal" | "revealed">("idle")
  const [randomTeam, setRandomTeam] = useState(() => teams[Math.floor(Math.random() * teams.length)])
  const [animationData, setAnimationData] = useState<object | null>(null)
  const lottieRef = useRef<{ goToAndPlay: (frame: number) => void } | null>(null)
  const team = propTeam || randomTeam

  // Load Lottie animation data
  useEffect(() => {
    fetch("/animations/giftbox-open.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load animation:", err))
  }, [])

  useEffect(() => {
    if (isRevealing) {
      // Pick a new random team each reveal
      setRandomTeam(teams[Math.floor(Math.random() * teams.length)])
      setPhase("animating")
      
      // Start Lottie animation
      if (lottieRef.current) {
        lottieRef.current.goToAndPlay(0)
      }
      
      // Show card emerging after box opens (around frame 45-50 of animation)
      const cardTimer = setTimeout(() => setPhase("cardReveal"), 1200)
      const revealTimer = setTimeout(() => setPhase("revealed"), 2000)
      const completeTimer = setTimeout(() => onComplete(), 4500)
      
      return () => {
        clearTimeout(cardTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative w-80 h-[450px] flex items-center justify-center overflow-visible">
      {/* Lottie Gift Box Animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        {animationData && (
          <Lottie
            lottieRef={lottieRef}
            animationData={animationData}
            loop={false}
            autoplay={false}
            style={{ 
              width: 350, 
              height: 350,
              opacity: phase === "revealed" ? 0 : 1,
              transition: "opacity 0.5s ease-out",
            }}
          />
        )}
      </div>

      {/* Team Card emerging from box */}
      <AnimatePresence>
        {(phase === "cardReveal" || phase === "revealed") && (
          <motion.div
            className="absolute flex flex-col items-center"
            initial={{ y: 80, scale: 0.6, opacity: 0 }}
            animate={
              phase === "revealed"
                ? { y: -20, scale: 1, opacity: 1 }
                : { y: 40, scale: 0.85, opacity: 1 }
            }
            transition={{ 
              type: "spring", 
              stiffness: 180, 
              damping: 18,
              duration: 0.6,
            }}
          >
            {/* Pulsing glow behind card */}
            <motion.div
              className="absolute w-56 h-72 rounded-2xl -z-10"
              style={{
                background: `radial-gradient(circle, ${team.color}50 0%, transparent 70%)`,
              }}
              animate={{ 
                scale: [1, 1.1, 1], 
                opacity: [0.6, 0.8, 0.6] 
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Sports Card - Vertical */}
            <motion.div
              className="relative w-44 h-64 rounded-xl flex flex-col items-center justify-between overflow-hidden p-4"
              style={{
                background: `linear-gradient(165deg, ${team.color} 0%, ${team.color}dd 40%, ${team.color}99 100%)`,
                boxShadow: `
                  0 25px 60px ${team.color}50, 
                  0 0 80px rgba(34,197,94,0.2),
                  inset 0 2px 4px rgba(255,255,255,0.2),
                  inset 0 -10px 30px rgba(0,0,0,0.3)
                `,
              }}
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
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
