"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { Team } from "@/components/team-spinner"

interface WinnerAnnouncementProps {
  username: string
  team: Team
  show: boolean
}

export function WinnerChatAnnouncement({ username, team, show }: WinnerAnnouncementProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="relative px-4 py-3 rounded-xl overflow-hidden bg-black/40 backdrop-blur w-full"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            boxShadow: `0 0 30px ${team.color}50, 0 0 60px ${team.color}30`,
          }}
        >
          {/* Animated glow border */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              border: `1px solid ${team.color}60`,
            }}
            animate={{
              boxShadow: [
                `0 0 20px ${team.color}50, inset 0 0 15px ${team.color}15`,
                `0 0 40px ${team.color}70, inset 0 0 25px ${team.color}25`,
                `0 0 20px ${team.color}50, inset 0 0 15px ${team.color}15`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Sweeping gradient wipe (left to right) */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: "linear-gradient(to right, transparent, #4CE16050, #4CE160, #4CE16050, transparent)",
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Content */}
          <div className="relative z-10">
            <p className="text-sm whitespace-nowrap">
              <span className="font-bold text-white">{username}:</span>
              <span className="ml-1">👑</span>
              <span className="text-white/90 ml-1">Won</span>
              <span 
                className="font-bold ml-1"
                style={{ color: team.color === "#FFB612" ? "#fff" : team.color }}
              >
                {team.city} {team.name}!
              </span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
