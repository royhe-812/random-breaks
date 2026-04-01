"use client"

// Pack rip reveal animation - v5 - tear from right to left
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
  const [phase, setPhase] = useState<"idle" | "grip" | "tearing" | "open" | "revealed">("idle")
  const [tearProgress, setTearProgress] = useState(0)
  const team = propTeam || teams[0]

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      setTearProgress(0)
      
      const gripTimer = setTimeout(() => setPhase("grip"), 200)
      const tearTimer = setTimeout(() => {
        setPhase("tearing")
        // Animate tear progress from 0 to 100 over 800ms
        let start = Date.now()
        const animateTear = () => {
          const elapsed = Date.now() - start
          const progress = Math.min(elapsed / 800, 1)
          setTearProgress(progress * 100)
          if (progress < 1) {
            requestAnimationFrame(animateTear)
          }
        }
        requestAnimationFrame(animateTear)
      }, 600)
      const openTimer = setTimeout(() => setPhase("open"), 1500)
      const revealTimer = setTimeout(() => setPhase("revealed"), 2200)
      const completeTimer = setTimeout(() => onComplete(), 5000)
      
      return () => {
        clearTimeout(gripTimer)
        clearTimeout(tearTimer)
        clearTimeout(openTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  const isTearing = phase === "tearing" || phase === "open" || phase === "revealed"
  const isOpen = phase === "open" || phase === "revealed"
  const isRevealed = phase === "revealed"

  return (
    <div className="relative w-48 h-72 flex items-center justify-center">
      
      {/* Tear particles flying out from the tear line */}
      <AnimatePresence>
        {phase === "tearing" && (
          <>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-sm z-50"
                style={{
                  width: 2 + Math.random() * 4,
                  height: 4 + Math.random() * 8,
                  backgroundColor: i % 3 === 0 ? "#c4b5fd" : i % 3 === 1 ? "#a78bfa" : "#e9d5ff",
                  right: `${20 + (tearProgress * 0.6)}%`,
                  top: "18%",
                }}
                initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: -30 + Math.random() * 60,
                  y: -40 + Math.random() * 80,
                  opacity: 0,
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 0.4, delay: i * 0.03, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main pack */}
      <div className="relative w-full h-full">
        
        {/* Pack body - the main wrapper that holds everything */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #a78bfa 0%, #8b5cf6 40%, #7c3aed 70%, #6d28d9 100%)",
            boxShadow: "0 8px 32px rgba(139, 92, 246, 0.4), inset 0 1px 2px rgba(255,255,255,0.2)",
            border: "2px solid rgba(167, 139, 250, 0.6)",
          }}
        >
          {/* Holographic foil pattern */}
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
          
          {/* Pack branding */}
          <div className="absolute top-24 inset-x-0 flex flex-col items-center">
            <div className="text-violet-200/60 font-bold text-xs tracking-[0.3em]">2024</div>
            <div className="text-white font-black text-2xl tracking-wider mt-1">PANINI</div>
            <div className="text-violet-200/80 font-bold text-sm tracking-[0.2em] mt-1">MOSAIC</div>
            <div className="w-16 h-0.5 bg-violet-300/40 mt-3 rounded-full" />
            <div className="text-violet-300/60 text-[10px] font-semibold mt-2 tracking-widest">NFL</div>
          </div>
        </div>

        {/* Top sealed area - this gets torn */}
        <div className="absolute top-0 left-0 right-0 h-20 overflow-hidden rounded-t-xl z-10">
          {/* Untorn portion (shrinks from right as tear progresses) */}
          <motion.div
            className="absolute top-0 left-0 h-full rounded-t-xl"
            style={{
              width: `${100 - tearProgress}%`,
              background: "linear-gradient(160deg, #c4b5fd 0%, #a78bfa 40%, #8b5cf6 100%)",
              borderTop: "2px solid rgba(167, 139, 250, 0.6)",
              borderLeft: "2px solid rgba(167, 139, 250, 0.6)",
              borderRight: isTearing ? "none" : "2px solid rgba(167, 139, 250, 0.6)",
            }}
          >
            {/* Holographic shine */}
            <div 
              className="absolute inset-0 opacity-30"
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
            
            {/* Tear here text */}
            {!isTearing && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-300/50" />
                <div className="text-violet-200/70 text-[8px] font-bold tracking-wider">RIP</div>
                <div className="w-1.5 h-1.5 rounded-full bg-violet-300/50" />
              </div>
            )}
          </motion.div>

          {/* Torn flap piece (peels away to the right) */}
          <AnimatePresence>
            {tearProgress > 0 && (
              <motion.div
                className="absolute top-0 h-full origin-left"
                style={{
                  left: `${100 - tearProgress}%`,
                  width: `${tearProgress}%`,
                  background: "linear-gradient(160deg, #c4b5fd 0%, #a78bfa 100%)",
                  transformOrigin: "left center",
                }}
                initial={{ rotateY: 0 }}
                animate={{ 
                  rotateY: isOpen ? 90 : tearProgress > 50 ? 30 : 10,
                  x: isOpen ? 20 : 0,
                  opacity: isOpen ? 0 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Jagged torn edge on the left side */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-2 -ml-1"
                  style={{
                    background: "#a78bfa",
                    clipPath: "polygon(100% 0, 0 5%, 100% 10%, 0 18%, 100% 25%, 0 32%, 100% 40%, 0 48%, 100% 55%, 0 62%, 100% 70%, 0 78%, 100% 85%, 0 92%, 100% 100%, 100% 0)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Perforated tear line indicator */}
          {!isTearing && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{
                background: "repeating-linear-gradient(90deg, transparent 0px, transparent 4px, rgba(109, 40, 217, 0.5) 4px, rgba(109, 40, 217, 0.5) 8px)",
              }}
            />
          )}
        </div>

        {/* Card inside - hidden by pack, slides up when opened */}
        <motion.div
          className="absolute left-4 right-4 rounded-lg overflow-hidden z-5"
          style={{
            top: "25%",
            height: "65%",
            background: team.color,
            boxShadow: isRevealed 
              ? `0 20px 50px ${team.color}50, 0 0 60px rgba(167,139,250,0.3)`
              : "0 4px 16px rgba(0,0,0,0.2)",
            border: `3px solid ${team.secondary}`,
            clipPath: isOpen ? "none" : "inset(0 0 0 0)",
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={
            isRevealed
              ? { y: -60, opacity: 1, scale: 1.08 }
              : isOpen
                ? { y: 0, opacity: 1, scale: 1 }
                : { y: 50, opacity: 0, scale: 0.95 }
          }
          transition={{ 
            duration: isRevealed ? 0.6 : 0.4, 
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
            
            {/* Celebration elements */}
            <AnimatePresence>
              {isRevealed && (
                <CelebrationElements show={true} teamColor={team.color} />
              )}
            </AnimatePresence>

            {/* Team logo circle */}
            <motion.div
              className="relative w-14 h-14 rounded-full flex items-center justify-center mb-2"
              style={{ 
                backgroundColor: team.secondary,
                boxShadow: `0 6px 20px ${team.color}50`,
              }}
              initial={{ scale: 0, rotate: -180 }}
              animate={isRevealed ? { scale: 1, rotate: 0 } : isOpen ? { scale: 0.8, rotate: -45 } : { scale: 0, rotate: -180 }}
              transition={{ 
                delay: isRevealed ? 0.2 : 0,
                type: "spring", 
                stiffness: 200,
                damping: 15
              }}
            >
              <span className="text-xl font-black" style={{ color: team.color }}>
                {team.name.slice(0, 2).toUpperCase()}
              </span>
            </motion.div>

            {/* Team name */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 15 }}
              animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                {(team as typeof teams[0]).city || ""}
              </p>
              <p className="text-white font-black text-lg tracking-wide drop-shadow-lg">
                {team.name.toUpperCase()}
              </p>
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
