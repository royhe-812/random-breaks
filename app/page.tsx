"use client"

import { useState, useCallback } from "react"
import { CardFlipReveal } from "@/components/animations/card-flip-reveal"
import { PackRipReveal } from "@/components/animations/pack-rip-reveal"
import { SlotMachineReveal } from "@/components/animations/slot-machine-reveal"
import { MysteryBoxReveal } from "@/components/animations/mystery-box-reveal"
import { ParticleAssemblyReveal } from "@/components/animations/particle-assembly-reveal"
import { SealBreakReveal } from "@/components/animations/seal-break-reveal"
import { AnimatePresence, motion } from "framer-motion"

type AnimationType = "card-flip" | "pack-rip" | "slot-machine" | "mystery-box" | "particle-assembly" | "seal-break"

const animations: { id: AnimationType; name: string; description: string }[] = [
  { id: "card-flip", name: "Card Flip", description: "Classic trading card flip with holographic shine" },
  { id: "pack-rip", name: "Pack Rip", description: "Foil pack tears open revealing the card" },
  { id: "slot-machine", name: "Slot Machine", description: "Teams spin like slots before locking" },
  { id: "mystery-box", name: "Mystery Box", description: "Box glows and explodes to reveal team" },
  { id: "particle-assembly", name: "Particle Assembly", description: "Light particles form the team logo" },
  { id: "seal-break", name: "Seal Break", description: "Wax seal heats, cracks, and breaks" },
]

export default function AnimationShowcase() {
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>("card-flip")
  const [isRevealing, setIsRevealing] = useState(false)
  const [key, setKey] = useState(0)

  const handleReveal = useCallback(() => {
    setIsRevealing(true)
    setKey(prev => prev + 1)
  }, [])

  const handleComplete = useCallback(() => {
    setTimeout(() => {
      setIsRevealing(false)
    }, 1500)
  }, [])

  const renderAnimation = () => {
    const props = { isRevealing, onComplete: handleComplete }
    
    switch (selectedAnimation) {
      case "card-flip":
        return <CardFlipReveal key={key} {...props} />
      case "pack-rip":
        return <PackRipReveal key={key} {...props} />
      case "slot-machine":
        return <SlotMachineReveal key={key} {...props} />
      case "mystery-box":
        return <MysteryBoxReveal key={key} {...props} />
      case "particle-assembly":
        return <ParticleAssemblyReveal key={key} {...props} />
      case "seal-break":
        return <SealBreakReveal key={key} {...props} />
      default:
        return null
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-900">
      {/* Animation Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <AnimatePresence>
          {isRevealing && (
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              {/* Winner announcement */}
              <motion.div
                className="mb-6 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-green-400 text-sm font-medium uppercase tracking-wider mb-1">
                  You Won!
                </p>
                <p className="text-white/70 text-sm">Your team is...</p>
              </motion.div>

              {/* The animation component */}
              {renderAnimation()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trigger Button */}
      <div className="absolute bottom-8 left-4 right-4 z-30">
        <button
          onClick={handleReveal}
          disabled={isRevealing}
          className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-semibold rounded-xl transition-colors"
        >
          {isRevealing ? "Revealing..." : "Reveal Team"}
        </button>
      </div>

      {/* Animation Style Picker - Always Visible */}
      <motion.div
        className="absolute top-4 left-4 right-16 z-30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-white/70 text-xs font-medium uppercase tracking-wider">
              Animation Style
            </span>
            <span className="text-green-400 text-xs">
              Tap &quot;Bid&quot; to preview
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {animations.map((animation) => (
              <button
                key={animation.id}
                onClick={() => setSelectedAnimation(animation.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedAnimation === animation.id
                    ? "bg-green-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {animation.name}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

    </div>
  )
}
