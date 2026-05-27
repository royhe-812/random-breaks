"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Search } from "lucide-react"

// Helper function for progress color
const getProgressColor = (percentage: number) => {
  if (percentage > 50) return "#4CE160" // Green
  if (percentage > 30) return "#F5A623" // Yellow/Orange
  return "#FF4444" // Red
}

// Circular progress component
const CircularProgress = ({ available, total, size = 16 }: { available: number; total: number; size?: number }) => {
  const percentage = (available / total) * 100
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  return (
    <svg className="transform -rotate-90" width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getProgressColor(percentage)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
      />
    </svg>
  )
}

// Sample teams data
const teams = [
  { city: "Kansas City", name: "Chiefs", abbrev: "KC" },
  { city: "Philadelphia", name: "Eagles", abbrev: "PHI" },
  { city: "San Francisco", name: "49ers", abbrev: "SF" },
  { city: "Dallas", name: "Cowboys", abbrev: "DAL" },
  { city: "Buffalo", name: "Bills", abbrev: "BUF" },
  { city: "Miami", name: "Dolphins", abbrev: "MIA" },
]

// Break Spots Sheet Component
function BreakSpotsSheet({ 
  isOpen, 
  onClose,
  spotsAvailable,
  spotsTotal,
}: { 
  isOpen: boolean
  onClose: () => void
  spotsAvailable: number
  spotsTotal: number
}) {
  const [activeFilter, setActiveFilter] = useState("Auctions")
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const filters = ["Available", "Deals", "Auctions", "Buy It"]
  
  const featuredTeam = teams[0]
  const otherTeams = teams.slice(1, 6)
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 top-16 bg-[#1a1a1a] rounded-t-3xl z-50 flex flex-col overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {showHowItWorks ? (
              <>
                {/* How It Works Header */}
                <div className="flex items-center gap-3 px-4 py-4">
                  <button 
                    onClick={() => setShowHowItWorks(false)}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <h2 className="text-white font-semibold text-lg">How it works</h2>
                </div>
                
                {/* How It Works Content */}
                <div className="flex-1 overflow-y-auto px-4 pb-8">
                  <h3 className="text-white font-semibold text-lg mb-4">How Case Breaks Work</h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#4CE160] text-black flex items-center justify-center text-sm font-semibold flex-shrink-0">1</div>
                      <div>
                        <p className="text-white font-medium mb-1">Choose Your Spot</p>
                        <p className="text-white/60 text-sm">Select a team or player from the board. Each spot gives you all cards from that team/player.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#4CE160] text-black flex items-center justify-center text-sm font-semibold flex-shrink-0">2</div>
                      <div>
                        <p className="text-white font-medium mb-1">Random Selection</p>
                        <p className="text-white/60 text-sm">When you bid, you&apos;re entered into a randomizer that selects your team. The more you bid, the more chances to win!</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#4CE160] text-black flex items-center justify-center text-sm font-semibold flex-shrink-0">3</div>
                      <div>
                        <p className="text-white font-medium mb-1">Watch Live</p>
                        <p className="text-white/60 text-sm">The streamer opens packs live on camera. When your team&apos;s cards are pulled, they&apos;re yours!</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#4CE160] text-black flex items-center justify-center text-sm font-semibold flex-shrink-0">4</div>
                      <div>
                        <p className="text-white font-medium mb-1">Cards Ship</p>
                        <p className="text-white/60 text-sm">After the break, all your cards are shipped directly to you. Hits and base cards included.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-4">
                  <button 
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <h2 className="text-white font-semibold text-lg">Break spots</h2>
                </div>
                
                {/* Search Bar */}
                <div className="px-4 mb-3">
                  <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-full px-4 py-2.5">
                    <Search className="w-4 h-4 text-white/50" />
                    <input
                      type="text"
                      placeholder="Search item title"
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-white/50 outline-none"
                    />
                  </div>
                </div>
                
                {/* Filter Tabs */}
                <div className="flex gap-2 px-4 mb-4 overflow-x-auto">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        activeFilter === filter
                          ? "bg-white text-black"
                          : "bg-[#2a2a2a] text-white"
                      }`}
                    >
                      {filter === "Deals" && "⚡ "}
                      {filter}
                    </button>
                  ))}
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 pb-8">
                  {/* Product Info Card */}
                  <div className="relative mb-4">
                    <div className="bg-[#2a2a2a] rounded-2xl p-3">
                      <div className="flex gap-3">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-[#3a3a3a] rounded-xl flex items-center justify-center overflow-hidden">
                          <img 
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Image-pTVuzQXm3tPfRoutZsJGiWKXwCK9yL.png"
                            alt="Product"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Product Info */}
                        <div className="flex-1">
                          <h3 className="text-white font-medium text-sm mb-1">
                            2025 Panini Luminance Football Hobby PYT Box Break #903
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <CircularProgress available={spotsAvailable} total={spotsTotal} size={16} />
                            <span className="text-white/60 text-xs">{spotsAvailable}/{spotsTotal} spots available</span>
                          </div>
                          <button 
                            onClick={() => setShowHowItWorks(true)}
                            className="text-[#707070] text-xs font-medium underline"
                          >
                            How it works
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Featured Team Section */}
                  <div className="mb-4 pb-4 border-b border-white/10">
                    <div className="mb-2">
                      <span className="text-[10px] font-semibold text-green-400 border border-green-400 rounded px-1.5 py-0.5">
                        FEATURED
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-medium">{featuredTeam.city} {featuredTeam.name}</p>
                        <p className="text-white font-bold text-lg">$30.00</p>
                        <div className="flex items-center gap-1">
                          <span className="text-white/50 text-xs">$5 shipping</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-red-400">
                        <span className="text-sm font-medium">00:10</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-[#4CE160] text-black font-semibold py-3 rounded-full text-sm">
                      Bid in stream
                    </button>
                  </div>
                  
                  {/* Other Team Spots List */}
                  {otherTeams.map((team) => (
                    <div key={team.abbrev} className="flex items-center justify-between py-3 border-b border-white/10">
                      <div>
                        <p className="text-white font-medium">{team.city} {team.name}</p>
                        <p className="text-white font-bold">$1.00</p>
                        <span className="text-white/50 text-xs">$5 shipping</span>
                      </div>
                      <span className="text-white/40 text-xs font-medium border border-white/20 rounded px-2 py-1">
                        STARTING SOON
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export { BreakSpotsSheet }