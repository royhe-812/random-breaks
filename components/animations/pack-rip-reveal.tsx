"use client"

// Pack rip reveal animation - two layer pack with card nested inside
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
  const [phase, setPhase] = useState<"idle" | "zoom" | "rip" | "glow" | "cardOut" | "revealed">("idle")
  const team = propTeam || teams[0]

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      
      const zoomTimer = setTimeout(() => setPhase("zoom"), 200)
      const ripTimer = setTimeout(() => setPhase("rip"), 900)
      const glowTimer = setTimeout(() => setPhase("glow"), 1400)
      const cardOutTimer = setTimeout(() => setPhase("cardOut"), 1800)
      const revealTimer = setTimeout(() => setPhase("revealed"), 2800)
      const completeTimer = setTimeout(() => onComplete(), 5500)
      
      return () => {
        clearTimeout(zoomTimer)
        clearTimeout(ripTimer)
        clearTimeout(glowTimer)
        clearTimeout(cardOutTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  const isRipping = phase === "rip" || phase === "glow" || phase === "cardOut" || phase === "revealed"
  const isGlowing = phase === "glow" || phase === "cardOut" || phase === "revealed"
  const isCardOut = phase === "cardOut" || phase === "revealed"
  const isRevealed = phase === "revealed"

  // Pack zooms IN to fill screen during rip
  const getPackTransform = () => {
    switch (phase) {
      case "idle":
        return { scale: 0.8, rotate: 0, y: 0 }
      case "zoom":
        return { scale: 1.3, rotate: -3, y: 30 }
      case "rip":
      case "glow":
        return { scale: 1.4, rotate: 0, y: 50 }
      case "cardOut":
        return { scale: 1.2, rotate: 0, y: 80 }
      case "revealed":
        return { scale: 0.7, rotate: 0, y: 160 }
      default:
        return { scale: 0.8, rotate: 0, y: 0 }
    }
  }

  const packTransform = getPackTransform()

  return (
    <div className="relative w-72 h-[480px] flex items-center justify-center overflow-hidden">
      
      {/* Pack container */}
      <motion.div
        className="relative"
        style={{ width: 160, height: 220 }}
        animate={{
          scale: packTransform.scale,
          rotate: packTransform.rotate,
          y: packTransform.y,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        
        {/* LAYER 1: Back of pack (z-index: 1) */}
        <div
          className="absolute inset-0 rounded-sm"
          style={{
            background: "linear-gradient(180deg, #c0bcb8 0%, #a8a4a0 100%)",
            zIndex: 1,
          }}
        />

        {/* LAYER 2: The Card - sandwiched between back and front (z-index: 5, then 50 when out) */}
        <motion.div
          className="absolute left-1/2 rounded-lg overflow-hidden"
          style={{
            width: 130,
            height: 185,
            marginLeft: -65,
            top: 18,
            background: `linear-gradient(145deg, ${team.color}, ${team.color}dd)`,
            boxShadow: isRevealed 
              ? `0 25px 80px ${team.color}80, 0 0 100px ${team.color}40`
              : `0 8px 25px rgba(0,0,0,0.4)`,
            border: `3px solid ${team.secondary}`,
            zIndex: isCardOut ? 50 : 5,
          }}
          animate={{
            y: isRevealed ? -280 : isCardOut ? -150 : 0,
            scale: isRevealed ? 1.2 : 1,
          }}
          transition={{ 
            duration: 0.8, 
            ease: [0.25, 0.8, 0.25, 1]
          }}
        >
          {/* Card holographic shine */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `linear-gradient(105deg, 
                transparent 0%,
                rgba(255,255,255,0.5) 45%, 
                rgba(255,255,255,0.9) 50%,
                rgba(255,255,255,0.5) 55%, 
                transparent 100%
              )`,
            }}
            initial={{ x: "-150%" }}
            animate={isRevealed ? { x: "150%" } : { x: "-150%" }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeInOut" }}
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
                delay: 0.1,
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
              initial={{ opacity: 0, y: 10 }}
              animate={isCardOut ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ delay: 0.2, duration: 0.3 }}
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
              transition={{ delay: 0.3 }}
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

        {/* LAYER 3: Front of pack (z-index: 10) - covers card until ripped */}
        <motion.div
          className="absolute inset-0 rounded-sm overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #e8e4e0 0%, #d4d0cc 30%, #c8c4c0 70%, #b8b4b0 100%)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.8)",
            zIndex: 10,
          }}
          animate={{
            clipPath: isRipping 
              ? "polygon(0 40%, 100% 40%, 100% 100%, 0 100%)"
              : "polygon(0 0%, 100% 0%, 100% 100%, 0 100%)"
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Foil texture/wrinkles */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(ellipse 100% 20% at 50% 20%, rgba(255,255,255,0.6) 0%, transparent 50%),
                radial-gradient(ellipse 80% 30% at 30% 50%, rgba(255,255,255,0.4) 0%, transparent 50%),
                radial-gradient(ellipse 80% 30% at 70% 60%, rgba(255,255,255,0.4) 0%, transparent 50%)
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
        </motion.div>

        {/* Top crimped edge (z-index: 15) */}
        <AnimatePresence>
          {!isRipping && (
            <motion.div 
              className="absolute -top-3 left-0 right-0 h-5 rounded-t-sm"
              style={{
                background: "linear-gradient(180deg, #d8d4d0 0%, #c8c4c0 100%)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                zIndex: 15,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {[...Array(4)].map((_, i) => (
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

        {/* Bottom crimped edge (z-index: 15) */}
        <div 
          className="absolute -bottom-3 left-0 right-0 h-5 rounded-b-sm"
          style={{
            background: "linear-gradient(180deg, #c8c4c0 0%, #b8b4b0 100%)",
            boxShadow: "0 -2px 4px rgba(0,0,0,0.1)",
            zIndex: 15,
          }}
        >
          {[...Array(4)].map((_, i) => (
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

        {/* Rip effect - single flap peeling from right to left (z-index: 20) */}
        <AnimatePresence>
          {isRipping && (
            <>
              {/* The torn top portion - peels from right to left */}
              <motion.div
                className="absolute -top-3 left-0 right-0 h-24 origin-left"
                style={{
                  background: "linear-gradient(180deg, #d8d4d0 0%, #c8c4c0 30%, #e8e4e0 100%)",
                  zIndex: 20,
                  transformStyle: "preserve-3d",
                }}
                initial={{ rotateY: 0, x: 0 }}
                animate={{ rotateY: -160, x: -20 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Torn edge pattern on the right side */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-6"
                  style={{
                    background: "#c8c4c0",
                    clipPath: "polygon(30% 0, 100% 0, 100% 100%, 30% 100%, 0% 90%, 60% 80%, 0% 70%, 50% 60%, 0% 50%, 60% 40%, 0% 30%, 50% 20%, 0% 10%)",
                  }}
                />
                {/* Crimped lines on torn piece */}
                <div className="absolute top-0 left-0 right-6 h-5">
                  {[...Array(4)].map((_, i) => (
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
              </motion.div>

              {/* Glow effect from inside pack when opening */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-20 rounded-t-lg"
                style={{
                  background: `linear-gradient(180deg, ${team.color}80 0%, ${team.color}40 40%, transparent 100%)`,
                  zIndex: 18,
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: isGlowing ? 1 : 0, scaleY: isGlowing ? 1 : 0 }}
                transition={{ duration: 0.4 }}
              />

              {/* Light rays from opening */}
              {isGlowing && [...Array(5)].map((_, i) => (
                <motion.div
                  key={`ray-${i}`}
                  className="absolute"
                  style={{
                    top: 0,
                    left: `${30 + i * 10}%`,
                    width: 3,
                    height: 60,
                    background: `linear-gradient(180deg, ${team.color} 0%, transparent 100%)`,
                    zIndex: 19,
                    transformOrigin: "top center",
                  }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: [0, 0.8, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              ))}

              {/* Tear particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-sm"
                  style={{
                    width: 2 + Math.random() * 3,
                    height: 3 + Math.random() * 5,
                    backgroundColor: i % 2 === 0 ? "#d8d4d0" : "#c8c4c0",
                    left: `${60 + Math.random() * 30}%`,
                    top: 10,
                    zIndex: 25,
                  }}
                  initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    x: -30 - Math.random() * 50,
                    y: -20 - Math.random() * 30,
                    opacity: 0,
                    rotate: -90 - Math.random() * 180,
                  }}
                  transition={{ duration: 0.5, delay: i * 0.03, ease: "easeOut" }}
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
              className="absolute -top-12 left-8 w-12 h-12 z-50"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
            <motion.div
              className="absolute -top-6 right-6 w-10 h-10 z-50"
              initial={{ scale: 0, rotate: 30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
            <motion.div
              className="absolute top-16 left-2 w-8 h-8 z-50"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Background glow */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            className="absolute inset-0 rounded-2xl -z-10"
            style={{
              background: `radial-gradient(circle, ${team.color}50 0%, transparent 60%)`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.5 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
