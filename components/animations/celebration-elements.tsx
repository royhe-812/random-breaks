"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const STARS_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBayLiveApp_Stars_DW_CC_v007_CC%202-OGJYd3jy5o3bamd4lN3498JekCYscy.png"
const FIRE_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eBay_Live_Emoji_a_v008_Fire.0072%202-IVWHtqVd8MJLUNA3EfYsVshGT1EjUg.png"

interface CelebrationElementsProps {
  show: boolean
  teamColor?: string
}

export function CelebrationElements({ show, teamColor = "#E31837" }: CelebrationElementsProps) {
  if (!show) return null

  return (
    <>
      {/* Floating Stars */}
      <motion.div
        className="absolute -top-8 -left-12 w-16 h-16 z-20"
        initial={{ scale: 0, rotate: -30, opacity: 0 }}
        animate={{ 
          scale: [0, 1.2, 1],
          rotate: [-30, 10, 0],
          opacity: 1,
          y: [0, -8, 0],
        }}
        transition={{ 
          duration: 0.6,
          y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <Image src={STARS_URL} alt="" fill className="object-contain" />
      </motion.div>

      <motion.div
        className="absolute -top-4 -right-10 w-12 h-12 z-20"
        initial={{ scale: 0, rotate: 20, opacity: 0 }}
        animate={{ 
          scale: [0, 1.3, 1],
          rotate: [20, -5, 0],
          opacity: 1,
          y: [0, -6, 0],
        }}
        transition={{ 
          duration: 0.6,
          delay: 0.15,
          y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
        }}
      >
        <Image src={STARS_URL} alt="" fill className="object-contain" />
      </motion.div>

      <motion.div
        className="absolute -bottom-6 -right-8 w-10 h-10 z-20"
        initial={{ scale: 0, rotate: -15, opacity: 0 }}
        animate={{ 
          scale: [0, 1.2, 1],
          rotate: [-15, 5, 0],
          opacity: 1,
          y: [0, -5, 0],
        }}
        transition={{ 
          duration: 0.5,
          delay: 0.3,
          y: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
        }}
      >
        <Image src={STARS_URL} alt="" fill className="object-contain" />
      </motion.div>

      {/* Fire Icon */}
      <motion.div
        className="absolute -bottom-4 -left-6 w-14 h-14 z-20"
        initial={{ scale: 0, y: 20, opacity: 0 }}
        animate={{ 
          scale: [0, 1.3, 1],
          y: [20, -5, 0],
          opacity: 1,
        }}
        transition={{ 
          duration: 0.5,
          delay: 0.2,
          type: "spring",
          stiffness: 300,
        }}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [-3, 3, -3],
          }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-full h-full relative"
        >
          <Image src={FIRE_URL} alt="" fill className="object-contain" />
        </motion.div>
      </motion.div>

      {/* Holographic sparkle particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full z-10"
          style={{
            background: `linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #e9d5ff 100%)`,
            boxShadow: "0 0 8px rgba(167, 139, 250, 0.6)",
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: 0.5 + i * 0.1,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}

      {/* Iridescent glow ring */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-full pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, 
            rgba(167, 139, 250, 0.3), 
            rgba(196, 181, 253, 0.3), 
            rgba(233, 213, 255, 0.3),
            rgba(167, 139, 250, 0.3)
          )`,
          filter: "blur(20px)",
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: [0.8, 1.2, 0.8],
          opacity: [0, 0.6, 0],
          rotate: 360,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </>
  )
}

export function HolographicShine() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            105deg,
            transparent 20%,
            rgba(167, 139, 250, 0.15) 35%,
            rgba(196, 181, 253, 0.2) 40%,
            rgba(233, 213, 255, 0.15) 45%,
            transparent 60%
          )`,
        }}
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}
