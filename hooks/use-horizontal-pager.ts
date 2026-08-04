"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { animate, useMotionValue, useTransform } from "framer-motion"

/**
 * Two-page horizontal pager driven by raw pointer events.
 *
 * Why not framer-motion's `drag="x"`: the bid button inside page 0 is itself a
 * horizontal drag (swipe-to-bid). framer's drag attaches a *native* pointerdown
 * listener on the draggable element, and native events reach it before React's
 * synthetic handlers run at the root — so a child could not reliably opt out.
 * Tracking pointers ourselves lets `ignoreSelector` decline the gesture at
 * pointerdown, leaving the bid slider's own drag untouched.
 */

/** Horizontal travel before we commit to paging instead of a vertical scroll. */
const DIRECTION_LOCK_PX = 8
/** Fraction of the page width that commits a page change on release. */
const COMMIT_RATIO = 0.22
/** A fast flick commits even if it never crossed COMMIT_RATIO. px per ms. */
const FLICK_VELOCITY = 0.4
const SNAP = { type: "spring" as const, stiffness: 520, damping: 42, mass: 0.9 }

type Page = 0 | 1

interface Options {
  /** When false every handler no-ops and the track stays parked on page 0. */
  enabled: boolean
  /** Blocks new gestures (used while the drum is actually spinning). */
  locked?: boolean
  /** Descendants matching this keep their own horizontal gestures. */
  ignoreSelector?: string
}

export function useHorizontalPager({ enabled, locked = false, ignoreSelector }: Options) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [page, setPage] = useState<Page>(0)

  /** Track offset: 0 shows page 0, -width shows page 1. */
  const x = useMotionValue(0)
  /* Width lives in a motion value as well as state so the derived offset below
     recomputes when the viewport resizes, not just when x changes. */
  const widthMv = useMotionValue(0)
  const [width, setWidth] = useState(0)
  /** Offset for the second page, which sits one full width to the right. */
  const incomingX = useTransform([x, widthMv], ([xv, wv]: number[]) => xv + wv)

  const widthRef = useRef(0)
  const pageRef = useRef<Page>(0)
  pageRef.current = page

  /* Measure the viewport. Page travel is expressed in px rather than % so the
     drag can be compared against a real threshold. */
  /* `enabled` is a dependency because the viewport element only mounts once this
     concept is selected — without it the effect runs a single time against a null
     ref and the page width stays 0, parking both pages on top of each other. */
  useEffect(() => {
    const el = viewportRef.current
    if (!el || !enabled) return
    const measure = () => {
      const w = el.offsetWidth
      widthRef.current = w
      widthMv.set(w)
      setWidth(w)
      // Keep the current page parked correctly across resizes.
      x.set(-pageRef.current * w)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [x, widthMv, enabled])

  const goTo = useCallback(
    (next: Page) => {
      setPage(next)
      animate(x, -next * widthRef.current, SNAP)
    },
    [x],
  )

  /** Snap without animating — for concept switches and resets. */
  const jumpTo = useCallback(
    (next: Page) => {
      setPage(next)
      x.set(-next * widthRef.current)
    },
    [x],
  )

  const drag = useRef<{
    id: number
    startX: number
    startY: number
    base: number
    mode: "undecided" | "drag" | "cancelled"
    lastX: number
    lastT: number
    v: number
  } | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || locked || !widthRef.current) return
      if (e.pointerType === "mouse" && e.button !== 0) return
      const target = e.target as HTMLElement | null
      // The bid slider owns horizontal drags inside its own bounds.
      if (ignoreSelector && target?.closest(ignoreSelector)) return
      drag.current = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        base: x.get(),
        mode: "undecided",
        lastX: e.clientX,
        lastT: performance.now(),
        v: 0,
      }
    },
    [enabled, locked, ignoreSelector, x],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      if (!d || d.id !== e.pointerId) return
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY

      if (d.mode === "undecided") {
        /* Direction lock: only claim the gesture once it is clearly horizontal,
           so vertical scrolling of the stream still works. */
        if (Math.abs(dx) > DIRECTION_LOCK_PX && Math.abs(dx) > Math.abs(dy)) {
          d.mode = "drag"
          /* Capture keeps the gesture alive if the finger leaves the viewport.
             It throws if the pointer is already gone (fast release, or a
             synthetic event in tests), which must not abort the drag. */
          try {
            viewportRef.current?.setPointerCapture(e.pointerId)
          } catch {}
        } else if (Math.abs(dy) > DIRECTION_LOCK_PX) {
          d.mode = "cancelled"
          return
        } else {
          return
        }
      }
      if (d.mode !== "drag") return

      const now = performance.now()
      const dt = now - d.lastT
      if (dt > 0) d.v = (e.clientX - d.lastX) / dt
      d.lastX = e.clientX
      d.lastT = now

      // Rubber-band past the first and last page instead of hard-stopping.
      const w = widthRef.current
      let next = d.base + dx
      if (next > 0) next = next * 0.35
      if (next < -w) next = -w + (next + w) * 0.35
      x.set(next)
    },
    [x],
  )

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      if (!d || d.id !== e.pointerId) return
      drag.current = null
      if (d.mode !== "drag") return
      const dx = e.clientX - d.startX
      const w = widthRef.current
      let next = pageRef.current
      if (d.v < -FLICK_VELOCITY || dx < -w * COMMIT_RATIO) next = 1
      else if (d.v > FLICK_VELOCITY || dx > w * COMMIT_RATIO) next = 0
      goTo(next)
    },
    [goTo],
  )

  return {
    viewportRef,
    page,
    width,
    x,
    incomingX,
    goTo,
    jumpTo,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  }
}
