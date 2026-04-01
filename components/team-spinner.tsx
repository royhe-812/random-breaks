"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"

const teams = [
  { name: "Chiefs", color: "#E31837", secondary: "#FFB81C" },
  { name: "Eagles", color: "#004C54", secondary: "#A5ACAF" },
  { name: "Cowboys", color: "#003594", secondary: "#869397" },
  { name: "49ers", color: "#AA0000", secondary: "#B3995D" },
  { name: "Bills", color: "#00338D", secondary: "#C60C30" },
  { name: "Dolphins", color: "#008E97", secondary: "#FC4C02" },
  { name: "Ravens", color: "#241773", secondary: "#9E7C0C" },
  { name: "Lions", color: "#0076B6", secondary: "#B0B7BC" },
  { name: "Packers", color: "#203731", secondary: "#FFB612" },
  { name: "Bengals", color: "#FB4F14", secondary: "#000000" },
  { name: "Jets", color: "#125740", secondary: "#000000" },
  { name: "Broncos", color: "#FB4F14", secondary: "#002244" },
  { name: "Chargers", color: "#0080C6", secondary: "#FFC20E" },
  { name: "Colts", color: "#002C5F", secondary: "#A2AAAD" },
  { name: "Texans", color: "#03202F", secondary: "#A71930" },
  { name: "Steelers", color: "#FFB612", secondary: "#101820" },
]

interface TeamSpinnerProps {
  totalSpots: number
  availableSpots: number
  onSpinComplete: () => void
  isSpinning: boolean
  onStartSpin: () => void
}

export function TeamSpinner({ 
  totalSpots, 
  availableSpots, 
  onSpinComplete, 
  isSpinning, 
  onStartSpin 
}: TeamSpinnerProps) {
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const [spinPhase, setSpinPhase] = useState<"idle" | "fast" | "slowing" | "stopped">("idle")
  const [spinSpeed, setSpinSpeed] = useState(50)

  const startSpin = useCallback(() => {
    setSpinPhase("fast")
    setSpinSpeed(50)
    onStartSpin()
  }, [onStartSpin])

  useEffect(() => {
    if (spinPhase === "idle" || spinPhase === "stopped") return

    const interval = setInterval(() => {
      setCurrentTeamIndex(prev => (prev + 1) % teams.length)
    }, spinSpeed)

    return () => clearInterval(interval)
  }, [spinPhase, spinSpeed])

  useEffect(() => {
    if (spinPhase === "fast") {
      // Fast phase for 1.5 seconds
      const timer = setTimeout(() => {
        setSpinPhase("slowing")
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [spinPhase])

  useEffect(() => {
    if (spinPhase === "slowing") {
      // Gradually slow down
      const slowdownInterval = setInterval(() => {
        setSpinSpeed(prev => {
          const newSpeed = prev + 30
          if (newSpeed >= 400) {
            clearInterval(slowdownInterval)
            setSpinPhase("stopped")
            // Trigger winning moment after a brief pause
            setTimeout(() => {
              onSpinComplete()
            }, 500)
            return 400
          }
          return newSpeed
        })
      }, 200)
      return () => clearInterval(slowdownInterval)
    }
  }, [spinPhase, onSpinComplete])

  const currentTeam = teams[currentTeamIndex]

  return (
    <div className="w-full">
      {/* Main Container */}
      <motion.div 
        className="relative bg-zinc-900/90 backdrop-blur rounded-xl overflow-hidden"
        animate={{
          boxShadow: spinPhase !== "idle" 
            ? `0 0 20px ${currentTeam.color}40, 0 0 40px ${currentTeam.color}20`
            : "none"
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Header Row - Spots Available */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-white/70 text-sm">
            {availableSpots}/{totalSpots} spots available
          </span>
          <button className="flex items-center gap-1 text-white font-medium text-sm">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Team Display Row */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Team Color Indicator */}
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg"
                style={{ backgroundColor: currentTeam.color }}
                animate={{
                  scale: 1,
                }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
              >
                {currentTeam.name.slice(0, 2).toUpperCase()}
              </motion.div>

              {/* Team Name */}
              <div className="flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentTeam.name}
                    className="text-white font-semibold text-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: spinPhase === "fast" ? 0.05 : 0.15 }}
                  >
                    {currentTeam.name}
                  </motion.span>
                </AnimatePresence>
                <span className="text-white/50 text-xs">
                  {spinPhase === "idle" ? "Tap to spin" : 
                   spinPhase === "stopped" ? "Selected!" : "Spinning..."}
                </span>
              </div>
            </div>

            {/* Spin Button / Status */}
            {spinPhase === "idle" ? (
              <motion.button
                onClick={startSpin}
                className="px-5 py-2.5 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold text-sm transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Spin
              </motion.button>
            ) : (
              <motion.div
                className="px-4 py-2 rounded-xl font-medium text-sm"
                style={{ 
                  backgroundColor: spinPhase === "stopped" ? currentTeam.color : "rgba(255,255,255,0.1)",
                  color: "white"
                }}
                animate={{
                  scale: 1,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {spinPhase === "stopped" ? "Winner!" : "..."}
              </motion.div>
            )}
          </div>

          {/* Progress Bar */}
          {spinPhase !== "idle" && (
            <motion.div
              className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: currentTeam.color }}
                initial={{ width: "0%" }}
                animate={{ 
                  width: spinPhase === "stopped" ? "100%" : 
                         spinPhase === "slowing" ? "70%" : "30%"
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </motion.div>
          )}
        </div>

        {/* Spinning Indicator Dots */}
        {spinPhase !== "idle" && spinPhase !== "stopped" && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export { teams }
