"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { Check, ChevronRight } from "lucide-react"

interface SwipeToBidProps {
  amount: number
  onBidConfirmed: () => void
  onReset?: () => void
  isWinning?: boolean
  disabled?: boolean
}

type ButtonState = "idle" | "confirmed" | "winning" | "soldout"

export function SwipeToBid({ amount, onBidConfirmed, onReset, isWinning = false, disabled = false }: SwipeToBidProps) {
  const [buttonState, setButtonState] = useState<ButtonState>("idle")
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  
  // Swipe threshold
  const swipeThreshold = 120
  
  // Transform for the green fill that extends as user swipes - starts at 75%
  const greenFillWidth = useTransform(x, [0, swipeThreshold], ["75%", "100%"])
  
  // Transform for checkmark sliding in
  const checkmarkX = useTransform(x, [0, swipeThreshold], [-30, 12])
  const checkmarkOpacity = useTransform(x, [0, 30, swipeThreshold], [0, 0.5, 1])

  const handleDragEnd = () => {
    const currentX = x.get()
    
    if (currentX >= swipeThreshold * 0.8) {
      setButtonState("confirmed")
      animate(x, swipeThreshold, { duration: 0.2 })
      
      // After 1 second, transition to winning
      setTimeout(() => {
        setButtonState("winning")
        
        // After 1 second on winning, transition to sold out
        setTimeout(() => {
          setButtonState("soldout")
          
          // After sold out is shown, trigger the randomizer
          setTimeout(() => {
            onBidConfirmed()
          }, 300)
        }, 1000)
      }, 1000)
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 })
    }
  }

  // Sold out / Disabled state - check first so isWinning prop doesn't override
  if (buttonState === "soldout" || disabled) {
    const handleReset = () => {
      setButtonState("idle")
      x.set(0)
      onReset?.()
    }
    
    return (
      <div 
        className="relative h-14 rounded-full p-1.5 cursor-pointer"
        style={{ border: "1px solid rgba(113, 113, 122, 1)" }}
        onClick={handleReset}
      >
        <div className="h-full w-full rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition-colors">
          <span className="text-white/50 font-semibold text-sm">Sold out</span>
        </div>
      </div>
    )
  }

  // Winning state (internal or from prop)
  if (buttonState === "winning" || isWinning) {
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

  // Confirmed state - dark background with filled green checkmark
  if (buttonState === "confirmed") {
    return (
      <div 
        className="relative h-14 rounded-full p-1.5"
        style={{ border: "1px solid rgba(255, 255, 255, 0.3)" }}
      >
        <div className="h-full w-full rounded-full bg-green-400 flex items-center overflow-hidden px-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-black/70 flex-shrink-0">
            <Check className="w-4 h-4 text-green-400" strokeWidth={3} />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-black font-semibold text-sm">Bid ${amount}</span>
          </div>
          <div className="flex items-center flex-shrink-0">
            <ChevronRight className="w-5 h-5 text-black/50" strokeWidth={2.5} />
            <ChevronRight className="w-5 h-5 text-black/50 -ml-2.5" strokeWidth={2.5} />
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
      {/* Inner container */}
      <div 
        className="relative h-full w-full rounded-full overflow-hidden"
        style={{ 
          background: "linear-gradient(90deg, rgba(74, 222, 128, 0.3) 0%, rgba(74, 222, 128, 0.15) 50%, rgba(74, 222, 128, 0.05) 100%)",
        }}
      >
      
      {/* Sweeping shine effect - like card shine */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-0"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 1,
        }}
        style={{
          width: "50%",
          background: "linear-gradient(90deg, transparent, rgba(74, 222, 128, 0.6), transparent)",
        }}
      />
      
      {/* Green pill containing checkmark, text and chevrons */}
      <motion.div 
        className="absolute left-0 top-0 bottom-0 rounded-full bg-green-400 flex items-center px-3 z-10"
        style={{ width: greenFillWidth }}
      >
        {/* Checkmark that appears as user swipes - dark outline style */}
        <motion.div 
          className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-black/70 flex-shrink-0"
          style={{ 
            opacity: checkmarkOpacity,
          }}
        >
          <Check className="w-4 h-4 text-black/70" strokeWidth={3} />
        </motion.div>
        
        {/* Text centered in pill */}
        <div className="flex-1 flex items-center justify-center">
          <span className="text-black font-semibold text-sm whitespace-nowrap">Bid ${amount}</span>
        </div>
        
        {/* Animated double chevrons inside green pill */}
        <motion.div
          className="flex items-center flex-shrink-0"
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
