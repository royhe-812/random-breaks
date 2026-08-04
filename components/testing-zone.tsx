"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { RotateCcw, ChevronDown, Heart } from "lucide-react"
import { teams, type Team } from "@/components/team-spinner"
import { SpinInPlaceSpinner } from "@/components/spin-in-place-spinner"
import { SpinRollerSpinner } from "@/components/spin-roller-spinner"
import { BreakSpotsSheet } from "@/components/break-spots-sheet"
import { useDialKit, DialRoot } from "dialkit"
import "dialkit/styles.css"

/** Black or white label per WCAG relative luminance — team primaries range from
 *  near-black (Packers) to bright yellow (Steelers), so this can't be constant. */
function readableOn(hex: string) {
  const h = hex.replace("#", "")
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const r = toLinear(parseInt(h.slice(0, 2), 16) / 255)
  const g = toLinear(parseInt(h.slice(2, 4), 16) / 255)
  const b = toLinear(parseInt(h.slice(4, 6), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42 ? "#101820" : "#ffffff"
}

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

/** Variants that can be driven inside the phone frame. The first two are the
 *  real production components; the rest reuse the local MiniSpinner. */
const VARIANTS = [
  { id: "roller", label: "Roller" },
  { id: "in-place", label: "Spin In Place" },
  { id: "single", label: "Single Spin" },
  { id: "multi3", label: "Multi (3)" },
  { id: "multi2", label: "Multi (2)" },
] as const

type VariantId = (typeof VARIANTS)[number]["id"]

/* ── Live stream chrome ──
   Same blob assets the production stream in app/page.tsx uses, so the testing
   zone is judged against the identical backdrop rather than a flat panel. */
const STREAM_VIDEO =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/case%20breaks%20video%20-w5usFKatykHZfTOkKiurwdJmYPpFxf.mov"
const RAIL_ICONS = [
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/items-lRJIiXEXUI5vZJg8YwpehK7c6cPcIp.png", label: "Items" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/wallet-DJozjl9ngzsbQkbB6XZaj8GAvfXwO3.png", label: "Wallet" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/polls-TLiAJGRZLHuSvOrQ9KyfrufvDyhfjC.png", label: "Polls" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/more-7JAmofygtcnGhXf8oMlQuYxSkAZxTC.png", label: "More" },
]
const LIVE_AVATAR =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Stream%20navigation%20avatar-kd9nUvhPaYGQGCKYioJLK4vLokIQ87.png"
const STREAM_CHAT = [
  { user: "boxbreaker", message: "Love these random breaks" },
  { user: "firstroundpick", message: "Mosaic hits different" },
  { user: "Chloepulls11", message: "These are so hot, get your bids in!" },
]

export function TestingZone() {
  const [variant, setVariant] = useState<VariantId>("roller")
  // null = let the spinner pick at random, otherwise force this outcome.
  const [forcedTeam, setForcedTeam] = useState<Team | null>(null)
  const [spinKey, setSpinKey] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<Team | null>(null)
  // Opened by the chevron on the spinner's title row, matching the bid box card.
  const [isBreakSpotsOpen, setIsBreakSpotsOpen] = useState(false)

  /* ── dialkit ──
     Live-tunable spin parameters. The tuple form is [value, min, max, step].
     `spinTime` is expressed in seconds here because that's the unit worth
     reasoning about, then converted to ms for the spinner props. */
  const { spinTime, startSpeed, rampUp, stopEase } = useDialKit("Spin", {
    spinTime: [4.2, 0.5, 12, 0.1] as [number, number, number, number],
    // Fraction of peak speed the drum starts at. Drop toward 0 for a slow
    // creeping start; 1 restores the old "instantly at full tilt" behaviour.
    startSpeed: [0.15, 0.02, 1, 0.01] as [number, number, number, number],
    // Portion of the spin spent accelerating before the decay to the winner.
    rampUp: [0.3, 0, 0.9, 0.05] as [number, number, number, number],
    // How the spin comes to rest. Low values hold speed then cut off sharply;
    // high values shed speed early and crawl in — the game-show wheel tail.
    stopEase: [3, 0.3, 8, 0.1] as [number, number, number, number],
  })

  const spinDurationMs = Math.round(spinTime * 1000)

  const forcedIndex = forcedTeam ? teams.findIndex(t => t.name === forcedTeam.name) : null
  const isRealVariant = variant === "roller" || variant === "in-place"

  const handleSpin = () => {
    setResult(null)
    setIsSpinning(true)
    // Remounting is what restarts a run — both real spinners key their whole
    // rAF loop off mount, so a fresh key replays cleanly every time.
    setSpinKey(k => k + 1)
  }

  const handleReset = () => {
    setIsSpinning(false)
    setResult(null)
    setSpinKey(k => k + 1)
  }

  const phase = result ? "landed" : isSpinning ? "spinning" : "idle"

  return (
    <div className="w-full min-h-screen bg-zinc-950 flex flex-col">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header className="px-6 pt-8 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight">Spinner Testing Zone</h1>
            <p className="text-white/40 text-sm mt-0.5">Force any outcome and replay the randomization in a mobile frame</p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-white/70 hover:text-white text-sm font-medium flex-shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* ─── Controls ─────────────────────���───────────────────────────── */}
        <div className="lg:w-80 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 p-6 overflow-y-auto">
          {/* Variant */}
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-3">Variant</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {VARIANTS.map(v => (
              <button
                key={v.id}
                onClick={() => { setVariant(v.id); handleReset() }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  variant === v.id
                    ? "bg-white text-zinc-900"
                    : "bg-white/10 text-white/60 hover:bg-white/15 hover:text-white"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Spin / status */}
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-3">Playback</p>
          <button
            onClick={handleSpin}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style={
              forcedTeam
                ? { backgroundColor: forcedTeam.color, color: readableOn(forcedTeam.color), boxShadow: `0 4px 20px ${forcedTeam.color}50` }
                : { backgroundColor: "#4ce160", color: "#04210a", boxShadow: "0 4px 20px rgba(76,225,96,0.3)" }
            }
          >
            {phase === "idle" ? "Start spin" : "Spin again"}
          </button>

          <div className="mt-3 flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                phase === "spinning" ? "bg-yellow-400 animate-pulse" : phase === "landed" ? "bg-[#4ce160]" : "bg-white/25"
              }`}
            />
            <span className="text-white/50 capitalize">{phase}</span>
            {result && (
              <span className="text-white font-semibold ml-auto truncate">
                {result.city} {result.name}
              </span>
            )}
          </div>

          {/* Outcome picker */}
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mt-6 mb-3">Winner outcome</p>
          <button
            onClick={() => setForcedTeam(null)}
            className={`w-full mb-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
              forcedTeam === null
                ? "bg-white/15 text-white ring-1 ring-inset ring-white/40"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            Random
            <span className="block font-normal text-[10px] mt-0.5 opacity-60">Let the spinner decide</span>
          </button>
          <div className="grid grid-cols-2 gap-2">
            {teams.map(team => {
              const isSelected = forcedTeam?.name === team.name
              return (
                <button
                  key={team.name}
                  onClick={() => setForcedTeam(team)}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all text-left"
                  style={{
                    backgroundColor: isSelected ? `${team.color}26` : "rgba(255,255,255,0.04)",
                    border: isSelected ? `1.5px solid ${team.color}` : "1.5px solid transparent",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-[9px]"
                    style={{ backgroundColor: team.color, color: readableOn(team.color) }}
                  >
                    {team.abbrev}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-[11px] font-semibold leading-tight truncate">{team.name}</p>
                    {/* Neutral, not the team colour — the darkest primaries
                        (Texans #03202F, Patriots #002244) vanish on this panel. */}
                    <p className="font-mono text-[9px] leading-tight truncate text-white/40">{team.color}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Mobile frame ─────────────────────────────────────────────── */}
        <div className="flex-1 flex items-start justify-center p-6 lg:p-10 overflow-y-auto">
          <div
            className="relative flex-shrink-0 rounded-[44px] border-4 border-zinc-800 bg-black overflow-hidden"
            /* 390 x 848 keeps the iPhone 17 Pro Max 440:956 ratio the production
               device frame uses, so vertical spacing reads true. */
            style={{ width: 390, height: 848, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}
          >
            {/* Live stream video — the real backdrop from the production stream */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src={STREAM_VIDEO}
            />

            {/* Readability gradients, matching the production stack */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[80%] z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 rounded-full bg-black z-30" />

            {/* Status bar */}
            <div className="relative z-20 flex items-center justify-between px-7 pt-4 pb-1 text-white text-xs font-semibold">
              <span>9:41</span>
              <span className="tracking-tighter text-white/70">▮▮▮</span>
            </div>

            {/* Stream header — collapse chevron, seller, follow heart */}
            <div className="absolute top-12 left-0 right-0 z-20 p-4">
              <div className="flex items-start gap-3">
                <button className="w-8 h-8 flex items-center justify-center" aria-label="Collapse stream">
                  <ChevronDown className="w-6 h-6 text-white" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <span className="text-white font-semibold text-sm">ryans_cardhouse</span>
                  <Heart className="w-4 h-4 text-white fill-white" />
                </div>
              </div>

              {/* Right action rail */}
              <div className="absolute top-4 right-4">
                <div className="bg-black/40 backdrop-blur rounded-3xl px-2 py-3 flex flex-col items-center gap-2">
                  <div className="flex flex-col items-center">
                    <img src={LIVE_AVATAR} alt="Live" className="w-10 h-10" />
                    <span className="text-white text-xs font-medium mt-1">299</span>
                  </div>
                  {RAIL_ICONS.map(icon => (
                    <div key={icon.label} className="flex flex-col items-center">
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img src={icon.src} alt={icon.label} className="w-6 h-6" />
                      </div>
                      <span className="text-white text-xs font-medium mt-1">{icon.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom stack — chat, comment bar, then the spinner under test */}
            <div className="absolute left-4 right-4 bottom-6 z-20 flex flex-col gap-2">
              {/* Chat, kept clear of the right rail */}
              <div className="flex flex-col gap-1.5 pr-20">
                {STREAM_CHAT.map(msg => (
                  <div key={msg.user} className="flex flex-col">
                    <span className="text-white font-bold text-sm">{msg.user}</span>
                    <span className="text-white/80 text-sm">{msg.message}</span>
                  </div>
                ))}
              </div>

              {/* Comment bar */}
              <div className="flex w-full items-center gap-2 bg-black/40 backdrop-blur rounded-full px-4 py-3">
                <span className="text-sm flex-1 text-white/50">Add comment...</span>
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              </div>

              {isRealVariant ? (
                <div className="bg-black/40 backdrop-blur rounded-2xl p-4">
                  {variant === "roller" ? (
                    <SpinRollerSpinner
                      key={`roller-${spinKey}`}
                      isSpinning={isSpinning}
                      onLanded={setResult}
                      winnerName="Adam007"
                      breakNumber={15}
                      availableSpots={15}
                      totalSpots={32}
                      onViewSpots={() => setIsBreakSpotsOpen(true)}
                      forceTeamIndex={forcedIndex}
                      spinDuration={spinDurationMs}
                      startSpeed={startSpeed}
                      rampUp={rampUp}
                      stopEase={stopEase}
                    />
                  ) : (
                    <SpinInPlaceSpinner
                      key={`in-place-${spinKey}`}
                      isSpinning={isSpinning}
                      onLanded={setResult}
                      winnerName="Adam007"
                      breakNumber={15}
                      availableSpots={15}
                      totalSpots={32}
                      onViewSpots={() => setIsBreakSpotsOpen(true)}
                      forceTeamIndex={forcedIndex}
                      spinDuration={spinDurationMs}
                      startSpeed={startSpeed}
                      rampUp={rampUp}
                      stopEase={stopEase}
                    />
                  )}
                </div>
              ) : (
                <MiniSpinner
                  label={VARIANTS.find(v => v.id === variant)?.label ?? ""}
                  forcedTeam={forcedTeam}
                  spinKey={spinKey}
                  variant={variant as "single" | "multi3" | "multi2"}
                />
              )}
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-white/30 z-20" />

            {/* Break spots sheet — absolutely positioned, so it fills this phone
                frame rather than the viewport. Opened by the title row chevron. */}
            <BreakSpotsSheet
              isOpen={isBreakSpotsOpen}
              onClose={() => setIsBreakSpotsOpen(false)}
              spotsAvailable={15}
              spotsTotal={32}
            />
          </div>
        </div>
      </div>

      {/* dialkit panel. `productionEnabled` keeps it available on the deployed
          preview, since this whole route is an internal testing surface. */}
      <DialRoot position="bottom-right" theme="dark" defaultOpen productionEnabled />
    </div>
  )
}
