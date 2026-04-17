"use client"

import { useState, useRef } from "react"
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
  
  // Calculate the swipe threshold (how far user needs to swipe to confirm)
  const swipeThreshold = 100
  
  // Transform x position - checkmark slides in from left (starts off-screen at -28px)
  const checkmarkX = useTransform(x, [0, swipeThreshold], [-28, 8])
  const checkmarkOpacity = useTransform(x, [0, 20, swipeThreshold], [0, 0.8, 1])

  const handleDragEnd = () => {
    const currentX = x.get()
    
    if (currentX >= swipeThreshold) {
      // Confirm the bid
      setIsConfirmed(true)
      animate(x, swipeThreshold, { duration: 0.2 })
      
      // Trigger the callback after a short delay
      setTimeout(() => {
        onBidConfirmed()
      }, 300)
    } else {
      // Reset position
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 })
    }
  }

  // Winning state - solid green with centered "Winning" text
  if (isWinning) {
    return (
      <div className="relative h-11 rounded-full bg-green-500 flex items-center justify-center overflow-hidden">
        <span className="text-black font-semibold text-sm">Winning</span>
      </div>
    )
  }

  // Disabled/Sold out state
  if (disabled) {
    return (
      <div className="relative h-11 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden cursor-not-allowed">
        <span className="text-white/50 font-semibold text-sm">Sold out</span>
      </div>
    )
  }

  // Confirmed state - checkmark visible, text centered
  if (isConfirmed) {
    return (
      <div className="relative h-11 rounded-full bg-green-500 flex items-center overflow-hidden px-3">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center border border-black/20">
          <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-black font-semibold text-sm">Bid ${amount}</span>
        </div>
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4 text-black/40" strokeWidth={2.5} />
          <ChevronRight className="w-4 h-4 text-black/40 -ml-2" strokeWidth={2.5} />
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-11 rounded-full bg-green-500 flex items-center overflow-hidden touch-none"
    >
      {/* Checkmark that slides in from left as user swipes */}
      <motion.div 
        className="absolute w-6 h-6 rounded-full bg-white/20 flex items-center justify-center border border-black/20 z-10"
        style={{ 
          x: checkmarkX,
          opacity: checkmarkOpacity,
        }}
      >
        <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
      </motion.div>
      
      {/* Text - slightly left of center in default, moves with swipe */}
      <div className="flex-1 flex items-center pl-4 relative z-10">
        <span className="text-black font-semibold text-sm">Bid ${amount}</span>
      </div>
      
      {/* Double chevrons on right */}
      <div className="flex items-center pr-3 z-10">
        <ChevronRight className="w-4 h-4 text-black/40" strokeWidth={2.5} />
        <ChevronRight className="w-4 h-4 text-black/40 -ml-2" strokeWidth={2.5} />
      </div>
      
      {/* Draggable overlay - invisible but captures swipe */}
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-20"
        drag="x"
        dragConstraints={{ left: 0, right: swipeThreshold }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
      />
    </div>
  )
}
