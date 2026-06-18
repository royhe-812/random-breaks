"use client"

// React hooks - all required hooks imported
import { Fragment, useCallback, useEffect, useRef, useState } from "react"

// External libraries
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, ChevronRight, Heart, Star, Crown } from "lucide-react"

// Internal components
import { TeamSpinner, type Team, teams } from "@/components/team-spinner"
import { MultiSpinSpinner } from "@/components/multi-spin-spinner"
import { MultiSpin2Spinner } from "@/components/multi-spin-2-spinner"
import { MultiSpin4Spinner } from "@/components/multi-spin-4-spinner"
import { MultiSpin4AutoSpinner } from "@/components/multi-spin-4-auto-spinner"
import { MultiSpin4ChipsNoLabelSpinner } from "@/components/multi-spin-4-chips-no-label-spinner"
import { SingleSpinChipPopulateSpinner } from "@/components/single-spin-chip-populate-spinner"
import { CardFlipReveal } from "@/components/animations/card-flip-reveal"
import { WinnerCrownReveal } from "@/components/animations/winner-crown-reveal"
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

type AnimationType = "card-flip" | "single-spin-populate" | "multi-spin-repeat" | "multi-spin" | "multi-spin-2" | "multi-spin-4" | "multi-spin-4-auto" | "multi-spin-4-chips" | "multi-spin-4-chips-no-label" | "pack-rip" | "slot-machine" | "mystery-box" | "particle-assembly" | "gift-box" | "battle" | "pick-card" | "carousel" | "in-stream" | "gift-reveal" | "thumbnails" | "thumbnails-2" | "thumbnails-3" | "thumbnails-4"

const animations: { id: AnimationType; name: string; disabled?: boolean }[] = [
  { id: "single-spin-populate", name: "Single Spin" },
  // Temporarily hidden from the concepts list (kept for potential future use):
  // { id: "multi-spin-4-auto", name: "Multi-Spin Text" },
  { id: "multi-spin-4-chips-no-label", name: "Multi-Spin" },
  // Temporarily hidden from the concepts list (kept for potential future use):
  // { id: "thumbnails-2", name: "Extended" },
  // { id: "gift-reveal", name: "Gift Reveal" },
  // { id: "thumbnails", name: "Thumbnails" },
  // Temporarily hidden from the concepts list (kept for potential future use):
  // { id: "thumbnails-3", name: "Board single-spin" },
  // { id: "thumbnails-4", name: "Text" },
]

// Buyer's "claim this spot" comment templates. Picked deterministically per team
// name so the autofilled draft and the message posted to chat always match.
const SPOT_REQUEST_TEMPLATES = [
  (t: string) => `Lock me in for the ${t}! 🔒`,
  (t: string) => `${t} are mine, sell it to me!`,
  (t: string) => `I'll take the ${t} — sold to me please!`,
  (t: string) => `Need those ${t}, hook me up!`,
  (t: string) => `Put me down for the ${t}!`,
  (t: string) => `${t} please, I've been waiting all night!`,
  (t: string) => `Sell me the ${t}, let's go!`,
  (t: string) => `Don't let anyone else grab the ${t} — they're mine!`,
  (t: string) => `Claiming the ${t}, ship it my way!`,
  (t: string) => `${t} all day! Sell it to me!`,
]

function buildSpotRequestMessage(teamName: string) {
  let seed = 0
  for (let i = 0; i < teamName.length; i++) seed += teamName.charCodeAt(i)
  return SPOT_REQUEST_TEMPLATES[seed % SPOT_REQUEST_TEMPLATES.length](teamName)
}

// Winner Chat Announcement with glow and wipe gradient
function WinnerAnnouncement({ username, team, show, hideTeamBlock = false }: { username: string; team: Team; show: boolean; hideTeamBlock?: boolean }) {
  if (!show) return null
  
  return (
    <motion.div
      className="relative px-3 py-2 rounded-lg overflow-hidden bg-black/60 backdrop-blur w-full"
      style={{
        border: `1px solid #4CE16080`,
        boxShadow: `0 0 16px #4CE16040`,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      {/* Single subtle sweeping highlight */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, #4CE16025 50%, transparent 100%)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
      />

      {/* Minimal confetti burst from the crown */}
      {[...Array(10)].map((_, i) => {
        const angle = (i / 10) * Math.PI * 2
        const distance = 26 + (i % 3) * 8
        const palette = ["#4CE160", "#FFD400", team.color, "#ffffff"]
        return (
          <motion.span
            key={i}
            className="absolute left-4 top-1/2 pointer-events-none rounded-[1px]"
            style={{
              width: 4,
              height: 4,
              backgroundColor: palette[i % palette.length],
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: [0, 1, 0.4],
              rotate: [0, 180],
            }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              repeatDelay: 0.9,
              delay: i * 0.03,
              ease: "easeOut",
            }}
          />
        )
      })}

      {/* Content - single compact row */}
      <div className="relative z-10 flex items-center gap-2">
        <p className="text-sm flex items-center gap-1.5 min-w-0">
          <motion.span
            className="shrink-0"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: [-8, 8, -8] }}
            transition={{
              scale: { type: "spring", stiffness: 400, damping: 12 },
              rotate: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <Crown className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden />
          </motion.span>
          <span className="font-semibold text-white shrink-0">{username}</span>
          <span className="text-white/70 shrink-0">won</span>
          {/* Team initials square - hidden for text-only concepts */}
          {!hideTeamBlock && (
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ backgroundColor: team.color }}
            >
              {team.abbrev}
            </span>
          )}
          <span className="font-semibold text-white truncate">
            {team.city} {team.name}
          </span>
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
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationType>("single-spin-populate")
  const [isRevealing, setIsRevealing] = useState(false)
  const [isSpinnerRevealing, setIsSpinnerRevealing] = useState(false) // For TeamSpinner cycling
  const [isSpinnerPending, setIsSpinnerPending] = useState(false) // Post-reveal "pending assignment" in TeamSpinner
  const [isMultiSpinning, setIsMultiSpinning] = useState(false) // Multi-Spin: run the two spins
  const [multiPendingSpot, setMultiPendingSpot] = useState<1 | 2 | 3 | 4 | null>(null) // Multi-Spin: selected spot awaiting assignment
  const [spotAssigned, setSpotAssigned] = useState(false) // Seller assigned the spot: swap item card title to the team name before the reveal
  const [revealPendingSeller, setRevealPendingSeller] = useState(false) // After the spot reveal: show the "Pending seller" state in the spinner before assigning
  const [showWinnerCrown, setShowWinnerCrown] = useState(false) // Crown "WINNER" celebration that plays right after a bid win, before the randomizer
  const [multiLastWinner, setMultiLastWinner] = useState<{ username: string; team: string } | null>(null) // Multi-Spin: dynamic last winner
  const [spinnerLastWinner, setSpinnerLastWinner] = useState<{ username: string; team: string } | null>(null) // TeamSpinner: dynamic last winner
  const [isBreakSpotsOpen, setIsBreakSpotsOpen] = useState(false) // For BreakSpotsSheet
  // Demo: tapping the spots arc cycles the available count through the color tiers
  // (green -> yellow -> orange -> red) then resets, so the progress arc is interactive.
  const [demoSpots, setDemoSpots] = useState(15)
  const cycleSpots = useCallback(() => {
    setDemoSpots((prev) => {
      const next = prev - 8
      return next < 0 ? 32 : next
    })
  }, [])
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
  const pendingSpotRef = useRef<1 | 2 | 3 | 4 | null>(null) // Remembers which spot the spin landed on, assigned after the reveal + pending-seller beat
  // Multi-spin: the set of spots that just landed (available for the seller/buyer to pick during pending)
  const [spunSpots, setSpunSpots] = useState<{ spot: 1 | 2 | 3 | 4; team: Team }[]>([])
  const [commentRequested, setCommentRequested] = useState(false) // Buyer tapped "Add comment" to request a spot during pending
  const [requestDraft, setRequestDraft] = useState<{ spot: 1 | 2 | 3 | 4; team: Team } | null>(null) // Pre-picked spot, autofilled into the comment input for the buyer to tap-send
  const assignFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null) // Auto-assigns if the buyer never requests via comment
  
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
    setSpunSpots([])
    setCommentRequested(false)
    setRequestDraft(null)
    setRevealPendingSeller(false)
    setDemoSpots(15)
    if (assignFallbackRef.current) clearTimeout(assignFallbackRef.current)
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

    // Multi-spin: the "Pending seller" beat and green-chip assignment already
    // happened BEFORE this reveal, so once the reveal finishes just surface the
    // in-chat winner. The colored chip(s) persist until the "sold out" reset CTA.
    if (
      selectedAnimation === "multi-spin-4-chips" ||
      selectedAnimation === "multi-spin-4-chips-no-label" ||
      selectedAnimation === "multi-spin-4-auto"
    ) {
      setIsRevealing(false)
      setShowWinner(true)
      setKey(prev => prev + 1)
      return
    }

    // Single spin: the reveal just finished. Now show the "Pending seller" state
    // in the spinner, and only after that beat assign the spot (green chip + item
    // card title) and surface the in-chat winner.
    if (
      selectedAnimation === "card-flip" ||
      selectedAnimation === "single-spin-populate"
    ) {
      setIsRevealing(false)
      setRevealPendingSeller(true) // Spinner shows "Pending seller" after the reveal
      setKey(prev => prev + 1)

      setTimeout(() => {
        setRevealPendingSeller(false)
        setMultiPendingSpot(pendingSpotRef.current) // Chip turns green / spot highlighted
        setSpotAssigned(true) // Swap the item card title to the assigned team
        setShowWinner(true) // Surface the in-chat winner treatment
      }, 6000)
      return
    }

    if (
      selectedAnimation === "multi-spin" ||
      selectedAnimation === "multi-spin-2" ||
      selectedAnimation === "multi-spin-4"
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

  // Spin landed on a spot. The reveal ordering differs by concept:
  // - Multi-spin: the spinner shows "Pending seller", the seller then assigns a
  //   spot (chip turns green), and ONLY THEN do we play the full-screen reveal.
  // - Single spin: the randomizer stops on one spot, so the reveal plays right
  //   away, and the pending/assignment beat follows after the reveal.
  const handleMultiSelect = useCallback((team: Team, _spot: 1 | 2 | 3 | 4) => {
    setSelectedTeam(team)
    setWinnerTeam(team)
    pendingSpotRef.current = _spot
    setMultiLastWinner({ username: "Adam007", team: team.name })

    const isMultiSpin =
      selectedAnimation === "multi-spin-4-chips" ||
      selectedAnimation === "multi-spin-4-chips-no-label" ||
      selectedAnimation === "multi-spin-4-auto"

    if (isMultiSpin) {
      // Pending seller → seller assigns the spot (green chip + title) → reveal.
      setRevealPendingSeller(true)
      setTimeout(() => {
        setRevealPendingSeller(false)
        setMultiPendingSpot(_spot) // Chip turns green / spot highlighted
        setSpotAssigned(true) // Swap the item card title to the assigned team
        // Brief beat so the green chip reads before the full-screen reveal.
        setTimeout(() => {
          setIsRevealing(true)
          setKey(prev => prev + 1)
        }, 900)
      }, 6000)
    } else {
      // Single spin: play the reveal right after the randomizer stops.
      setIsRevealing(true)
      setKey(prev => prev + 1)
    }
  }, [selectedAnimation])

  // Multi-spin: assign a chosen spot — chip turns green, item card title swaps,
  // then the full-screen reveal plays after a brief beat.
  const assignMultiSpot = useCallback((spot: 1 | 2 | 3 | 4, team: Team) => {
    if (assignFallbackRef.current) clearTimeout(assignFallbackRef.current)
    setRevealPendingSeller(false)
    setSelectedTeam(team)
    setWinnerTeam(team)
    setMultiLastWinner({ username: "Adam007", team: team.name })
    pendingSpotRef.current = spot
    setMultiPendingSpot(spot)
    setSpotAssigned(true)
    setTimeout(() => {
      setIsRevealing(true)
      setKey(prev => prev + 1)
    }, 900)
  }, [])

  // Multi-spin: all spots have landed. Show the "Pending seller" state and hold
  // the set so the buyer can request one via "Add comment". If they never do,
  // the seller auto-picks one after a beat so the demo keeps moving.
  const handleSpotsLanded = useCallback((spots: { spot: 1 | 2 | 3 | 4; team: Team }[]) => {
    setSpunSpots(spots)
    setCommentRequested(false)
    setRevealPendingSeller(true)
    // Pre-pick one spot and autofill it into the comment input as a tappable draft.
    setRequestDraft(spots[Math.floor(Math.random() * spots.length)] ?? null)
    if (assignFallbackRef.current) clearTimeout(assignFallbackRef.current)
  }, [])

  // Buyer taps the autofilled comment: post it to chat verbatim. The "Pending
  // seller" state stays up while the seller reacts, then assigns the spot (which
  // triggers the full-screen reveal).
  const handleRequestComment = useCallback(() => {
    if (!revealPendingSeller || commentRequested || !requestDraft) return
    setCommentRequested(true)
    const choice = requestDraft

    chatPausedRef.current = true
    setVisibleMessages(prev => [
      ...prev.slice(1),
      { user: "Adam007", message: buildSpotRequestMessage(choice.team.name), color: "text-[#4CE160]" },
    ])

    // Pending seller stays visible while the seller reacts, then assigns the spot.
    setTimeout(() => assignMultiSpot(choice.spot, choice.team), 2600)
  }, [revealPendingSeller, commentRequested, requestDraft, assignMultiSpot])

  // Kick off the concept's randomizer/reveal. Runs after the crown celebration.
  const startConceptReveal = useCallback(() => {
    // For concepts with built-in randomizer, set a random team and trigger reveal after a short delay
    if (selectedAnimation === "slot-machine" || selectedAnimation === "battle" || selectedAnimation === "carousel" || selectedAnimation === "pick-card" || selectedAnimation === "thumbnails" || selectedAnimation === "thumbnails-2" || selectedAnimation === "thumbnails-3" || selectedAnimation === "thumbnails-4") {
      const randomTeam = teams[Math.floor(Math.random() * teams.length)]
      setSelectedTeam(randomTeam)
      setWinnerTeam(randomTeam)
      setTimeout(() => {
        setIsRevealing(true)
        setKey(prev => prev + 1)
      }, 1500)
    } else if (selectedAnimation === "card-flip" || selectedAnimation === "single-spin-populate" || selectedAnimation === "multi-spin" || selectedAnimation === "multi-spin-2" || selectedAnimation === "multi-spin-4" || selectedAnimation === "multi-spin-4-auto" || selectedAnimation === "multi-spin-4-chips" || selectedAnimation === "multi-spin-4-chips-no-label") {
      // Single Spin (chip) + Multi-Spin: kick off the spin(s).
      setIsMultiSpinning(true)
    } else {
      // For concepts that use TeamSpinner (card-flip, pack-rip, mystery-box, back-card-flip)
      // Trigger spinner revealing - TeamSpinner will cycle through teams first
      setIsSpinnerRevealing(true)
    }
  }, [selectedAnimation])

  const renderAnimation = () => {
    const props = { isRevealing, onComplete: handleComplete, team: selectedTeam, onTeamSelected: handleTeamSelected }
    
    switch (selectedAnimation) {
      case "card-flip":
        return <CardFlipReveal key={key} {...props} />
      case "single-spin-populate":
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
      case "multi-spin-4-chips-no-label":
        return <PackRipReveal key={key} {...props} />
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
                      ? "bg-zinc-800 text-white ring-2 ring-inset ring-yellow-400"
                      : "bg-zinc-800 text-white/70 hover:bg-zinc-700"
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
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/case%20breaks%20video%20-w5usFKatykHZfTOkKiurwdJmYPpFxf.mov"
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
  availableSpots={demoSpots}
  onCycleSpots={cycleSpots}
  onViewSpots={() => setIsBreakSpotsOpen(true)}
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
                className="flex flex-col"
              >
                <span className="text-white font-bold text-sm">{msg.user}</span>
                <span className="text-white/80 text-sm font-normal">{msg.message}</span>
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
                  className="flex flex-col"
                >
                  <span className="text-white font-bold text-sm">{msg.user}</span>
                  <span className="text-white/80 text-sm font-normal">{msg.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Comment Input - during multi-spin pending, the input is autofilled with a
            draft request the buyer can tap to send into chat */}
        {(() => {
          const hasDraft = revealPendingSeller && !!requestDraft && !commentRequested
          const draftText = requestDraft ? buildSpotRequestMessage(requestDraft.team.name) : ""
          return (
            <button
              type="button"
              onClick={handleRequestComment}
              aria-disabled={!hasDraft}
              className={`flex w-full items-center gap-2 bg-black/40 backdrop-blur rounded-full px-4 py-3 text-left transition-shadow ${hasDraft ? "ring-1 ring-[#4CE160]/60 cursor-pointer" : "cursor-default"}`}
            >
              {hasDraft ? (
                <>
                  <span className="text-sm flex-1 text-white font-medium">{draftText}</span>
                  <span className="text-[#4CE160] text-xs font-semibold uppercase tracking-wide">Send</span>
                </>
              ) : (
                <span className="text-sm flex-1 text-white/50">Add comment...</span>
              )}
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            </button>
          )
        })()}

        {/* Team Spinner with Spots Available - shown for most concepts. For slot-machine (Team Picker),
            battle, and carousel it stays in its idle/zero state (thumbnail) since those concepts
            handle their own cycling + reveal full screen (isSpinnerRevealing is never set for them). */}
        {selectedAnimation !== "card-flip" && selectedAnimation !== "single-spin-populate" && selectedAnimation !== "pick-card" && selectedAnimation !== "multi-spin" && selectedAnimation !== "multi-spin-2" && selectedAnimation !== "multi-spin-4" && selectedAnimation !== "multi-spin-4-auto" && selectedAnimation !== "multi-spin-4-chips" && selectedAnimation !== "multi-spin-4-chips-no-label" && selectedAnimation !== "thumbnails" && selectedAnimation !== "thumbnails-2" && selectedAnimation !== "thumbnails-3" && selectedAnimation !== "thumbnails-4" && (
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

        {/* Single Spin Populate (No Label): same flow, but the randomizer grows as the chip populates */}
        {selectedAnimation === "single-spin-populate" && (
          <SingleSpinChipPopulateSpinner
            totalSpots={32}
            availableSpots={demoSpots}
            isSpinning={isMultiSpinning}
            pendingSpot={multiPendingSpot === 1 ? 1 : null}
            pendingSeller={revealPendingSeller}
            onAnnounce={handleMultiSelect}
            onCycleSpots={cycleSpots}
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
            availableSpots={demoSpots}
            isSpinning={isMultiSpinning}
            pendingSpot={multiPendingSpot === 4 ? null : multiPendingSpot}
            pendingSeller={revealPendingSeller}
            onSpotsLanded={handleSpotsLanded}
            onCycleSpots={cycleSpots}
            onViewSpots={() => setIsBreakSpotsOpen(true)}
          />
        )}

        {/* Multi-Spin 4 Chips (No Label): same auto chip flow, but chips populate without a leading label */}
        {selectedAnimation === "multi-spin-4-chips-no-label" && (
          <MultiSpin4ChipsNoLabelSpinner
            totalSpots={32}
            availableSpots={demoSpots}
            isSpinning={isMultiSpinning}
            pendingSpot={multiPendingSpot === 4 ? null : multiPendingSpot}
            pendingSeller={revealPendingSeller}
            onSpotsLanded={handleSpotsLanded}
            onCycleSpots={cycleSpots}
            onViewSpots={() => setIsBreakSpotsOpen(true)}
          />
        )}

        {/* Auction Card */}
        <div className="bg-black/40 backdrop-blur rounded-2xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-2">
              <p className="text-sm text-white mb-0.5 line-clamp-2">
                <span className="font-semibold">{(showWinner || spotAssigned) && winnerTeam ? `${winnerTeam.city} ${winnerTeam.name}` : 'Random Break'}</span>
              </p>
              {selectedAnimation !== "thumbnails-2" && selectedAnimation !== "thumbnails-3" && selectedAnimation !== "thumbnails-4" && selectedAnimation !== "card-flip" && selectedAnimation !== "single-spin-populate" && selectedAnimation !== "multi-spin-repeat" && selectedAnimation !== "multi-spin" && selectedAnimation !== "multi-spin-2" && selectedAnimation !== "multi-spin-4" && selectedAnimation !== "multi-spin-4-auto" && selectedAnimation !== "multi-spin-4-chips" && selectedAnimation !== "multi-spin-4-chips-no-label" && selectedAnimation !== "pack-rip" && selectedAnimation !== "gift-reveal" && selectedAnimation !== "slot-machine" && selectedAnimation !== "battle" && selectedAnimation !== "carousel" && (
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
                  setDemoSpots((prev) => Math.max(0, prev - 1)) // Winning a bid claims a spot
                  setSpotAssigned(false) // Reset item card title to "Random Break" for the new round
                  chatPausedRef.current = true // Pause chat immediately when bid is placed

                  // Play the crown "WINNER" celebration first; the randomizer
                  // kicks off once it finishes (see WinnerCrownReveal onComplete).
                  setShowWinnerCrown(true)
                }}
                onReset={() => {
                  // Reset the entire concept
                  setHasWon(false)
                  setShowWinnerCrown(false)
                  setIsSpinnerRevealing(false)
                  setIsSpinnerPending(false)
                  setIsMultiSpinning(false)
                  setMultiPendingSpot(null)
                  setSpotAssigned(false)
                  setRevealPendingSeller(false)
                  setSpunSpots([])
                  setCommentRequested(false)
                  setRequestDraft(null)
                  if (assignFallbackRef.current) clearTimeout(assignFallbackRef.current)
                  pendingSpotRef.current = null
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
                    ? "bg-zinc-800 text-white ring-2 ring-inset ring-yellow-400"
                    : "bg-zinc-800 text-white/70 hover:bg-zinc-700"
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

      {/* Crown "WINNER" celebration - plays right after a bid win, before the randomizer */}
      <WinnerCrownReveal
        isRevealing={showWinnerCrown}
        onComplete={() => {
          setShowWinnerCrown(false)
          startConceptReveal()
        }}
      />

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
        spotsAvailable={demoSpots}
        spotsTotal={32}
      />
      </div>
    </div>
  )
}
