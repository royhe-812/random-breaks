"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { CelebrationElements } from "./celebration-elements"

const STARS_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBayLiveApp_Stars_DW_CC_v007_CC%202-OGJYd3jy5o3bamd4lN3498JekCYscy.png"
const FIRE_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBay_Live_Emoji_a_v008_Fire.0072%202-IVWHtqVd8MJLUNA3EfYsVshGT1EjUg.png"

const teams = [
  { name: "Chiefs", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", color: "#003594", secondary: "#869397" },
  { name: "49ers", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", color: "#008E97", secondary: "#FC4C02" },
]

interface PackRipRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

export function PackRipReveal({ isRevealing, onComplete }: PackRipRevealProps) {
  const [phase, setPhase] = useState<"idle" | "grip" | "tearing" | "ripped" | "revealed">("idle")
  const team = teams[0]

  useEffect(() => {
    if (isRevealing) {
      setPhase("idle")
      
      const gripTimer = setTimeout(() => setPhase("grip"), 200)
      const tearTimer = setTimeout(() => setPhase("tearing"), 600)
      const rippedTimer = setTimeout(() => setPhase("ripped"), 1100)
      const revealTimer = setTimeout(() => setPhase("revealed"), 1500)
      const completeTimer = setTimeout(() => onComplete(), 4000)
      
      return () => {
        clearTimeout(gripTimer)
        clearTimeout(tearTimer)
        clearTimeout(rippedTimer)
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  const isRipping = phase === "tearing" || phase === "ripped" || phase === "revealed"
  const isRevealed = phase === "revealed"

  return (
    <div className="relative w-48 h-72 flex items-center justify-center" style={{ perspective: "1000px" }}>
      {/* Tear particles */}
      <AnimatePresence>
        {phase === "tearing" && (
          <>
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-sm"
                style={{
                  width: 2 + Math.random() * 4,
                  height: 4 + Math.random() * 8,
                  backgroundColor: i % 4 === 0 ? "#a78bfa" : i % 4 === 1 ? "#c4b5fd" : i % 4 === 2 ? "#8b5cf6" : "#e9d5ff",
                  boxShadow: "0 0 4px rgba(167, 139, 250, 0.8)",
                  left: "50%",
                  top: "30%",
                }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 200,
                  y: Math.random() * 150 - 50,
                  opacity: 0,
                  rotate: Math.random() * 720 - 360,
                  scale: 0.5,
                }}
                transition={{ duration: 0.8 + Math.random() * 0.4, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Glow effect behind pack */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `radial-gradient(circle, ${team.color}60 0%, transparent 70%)`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.3 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Pack container */}
      <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
        
        {/* LEFT HALF of wrapper - tears to the left */}
        <motion.div
          className="absolute inset-y-0 left-0 w-1/2 origin-left overflow-hidden"
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateY: 0, x: 0 }}
          animate={
            isRipping
              ? { rotateY: -75, x: -20, opacity: phase === "revealed" ? 0 : 1 }
              : phase === "grip" 
                ? { rotateY: -3, x: -2 }
                : { rotateY: 0, x: 0 }
          }
          transition={{ 
            duration: phase === "tearing" ? 0.5 : 0.3,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <div 
            className="w-[200%] h-full rounded-l-xl"
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 30%, #7c3aed 60%, #6d28d9 100%)",
              borderLeft: "2px solid rgba(167, 139, 250, 0.5)",
              borderTop: "2px solid rgba(167, 139, 250, 0.5)",
              borderBottom: "2px solid rgba(167, 139, 250, 0.5)",
            }}
          >
            {/* Holographic foil pattern */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `repeating-linear-gradient(
                  120deg,
                  transparent,
                  transparent 6px,
                  rgba(255,255,255,0.4) 6px,
                  rgba(255,255,255,0.4) 8px
                )`
              }}
            />
            {/* Pack branding - left half */}
            <div className="absolute top-16 left-4 right-0">
              <div className="text-violet-200/80 font-bold text-xs tracking-wider">2024</div>
              <div className="text-white font-black text-lg">PANI</div>
            </div>
          </div>
          {/* Torn edge */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-3"
            style={{
              background: isRipping 
                ? "linear-gradient(90deg, #1a1a2e, #2d2d44)"
                : "transparent",
              clipPath: isRipping
                ? "polygon(0 0, 100% 5%, 60% 10%, 100% 18%, 40% 25%, 100% 35%, 50% 42%, 100% 50%, 60% 58%, 100% 65%, 40% 72%, 100% 82%, 50% 90%, 100% 100%, 0 100%)"
                : "none",
            }}
          />
        </motion.div>

        {/* RIGHT HALF of wrapper - tears to the right */}
        <motion.div
          className="absolute inset-y-0 right-0 w-1/2 origin-right overflow-hidden"
          style={{ transformStyle: "preserve-3d" }}
          initial={{ rotateY: 0, x: 0 }}
          animate={
            isRipping
              ? { rotateY: 75, x: 20, opacity: phase === "revealed" ? 0 : 1 }
              : phase === "grip"
                ? { rotateY: 3, x: 2 }
                : { rotateY: 0, x: 0 }
          }
          transition={{ 
            duration: phase === "tearing" ? 0.5 : 0.3,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <div 
            className="w-[200%] h-full -ml-full rounded-r-xl"
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 30%, #7c3aed 60%, #6d28d9 100%)",
              borderRight: "2px solid rgba(167, 139, 250, 0.5)",
              borderTop: "2px solid rgba(167, 139, 250, 0.5)",
              borderBottom: "2px solid rgba(167, 139, 250, 0.5)",
              marginLeft: "-100%",
            }}
          >
            {/* Holographic foil pattern */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `repeating-linear-gradient(
                  120deg,
                  transparent,
                  transparent 6px,
                  rgba(255,255,255,0.4) 6px,
                  rgba(255,255,255,0.4) 8px
                )`
              }}
            />
            {/* Pack branding - right half */}
            <div className="absolute top-16 left-[50%] pl-1">
              <div className="text-violet-200/80 font-bold text-xs tracking-wider">MOSAIC</div>
              <div className="text-white font-black text-lg">NI</div>
            </div>
          </div>
          {/* Torn edge */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-3"
            style={{
              background: isRipping 
                ? "linear-gradient(270deg, #1a1a2e, #2d2d44)"
                : "transparent",
              clipPath: isRipping
                ? "polygon(100% 0, 0 5%, 40% 10%, 0 18%, 60% 25%, 0 35%, 50% 42%, 0 50%, 40% 58%, 0 65%, 60% 72%, 0 82%, 50% 90%, 0 100%, 100% 100%)"
                : "none",
            }}
          />
        </motion.div>

        {/* THE CARD - revealed as pack tears */}
        <motion.div
          className="absolute inset-3 rounded-xl overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${team.color} 0%, ${team.color}dd 50%, ${team.color}bb 100%)`,
            boxShadow: isRevealed 
              ? `0 25px 60px ${team.color}50, 0 0 80px rgba(167,139,250,0.4), inset 0 1px 2px rgba(255,255,255,0.2)`
              : "0 4px 20px rgba(0,0,0,0.3)",
            border: `3px solid ${team.secondary}`,
          }}
          initial={{ scale: 0.95, opacity: 0.5 }}
          animate={
            isRevealed
              ? { scale: 1, opacity: 1, y: 0 }
              : isRipping
                ? { scale: 0.98, opacity: 0.9, y: 0 }
                : { scale: 0.95, opacity: 0.5, y: 0 }
          }
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Card holographic shine */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(105deg, 
                transparent 0%,
                rgba(255,255,255,0.3) 45%, 
                rgba(255,255,255,0.5) 50%,
                rgba(255,255,255,0.3) 55%, 
                transparent 100%
              )`,
            }}
            initial={{ x: "-150%" }}
            animate={isRevealed ? { x: "150%" } : { x: "-150%" }}
            transition={{ duration: 1, delay: 0.3, ease: "easeInOut" }}
          />

          {/* Card inner border */}
          <div 
            className="absolute inset-2 rounded-lg border-2 pointer-events-none"
            style={{ borderColor: team.secondary + "50" }}
          />

          {/* Card content */}
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            
            {/* Celebration elements */}
            <AnimatePresence>
              {isRevealed && (
                <CelebrationElements show={true} teamColor={team.color} />
              )}
            </AnimatePresence>

            {/* Team logo circle */}
            <motion.div
              className="relative w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ 
                backgroundColor: team.secondary,
                boxShadow: `0 8px 24px ${team.color}60, inset 0 -4px 8px rgba(0,0,0,0.2)`,
              }}
              initial={{ scale: 0, rotate: -180 }}
              animate={isRevealed ? { scale: 1, rotate: 0 } : { scale: 0.8, rotate: -90 }}
              transition={{ 
                delay: isRevealed ? 0.2 : 0,
                type: "spring", 
                stiffness: 200,
                damping: 15
              }}
            >
              <span className="text-3xl font-black" style={{ color: team.color }}>
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
              initial={{ opacity: 0, y: 20 }}
              animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <h3 className="text-white font-black text-2xl tracking-wide drop-shadow-lg">
                {team.name.toUpperCase()}
              </h3>
              <p className="text-xs mt-1 font-semibold tracking-widest" style={{ color: team.secondary }}>
                NFL 2024
              </p>
            </motion.div>

            {/* Fire icons */}
            <motion.div
              className="flex items-center gap-2 mt-4"
              initial={{ opacity: 0 }}
              animate={isRevealed ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="relative w-6 h-6">
                <Image src={FIRE_URL} alt="" fill className="object-contain" />
              </div>
              <span className="text-violet-300 text-xs font-bold tracking-wider">PULLED</span>
              <div className="relative w-6 h-6">
                <Image src={FIRE_URL} alt="" fill className="object-contain" />
              </div>
            </motion.div>
          </div>

          {/* Corner accents */}
          <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 rounded-tl-sm" style={{ borderColor: team.secondary + "70" }} />
          <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 rounded-tr-sm" style={{ borderColor: team.secondary + "70" }} />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 rounded-bl-sm" style={{ borderColor: team.secondary + "70" }} />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 rounded-br-sm" style={{ borderColor: team.secondary + "70" }} />
        </motion.div>
      </div>

      {/* Floating stars */}
      <AnimatePresence>
        {isRevealed && (
          <>
            <motion.div
              className="absolute -top-8 -left-8 w-14 h-14"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
            <motion.div
              className="absolute -top-4 -right-10 w-12 h-12"
              initial={{ scale: 0, rotate: 30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
            <motion.div
              className="absolute -bottom-6 -right-6 w-10 h-10"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
            >
              <Image src={STARS_URL} alt="" fill className="object-contain" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
