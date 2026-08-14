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
import { ChevronRight, Star } from "lucide-react"
import { teams, type Team } from "@/components/team-spinner"
import { SpinRollerSpinner } from "@/components/spin-roller-spinner"
import { useRevealStage, type RevealTuning } from "@/components/pill-reveal"
import { RevealCard, cardAbbrevCenterOffset, cardAbbrevFontSize } from "@/components/reveal-card"
import { BreakSpotsBar } from "@/components/break-spots-bar"
import { SwipeToBid } from "@/components/swipe-to-bid"

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
  /** Strength of the drum's velocity-driven motion blur; 0 disables it. */
  motionBlur?: number
  /** Ceiling on the blur's stdDeviation, in px. */
  motionBlurMax?: number
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
  /** Duration of the card's one-shot gloss shimmer, in ms. Lower = faster. */
  shimmerMs?: number
  /** How many spins the viewer gets. >1 spins that many times, then lets them
      pick which of the landed teams to keep. 1 keeps the straight-through flow. */
  spinCount?: number
  /** Beat between one spin landing and the drum starting the next, in ms. */
  betweenSpinsMs?: number
}

/* "picking" only occurs when spinCount > 1: every spin has landed and the stage
   is waiting for the viewer to tap one of the candidate pills. */
type Phase = "spinning" | "landed" | "picking" | "flying" | "reveal"

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
  motionBlur = 1,
  motionBlurMax = 10,
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
  shimmerMs = 620,
  spinCount = 1,
  betweenSpinsMs = 520,
}: SharedTransitionStageProps) {
  const rounds = Math.max(1, Math.round(spinCount))
  const isMulti = rounds > 1

  const [phase, setPhase] = useState<Phase>("spinning")
  const [landed, setLanded] = useState<Team | null>(null)
  const [hideCentre, setHideCentre] = useState(false)
  /* Multi-spin bookkeeping. `round` remounts the drum for each new spin, and
     `results` accumulates one landed team per spin, in spin order. */
  const [round, setRound] = useState(0)
  const [results, setResults] = useState<Team[]>([])
  const [roundForced, setRoundForced] = useState<number | null>(forcedIndex)
  /* Once a candidate is tapped, the losers dim in place and the picked pill's own
     label is hidden so the flying copy can stand in for it. */
  const [picked, setPicked] = useState<Team | null>(null)
  const [hidePickedLabel, setHidePickedLabel] = useState(false)
  /* Per-candidate label refs — the tapped one is the flight origin, exactly as
     the drum's centre row is in the single-spin flow. */
  const pillLabelRefs = useRef(new Map<string, HTMLSpanElement | null>())
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

  /* The team the centre stage is about: whatever the drum landed on in the
     single-spin flow, or whatever the viewer picked in the multi-spin one. */
  const hero = isMulti ? picked : landed
  const display = hero ? `${hero.city} ${hero.name}` : ""

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

  const pillTeam = phase === "reveal" ? hero : null
  const stage = useRevealStage(pillTeam, { drawMs: reveal.drawMs, holdMs: reveal.holdMs })

  /* `originEl` is whatever on-screen text the card grows out of: the drum's
     resting centre row in the single-spin flow, or the tapped candidate pill's
     label in the multi-spin one. Everything downstream is measured from its rect,
     so the shared-element hand-off is identical in both cases. */
  const beginFlight = useCallback(
    (team: Team, originEl: HTMLElement | null) => {
      const frame = frameRef.current
      const rowName = originEl
      if (!frame || !rowName || reduce) {
        if (isMulti) {
          setHidePickedLabel(true)
        } else {
          setHideCentre(true)
          setCollapse(true)
        }
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
      // Blank whichever label the flying copy is standing in for.
      if (isMulti) setHidePickedLabel(true)
      else setHideCentre(true)
      setPhase("flying")

      // Beat 1 — the full name dissolves where it sits on the roller. Linear
      // opacity so the dimming is visible from the first frame (easeIn held it at
      // full opacity and read as a cut). It also shrinks 20% as it goes, so the
      // fade reads as a readable exit gesture — the name receding away — instead
      // of the small row text merely disappearing behind the incoming abbrev.
      animate(fullOut, 0, { duration: nameFadeMs / 1000, ease: "linear" })
      animate(oscale, s0 * 0.8, { duration: nameFadeMs / 1000, ease: "easeIn" })

      /* Once the full name has finished fading — i.e. the winner has truly left
         its row — compress the drum so the neighbours close over the empty slot.
         Only meaningful when the drum row *was* the origin; in the multi-spin flow
         the card grows out of a pill, so the drum has nothing to close over. */
      if (!isMulti) stageTimers.current.push(setTimeout(() => setCollapse(true), nameFadeMs))

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
      isMulti,
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

  /* Schedules the centre-stage beats for one team: hold, flight, card turn-in,
     then the fill + headline. `originEl` is resolved at fire time rather than
     captured, so a pill that is still animating into place when the tap lands is
     measured where it actually ends up. Shared by both flows — the only
     difference between them is which element the card grows out of. */
  const runReveal = useCallback(
    (team: Team, getOrigin: () => HTMLElement | null, holdMs: number) => {
      // The short form only starts travelling once its lift-off delay elapses,
      // so it arrives a lift-delay later than the raw flight duration.
      const liftDelay = Math.max(0, nameFadeMs - overlapMs)
      const flightStart = holdMs + liftDelay
      const arriveAt = flightStart + flightMs

      /* The card begins tilting in *before* the short form reaches it, so the
         abbrev lands onto a card that is already turning rather than appearing on
         a flat, finished card. Lead by ~45% of the flight, clamped so the tilt
         never starts before the flight itself has lifted off. */
      const cardLead = Math.min(flightMs * 0.45, 300)
      const revealAt = Math.max(flightStart, arriveAt - cardLead)

      const timers: ReturnType<typeof setTimeout>[] = []
      timers.push(setTimeout(() => beginFlight(team, getOrigin()), holdMs))
      timers.push(setTimeout(() => setPhase("reveal"), revealAt))
      // Fill still waits for the abbrev to land and the turn to settle.
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
    [flightMs, nameFadeMs, overlapMs, reveal.drawMs, reveal.holdMs, reveal.fillMs, beginFlight, color],
  )

  /* The drum owns the spin and calls this once it rests on a team (after its own
     settle flash). Single-spin goes straight into the reveal; multi-spin banks the
     result and either queues the next spin or opens the pick step. */
  const handleLanded = useCallback(
    (team: Team) => {
      setLanded(team)
      setPhase("landed")
      onLanded?.(team)

      if (!isMulti) {
        runReveal(team, () => rowNameRef.current, landHoldMs)
        return
      }

      const banked = [...results, team]
      setResults(banked)

      if (banked.length >= rounds) {
        // Every spin is in. Raise the scrim and hand the choice to the viewer.
        stageTimers.current = [setTimeout(() => setPhase("picking"), landHoldMs)]
        return
      }

      /* Queue the next spin on a team that hasn't come up yet, so the candidates
         are always distinct, then remount the drum by bumping `round`. */
      const used = new Set(banked.map((t) => teams.indexOf(t)))
      const pool = teams.map((_, i) => i).filter((i) => !used.has(i))
      const next = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null
      stageTimers.current = [
        setTimeout(() => {
          setRoundForced(next)
          setRound((r) => r + 1)
          setPhase("spinning")
        }, betweenSpinsMs),
      ]
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMulti, rounds, results, betweenSpinsMs, landHoldMs, runReveal, onLanded],
  )

  /* Tapping a candidate commits it: the losers dim in place and the chosen pill
     hands its label off to the flying copy. Zero hold — the tap *is* the beat. */
  const handlePick = useCallback(
    (team: Team) => {
      if (phase !== "picking") return
      stageTimers.current.forEach(clearTimeout)
      setPicked(team)
      runReveal(team, () => pillLabelRefs.current.get(team.abbrev) ?? null, 0)
    },
    [phase, runReveal],
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
  const claimed = (phase === "reveal" || phase === "picking") && !dismissed
  const flying = phase === "flying" || phase === "reveal"
  /* The scrim also has to be up for the pick step, which happens before any
     flight — otherwise the candidate pills would float over an undimmed drum. */
  const scrimUp = flying || phase === "picking"
  /* Only the finished reveal is dismissable. During the pick step a stray tap
     must not throw the choice away. */
  const scrimInteractive = phase === "reveal" && !dismissed

  // ─── Bottom slot: the real roller, driven to spin-and-land only ───────────
  // Opacity (the claimed dim + the dismiss fade) is owned by the crossfade
  // wrapper below, so this is a plain card shell.
  const rollerCard = (
    <div>
      <div className="relative bg-[#212121] rounded-2xl p-3">
      <SpinRollerSpinner
        /* `round` is part of the key so each additional spin remounts the drum
           and replays its spin-up from scratch. */
        key={`shared-roller-${spinKey}-${round}`}
        isSpinning={isSpinning}
        onLanded={handleLanded}
        winnerName={winnerName}
        breakNumber={breakNumber}
        availableSpots={availableSpots}
        totalSpots={totalSpots}
        onViewSpots={onViewSpots}
        forceTeamIndex={roundForced}
        spinDuration={spinDuration}
        startSpeed={startSpeed}
        rampUp={rampUp}
        stopEase={stopEase}
        rowPitch={rowPitch}
        motionBlur={motionBlur}
        motionBlurMax={motionBlurMax}
        reveal={reveal}
          disableReveal
          centreRowRef={rowNameRef}
          hideCentreLabel={hideCentre}
          collapseCentre={collapse}
        />
      </div>
    </div>
  )

  /* ─── Bid box card ────────────────────────────────────────────────────────
     Once the reveal is dismissed, the roller card gives way to the auction /
     "bid box" card for this break — the same chrome the live stream shows,
     reusing `BreakSpotsBar` and `SwipeToBid` rather than restating them here.

     This is the "bid box reactivation" beat from the full flow: the spot just
     assigned is claimed (so the counter is down one) and the box is live again
     for the next round, which is why the title drops back to a plain "Random
     Break #N" and the CTA is an armed swipe-to-bid rather than a won state. */
  const bidBox = (
    <div>
      <div className="relative rounded-2xl overflow-hidden">
      {/* Incentive Tile — spots row (Figma). The spot just assigned is claimed,
          so the counter is down one; the underlined "View spots" CTA opens the
          spots sheet, and a bottom border divides it from the Buy Box. */}
      <button
        type="button"
        onClick={onViewSpots}
        aria-label={`${Math.max(0, availableSpots - 1)} of ${totalSpots} spots available. View spots.`}
        className="flex w-full items-center justify-between gap-2 border-b border-[#363636] bg-black/40 px-4 py-2 text-left backdrop-blur transition-opacity hover:opacity-90"
      >
        <span className="text-xs leading-4 text-[#f7f7f7]">{Math.max(0, availableSpots - 1)}/{totalSpots} spots available</span>
        <span className="flex-shrink-0 text-xs leading-4 text-[#8f8f8f] underline">View spots</span>
      </button>

      <div className="bg-black/40 backdrop-blur px-4 py-2">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm text-white mb-0.5 truncate">
            <span className="font-semibold">
              {`Random Break #${breakNumber}`}
              {" — 2025 Panini Luminance Football Hobby PYT Box Break #903"}
            </span>
          </p>
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg">$28.00</span>
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.2998 1C7.37676 1 8.25 1.87324 8.25 2.9502V3.75H9.38965C9.8451 3.75004 10.2759 3.95696 10.5605 4.3125L11.6709 5.70117C11.8838 5.96724 12 6.29819 12 6.63867V8C11.9999 8.82823 11.3285 9.5 10.5 9.5H9.5C9.5 10.3284 8.82843 11 8 11C7.17157 11 6.5 10.3284 6.5 9.5H4C4 10.3284 3.32843 11 2.5 11C1.67157 11 1 10.3284 1 9.5H0.75C0.335786 9.5 0 9.16421 0 8.75C0 8.33579 0.335786 8 0.75 8H6.2998C6.54833 8 6.75 7.79833 6.75 7.5498V2.9502C6.75 2.70167 6.54833 2.5 6.2998 2.5H0.75C0.335786 2.5 0 2.16421 0 1.75C0 1.33579 0.335786 1 0.75 1H6.2998ZM8.25 7.5498C8.25 7.70495 8.22955 7.85531 8.19531 8H10.5V6.6377L9.38965 5.25H8.25V7.5498ZM3.75 4.5C4.16421 4.5 4.5 4.83579 4.5 5.25C4.5 5.66421 4.16421 6 3.75 6H0.75C0.335786 6 0 5.66421 0 5.25C0 4.83579 0.335786 4.5 0.75 4.5H3.75Z"
                  fill="rgba(255,255,255,0.5)"
                />
              </svg>
              <span className="text-white/50 text-sm">$5 shipping</span>
            </div>
          </div>
        </div>
        {/* Decorative chevron — the "View spots" CTA above opens the sheet. */}
        <div aria-hidden="true" className="flex-shrink-0 mt-1">
          <ChevronRight className="w-5 h-5 text-white/40" />
        </div>
      </div>

      {/* Live again for the next spot, so another bidder now leads and the
          countdown is running. */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-green-400 font-medium text-sm">Jessica991</span>
          <span className="text-white/60 text-sm">is winning</span>
        </div>
        <div className="flex items-center gap-1.5 text-red-500">
          <div className="w-4 h-4 rounded-full border-2 border-red-500 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-red-500" />
          </div>
          <span className="font-medium text-sm">00:10</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className="px-5 py-2.5 rounded-full font-medium text-sm border border-white/30 text-white transition-colors hover:bg-white/10"
        >
          Max bid
        </button>
        {/* The shared swipe-to-bid control, armed for the next round. */}
        <div className="flex-1">
          <SwipeToBid amount={30} onBidConfirmed={() => {}} />
        </div>
      </div>
      </div>
      </div>
    </div>
  )

  /* Roller ⇆ bid box crossfade. Whichever card is active sits in normal flow so
     it reserves its own (differing) height; the other overlays it, bottom-
     anchored so the swap grows/shrinks upward from the bottom of the stack
     rather than shoving the chat around from the top. */
  const bottomSlot = (
    <div className="relative">
      <motion.div
        className={dismissed ? "absolute inset-x-0 bottom-0" : "relative"}
        initial={false}
        animate={{ opacity: dismissed ? 0 : claimed ? 0.55 : 1, y: dismissed ? -12 : 0 }}
        transition={{
          opacity: { duration: dismissed ? 0.2 : 0.4, ease: "easeOut" },
          y: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
        }}
        style={{ pointerEvents: dismissed ? "none" : "auto" }}
        aria-hidden={dismissed || undefined}
      >
        {rollerCard}
      </motion.div>

      <motion.div
        className={dismissed ? "relative" : "absolute inset-x-0 bottom-0"}
        initial={false}
        animate={{ opacity: dismissed ? 1 : 0, y: dismissed ? 0 : 12 }}
        transition={{
          opacity: { duration: 0.3, ease: "easeOut", delay: dismissed ? 0.08 : 0 },
          y: { duration: 0.32, ease: [0.32, 0.72, 0, 1], delay: dismissed ? 0.08 : 0 },
        }}
        style={{ pointerEvents: dismissed ? "auto" : "none" }}
        aria-hidden={dismissed ? undefined : true}
      >
        {bidBox}
      </motion.div>
    </div>
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
          animate={{ opacity: scrimUp ? 1 : 0 }}
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
          shimmerMs={shimmerMs}
          /* The flown-in short form is the abbreviation; the card only holds
             its place so the helmet and name still sit correctly. */
          hideAbbrev
        />
      )}

      {/* Two independent layers. Each sits in its own wrapper that is CSS-centred
          on the frame (shrink-wraps its text, then translate(-50%) recentres);
          the inner motion layer carries only x/y/scale/opacity, offsetting from
          that centre — the same FLIP pattern the single flying element used. */}
      {flying && hero && (
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
              {hero.abbrev}
            </motion.div>
          </div>
        </>
      )}

      {/* ─── Candidate pills (multi-spin only) ���──────────────────────────────
          One pill per spin, in spin order, anchored to the bottom of the frame.
          They stay mounted through the reveal so the ones the viewer passed up
          fade and desaturate *in place* rather than vanishing. The picked pill
          instead empties out: its label is the element that flies to the card, so
          the shell fades as the label departs. */}
      {isMulti && (phase === "picking" || phase === "flying" || phase === "reveal") && (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex flex-col items-center gap-2 px-4">
          <AnimatePresence>
            {phase === "picking" && (
              <motion.span
                key="pick-prompt"
                className="block text-white/70 text-xs font-semibold uppercase tracking-widest"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                {`Tap to keep 1 of your ${rounds} spins`}
              </motion.span>
            )}
          </AnimatePresence>

          {results.map((t, i) => {
            const isPicked = picked?.abbrev === t.abbrev
            const isLoser = picked !== null && !isPicked
            return (
              <motion.button
                key={`${t.abbrev}-${i}`}
                type="button"
                disabled={phase !== "picking"}
                onClick={() => handlePick(t)}
                aria-label={`Keep ${t.city} ${t.name}`}
                className="rounded-full px-6 py-3 min-w-[200px] font-bold text-white text-base transition-colors disabled:cursor-default"
                style={{
                  backgroundColor: PILL_IDLE,
                  border: "1px solid rgba(255,255,255,0.14)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
                  // Only the pick step accepts taps; afterwards they are inert.
                  pointerEvents: phase === "picking" ? "auto" : "none",
                  cursor: phase === "picking" ? "pointer" : "default",
                }}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{
                  // Losers dim and desaturate where they sit; the picked shell
                  // empties as its label flies off; unresolved pills sit at rest.
                  opacity: isLoser ? 0.3 : isPicked ? 0 : 1,
                  filter: isLoser ? "grayscale(1)" : "grayscale(0)",
                  y: 0,
                  scale: isLoser ? 0.97 : 1,
                }}
                transition={{
                  // Staggered entrance, in the order the spins landed.
                  duration: isPicked ? nameFadeMs / 1000 : 0.34,
                  ease: "easeOut",
                  delay: picked === null ? 0.06 + i * 0.07 : 0,
                }}
              >
                {/* The label is the flight origin, so it is measured and hidden
                    independently of the shell around it. */}
                <span
                  ref={(el) => {
                    pillLabelRefs.current.set(t.abbrev, el)
                  }}
                  style={{ visibility: isPicked && hidePickedLabel ? "hidden" : "visible" }}
                >
                  {`${t.city} ${t.name}`}
                </span>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Headline above the card — "{winner}'s spot was assigned". */}
      <AnimatePresence>
        {showTag && hero && (
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
        {showTag && hero && (
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
      {bottomSlot}
      {portalReady && frameRef.current ? createPortal(overlay, frameRef.current) : null}
    </>
  )
}
