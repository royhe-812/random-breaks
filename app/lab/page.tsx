"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { SpinInPlaceSpinner } from "@/components/spin-in-place-spinner"
import { SpinRollerSpinner } from "@/components/spin-roller-spinner"
import { teams, type Team } from "@/components/team-spinner"

type Variant = "roller" | "classic"

interface LogEntry {
  id: number
  at: string
  ms: number
  team: string
  forced: boolean
}

/** Contrast helper so team swatch chips keep readable labels. */
function readableOn(hex: string) {
  const h = hex.replace("#", "")
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const r = toLinear(parseInt(h.slice(0, 2), 16) / 255)
  const g = toLinear(parseInt(h.slice(2, 4), 16) / 255)
  const b = toLinear(parseInt(h.slice(4, 6), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42 ? "#101820" : "#ffffff"
}

export default function SpinnerLabPage() {
  const [variant, setVariant] = useState<Variant>("roller")
  const [isSpinning, setIsSpinning] = useState(false)
  const [forcedIndex, setForcedIndex] = useState<number | null>(null)
  const [landed, setLanded] = useState<Team | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [elapsed, setElapsed] = useState(0)
  // Remount key: the spinners reset on `isSpinning=false`, so a fresh run needs
  // a new instance to guarantee a clean start rather than a partial reset.
  const [runKey, setRunKey] = useState(0)

  const startedAt = useRef<number>(0)

  // Live elapsed timer so the progress of a run is observable, not just its end.
  useEffect(() => {
    if (!isSpinning) return
    let raf = 0
    const tick = () => {
      setElapsed(performance.now() - startedAt.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isSpinning])

  const startSpin = useCallback(() => {
    setLanded(null)
    setElapsed(0)
    startedAt.current = performance.now()
    setRunKey((k) => k + 1)
    setIsSpinning(true)
  }, [])

  const reset = useCallback(() => {
    setIsSpinning(false)
    setLanded(null)
    setElapsed(0)
    setRunKey((k) => k + 1)
  }, [])

  const handleLanded = useCallback(
    (team: Team) => {
      const ms = performance.now() - startedAt.current
      setLanded(team)
      setElapsed(ms)
      setLog((prev) =>
        [
          {
            id: Date.now(),
            at: new Date().toLocaleTimeString([], { hour12: false }),
            ms: Math.round(ms),
            team: `${team.city} ${team.name}`,
            forced: forcedIndex !== null,
          },
          ...prev,
        ].slice(0, 8),
      )
    },
    [forcedIndex],
  )

  const status = landed ? "landed" : isSpinning ? "spinning" : "idle"
  const statusColor = landed ? "#4ce160" : isSpinning ? "#eab308" : "#8f8f8f"

  const spinnerProps = {
    isSpinning,
    onLanded: handleLanded,
    winnerName: "Adam007",
    breakNumber: 15,
    availableSpots: 15,
    totalSpots: 32,
    forceTeamIndex: forcedIndex,
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">Spinner Testing Zone</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Run the randomization in isolation, force a specific outcome, and watch the landing behaviour without
            playing the full bid flow.
          </p>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* ── Mobile device frame ── */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="relative flex-shrink-0 rounded-[2.75rem] border-[3px] p-3"
              style={{
                width: 360,
                borderColor: "#2a2a2a",
                backgroundColor: "#0a0a0a",
                boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
              }}
            >
              {/* Notch */}
              <div
                className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full"
                style={{ width: 104, height: 22, backgroundColor: "#000" }}
              />
              <div
                className="relative overflow-hidden rounded-[2.25rem]"
                style={{ height: 620, backgroundColor: "#000" }}
              >
                {/* Status bar */}
                <div className="flex items-center justify-between px-6 pb-2 pt-5">
                  <span className="text-xs font-semibold text-white">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-4 rounded-sm border border-white/60" />
                    <div className="h-2.5 w-1 rounded-sm bg-white/60" />
                  </div>
                </div>

                {/* Screen content — the spinner card sits in the same footprint
                    it occupies in the real bid box. */}
                <div className="flex h-[calc(100%-52px)] flex-col justify-end gap-3 px-4 pb-6">
                  <div
                    className="rounded-2xl p-4 backdrop-blur"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div style={{ minHeight: 223 }} className="flex">
                      {variant === "roller" ? (
                        <SpinRollerSpinner key={`roller-${runKey}`} {...spinnerProps} />
                      ) : (
                        <SpinInPlaceSpinner key={`classic-${runKey}`} {...spinnerProps} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Home indicator */}
                <div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: 120, height: 4, backgroundColor: "rgba(255,255,255,0.3)" }}
                />
              </div>
            </div>

            {/* Live readout under the device */}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
                <span className="font-mono uppercase tracking-wide" style={{ color: statusColor }}>
                  {status}
                </span>
              </span>
              <span className="font-mono text-muted-foreground">{(elapsed / 1000).toFixed(2)}s</span>
            </div>
          </div>

          {/* ── Controls ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {/* Variant */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Variant</h2>
              <div className="flex gap-2">
                {(
                  [
                    { id: "roller", label: "Roller (wheel)" },
                    { id: "classic", label: "Classic (ticker)" },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVariant(v.id)
                      reset()
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      variant === v.id
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Run controls */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Run</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={startSpin}
                  disabled={isSpinning && !landed}
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: "#4ce160", color: "#04140a" }}
                >
                  {landed ? "Spin again" : isSpinning ? "Spinning…" : "Start spin"}
                </button>
                <button
                  onClick={reset}
                  className="rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  style={{ borderColor: "rgba(255,255,255,0.15)" }}
                >
                  Reset
                </button>
              </div>
            </section>

            {/* Outcome picker */}
            <section>
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Winner outcome</h2>
                <span className="text-xs text-muted-foreground">
                  {forcedIndex === null ? "Random each run" : `Forced: ${teams[forcedIndex].city} ${teams[forcedIndex].name}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setForcedIndex(null)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    forcedIndex === null
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Random
                </button>
                {teams.map((t, i) => {
                  const active = forcedIndex === i
                  return (
                    <button
                      key={t.abbrev}
                      onClick={() => setForcedIndex(i)}
                      title={`${t.city} ${t.name}`}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-transform hover:scale-105"
                      style={{
                        backgroundColor: active ? t.color : "rgba(255,255,255,0.07)",
                        color: active ? readableOn(t.color) : "#a1a1a1",
                        outline: active ? `2px solid ${t.color}` : "none",
                        outlineOffset: 2,
                      }}
                    >
                      {t.abbrev}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Result */}
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Result</h2>
              {landed ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ backgroundColor: landed.color, color: readableOn(landed.color) }}
                >
                  <span
                    className="rounded-lg px-2.5 py-1 text-sm font-bold"
                    style={{ backgroundColor: "rgba(0,0,0,0.22)" }}
                  >
                    {landed.abbrev}
                  </span>
                  <span className="font-bold">
                    {landed.city} {landed.name}
                  </span>
                  <span className="ml-auto font-mono text-xs opacity-80">{Math.round(elapsed)}ms</span>
                </motion.div>
              ) : (
                <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  No result yet — start a spin.
                </p>
              )}
            </section>

            {/* History */}
            {log.length > 0 && (
              <section>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    History
                  </h2>
                  <button onClick={() => setLog([])} className="text-xs text-muted-foreground underline hover:text-foreground">
                    Clear
                  </button>
                </div>
                <ul className="flex flex-col gap-1">
                  {log.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                    >
                      <span className="font-mono text-xs text-muted-foreground">{e.at}</span>
                      <span className="truncate font-medium">{e.team}</span>
                      {e.forced && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#a1a1a1" }}>
                          forced
                        </span>
                      )}
                      <span className="ml-auto font-mono text-xs text-muted-foreground">{e.ms}ms</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
