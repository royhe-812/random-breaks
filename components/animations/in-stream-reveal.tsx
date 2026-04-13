"use client"

import { motion, AnimatePresence } from "framer-motion"
import { teams } from "@/components/team-spinner"

type Team = (typeof teams)[number]

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
          className="relative px-3 py-2.5 rounded-xl overflow-hidden bg-black/40 backdrop-blur w-full whitespace-nowrap"
          style={{
            boxShadow: `0 0 30px ${team.color}50, 0 0 60px ${team.color}30`,
          }}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Animated glow border */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: `0 0 25px ${team.color}70, inset 0 0 20px ${team.color}20`,
              border: `1px solid ${team.color}50`,
            }}
            animate={{
              boxShadow: [
                `0 0 25px ${team.color}70, inset 0 0 20px ${team.color}20`,
                `0 0 50px ${team.color}90, inset 0 0 35px ${team.color}35`,
                `0 0 25px ${team.color}70, inset 0 0 20px ${team.color}20`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Sweeping gradient glow (left to right) */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: "linear-gradient(to right, transparent, #4CE16050, #4CE160, #4CE16050, transparent)",
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Sparkle particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="text-xl">👑</span>
            <p className="text-sm">
              <span className="font-bold text-white">{username}</span>
              <span className="text-white/80"> Won the </span>
              <span 
                className="font-bold"
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
