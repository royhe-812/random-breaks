"use client"

// Pack rip reveal animation - card slides out from behind pack
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const SWOOSH_SOUND_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/universfield-swoosh-07-351043-l81HTAvQZ8cfxNXFm9ZreRxb1nKXNB.mp3"

// Sparkle component for the reveal effect
const Sparkle = ({ delay, x, y, size = 8 }: { delay: number; x: number; y: number; size?: number }) => (
  <motion.div
    className="absolute pointer-events-none z-20"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 1, 0],
      scale: [0, 1, 1, 0],
    }}
    transition={{ 
      duration: 1.5, 
      delay,
      times: [0, 0.2, 0.8, 1],
      ease: "easeOut"
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
        fill="white"
        style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))" }}
      />
    </svg>
  </motion.div>
)

// Rainbow glow effect during reveal
const RevealGlow = ({ isActive, teamColor }: { isActive: boolean; teamColor: string }) => (
  <AnimatePresence>
    {isActive && (
      <motion.div
        className="absolute inset-0 -z-10 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Rainbow gradient glow */}
        <motion.div
          className="absolute -inset-8 rounded-3xl"
          style={{
            background: `conic-gradient(from 0deg, 
              #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b
            )`,
            filter: "blur(30px)",
            opacity: 0.6,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        {/* Team color glow overlay */}
        <motion.div
          className="absolute -inset-6 rounded-3xl"
          style={{
            background: teamColor,
            filter: "blur(40px)",
            opacity: 0.4,
          }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Inner white glow */}
        <motion.div
          className="absolute -inset-4 rounded-2xl"
          style={{
            background: "white",
            filter: "blur(20px)",
            opacity: 0.3,
          }}
        />
      </motion.div>
    )}
  </AnimatePresence>
)

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

interface PackRipRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function PackRipReveal({ isRevealing, onComplete, team: propTeam }: PackRipRevealProps) {
  const [phase, setPhase] = useState<"idle" | "shake" | "opening" | "revealed">("idle")
  const [randomTeam, setRandomTeam] = useState(() => teams[Math.floor(Math.random() * teams.length)])
  const [showGlow, setShowGlow] = useState(false)
  const team = propTeam || randomTeam
  const swooshAudioRef = useRef<HTMLAudioElement | null>(null)
  
  // Generate random sparkle positions
  const sparkles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 140 - 20,
      y: Math.random() * 140 - 20,
      delay: Math.random() * 0.8,
      size: 6 + Math.random() * 10,
    }))
  ).current

  // Initialize audio element
  useEffect(() => {
    swooshAudioRef.current = new Audio(SWOOSH_SOUND_URL)
    swooshAudioRef.current.volume = 0.5
    return () => {
      if (swooshAudioRef.current) {
        swooshAudioRef.current.pause()
        swooshAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isRevealing) {
      // Pick a new random team each reveal
      setRandomTeam(teams[Math.floor(Math.random() * teams.length)])
      setPhase("idle")
      setShowGlow(false)
      
      const shakeTimer = setTimeout(() => setPhase("shake"), 200)
      const openTimer = setTimeout(() => {
        setPhase("opening")
        // Play swoosh sound as the card starts sliding out
        if (swooshAudioRef.current) {
          swooshAudioRef.current.currentTime = 0
          swooshAudioRef.current.play().catch(() => {})
        }
        // Start glow effect when card appears
        setShowGlow(true)
      }, 800)
      const revealTimer = setTimeout(() => setPhase("revealed"), 1600)
      const completeTimer = setTimeout(() => onComplete(), 4500)
      
      return () => {
        clearTimeout(shakeTimer)
        clearTimeout(openTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  const isOpening = phase === "opening" || phase === "revealed"
  const isRevealed = phase === "revealed"

  return (
    <div className="relative w-48 h-80 flex items-end justify-center pb-4">
      {/* Rainbow glow effect */}
      <RevealGlow isActive={showGlow} teamColor={team.color} />
      
      {/* Sparkles during reveal */}
      {showGlow && sparkles.map((sparkle) => (
        <Sparkle
          key={sparkle.id}
          x={sparkle.x}
          y={sparkle.y}
          delay={sparkle.delay}
          size={sparkle.size}
        />
      ))}
      
      {/* Team card - positioned behind the pack, slides up when revealed */}
      <motion.div
        className="absolute left-2 right-2 rounded-lg overflow-hidden"
        style={{
          bottom: "5%",
          height: "70%",
          background: team.color,
          boxShadow: isRevealed 
            ? `0 20px 50px ${team.color}50, 0 0 40px ${team.color}40`
            : "0 4px 16px rgba(0,0,0,0.2)",
          border: `3px solid ${team.secondary}`,
          zIndex: 5,
        }}
        initial={{ y: 0, opacity: 1 }}
        animate={
          isRevealed
            ? { y: -40, opacity: 1, scale: 1.05 }
            : isOpening
              ? { y: -15, opacity: 1, scale: 1 }
              : { y: 0, opacity: 1, scale: 1 }
        }
        transition={{ 
          duration: 0.6, 
          ease: [0.34, 1.56, 0.64, 1]
        }}
      >
        {/* Card holographic shine */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, 
              transparent 0%,
              rgba(255,255,255,0.35) 45%, 
              rgba(255,255,255,0.6) 50%,
              rgba(255,255,255,0.35) 55%, 
              transparent 100%
            )`,
          }}
          initial={{ x: "-150%" }}
          animate={isRevealed ? { x: "150%" } : { x: "-150%" }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeInOut" }}
        />

        {/* Card content */}
        <div className="relative w-full h-full flex flex-col items-center justify-center p-3">
          
          {/* Team logo circle */}
          <motion.div
            className="relative w-16 h-16 rounded-full flex items-center justify-center mb-3"
            style={{ 
              backgroundColor: team.secondary,
              boxShadow: `0 6px 20px ${team.color}50`,
            }}
            initial={{ scale: 0.8 }}
            animate={isRevealed ? { scale: 1 } : { scale: 0.8 }}
            transition={{ 
              delay: 0.2,
              type: "spring", 
              stiffness: 200,
              damping: 15
            }}
          >
            <span className="text-2xl font-black" style={{ color: team.color }}>
              {(team as typeof teams[0]).abbrev || team.name.slice(0, 2).toUpperCase()}
            </span>
          </motion.div>

          {/* Team name */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0.5 }}
            animate={isRevealed ? { opacity: 1 } : { opacity: 0.5 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
              {(team as typeof teams[0]).city || ""}
            </p>
            <p className="text-white font-black text-xl tracking-wide drop-shadow-lg">
              {team.name.toUpperCase()}
            </p>
            <p className="text-[9px] mt-1 font-semibold tracking-widest" style={{ color: team.secondary }}>
              NFL 2024
            </p>
          </motion.div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 rounded-tl-sm" style={{ borderColor: team.secondary + "60" }} />
        <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 rounded-tr-sm" style={{ borderColor: team.secondary + "60" }} />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 rounded-bl-sm" style={{ borderColor: team.secondary + "60" }} />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 rounded-br-sm" style={{ borderColor: team.secondary + "60" }} />
      </motion.div>

      {/* Foil pack front - slides down to reveal card */}
      <motion.div
        className="absolute inset-0 overflow-hidden z-10"
        style={{
          background: "linear-gradient(160deg, #e8e8e8 0%, #c0c0c0 15%, #a8a8a8 30%, #d4d4d4 50%, #b0b0b0 70%, #909090 85%, #a0a0a0 100%)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.2)",
        }}
        initial={{ y: 0 }}
        animate={
          isRevealed
            ? { y: 200, opacity: 0, scale: 0.9 }
            : isOpening
              ? { y: 60, opacity: 1, scale: 1 }
              : phase === "shake"
                ? { x: [0, -3, 3, -3, 3, 0], y: 0 }
                : { y: 0 }
        }
        transition={
          phase === "shake"
            ? { duration: 0.4, ease: "easeInOut" }
            : { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
        }
      >
        {/* Top crimped edge */}
        <div 
          className="absolute top-0 left-0 right-0 h-5"
          style={{
            background: "linear-gradient(180deg, #d0d0d0 0%, #a0a0a0 50%, #808080 100%)",
            borderBottom: "1px solid rgba(0,0,0,0.2)",
          }}
        >
          {/* Crimp lines */}
          <div className="absolute inset-0 flex justify-between px-1">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="w-1 h-full"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(255,255,255,0.2) 100%)",
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Bottom crimped edge */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-5"
          style={{
            background: "linear-gradient(0deg, #d0d0d0 0%, #a0a0a0 50%, #808080 100%)",
            borderTop: "1px solid rgba(0,0,0,0.2)",
          }}
        >
          {/* Crimp lines */}
          <div className="absolute inset-0 flex justify-between px-1">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="w-1 h-full"
                style={{
                  background: "linear-gradient(0deg, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(255,255,255,0.2) 100%)",
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Holographic foil shimmer */}
        <motion.div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `linear-gradient(
              105deg,
              transparent 20%,
              rgba(255,255,255,0.8) 45%,
              rgba(200,220,255,0.6) 50%,
              rgba(255,200,255,0.4) 55%,
              transparent 80%
            )`
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />
        
        {/* Subtle wrinkle/texture lines */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `repeating-linear-gradient(
              95deg,
              transparent,
              transparent 20px,
              rgba(0,0,0,0.15) 20px,
              rgba(0,0,0,0.15) 21px
            ), repeating-linear-gradient(
              175deg,
              transparent,
              transparent 30px,
              rgba(0,0,0,0.1) 30px,
              rgba(0,0,0,0.1) 31px
            )`
          }}
        />
        
        {/* Pack branding */}
        <div className="absolute top-16 inset-x-0 flex flex-col items-center">
          <div className="text-gray-500 font-bold text-xs tracking-[0.3em]">2024</div>
          <div className="text-gray-700 font-black text-2xl tracking-wider mt-1 drop-shadow-sm">PANINI</div>
          <div className="text-gray-600 font-bold text-sm tracking-[0.2em] mt-1">MOSAIC</div>
          <div className="w-16 h-0.5 bg-gray-400/60 mt-3 rounded-full" />
          <div className="text-gray-500 text-[10px] font-semibold mt-2 tracking-widest">NFL</div>
        </div>
        
        {/* Side seam lines */}
        <div className="absolute top-5 bottom-5 left-1 w-px bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        <div className="absolute top-5 bottom-5 right-1 w-px bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        
        {/* Tap to open hint */}
        {phase === "idle" && (
          <div className="absolute bottom-10 inset-x-0 flex justify-center">
            <span className="text-gray-500 text-[10px] font-semibold tracking-wider animate-pulse">
              TAP TO OPEN
            </span>
          </div>
        )}
      </motion.div>

    </div>
  )
}
