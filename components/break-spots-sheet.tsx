"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronDown, ChevronUp, Search } from "lucide-react"

// Helper function for progress color - 4-tier: green -> yellow -> orange -> red
// (matches the randomizer arc in the spinner components)
const getProgressColor = (percentage: number) => {
  const ratio = percentage / 100
  if (ratio <= 0.25) return "#ef4444" // red
  if (ratio <= 0.5) return "#f97316" // orange
  if (ratio <= 0.75) return "#eab308" // yellow
  return "#22c55e" // green
}

// Circular progress component (same as in team-spinner)
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

// All 32 NFL teams
const allTeams = [
  { city: "Kansas City", name: "Chiefs", abbrev: "KC" },
  { city: "Philadelphia", name: "Eagles", abbrev: "PHI" },
  { city: "Dallas", name: "Cowboys", abbrev: "DAL" },
  { city: "San Francisco", name: "49ers", abbrev: "SF" },
  { city: "Buffalo", name: "Bills", abbrev: "BUF" },
  { city: "Miami", name: "Dolphins", abbrev: "MIA" },
  { city: "Baltimore", name: "Ravens", abbrev: "BAL" },
  { city: "Detroit", name: "Lions", abbrev: "DET" },
  { city: "Green Bay", name: "Packers", abbrev: "GB" },
  { city: "Cincinnati", name: "Bengals", abbrev: "CIN" },
  { city: "New York", name: "Jets", abbrev: "NYJ" },
  { city: "Denver", name: "Broncos", abbrev: "DEN" },
  { city: "Los Angeles", name: "Chargers", abbrev: "LAC" },
  { city: "Indianapolis", name: "Colts", abbrev: "IND" },
  { city: "Houston", name: "Texans", abbrev: "HOU" },
  { city: "Pittsburgh", name: "Steelers", abbrev: "PIT" },
  { city: "New England", name: "Patriots", abbrev: "NE" },
  { city: "New York", name: "Giants", abbrev: "NYG" },
  { city: "Washington", name: "Commanders", abbrev: "WAS" },
  { city: "Chicago", name: "Bears", abbrev: "CHI" },
  { city: "Minnesota", name: "Vikings", abbrev: "MIN" },
  { city: "New Orleans", name: "Saints", abbrev: "NO" },
  { city: "Atlanta", name: "Falcons", abbrev: "ATL" },
  { city: "Carolina", name: "Panthers", abbrev: "CAR" },
  { city: "Tampa Bay", name: "Buccaneers", abbrev: "TB" },
  { city: "Arizona", name: "Cardinals", abbrev: "ARI" },
  { city: "Los Angeles", name: "Rams", abbrev: "LAR" },
  { city: "Seattle", name: "Seahawks", abbrev: "SEA" },
  { city: "Las Vegas", name: "Raiders", abbrev: "LV" },
  { city: "Jacksonville", name: "Jaguars", abbrev: "JAX" },
  { city: "Tennessee", name: "Titans", abbrev: "TEN" },
  { city: "Cleveland", name: "Browns", abbrev: "CLE" },
]

// Pre-sold teams (16 sold to match 16/32 available)
const soldTeamIndices = [0, 3, 5, 7, 10, 12, 14, 17, 19, 21, 23, 25, 27, 29, 30, 31]
const soldTeams = soldTeamIndices.map((index, i) => ({
  ...allTeams[index],
  buyer: ["KemMajed90", "BestCollector", "CardKing22", "SportsGuru", "PackRipper", "HobbyFan", "CardChaser", "BigHits", "TopPulls", "RookieHunter", "GradedGems", "WaxBreaker", "HitMaker", "CardShark", "BoxBreaker", "SerialHunter"][i],
  price: [28, 35, 22, 45, 18, 32, 25, 40, 30, 28, 35, 22, 45, 18, 32, 25][i]
}))

const availableTeams = allTeams.filter((_, index) => !soldTeamIndices.includes(index))

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
  const [activeFilter, setActiveFilter] = useState("Available")
  const [availableExpanded, setAvailableExpanded] = useState(true)
  const [soldExpanded, setSoldExpanded] = useState(true)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const filters = ["Available", "Sold", "Auctions", "Buy It Now"]
  
  const percentage = (spotsAvailable / spotsTotal) * 100
  
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
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-white/30 rounded-full" />
            </div>
            
            {showHowItWorks ? (
              <>
                {/* How It Works Header */}
                <div className="flex items-center gap-3 px-4 py-3">
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
            <div className="flex items-center gap-3 px-4 py-3">
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
                  {filter}
                </button>
              ))}
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              {/* Product Info Card */}
              <div className="relative mb-6">
                <div className="bg-[#2a2a2a] rounded-2xl p-3">
                  <div className="flex gap-3">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-[#3a3a3a] rounded-xl flex items-center justify-center overflow-hidden">
                      <img 
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%F0%9F%93%B8%20Image-9iS4XVufx1PUEY9oOKKsmjnhTZzv9F.png"
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-sm mb-2 leading-tight">
                        16X 2023 Panini Mosaic NFL Blaster PYT RAndom #224
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <CircularProgress available={spotsAvailable} total={spotsTotal} size={16} />
                        <span className="text-white/60 text-xs">{spotsAvailable}/{spotsTotal} spots available</span>
                      </div>
                      <button 
                        onClick={() => setShowHowItWorks(true)}
                        className="text-[#707070] text-xs mt-1 underline"
                      >
                        How it works
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Available Section */}
              <div className="mb-4">
                <button 
                  onClick={() => setAvailableExpanded(!availableExpanded)}
                  className="flex items-center justify-between w-full py-3"
                >
                  <span className="text-white font-semibold text-base">Available</span>
                  {availableExpanded ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </button>
                
                <AnimatePresence>
                  {availableExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0">
                        {availableTeams.map((team) => (
                          <div key={team.abbrev} className="py-1">
                            <span className="text-white text-sm">{team.city} {team.name}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Sold Section */}
              <div className="mb-4">
                <button 
                  onClick={() => setSoldExpanded(!soldExpanded)}
                  className="flex items-center justify-between w-full py-3"
                >
                  <span className="text-white font-semibold text-base">Sold</span>
                  {soldExpanded ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </button>
                
                <AnimatePresence>
                  {soldExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0">
                        {soldTeams.map((team) => (
                          <div key={team.abbrev} className="flex items-center justify-between py-2">
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="text-white text-sm">{team.city} {team.name}</span>
                                <ChevronDown className="w-3 h-3 text-white/50 rotate-[-90deg]" />
                              </div>
                              <span className="text-white/50 text-xs">${team.price}.00</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-white/50 text-sm">{team.buyer}</span>
                              <span className="text-[10px] font-bold text-[#FF4444] border border-[#FF4444] rounded-full px-2 py-0.5">
                                SOLD OUT
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
