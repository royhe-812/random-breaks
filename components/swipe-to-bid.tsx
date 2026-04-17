"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { Check, ChevronRight } from "lucide-react"

interface SwipeToBidProps {
  amount: number
  onBidConfirmed: () => void
  isWinning?: boolean
  disabled?: boolean
}

export function SwipeToBid({ amount, onBidConfirmed, isWinning = false, disabled = false }: SwipeToBidProps) {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  
  // Swipe threshold
  const swipeThreshold = 120
  
  // Transform for the green fill that extends as user swipes
  const greenFillWidth = useTransform(x, [0, swipeThreshold], ["55%", "100%"])
  
  // Transform for checkmark sliding in
  const checkmarkX = useTransform(x, [0, swipeThreshold], [-30, 12])
  const checkmarkOpacity = useTransform(x, [0, 30, swipeThreshold], [0, 0.5, 1])

  const handleDragEnd = () => {
    const currentX = x.get()
    
    if (currentX >= swipeThreshold * 0.8) {
      setIsConfirmed(true)
      animate(x, swipeThreshold, { duration: 0.2 })
      setTimeout(() => {
        onBidConfirmed()
      }, 300)
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 })
    }
  }

  // Winning state
  if (isWinning) {
    return (
      <div 
        className="relative h-14 rounded-full p-1.5"
        style={{ border: "1px solid rgba(255, 255, 255, 0.3)" }}
      >
        <div className="h-full w-full rounded-full bg-green-400 flex items-center justify-center">
          <span className="text-black font-semibold text-sm">Winning</span>
        </div>
      </div>
    )
  }

  // Disabled state
  if (disabled) {
    return (
      <div 
        className="relative h-14 rounded-full p-1.5 cursor-not-allowed"
        style={{ border: "1px solid rgba(255, 255, 255, 0.2)" }}
      >
        <div className="h-full w-full rounded-full bg-zinc-700 flex items-center justify-center">
          <span className="text-white/50 font-semibold text-sm">Sold out</span>
        </div>
      </div>
    )
  }

  // Confirmed state
  if (isConfirmed) {
    return (
      <div 
        className="relative h-14 rounded-full p-1.5"
        style={{ border: "1px solid rgba(255, 255, 255, 0.3)" }}
      >
        <div className="h-full w-full rounded-full bg-green-400 flex items-center overflow-hidden px-3">
          <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center border border-green-600/30">
            <Check className="w-4 h-4 text-green-800" strokeWidth={3} />
          </div>
          <div className="flex-1 flex items-center justify-center -ml-4">
            <span className="text-black font-semibold text-sm">Bid ${amount}</span>
          </div>
          <div className="flex items-center">
            <ChevronRight className="w-5 h-5 text-green-800/60" strokeWidth={2.5} />
            <ChevronRight className="w-5 h-5 text-green-800/60 -ml-2.5" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-14 rounded-full touch-none p-1.5"
      style={{ 
        background: "transparent",
        border: "1px solid rgba(255, 255, 255, 0.3)",
      }}
    >
      {/* Inner container with gradient background */}
      <div 
        className="relative h-full w-full rounded-full overflow-hidden"
        style={{ 
          background: "linear-gradient(90deg, rgba(74, 222, 128, 0.08) 0%, transparent 100%)",
        }}
      >
      {/* Animated sweeping gradient glow that extends beyond the pill */}
      <motion.div 
        className="absolute inset-0 pointer-events-none rounded-full"
        animate={{
          boxShadow: [
            "inset 60px 0 30px -20px rgba(74, 222, 128, 0.2)",
            "inset 200px 0 40px -20px rgba(74, 222, 128, 0.15)",
            "inset 60px 0 30px -20px rgba(74, 222, 128, 0.2)",
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Green pill containing text and chevrons */}
      <motion.div 
        className="absolute left-0 top-0 bottom-0 rounded-full bg-green-400 flex items-center justify-between px-4"
        style={{ width: greenFillWidth }}
      >
        {/* Text inside green pill */}
        <span className="text-black font-semibold text-sm whitespace-nowrap">Bid ${amount}</span>
        
        {/* Animated double chevrons inside green pill */}
        <motion.div
          className="flex items-center ml-4"
          animate={{ x: [0, 4, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ChevronRight className="w-5 h-5 text-black/50" strokeWidth={2.5} />
          <ChevronRight className="w-5 h-5 text-black/50 -ml-2.5" strokeWidth={2.5} />
        </motion.div>
      </motion.div>
      
      {/* Checkmark that slides in from left */}
      <motion.div 
        className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/30 flex items-center justify-center border border-green-600/30 z-10"
        style={{ 
          x: checkmarkX,
          opacity: checkmarkOpacity,
        }}
      >
        <Check className="w-4 h-4 text-green-800" strokeWidth={3} />
      </motion.div>
      
      {/* Invisible draggable overlay */}
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-20"
        drag="x"
        dragConstraints={{ left: 0, right: swipeThreshold }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
      />
      </div>
    </div>
  )
}
