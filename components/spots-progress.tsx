"use client"

// Radial progress arc + "available/total spots available" label.
// Mirrors the CircularProgress used inside the spinners so the auction card
// can show the same indicator beneath its title.
export function SpotsProgress({
  available,
  total,
  size = 16,
  className = "",
}: {
  available: number
  total: number
  size?: number
  className?: string
}) {
  const percentage = (available / total) * 100
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // 4-tier scale: green -> yellow -> orange -> red as the bar empties
  const getProgressColor = (pct: number) => {
    const ratio = pct / 100
    if (ratio <= 0.25) return "#ef4444" // red
    if (ratio <= 0.5) return "#f97316" // orange
    if (ratio <= 0.75) return "#eab308" // yellow
    return "#22c55e" // green
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <svg className="transform -rotate-90 flex-shrink-0" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getProgressColor(percentage)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.3s ease, stroke 0.3s ease" }}
        />
      </svg>
      <span className="text-sm text-white">
        {available}/{total} spots available
      </span>
    </div>
  )
}
