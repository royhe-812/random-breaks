"use client"

// Pack rip reveal animation - v4 - realistic top tear
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { CelebrationElements } from "./celebration-elements"

const STARS_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBayLiveApp_Stars_DW_CC_v007_CC%202-OGJYd3jy5o3bamd4lN3498JekCYscy.png"
const FIRE_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBay_Live_Emoji_a_v008_Fire.0072%202-IVWHtqVd8MJLUNA3EfYsVshGT1EjUg.png"

const teams = [
  { name: "Chiefs", city: "Kansas City", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", city: "Philadelphia", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", city: "Dallas", color: "#003594", secondary: "#869397" },
  { name: "49ers", city: "San Francisco", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", city: "Buffalo", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", city: "Miami", color: "#008E97", secondary: "#FC4C02" },
  { name: "Ravens", city: "Baltimore", color: "#241773", secondary: "#9E7C0C" },
  { name: "Lions", city: "Detroit", color: "#0076B6", secondary: "#B0B7BC" },
  { name: "Packers", city: "Green Bay", color: "#203731", secondary: "#FFB612" },
  { name: "Bengals", city: "Cincinnati", color: "#FB4F14", secondary: "#000000" },
  { name: "Jets", city: "New York", color: "#125740", secondary: "#000000" },
  { name: "Broncos", city: "Denver", color: "#FB4F14", secondary: "#002244" },
  { name: "Chargers", city: "Los Angeles", color: "#0080C6", secondary: "#FFC20E" },
  { name: "Colts", city: "Indianapolis", color: "#002C5F", secondary: "#A2AAAD" },
  { name: "Texans", city: "Houston", color: "#03202F", secondary: "#A71930" },
  { name: "Steelers", city: "Pittsburgh", color: "#FFB612", secondary: "#101820" },
]

interface Team {
  name: string
  color: string
  secondary: string
}

interface PackRipRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function PackRipReveal({ isRevealing, onComplete, team: propTeam }: PackRipRevealProps) {
  const [phase, setPhase] = useState<"idle" | "grip" | "tearing" | "pulling" | "revealed">("idle")
  const team = propTeam || teams[0]

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      
      const gripTimer = setTimeout(() => setPhase("grip"), 200)
      const tearTimer = setTimeout(() => setPhase("tearing"), 700)
      const pullTimer = setTimeout(() => setPhase("pulling"), 1200)
      const revealTimer = setTimeout(() => setPhase("revealed"), 1800)
      const completeTimer = setTimeout(() => onComplete(), 4500)
      
      return () => {
        clearTimeout(gripTimer)
        clearTimeout(tearTimer)
        clearTimeout(pullTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  const isTearing = phase === "tearing" || phase === "pulling" || phase === "revealed"
  const isPulling = phase === "pulling" || phase === "revealed"
  const isRevealed = phase === "revealed"

  return (
    <div className="relative w-48 h-72 flex items-center justify-center" style={{ perspective: "1200px" }}>
      
      {/* Tear particles flying out when ripping */}
      <AnimatePresence>
        {phase === "tearing" && (
          <>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-sm z-50"
                style={{
                  width: 3 + Math.random() * 5,
                  height: 6 + Math.random() * 10,
                  backgroundColor: i % 3 === 0 ? "#c4b5fd" : i % 3 === 1 ? "#a78bfa" : "#e9d5ff",
                  left: `${30 + Math.random() * 40}%`,
                  top: "15%",
                }}
                initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 150,
                  y: -50 + Math.random() * 100,
                  opacity: 0,
                  rotate: Math.random() * 540 - 270,
                  scale: 0.3,
                }}
                transition={{ duration: 0.6 + Math.random() * 0.3, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main pack container */}
      <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
        
        {/* Pack body (stays in place) */}
        <motion.div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #a78bfa 0%, #8b5cf6 40%, #7c3aed 70%, #6d28d9 100%)",
            boxShadow: "0 8px 32px rgba(139, 92, 246, 0.4), inset 0 1px 2px rgba(255,255,255,0.2)",
            border: "2px solid rgba(167, 139, 250, 0.6)",
          }}
          animate={{
            scale: phase === "grip" ? 1.02 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Holographic foil pattern on body */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `repeating-linear-gradient(
                110deg,
                transparent,
                transparent 8px,
                rgba(255,255,255,0.5) 8px,
                rgba(255,255,255,0.5) 10px
              )`
            }}
          />
          
          {/* Pack branding - PANINI style */}
          <div className="absolute top-20 inset-x-0 flex flex-col items-center">
            <div className="text-violet-200/60 font-bold text-xs tracking-[0.3em]">2024</div>
            <div className="text-white font-black text-2xl tracking-wider mt-1">PANINI</div>
            <div className="text-violet-200/80 font-bold text-sm tracking-[0.2em] mt-1">MOSAIC</div>
            <div className="w-16 h-0.5 bg-violet-300/40 mt-3 rounded-full" />
            <div className="text-violet-300/60 text-[10px] font-semibold mt-2 tracking-widest">NFL</div>
          </div>
          
          {/* Bottom accent */}
          <div className="absolute bottom-4 inset-x-4">
            <div className="h-1 bg-gradient-to-r from-transparent via-violet-300/30 to-transparent rounded-full" />
          </div>
        </motion.div>

        {/* Top flap that tears/peels back */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-24 origin-bottom overflow-visible z-20"
          style={{ 
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom",
          }}
          animate={{
            rotateX: isPulling ? -160 : isTearing ? -40 : phase === "grip" ? -8 : 0,
            y: isPulling ? -10 : 0,
            scale: isPulling ? 0.95 : 1,
          }}
          transition={{ 
            duration: phase === "pulling" ? 0.5 : phase === "tearing" ? 0.4 : 0.2,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          {/* Front of the flap */}
          <div 
            className="absolute inset-0 rounded-t-xl"
            style={{
              background: "linear-gradient(160deg, #c4b5fd 0%, #a78bfa 40%, #8b5cf6 100%)",
              border: "2px solid rgba(167, 139, 250, 0.6)",
              borderBottom: "none",
              boxShadow: isTearing ? "0 4px 16px rgba(0,0,0,0.3)" : "none",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Tear line indicator */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{
                background: "repeating-linear-gradient(90deg, transparent 0px, transparent 4px, rgba(139, 92, 246, 0.6) 4px, rgba(139, 92, 246, 0.6) 8px)",
              }}
            />
            
            {/* Grip area indicator */}
            <motion.div 
              className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1"
              animate={{
                scale: phase === "grip" ? 1.1 : 1,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-violet-300/50" />
              <div className="text-violet-200/70 text-[9px] font-bold tracking-wider">TEAR HERE</div>
              <div className="w-2 h-2 rounded-full bg-violet-300/50" />
            </motion.div>
            
            {/* Holographic shine on flap */}
            <div 
              className="absolute inset-0 opacity-30 rounded-t-xl"
              style={{
                background: `repeating-linear-gradient(
                  110deg,
                  transparent,
                  transparent 8px,
                  rgba(255,255,255,0.5) 8px,
                  rgba(255,255,255,0.5) 10px
                )`
              }}
            />
          </div>
          
          {/* Back of the flap (visible when flipped) */}
          <div 
            className="absolute inset-0 rounded-t-xl"
            style={{
              background: "linear-gradient(160deg, #1a1a2e 0%, #2d2d44 100%)",
              transform: "rotateX(180deg)",
              backfaceVisibility: "hidden",
            }}
          />
          
          {/* Torn edge effect */}
          <motion.div
            className="absolute -bottom-2 left-0 right-0 h-4"
            style={{
              background: "linear-gradient(180deg, #1a1a2e 0%, transparent 100%)",
              clipPath: isTearing 
                ? "polygon(0 0, 8% 60%, 15% 20%, 22% 70%, 30% 30%, 38% 80%, 45% 25%, 52% 65%, 60% 35%, 68% 75%, 75% 20%, 82% 60%, 90% 30%, 100% 50%, 100% 100%, 0 100%)"
                : "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
              opacity: isTearing ? 1 : 0,
            }}
          />
        </motion.div>

        {/* The card inside - revealed as pack opens */}
        <motion.div
          className="absolute left-3 right-3 top-20 bottom-3 rounded-lg overflow-hidden z-10"
          style={{
            background: `linear-gradient(160deg, ${team.color} 0%, ${team.color}dd 50%, ${team.color}bb 100%)`,
            boxShadow: isRevealed 
              ? `0 20px 50px ${team.color}50, 0 0 60px rgba(167,139,250,0.3), inset 0 1px 2px rgba(255,255,255,0.2)`
              : "0 4px 16px rgba(0,0,0,0.2)",
            border: `3px solid ${team.secondary}`,
          }}
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={
            isRevealed
              ? { y: -30, opacity: 1, scale: 1.05 }
              : isPulling
                ? { y: 0, opacity: 1, scale: 0.95 }
                : { y: 20, opacity: 0, scale: 0.9 }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
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
            transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
          />

          {/* Card inner border */}
          <div 
            className="absolute inset-2 rounded-md border-2 pointer-events-none"
            style={{ borderColor: team.secondary + "40" }}
          />

          {/* Card content */}
          <div className="relative w-full h-full flex flex-col items-center justify-center p-3">
            
            {/* Celebration elements */}
            <AnimatePresence>
              {isRevealed && (
                <CelebrationElements show={true} teamColor={team.color} />
              )}
            </AnimatePresence>

            {/* Team logo circle */}
            <motion.div
              className="relative w-16 h-16 rounded-full flex items-center justify-center mb-3"
              style={{ 
                backgroundColor: team.secondary,
                boxShadow: `0 6px 20px ${team.color}50, inset 0 -3px 6px rgba(0,0,0,0.2)`,
              }}
              initial={{ scale: 0, rotate: -180 }}
              animate={isRevealed ? { scale: 1, rotate: 0 } : { scale: 0.5, rotate: -90 }}
              transition={{ 
                delay: isRevealed ? 0.15 : 0,
                type: "spring", 
                stiffness: 200,
                damping: 15
              }}
            >
              <span className="text-2xl font-black" style={{ color: team.color }}>
                {team.name.slice(0, 2).toUpperCase()}
              </span>
              {/* Glossy overlay */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)",
                }}
              />
            </motion.div>

            {/* Team name */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 15 }}
              animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                {(team as typeof teams[0]).city || ""}
              </p>
              <h3 className="text-white font-black text-xl tracking-wide drop-shadow-lg">
                {team.name.toUpperCase()}
              </h3>
              <p className="text-[9px] mt-0.5 font-semibold tracking-widest" style={{ color: team.secondary }}>
                NFL 2024
              </p>
            </motion.div>

            {/* Fire icons */}
            <motion.div
              className="flex items-center gap-1.5 mt-2"
              initial={{ opacity: 0 }}
              animate={isRevealed ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.5 }}
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
      </div>

      {/* Glow effect when revealed */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            className="absolute inset-0 rounded-2xl -z-10"
            style={{
              background: `radial-gradient(circle, ${team.color}50 0%, transparent 70%)`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.4 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Floating stars */}
      <AnimatePresence>
        {isRevealed && (
          <>
            <motion.div
              className="absolute -top-10 -left-6 w-12 h-12 z-30"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
            <motion.div
              className="absolute -top-6 -right-8 w-10 h-10 z-30"
              initial={{ scale: 0, rotate: 30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
            <motion.div
              className="absolute -bottom-4 -right-4 w-8 h-8 z-30"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
