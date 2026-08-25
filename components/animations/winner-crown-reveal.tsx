"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import Image from "next/image"

interface WinnerCrownRevealProps {
  isRevealing: boolean
  onComplete: () => void
  /**
   * "subtle"   — ambient floaters over the stream (see FLOATERS).
   * "takeover" — the full-screen treatment scoped to the bid box. Must be
   *              rendered INSIDE the bid-box wrapper, since it fills its parent.
   */
  variant?: "default" | "subtle" | "takeover"
}

/* Stacked "WINNER" wordmarks in the in-box takeover. Four at the same size as
   the six they replace, so the stack is deliberately less dense than before —
   it no longer fills the box top to bottom. */
const TAKEOVER_LINES = 4

/* The supplied wordmark, inlined rather than loaded from /public: it renders
   without needing `dangerouslyAllowSVG` for next/image, and four copies cost no
   extra requests. Aspect ratio is fixed by the artwork. */
const WORDMARK_W = 102
const WORDMARK_H = 23

/* Wordmark width as a fraction of box height. 0.777 reproduces the 167px width
   the live text lines measured in a 215px box, which is what keeps these
   "sized the same as you have now" rather than rescaling for the lower count. */
const WORDMARK_W_RATIO = 0.777

/* Takeover exit, staged so the CONTENT clears before the background does.
   Everything has to fit inside the window between the `out` flip and the fixed
   2700ms onComplete that unmounts this and starts the randomizer — the unmount
   is a hard cutoff, so an overrun would snap the scrim off rather than fade it.
   Budget from TAKEOVER_OUT_AT (1900ms): 0.34 content + 0.38 delay + 0.3 scrim
   = 720ms, landing at ~2620ms with room to spare. */
const TAKEOVER_OUT_AT = 1900
const TAKEOVER_EXIT = {
  content: 0.34,
  /* Starts only once the wordmarks and crowns are fully gone. */
  bgDelay: 0.38,
  bgDuration: 0.3,
} as const

/* One crown and one flame, in opposite corners. Each gets its own wiggle
   amplitude, period and offset so the two rock independently rather than in
   lockstep — and the flame's shorter period reads as a flicker next to the
   crown's slower rock. The flame is a touch narrower because its artwork is
   taller than wide, so matching widths would make it the visually heavier of
   the two. */
const TAKEOVER_ART = [
  { kind: "crown", w: 27, pos: { left: "1%", top: "4%" }, rot: -12, delay: 0.5, wiggle: 5, wigglePeriod: 1.7 },
  { kind: "flame", w: 23, pos: { right: "1%", bottom: "4%" }, rot: 12, delay: 0.62, wiggle: -6, wigglePeriod: 1.35 },
] as const

function WinnerWordmark({ width }: { width: number }) {
  return (
    <svg
      width={width}
      height={(width * WORDMARK_H) / WORDMARK_W}
      viewBox={`0 0 ${WORDMARK_W} ${WORDMARK_H}`}
      fill="none"
      aria-hidden="true"
      style={{ display: "block", filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.45))" }}
    >
      <path
        d="M4.39728 21L0.688676 1.81313H4.8351L7.38477 15.4371L10.192 1.81313H14.9307L18.047 15.5401L20.3134 1.81313H24.434L20.6997 21H15.9352L12.5614 6.34586L9.16181 21H4.39728ZM25.9471 21V1.81313H29.9648V21H25.9471ZM48.807 21H45.0726L36.6252 8.01989V21H32.8394V1.81313H36.5737L45.0211 14.7932V1.81313H48.807V21ZM67.6709 21H63.9365L55.4892 8.01989V21H51.7033V1.81313H55.4377L63.885 14.7932V1.81313H67.6709V21ZM70.5672 21V1.81313H82.6202V5.21268H74.5849V9.48788H81.1522V12.8874H74.5849V17.6004H82.6202V21H70.5672ZM84.7029 21V1.81313H92.0428C96.7301 1.81313 98.8677 4.33704 98.8677 7.47905C98.8677 9.89994 97.6057 11.9345 94.9015 12.7329L101.469 21H96.318L90.1113 13.1192H88.7205V21H84.7029ZM88.7205 9.89994H91.6308C93.5366 9.89994 94.6955 8.92128 94.6955 7.47905C94.6955 6.01106 93.5366 5.0324 91.6308 5.0324H88.7205V9.89994Z"
        fill="#4CE160"
      />
    </svg>
  )
}

/* Ambient floaters for the "subtle" variant, modelled on the tap-a-heart effect
   in live streams: a few elements rise out of the bottom corners, drift gently
   inward, and fade before they reach the middle.

   Deliberately a fixed table rather than randomised per play — these concepts
   exist to be compared side by side, and randomised sizes/lanes would mean no
   two viewings of the same concept are the same animation.

   `lane` is the inset from that floater's own edge. Bounded so elements hug the
   left/right margins of a ~440px frame and never cross the middle — the widest
   lane is paired with the smallest `size`, since a lane is only safe in
   combination with the width of what sits in it (lane 48 at size 25 spans to
   ~141px; lane 48 at size 39 would reach past centre).

   Every floater must FINISH before the 2700ms onComplete that starts the
   randomizer, so `delay + duration` is the real budget: the last entry is
   1.1 + 1.4 = 2.5s. Denser passes buy room by SHORTENING later floaters
   rather than by stacking more delay — pushing the tail past ~2.55s gets it cut
   off mid-rise instead of fading out.

   Text is sized down from the takeover's text-6xl — at that scale two words span
   the frame and stop reading as ambient.

   `size` is a px font-size rather than a Tailwind class: the scale here is tuned
   by percentage, and Tailwind's steps can't express those values (a +30% pass
   turns 24 into 31 and 30 into 39, neither of which is a step).

   Kinds run text → crown → flame on a strict repeating cycle, which is what
   keeps the three EVEN at 5 each (15 total) and also stops two of the same asset
   surfacing back to back. Adding or removing floaters means moving in whole
   groups of three, or the counts stop matching.

   Every entry carries BOTH `size` and `art` even though each kind reads only one
   of them: these are inferred as a `const` union, and omitting a field from some
   members makes it unreadable on the union as a whole. */
const FLOATERS = [
  { side: "left", kind: "text", lane: 6, delay: 0, duration: 1.75, drift: 16, rise: 0.56, tilt: -7, size: 39, art: 57 },
  { side: "right", kind: "crown", lane: 18, delay: 0.12, duration: 1.8, drift: -18, rise: 0.62, tilt: 9, size: 31, art: 55 },
  { side: "left", kind: "flame", lane: 30, delay: 0.24, duration: 1.72, drift: 15, rise: 0.5, tilt: -5, size: 31, art: 46 },
  { side: "right", kind: "text", lane: 5, delay: 0.36, duration: 1.85, drift: -17, rise: 0.64, tilt: 6, size: 39, art: 57 },
  { side: "left", kind: "crown", lane: 26, delay: 0.46, duration: 1.7, drift: 14, rise: 0.52, tilt: -9, size: 31, art: 44 },
  { side: "right", kind: "flame", lane: 46, delay: 0.56, duration: 1.72, drift: -14, rise: 0.58, tilt: 8, size: 31, art: 42 },
  { side: "left", kind: "text", lane: 14, delay: 0.64, duration: 1.68, drift: 12, rise: 0.66, tilt: -4, size: 34, art: 50 },
  { side: "right", kind: "crown", lane: 8, delay: 0.72, duration: 1.65, drift: -12, rise: 0.54, tilt: 10, size: 31, art: 48 },
  { side: "left", kind: "flame", lane: 54, delay: 0.78, duration: 1.62, drift: 13, rise: 0.46, tilt: -6, size: 31, art: 36 },
  { side: "right", kind: "text", lane: 24, delay: 0.84, duration: 1.6, drift: -16, rise: 0.58, tilt: 7, size: 31, art: 49 },
  { side: "left", kind: "crown", lane: 40, delay: 0.9, duration: 1.55, drift: 11, rise: 0.6, tilt: -8, size: 31, art: 34 },
  { side: "right", kind: "flame", lane: 32, delay: 0.95, duration: 1.55, drift: -13, rise: 0.5, tilt: 5, size: 27, art: 40 },
  { side: "left", kind: "text", lane: 48, delay: 1, duration: 1.5, drift: 10, rise: 0.44, tilt: -5, size: 25, art: 36 },
  { side: "right", kind: "crown", lane: 52, delay: 1.05, duration: 1.45, drift: -11, rise: 0.48, tilt: 9, size: 27, art: 32 },
  { side: "left", kind: "flame", lane: 20, delay: 1.1, duration: 1.4, drift: 12, rise: 0.42, tilt: -7, size: 27, art: 38 },
] as const

/* The two image assets, shared by both variants. Intrinsic sizes differ — the
   crown is square, the flame is slightly taller than wide — so each carries its
   own, and every consumer sets WIDTH with `height: auto`. Hardcoding a square
   box would squash the flame.

   The flame is an SVG wrapping a raster image at a `pattern` transform that
   crops it; keeping it as the supplied .svg preserves that framing for free.
   next/image passes it through untouched because the project sets
   `images.unoptimized`, so no `dangerouslyAllowSVG` is needed. */
const ART = {
  crown: { src: "/images/crown.png", w: 240, h: 240 },
  flame: { src: "/images/flames.svg", w: 228, h: 250 },
} as const

function CelebrationArt({
  kind,
  width,
  shadow,
}: {
  kind: "crown" | "flame"
  /* A number for the floaters (fixed px) or "100%" for the takeover, where the
     wrapper is sized as a percentage of the bid box. */
  width: number | string
  shadow: string
}) {
  const art = ART[kind]
  return (
    <Image
      src={art.src}
      alt=""
      width={art.w}
      height={art.h}
      style={{ width, height: "auto", filter: `drop-shadow(${shadow})` }}
    />
  )
}

// Crown + stacked "WINNER" celebration that plays right after a bid is won,
// before the randomizer runs. No team is shown here (none is decided yet).
export function WinnerCrownReveal({ isRevealing, onComplete, variant = "default" }: WinnerCrownRevealProps) {
  const [phase, setPhase] = useState<"idle" | "show" | "out">("idle")
  /* Height of the device frame, measured from the overlay itself. The subtle
     variant's rise is a fraction of it, expressed in PIXELS: Framer Motion
     silently fails on container units (a `cqh` value stopped the whole
     animation, opacity included), and a percentage transform would resolve
     against each floater's own height rather than the frame's. Pixels are also
     scale-safe, since the frame's scale-to-fit transform scales them with it. */
  const [frameH, setFrameH] = useState<number | null>(null)
  /* Height of the bid box, for the takeover variant. The type has to be sized
     off the actual box rather than hardcoded: the box grows in multi mode, and a
     fixed font-size would either overflow it or leave it half empty. Same
     withhold-until-measured guard as above. */
  const [boxH, setBoxH] = useState<number | null>(null)

  useEffect(() => {
    if (isRevealing) {
      setPhase("show")
      /* Hold the celebration, then trigger the exit. Takeover leaves slightly
         earlier because its exit runs in two stages (content, then background)
         and still has to finish before the 2700ms handoff below. */
      const outTimer = setTimeout(
        () => setPhase("out"),
        variant === "takeover" ? TAKEOVER_OUT_AT : 2000,
      )
      // After the exit animation completes, hand control back to the caller.
      const doneTimer = setTimeout(() => {
        setPhase("idle")
        onComplete()
      }, 2700)
      return () => {
        clearTimeout(outTimer)
        clearTimeout(doneTimer)
      }
    } else {
      setPhase("idle")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRevealing])

  if (!isRevealing || phase === "idle") return null

  /* Subtle variant: no scrim, no blur, no green pulse — the stream stays fully
     visible and (via pointer-events-none) fully interactive, which is what makes
     this read as ambient rather than as a takeover. Floaters are rendered for
     both "show" and "out" because each one self-terminates on its own keyframes;
     gating them on "show" would cut them off mid-rise when the phase flips at
     2000ms. */
  if (variant === "subtle") {
    return (
      /* `absolute`, not `fixed`: this renders INSIDE the phone frame so the
         floaters travel over the stream. As `fixed` they were laid out against
         the browser viewport and drifted across the desktop background beside
         the device — invisible on a real phone, but wrong in this prototype. */
      <div
        className="absolute inset-0 z-50 overflow-hidden pointer-events-none"
        /* Measured on attach. Floaters are withheld until the height is known
           (one frame) so none of them animates against a stale guess. */
        ref={(el) => {
          if (el && frameH === null) setFrameH(el.offsetHeight)
        }}
      >
        {frameH !== null &&
          FLOATERS.map((f, i) => (
          <motion.div
            key={i}
            /* Parked at the frame's bottom edge, then translated upward. */
            className="absolute bottom-0"
            style={f.side === "left" ? { left: f.lane } : { right: f.lane }}
            initial={{ y: 0, x: 0, opacity: 0, scale: 0.9 }}
            animate={{
              /* Rise from the bottom edge to above the vertical middle. Each
                 floater ends on its own line so they don't all stop in a row. */
              y: [0, -frameH * f.rise],
              /* Slight inward lean, with a small mid-flight wobble so the drift
                 reads as buoyant rather than as a straight linear slide. */
              x: [0, f.drift * 0.35, f.drift * 0.7, f.drift],
              /* Peaks below full opacity: these pass over chat and the bid
                 controls, and at 1.0 they read as UI rather than as an overlay. */
              opacity: [0, 0.92, 0.82, 0],
              scale: [0.9, 1, 1, 1.02],
              /* Settles upright from a slight tilt, which sells the drift as
                 buoyant rather than as a straight mechanical slide. */
              rotate: [f.tilt, f.tilt * 0.4, 0],
            }}
            transition={{
              duration: f.duration,
              delay: f.delay,
              ease: "easeOut",
              /* Fade in fast, hold, then fade out over the last third so nothing
                 pops out of existence at full opacity. */
              opacity: { duration: f.duration, delay: f.delay, times: [0, 0.16, 0.6, 1] },
              x: { duration: f.duration, delay: f.delay, times: [0, 0.35, 0.7, 1] },
              scale: { duration: f.duration, delay: f.delay, times: [0, 0.16, 0.6, 1] },
              rotate: { duration: f.duration, delay: f.delay, times: [0, 0.5, 1] },
            }}
          >
            {f.kind !== "text" ? (
              <CelebrationArt
                kind={f.kind}
                width={f.art}
                shadow="0 2px 10px rgba(0,0,0,0.5)"
              />
            ) : (
              <span
                className="font-black italic text-[#4CE160] leading-none tracking-tight whitespace-nowrap"
                /* With no scrim behind it, the text needs its own contrast
                   against a bright stream frame. */
                style={{ fontSize: f.size, textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}
              >
                WINNER
              </span>
            )}
          </motion.div>
        ))}
      </div>
    )
  }

  /* Takeover: the full-screen treatment confined to the bid box. `absolute
     inset-0` fills whatever it's mounted in, so the caller controls the
     footprint — it must be a child of the bid-box wrapper, not the device frame.
     Rounded + clipped so the crowns and the dropping text can't spill past the
     card's corners. */
  if (variant === "takeover") {
    /* Sized off the box, not off TAKEOVER_LINES — dropping 6 lines to 4 should
       not scale the artwork up. */
    const markW = boxH ? boxH * WORDMARK_W_RATIO : 0
    const markH = (markW * WORDMARK_H) / WORDMARK_W
    /* ~8% gap, matching the spacing the text lines had between cap heights. */
    const rowGap = markH * 0.08
    return (
      <div
        className="absolute inset-0 z-40 overflow-hidden rounded-2xl pointer-events-none"
        ref={(el) => {
          if (el && boxH === null) setBoxH(el.offsetHeight)
        }}
      >
        {/* Scrim. Deliberately not fully opaque: the bid box's own content stays
            faintly visible underneath, which is what makes this read as the box
            being taken OVER rather than swapped for a different card. */}
        {/* Both background layers hold at full strength while the content exits,
            then fade on a delay — so the blur is the LAST thing to clear and the
            box resolves back into view after the celebration has left. */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-[12px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "show" ? 1 : 0 }}
          transition={
            phase === "show"
              ? { duration: 0.25 }
              : { duration: TAKEOVER_EXIT.bgDuration, delay: TAKEOVER_EXIT.bgDelay }
          }
        />
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(76,225,96,0.18) 0%, rgba(76,225,96,0.06) 45%, transparent 72%)",
          }}
          /* The pulse previously had no exit at all and simply vanished on
             unmount; it now leaves with the scrim as one background layer. */
          animate={
            phase === "show"
              ? { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }
              : { opacity: 0, scale: 1 }
          }
          transition={
            phase === "show"
              ? { duration: 2, repeat: Infinity }
              : { duration: TAKEOVER_EXIT.bgDuration, delay: TAKEOVER_EXIT.bgDelay }
          }
        />

        <AnimatePresence>
          {phase === "show" && boxH !== null && (
            <motion.div key="box-takeover" className="absolute inset-0">
              {/* Stacked lines, each fading slightly further back — the same
                  depth cue as the full-screen version, and they rise in on a
                  stagger then drop out together. */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ gap: rowGap }}
              >
                {[...Array(TAKEOVER_LINES)].map((_, i) => (
                  <motion.div
                    key={i}
                    style={{ opacity: 1 - i * 0.1 }}
                    initial={{ opacity: 0, y: markH * 1.6, scale: 0.72 }}
                    animate={{ opacity: 1 - i * 0.1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: boxH * 0.75 + i * 14, scale: 0.72 }}
                    transition={{
                      delay: i * 0.07,
                      duration: 0.42,
                      ease: [0.34, 1.56, 0.64, 1],
                      exit: {
                        duration: TAKEOVER_EXIT.content,
                        delay: 0,
                        ease: [0.4, 0, 0.2, 1],
                      },
                    }}
                  >
                    <WinnerWordmark width={markW} />
                  </motion.div>
                ))}
              </div>

              {/* Crown and flame flank the stack — upper-left and lower-right,
                  sized and placed as percentages of the box so they hold their
                  composition whether the box is in single or multi height. */}
              {TAKEOVER_ART.map((c) => (
                <motion.div
                  key={c.kind}
                  className="absolute"
                  style={{ ...c.pos, width: `${c.w}%` }}
                  /* Variants rather than a shared `transition` prop: the
                     entrance needs a per-property stagger (`c.delay`), but
                     per-property delays also apply on the way OUT and override
                     the generic `exit` key — which held the crowns on screen
                     until after the scrim had already cleared. Putting each
                     transition inside its own variant keeps the entrance delay
                     from leaking into the exit. */
                  variants={{
                    hidden: { opacity: 0, scale: 0.3, y: boxH * 0.3, rotate: c.rot },
                    visible: {
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      rotate: 0,
                      transition: {
                        opacity: { delay: c.delay, duration: 0.3 },
                        scale: { delay: c.delay, type: "spring", stiffness: 220, damping: 14 },
                        y: { delay: c.delay, duration: 0.45 },
                        rotate: { delay: c.delay, duration: 0.5 },
                      },
                    },
                    out: {
                      opacity: 0,
                      scale: 0.4,
                      y: boxH * 0.8,
                      rotate: c.rot,
                      transition: {
                        duration: TAKEOVER_EXIT.content,
                        delay: 0,
                        ease: [0.4, 0, 0.2, 1],
                      },
                    },
                  }}
                  initial="hidden"
                  animate="visible"
                  exit="out"
                >
                  {/* The wiggle lives on a NESTED element on purpose: the parent
                      already animates `rotate` for the entrance and exit, and
                      driving both from one element would have the looping wiggle
                      fight the entrance settle for the same property. Rocking
                      about the base (rather than the centre) reads as a crown
                      tipping side to side — and as a flame licking upward —
                      instead of either of them spinning. */}
                  <motion.div
                    style={{ transformOrigin: "50% 85%" }}
                    animate={{ rotate: [0, c.wiggle, 0, -c.wiggle * 0.7, 0] }}
                    transition={{
                      duration: c.wigglePeriod,
                      repeat: Infinity,
                      ease: "easeInOut",
                      /* Begins after the entrance has settled, so each piece
                         lands first and only then starts moving. */
                      delay: c.delay + 0.45,
                    }}
                  >
                    <CelebrationArt
                      kind={c.kind}
                      width="100%"
                      shadow="0 4px 16px rgba(0,0,0,0.55)"
                    />
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background - matching the card flip reveal */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, rgba(76, 225, 96, 0.15) 0%, rgba(76, 225, 96, 0.05) 40%, transparent 70%)`,
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* WINNER text + crown */}
      <AnimatePresence>
        {phase === "show" && (
          <motion.div
            key="winner-text"
            className="relative flex flex-col items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative flex flex-col items-center -space-y-3">
              {[...Array(7)].map((_, i) => (
                <motion.span
                  key={i}
                  className="text-6xl font-black italic text-[#4CE160] leading-none tracking-tight"
                  style={{ opacity: 1 - i * 0.1 }}
                  initial={{ opacity: 0, y: 60, scale: 0.7 }}
                  animate={{ opacity: 1 - i * 0.1, y: 0, scale: 1 }}
                  exit={{ y: 200 + i * 40, opacity: 0, scale: 0.7 }}
                  transition={{
                    delay: i * 0.12,
                    duration: 0.5,
                    ease: [0.34, 1.56, 0.64, 1],
                    exit: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
                  }}
                >
                  WINNER
                </motion.span>
              ))}

              {/* Animated crown, centered over the text */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ opacity: 0, scale: 0, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ y: 300, opacity: 0, scale: 0.3 }}
                transition={{
                  opacity: { delay: 0.8, duration: 0.4 },
                  scale: { delay: 0.8, duration: 0.6, type: "spring", stiffness: 200 },
                  y: { delay: 0.8, duration: 0.6 },
                  exit: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
                }}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.08, 1] }}
                  transition={{
                    rotate: { duration: 0.6, repeat: Infinity, repeatDelay: 1.2 },
                    scale: { duration: 0.8, repeat: Infinity, repeatDelay: 0.4 },
                  }}
                >
                  <Image
                    src="/images/crown.png"
                    alt="Crown"
                    width={1200}
                    height={1200}
                    className="drop-shadow-2xl"
                    style={{ filter: "drop-shadow(0 0 100px rgba(255, 215, 0, 0.7))" }}
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
