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
      
      const rotateTimer = setTimeout(() => setPhase("rotate"), 300)
      const focusTimer = setTimeout(() => setPhase("focus"), 800)
      const ripTimer = setTimeout(() => setPhase("rip"), 1300)
      const cardOutTimer = setTimeout(() => setPhase("cardOut"), 1800)
      const revealTimer = setTimeout(() => setPhase("revealed"), 2600)
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

  // Pack zooms IN closer to screen like the GIF reference
  const getPackTransform = () => {
    switch (phase) {
      case "idle":
        return { scale: 0.7, rotate: 0, y: -20 }
      case "rotate":
        return { scale: 1.0, rotate: -5, y: 0 }
      case "focus":
        return { scale: 1.3, rotate: 0, y: 40 }
      case "rip":
        return { scale: 1.25, rotate: 0, y: 50 }
      case "cardOut":
        return { scale: 1.1, rotate: 0, y: 70 }
      case "revealed":
        return { scale: 0.75, rotate: 0, y: 120 }
      default:
        return { scale: 0.7, rotate: 0, y: -20 }
    }
  }

  const packTransform = getPackTransform()

  return (
    <div className="relative w-72 h-[450px] flex items-center justify-center overflow-visible">
      
      {/* Pack container - everything moves together */}
      <motion.div
        className="relative"
        style={{ width: 160, height: 220 }}
        animate={{
          scale: packTransform.scale,
          rotate: packTransform.rotate,
          y: packTransform.y,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        
        {/* Card INSIDE the pack - starts hidden, slides up and out */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 rounded-xl overflow-hidden"
          style={{
            width: 130,
            height: 185,
            background: `linear-gradient(145deg, ${team.color}, ${team.color}dd)`,
            boxShadow: isRevealed 
              ? `0 20px 60px ${team.color}60, 0 0 80px rgba(167,139,250,0.4)`
              : `0 10px 30px rgba(0,0,0,0.3)`,
            border: `3px solid ${team.secondary}`,
            zIndex: isCardOut ? 50 : 5,
          }}
          initial={{ y: 20 }}
          animate={{
            y: isRevealed ? -220 : isCardOut ? -100 : 20,
          }}
          transition={{ 
            duration: 0.7, 
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
              className="relative w-14 h-14 rounded-full flex items-center justify-center mb-2"
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
              <span className="text-xl font-black" style={{ color: team.color }}>
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
              <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                {(team as typeof teams[0]).city || ""}
              </p>
              <p className="text-white font-black text-lg tracking-wide drop-shadow-lg">
                {team.name.toUpperCase()}
              </p>
              <p className="text-[9px] mt-1 font-semibold tracking-widest" style={{ color: team.secondary }}>
                NFL 2024
              </p>
            </motion.div>

            {/* Fire icons */}
            <motion.div
              className="flex items-center gap-2 mt-2"
              initial={{ opacity: 0 }}
              animate={isRevealed ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative w-5 h-5">
                <Image src={FIRE_URL} alt="" fill className="object-contain" />
              </div>
              <span className="text-violet-300 text-[9px] font-bold tracking-wider">PULLED</span>
              <div className="relative w-5 h-5">
                <Image src={FIRE_URL} alt="" fill className="object-contain" />
              </div>
            </motion.div>
          </div>

          {/* Corner accents */}
          <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 rounded-tl-sm" style={{ borderColor: team.secondary + "60" }} />
          <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 rounded-tr-sm" style={{ borderColor: team.secondary + "60" }} />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 rounded-bl-sm" style={{ borderColor: team.secondary + "60" }} />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 rounded-br-sm" style={{ borderColor: team.secondary + "60" }} />
        </motion.div>

        {/* Pack body - sits on top of card initially, hides the card */}
        <div
          className="absolute inset-0 overflow-hidden z-10"
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
            <div className="text-zinc-700 font-black text-2xl tracking-wider mt-1">PANINI</div>
            <div className="text-zinc-600/90 font-bold text-base tracking-[0.2em] mt-1">MOSAIC</div>
            <div className="w-16 h-0.5 bg-zinc-500/40 mt-3 rounded-full" />
            <div className="text-zinc-500/70 text-xs font-semibold mt-2 tracking-widest">NFL</div>
          </div>
        </div>

        {/* Top crimped edge - sealed (hides before rip) */}
        <AnimatePresence>
          {!isRipping && (
            <motion.div 
              className="absolute -top-3 left-0 right-0 h-6 z-20"
              style={{
                background: "linear-gradient(180deg, #d8d4d0 0%, #c8c4c0 100%)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom crimped edge */}
        <div 
          className="absolute -bottom-3 left-0 right-0 h-6 z-20"
          style={{
            background: "linear-gradient(180deg, #c8c4c0 0%, #b8b4b0 100%)",
            boxShadow: "0 -2px 4px rgba(0,0,0,0.1)",
          }}
        >
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

        {/* Tear effect - top flaps peel back */}
        <AnimatePresence>
          {isRipping && (
            <>
              {/* Left torn flap */}
              <motion.div
                className="absolute -top-3 left-0 h-12 origin-bottom-left z-30"
                style={{
                  width: "52%",
                  background: "linear-gradient(180deg, #d8d4d0 0%, #c8c4c0 100%)",
                }}
                initial={{ rotateX: 0, rotateZ: 0, y: 0 }}
                animate={{ rotateX: -140, rotateZ: -20, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div 
                  className="absolute right-0 top-0 bottom-0 w-4"
                  style={{
                    background: "#c8c4c0",
                    clipPath: "polygon(0 0, 100% 8%, 20% 18%, 100% 28%, 0 38%, 100% 48%, 0 58%, 100% 68%, 20% 78%, 100% 88%, 0 100%)",
                  }}
                />
              </motion.div>

              {/* Right torn flap */}
              <motion.div
                className="absolute -top-3 right-0 h-12 origin-bottom-right z-30"
                style={{
                  width: "52%",
                  background: "linear-gradient(180deg, #d8d4d0 0%, #c8c4c0 100%)",
                }}
                initial={{ rotateX: 0, rotateZ: 0, y: 0 }}
                animate={{ rotateX: -140, rotateZ: 20, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div 
                  className="absolute left-0 top-0 bottom-0 w-4"
                  style={{
                    background: "#c8c4c0",
                    clipPath: "polygon(100% 0, 0 8%, 80% 18%, 0 28%, 100% 38%, 0 48%, 100% 58%, 0 68%, 80% 78%, 0 88%, 100% 100%)",
                  }}
                />
              </motion.div>

              {/* Tear particles */}
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-sm z-40"
                  style={{
                    width: 2 + Math.random() * 3,
                    height: 3 + Math.random() * 5,
                    backgroundColor: i % 2 === 0 ? "#d8d4d0" : "#c8c4c0",
                    left: `${40 + Math.random() * 20}%`,
                    top: -5,
                  }}
                  initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    x: (Math.random() - 0.5) * 60,
                    y: -15 - Math.random() * 30,
                    opacity: 0,
                    rotate: Math.random() * 360,
                  }}
                  transition={{ duration: 0.4, delay: i * 0.02, ease: "easeOut" }}
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
              className="absolute -top-8 left-4 w-12 h-12 z-50"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
            <motion.div
              className="absolute -top-4 right-2 w-10 h-10 z-50"
              initial={{ scale: 0, rotate: 30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
            <motion.div
              className="absolute top-20 right-0 w-8 h-8 z-50"
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
