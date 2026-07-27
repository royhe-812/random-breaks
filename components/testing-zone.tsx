"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { RotateCcw } from "lucide-react"
import { teams, type Team } from "@/components/team-spinner"

// ─── Minimal circular progress (mirrors the spinner components) ────────────
const CircularProgress = ({ available, total, size = 16 }: { available: number; total: number; size?: number }) => {
  const pct = (available / total) * 100
  const sw = 3
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct <= 25 ? "#ef4444" : pct <= 50 ? "#f97316" : pct <= 75 ? "#eab308" : "#22c55e"
  return (
    <svg className="-rotate-90" width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset .3s,stroke .3s" }} />
    </svg>
  )
}

// ─── Mini spinner (a fully self-contained chip-populate spinner that accepts
//     a forced team so the tester can test any team's color) ─────────────────

interface MiniSpinnerProps {
  label: string
  forcedTeam: Team | null
  spinKey: number
  /** Which variant to render */
  variant: "single" | "multi3" | "multi2"
}

type SpinPhase = "idle" | "cycling" | "landed"

function MiniSpinner({ label, forcedTeam, spinKey, variant }: MiniSpinnerProps) {
  const [phase, setPhase] = useState<SpinPhase>("idle")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [result, setResult] = useState<Team | null>(null)
  const [shimmer, setShimmer] = useState(false)
  // For multi-spin variants: multiple settled chips
  const [chips, setChips] = useState<Team[]>([])
  const [spinningChipIndex, setSpinningChipIndex] = useState(0)

  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const startedRef = useRef(false)

  const playTick = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === "suspended") ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.02)
      osc.type = "sine"
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.03)
    } catch { /* ignore */ }
  }, [])

  // Run a single spin, stopping on `target` index
  const runOneSpin = useCallback((targetIdx: number, onDone: () => void) => {
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
        setCurrentIndex(targetIdx)
        tickRef.current = setTimeout(onDone, 700)
        return
      }
      tickRef.current = setTimeout(tick, speed)
    }
    tickRef.current = setTimeout(tick, speed)
  }, [playTick])

  // Launch spin sequence when spinKey changes (and a forced team is set)
  useEffect(() => {
    if (!forcedTeam) return

    // reset
    if (tickRef.current) clearTimeout(tickRef.current)
    startedRef.current = false
    setPhase("idle")
    setResult(null)
    setChips([])
    setShimmer(false)

    // tiny delay so reset renders first
    const init = setTimeout(() => {
      startedRef.current = true
      const targetIdx = teams.findIndex(t => t.name === forcedTeam.name)
      const safeTarget = targetIdx >= 0 ? targetIdx : 0

      if (variant === "single") {
        setPhase("cycling")
        runOneSpin(safeTarget, () => {
          setResult(forcedTeam)
          setPhase("landed")
          setShimmer(true)
        })
      } else {
        // multi variants: spin 3 (or 2) times, forced team lands on the last spin
        const spinCount = variant === "multi3" ? 3 : 2
        setPhase("cycling")
        setSpinningChipIndex(0)

        const runChain = (i: number, accumulated: Team[]) => {
          setSpinningChipIndex(i)
          const isLast = i === spinCount - 1
          // For non-last spins pick a random team different from forcedTeam
          const pool = teams.filter(t => t.name !== forcedTeam.name && !accumulated.find(a => a.name === t.name))
          const randTeam = pool[Math.floor(Math.random() * pool.length)] ?? teams[0]
          const spinTarget = isLast ? safeTarget : teams.findIndex(t => t.name === randTeam.name)
          const landedTeam = isLast ? forcedTeam : randTeam

          runOneSpin(spinTarget, () => {
            const next = [...accumulated, landedTeam]
            setChips(next)
            if (isLast) {
              setResult(forcedTeam)
              setPhase("landed")
              setShimmer(true)
            } else {
              // brief pause between spins
              tickRef.current = setTimeout(() => runChain(i + 1, next), 1200)
            }
          })
        }
        runChain(0, [])
      }
    }, 80)

    return () => {
      clearTimeout(init)
      if (tickRef.current) clearTimeout(tickRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey, forcedTeam?.name, variant])

  useEffect(() => () => { if (tickRef.current) clearTimeout(tickRef.current) }, [])

  const isSpinning = phase === "cycling"
  const currentTeam = teams[currentIndex]

  // ─── Badge (left thumbnail) ────────────────────────────────────────────
  const badge = (
    <motion.div
      className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white text-xs overflow-hidden"
      style={{ backgroundColor: isSpinning ? currentTeam.color : result ? result.color : "transparent" }}
      transition={{ duration: 0.12 }}
    >
      {isSpinning ? currentTeam.abbrev : result ? result.abbrev : (
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%F0%9F%93%B8%20Image-9iS4XVufx1PUEY9oOKKsmjnhTZzv9F.png"
          alt="box"
          className="w-full h-full object-cover rounded-lg"
        />
      )}
    </motion.div>
  )

  // ─── Title line ────────────────────────────────────────────────────────
  const titleLine = (
    <AnimatePresence mode="wait">
      {isSpinning ? (
        <motion.span key={currentTeam.name} className="font-semibold text-sm truncate text-white"
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.05 }}>
          {currentTeam.city} {currentTeam.name}
        </motion.span>
      ) : result && phase === "landed" ? (
        <motion.span key="landed" className="relative font-semibold text-sm truncate overflow-hidden"
          style={{ color: result.color }}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}>
          {result.city} {result.name}
          {shimmer && (
            <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,.55) 50%,transparent 100%)", mixBlendMode: "overlay" }}
              initial={{ x: "-120%" }} animate={{ x: "220%" }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }} />
          )}
        </motion.span>
      ) : (
        <motion.span key="idle" className="text-white/50 font-semibold text-sm truncate"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {forcedTeam ? "Ready to spin..." : "Pick a team below"}
        </motion.span>
      )}
    </AnimatePresence>
  )

  // ─── Chips (multi-spin variants) ───────────────────────────────────────
  const chipRow = chips.length > 0 && (
    <div className="px-4 pb-3 flex flex-wrap gap-1.5">
      <AnimatePresence initial={false}>
        {chips.map((t, i) => {
          const isLast = i === chips.length - 1 && phase === "landed"
          return (
            <motion.span key={i}
              className="relative inline-flex h-4 items-center gap-1 rounded-full px-3 text-[10px] leading-none font-bold uppercase tracking-wide overflow-hidden"
              style={{ backgroundColor: isLast ? t.color : "transparent", color: isLast ? "#fff" : t.color, boxShadow: isLast ? "none" : `inset 0 0 0 1px ${t.color}` }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>
              {t.city} {t.name}
              {isLast && (
                <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full"
                  style={{ background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,.55) 50%,transparent 100%)", mixBlendMode: "overlay" }}
                  initial={{ x: "-120%" }} animate={{ x: "220%" }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }} />
              )}
            </motion.span>
          )
        })}
      </AnimatePresence>
    </div>
  )

  return (
    <div className="flex flex-col gap-1">
      <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold px-1">{label}</p>
      <motion.div
        className="relative bg-black/40 backdrop-blur rounded-xl overflow-hidden"
        animate={{ boxShadow: isSpinning ? `0 0 16px ${currentTeam.color}50` : "none" }}
        transition={{ duration: 0.2 }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          {badge}
          <div className="flex flex-col flex-1 min-w-0">
            {titleLine}
            <div className="flex items-center gap-1.5 mt-0.5">
              <CircularProgress available={15} total={32} size={14} />
              <span className="text-white/50 text-xs">15/32 spots available</span>
            </div>
          </div>
          <span className="text-white/30 text-xs flex-shrink-0">View all &rsaquo;</span>
        </div>
        {chipRow && (
          <>
            <div className="mx-4 border-t border-white/10" />
            {chipRow}
          </>
        )}
      </motion.div>
    </div>
  )
}

// ─── Main Testing Zone ─────────────────────────────────────────────────────

export function TestingZone() {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [spinKey, setSpinKey] = useState(0)
  const [hasSpun, setHasSpun] = useState(false)

  const handleSpin = () => {
    if (!selectedTeam) return
    setSpinKey(k => k + 1)
    setHasSpun(true)
  }

  const handleReset = () => {
    setSpinKey(k => k + 1)
    setHasSpun(false)
    setSelectedTeam(null)
  }

  return (
    <div className="w-full min-h-screen bg-zinc-950 flex flex-col">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 pt-8 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight">Testing Zone</h1>
            <p className="text-white/40 text-sm mt-0.5">Force any team — see all spinner variants live</p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-white/70 hover:text-white text-sm font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 flex-1 min-h-0">
        {/* ─── Team Picker (left panel) ──────────────────────────────────── */}
        <div className="lg:w-72 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 p-6">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-4">Select team</p>
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
            {teams.map(team => {
              const isSelected = selectedTeam?.name === team.name
              return (
                <button
                  key={team.name}
                  onClick={() => setSelectedTeam(team)}
                  className="relative flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all text-left"
                  style={{
                    backgroundColor: isSelected ? `${team.color}22` : "transparent",
                    border: isSelected ? `1.5px solid ${team.color}` : "1.5px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {/* Color swatch */}
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white text-[10px]"
                    style={{ backgroundColor: team.color }}>
                    {team.abbrev}
                  </div>
                  <div className="min-w-0 hidden lg:block">
                    <p className="text-white text-xs font-semibold leading-tight truncate">{team.name}</p>
                    <p className="text-white/40 text-[10px] leading-tight truncate">{team.city}</p>
                  </div>
                  {isSelected && (
                    <motion.div
                      layoutId="team-selected-ring"
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{ boxShadow: `0 0 12px ${team.color}60` }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Spin button */}
          <button
            onClick={handleSpin}
            disabled={!selectedTeam}
            className="mt-5 w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style={selectedTeam
              ? { backgroundColor: selectedTeam.color, color: "#fff", boxShadow: `0 4px 20px ${selectedTeam.color}50` }
              : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", cursor: "not-allowed" }}
          >
            {!selectedTeam ? "Pick a team to spin" : hasSpun ? `Spin again — ${selectedTeam.name}` : `Spin — ${selectedTeam.city} ${selectedTeam.name}`}
          </button>

          {/* Legend */}
          {selectedTeam && (
            <motion.div
              key={selectedTeam.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl p-3 flex items-center gap-3"
              style={{ backgroundColor: `${selectedTeam.color}15`, border: `1px solid ${selectedTeam.color}30` }}
            >
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white text-xs"
                style={{ backgroundColor: selectedTeam.color }}>
                {selectedTeam.abbrev}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{selectedTeam.city} {selectedTeam.name}</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: selectedTeam.color }}>{selectedTeam.color}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* ─── Spinner previews (right panel) ──────────────────────────── */}
        <div className="flex-1 p-6 overflow-y-auto">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-5">Spinner variants</p>
          <div className="flex flex-col gap-6 max-w-lg">
            <MiniSpinner
              label="Single Spin"
              forcedTeam={selectedTeam}
              spinKey={spinKey}
              variant="single"
            />
            <MiniSpinner
              label="Multi Spin (3 spots)"
              forcedTeam={selectedTeam}
              spinKey={spinKey}
              variant="multi3"
            />
            <MiniSpinner
              label="Multi Spin (2 spots)"
              forcedTeam={selectedTeam}
              spinKey={spinKey}
              variant="multi2"
            />
          </div>

          {/* Colour grid reference */}
          <div className="mt-10">
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-4">All team colours</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {teams.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTeam(t)}
                  className="flex items-center gap-2 rounded-xl p-2.5 transition-all hover:opacity-90"
                  style={{ backgroundColor: `${t.color}18`, border: `1px solid ${t.color}30` }}
                >
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-white text-[10px]"
                    style={{ backgroundColor: t.color }}>
                    {t.abbrev}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate leading-tight">{t.name}</p>
                    <p className="font-mono text-[10px] truncate" style={{ color: t.color }}>{t.color}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
