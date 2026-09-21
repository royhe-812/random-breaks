"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Star,
  VolumeX,
  X,
} from "lucide-react"

// ─── Data ─────────────────────────────────────────────────────────────────────

const BASE_MESSAGES = [
  { user: "johnpleys", message: "Gotta try to hit this one! Love Mosaic", color: "text-white/60" },
  { user: "Chloepulls11", message: "These are so hot, get your bids in!", color: "text-yellow-400" },
  { user: "chrisjames", message: "So sick", color: "text-white" },
  { user: "cardking99", message: "GL everyone!", color: "text-blue-400" },
  { user: "packripperz", message: "Who got the Burrow last break?", color: "text-purple-400" },
  { user: "sportsfan22", message: "Need that Stroud auto", color: "text-green-400" },
  { user: "rookie_hunter", message: "Herbert please!", color: "text-orange-400" },
  { user: "bigpulls", message: "Let's gooo", color: "text-pink-400" },
  { user: "nfl_cards", message: "Mahomes would be insane", color: "text-red-400" },
  { user: "boxbreaker", message: "Love these random breaks", color: "text-yellow-400" },
  { user: "pullemall", message: "Chiefs or Eagles plz", color: "text-green-400" },
  { user: "firstroundpick", message: "Mosaic hits different", color: "text-purple-400" },
  { user: "cardfiend", message: "What's the case hit?", color: "text-white" },
  { user: "breaker_joe", message: "Pack rip incoming!", color: "text-orange-400" },
  { user: "hittingpacks", message: "GG everyone 🔥", color: "text-pink-400" },
]

const TRADE_BUYERS = [
  { username: "mikibreaks",    color: "bg-blue-500",    wonTeams: ["Dallas Cowboys", "Buffalo Bills"] },
  { username: "cardcollector", color: "bg-emerald-500", wonTeams: ["Philadelphia Eagles", "Detroit Lions"] },
  { username: "nfl_cards",     color: "bg-red-500",     wonTeams: ["Kansas City Chiefs", "Los Angeles Rams"] },
  { username: "Jessica991",    color: "bg-rose-500",    wonTeams: ["San Francisco 49ers", "Seattle Seahawks"] },
  { username: "packripperz",   color: "bg-purple-500",  wonTeams: ["Baltimore Ravens", "Pittsburgh Steelers"] },
  { username: "bigpulls",      color: "bg-amber-500",   wonTeams: ["Denver Broncos"] },
  { username: "cardfiend",     color: "bg-sky-500",     wonTeams: ["Cincinnati Bengals", "Cleveland Browns"] },
  { username: "breaker_joe",   color: "bg-orange-500",  wonTeams: ["Minnesota Vikings"] },
]

const YOUR_NAME = "adam007"
const YOUR_TEAMS = [
  "Green Bay Packers",
  "New England Patriots",
  "Miami Dolphins",
  "New York Giants",
  "Chicago Bears",
  "Arizona Cardinals",
  "Tampa Bay Buccaneers",
  "Los Angeles Chargers",
]

// Two pre-seeded incoming trades to demo navigation
const INITIAL_INCOMING: IncomingTradeItem[] = [
  {
    id: "incoming-1",
    from: "cardcollector",
    fromColor: "bg-emerald-500",
    theyGive: ["Philadelphia Eagles", "Detroit Lions"],
    theyWant: ["Green Bay Packers"],
  },
  {
    id: "incoming-2",
    from: "mikibreaks",
    fromColor: "bg-blue-500",
    theyGive: ["Dallas Cowboys"],
    theyWant: ["New England Patriots"],
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type IncomingTradeItem = {
  id: string
  from: string
  fromColor: string
  theyGive: string[]
  theyWant: string[]
}

type ChatMsg = { user: string; message: string; color: string }
type PendingTrade = { partnerUsername: string; teamsGiven: string[] }

// ─── Component ────────────────────────────────────────────────────────────────

export function TradesV1() {
  const [tradeComment, setTradeComment] = useState("")
  const [visibleMessages, setVisibleMessages] = useState<ChatMsg[]>(BASE_MESSAGES.slice(0, 4))
  const [viewerCount, setViewerCount] = useState(240)

  // Incoming trades array + navigation
  const [incomingTrades, setIncomingTrades] = useState<IncomingTradeItem[]>(INITIAL_INCOMING)
  const [currentTradeIdx, setCurrentTradeIdx] = useState(0)
  const [bannerCollapsed, setBannerCollapsed] = useState(true)

  // Outgoing pending trades
  const [pendingTrades, setPendingTrades] = useState<PendingTrade[]>([])

  // Mute state
  const [muted, setMuted] = useState(false)

  // Drawer state (team selection)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerPartner, setDrawerPartner] = useState<(typeof TRADE_BUYERS)[0] | null>(null)
  const [editGive, setEditGive] = useState<string[]>([])
  const [editGet, setEditGet] = useState<string[]>([])

  const msgIndexRef = useRef(4)
  const chatPausedRef = useRef(false)
  const pendingTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Ensure index stays valid when trades shrink
  const safeIdx = Math.min(currentTradeIdx, Math.max(0, incomingTrades.length - 1))
  const currentTrade = incomingTrades[safeIdx] ?? null
  const tradeCount = incomingTrades.length

  // ── Locks ─────────────────────────────────────────────────────────────────
  const lockedTeams = new Set<string>([
    ...incomingTrades.flatMap(t => t.theyWant),
    ...pendingTrades.flatMap(t => t.teamsGiven),
  ])

  const pendingPartners = new Set<string>([
    ...incomingTrades.map(t => t.from),
    ...pendingTrades.map(t => t.partnerUsername),
  ])

  // ── Chat cycling ──────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (chatPausedRef.current) return
      setVisibleMessages(prev => {
        const next = [...prev.slice(1)]
        next.push(BASE_MESSAGES[msgIndexRef.current % BASE_MESSAGES.length])
        msgIndexRef.current++
        return next
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => Math.max(200, Math.min(300, prev + Math.floor(Math.random() * 9) - 3)))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  // ── Input derived ─────────────────────────────────────────────────────────
  const val = tradeComment
  const showCmdHelper = val === "/"
  const showTradeCommand = !showCmdHelper && val.startsWith("/trade") && !val.startsWith("/trade_")
  const showMuteCommand = !showCmdHelper && val.startsWith("/mute")
  const showUnmuteCommand = !showCmdHelper && val.startsWith("/unmute")

  // ── Navigation ────────────────────────────────────────────────────────────
  const goToPrev = () => setCurrentTradeIdx(i => Math.max(0, i - 1))
  const goToNext = () => setCurrentTradeIdx(i => Math.min(tradeCount - 1, i + 1))

  // ── Trade actions ─────────────────────────────────────────────────────────
  const dismissTrade = useCallback((id: string, accepted: boolean) => {
    if (accepted && currentTrade) {
      chatPausedRef.current = true
      setVisibleMessages(prev => [
        ...prev.slice(1),
        {
          user: YOUR_NAME,
          message: `accepted @${currentTrade.from}'s trade request 🤝`,
          color: "text-[#4CE160]",
        },
      ])
      setTimeout(() => { chatPausedRef.current = false }, 3000)
    }
    setIncomingTrades(prev => {
      const next = prev.filter(t => t.id !== id)
      // Step index back if we were at the end
      setCurrentTradeIdx(i => Math.min(i, Math.max(0, next.length - 1)))
      return next
    })
  }, [currentTrade])

  // ── Drawer ────────────────────────────────────────────────────────────────
  const openDrawerFor = useCallback((buyer: (typeof TRADE_BUYERS)[0]) => {
    setDrawerPartner(buyer)
    setEditGive([])
    setEditGet([])
    setDrawerOpen(true)
    setTradeComment("")
  }, [])

  const sendTradeRequest = useCallback(() => {
    if (!drawerPartner || editGive.length === 0 || editGet.length === 0) return
    const partner = drawerPartner
    const given = [...editGive]

    chatPausedRef.current = true
    setVisibleMessages(prev => [
      ...prev.slice(1),
      {
        user: YOUR_NAME,
        message: `sent a trade request to @${partner.username} · ${given.join(", ")} ↔ ${editGet.join(", ")}`,
        color: "text-[#4CE160]",
      },
    ])
    setPendingTrades(prev => [...prev, { partnerUsername: partner.username, teamsGiven: given }])
    setDrawerOpen(false)
    setDrawerPartner(null)
    setEditGive([])
    setEditGet([])
    setTimeout(() => { chatPausedRef.current = false }, 3000)

    // Simulate partner accepting ~3.5s later
    const t = setTimeout(() => {
      chatPausedRef.current = true
      const textColor = partner.color.replace("bg-", "text-").replace("-500", "-400")
      setVisibleMessages(prev => [
        ...prev.slice(1),
        { user: partner.username, message: "accepted your trade request 🤝", color: textColor },
      ])
      setPendingTrades(prev => prev.filter(p => p.partnerUsername !== partner.username))
      setTimeout(() => { chatPausedRef.current = false }, 3000)
    }, 3500)
    pendingTimeoutsRef.current.push(t)
  }, [drawerPartner, editGive, editGet])

  const toggleGive = (team: string) =>
    setEditGive(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team])
  const toggleGet = (team: string) =>
    setEditGet(prev => prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team])

  const handleMute = () => {
    setMuted(true)
    setIncomingTrades([])
    setTradeComment("")
  }

  const handleUnmute = () => {
    setMuted(false)
    setIncomingTrades(INITIAL_INCOMING)
    setCurrentTradeIdx(0)
    setBannerCollapsed(true)
    setTradeComment("")
  }

  const handleReset = useCallback(() => {
    pendingTimeoutsRef.current.forEach(clearTimeout)
    pendingTimeoutsRef.current = []
    setTradeComment("")
    setVisibleMessages(BASE_MESSAGES.slice(0, 4))
    setIncomingTrades(INITIAL_INCOMING)
    setCurrentTradeIdx(0)
    setBannerCollapsed(true)
    setPendingTrades([])
    setMuted(false)
    setDrawerOpen(false)
    setDrawerPartner(null)
    setEditGive([])
    setEditGet([])
    msgIndexRef.current = 4
    chatPausedRef.current = false
  }, [])

  // ── Buyer list ────────────────────────────────────────────────────────────
  const teamOwners = TRADE_BUYERS.filter(b => b.wonTeams.length > 0)

  const BuyerList = () => (
    <div className="max-h-56 overflow-y-auto pb-1">
      {teamOwners.map(buyer => {
        const inProgress = pendingPartners.has(buyer.username)
        return (
          <button
            key={buyer.username}
            type="button"
            disabled={inProgress}
            onClick={() => !inProgress && openDrawerFor(buyer)}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
              inProgress ? "opacity-50 cursor-not-allowed" : "hover:bg-white/5"
            }`}
          >
            <span className={`flex-shrink-0 w-9 h-9 rounded-full ${buyer.color} flex items-center justify-center text-white text-sm font-bold`}>
              {buyer.username[0].toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white truncate">@{buyer.username}</span>
              <span className="block text-xs text-white/60 truncate">
                {inProgress ? "Trade in progress" : `Holds ${buyer.wonTeams.join(", ")}`}
              </span>
            </span>
            {inProgress && (
              <span className="flex-shrink-0 text-[10px] font-semibold rounded-full bg-yellow-500/20 text-yellow-400 px-2 py-0.5">
                In progress
              </span>
            )}
          </button>
        )
      })}
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  const showBanner = tradeCount > 0 && !muted

  return (
    <div className="relative flex-shrink-0">
      {/* Hardware buttons */}
      <div className="absolute -left-[3.5px] top-[7rem] w-[3.5px] h-6 bg-[#2a2a2e] rounded-l-[2px]" />
      <div className="absolute -left-[3.5px] top-[10rem] w-[3.5px] h-12 bg-[#2a2a2e] rounded-l-[2px]" />
      <div className="absolute -left-[3.5px] top-[15rem] w-[3.5px] h-12 bg-[#2a2a2e] rounded-l-[2px]" />
      <div className="absolute -right-[3.5px] top-[12rem] w-[3.5px] h-20 bg-[#2a2a2e] rounded-r-[2px]" />

      <div className="bg-[#1c1c1e] rounded-[3.25rem] p-[11px] shadow-[0_60px_120px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.07)]">
        <div className="relative w-[390px] overflow-hidden rounded-[2.75rem] bg-black" style={{ aspectRatio: "390/844" }}>
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[200] w-[120px] h-[34px] bg-black rounded-full pointer-events-none" />

          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 z-[190] flex items-end justify-between px-9 pb-1 pointer-events-none" style={{ height: 54 }}>
            <span className="text-white text-[15px] font-semibold tracking-tight">9:41</span>
            <div className="flex items-center gap-[5px] text-white">
              <svg width="17" height="12" viewBox="0 0 17 12" fill="white"><rect x="0" y="4" width="3" height="8" rx="0.8" /><rect x="4.5" y="3" width="3" height="9" rx="0.8" /><rect x="9" y="1.5" width="3" height="10.5" rx="0.8" /><rect x="13.5" y="0" width="3" height="12" rx="0.8" /></svg>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fill="white" /><path d="M3.5 6.5C4.9 5.1 6.35 4.4 8 4.4s3.1.7 4.5 2.1" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" /><path d="M1 4C3 2 5.4 1 8 1s5 1 7 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" /></svg>
              <div className="flex items-center gap-[2px]">
                <div className="relative w-[25px] h-[12px] rounded-[3px] border border-white/70 flex items-center px-[2px]">
                  <div className="h-[7px] w-full bg-white rounded-[1.5px]" />
                </div>
                <div className="w-[2px] h-[5px] bg-white/50 rounded-r-[1px]" />
              </div>
            </div>
          </div>

          {/* Background video */}
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover"
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/case%20breaks%20video%20-w5usFKatykHZfTOkKiurwdJmYPpFxf.mov" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[80%] z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Header */}
          <div className="absolute top-12 left-0 right-0 z-20 p-4">
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 flex items-center justify-center">
                <ChevronDown className="w-6 h-6 text-white" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                <span className="text-white font-semibold text-sm">ryans_cardhouse</span>
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              {muted && (
                <button type="button" onClick={handleUnmute} className="flex items-center gap-1 bg-zinc-800/80 rounded-full px-2 py-0.5 hover:bg-zinc-700/80 transition-colors">
                  <VolumeX className="w-3 h-3 text-white/60" />
                  <span className="text-white/60 text-[10px] font-medium">Trades muted · unmute</span>
                </button>
              )}
            </div>

            {/* Right nav */}
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

          {/* ── Floating collapsed trade pill (right side) ── */}
          <LayoutGroup>
            <AnimatePresence>
              {showBanner && bannerCollapsed && (
                <motion.button
                  layoutId="trade-banner"
                  key="trade-pill"
                  type="button"
                  onClick={() => setBannerCollapsed(false)}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2, type: "spring", damping: 22, stiffness: 320 }}
                  className="absolute right-4 top-[430px] z-[18] flex flex-col items-center gap-1.5 rounded-2xl bg-black/70 backdrop-blur-xl ring-1 ring-[#4CE160]/50 px-2.5 py-3"
                  style={{ width: 48 }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4CE160] animate-pulse" />
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#4CE160]" />
                  <span className="text-[#4CE160] text-[11px] font-bold leading-none">{tradeCount}</span>
                </motion.button>
              )}
            </AnimatePresence>

          {/* ── Bottom UI stack ── */}
          <div className="absolute left-4 right-4 bottom-4 z-20 flex flex-col gap-2 pointer-events-none">

            {/* Flowing chat messages */}
            <div className="space-y-1.5 pr-20">
              <AnimatePresence mode="popLayout">
                {visibleMessages.map((msg, i) => (
                  <motion.div
                    key={`${msg.user}-${msg.message.slice(0, 10)}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    layout
                    className="flex flex-col"
                  >
                    <span className={`${msg.color} font-semibold text-sm`}>{msg.user}</span>
                    <span className="text-white/80 text-sm">{msg.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* ── Persistent incoming trade banner — expanded only ── */}
            <AnimatePresence mode="wait">
              {showBanner && !bannerCollapsed && currentTrade && (
                <motion.div
                  layoutId="trade-banner"
                  key="banner-expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, type: "spring", damping: 22, stiffness: 320 }}
                  className="rounded-2xl bg-black/55 backdrop-blur-sm ring-1 ring-white/12 overflow-hidden pointer-events-auto"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentTrade.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Header row */}
                      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
                        {tradeCount > 1 && (
                          <button
                            type="button"
                            onClick={goToPrev}
                            disabled={safeIdx === 0}
                            className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-25 hover:bg-white/20 transition-colors flex-shrink-0"
                          >
                            <ChevronLeft className="w-3 h-3 text-white" />
                          </button>
                        )}
                        <span className={`w-6 h-6 rounded-full ${currentTrade.fromColor} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                          {currentTrade.from[0].toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-semibold uppercase tracking-widest text-white/40 leading-none mb-0.5">Trade offer</p>
                          <p className="text-[12px] font-semibold text-white truncate leading-tight">@{currentTrade.from}</p>
                        </div>
                        {tradeCount > 1 && (
                          <>
                            <span className="text-white/35 text-[10px] font-medium flex-shrink-0">{safeIdx + 1}/{tradeCount}</span>
                            <button
                              type="button"
                              onClick={goToNext}
                              disabled={safeIdx === tradeCount - 1}
                              className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-25 hover:bg-white/20 transition-colors flex-shrink-0"
                            >
                              <ChevronRight className="w-3 h-3 text-white" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setBannerCollapsed(true)}
                          className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
                        >
                          <Minus className="w-2.5 h-2.5 text-white/50" />
                        </button>
                      </div>

                      {/* Trade columns */}
                      <div className="flex items-start gap-2 px-3 py-2 border-t border-b border-white/8">
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-semibold uppercase tracking-widest text-white/35 mb-1.5">They give</p>
                          <div className="flex flex-wrap gap-1">
                            {currentTrade.theyGive.map(team => (
                              <span key={team} className="inline-flex items-center rounded-md bg-white/12 px-2 py-1 text-[10px] font-medium text-white/85 leading-none">
                                {team}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex-shrink-0 pt-4">
                          <ArrowLeftRight className="w-3 h-3 text-[#4CE160]" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-[8px] font-semibold uppercase tracking-widest text-[#4CE160]/55 mb-1.5">You give</p>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {currentTrade.theyWant.map(team => (
                              <span key={team} className="inline-flex items-center rounded-md bg-[#4CE160]/18 px-2 py-1 text-[10px] font-medium text-[#4CE160] leading-none">
                                {team}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 px-3 pt-2 pb-2.5">
                        <button
                          type="button"
                          onClick={() => dismissTrade(currentTrade.id, false)}
                          className="flex items-center justify-center gap-1 rounded-full bg-white/8 px-3.5 py-2 text-[11px] font-semibold text-white/50 hover:bg-white/15 transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => dismissTrade(currentTrade.id, true)}
                          className="flex-1 flex items-center justify-center gap-1 rounded-full bg-[#4CE160] px-3 py-2 text-[11px] font-semibold text-black hover:bg-[#43c955] transition-colors"
                        >
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                          Accept trade
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Comment input with /trade command ── */}
            <div className="relative w-full pointer-events-auto">
              <AnimatePresence>
                {/* Generic "/" helper */}
                {showCmdHelper && (
                  <motion.div
                    key="cmd-helper"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl ring-1 ring-white/10"
                  >
                    <div className="px-4 pt-3 pb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Commands</span>
                    </div>
                    <div className="pb-1">
                      <button type="button" onClick={() => setTradeComment("/trade ")}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors">
                        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                          <ArrowLeftRight className="w-4 h-4 text-[#4CE160]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-white">/trade</span>
                          <span className="block text-xs text-white/50">Request a trade with another buyer</span>
                        </span>
                      </button>
                      {muted ? (
                        <button type="button" onClick={handleUnmute}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors">
                          <span className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                            <VolumeX className="w-4 h-4 text-[#4CE160]" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-white">/unmute_trades</span>
                            <span className="block text-xs text-white/50">Resume receiving trade requests</span>
                          </span>
                        </button>
                      ) : (
                        <button type="button" onClick={handleMute}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors">
                          <span className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                            <VolumeX className="w-4 h-4 text-white/60" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-white">/mute_trades</span>
                            <span className="block text-xs text-white/50">Stop receiving incoming trade requests</span>
                          </span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* /trade — buyer list popup */}
                {showTradeCommand && (
                  <motion.div
                    key="trade-cmd"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl ring-1 ring-white/10"
                  >
                    <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-white/50" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Trade with a buyer</span>
                    </div>
                    <BuyerList />
                  </motion.div>
                )}

                {/* /mute_trades or /unmute_trades */}
                {(showMuteCommand || showUnmuteCommand) && (
                  <motion.div
                    key="mute-cmd"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl ring-1 ring-white/10"
                  >
                    <div className="px-4 pt-3 pb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Commands</span>
                    </div>
                    {muted || showUnmuteCommand ? (
                      <button type="button" onClick={handleUnmute}
                        className="flex w-full items-center gap-3 px-4 py-2.5 pb-3 text-left hover:bg-white/5 transition-colors">
                        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                          <VolumeX className="w-4 h-4 text-[#4CE160]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-white">/unmute_trades</span>
                          <span className="block text-xs text-white/50">Resume receiving trade requests</span>
                        </span>
                      </button>
                    ) : (
                      <button type="button" onClick={handleMute}
                        className="flex w-full items-center gap-3 px-4 py-2.5 pb-3 text-left hover:bg-white/5 transition-colors">
                        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                          <VolumeX className="w-4 h-4 text-white/60" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-white">/mute_trades</span>
                          <span className="block text-xs text-white/50">Stop receiving incoming trade requests</span>
                        </span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex w-full items-center gap-2 rounded-full bg-black/40 px-4 py-3 backdrop-blur">
                <input
                  type="text"
                  value={tradeComment}
                  onChange={e => setTradeComment(e.target.value)}
                  placeholder="Comment or /trade..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
                />
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              </div>
            </div>

            {/* Auction card */}
            <div className="bg-black/40 backdrop-blur rounded-2xl p-4 pointer-events-auto">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm text-white mb-0.5 font-semibold truncate">Random Break #15</p>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg">$28.00</span>
                    <div className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6.2998 1C7.37676 1 8.25 1.87324 8.25 2.9502V3.75H9.38965C9.8451 3.75004 10.2759 3.95696 10.5605 4.3125L11.6709 5.70117C11.8838 5.96724 12 6.29819 12 6.63867V8C11.9999 8.82823 11.3285 9.5 10.5 9.5H9.5C9.5 10.3284 8.82843 11 8 11C7.17157 11 6.5 10.3284 6.5 9.5H4C4 10.3284 3.32843 11 2.5 11C1.67157 11 1 10.3284 1 9.5H0.75C0.335786 9.5 0 9.16421 0 8.75C0 8.33579 0.335786 8 0.75 8H6.2998C6.54833 8 6.75 7.79833 6.75 7.5498V2.9502C6.75 2.70167 6.54833 2.5 6.2998 2.5H0.75C0.335786 2.5 0 2.16421 0 1.75C0 1.33579 0.335786 1 0.75 1H6.2998ZM8.25 7.5498C8.25 7.70495 8.22955 7.85531 8.19531 8H10.5V6.6377L9.38965 5.25H8.25V7.5498ZM3.75 4.5C4.16421 4.5 4.5 4.83579 4.5 5.25C4.5 5.66421 4.16421 6 3.75 6H0.75C0.335786 6 0 5.66421 0 5.25C0 4.83579 0.335786 4.5 0.75 4.5H3.75Z" fill="rgba(255,255,255,0.5)" /></svg>
                      <span className="text-white/50 text-sm">$5 shipping</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0 mt-1" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-green-400 font-medium text-sm">Jessica991</span>
                  <span className="text-white/60 text-sm">is winning</span>
                </div>
                <div className="flex items-center gap-1.5 text-red-500">
                  <div className="w-4 h-4 rounded-full border-2 border-red-500 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-red-500" />
                  </div>
                  <span className="font-medium text-sm">00:10</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-5 py-2.5 rounded-full font-medium text-sm border border-white/30 text-white hover:bg-white/10 transition-colors">
                  Max bid
                </button>
                <button onClick={handleReset} className="flex-1 py-2.5 rounded-full font-semibold text-sm bg-green-500 hover:bg-green-400 text-black transition-colors">
                  Bid $30
                </button>
              </div>
            </div>
          </div>
          </LayoutGroup>

          {/* ── Team selection bottom drawer ── */}
          <AnimatePresence>
            {drawerOpen && drawerPartner && (
              <>
                <motion.div
                  className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDrawerOpen(false)}
                />
                <motion.div
                  className="absolute inset-x-0 bottom-0 z-[70] flex max-h-[82%] flex-col overflow-hidden rounded-t-3xl bg-zinc-900/90 backdrop-blur-2xl ring-1 ring-white/10"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                >
                  <div className="flex items-center justify-between px-5 pb-3 pt-4">
                    <h2 className="text-base font-semibold text-white">New trade</h2>
                    <button type="button" onClick={() => setDrawerOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Trading with */}
                  <div className="mx-5 mb-3 flex items-center justify-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">A</span>
                      <span className="text-[11px] text-white/60">You</span>
                    </div>
                    <ArrowLeftRight className="h-5 w-5 text-[#4CE160]" />
                    <div className="flex flex-col items-center gap-1">
                      <span className={`w-10 h-10 rounded-full ${drawerPartner.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {drawerPartner.username[0].toUpperCase()}
                      </span>
                      <span className="text-[11px] text-white/60">@{drawerPartner.username}</span>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
                    {/* You give */}
                    <div className="mb-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-white/50">You give</span>
                        <span className="text-xs text-white/40">Your teams</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {YOUR_TEAMS.map(team => {
                          const locked = lockedTeams.has(team)
                          const selected = editGive.includes(team)
                          return (
                            <button key={team} type="button" disabled={locked}
                              onClick={() => !locked && toggleGive(team)} aria-pressed={selected}
                              className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                                locked
                                  ? "bg-white/5 ring-1 ring-white/10 opacity-40 cursor-not-allowed"
                                  : selected
                                    ? "bg-[#4CE160]/15 ring-1 ring-[#4CE160]"
                                    : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                              }`}
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-white">{team}</span>
                                {locked && <span className="text-[10px] text-yellow-400/80">In pending trade</span>}
                              </div>
                              <span className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center ${
                                selected ? "border-[#4CE160] bg-[#4CE160]" : "border-white/30"
                              }`}>
                                {selected && <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* You get */}
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-white/50">You get</span>
                        <span className="text-xs text-white/40">@{drawerPartner.username}&apos;s teams</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {drawerPartner.wonTeams.map(team => {
                          const selected = editGet.includes(team)
                          return (
                            <button key={team} type="button" onClick={() => toggleGet(team)} aria-pressed={selected}
                              className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                                selected ? "bg-[#4CE160]/15 ring-1 ring-[#4CE160]" : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                              }`}
                            >
                              <span className="text-sm font-medium text-white">{team}</span>
                              <span className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center ${
                                selected ? "border-[#4CE160] bg-[#4CE160]" : "border-white/30"
                              }`}>
                                {selected && <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 px-5 pb-6 pt-3">
                    <button type="button" disabled={editGive.length === 0 || editGet.length === 0}
                      onClick={sendTradeRequest}
                      className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold transition-colors ${
                        editGive.length && editGet.length
                          ? "bg-[#4CE160] text-black hover:bg-[#43c955]"
                          : "cursor-not-allowed bg-white/10 text-white/40"
                      }`}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                      Send trade request
                    </button>
                    <p className="text-center text-xs text-white/40 mt-2">
                      Giving {editGive.length} · Getting {editGet.length}
                    </p>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[200] w-32 h-[5px] bg-white/40 rounded-full pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

