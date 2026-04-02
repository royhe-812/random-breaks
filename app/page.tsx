"use client"

// eBay Live - v13
import React, { useState, useCallback, useEffect } from "react"
// useEffect and Star are imported above
import { CardFlipReveal } from "@/components/animations/card-flip-reveal"
import { PackRipReveal } from "@/components/animations/pack-rip-reveal"
import { SlotMachineReveal } from "@/components/animations/slot-machine-reveal"
import { MysteryBoxReveal } from "@/components/animations/mystery-box-reveal"
import { ParticleAssemblyReveal } from "@/components/animations/particle-assembly-reveal"
import { GiftBoxReveal } from "@/components/animations/gift-box-reveal"
import { BattleReveal } from "@/components/animations/battle-reveal"
import { PickCardReveal } from "@/components/animations/pick-card-reveal"
import { TeamSpinner, type Team } from "@/components/team-spinner"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Heart, MoreHorizontal, Wallet, LayoutGrid, ChevronRight, Star, ChevronsRight } from "lucide-react"

type AnimationType = "card-flip" | "pack-rip" | "slot-machine" | "mystery-box" | "particle-assembly" | "gift-box" | "battle" | "pick-card"

const animations: { id: AnimationType; name: string }[] = [
  { id: "card-flip", name: "Card Flip" },
  { id: "pack-rip", name: "Pack Rip" },
  { id: "slot-machine", name: "Slot Machine" },
  { id: "mystery-box", name: "Mystery Box" },
  { id: "particle-assembly", name: "Particles" },
  { id: "gift-box", name: "Gift Box" },
  { id: "battle", name: "Battle" },
  { id: "pick-card", name: "Pick Card" },
]

export default function AnimationShowcase() {
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>("card-flip")
  const [isRevealing, setIsRevealing] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [key, setKey] = useState(0)
  const [hasWon, setHasWon] = useState(false)

  // Reset auction state when switching animation concepts
  useEffect(() => {
    setHasWon(false)
    setIsRevealing(false)
    setIsSpinning(false)
    setSelectedTeam(null)
  }, [selectedAnimation])

  const handleStartSpin = useCallback(() => {
    setIsSpinning(true)
  }, [])

  const handleSpinComplete = useCallback((team: Team) => {
    setSelectedTeam(team)
    setIsRevealing(true)
    setKey(prev => prev + 1)
  }, [])

  const handleReveal = useCallback(() => {
    setIsRevealing(true)
    setKey(prev => prev + 1)
  }, [])

  const handleComplete = useCallback(() => {
    setTimeout(() => {
      setIsRevealing(false)
      setIsSpinning(false)
    }, 1500)
  }, [])

  const renderAnimation = () => {
    const props = { isRevealing, onComplete: handleComplete, team: selectedTeam }
    
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
      case "gift-box":
        return <GiftBoxReveal key={key} {...props} />
      case "battle":
        return <BattleReveal key={key} {...props} />
      case "pick-card":
        return <PickCardReveal key={key} {...props} />
      default:
        return null
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ScreenRecording_03-10-2026%2022-12-18_1-XEQSf4595ZNfLCTCuTl1EmyY0whFpa.mov"
      />
      
      {/* Gradient overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      
      {/* eBay Live Header */}
      <div className="absolute top-12 left-0 right-0 z-20 p-4">
        {/* Top row - Back button, username, and viewer count aligned */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center">
              <ChevronDown className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
              <span className="text-white font-semibold text-sm">ryans_cardhouse</span>
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
          
          {/* Viewer count */}
          <div className="flex items-center gap-1 bg-red-500 rounded-full px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-medium">240</span>
          </div>
        </div>
        
        {/* Right side action buttons */}
        <div className="absolute top-16 right-4 flex flex-col items-end gap-3">
          <button className="w-10 h-10 bg-black/40 backdrop-blur rounded-xl flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-10 bg-black/40 backdrop-blur rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-10 bg-black/40 backdrop-blur rounded-xl flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Bottom UI Stack - Chat, Comment, Spinner, Auction Card */}
      <div className="absolute left-4 right-4 bottom-4 z-20 flex flex-col gap-3">
        {/* Chat Messages */}
        <div className="space-y-1.5 max-w-[280px]">
          <div className="flex items-start gap-2">
            <span className="text-white/60 text-sm">johnpleys</span>
            <span className="text-white/80 text-sm italic">Gotta try to hit this one! Love M...</span>
          </div>
          <div>
            <span className="text-yellow-400 font-semibold text-sm">Chloepulls11</span>
            <span className="text-white text-sm ml-1">These are so hot, get your bids in!</span>
          </div>
          <div>
            <span className="text-white font-semibold text-sm">chrisjames</span>
            <span className="text-white/80 text-sm ml-1">So sick</span>
          </div>
        </div>

        {/* Comment Input */}
        <div className="flex items-center bg-black/40 backdrop-blur rounded-full px-4 py-3">
          <span className="text-white/50 text-sm flex-1">Add comment...</span>
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        </div>

        {/* Team Spinner with Spots Available - hidden for slot machine and battle */}
        {selectedAnimation !== "slot-machine" && selectedAnimation !== "battle" && (
          <TeamSpinner
            totalSpots={32}
            availableSpots={16}
            isSpinning={isSpinning}
            onStartSpin={handleStartSpin}
            onSpinComplete={handleSpinComplete}
            disabled={!hasWon}
            username={hasWon ? "KemMajed90" : undefined}
          />
        )}

        {/* Auction Card */}
        <div className="bg-black/40 backdrop-blur rounded-2xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-2">
              <p className="text-sm text-white mb-1 line-clamp-2">
                <span className="font-semibold">{selectedTeam ? selectedTeam.name : 'Random team'}</span>
                <span className="text-white/50"> - 16X 2023 Panini Mosaic NFL Blaster Random #224</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">$28.00</span>
                <span className="text-green-400 text-sm">+ $5 shipping</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 mt-1 flex-shrink-0" />
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-green-400 font-medium text-sm">
                {hasWon ? 'KemMajed90' : 'Jessica991'}
              </span>
              <span className="text-white/60 text-sm">
                {hasWon ? 'won' : 'is winning'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-white/50">
              <div className="w-4 h-4 rounded-full border-2 border-white/40 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-white/40" />
              </div>
              <span className="font-medium text-sm">{hasWon ? '00:00' : '00:10'}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              disabled={hasWon}
              className={`px-5 py-2.5 border rounded-full font-medium text-sm transition-colors ${
                hasWon 
                  ? 'border-white/10 text-white/30 cursor-not-allowed' 
                  : 'border-white/30 text-white hover:bg-white/10'
              }`}
            >
              Max bid
            </button>
            <button 
              onClick={() => {
                if (!hasWon) {
                  setHasWon(true)
                  // For slot-machine and battle, trigger reveal after a short delay
                  if (selectedAnimation === "slot-machine" || selectedAnimation === "battle") {
                    setTimeout(() => {
                      setIsRevealing(true)
                      setKey(prev => prev + 1)
                    }, 1500)
                  }
                }
              }}
              disabled={hasWon}
              className={`flex-1 py-2.5 rounded-full font-semibold text-sm flex items-center justify-center gap-1 transition-colors ${
                hasWon
                  ? 'bg-zinc-700 text-white/50 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-400 text-black'
              }`}
            >
              {hasWon ? (
                <span>Sold out</span>
              ) : (
                <>
                  <span>Bid $30</span>
                  <ChevronsRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Animation Style Picker - Above Live UI */}
      <motion.div
        className="absolute -top-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur border-b border-white/10 px-4 py-2 safe-top"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {animations.map((animation) => (
            <button
              key={animation.id}
              onClick={() => setSelectedAnimation(animation.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedAnimation === animation.id
                  ? "bg-green-500 text-black"
                  : "bg-zinc-800 text-white/70 hover:bg-zinc-700"
              }`}
            >
              {animation.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Reveal Animation Overlay */}
      <AnimatePresence>
        {isRevealing && (
          <>
            {/* Backdrop blur */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Animation container */}
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center z-50"
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
                  KemMajed90 Won!
                </p>
                <p className="text-white/70 text-sm">Your team is...</p>
              </motion.div>

              {/* The animation component */}
              {renderAnimation()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
