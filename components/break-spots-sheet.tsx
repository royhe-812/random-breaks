"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronDown, ChevronUp, Search } from "lucide-react"

// Helper function for progress color
const getProgressColor = (percentage: number) => {
  if (percentage > 50) return "#4CE160" // Green
  if (percentage > 30) return "#F5A623" // Yellow/Orange
  return "#FF4444" // Red
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/60 text-xs">{spotsAvailable}/{spotsTotal} spots available</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            backgroundColor: getProgressColor(percentage),
                            width: `${percentage}%` 
                          }}
                        />
                      </div>
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
                          <div key={team.abbrev} className="py-2">
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
                            <div className="flex items-center gap-2">
                              <span className="text-white/50 text-xs">{team.buyer}</span>
                              <span className="text-[10px] font-medium text-white/50 bg-white/10 rounded px-1.5 py-0.5">
                                SOLD
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export { BreakSpotsSheet }
