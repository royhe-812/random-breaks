"use client"

// React hooks - all required hooks imported
import { Fragment, useCallback, useEffect, useRef, useState } from "react"

// External libraries
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, ChevronRight, Heart, Star } from "lucide-react"

// Internal components
import { TeamSpinner, type Team, teams } from "@/components/team-spinner"
import { MultiSpinSpinner } from "@/components/multi-spin-spinner"
import { MultiSpin2Spinner } from "@/components/multi-spin-2-spinner"
import { MultiSpin4Spinner } from "@/components/multi-spin-4-spinner"
import { MultiSpin4AutoSpinner } from "@/components/multi-spin-4-auto-spinner"
import { MultiSpin4ChipsSpinner } from "@/components/multi-spin-4-chips-spinner"
import { SingleSpinChipSpinner } from "@/components/single-spin-chip-spinner"
import { CardFlipReveal } from "@/components/animations/card-flip-reveal"
import { PackRipReveal } from "@/components/animations/pack-rip-reveal"
import { SlotMachineReveal } from "@/components/animations/slot-machine-reveal"
import { MysteryBoxReveal } from "@/components/animations/mystery-box-reveal"
import { ParticleAssemblyReveal } from "@/components/animations/particle-assembly-reveal"
import { GiftBoxReveal } from "@/components/animations/gift-box-reveal"
import { BattleReveal } from "@/components/animations/battle-reveal"
import { PickCardReveal } from "@/components/animations/pick-card-reveal"
import { CarouselReveal } from "@/components/animations/carousel-reveal"
import { GiftReveal } from "@/components/animations/gift-reveal"
import { ThumbnailsReveal } from "@/components/animations/thumbnails-reveal"
import { ThumbnailsInlineReveal } from "@/components/animations/thumbnails-inline-reveal"
import { ThumbnailsInitialsReveal } from "@/components/animations/thumbnails-initials-reveal"
import { ThumbnailsTextReveal } from "@/components/animations/thumbnails-text-reveal"
import { InStreamExperience } from "@/components/in-stream-experience"
import { SwipeToBid } from "@/components/swipe-to-bid"
import { BreakSpotsSheet } from "@/components/break-spots-sheet"

type AnimationType = "card-flip" | "multi-spin-repeat" | "multi-spin" | "multi-spin-2" | "multi-spin-4" | "multi-spin-4-auto" | "multi-spin-4-chips" | "pack-rip" | "slot-machine" | "mystery-box" | "particle-assembly" | "gift-box" | "battle" | "pick-card" | "carousel" | "in-stream" | "gift-reveal" | "thumbnails" | "thumbnails-2" | "thumbnails-3" | "thumbnails-4"

const animations: { id: AnimationType; name: string; disabled?: boolean }[] = [
  { id: "card-flip", name: "Single Spin" },
  { id: "multi-spin-repeat", name: "Multi-Spin" },
  { id: "multi-spin", name: "Multi-Spin Select" },
  { id: "multi-spin-2", name: "Multi-Spin Auto" },
  { id: "multi-spin-4", name: "Multi-Spin Select 4" },
  { id: "multi-spin-4-auto", name: "Multi-Spin 4 Auto" },
  { id: "multi-spin-4-chips", name: "Multi-Spin 4 Chips" },
  { id: "thumbnails-2", name: "Extended" },
  { id: "pack-rip", name: "Pack Rip" },
  { id: "slot-machine", name: "Team Picker" },
  { id: "battle", name: "Battle" },
  { id: "carousel", name: "Carousel" },
  // Temporarily hidden from the concepts list (kept for potential future use):
  // { id: "gift-reveal", name: "Gift Reveal" },
  // { id: "thumbnails", name: "Thumbnails" },
  { id: "thumbnails-3", name: "Thumbnails 3" },
  // { id: "thumbnails-4", name: "Text" },
]

// Winner Chat Announcement with glow and wipe gradient
function WinnerAnnouncement({ username, team, show, hideTeamBlock = false }: { username: string; team: Team; show: boolean; hideTeamBlock?: boolean }) {
  if (!show) return null
  
  return (
    <motion.div
      className="relative px-4 py-4 rounded-xl overflow-hidden bg-black/60 backdrop-blur w-full"
      style={{
        boxShadow: `0 0 40px ${team.color}80, 0 0 80px ${team.color}50, 0 0 120px ${team.color}30`,
      }}
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      animate={{ 
        opacity: 1, 
        scale: [1, 1.02, 1],
        y: 0 
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        scale: { duration: 0.8, repeat: Infinity, repeatDelay: 0.5 }
      }}
    >
      {/* Animated glow border with stronger effect - green */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          border: `2px solid #4CE160`,
        }}
        animate={{
          boxShadow: [
            `inset 0 0 25px #4CE16040, 0 0 20px #4CE16060`,
            `inset 0 0 50px #4CE16060, 0 0 40px #4CE16080`,
            `inset 0 0 25px #4CE16040, 0 0 20px #4CE16060`,
          ],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      {/* Primary sweeping wipe gradient - green */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, #4CE16030 40%, #4CE160 50%, #4CE16030 60%, transparent 100%)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />

      {/* Secondary wipe gradient - team color */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${team.color}20 40%, ${team.color}60 50%, ${team.color}20 60%, transparent 100%)`,
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "linear", delay: 0.4 }}
      />

      {/* Sparkle/confetti particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: `${10 + i * 7}%`,
            top: `${20 + (i % 3) * 25}%`,
            background: i % 3 === 0 ? "#4CE160" : i % 3 === 1 ? team.color : "#fff",
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Firework burst effect on edges */}
      <motion.div
        className="absolute -left-2 top-1/2 w-4 h-4 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${team.color} 0%, transparent 70%)` }}
        animate={{
          scale: [0, 2, 0],
          opacity: [0, 0.8, 0],
        }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="absolute -right-2 top-1/2 w-4 h-4 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, #4CE160 0%, transparent 70%)` }}
        animate={{
          scale: [0, 2, 0],
          opacity: [0, 0.8, 0],
        }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
      />

      {/* Content with enhanced styling */}
      <div className="relative z-10 flex items-center gap-2">
        <motion.span 
          className="text-2xl"
          animate={{ 
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
        >
          👑
        </motion.span>
        <p className="text-sm flex items-center gap-2">
          <span className="font-bold text-white">{username}</span>
          <span className="text-white/90">Won</span>
          {/* Team initials square - hidden for text-only concepts */}
          {!hideTeamBlock && (
            <span 
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: team.color }}
            >
              {team.abbrev}
            </span>
          )}
          <motion.span 
            className="font-black text-base text-white"
            style={{ 
              textShadow: `0 0 10px ${team.color}80`,
            }}
            animate={{
              textShadow: [
                `0 0 10px ${team.color}80`,
                `0 0 20px ${team.color}`,
                `0 0 10px ${team.color}80`,
              ],
            }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {team.city} {team.name}!
          </motion.span>
        </p>
      </div>
    </motion.div>
  )
}

const chatMessages = [
  { user: "johnpleys", message: "Gotta try to hit this one! Love Mosaic", color: "text-white/60" },
  { user: "Chloepulls11", message: "These are so hot, get your bids in!", color: "text-yellow-400" },
  { user: "chrisjames", message: "So sick", color: "text-white" },
  { user: "cardking99", message: "GL everyone!", color: "text-blue-400" },
  { user: "packripperz", message: "Who got the Burrow last break?", color: "text-purple-400" },
  { user: "sportsfan22", message: "Need that Stroud auto", color: "text-green-400" },
  { user: "rookie_hunter", message: "Herbert please!", color: "text-orange-400" },
  { user: "bigpulls", message: "Let's gooo", color: "text-pink-400" },
  { user: "cardcollector", message: "Anyone hit a case hit yet?", color: "text-cyan-400" },
  { user: "mikibreaks", message: "Just got the Cowboys, hyped!", color: "text-blue-400" },
  { user: "nfl_cards", message: "Mahomes would be insane", color: "text-red-400" },
  { user: "boxbreaker", message: "Love these random breaks", color: "text-yellow-400" },
  { user: "pullemall", message: "Chiefs or Eagles plz", color: "text-green-400" },
  { user: "firstroundpick", message: "Mosaic hits different", color: "text-purple-400" },
  { user: "cardfiend", message: "What's the case hit?", color: "text-white" },
]

export default function AnimationShowcase() {
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>("card-flip")
  const [isRevealing, setIsRevealing] = useState(false)
  const [isSpinnerRevealing, setIsSpinnerRevealing] = useState(false) // For TeamSpinner cycling
  const [isSpinnerPending, setIsSpinnerPending] = useState(false) // Post-reveal "pending assignment" in TeamSpinner
  const [isMultiSpinning, setIsMultiSpinning] = useState(false) // Multi-Spin: run the two spins
  const [multiPendingSpot, setMultiPendingSpot] = useState<1 | 2 | 3 | 4 | null>(null) // Multi-Spin: selected spot awaiting assignment
  const [multiLastWinner, setMultiLastWinner] = useState<{ username: string; team: string } | null>(null) // Multi-Spin: dynamic last winner
  const [spinnerLastWinner, setSpinnerLastWinner] = useState<{ username: string; team: string } | null>(null) // TeamSpinner: dynamic last winner
  const [isBreakSpotsOpen, setIsBreakSpotsOpen] = useState(false) // For BreakSpotsSheet
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [key, setKey] = useState(0)
  const [hasWon, setHasWon] = useState(false)
  const [visibleMessages, setVisibleMessages] = useState(chatMessages.slice(0, 3))
  const [viewerCount, setViewerCount] = useState(240)
  const [winnerTeam, setWinnerTeam] = useState<Team | null>(null)
  const [showWinner, setShowWinner] = useState(false)
  const [reactionMessages, setReactionMessages] = useState<{ user: string; message: string; color: string }[]>([])
  const messageIndexRef = useRef(3)
  const chatPausedRef = useRef(false)
  
  // Random reaction usernames and message templates
  const reactionUsers = [
    { user: "cardking99", color: "text-blue-400" },
    { user: "packripperz", color: "text-purple-400" },
    { user: "sportsfan22", color: "text-green-400" },
    { user: "rookie_hunter", color: "text-orange-400" },
    { user: "breaker_joe", color: "text-yellow-400" },
    { user: "pullemall", color: "text-pink-400" },
  ]

  // Rotate chat messages to feel alive (pauses when winner is shown)
  useEffect(() => {
    const interval = setInterval(() => {
      if (chatPausedRef.current) return
      setVisibleMessages(prev => {
        const newMessages = [...prev.slice(1)]
        newMessages.push(chatMessages[messageIndexRef.current % chatMessages.length])
        messageIndexRef.current++
        return newMessages
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // Fluctuate viewer count realistically
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => {
        // Random change between -3 and +5 (slightly biased toward increases)
        const change = Math.floor(Math.random() * 9) - 3
        // Keep within realistic bounds (200-300)
        const newCount = Math.max(200, Math.min(300, prev + change))
        return newCount
      })
    }, 2000 + Math.random() * 2000) // Random interval between 2-4 seconds
    return () => clearInterval(interval)
  }, [])

  // Reset auction state when switching animation concepts
  useEffect(() => {
    setHasWon(false)
    setIsRevealing(false)
    setIsSpinnerRevealing(false)
    setIsSpinnerPending(false)
    setIsMultiSpinning(false)
  setMultiPendingSpot(null)
  setMultiLastWinner(null)
  setSpinnerLastWinner(null)
  setSelectedTeam(null)
    setWinnerTeam(null)
    setShowWinner(false)
    setReactionMessages([])
    chatPausedRef.current = false
  }, [selectedAnimation])
  
  // Add reaction messages after winner is shown
  useEffect(() => {
    if (showWinner && winnerTeam) {
      // Pick 2 random unique users
      const shuffledUsers = [...reactionUsers].sort(() => Math.random() - 0.5)
      const user1 = shuffledUsers[0]
      const user2 = shuffledUsers[1]
      
      const reactionTemplates1 = [
        `Wow ${winnerTeam.name}! Nice pull!`,
        `${winnerTeam.name} lets gooo!`,
        `Lucky! ${winnerTeam.name} is fire`,
        `GG! ${winnerTeam.name} hit!`,
      ]
      
      const reactionTemplates2 = [
        `Adam007 always wins the good ones`,
        `So lucky! Congrats Adam007`,
        `Adam007 on a heater tonight`,
        `Nice hit Adam007!`,
      ]
      
      // First reaction after 2 seconds
      const timer1 = setTimeout(() => {
        const msg1 = reactionTemplates1[Math.floor(Math.random() * reactionTemplates1.length)]
        setReactionMessages([{ user: user1.user, message: msg1, color: user1.color }])
      }, 2000)
      
      // Second reaction after 3.5 seconds
      const timer2 = setTimeout(() => {
        const msg2 = reactionTemplates2[Math.floor(Math.random() * reactionTemplates2.length)]
        setReactionMessages(prev => [...prev, { user: user2.user, message: msg2, color: user2.color }])
      }, 3500)
      
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    }
  }, [showWinner, winnerTeam])

  const handleSpinComplete = useCallback((team: Team) => {
    setSelectedTeam(team)
    setWinnerTeam(team) // Store winner team immediately so handleComplete has it
    setIsSpinnerRevealing(false) // Stop spinner
    setIsRevealing(true) // Now trigger the animation reveal
    setKey(prev => prev + 1)
  }, [])

  const handleReveal = useCallback(() => {
    setIsRevealing(true)
    setKey(prev => prev + 1)
  }, [])

  const handleComplete = useCallback(() => {
    // The full-screen spot reveal animation just finished.
    if (selectedAnimation === "in-stream") return

    // Multi-Spin already showed its "pending assignment" beat before the
    // full-screen reveal, so go straight to the in-chat winner moment.
    // Single Spin (chip) and Multi-Spin 4 Chips keep their colored chip(s) and
    // the selected highlight on screen after the reveal. We intentionally leave
    // isMultiSpinning and multiPendingSpot set so the chips persist until the
    // user taps the "sold out" reset CTA (SwipeToBid onReset).
    if (selectedAnimation === "card-flip" || selectedAnimation === "multi-spin-4-chips") {
      setIsRevealing(false)
      setShowWinner(true)
      setKey(prev => prev + 1)
      return
    }

    if (
      selectedAnimation === "multi-spin" ||
      selectedAnimation === "multi-spin-2" ||
      selectedAnimation === "multi-spin-4" ||
      selectedAnimation === "multi-spin-4-auto"
    ) {
      setIsRevealing(false)
      setIsMultiSpinning(false)
      setMultiPendingSpot(null)
      setShowWinner(true)
      setKey(prev => prev + 1)
      return
    }

    // Concepts that render the TeamSpinner show a "Pending assignment" beat in
    // the spinner title (waiting on the seller) before the in-chat winner moment.
    const usesSpinner =
      selectedAnimation !== "pick-card" &&
      selectedAnimation !== "thumbnails" &&
      selectedAnimation !== "thumbnails-2" &&
      selectedAnimation !== "thumbnails-3" &&
      selectedAnimation !== "thumbnails-4"

    if (usesSpinner) {
      // Close the full-screen reveal overlay and drop the spinner back to its
      // panel, now showing "Pending assignment" while the seller assigns.
      setIsRevealing(false)
      setIsSpinnerRevealing(false)
      setIsSpinnerPending(true)
      setKey(prev => prev + 1)

      // After the seller "assigns" the spot, update the last winner and reveal
      // the in-chat winner.
      setTimeout(() => {
        setIsSpinnerPending(false)
        if (winnerTeam) setSpinnerLastWinner({ username: "Adam007", team: winnerTeam.name })
        setShowWinner(true)
      }, 3000)
      return
    }

    // Other concepts: show the in-chat winner treatment immediately, then close.
    setShowWinner(true)
    setTimeout(() => {
      setIsRevealing(false)
      setIsSpinnerRevealing(false)
      setKey(prev => prev + 1)
    }, 3000)
  }, [selectedAnimation, winnerTeam])

  const handleTeamSelected = useCallback((team: Team) => {
    setWinnerTeam(team)
  }, [])

  // Multi-Spin: buyer committed to one of the two spun spots.
  const handleMultiSelect = useCallback((team: Team, _spot: 1 | 2 | 3 | 4) => {
    setSelectedTeam(team)
    setWinnerTeam(team)
    setMultiPendingSpot(_spot) // Show "Pending assignment" in place of the Select button

    // After the seller "assigns" the spot, update the last winner and play
    // the full-screen reveal.
    setTimeout(() => {
      setMultiLastWinner({ username: "Adam007", team: team.name })
      setIsRevealing(true)
      setKey(prev => prev + 1)
    }, 4000)
  }, [])

  const renderAnimation = () => {
    const props = { isRevealing, onComplete: handleComplete, team: selectedTeam, onTeamSelected: handleTeamSelected }
    
    switch (selectedAnimation) {
      case "card-flip":
        return <CardFlipReveal key={key} {...props} />
      case "multi-spin-repeat":
        return <CardFlipReveal key={key} {...props} />
      case "multi-spin":
        return <CardFlipReveal key={key} {...props} />
      case "multi-spin-2":
        return <CardFlipReveal key={key} {...props} />
      case "multi-spin-4":
        return <CardFlipReveal key={key} {...props} />
      case "multi-spin-4-auto":
        return <CardFlipReveal key={key} {...props} />
      case "multi-spin-4-chips":
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
      case "carousel":
        return <CarouselReveal key={key} isRevealing={isRevealing} onComplete={(team) => { setWinnerTeam(team); handleComplete(); }} />
case "gift-reveal":
return <GiftReveal key={key} {...props} />
case "thumbnails":
  return <ThumbnailsReveal key={key} {...props} />
case "thumbnails-2":
  return null // Thumbnails 2 renders inline with stream UI, not in the reveal area
case "thumbnails-3":
  return null // Thumbnails 3 renders inline with stream UI, not in the reveal area
case "thumbnails-4":
  return null // Thumbnails 4 renders inline with stream UI, not in the reveal area
  default:
  return null
    }
  }

  // If In-Stream is selected, render the fully isolated experience
  if (selectedAnimation === "in-stream") {
    return (
      <>
        {/* Animation Style Picker - stays on top */}
        <motion.div
          className="fixed top-0 left-0 right-0 z-[100] bg-zinc-900/95 backdrop-blur border-b border-white/10 px-4 py-2 safe-top"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {animations.map((animation) => (
              <Fragment key={animation.id}>
                <button
                  onClick={() => !animation.disabled && setSelectedAnimation(animation.id)}
                  disabled={animation.disabled}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    animation.disabled
                      ? "bg-zinc-800/50 text-white/30 cursor-not-allowed"
                      : selectedAnimation === animation.id
                      ? "bg-green-500 text-black"
                      : "bg-zinc-800 text-white/70 hover:bg-zinc-700"
                  } ${
                          (animation.id === "card-flip" || animation.id === "thumbnails-2" || animation.id === "multi-spin-repeat" || animation.id === "multi-spin" || animation.id === "multi-spin-2" || animation.id === "multi-spin-4" || animation.id === "multi-spin-4-auto" || animation.id === "multi-spin-4-chips")
                            ? "ring-1 ring-inset ring-yellow-400"
                      : ""
                  }`}
                >
                  {animation.name}
                </button>
                {animation.id === "thumbnails-2" && (
                  <div className="flex-shrink-0 self-center w-px h-5 bg-white/20 mx-1" aria-hidden="true" />
                )}
              </Fragment>
            ))}
          </div>
        </motion.div>
        <InStreamExperience />
      </>
    )
  }

  return (
    <div className="w-full min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="relative w-full max-w-[420px] h-screen max-h-[900px] overflow-hidden bg-black shadow-2xl sm:rounded-[2rem]">
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
      
{/* Thumbnails 2 - "Extended" - Inline with stream UI using team colors and initials */}
  {selectedAnimation === "thumbnails-2" && (
  <ThumbnailsInitialsReveal
  isRevealing={isRevealing}
  onComplete={() => {
  setShowWinner(true)
  chatPausedRef.current = false
  }}
  onTeamSelected={(team) => {
  setWinnerTeam(team)
  setSelectedTeam(team)
  }}
  />
  )}
  
  {/* Thumbnails 3 - Inline with stream UI using team logos */}
  {selectedAnimation === "thumbnails-3" && (
  <ThumbnailsInlineReveal
  isRevealing={isRevealing}
  onComplete={() => {
  setShowWinner(true)
  chatPausedRef.current = false
  }}
  onTeamSelected={(team) => {
  setWinnerTeam(team)
  setSelectedTeam(team)
  }}
  />
  )}
  
  {/* Thumbnails 4 - Inline with stream UI using text only */}
  {selectedAnimation === "thumbnails-4" && (
  <ThumbnailsTextReveal
  isRevealing={isRevealing}
  onComplete={() => {
  setShowWinner(true)
  chatPausedRef.current = false
  }}
  onTeamSelected={(team) => {
  setWinnerTeam(team)
  setSelectedTeam(team)
  }}
  />
  )}
      
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
          
        </div>
        
        {/* Right side action buttons with viewer count */}
        <div className="absolute top-4 right-4">
          <div className="bg-black/40 backdrop-blur rounded-3xl px-2 py-3 flex flex-col items-center gap-2">
            {/* Live stream icon with viewer count */}
            <div className="flex flex-col items-center">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Stream%20navigation%20avatar-kd9nUvhPaYGQGCKYioJLK4vLokIQ87.png" 
                alt="Live" 
                className="w-10 h-10"
              />
              <span className="text-white text-xs font-medium mt-1">{viewerCount}</span>
            </div>
            {/* Items */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/items-lRJIiXEXUI5vZJg8YwpehK7c6cPcIp.png" 
                  alt="Items" 
                  className="w-6 h-6"
                />
              </div>
              <span className="text-white text-xs font-medium mt-1">Items</span>
            </div>
            {/* Wallet */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wallet-DJozjl9ngzsbQkbB6XZaj8GAvfXwO3.png" 
                  alt="Wallet" 
                  className="w-6 h-6"
                />
              </div>
              <span className="text-white text-xs font-medium mt-1">Wallet</span>
            </div>
            {/* Polls */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/polls-TLiAJGRZLHuSvOrQ9KyfrufvDyhfjC.png" 
                  alt="Polls" 
                  className="w-6 h-6"
                />
              </div>
              <span className="text-white text-xs font-medium mt-1">Polls</span>
            </div>
            {/* More */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/more-7JAmofygtcnGhXf8oMlQuYxSkAZxTC.png" 
                  alt="More" 
                  className="w-6 h-6"
                />
              </div>
              <span className="text-white text-xs font-medium mt-1">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom UI Stack - Chat, Comment, Spinner, Auction Card */}
      <div className="absolute left-4 right-4 bottom-4 z-20 flex flex-col gap-2">
        {/* Chat Messages */}
        <div className="space-y-1.5 max-w-[280px]">
          <AnimatePresence mode="popLayout">
            {visibleMessages.map((msg, index) => (
              <motion.div
                key={`${msg.user}-${msg.message}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <span className={`${msg.color} font-semibold text-sm`}>{msg.user}</span>
                <span className="text-white/80 text-sm ml-1">{msg.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
{/* Winner Announcement - shows in chat after reveal completes */}
  {showWinner && winnerTeam && selectedAnimation !== "in-stream" && (
  <WinnerAnnouncement
  username="Adam007"
  team={winnerTeam}
  show={showWinner}
  hideTeamBlock={selectedAnimation === "thumbnails-4"}
  />
  )}
        
        {/* Reaction messages after winner announcement */}
        {showWinner && reactionMessages.length > 0 && (
          <div className="space-y-1.5 max-w-[280px]">
            <AnimatePresence mode="popLayout">
              {reactionMessages.map((msg, index) => (
                <motion.div
                  key={`reaction-${msg.user}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <span className={`${msg.color} font-semibold text-sm`}>{msg.user}</span>
                  <span className="text-white/80 text-sm ml-1">{msg.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Comment Input */}
        <div className="flex items-center bg-black/40 backdrop-blur rounded-full px-4 py-3">
          <span className="text-white/50 text-sm flex-1">Add comment...</span>
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        </div>

        {/* Team Spinner with Spots Available - shown for most concepts. For slot-machine (Team Picker),
            battle, and carousel it stays in its idle/zero state (thumbnail) since those concepts
            handle their own cycling + reveal full screen (isSpinnerRevealing is never set for them). */}
        {selectedAnimation !== "card-flip" && selectedAnimation !== "pick-card" && selectedAnimation !== "multi-spin" && selectedAnimation !== "multi-spin-2" && selectedAnimation !== "multi-spin-4" && selectedAnimation !== "multi-spin-4-auto" && selectedAnimation !== "multi-spin-4-chips" && selectedAnimation !== "thumbnails" && selectedAnimation !== "thumbnails-2" && selectedAnimation !== "thumbnails-3" && selectedAnimation !== "thumbnails-4" && (
          <TeamSpinner
            totalSpots={32}
            availableSpots={hasWon ? 15 : 16}
            isRevealing={isSpinnerRevealing}
            isPending={isSpinnerPending}
            lastWinner={spinnerLastWinner}
            onSpinComplete={handleSpinComplete}
            username={hasWon ? "Adam007" : undefined}
            onViewSpots={() => setIsBreakSpotsOpen(true)}
            spinRounds={selectedAnimation === "multi-spin-repeat" ? 3 : 1}
          />
        )}

        {/* Single Spin: one spin that lands on a single colored team chip */}
        {selectedAnimation === "card-flip" && (
          <SingleSpinChipSpinner
            totalSpots={32}
            availableSpots={hasWon ? 15 : 16}
            isSpinning={isMultiSpinning}
            pendingSpot={multiPendingSpot === 1 ? 1 : null}
            onAnnounce={handleMultiSelect}
            onViewSpots={() => setIsBreakSpotsOpen(true)}
          />
        )}

        {/* Multi-Spin: two-spot spinner that lets the buyer pick one of two spins */}
        {selectedAnimation === "multi-spin" && (
          <MultiSpinSpinner
            totalSpots={32}
            availableSpots={hasWon ? 15 : 16}
            isSpinning={isMultiSpinning}
            pendingSpot={multiPendingSpot}
            lastWinner={multiLastWinner}
            onSelect={handleMultiSelect}
            onViewSpots={() => setIsBreakSpotsOpen(true)}
          />
        )}

        {/* Multi-Spin 2: two-spot spinner that auto-announces a spot, no select buttons */}
        {selectedAnimation === "multi-spin-2" && (
          <MultiSpin2Spinner
            totalSpots={32}
            availableSpots={hasWon ? 15 : 16}
            isSpinning={isMultiSpinning}
            pendingSpot={multiPendingSpot === 1 || multiPendingSpot === 2 ? multiPendingSpot : null}
            onAnnounce={handleMultiSelect}
            onViewSpots={() => setIsBreakSpotsOpen(true)}
          />
        )}

        {/* Multi-Spin Select 4: four-spot spinner that lets the buyer pick one of four spins */}
        {selectedAnimation === "multi-spin-4" && (
          <MultiSpin4Spinner
            totalSpots={32}
            availableSpots={hasWon ? 15 : 16}
            isSpinning={isMultiSpinning}
            pendingSpot={multiPendingSpot}
            lastWinner={multiLastWinner}
            onSelect={handleMultiSelect}
            onViewSpots={() => setIsBreakSpotsOpen(true)}
          />
        )}

        {/* Multi-Spin 4 Auto: four-spot spinner that auto-announces a spot, no select buttons */}
        {selectedAnimation === "multi-spin-4-auto" && (
          <MultiSpin4AutoSpinner
            totalSpots={32}
            availableSpots={hasWon ? 15 : 16}
            isSpinning={isMultiSpinning}
            pendingSpot={multiPendingSpot === 4 ? null : multiPendingSpot}
            onAnnounce={handleMultiSelect}
            onViewSpots={() => setIsBreakSpotsOpen(true)}
          />
        )}

        {/* Multi-Spin 4 Chips: same auto flow, but spots render as colored team chips */}
        {selectedAnimation === "multi-spin-4-chips" && (
          <MultiSpin4ChipsSpinner
            totalSpots={32}
            availableSpots={hasWon ? 15 : 16}
            isSpinning={isMultiSpinning}
            pendingSpot={multiPendingSpot === 4 ? null : multiPendingSpot}
            onAnnounce={handleMultiSelect}
            onViewSpots={() => setIsBreakSpotsOpen(true)}
          />
        )}

        {/* Auction Card */}
        <div className="bg-black/40 backdrop-blur rounded-2xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-2">
              <p className="text-sm text-white mb-0.5 line-clamp-2">
                <span className="font-semibold">{showWinner && winnerTeam ? `${winnerTeam.city} ${winnerTeam.name}` : 'Random team'}</span>
              </p>
              {selectedAnimation !== "thumbnails-2" && selectedAnimation !== "thumbnails-3" && selectedAnimation !== "thumbnails-4" && selectedAnimation !== "card-flip" && selectedAnimation !== "multi-spin-repeat" && selectedAnimation !== "multi-spin" && selectedAnimation !== "multi-spin-2" && selectedAnimation !== "multi-spin-4" && selectedAnimation !== "multi-spin-4-auto" && selectedAnimation !== "multi-spin-4-chips" && selectedAnimation !== "pack-rip" && selectedAnimation !== "gift-reveal" && selectedAnimation !== "slot-machine" && selectedAnimation !== "battle" && selectedAnimation !== "carousel" && (
                <p className="text-white/50 text-sm mb-1 flex items-center gap-1">
                  <svg width="12" height="15" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="28" height="36" rx="3" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5"/>
                    <rect x="6" y="6" width="20" height="4" rx="1" fill="rgba(255,255,255,0.5)"/>
                    <circle cx="16" cy="20" r="5" fill="rgba(255,255,255,0.5)"/>
                    <path d="M8 34c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  {hasWon ? '15/32' : '16/32'} spots available
                </p>
              )}
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg">{hasWon ? '$30.00' : '$28.00'}</span>
                <div className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.2998 1C7.37676 1 8.25 1.87324 8.25 2.9502V3.75H9.38965C9.8451 3.75004 10.2759 3.95696 10.5605 4.3125L11.6709 5.70117C11.8838 5.96724 12 6.29819 12 6.63867V8C11.9999 8.82823 11.3285 9.5 10.5 9.5H9.5C9.5 10.3284 8.82843 11 8 11C7.17157 11 6.5 10.3284 6.5 9.5H4C4 10.3284 3.32843 11 2.5 11C1.67157 11 1 10.3284 1 9.5H0.75C0.335786 9.5 0 9.16421 0 8.75C0 8.33579 0.335786 8 0.75 8H6.2998C6.54833 8 6.75 7.79833 6.75 7.5498V2.9502C6.75 2.70167 6.54833 2.5 6.2998 2.5H0.75C0.335786 2.5 0 2.16421 0 1.75C0 1.33579 0.335786 1 0.75 1H6.2998ZM8.25 7.5498C8.25 7.70495 8.22955 7.85531 8.19531 8H10.5V6.6377L9.38965 5.25H8.25V7.5498ZM3.75 4.5C4.16421 4.5 4.5 4.83579 4.5 5.25C4.5 5.66421 4.16421 6 3.75 6H0.75C0.335786 6 0 5.66421 0 5.25C0 4.83579 0.335786 4.5 0.75 4.5H3.75Z" fill="rgba(255,255,255,0.5)"/>
                  </svg>
                  <span className="text-white/50 text-sm">$5 shipping</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 mt-1 flex-shrink-0" />
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-green-400 font-medium text-sm">
                {hasWon ? 'Adam007' : 'Jessica991'}
              </span>
              <span className="text-white/60 text-sm">
                {hasWon ? 'won' : 'is winning'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-red-500">
              <div className="w-4 h-4 rounded-full border-2 border-red-500 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-red-500" />
              </div>
              <span className="font-medium text-sm">{hasWon ? '00:00' : '00:10'}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              disabled={hasWon}
              className={`px-5 py-2.5 rounded-full font-medium text-sm transition-colors ${
                hasWon 
                  ? 'border text-black cursor-not-allowed' 
                  : 'border border-white/30 text-white hover:bg-white/10'
              }`}
              style={hasWon ? { backgroundColor: '#8F8F8F', borderColor: '#8F8F8F' } : undefined}
            >
              Max bid
            </button>
            <div className="flex-1">
              <SwipeToBid 
                key={selectedAnimation}
                amount={30}
                isWinning={hasWon && !showWinner}
                disabled={showWinner}
                onBidConfirmed={() => {
                  setHasWon(true)
                  chatPausedRef.current = true // Pause chat immediately when bid is placed
                  
                  // For concepts with built-in randomizer, set a random team and trigger reveal after a short delay
                  if (selectedAnimation === "slot-machine" || selectedAnimation === "battle" || selectedAnimation === "carousel" || selectedAnimation === "pick-card" || selectedAnimation === "thumbnails" || selectedAnimation === "thumbnails-2" || selectedAnimation === "thumbnails-3" || selectedAnimation === "thumbnails-4") {
                    const randomTeam = teams[Math.floor(Math.random() * teams.length)]
                    setSelectedTeam(randomTeam)
                    setWinnerTeam(randomTeam)
                    setTimeout(() => {
                      setIsRevealing(true)
                      setKey(prev => prev + 1)
                    }, 1500)
                  } else if (selectedAnimation === "card-flip" || selectedAnimation === "multi-spin" || selectedAnimation === "multi-spin-2" || selectedAnimation === "multi-spin-4" || selectedAnimation === "multi-spin-4-auto" || selectedAnimation === "multi-spin-4-chips") {
                    // Single Spin (chip) + Multi-Spin: kick off the spin(s).
                    setIsMultiSpinning(true)
                  } else {
                    // For concepts that use TeamSpinner (card-flip, pack-rip, mystery-box, back-card-flip)
                    // Trigger spinner revealing - TeamSpinner will cycle through teams first
                    setIsSpinnerRevealing(true)
                  }
                }}
                onReset={() => {
                  // Reset the entire concept
                  setHasWon(false)
                  setIsSpinnerRevealing(false)
                  setIsSpinnerPending(false)
                  setIsMultiSpinning(false)
                  setMultiPendingSpot(null)
                  setSelectedTeam(null)
                  setShowWinner(false)
                  setWinnerTeam(null)
                  setIsRevealing(false)
                  chatPausedRef.current = false
                }}
              />
            </div>
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
            <Fragment key={animation.id}>
              <button
                onClick={() => !animation.disabled && setSelectedAnimation(animation.id)}
                disabled={animation.disabled}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  animation.disabled
                    ? "bg-zinc-800/50 text-white/30 cursor-not-allowed"
                    : selectedAnimation === animation.id
                    ? "bg-green-500 text-black"
                    : "bg-zinc-800 text-white/70 hover:bg-zinc-700"
                } ${
                  (animation.id === "card-flip" || animation.id === "thumbnails-2" || animation.id === "multi-spin-repeat" || animation.id === "multi-spin" || animation.id === "multi-spin-2" || animation.id === "multi-spin-4" || animation.id === "multi-spin-4-auto" || animation.id === "multi-spin-4-chips")
                            ? "ring-1 ring-inset ring-yellow-400"
                    : ""
                }`}
              >
                {animation.name}
              </button>
              {animation.id === "thumbnails-2" && (
                <div className="flex-shrink-0 self-center w-px h-5 bg-white/20 mx-1" aria-hidden="true" />
              )}
            </Fragment>
          ))}
        </div>
      </motion.div>

      {/* Reveal Animation Overlay */}
      <AnimatePresence>
        {isRevealing && (
          <>
            {/* Some animations handle their own overlay, so only render the animation */}
            {selectedAnimation === "thumbnails" || selectedAnimation === "thumbnails-2" || selectedAnimation === "thumbnails-3" || selectedAnimation === "thumbnails-4" ? (
              renderAnimation()
            ) : (
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
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-white font-bold text-xl">Adam007</span>
                      <span className="text-white/70 text-xl">Won!</span>
                    </div>
                    <p className="text-white/50 text-sm mt-1">Your spot is revealed!</p>
                  </motion.div>

                  {/* The animation component */}
                  {renderAnimation()}
                </motion.div>
              </>
            )}
          </>
        )}
      </AnimatePresence>
      
      {/* Break Spots Sheet */}
      <BreakSpotsSheet 
        isOpen={isBreakSpotsOpen} 
        onClose={() => setIsBreakSpotsOpen(false)}
        spotsAvailable={hasWon ? 15 : 16}
        spotsTotal={32}
      />
      </div>
    </div>
  )
}
