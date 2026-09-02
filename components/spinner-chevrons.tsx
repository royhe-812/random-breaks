"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"

/** Blue used for the framing chevrons. Same double-chevron glyph as the bid
 *  button (lucide ChevronRight), recoloured from the bid ink to this blue and
 *  turned to point *inward* at the centre name — matching the Figma frame. */
const CHEVRON_BLUE = "#4D93FC"

/**
 * The pair of chevrons that flank the drum's centre name in the Subtle Winning
 * concept. Three states drive one shared timeline:
 *
 *  - `hidden`   — parked (before the first spin / not subtle).
 *  - `spinning` — a gentle breathing pulse (a small outward drift) so the pair
 *                 reads as "actively randomizing".
 *  - `gone`     — on landing they fly *inward* toward the centre.
 *
 * Opacity is held constant at 1 across every state — the pair only ever moves,
 * it never fades in or out. Each side owns its own x sign: "inward" is +x for
 * the left chevron and -x for the right, so both converge on the name rather
 * than sliding the same way. Per-variant transitions live inside the variants
 * so the looping pulse never bleeds its `repeat: Infinity` onto the fly-in.
 */
export function SpinnerChevrons({ state }: { state: "hidden" | "spinning" | "gone" }) {
  const pulse = { duration: 1.1, repeat: Infinity, ease: "easeInOut" as const }
  const fly = { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }

  const leftVariants = {
    hidden: { x: 0, transition: { duration: 0.2 } },
    spinning: { x: [0, -4, 0], transition: pulse },
    gone: { x: 22, transition: fly },
  }
  const rightVariants = {
    hidden: { x: 0, transition: { duration: 0.2 } },
    spinning: { x: [0, 4, 0], transition: pulse },
    gone: { x: -22, transition: fly },
  }

  return (
    <>
      <motion.div
        className="pointer-events-none absolute top-1/2 z-10 -translate-y-1/2"
        style={{ left: "8.5%", color: CHEVRON_BLUE }}
        variants={leftVariants}
        initial="hidden"
        animate={state}
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute top-1/2 z-10 -translate-y-1/2"
        style={{ right: "8.5%", color: CHEVRON_BLUE }}
        variants={rightVariants}
        initial="hidden"
        animate={state}
      >
        {/* Mirror the same glyph so it points inward (left) instead of right. */}
        <ChevronRight className="h-5 w-5" strokeWidth={2.5} style={{ transform: "scaleX(-1)" }} />
      </motion.div>
    </>
  )
}
