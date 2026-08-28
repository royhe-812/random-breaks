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

/* Bid CTA palette. Every live state of this button — idle, confirmed and
   winning — is blue; only `soldout` keeps its own grey, since it's a disabled
   state rather than a bid state. Note that green is still the success colour
   elsewhere on the bid card (the "… is winning" text), so the button no longer
   colour-matches that copy. Values are literal brand hex rather than theme
   tokens, so they're named once here instead of repeated across the states. */
const BID_BLUE = "#4D93FC"

/* All ink on the blue pill is this one hue at three strengths, which preserves
   the existing hierarchy: the amount leads, the checkmark sits under it, and the
   chevrons stay hint-level. Written as rgba (25,25,25 === #191919) because the
   checkmark and chevrons need partial alpha to keep that ranking. */
const BID_INK = "#191919"
const BID_INK_70 = "rgba(25, 25, 25, 0.7)"
const BID_INK_50 = "rgba(25, 25, 25, 0.5)"

export function SwipeToBid({ amount, onBidConfirmed, onReset, isWinning = false, disabled = false }: SwipeToBidProps) {
  const [buttonState, setButtonState] = useState<ButtonState>("idle")
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  
  // Swipe threshold
  const swipeThreshold = 120
  
  // Transform for the pill fill that extends as user swipes - starts at 75%
  const pillFillWidth = useTransform(x, [0, swipeThreshold], ["75%", "100%"])
  
  // Transform for checkmark sliding in
  const checkmarkX = useTransform(x, [0, swipeThreshold], [-30, 12])
  const checkmarkOpacity = useTransform(x, [0, 30, swipeThreshold], [0, 0.5, 1])

  const runConfirm = () => {
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
  }

  const handleDragEnd = () => {
    const currentX = x.get()

    if (currentX >= swipeThreshold * 0.8) {
      runConfirm()
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
        style={{ border: "1px solid #8F8F8F" }}
        onClick={handleReset}
      >
        <div 
          className="h-full w-full rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: '#8F8F8F' }}
        >
          <span className="text-black font-semibold text-sm">Sold out</span>
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
        <div className="h-full w-full rounded-full flex items-center justify-center" style={{ backgroundColor: BID_BLUE }}>
          <span className="font-semibold text-sm" style={{ color: BID_INK }}>Winning</span>
        </div>
      </div>
    )
  }

  // Confirmed state - blue pill with a filled (knocked-out) checkmark
  if (buttonState === "confirmed") {
    return (
      <div 
        className="relative h-14 rounded-full p-1.5"
        style={{ border: "1px solid rgba(255, 255, 255, 0.3)" }}
      >
        <div className="h-full w-full rounded-full flex items-center overflow-hidden px-3" style={{ backgroundColor: BID_BLUE }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BID_INK_70 }}>
            {/* Knocked out of the ink disc, so this tick is the pill colour
                rather than ink — it tracks BID_BLUE, not the ink ramp. */}
            <Check className="w-4 h-4" strokeWidth={3} style={{ color: BID_BLUE }} />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="font-semibold text-sm" style={{ color: BID_INK }}>Bid ${amount}</span>
          </div>
          <div className="flex items-center flex-shrink-0">
            <ChevronRight className="w-5 h-5" strokeWidth={2.5} style={{ color: BID_INK_50 }} />
            <ChevronRight className="w-5 h-5 -ml-2.5" strokeWidth={2.5} style={{ color: BID_INK_50 }} />
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
          /* Track tint follows the pill, so no green haze is left showing in the
             sliver of track visible to the right of the blue pill. */
          background: "linear-gradient(90deg, rgba(77, 147, 252, 0.3) 0%, rgba(77, 147, 252, 0.15) 50%, rgba(77, 147, 252, 0.05) 100%)",
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
          background: "linear-gradient(90deg, transparent, rgba(77, 147, 252, 0.6), transparent)",
        }}
      />
      
      {/* Bid pill containing checkmark, text and chevrons */}
      <motion.div 
        className="absolute left-0 top-0 bottom-0 rounded-full flex items-center px-3 z-10"
        style={{ width: pillFillWidth, backgroundColor: BID_BLUE }}
      >
        {/* Checkmark that appears as user swipes - dark outline style */}
        <motion.div 
          className="w-7 h-7 rounded-full flex items-center justify-center border-2 flex-shrink-0"
          style={{ 
            opacity: checkmarkOpacity,
            borderColor: BID_INK_70,
          }}
        >
          <Check className="w-4 h-4" strokeWidth={3} style={{ color: BID_INK_70 }} />
        </motion.div>
        
        {/* Text centered in pill */}
        <div className="flex-1 flex items-center justify-center">
          <span className="font-semibold text-sm whitespace-nowrap" style={{ color: BID_INK }}>Bid ${amount}</span>
        </div>
        
        {/* Animated double chevrons inside the bid pill */}
        <motion.div
          className="flex items-center flex-shrink-0"
          animate={{ x: [0, 4, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <ChevronRight className="w-5 h-5" strokeWidth={2.5} style={{ color: BID_INK_50 }} />
          <ChevronRight className="w-5 h-5 -ml-2.5" strokeWidth={2.5} style={{ color: BID_INK_50 }} />
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
