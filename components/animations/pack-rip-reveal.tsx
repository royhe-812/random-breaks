"use client"

// Pack rip reveal animation - inspired by foil pack opening
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const STARS_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBayLiveApp_Stars_DW_CC_v007_CC%202-OGJYd3jy5o3bamd4lN3498JekCYscy.png"
const FIRE_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBay_Live_Emoji_a_v008_Fire.0072%202-IVWHtqVd8MJLUNA3EfYsVshGT1EjUg.png"

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
  const [phase, setPhase] = useState<"idle" | "rotate" | "focus" | "rip" | "cardOut" | "revealed">("idle")
  const team = propTeam || teams[0]

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      
      // Phase timeline:
      // 0ms: idle (pack centered)
      // 300ms: rotate (pack tilts and starts scaling down)
      // 800ms: focus (pack scaled down, focus on top)
      // 1200ms: rip (top tears open)
      // 1800ms: cardOut (card slides out from top)
      // 2500ms: revealed (card fully out with celebration)
      
      const rotateTimer = setTimeout(() => setPhase("rotate"), 300)
      const focusTimer = setTimeout(() => setPhase("focus"), 800)
      const ripTimer = setTimeout(() => setPhase("rip"), 1200)
      const cardOutTimer = setTimeout(() => setPhase("cardOut"), 1800)
      const revealTimer = setTimeout(() => setPhase("revealed"), 2500)
      const completeTimer = setTimeout(() => onComplete(), 5500)
      
      return () => {
        clearTimeout(rotateTimer)
        clearTimeout(focusTimer)
        clearTimeout(ripTimer)
        clearTimeout(cardOutTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  const isRipping = phase === "rip" || phase === "cardOut" || phase === "revealed"
  const isCardOut = phase === "cardOut" || phase === "revealed"
  const isRevealed = phase === "revealed"

  // Calculate pack transforms based on phase - zooms IN closer to screen like the GIF
  const getPackTransform = () => {
    switch (phase) {
      case "idle":
        return { scale: 0.8, rotate: 0, y: 0 }
      case "rotate":
        return { scale: 1.1, rotate: -5, y: 10 }
      case "focus":
        return { scale: 1.4, rotate: 0, y: 60 }
      case "rip":
      case "cardOut":
        return { scale: 1.3, rotate: 0, y: 80 }
      case "revealed":
        return { scale: 0.9, rotate: 0, y: 140 }
      default:
        return { scale: 0.8, rotate: 0, y: 0 }
    }
  }

  const packTransform = getPackTransform()

  return (
    <div className="relative w-64 h-96 flex items-center justify-center overflow-visible">
      
      {/* Card that emerges from pack */}
      <motion.div
        className="absolute rounded-xl overflow-hidden z-20"
        style={{
          width: 140,
          height: 200,
          background: `linear-gradient(145deg, ${team.color}, ${team.color}dd)`,
          boxShadow: isRevealed 
            ? `0 20px 60px ${team.color}60, 0 0 80px rgba(167,139,250,0.4)`
            : `0 10px 30px rgba(0,0,0,0.3)`,
          border: `3px solid ${team.secondary}`,
        }}
        initial={{ y: 60, opacity: 0, scale: 0.7 }}
        animate={
          isRevealed
            ? { y: -120, opacity: 1, scale: 1.15 }
            : isCardOut
              ? { y: -20, opacity: 1, scale: 1 }
              : { y: 60, opacity: 0, scale: 0.7 }
        }
        transition={{ 
          duration: 0.6, 
          ease: [0.34, 1.56, 0.64, 1]
        }}
      >
        {/* Card holographic shine */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `linear-gradient(105deg, 
              transparent 0%,
              rgba(255,255,255,0.4) 45%, 
              rgba(255,255,255,0.7) 50%,
              rgba(255,255,255,0.4) 55%, 
              transparent 100%
            )`,
          }}
          initial={{ x: "-150%" }}
          animate={isRevealed ? { x: "150%" } : { x: "-150%" }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
        />

        {/* Card content */}
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
          
          {/* Team logo circle */}
          <motion.div
            className="relative w-16 h-16 rounded-full flex items-center justify-center mb-3"
            style={{ 
              backgroundColor: team.secondary,
              boxShadow: `0 8px 24px ${team.color}50`,
            }}
            initial={{ scale: 0, rotate: -180 }}
            animate={isCardOut ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
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
            initial={{ opacity: 0, y: 15 }}
            animate={isCardOut ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">
              {(team as typeof teams[0]).city || ""}
            </p>
            <p className="text-white font-black text-xl tracking-wide drop-shadow-lg">
              {team.name.toUpperCase()}
            </p>
            <p className="text-[10px] mt-1 font-semibold tracking-widest" style={{ color: team.secondary }}>
              NFL 2024
            </p>
          </motion.div>

          {/* Fire icons */}
          <motion.div
            className="flex items-center gap-2 mt-3"
            initial={{ opacity: 0 }}
            animate={isRevealed ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="relative w-6 h-6">
              <Image src={FIRE_URL} alt="" fill className="object-contain" />
            </div>
            <span className="text-violet-300 text-[10px] font-bold tracking-wider">PULLED</span>
            <div className="relative w-6 h-6">
              <Image src={FIRE_URL} alt="" fill className="object-contain" />
            </div>
          </motion.div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 rounded-tl-sm" style={{ borderColor: team.secondary + "60" }} />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 rounded-tr-sm" style={{ borderColor: team.secondary + "60" }} />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 rounded-bl-sm" style={{ borderColor: team.secondary + "60" }} />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 rounded-br-sm" style={{ borderColor: team.secondary + "60" }} />
      </motion.div>

      {/* Main foil pack */}
      <motion.div
        className="relative z-10"
        style={{
          width: 160,
          height: 220,
        }}
        animate={{
          scale: packTransform.scale,
          rotate: packTransform.rotate,
          y: packTransform.y,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Pack body */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #e8e4e0 0%, #d4d0cc 30%, #c8c4c0 70%, #b8b4b0 100%)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {/* Foil texture/wrinkles */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(ellipse 100% 20% at 50% 20%, rgba(255,255,255,0.6) 0%, transparent 50%),
                radial-gradient(ellipse 80% 30% at 30% 50%, rgba(255,255,255,0.4) 0%, transparent 50%),
                radial-gradient(ellipse 80% 30% at 70% 60%, rgba(255,255,255,0.4) 0%, transparent 50%),
                radial-gradient(ellipse 100% 20% at 50% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)
              `
            }}
          />

          {/* Pack branding */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-zinc-500/80 font-bold text-[10px] tracking-[0.3em]">2024</div>
            <div className="text-zinc-700 font-black text-3xl tracking-wider mt-1">PANINI</div>
            <div className="text-zinc-600/90 font-bold text-lg tracking-[0.2em] mt-1">MOSAIC</div>
            <div className="w-20 h-0.5 bg-zinc-500/40 mt-4 rounded-full" />
            <div className="text-zinc-500/70 text-xs font-semibold mt-3 tracking-widest">NFL</div>
          </div>
        </div>

        {/* Top crimped edge - sealed */}
        <div 
          className="absolute -top-3 left-0 right-0 h-6 z-20"
          style={{
            background: "linear-gradient(180deg, #d8d4d0 0%, #c8c4c0 100%)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          {/* Crimp lines */}
          <div className="absolute inset-0 flex flex-col justify-center">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="h-[2px] w-full"
                style={{ 
                  background: i % 2 === 0 
                    ? "linear-gradient(90deg, transparent 5%, rgba(0,0,0,0.1) 50%, transparent 95%)" 
                    : "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.5) 50%, transparent 95%)"
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom crimped edge */}
        <div 
          className="absolute -bottom-3 left-0 right-0 h-6 z-20"
          style={{
            background: "linear-gradient(180deg, #c8c4c0 0%, #b8b4b0 100%)",
            boxShadow: "0 -2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {/* Crimp lines */}
          <div className="absolute inset-0 flex flex-col justify-center">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="h-[2px] w-full"
                style={{ 
                  background: i % 2 === 0 
                    ? "linear-gradient(90deg, transparent 5%, rgba(0,0,0,0.1) 50%, transparent 95%)" 
                    : "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.5) 50%, transparent 95%)"
                }}
              />
            ))}
          </div>
        </div>

        {/* Tear effect - top portion rips open */}
        <AnimatePresence>
          {isRipping && (
            <>
              {/* Left torn flap */}
              <motion.div
                className="absolute -top-3 left-0 h-10 origin-bottom-left z-30"
                style={{
                  width: "50%",
                  background: "linear-gradient(180deg, #d8d4d0 0%, #c8c4c0 100%)",
                }}
                initial={{ rotateX: 0, rotateZ: 0 }}
                animate={{ rotateX: -120, rotateZ: -15, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {/* Jagged edge */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-3"
                  style={{
                    background: "#c8c4c0",
                    clipPath: "polygon(0 0, 100% 10%, 0 20%, 100% 30%, 0 40%, 100% 50%, 0 60%, 100% 70%, 0 80%, 100% 90%, 0 100%, 0 0)",
                  }}
                />
              </motion.div>

              {/* Right torn flap */}
              <motion.div
                className="absolute -top-3 right-0 h-10 origin-bottom-right z-30"
                style={{
                  width: "50%",
                  background: "linear-gradient(180deg, #d8d4d0 0%, #c8c4c0 100%)",
                }}
                initial={{ rotateX: 0, rotateZ: 0 }}
                animate={{ rotateX: -120, rotateZ: 15, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {/* Jagged edge */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-3"
                  style={{
                    background: "#c8c4c0",
                    clipPath: "polygon(100% 0, 0 10%, 100% 20%, 0 30%, 100% 40%, 0 50%, 100% 60%, 0 70%, 100% 80%, 0 90%, 100% 100%, 100% 0)",
                  }}
                />
              </motion.div>

              {/* Tear particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-sm z-40"
                  style={{
                    width: 2 + Math.random() * 4,
                    height: 3 + Math.random() * 6,
                    backgroundColor: i % 2 === 0 ? "#d8d4d0" : "#c8c4c0",
                    left: "50%",
                    top: 0,
                  }}
                  initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    x: (Math.random() - 0.5) * 80,
                    y: -20 - Math.random() * 40,
                    opacity: 0,
                    rotate: Math.random() * 360,
                  }}
                  transition={{ duration: 0.5, delay: i * 0.02, ease: "easeOut" }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating stars on reveal */}
      <AnimatePresence>
        {isRevealed && (
          <>
            <motion.div
              className="absolute -top-16 -left-4 w-14 h-14 z-30"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
            <motion.div
              className="absolute -top-12 -right-6 w-12 h-12 z-30"
              initial={{ scale: 0, rotate: 30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
            <motion.div
              className="absolute top-8 -right-8 w-10 h-10 z-30"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Glow effect */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            className="absolute inset-0 rounded-2xl -z-10"
            style={{
              background: `radial-gradient(circle, ${team.color}40 0%, transparent 70%)`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.5 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
