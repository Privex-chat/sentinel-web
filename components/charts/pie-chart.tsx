/* components/charts/pie-chart.tsx */
"use client"

import { useState } from "react"

interface PieChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
  formatValue?: (v: number) => string
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  // Clamp arc span so we never try to draw a perfect circle with arc
  const span = Math.min(endAngle - startAngle, 359.9999)
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end   = polarToCartesian(cx, cy, r, startAngle + span)
  const large = span > 180 ? 1 : 0
  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`
}

export function PieChart({ data, size = 120, formatValue }: PieChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const fmt = formatValue ?? ((v: number) => String(v))

  const cx     = size / 2
  const cy     = size / 2
  const outerR = size / 2 - 4
  const innerR = outerR * 0.58  // donut hole
  const gap    = 1.2            // degrees gap between segments

  let cumulative = 0
  const segments = data.map((item, i) => {
    const sweep = (item.value / total) * 360
    const start = cumulative
    cumulative += sweep
    return { ...item, start, sweep, index: i }
  })

  return (
    <div className="flex items-center gap-5 flex-wrap">
      {/* SVG donut */}
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((seg) => {
            const isH     = hovered === seg.index
            const r       = isH ? outerR + 3 : outerR
            const arcPath = describeArc(cx, cy, r, seg.start + gap / 2, seg.start + seg.sweep - gap / 2)
            return (
              <path
                key={seg.index}
                d={arcPath}
                fill="none"
                stroke={seg.color}
                strokeWidth={r - innerR}
                strokeLinecap="round"
                opacity={hovered !== null && !isH ? 0.35 : 1}
                style={{
                  transition: "stroke-width 0.15s, opacity 0.15s",
                  cursor: "default",
                  filter: isH ? `drop-shadow(0 0 5px ${seg.color}80)` : "none",
                }}
                onMouseEnter={() => setHovered(seg.index)}
                onMouseLeave={() => setHovered(null)}
              />
            )
          })}

          {/* Center label when hovered */}
          {hovered !== null && (
            <>
              <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--color-foreground)" fontSize={size * 0.12} fontWeight="700">
                {Math.round((segments[hovered].value / total) * 100)}%
              </text>
              <text x={cx} y={cy + size * 0.11} textAnchor="middle" fill="var(--color-muted-foreground)" fontSize={size * 0.08}>
                {segments[hovered].label}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-0">
        {data.map((item, i) => {
          const pct    = Math.round((item.value / total) * 100)
          const isH    = hovered === i
          return (
            <div
              key={i}
              className="flex items-center gap-2 cursor-default"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full transition-transform duration-150"
                style={{
                  backgroundColor: item.color,
                  transform: isH ? "scale(1.4)" : "scale(1)",
                  boxShadow: isH ? `0 0 6px ${item.color}80` : "none",
                }}
              />
              <span
                className="text-xs transition-colors duration-150"
                style={{ color: isH ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}
              >
                {item.label}
              </span>
              <span
                className="text-xs font-semibold ml-auto pl-3 tabular-nums"
                style={{ color: item.color, opacity: isH ? 1 : 0.7 }}
              >
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}