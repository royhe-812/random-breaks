"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, ChevronRight, ChevronsRight, Dice5, Heart, Star } from "lucide-react"
import { teams, type Team } from "@/components/team-spinner"

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

// Isolated Team Spinner for In-Stream
function InStreamSpinner({ 
  onSpinComplete, 
  isSpinning, 
  onStartSpin,
  disabled,
  username
}: {
  onSpinComplete: (team: Team) => void
  isSpinning: boolean
  onStartSpin: () => void
  disabled: boolean
  username?: string
}) {
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0)
  const [spinPhase, setSpinPhase] = useState<"idle" | "fast" | "slowing" | "stopped">("idle")
  const [spinSpeed, setSpinSpeed] = useState(50)
  const targetTeamIndexRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const playTickSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') ctx.resume()
      
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03)
      oscillator.type = 'square'
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.04)
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    if (!isSpinning && spinPhase !== "idle") {
      setSpinPhase("idle")
      setSpinSpeed(50)
    }
  }, [isSpinning, spinPhase])

  const startSpin = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * teams.length)
    targetTeamIndexRef.current = randomIndex
    setSpinPhase("fast")
    setSpinSpeed(50)
    onStartSpin()
  }, [onStartSpin])

  useEffect(() => {
    if (spinPhase === "idle" || spinPhase === "stopped") return
    const interval = setInterval(() => {
      setCurrentTeamIndex(prev => (prev + 1) % teams.length)
      playTickSound()
    }, spinSpeed)
    return () => clearInterval(interval)
  }, [spinPhase, spinSpeed, playTickSound])

  useEffect(() => {
    if (spinPhase === "fast") {
      const timer = setTimeout(() => setSpinPhase("slowing"), 1500)
      return () => clearTimeout(timer)
    }
  }, [spinPhase])

  useEffect(() => {
    if (spinPhase === "slowing" && targetTeamIndexRef.current !== null) {
      const targetIndex = targetTeamIndexRef.current
      const slowdownInterval = setInterval(() => {
        setSpinSpeed(prev => {
          const newSpeed = prev + 30
          if (newSpeed >= 400) {
            clearInterval(slowdownInterval)
            setCurrentTeamIndex(targetIndex)
            setSpinPhase("stopped")
            // Directly call onSpinComplete after landing - NO reveal screen
            setTimeout(() => onSpinComplete(teams[targetIndex]), 500)
            return 400
          }
          return newSpeed
        })
      }, 200)
      return () => clearInterval(slowdownInterval)
    }
  }, [spinPhase, onSpinComplete])

  const currentTeam = teams[currentTeamIndex]

  return (
    <motion.div 
      className="relative bg-black/40 backdrop-blur rounded-xl overflow-hidden w-full"
      animate={{
        boxShadow: spinPhase !== "idle" 
          ? `0 0 20px ${currentTeam.color}40, 0 0 40px ${currentTeam.color}20`
          : "none"
      }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg relative overflow-hidden"
              style={{ 
                backgroundColor: spinPhase === "idle" ? "#3f3f46" : currentTeam.color 
              }}
            >
              {spinPhase === "idle" ? (
                <Dice5 className="w-6 h-6" />
              ) : (
                currentTeam.abbrev
              )}
            </motion.div>
            <div className="flex flex-col">
              <motion.span
                key={spinPhase === "idle" ? "idle" : currentTeam.name}
                className="text-white font-semibold text-lg"
              >
                {spinPhase === "idle" ? "Your Spot Assignment" : `${currentTeam.city} ${currentTeam.name}`}
              </motion.span>
              <span className="text-white/50 text-sm">
                {username ? `${username}'s Spot` : "Win a spot to spin"}
              </span>
            </div>
          </div>
          <motion.button
            onClick={spinPhase === "idle" ? startSpin : undefined}
            disabled={disabled || spinPhase !== "idle"}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-colors ${
              disabled || spinPhase !== "idle"
                ? 'bg-zinc-700 text-white/40 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-black'
            }`}
          >
            {spinPhase === "idle" ? "Tap to spin" : "Spinning"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// Winner Chat Announcement with glow and wipe gradient
function WinnerAnnouncement({ username, team, show }: { username: string; team: Team; show: boolean }) {
  if (!show) return null
  
  return (
    <motion.div
      className="relative px-4 py-3 rounded-xl overflow-hidden bg-black/50 backdrop-blur w-full"
      style={{
        boxShadow: `0 0 30px ${team.color}60, 0 0 60px ${team.color}30`,
      }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Animated glow border */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          border: `2px solid ${team.color}`,
          boxShadow: `inset 0 0 20px ${team.color}30`,
        }}
        animate={{
          boxShadow: [
            `inset 0 0 20px ${team.color}30`,
            `inset 0 0 40px ${team.color}50`,
            `inset 0 0 20px ${team.color}30`,
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Sweeping wipe gradient */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: "linear-gradient(to right, transparent, #4CE16050, #4CE160, #4CE16050, transparent)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />

      {/* Content */}
      <p className="relative z-10 text-sm">
        <span className="font-bold text-white">{username}:</span>
        <span className="ml-2 text-xl">👑</span>
        <span className="text-white/90 ml-1">Won</span>
        <span 
          className="font-bold ml-1"
          style={{ color: team.color === "#FFB612" ? "#fff" : team.color }}
        >
          {team.city} {team.name}!
        </span>
      </p>
    </motion.div>
  )
}

export function InStreamExperience() {
  const [hasWon, setHasWon] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [winnerTeam, setWinnerTeam] = useState<Team | null>(null)
  const [showWinner, setShowWinner] = useState(false)
  const [visibleMessages, setVisibleMessages] = useState(chatMessages.slice(0, 3))
  const [viewerCount, setViewerCount] = useState(240)
  const messageIndexRef = useRef(3)
  const chatPausedRef = useRef(false)

  // Rotate chat messages (uses ref to check pause)
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

  // Fluctuate viewer count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 9) - 3
        return Math.max(200, Math.min(300, prev + change))
      })
    }, 2000 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [])

  const handleStartSpin = useCallback(() => {
    setIsSpinning(true)
  }, [])

  const handleSpinComplete = useCallback((team: Team) => {
    setSelectedTeam(team)
    setWinnerTeam(team)
    setShowWinner(true)
    chatPausedRef.current = true
    
    // After 10 seconds, reset everything
    setTimeout(() => {
      chatPausedRef.current = false
      setShowWinner(false)
      setWinnerTeam(null)
      setIsSpinning(false)
      setHasWon(false)
      setSelectedTeam(null)
    }, 10000)
  }, [])

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
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      
      {/* eBay Live Header */}
      <div className="absolute top-12 left-0 right-0 z-20 p-4">
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
        
        {/* Right side action buttons */}
        <div className="absolute top-4 right-4">
          <div className="bg-black/40 backdrop-blur rounded-3xl px-2 py-3 flex flex-col items-center gap-2">
            <div className="flex flex-col items-center">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Stream%20navigation%20avatar-kd9nUvhPaYGQGCKYioJLK4vLokIQ87.png" alt="Live" className="w-10 h-10" />
              <span className="text-white text-xs font-medium mt-1">{viewerCount}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/items-lRJIiXEXUI5vZJg8YwpehK7c6cPcIp.png" alt="Items" className="w-6 h-6" />
              </div>
              <span className="text-white text-xs font-medium mt-1">Items</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wallet-DJozjl9ngzsbQkbB6XZaj8GAvfXwO3.png" alt="Wallet" className="w-6 h-6" />
              </div>
              <span className="text-white text-xs font-medium mt-1">Wallet</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/polls-TLiAJGRZLHuSvOrQ9KyfrufvDyhfjC.png" alt="Polls" className="w-6 h-6" />
              </div>
              <span className="text-white text-xs font-medium mt-1">Polls</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/more-7JAmofygtcnGhXf8oMlQuYxSkAZxTC.png" alt="More" className="w-6 h-6" />
              </div>
              <span className="text-white text-xs font-medium mt-1">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom UI Stack */}
      <div className="absolute left-4 right-4 bottom-4 z-20 flex flex-col gap-3">
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

        {/* Winner Announcement - shows in chat area */}
        {winnerTeam && (
          <WinnerAnnouncement 
            username="KemMajed90"
            team={winnerTeam}
            show={showWinner}
          />
        )}

        {/* Comment Input */}
        <div className="flex items-center bg-black/40 backdrop-blur rounded-full px-4 py-3">
          <span className="text-white/50 text-sm flex-1">Add comment...</span>
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        </div>

        {/* Team Spinner */}
        <InStreamSpinner
          isSpinning={isSpinning}
          onStartSpin={handleStartSpin}
          onSpinComplete={handleSpinComplete}
          disabled={!hasWon}
          username={hasWon ? "KemMajed90" : undefined}
        />

        {/* Auction Card */}
        <div className="bg-black/40 backdrop-blur rounded-2xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-2">
              <p className="text-sm text-white mb-0.5 line-clamp-2">
                <span className="font-semibold">{selectedTeam ? selectedTeam.name : 'Random team'}</span>
                <span className="text-white/50"> - 16X 2023 Panini Mosaic NFL Blaster</span>
              </p>
              <p className="text-white/50 text-sm mb-1">16/32 spots available</p>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg">{hasWon ? '$30.00' : '$28.00'}</span>
                <div className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
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
              onClick={() => !hasWon && setHasWon(true)}
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
    </div>
  )
}
