"use client"

import { useState, useRef } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { Check, ChevronsRight } from "lucide-react"

interface SwipeToBidProps {
  amount: number
  onBidConfirmed: () => void
  isWinning?: boolean
  disabled?: boolean
}

export function SwipeToBid({ amount, onBidConfirmed, isWinning = false, disabled = false }: SwipeToBidProps) {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  
  // Calculate the swipe threshold (how far user needs to swipe to confirm)
  const swipeThreshold = 120
  
  // Transform x position to opacity/scale for the checkmark
  const checkmarkOpacity = useTransform(x, [0, swipeThreshold * 0.5, swipeThreshold], [0, 0.5, 1])
  const checkmarkScale = useTransform(x, [0, swipeThreshold], [0.5, 1])
  
  // Transform for chevrons - fade out as user swipes
  const chevronsOpacity = useTransform(x, [0, swipeThreshold * 0.5], [1, 0])
  
  // Background fill effect
  const backgroundWidth = useTransform(x, [0, swipeThreshold], ["0%", "100%"])

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

  // Winning state
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

  // Confirmed state (brief moment before transitioning)
  if (isConfirmed) {
    return (
      <div className="relative h-11 rounded-full bg-green-500 flex items-center justify-center overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
          <span className="text-black font-semibold text-sm">Bid ${amount}</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={constraintsRef}
      className="relative h-11 rounded-full bg-green-500 flex items-center overflow-hidden touch-none"
    >
      {/* Background fill effect on swipe */}
      <motion.div 
        className="absolute inset-0 bg-green-400"
        style={{ width: backgroundWidth }}
      />
      
      {/* Checkmark that appears on swipe */}
      <motion.div 
        className="absolute left-3 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center z-10"
        style={{ opacity: checkmarkOpacity, scale: checkmarkScale }}
      >
        <Check className="w-4 h-4 text-white" strokeWidth={3} />
      </motion.div>
      
      {/* Text content */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <span className="text-black font-semibold text-sm">Bid ${amount}</span>
      </div>
      
      {/* Chevrons that fade on swipe */}
      <motion.div 
        className="absolute right-3 flex items-center z-10"
        style={{ opacity: chevronsOpacity }}
      >
        <ChevronsRight className="w-5 h-5 text-black/60" />
      </motion.div>
      
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
