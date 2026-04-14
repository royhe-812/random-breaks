"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, ChevronDown, ChevronRight } from "lucide-react"

interface EbayLiveBackgroundProps {
  children?: React.ReactNode
  onTriggerReveal?: () => void
  isRevealing?: boolean
}

export function EbayLiveBackground({ children, onTriggerReveal, isRevealing }: EbayLiveBackgroundProps) {
  const [bidAmount] = useState(30)

  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden">
      {/* Video/Stream Background - Using the screenshot as reference */}
      <div className="absolute inset-0">
        {/* Simulated card display background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Pinned%20AUC%20-%20Random-6g9NlCmU2KzyGJr4iKP6pzhgGPtF9a.png')`,
            filter: isRevealing ? 'blur(8px) brightness(0.4)' : 'none',
            transition: 'filter 0.5s ease-out',
          }}
        />
        
        {/* Dark overlay when revealing */}
        {isRevealing && (
          <div className="absolute inset-0 bg-black/60 transition-opacity duration-500" />
        )}
      </div>

      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center px-4 py-3">
          <button className="p-2">
            <ChevronDown className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
              <Image 
                src="/placeholder.svg?height=32&width=32" 
                alt="Seller avatar"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <span className="text-white font-medium">ryans_cardhouse</span>
            <Heart className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Right Side Controls */}
      <div className="absolute top-20 right-3 z-10 flex flex-col items-center gap-4">
        {/* Live indicator */}
        <div className="bg-red-600 rounded-full p-2 relative">
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <circle cx="12" cy="12" r="4" />
              <path d="M4.93 4.93a10 10 0 0 1 14.14 0" stroke="white" strokeWidth="2" fill="none" />
              <path d="M19.07 19.07a10 10 0 0 1-14.14 0" stroke="white" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-white text-xs font-medium">240</span>
        </div>

        <button className="flex flex-col items-center gap-1 mt-4">
          <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <span className="text-white text-xs">Items</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <span className="text-white text-xs">Wallet</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </div>
          <span className="text-white text-xs">More</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="absolute left-4 bottom-64 z-10 space-y-2 max-w-[70%]">
        <div className="text-white/70 text-sm">johnpleys</div>
        <div>
          <span className="text-green-400 font-semibold text-sm">Chloepulls11</span>
          <p className="text-white text-sm">These are so hot, get your bids in!</p>
        </div>
        <div>
          <span className="text-white font-semibold text-sm">chrisjames</span>
          <p className="text-white/80 text-sm">So sick</p>
        </div>
      </div>

      {/* Comment Input */}
      <div className="absolute left-4 right-4 bottom-48 z-10">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white/10 backdrop-blur rounded-full px-4 py-3">
            <span className="text-white/50">Add comment...</span>
          </div>
          <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          </button>
        </div>
      </div>

      {/* Bottom Auction Panel */}
      <div className="absolute left-0 right-0 bottom-0 z-10 bg-zinc-900/95 backdrop-blur rounded-t-3xl">
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm flex items-center gap-1">
              <img src="/images/spot-grey.png" alt="" width={12} height={12} />
              16/32 spots available
            </span>
            <button className="flex items-center gap-1 text-white text-sm font-medium">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-white font-semibold">
                Random team - 16X 2023 Panini Mosaic NFL Blaster Random #224
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white font-bold text-lg">${bidAmount}.00</span>
                <span className="text-white/50 text-sm">+ $5 shipping</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/50 mt-1" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <span className="text-lg">🎲</span>
              <span className="text-green-400 font-medium">Jessica991</span>
              <span className="text-white/70">is winning</span>
            </div>
            <div className="flex items-center gap-1 text-red-500">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <span className="font-mono font-bold">00:10</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-zinc-800 text-white font-semibold py-3 px-6 rounded-full">
              Max bid
            </button>
            <button 
              onClick={onTriggerReveal}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-colors"
            >
              Bid ${bidAmount}
              <ChevronRight className="w-5 h-5" />
              <ChevronRight className="w-5 h-5 -ml-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Animation Overlay - This is where the winning moment appears */}
      {children && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
