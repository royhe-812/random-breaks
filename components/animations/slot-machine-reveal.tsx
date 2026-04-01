"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CelebrationElements } from "./celebration-elements"
import Image from "next/image"

const STARS_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBayLiveApp_Stars_DW_CC_v007_CC%202-OGJYd3jy5o3bamd4lN3498JekCYscy.png"
const FIRE_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBay_Live_Emoji_a_v008_Fire.0072%202-IVWHtqVd8MJLUNA3EfYsVshGT1EjUg.png"

const teams = [
  { name: "Chiefs", color: "#E31837", abbr: "KC" },
  { name: "Eagles", color: "#004C54", abbr: "PHI" },
  { name: "Cowboys", color: "#003594", abbr: "DAL" },
  { name: "49ers", color: "#AA0000", abbr: "SF" },
  { name: "Bills", color: "#00338D", abbr: "BUF" },
  { name: "Dolphins", color: "#008E97", abbr: "MIA" },
  { name: "Ravens", color: "#241773", abbr: "BAL" },
  { name: "Lions", color: "#0076B6", abbr: "DET" },
  { name: "Packers", color: "#203731", abbr: "GB" },
  { name: "Bengals", color: "#FB4F14", abbr: "CIN" },
  { name: "Jets", color: "#125740", abbr: "NYJ" },
  { name: "Broncos", color: "#FB4F14", abbr: "DEN" },
  { name: "Chargers", color: "#0080C6", abbr: "LAC" },
  { name: "Colts", color: "#002C5F", abbr: "IND" },
  { name: "Texans", color: "#03202F", abbr: "HOU" },
  { name: "Steelers", color: "#FFB612", abbr: "PIT" },
]

interface Team {
  name: string
  color: string
  secondary?: string
}

interface SlotMachineRevealProps {
  isRevealing: boolean
  onComplete: () => void
  team?: Team | null
}

export function SlotMachineReveal({ isRevealing, onComplete, team: propTeam }: SlotMachineRevealProps) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "slowing" | "landed" | "explode">("idle")
  const finalTeam = propTeam ? { ...propTeam, abbr: propTeam.name.slice(0, 3).toUpperCase() } : teams[0]
  const [spinOffset, setSpinOffset] = useState(0)
  const animationRef = useRef<number | null>(null)
  const speedRef = useRef(0)

  const repeatedTeams = [...teams, ...teams, ...teams, ...teams, ...teams]
  const itemHeight = 64

  useEffect(() => {
    if (isRevealing) {
      setPhase("spinning")
      setSpinOffset(0)
      speedRef.current = 50

      let lastTime = performance.now()
      
      const animate = (currentTime: number) => {
        const delta = (currentTime - lastTime) / 16.67
        lastTime = currentTime

        setSpinOffset(prev => {
          const newOffset = prev + speedRef.current * delta
          if (newOffset > teams.length * itemHeight) {
            return newOffset - teams.length * itemHeight
          }
          return newOffset
        })

        animationRef.current = requestAnimationFrame(animate)
      }

      animationRef.current = requestAnimationFrame(animate)

      const slowTimer = setTimeout(() => {
        setPhase("slowing")
        
        const slowDown = () => {
          speedRef.current *= 0.94
          
          if (speedRef.current > 2) {
            setTimeout(slowDown, 30)
          } else {
            speedRef.current = 0
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current)
            }
            
            const targetOffset = 0 * itemHeight
            setSpinOffset(targetOffset)
            setPhase("landed")
            
            setTimeout(() => {
              setPhase("explode")
            }, 300)
          }
        }
        slowDown()
      }, 1500)

      const completeTimer = setTimeout(() => {
        onComplete()
      }, 4500)

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        clearTimeout(slowTimer)
        clearTimeout(completeTimer)
      }
    }
  }, [isRevealing, onComplete])

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Screen flash on landing */}
      <AnimatePresence>
        {phase === "landed" && (
          <motion.div
            className="fixed inset-0 bg-violet-200 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Main container with shake effect */}
      <motion.div
        className="relative w-80"
        animate={
          phase === "landed" 
            ? { x: [0, -10, 10, -8, 8, -5, 5, -2, 2, 0], y: [0, -5, 5, -4, 4, -2, 2, -1, 1, 0] }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        {/* Celebration elements on win */}
        {phase === "explode" && (
          <CelebrationElements show={true} teamColor={finalTeam.color} />
        )}

        {/* Premium slot machine frame */}
        <div 
          className="relative rounded-3xl border-4 overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #1f1f2e 0%, #13131a 100%)",
            borderColor: phase === "explode" ? "#a78bfa" : "#3f3f5a",
            boxShadow: phase === "explode" 
              ? "0 0 60px rgba(167,139,250,0.5), 0 0 120px rgba(167,139,250,0.2)"
              : "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Top chrome bar with holographic finish */}
          <div 
            className="h-14 flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)",
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(
                  90deg,
                  transparent 20%,
                  rgba(255,255,255,0.4) 50%,
                  transparent 80%
                )`,
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
            />
            <span className="text-white font-black text-lg tracking-wider drop-shadow-lg relative z-10">
              YOUR TEAM
            </span>
          </div>

          {/* Viewing window */}
          <div className="relative h-24 mx-5 my-5 bg-zinc-950 rounded-xl overflow-hidden border-2 border-violet-500/30">
            {/* Scrolling reel */}
            <div 
              className="absolute inset-x-0"
              style={{ 
                transform: `translateY(${-spinOffset + itemHeight/4}px)`,
              }}
            >
              {repeatedTeams.map((team, index) => (
                <div
                  key={`${team.abbr}-${index}`}
                  className="h-16 flex items-center justify-center gap-4 px-5"
                  style={{ height: itemHeight }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg relative"
                    style={{ 
                      backgroundColor: team.color,
                      boxShadow: `0 4px 12px ${team.color}60`,
                    }}
                  >
                    {team.abbr}
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
                      }}
                    />
                  </div>
                  <span className="font-bold text-white text-2xl flex-1">
                    {team.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Center selection highlight */}
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-16 border-y-2"
                style={{ borderColor: "#a78bfa" }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950" />
            </div>

            {/* Glow effect on landing */}
            <AnimatePresence>
              {(phase === "landed" || phase === "explode") && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 0.5, 0.2, 0.5, 0.2],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ 
                    backgroundColor: finalTeam.color,
                    boxShadow: `inset 0 0 40px ${finalTeam.color}`,
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Side lights with holographic colors */}
          <div className="absolute top-16 bottom-20 left-2 flex flex-col justify-around">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`left-${i}`}
                className="w-2 h-2 rounded-full"
                animate={{
                  backgroundColor: phase === "spinning" || phase === "slowing"
                    ? ["#a78bfa", "#c4b5fd", "#e9d5ff", "#a78bfa"]
                    : phase === "landed" || phase === "explode" ? "#22c55e" : "#6b7280",
scale: phase === "explode" ? 1.3 : 1,
                  boxShadow: phase === "explode"
                    ? "0 0 16px #22c55e"
                    : "none",
                }}
                transition={{ 
                  duration: phase === "spinning" ? 0.2 : 0.5,
                  repeat: phase === "spinning" || phase === "slowing" || phase === "explode" ? Infinity : 0,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <div className="absolute top-16 bottom-20 right-2 flex flex-col justify-around">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`right-${i}`}
                className="w-2 h-2 rounded-full"
                animate={{
                  backgroundColor: phase === "spinning" || phase === "slowing"
                    ? ["#e9d5ff", "#a78bfa", "#c4b5fd", "#e9d5ff"]
                    : phase === "landed" || phase === "explode" ? "#22c55e" : "#6b7280",
                  scale: phase === "explode" ? 1.3 : 1,
                }}
                transition={{ 
                  duration: phase === "spinning" ? 0.2 : 0.5,
                  repeat: phase === "spinning" || phase === "slowing" ? Infinity : 0,
                  delay: i * 0.05,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Bottom area with result */}
          <div className="h-20 flex items-center justify-center relative">
            <AnimatePresence>
              {phase === "explode" && (
                <motion.div
                  className="px-8 py-3 rounded-full font-black text-white text-xl flex items-center gap-3"
                  style={{ 
                    backgroundColor: finalTeam.color,
                    boxShadow: `0 8px 32px ${finalTeam.color}60`,
                  }}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ 
                    scale: 1,
                    rotate: 0,
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400,
                    damping: 12,
                    mass: 1.2,
                  }}
                >
                  <span>{finalTeam.name.toUpperCase()}!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pulsing glow behind machine on win */}
        <AnimatePresence>
          {phase === "explode" && (
            <motion.div
              className="absolute inset-0 -z-10 rounded-3xl"
              style={{ 
                background: `linear-gradient(135deg, ${finalTeam.color}, #a78bfa)`,
              }}
              initial={{ opacity: 0, scale: 1 }}
animate={{
                opacity: 0.4,
                scale: 1.1,
              }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Explosive celebration */}
      <AnimatePresence>
        {phase === "explode" && (
          <>
            {/* Floating stars burst */}
            {[...Array(6)].map((_, i) => {
              const angle = (i / 6) * Math.PI * 2
              const distance = 120 + Math.random() * 80
              const x = Math.cos(angle) * distance
              const y = Math.sin(angle) * distance
              
              return (
                <motion.div
                  key={`star-${i}`}
                  className="absolute w-8 h-8 z-30"
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    x: x,
                    y: y,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.2, 1, 0.5],
                    rotate: Math.random() * 360,
                  }}
                  transition={{ 
                    duration: 1.5,
                    ease: "easeOut",
                    delay: i * 0.08,
                  }}
                >
                  <Image src={STARS_URL} alt="" fill className="object-contain" />
                </motion.div>
              )
            })}
            
            {/* Fire icons burst */}
            {[...Array(4)].map((_, i) => {
              const angle = ((i + 0.5) / 4) * Math.PI * 2
              const distance = 100 + Math.random() * 60
              const x = Math.cos(angle) * distance
              const y = Math.sin(angle) * distance
              
              return (
                <motion.div
                  key={`fire-${i}`}
                  className="absolute w-10 h-10 z-30"
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    x: x,
                    y: y,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.3, 1, 0.5],
                  }}
                  transition={{ 
                    duration: 1.3,
                    ease: "easeOut",
                    delay: 0.1 + i * 0.1,
                  }}
                >
                  <Image src={FIRE_URL} alt="" fill className="object-contain" />
                </motion.div>
              )
            })}

            {/* Holographic confetti */}
            {[...Array(40)].map((_, i) => {
              const angle = (i / 40) * Math.PI * 2
              const distance = 150 + Math.random() * 150
              const x = Math.cos(angle) * distance
              const y = Math.sin(angle) * distance
              
              return (
                <motion.div
                  key={`burst-${i}`}
                  className="absolute w-3 h-3 z-20"
                  style={{
                    backgroundColor: [finalTeam.color, "#a78bfa", "#c4b5fd", "#FFD700"][i % 4],
                    borderRadius: i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0",
                    boxShadow: `0 0 6px ${["#a78bfa", "#c4b5fd", finalTeam.color][i % 3]}`,
                    left: "50%",
                    top: "50%",
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{
                    x: x,
                    y: y,
                    opacity: [1, 1, 0],
                    scale: [0, 1.5, 0.5],
                    rotate: Math.random() * 720,
                  }}
                  transition={{ 
                    duration: 1.2,
                    ease: "easeOut",
                    delay: i * 0.01,
                  }}
                />
              )
            })}

            {/* Ring burst effects */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 z-0"
              style={{ borderColor: "#a78bfa" }}
              initial={{ width: 0, height: 0, opacity: 1 }}
              animate={{ width: 450, height: 450, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 z-0"
              style={{ borderColor: finalTeam.color }}
              initial={{ width: 0, height: 0, opacity: 1 }}
              animate={{ width: 350, height: 350, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
