"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const teams = [
  { name: "Chiefs", color: "#E31837", abbr: "KC" },
  { name: "Eagles", color: "#004C54", abbr: "PHI" },
  { name: "Cowboys", color: "#003594", abbr: "DAL" },
  { name: "49ers", color: "#AA0000", abbr: "SF" },
  { name: "Bills", color: "#00338D", abbr: "BUF" },
  { name: "Dolphins", color: "#008E97", abbr: "MIA" },
  { name: "Ravens", color: "#241773", abbr: "BAL" },
  { name: "Bengals", color: "#FB4F14", abbr: "CIN" },
]

interface SlotMachineRevealProps {
  isRevealing: boolean
  onComplete: () => void
}

export function SlotMachineReveal({ isRevealing, onComplete }: SlotMachineRevealProps) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "slowing" | "landed" | "explode">("idle")
  const finalTeam = teams[0] // Fixed team - Chiefs
  const [spinOffset, setSpinOffset] = useState(0)
  const animationRef = useRef<number | null>(null)
  const speedRef = useRef(0)

  // Create a repeated list for infinite scroll effect
  const repeatedTeams = [...teams, ...teams, ...teams, ...teams, ...teams]
  const itemHeight = 64

  useEffect(() => {
    if (isRevealing) {
      setPhase("spinning")
      setSpinOffset(0)
      speedRef.current = 50

      let lastTime = performance.now()
      
      const animate = (currentTime: number) => {
        const delta = (currentTime - lastTime) / 16.67 // normalize to ~60fps
        lastTime = currentTime

        setSpinOffset(prev => {
          const newOffset = prev + speedRef.current * delta
          // Reset when we've scrolled through one full set
          if (newOffset > teams.length * itemHeight) {
            return newOffset - teams.length * itemHeight
          }
          return newOffset
        })

        animationRef.current = requestAnimationFrame(animate)
      }

      animationRef.current = requestAnimationFrame(animate)

      // Start slowing down after 1.5s
      const slowTimer = setTimeout(() => {
        setPhase("slowing")
        
        // Gradually reduce speed
        const slowDown = () => {
          speedRef.current *= 0.94
          
          if (speedRef.current > 2) {
            setTimeout(slowDown, 30)
          } else {
            // Snap to final position
            speedRef.current = 0
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current)
            }
            
            // Calculate snap position to land on Chiefs (index 0)
            const targetOffset = 0 * itemHeight
            setSpinOffset(targetOffset)
            setPhase("landed")
            
            // Trigger explosion after a beat
            setTimeout(() => {
              setPhase("explode")
            }, 300)
          }
        }
        slowDown()
      }, 1500)

      const completeTimer = setTimeout(() => {
        onComplete()
      }, 4000)

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
            className="fixed inset-0 bg-white pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Main container with shake effect */}
      <motion.div
        className="relative w-72"
        animate={
          phase === "landed" 
            ? { x: [0, -8, 8, -6, 6, -4, 4, -2, 2, 0], y: [0, -4, 4, -3, 3, -2, 2, -1, 1, 0] }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        {/* Slot machine frame */}
        <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl border-4 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)] overflow-hidden">
          {/* Top chrome bar */}
          <div className="h-10 bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-zinc-900 font-black text-base tracking-wider">YOUR TEAM</span>
          </div>

          {/* Viewing window - single slot */}
          <div className="relative h-20 mx-4 my-4 bg-zinc-950 rounded-lg overflow-hidden border-2 border-zinc-700">
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
                  className="h-16 flex items-center justify-center gap-3 px-4"
                  style={{ height: itemHeight }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.abbr}
                  </div>
                  <span className="font-bold text-white text-xl flex-1">
                    {team.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Center selection highlight */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-16 border-y-2 border-amber-500" />
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950" />
            </div>

            {/* Glow effect on landing */}
            <AnimatePresence>
              {(phase === "landed" || phase === "explode") && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: [0, 0.6, 0.3, 0.6, 0.3],
                    boxShadow: [
                      `inset 0 0 20px ${finalTeam.color}`,
                      `inset 0 0 60px ${finalTeam.color}`,
                      `inset 0 0 30px ${finalTeam.color}`,
                      `inset 0 0 50px ${finalTeam.color}`,
                      `inset 0 0 25px ${finalTeam.color}`,
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ backgroundColor: finalTeam.color }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Side lights */}
          <div className="absolute top-12 bottom-4 left-1 flex flex-col justify-around">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`left-${i}`}
                className="w-2 h-2 rounded-full"
                animate={{
                  backgroundColor: phase === "spinning" || phase === "slowing"
                    ? ["#ef4444", "#22c55e", "#3b82f6", "#eab308"]
                    : phase === "landed" || phase === "explode" ? "#22c55e" : "#6b7280",
                  scale: phase === "explode" ? [1, 1.3, 1] : 1,
                }}
                transition={{ 
                  duration: phase === "spinning" ? 0.15 : phase === "slowing" ? 0.3 : 0.5,
                  repeat: phase === "spinning" || phase === "slowing" ? Infinity : phase === "explode" ? Infinity : 0,
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>
          <div className="absolute top-12 bottom-4 right-1 flex flex-col justify-around">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`right-${i}`}
                className="w-2 h-2 rounded-full"
                animate={{
                  backgroundColor: phase === "spinning" || phase === "slowing"
                    ? ["#eab308", "#3b82f6", "#22c55e", "#ef4444"]
                    : phase === "landed" || phase === "explode" ? "#22c55e" : "#6b7280",
                  scale: phase === "explode" ? [1, 1.3, 1] : 1,
                }}
                transition={{ 
                  duration: phase === "spinning" ? 0.15 : phase === "slowing" ? 0.3 : 0.5,
                  repeat: phase === "spinning" || phase === "slowing" ? Infinity : phase === "explode" ? Infinity : 0,
                  delay: i * 0.05,
                }}
              />
            ))}
          </div>

          {/* Bottom area with result */}
          <div className="h-16 flex items-center justify-center">
            <AnimatePresence>
              {phase === "explode" && (
                <motion.div
                  className="px-6 py-2 rounded-full font-black text-white text-lg"
                  style={{ backgroundColor: finalTeam.color }}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ 
                    scale: [0, 1.3, 1],
                    rotate: [-10, 5, 0],
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400,
                    damping: 15,
                  }}
                >
                  {finalTeam.name.toUpperCase()}!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pulsing glow behind machine on win */}
        <AnimatePresence>
          {phase === "explode" && (
            <motion.div
              className="absolute inset-0 -z-10 rounded-2xl"
              style={{ backgroundColor: finalTeam.color }}
              initial={{ opacity: 0, scale: 1 }}
              animate={{ 
                opacity: [0, 0.4, 0.2, 0.4, 0.2],
                scale: [1, 1.1, 1.05, 1.1, 1.05],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Explosive confetti burst */}
      <AnimatePresence>
        {phase === "explode" && (
          <>
            {/* Large burst particles */}
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
                    backgroundColor: [finalTeam.color, "#FFD700", "#FFFFFF", "#22c55e"][i % 4],
                    borderRadius: i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0",
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
            
            {/* Falling sparkles */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute w-2 h-2 z-10"
                style={{
                  backgroundColor: ["#FFD700", finalTeam.color, "#FFFFFF"][i % 3],
                  borderRadius: "50%",
                  left: `${20 + Math.random() * 60}%`,
                  top: "-20px",
                }}
                initial={{ y: 0, opacity: 1, scale: 0 }}
                animate={{
                  y: 400 + Math.random() * 200,
                  x: (Math.random() - 0.5) * 100,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.5],
                  rotate: Math.random() * 360,
                }}
                transition={{ 
                  duration: 2 + Math.random(),
                  ease: "easeIn",
                  delay: 0.2 + i * 0.03,
                }}
              />
            ))}

            {/* Ring burst effect */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 z-0"
              style={{ borderColor: finalTeam.color }}
              initial={{ width: 0, height: 0, opacity: 1 }}
              animate={{ width: 400, height: 400, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 z-0"
              style={{ borderColor: "#FFD700" }}
              initial={{ width: 0, height: 0, opacity: 1 }}
              animate={{ width: 300, height: 300, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
