"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { teams, type Team } from "@/components/team-spinner"

interface SpinInPlaceSpinnerProps {
  /** True while spinning, false to reset. */
  isSpinning: boolean
  /** Fired once the spin lands — pass the winning team up. */
  onLanded: (team: Team) => void
  /** When true the spinner shows the settled green team name,
   *  waiting for the bid box to fade back in. */
  settled?: boolean
}

type Stage = "idle" | "spinning" | "landed"

// Circular progress arc (copy of the one already in SingleSpinChipPopulateSpinner)
function CircularProgress({ available, total, size = 16 }: { available: number; total: number; size?: number }) {
  const pct = (available / total) * 100
  const sw = 3
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct <= 25 ? "#ef4444" : pct <= 50 ? "#f97316" : pct <= 75 ? "#eab308" : "#22c55e"
  return (
    <svg className="transform -rotate-90" width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={sw} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
      />
    </svg>
  )
}

export function SpinInPlaceSpinner({ isSpinning, onLanded, settled = false }: SpinInPlaceSpinnerProps) {
  const [stage, setStage] = useState<Stage>("idle")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [winner, setWinner] = useState<Team | null>(null)
  const [justLanded, setJustLanded] = useState(false)

  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const landRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<AudioContext | null>(null)
  const startedRef = useRef(false)
  const landedRef = useRef(false)

  const playTick = useCallback(() => {
    try {
      if (!audioRef.current)
        audioRef.current = new (window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const ctx = audioRef.current
      if (ctx.state === "suspended") ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.02)
      osc.type = "sine"
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.03)
    } catch { /* ignore */ }
  }, [])

  const runSpin = useCallback((onDone: (t: Team) => void) => {
    const target = Math.floor(Math.random() * teams.length)
    let speed = 50
    let elapsed = 0
    let idx = Math.floor(Math.random() * teams.length)

    const tick = () => {
      idx = (idx + 1) % teams.length
      setCurrentIndex(idx)
      playTick()
      elapsed += speed
      if (elapsed > 1200) speed += 30
      if (speed >= 400) {
        setCurrentIndex(target)
        setJustLanded(true)
        landRef.current = setTimeout(() => {
          setJustLanded(false)
          setWinner(teams[target])
          setStage("landed")
          onDone(teams[target])
        }, 800)
        return
      }
      tickRef.current = setTimeout(tick, speed)
    }
    tickRef.current = setTimeout(tick, speed)
  }, [playTick])

  useEffect(() => {
    if (isSpinning && !startedRef.current && stage === "idle") {
      startedRef.current = true
      setStage("spinning")
      runSpin((team) => {
        if (!landedRef.current) {
          landedRef.current = true
          onLanded(team)
        }
      })
    }
  }, [isSpinning, stage, runSpin, onLanded])

  // Reset when engine turns off
  useEffect(() => {
    if (!isSpinning && stage !== "idle") {
      if (tickRef.current) clearTimeout(tickRef.current)
      if (landRef.current) clearTimeout(landRef.current)
      startedRef.current = false
      landedRef.current = false
      setStage("idle")
      setCurrentIndex(0)
      setWinner(null)
      setJustLanded(false)
    }
  }, [isSpinning, stage])

  useEffect(() => () => {
    if (tickRef.current) clearTimeout(tickRef.current)
    if (landRef.current) clearTimeout(landRef.current)
  }, [])

  const isLanded = stage === "landed" || settled
  const team = isLanded ? winner : teams[currentIndex]

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {/* Header row: badge + cycling/settled name + spots */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white text-xs"
          animate={{ backgroundColor: team ? team.color : "rgba(255,255,255,0.1)" }}
          transition={{ duration: 0.15 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={team?.abbrev ?? "?"}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.08 }}
            >
              {team?.abbrev ?? "?"}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <div className="flex flex-col flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {isLanded && winner ? (
              <motion.span
                key="winner"
                className="font-semibold text-sm truncate"
                style={{ color: "lab(78.503 -64.9265 39.7492)" }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {winner.city} {winner.name}
              </motion.span>
            ) : (
              <motion.span
                key={justLanded ? "landed" : (team?.name ?? "spinning")}
                className="font-semibold text-sm truncate"
                initial={{ opacity: 0, y: 6 }}
                animate={{
                  opacity: 1, y: 0,
                  color: justLanded ? "lab(78.503 -64.9265 39.7492)" : "#ffffff",
                }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: justLanded ? 0.2 : 0.05 }}
              >
                {team?.city} {team?.name}
              </motion.span>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-1.5">
            <CircularProgress available={15} total={32} size={16} />
            <span className="text-sm text-white">15/32 spots available</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-white/50 flex-shrink-0">
          <span className="text-sm">View all</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>

      {/* Price row */}
      <div className="flex flex-col mb-3">
        <span className="text-white font-bold text-lg">$30.00</span>
        <div className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.2998 1C7.37676 1 8.25 1.87324 8.25 2.9502V3.75H9.38965C9.8451 3.75004 10.2759 3.95696 10.5605 4.3125L11.6709 5.70117C11.8838 5.96724 12 6.29819 12 6.63867V8C11.9999 8.82823 11.3285 9.5 10.5 9.5H9.5C9.5 10.3284 8.82843 11 8 11C7.17157 11 6.5 10.3284 6.5 9.5H4C4 10.3284 3.32843 11 2.5 11C1.67157 11 1 10.3284 1 9.5H0.75C0.335786 9.5 0 9.16421 0 8.75C0 8.33579 0.335786 8 0.75 8H6.2998C6.54833 8 6.75 7.79833 6.75 7.5498V2.9502C6.75 2.70167 6.54833 2.5 6.2998 2.5H0.75C0.335786 2.5 0 2.16421 0 1.75C0 1.33579 0.335786 1 0.75 1H6.2998ZM8.25 7.5498C8.25 7.70495 8.22955 7.85531 8.19531 8H10.5V6.6377L9.38965 5.25H8.25V7.5498ZM3.75 4.5C4.16421 4.5 4.5 4.83579 4.5 5.25C4.5 5.66421 4.16421 6 3.75 6H0.75C0.335786 6 0 5.66421 0 5.25C0 4.83579 0.335786 4.5 0.75 4.5H3.75Z" fill="rgba(255,255,255,0.5)" />
          </svg>
          <span className="text-white/50 text-sm">$5 shipping</span>
        </div>
      </div>

      {/* Spinning label replacing the bid timer row */}
      <div className="flex items-center justify-between mb-3">
        <AnimatePresence mode="wait">
          {isLanded && winner ? (
            <motion.div
              key="winner-label"
              className="flex items-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="text-sm font-medium" style={{ color: "lab(78.503 -64.9265 39.7492)" }}>
                Adam007
              </span>
              <span className="text-white/60 text-sm">won</span>
            </motion.div>
          ) : (
            <motion.div
              key="spinning-label"
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Spinning dots indicator */}
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/60"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <span className="text-white/60 text-sm">Randomizing your spot…</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isLanded && winner && (
            <motion.div
              className="flex items-center gap-1.5"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: winner.color }} />
              <span className="text-white/60 text-sm">{winner.city} {winner.name}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Disabled grey pill placeholder (mirrors the disabled bid button area) */}
      <div className="flex gap-3 opacity-40 pointer-events-none">
        <button
          disabled
          className="px-5 py-2.5 rounded-full font-medium text-sm border"
          style={{ backgroundColor: "#8F8F8F", borderColor: "#8F8F8F", color: "#000" }}
        >
          Max bid
        </button>
        <div
          className="relative flex-1 h-14 rounded-full p-1.5"
          style={{ border: "1px solid #8F8F8F" }}
        >
          <div
            className="h-full w-full rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#8F8F8F" }}
          >
            <span className="text-black font-semibold text-sm">Randomizing…</span>
          </div>
        </div>
      </div>
    </div>
  )
}
