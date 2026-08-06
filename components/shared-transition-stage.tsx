"use client"

/**
 * Shared-element transition tester: ties the spin and the reveal together.
 *
 * The story, in five beats:
 *   1. the roller drum (the real SpinRollerSpinner) spins and lands on the winner
 *   2. it holds on the full "City Name" for a beat so viewers read it
 *   3. that same text lifts out of the drum's centre row and flies to the centre
 *      of the phone, and *as it travels* the full "Detroit Lions" crossfades into
 *      the short "DET"
 *   4. the centre pill runs its staged stroke-and-fill reveal around the abbrev
 *   5. a "Claimed by @user" tag rises in — the team is gone from the spots
 *
 * The spin is the actual roller, not a bespoke cycler: it is driven with
 * `disableReveal` so it only spins and lands, handing the reveal off to screen
 * centre. Its centre row is measured (via `centreRowRef`) as the flight origin,
 * and hidden (via `hideCentreLabel`) the instant the flying copy takes over.
 *
 * The flight is a manual FLIP on a single overlay element that carries the
 * translate + grow. Inside it, the full name and the abbreviation are stacked in
 * one grid cell and cross-faded on opacity — a plain, subtle swap rather than a
 * per-letter collapse, which read as janky as the glyph widths animated shut.
 *
 * The overlay is portalled into the phone-frame element (passed as `frameRef`)
 * rather than rendered in the spinner slot, so "centre" means the centre of the
 * whole screen and the drum keeps its natural place in the bottom stack.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion"
import { teams, type Team } from "@/components/team-spinner"
import { SpinRollerSpinner } from "@/components/spin-roller-spinner"
import { useRevealStage, type RevealTuning } from "@/components/pill-reveal"
import { RevealCard, cardAbbrevCenterOffset, cardAbbrevFontSize } from "@/components/reveal-card"

/** Black or white foreground per WCAG relative luminance. */
function readableOn(hex: string) {
  const h = hex.replace("#", "")
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const r = lin(parseInt(h.slice(0, 2), 16) / 255)
  const g = lin(parseInt(h.slice(2, 4), 16) / 255)
  const b = lin(parseInt(h.slice(4, 6), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42 ? "#101820" : "#ffffff"
}

interface SharedTransitionStageProps {
  frameRef: React.RefObject<HTMLDivElement | null>
  /** Forces the drum to land on this index; leave null for random. */
  forcedIndex: number | null
  spinKey: number
  isSpinning: boolean
  onLanded?: (team: Team) => void
  reveal: RevealTuning
  winnerName?: string
  /** Roller spin feel — forwarded straight to SpinRollerSpinner. */
  spinDuration?: number
  startSpeed?: number
  rampUp?: number
  stopEase?: number
  rowPitch?: number
  /** Roller chrome, kept in sync with the other variants' bid box card. */
  breakNumber?: number
  availableSpots?: number
  totalSpots?: number
  onViewSpots?: () => void
  /** Extra beat on the landed full name (after the drum's own settle) before flight. */
  landHoldMs?: number
  /** Flight duration, drum centre → screen centre. */
  flightMs?: number
  /** Peak lift of the flight arc, in px. 0 is a straight line. */
  arc?: number
  /** How long the full name takes to fade out in place at the roller, in ms. */
  nameFadeMs?: number
  /** How much the short form's lift-off overlaps the tail of that fade, in ms.
      Larger = the short form appears sooner, before the full name is fully gone. */
  overlapMs?: number
  /** Abbreviation font size at the centre, in px. */
  centerFont?: number
  /** Peak darkness of the scrim behind the flight, 0–1. 0 disables it. */
  scrimOpacity?: number
  /** Peak of the trading card's subtle 3D turn-in, in degrees. 0 disables it. */
  cardTiltDeg?: number
}

type Phase = "spinning" | "landed" | "flying" | "reveal"

// The reveal is now a portrait trading card rather than a flat pill.
const CARD_W = 188
const CARD_H = 264
const CARD_R = 18
const PILL_IDLE = "#1c1c1e"

/* The short form that flies out of the drum IS the card's abbreviation — it
   travels to the card's abbreviation slot and simply stays there, so the card
   never paints a second copy. Both numbers are derived from the card itself so
   the flight can't land at a different size or position than the slot it fills. */
const ABBREV_FONT = cardAbbrevFontSize(CARD_H)
const ABBREV_TARGET_Y = cardAbbrevCenterOffset(CARD_H)

export function SharedTransitionStage({
  frameRef,
  forcedIndex,
  spinKey,
  isSpinning,
  onLanded,
  reveal,
  winnerName = "Adam007",
  spinDuration = 4000,
  startSpeed = 0.09,
  rampUp = 0.35,
  stopEase = 3,
  rowPitch = 26,
  breakNumber = 15,
  availableSpots = 15,
  totalSpots = 32,
  onViewSpots,
  landHoldMs = 440,
  flightMs = 740,
  arc = 40,
  nameFadeMs = 250,
  overlapMs = 160,
  centerFont = 42,
  scrimOpacity = 0.72,
  cardTiltDeg = 16,
}: SharedTransitionStageProps) {
  const [phase, setPhase] = useState<Phase>("spinning")
  const [landed, setLanded] = useState<Team | null>(null)
  const [hideCentre, setHideCentre] = useState(false)
  const [showTag, setShowTag] = useState(false)
  const [portalReady, setPortalReady] = useState(false)
  // Tap-to-dismiss: fades the reveal + scrim away and hands the frame back.
  const [dismissed, setDismissed] = useState(false)
  // Compress the drum once the winner has flown off, closing the vacated slot.
  const [collapse, setCollapse] = useState(false)

  // Attached to the drum's resting centre row — the flight origin.
  const rowNameRef = useRef<HTMLSpanElement>(null)
  // Sequence timers, cleared on unmount so a mid-flight respin can't fire stale steps.
  const stageTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const display = landed ? `${landed.city} ${landed.name}` : ""

  /* Two separate layers now, no longer a single crossfading element:
       • the full name sits STILL at the roller's centre row (ox/oy/oscale, never
         animated) and fades out in place via `fullOut`;
       • the short form lifts off from that same spot and travels+grows to centre
         (fx/fy/fscale) while fading in via `abbrevIn`.
     The short form's lift-off slightly overlaps the tail of the full name's
     fade, so the two beats feel connected rather than strictly sequential. */
  const ox = useMotionValue(0)
  const oy = useMotionValue(0)
  const oscale = useMotionValue(1)
  const fullOut = useMotionValue(1)

  const fx = useMotionValue(0)
  const fy = useMotionValue(0)
  const fscale = useMotionValue(1)
  const abbrevIn = useMotionValue(0)
  const color = useMotionValue("#ffffff")

  const reduce = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  )

  useEffect(() => setPortalReady(true), [])

  const pillTeam = phase === "reveal" ? landed : null
  const stage = useRevealStage(pillTeam, { drawMs: reveal.drawMs, holdMs: reveal.holdMs })

  const beginFlight = useCallback(
    (team: Team) => {
      const frame = frameRef.current
      const rowName = rowNameRef.current
      if (!frame || !rowName || reduce) {
        setHideCentre(true)
        setCollapse(true)
        fullOut.set(0)
        abbrevIn.set(1)
        fx.set(0)
        fy.set(ABBREV_TARGET_Y)
        fscale.set(1)
        setPhase("reveal")
        return
      }
      const fRect = frame.getBoundingClientRect()
      const sRect = rowName.getBoundingClientRect()
      // Source centre and target (frame) centre, in frame-local coords.
      const sx = sRect.left - fRect.left + sRect.width / 2
      const sy = sRect.top - fRect.top + sRect.height / 2
      const tx = fRect.width / 2
      const ty = fRect.height / 2
      const dx = sx - tx
      const dy = sy - ty
      /* Match the drum row's *rendered* size, not its 14px nominal size: the
         centre row sits on translateZ(RADIUS) under perspective, so it renders
         larger than 14px. Deriving s0 from the measured height makes both the
         full-name copy and the short form start exactly the size of the text
         they replace on the roller. */
      const s0 = sRect.height / centerFont
      /* The abbreviation renders at the card's own font size, not `centerFont`,
         so it needs its own start scale to leave the row at the row's size. */
      const s0Abbrev = sRect.height / ABBREV_FONT

      // Full name: pinned to the roller row, fades out in place (no travel).
      ox.set(dx)
      oy.set(dy)
      oscale.set(s0)
      fullOut.set(1)
      // Short form: starts on that same row, invisible, then lifts off.
      fx.set(dx)
      fy.set(dy)
      fscale.set(s0Abbrev)
      abbrevIn.set(0)
      color.set("#ffffff")
      setHideCentre(true)
      setPhase("flying")

      // Beat 1 — the full name dissolves where it sits on the roller. Linear
      // opacity so the dimming is visible from the first frame (easeIn held it at
      // full opacity and read as a cut). It also shrinks 20% as it goes, so the
      // fade reads as a readable exit gesture — the name receding away — instead
      // of the small row text merely disappearing behind the incoming abbrev.
      animate(fullOut, 0, { duration: nameFadeMs / 1000, ease: "linear" })
      animate(oscale, s0 * 0.8, { duration: nameFadeMs / 1000, ease: "easeIn" })

      // Once the full name has finished fading — i.e. the winner has truly left
      // its row — compress the drum so the neighbours close over the empty slot.
      stageTimers.current.push(setTimeout(() => setCollapse(true), nameFadeMs))

      // Beat 2 — the short form lifts off slightly before the fade completes,
      // then grows and travels to the centre.
      const liftDelay = Math.max(0, nameFadeMs - overlapMs) / 1000
      const dur = flightMs / 1000
      animate(fx, 0, { duration: dur, delay: liftDelay, ease: [0.22, 0.61, 0.36, 1] })
      /* Arc: lift toward the target, then settle. The target is the card's
         abbreviation slot (above centre), not the frame centre — this element
         stays put afterwards and serves as the card's abbreviation. */
      animate(fy, arc > 0 ? [dy, Math.min(dy, ABBREV_TARGET_Y) - arc, ABBREV_TARGET_Y] : ABBREV_TARGET_Y, {
        duration: dur,
        delay: liftDelay,
        ease: [0.22, 0.61, 0.36, 1],
      })
      animate(fscale, 1, { duration: dur, delay: liftDelay, ease: [0.33, 0, 0.2, 1] })
      animate(abbrevIn, 1, {
        duration: Math.min(dur, 0.26),
        delay: liftDelay,
        ease: "easeOut",
      })
    },
    [
      frameRef,
      centerFont,
      flightMs,
      arc,
      nameFadeMs,
      overlapMs,
      reduce,
      ox,
      oy,
      oscale,
      fullOut,
      fx,
      fy,
      fscale,
      abbrevIn,
      color,
    ],
  )

  /* The drum owns the spin and calls this once it rests on the winner (after its
     own settle flash). From here the stage schedules the rest of the sequence. */
  const handleLanded = useCallback(
    (team: Team) => {
      setLanded(team)
      setPhase("landed")
      onLanded?.(team)

      // The short form only starts travelling once its lift-off delay elapses,
      // so the reveal lands a lift-delay later than the raw flight duration.
      const liftDelay = Math.max(0, nameFadeMs - overlapMs)
      const arriveAt = landHoldMs + liftDelay + flightMs

      const timers: ReturnType<typeof setTimeout>[] = []
      timers.push(setTimeout(() => beginFlight(team), landHoldMs))
      timers.push(setTimeout(() => setPhase("reveal"), arriveAt))
      const fillAt = arriveAt + (reveal.drawMs ?? 420) + (reveal.holdMs ?? 140)
      timers.push(
        setTimeout(() => {
          animate(color, readableOn(team.color), { duration: (reveal.fillMs ?? 320) / 1000 })
          setShowTag(true)
        }, fillAt),
      )
      stageTimers.current = timers
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [landHoldMs, flightMs, nameFadeMs, overlapMs, reveal.drawMs, reveal.holdMs, reveal.fillMs, beginFlight, onLanded, color],
  )

  useEffect(() => () => stageTimers.current.forEach(clearTimeout), [])

  /* Tap the scrim once the team is revealed to dismiss it: stop any pending
     sequence steps and let the overlay fade out. */
  const handleDismiss = useCallback(() => {
    if (phase !== "reveal" || dismissed) return
    stageTimers.current.forEach(clearTimeout)
    setDismissed(true)
  }, [phase, dismissed])

  // Row un-dims on dismiss; the overlay children stay phase-gated so they fade
  // out together via the wrapper rather than popping out one by one.
  const claimed = phase === "reveal" && !dismissed
  const flying = phase === "flying" || phase === "reveal"
  const scrimInteractive = phase === "reveal" && !dismissed

  // ─── Bottom slot: the real roller, driven to spin-and-land only ───────────
  const row = (
    <motion.div
      className="relative bg-[#212121] rounded-2xl p-3"
      animate={{ opacity: claimed ? 0.55 : 1 }}
      transition={{ duration: 0.4 }}
    >
      <SpinRollerSpinner
        key={`shared-roller-${spinKey}`}
        isSpinning={isSpinning}
        onLanded={handleLanded}
        winnerName={winnerName}
        breakNumber={breakNumber}
        availableSpots={availableSpots}
        totalSpots={totalSpots}
        onViewSpots={onViewSpots}
        forceTeamIndex={forcedIndex}
        spinDuration={spinDuration}
        startSpeed={startSpeed}
        rampUp={rampUp}
        stopEase={stopEase}
        rowPitch={rowPitch}
        reveal={reveal}
          disableReveal
          centreRowRef={rowNameRef}
          hideCentreLabel={hideCentre}
          collapseCentre={collapse}
        />
    </motion.div>
  )

  // ─── Centre overlay (portalled into the phone frame) ─────────────────────
  const overlay = (
    <motion.div
      className="pointer-events-none absolute inset-0 z-30"
      animate={{ opacity: dismissed ? 0 : 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Scrim: darkens the whole frame behind the flight so the flying name and
          the centre reveal read against the drum and chrome. Fades in with the
          flight and holds through the reveal; a radial gradient keeps the centre
          darkest without hard edges. Rendered first, so it sits under the pill,
          the flying text, and the tag. */}
      {scrimOpacity > 0 && (
        <motion.div
          role={scrimInteractive ? "button" : undefined}
          aria-label={scrimInteractive ? "Dismiss reveal" : undefined}
          aria-hidden={scrimInteractive ? undefined : true}
          onClick={scrimInteractive ? handleDismiss : undefined}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,${scrimOpacity}) 0%, rgba(0,0,0,${Math.min(1, scrimOpacity + 0.12)}) 100%)`,
            /* Subtle frosting on the drum/chrome behind the scrim. Eases in with
               the layer's opacity, so the blur ramps up alongside the darkening. */
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            /* Only tappable once the team is revealed; a tap dismisses it. */
            pointerEvents: scrimInteractive ? "auto" : "none",
            cursor: scrimInteractive ? "pointer" : "default",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: flying ? 1 : 0 }}
          transition={{ duration: flightMs / 1000, ease: "easeOut" }}
        />
      )}

      {/* The staged trading-card reveal, centred in the frame. */}
      {phase === "reveal" && (
        <RevealCard
          team={pillTeam}
          stage={stage}
          width={CARD_W}
          height={CARD_H}
          radius={CARD_R}
          idleColor={PILL_IDLE}
          drawMs={reveal.drawMs}
          holdMs={reveal.holdMs}
          fillMs={reveal.fillMs}
          drawEase={reveal.drawEase}
          lapTurns={reveal.lapTurns}
          headLen={reveal.headLen}
          strokeWidth={reveal.strokeWidth}
          glow={reveal.glow}
          tiltDeg={cardTiltDeg}
          /* The flown-in short form is the abbreviation; the card only holds
             its place so the helmet and name still sit correctly. */
          hideAbbrev
        />
      )}

      {/* Two independent layers. Each sits in its own wrapper that is CSS-centred
          on the frame (shrink-wraps its text, then translate(-50%) recentres);
          the inner motion layer carries only x/y/scale/opacity, offsetting from
          that centre — the same FLIP pattern the single flying element used. */}
      {flying && landed && (
        <>
          {/* Full name — pinned to the roller row (ox/oy/oscale never animate),
              fading out in place. */}
          <div
            className="absolute"
            style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
          >
            <motion.div
              className="font-semibold"
              style={{
                x: ox,
                y: oy,
                scale: oscale,
                opacity: fullOut,
                color: "#ffffff",
                fontSize: centerFont,
                letterSpacing: "0.02em",
                whiteSpace: "pre",
                lineHeight: 1,
                textShadow: "0 2px 12px rgba(0,0,0,0.6)",
              }}
            >
              {display}
            </motion.div>
          </div>

          {/* Short form — lifts off the same row, grows and travels to centre. */}
          <div
            className="absolute"
            style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
          >
            {/* This element does not hand off to a second copy — it lands in the
                card's abbreviation slot and stays there AS the card's
                abbreviation (the card itself only reserves the space). Size,
                weight and tracking therefore come from the card's own geometry.
                The drop shadow only helps while it's flying over the scrim, so it
                is dropped once it's resting on the card face. */}
            <motion.div
              className="font-bold"
              style={{
                x: fx,
                y: fy,
                scale: fscale,
                opacity: abbrevIn,
                color,
                fontSize: ABBREV_FONT,
                letterSpacing: "0.04em",
                whiteSpace: "pre",
                lineHeight: 1,
                textShadow: phase === "reveal" ? "none" : "0 2px 12px rgba(0,0,0,0.6)",
              }}
            >
              {landed.abbrev}
            </motion.div>
          </div>
        </>
      )}

      {/* Headline above the card — "{winner}'s spot was assigned". */}
      <AnimatePresence>
        {showTag && landed && (
          <motion.div
            key="headline"
            className="absolute left-1/2 -translate-x-1/2 w-[280px] text-center"
            style={{ top: `calc(50% - ${CARD_H / 2 + 74}px)` }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <span className="block text-white text-2xl font-bold leading-tight text-balance">
              {winnerName}&apos;s spot was assigned
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dismiss hint below the card. */}
      <AnimatePresence>
        {showTag && landed && (
          <motion.div
            key="dismiss-hint"
            className="absolute left-1/2 -translate-x-1/2 text-center"
            style={{ top: `calc(50% + ${CARD_H / 2 + 22}px)` }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
          >
            <span className="text-white/50 text-sm font-medium">Tap anywhere to dismiss</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  return (
    <>
      {row}
      {portalReady && frameRef.current ? createPortal(overlay, frameRef.current) : null}
    </>
  )
}
