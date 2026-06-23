"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowBigUp, Delete } from "lucide-react"

const ROW_1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]
const ROW_2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"]
const ROW_3 = ["z", "x", "c", "v", "b", "n", "m"]

/**
 * A non-functional, iOS-style mock keyboard used in the demo. Tapping ANY key
 * (or the space bar / return) calls onKeyTap so the parent can populate the
 * pre-written comment. The blue return key calls onReturn to send.
 */
export function MockKeyboard({
  open,
  onKeyTap,
  onReturn,
}: {
  open: boolean
  onKeyTap: () => void
  onReturn: () => void
}) {
  const Key = ({ label, className = "" }: { label: string; className?: string }) => (
    <button
      type="button"
      onClick={onKeyTap}
      className={`flex h-9 items-center justify-center rounded-[5px] bg-[#6e6e72] text-white text-base font-normal shadow-[0_1px_0_rgba(0,0,0,0.35)] active:bg-[#4a4a4e] ${className}`}
    >
      {label}
    </button>
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="keyboard"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className="absolute inset-x-0 bottom-0 z-40 bg-[#2c2c2e] px-1.5 pt-2.5 pb-2 select-none"
        >
          {/* Row 1 */}
          <div className="grid grid-cols-10 gap-1.5 mb-2">
            {ROW_1.map((k) => (
              <Key key={k} label={k} />
            ))}
          </div>
          {/* Row 2 - indented */}
          <div className="grid grid-cols-10 gap-1.5 mb-2 px-[5%]">
            {ROW_2.map((k) => (
              <Key key={k} label={k} className="col-span-1" />
            ))}
          </div>
          {/* Row 3 - shift + letters + delete */}
          <div className="grid grid-cols-10 gap-1.5 mb-2">
            <button
              type="button"
              onClick={onKeyTap}
              className="col-span-1 flex h-9 items-center justify-center rounded-[5px] bg-[#adadb2] text-black active:bg-[#8f8f94]"
            >
              <ArrowBigUp className="w-5 h-5" />
            </button>
            {ROW_3.map((k) => (
              <Key key={k} label={k} className="col-span-1" />
            ))}
            <button
              type="button"
              onClick={onKeyTap}
              className="col-span-1 flex h-9 items-center justify-center rounded-[5px] bg-[#adadb2] text-black active:bg-[#8f8f94]"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
          {/* Row 4 - 123 / space / return */}
          <div className="flex gap-1.5">
            <Key label="123" className="w-10 flex-shrink-0 text-sm" />
            <button
              type="button"
              onClick={onKeyTap}
              className="flex-1 h-9 rounded-[5px] bg-[#6e6e72] text-white text-base active:bg-[#4a4a4e]"
            >
              space
            </button>
            <button
              type="button"
              onClick={onReturn}
              className="w-20 flex-shrink-0 h-9 rounded-[5px] bg-[#0a84ff] text-white text-base font-medium active:bg-[#0066cc]"
            >
              return
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
