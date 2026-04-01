"use client"

import { useState, useCallback } from "react"
import { CardFlipReveal } from "@/components/animations/card-flip-reveal"
import { PackRipReveal } from "@/components/animations/pack-rip-reveal"
import { SlotMachineReveal } from "@/components/animations/slot-machine-reveal"
import { MysteryBoxReveal } from "@/components/animations/mystery-box-reveal"
import { ParticleAssemblyReveal } from "@/components/animations/particle-assembly-reveal"
import { SealBreakReveal } from "@/components/animations/seal-break-reveal"
import { Button } from "@/components/ui/button"

type AnimationType = "card-flip" | "pack-rip" | "slot-machine" | "mystery-box" | "particle-assembly" | "seal-break"

const animations: { id: AnimationType; name: string; description: string }[] = [
  {
    id: "card-flip",
    name: "Card Flip Reveal",
    description: "Classic trading card flip with holographic shine effect",
  },
  {
    id: "pack-rip",
    name: "Pack Rip",
    description: "Foil pack tears open revealing the card inside",
  },
  {
    id: "slot-machine",
    name: "Slot Machine",
    description: "Teams spin like a slot machine before locking in",
  },
  {
    id: "mystery-box",
    name: "Mystery Box Burst",
    description: "Shaking box glows and explodes to reveal team",
  },
  {
    id: "particle-assembly",
    name: "Particle Assembly",
    description: "Light particles swirl and form the team logo",
  },
  {
    id: "seal-break",
    name: "Wax Seal Break",
    description: "Premium wax seal heats, cracks, and breaks apart",
  },
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
    setIsRevealing(false)
  }, [])

  const renderAnimation = () => {
    const props = { isRevealing, onComplete: handleComplete, key }
    
    switch (selectedAnimation) {
      case "card-flip":
        return <CardFlipReveal {...props} />
      case "pack-rip":
        return <PackRipReveal {...props} />
      case "slot-machine":
        return <SlotMachineReveal {...props} />
      case "mystery-box":
        return <MysteryBoxReveal {...props} />
      case "particle-assembly":
        return <ParticleAssemblyReveal {...props} />
      case "seal-break":
        return <SealBreakReveal {...props} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-bold text-lg">
              EB
            </div>
            <div>
              <h1 className="font-bold text-lg">Case Break Animations</h1>
              <p className="text-zinc-400 text-sm">Winning Moment Prototypes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Animation Preview Area */}
          <div className="order-2 lg:order-1">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              {/* Preview Header */}
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg">
                    {animations.find(a => a.id === selectedAnimation)?.name}
                  </h2>
                  <p className="text-zinc-400 text-sm">
                    {animations.find(a => a.id === selectedAnimation)?.description}
                  </p>
                </div>
                <Button
                  onClick={handleReveal}
                  disabled={isRevealing}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
                >
                  {isRevealing ? "Revealing..." : "Reveal Team"}
                </Button>
              </div>

              {/* Animation Container */}
              <div className="relative min-h-[500px] flex items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950">
                {/* Background pattern */}
                <div 
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: "40px 40px",
                  }}
                />
                
                {/* Animation */}
                <div className="relative z-10">
                  {renderAnimation()}
                </div>

                {/* Click to reveal hint */}
                {!isRevealing && (
                  <div className="absolute bottom-6 left-0 right-0 text-center">
                    <p className="text-zinc-500 text-sm">
                      Click &quot;Reveal Team&quot; to see the animation
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Context Preview - Mocked eBay Interface */}
            <div className="mt-6 bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
              <h3 className="font-semibold mb-4">In-Context Preview</h3>
              <div className="bg-black rounded-xl p-4 max-w-sm mx-auto">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-700" />
                  <span className="text-sm font-medium">ryans_cardhouse</span>
                </div>
                <div className="aspect-[4/3] bg-zinc-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  <div className="scale-50 transform">
                    {renderAnimation()}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Random Team Break</span>
                  <span className="text-green-500 font-semibold">LIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Animation Selector */}
          <div className="order-1 lg:order-2">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 sticky top-24">
              <h2 className="font-semibold text-lg mb-4">Animation Styles</h2>
              <div className="space-y-3">
                {animations.map((animation) => (
                  <button
                    key={animation.id}
                    onClick={() => {
                      setSelectedAnimation(animation.id)
                      setIsRevealing(false)
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedAnimation === animation.id
                        ? "bg-green-600/10 border-green-600 text-white"
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <div className="font-medium mb-1">{animation.name}</div>
                    <div className="text-sm text-zinc-400">{animation.description}</div>
                  </button>
                ))}
              </div>

              {/* Notes */}
              <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                <h3 className="font-medium text-sm mb-2 text-amber-400">Implementation Notes</h3>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>All animations use Framer Motion</li>
                  <li>Team colors dynamically adapt</li>
                  <li>Sound effects can be added via Web Audio API</li>
                  <li>Each animation is ~2-3 seconds</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
