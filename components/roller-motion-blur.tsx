"use client"

/**
 * Velocity-driven motion blur for the cylinder rollers.
 *
 * The drum's rows travel fast enough at peak speed that a real camera would
 * smear them, and without that smear the spin reads as a stack of crisp names
 * being teleported rather than a wheel with mass. This module derives the smear
 * from the drum's *instantaneous* velocity, so the blur ramps up with the drum,
 * holds through the plateau, and melts away as it decelerates onto the winner —
 * the landing is always perfectly crisp because the blur is a function of speed,
 * not a state that has to be switched off.
 *
 * Three things here are deliberate and easy to get wrong:
 *
 * 1. The blur is VERTICAL ONLY (`stdDeviation="0 N"`). The drum only moves on Y,
 *    so a CSS `filter: blur()` — which is isotropic — would smudge the names
 *    horizontally too and just look out of focus rather than in motion.
 *
 * 2. It is applied to the row's text span, never to the rows wrapper. `filter`
 *    creates a containing block and flattens 3D, so putting it on the
 *    `preserve-3d` wrapper would collapse the cylinder into a flat list and
 *    destroy the curve. The span carries no transform and has no 3D children, so
 *    it is safe. (The rows already animate `opacity`, another grouping property,
 *    which is why per-row flattening is known to be fine here.)
 *
 * 3. The filter region has to be widened. The default region is -10%/120%, which
 *    would hard-clip a 10px blur on a 34px-tall row and leave visible cut edges.
 */

import { useEffect, useId, useRef } from "react"
import { useReducedMotion } from "framer-motion"

/**
 * Virtual shutter time, in seconds. A real camera smears a moving subject by
 * `velocity * shutter`, so this is the single knob that converts drum speed into
 * a pixel distance. 1/90s is a touch shorter than a 60fps frame: a full 1/60
 * exposure at peak speed smears ~29px, which turns 14px type into an unreadable
 * grey haze. This keeps a strong streak while the names stay just legible.
 */
const SHUTTER_SEC = 1 / 90

/**
 * A Gaussian's visible spread is roughly ±2 standard deviations, so a smear of
 * `d` px is approximated by a stdDeviation of about `d / 4`. Using d/2 (the
 * obvious guess) doubles the apparent blur and washes the drum out.
 */
const SMEAR_TO_STDDEV = 1 / 4

/**
 * Quantisation step for stdDeviation, in px. The browser rebuilds the blur
 * kernel whenever this value changes, so snapping to 1/4px stops a
 * jittering-by-0.001 value from forcing a re-rasterise every single frame. Fine
 * enough that the ramp still looks continuous.
 */
const QUANTISE_PX = 0.25

/**
 * Rejects the position discontinuities that bracket a spin: the reset to 0 and
 * the jump to a random start row both look like enormous velocity. At peak the
 * drum covers barely more than one row per frame, so anything past this is
 * definitionally a seek rather than motion.
 */
const MAX_PLAUSIBLE_ROWS_PER_FRAME = 8

export interface RollerMotionBlurOptions {
  /** Live fractional drum position, in rows. The hook differentiates this. */
  pos: number
  /** True only while the drum is actually spinning. */
  active: boolean
  /** Centre-to-centre row spacing in px — converts rows/sec into px/sec. */
  rowPitch: number
  /** Multiplier on the physically-derived blur. 0 disables it entirely. */
  strength?: number
  /** Hard ceiling on stdDeviation, in px, so peak speed can't grey out the drum. */
  maxPx?: number
}

/**
 * Tracks the drum's velocity and writes the blur straight to the SVG filter.
 *
 * The sampling runs on its own rAF loop reading a ref rather than off React
 * renders. That is what makes the blur decay correctly: when the drum lands, pos
 * simply stops changing, so measured velocity falls to zero on its own. Driving
 * it from a render effect would leave the last non-zero blur painted on the
 * resting winner forever, because no further render would ever arrive to clear
 * it. It also means the per-frame blur update costs one attribute write instead
 * of a full React re-render.
 */
export function useRollerMotionBlur({
  pos,
  active,
  rowPitch,
  strength = 1,
  maxPx = 10,
}: RollerMotionBlurOptions) {
  const reduceMotion = useReducedMotion()
  const enabled = !reduceMotion && strength > 0

  /* Scoped to this hook instance so two rollers on one page never reference each
     other's filter. useId's delimiters (`:` in React 18) are stripped because
     they are not safe inside a `url(#...)` reference. */
  const rawId = useId()
  const filterId = `roller-mblur-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`

  const feRef = useRef<SVGFEGaussianBlurElement | null>(null)
  const posRef = useRef(pos)
  posRef.current = pos

  // Read inside the loop so changing a dial mid-spin takes effect immediately
  // without restarting the sampler.
  const tuningRef = useRef({ rowPitch, strength, maxPx })
  tuningRef.current = { rowPitch, strength, maxPx }

  useEffect(() => {
    const write = (v: number) => feRef.current?.setAttribute("stdDeviation", `0 ${v}`)

    if (!enabled || !active) {
      write(0)
      return
    }

    let raf = 0
    let lastPos = posRef.current
    let lastT = performance.now()
    // Smoothed so a single long frame can't spike the blur.
    let smoothed = 0
    let written = -1

    const frame = (now: number) => {
      const dt = (now - lastT) / 1000
      const dPos = posRef.current - lastPos
      lastT = now
      lastPos = posRef.current

      if (dt > 0) {
        const rows = Math.abs(dPos)
        // A seek, not motion — drop the sample rather than flashing a huge blur.
        const rowsPerSec = rows > MAX_PLAUSIBLE_ROWS_PER_FRAME ? 0 : rows / dt
        const { rowPitch: pitch, strength: s, maxPx: cap } = tuningRef.current
        const target = Math.min(cap, rowsPerSec * pitch * SHUTTER_SEC * SMEAR_TO_STDDEV * s)
        // Rise fast so the ramp-up feels immediate, fall slower so the tail off
        // the decelerating drum stays smooth instead of stepping.
        const k = target > smoothed ? 0.5 : 0.25
        smoothed += (target - smoothed) * k

        const q = Math.round(smoothed / QUANTISE_PX) * QUANTISE_PX
        if (q !== written) {
          written = q
          write(q)
        }
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      // Never leave a resting drum smeared.
      write(0)
    }
  }, [enabled, active])

  return {
    /** Spread onto each row's text span. */
    blurProps: enabled ? { style: { filter: `url(#${filterId})` } } : {},
    /** Render once inside the drum. */
    filter: enabled ? <RollerMotionBlurFilter id={filterId} feRef={feRef} /> : null,
  }
}

function RollerMotionBlurFilter({
  id,
  feRef,
}: {
  id: string
  feRef: React.Ref<SVGFEGaussianBlurElement>
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      // Zero-size and absolutely positioned: this only carries a filter
      // definition and must not participate in the drum's layout.
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        <filter
          id={id}
          /* Widened region — the default -10%/120% box would hard-clip the
             smear and leave a visible straight edge across the streaks. */
          x="-25%"
          y="-150%"
          width="150%"
          height="400%"
          /* SVG filters default to linearRGB, which makes blurred light text on
             a dark drum bloom into a washed-out halo. sRGB matches how the
             unblurred rows are composited. */
          colorInterpolationFilters="sRGB"
        >
          {/* x=0 keeps the smear purely vertical — see note 1 at the top. */}
          <feGaussianBlur ref={feRef} in="SourceGraphic" stdDeviation="0 0" />
        </filter>
      </defs>
    </svg>
  )
}
