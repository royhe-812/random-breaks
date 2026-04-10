"use client"

// Pack rip reveal animation - v5 - tear from right to left
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
  const [phase, setPhase] = useState<"idle" | "grip" | "tearing" | "open" | "revealed">("idle")
  const [tearProgress, setTearProgress] = useState(0)
  const [randomTeam, setRandomTeam] = useState(() => teams[Math.floor(Math.random() * teams.length)])
  const team = propTeam || randomTeam

  useEffect(() => {
    if (isRevealing) {
      // Pick a new random team each reveal
      setRandomTeam(teams[Math.floor(Math.random() * teams.length)])
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
      
      {/* Tear particles flying out from the tear line - metallic foil pieces */}
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
                  backgroundColor: i % 3 === 0 ? "#d4d4d4" : i % 3 === 1 ? "#a0a0a0" : "#e8e8e8",
                  right: `${20 + (tearProgress * 0.6)}%`,
                  top: "15%",
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
        
        {/* Pack body - metallic foil wrapper */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #e8e8e8 0%, #c0c0c0 15%, #a8a8a8 30%, #d4d4d4 50%, #b0b0b0 70%, #909090 85%, #a0a0a0 100%)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.2)",
          }}
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
          <div className="absolute top-20 inset-x-0 flex flex-col items-center">
            <div className="text-gray-500 font-bold text-xs tracking-[0.3em]">2024</div>
            <div className="text-gray-700 font-black text-2xl tracking-wider mt-1 drop-shadow-sm">PANINI</div>
            <div className="text-gray-600 font-bold text-sm tracking-[0.2em] mt-1">MOSAIC</div>
            <div className="w-16 h-0.5 bg-gray-400/60 mt-3 rounded-full" />
            <div className="text-gray-500 text-[10px] font-semibold mt-2 tracking-widest">NFL</div>
          </div>
          
          {/* Side seam lines */}
          <div className="absolute top-5 bottom-5 left-1 w-px bg-gradient-to-b from-transparent via-black/10 to-transparent" />
          <div className="absolute top-5 bottom-5 right-1 w-px bg-gradient-to-b from-transparent via-black/10 to-transparent" />
        </div>

        {/* Top sealed area - this gets torn */}
        <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden z-10">
          {/* Untorn portion (shrinks from right as tear progresses) */}
          <motion.div
            className="absolute top-0 left-0 h-full"
            style={{
              width: `${100 - tearProgress}%`,
              background: "linear-gradient(180deg, #d0d0d0 0%, #b8b8b8 30%, #a0a0a0 70%, #888888 100%)",
            }}
          >
            {/* Crimp texture on top */}
            <div className="absolute top-0 left-0 right-0 h-5 flex justify-between px-1">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 h-full"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(0,0,0,0.15) 50%, rgba(255,255,255,0.3) 100%)",
                  }}
                />
              ))}
            </div>
            
            {/* Tear here text */}
            {!isTearing && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500/50" />
                <div className="text-gray-600/80 text-[8px] font-bold tracking-wider">TEAR</div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500/50" />
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
                  background: "linear-gradient(180deg, #c8c8c8 0%, #a8a8a8 50%, #909090 100%)",
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
                    background: "linear-gradient(180deg, #b0b0b0, #909090)",
                    clipPath: "polygon(100% 0, 0 5%, 100% 10%, 0 18%, 100% 25%, 0 32%, 100% 40%, 0 48%, 100% 55%, 0 62%, 100% 70%, 0 78%, 100% 85%, 0 92%, 100% 100%, 100% 0)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Perforated tear line indicator */}
          {!isTearing && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{
                background: "repeating-linear-gradient(90deg, transparent 0px, transparent 4px, rgba(0,0,0,0.3) 4px, rgba(0,0,0,0.3) 8px)",
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
                {(team as typeof teams[0]).abbrev || team.name.slice(0, 2).toUpperCase()}
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
