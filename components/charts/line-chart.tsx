/* components/charts/line-chart.tsx */
"use client"

import { useState, useMemo } from "react"

interface Point { label: string; value: number }

interface LineChartProps {
  data: Point[]
  height?: number
  color?: string
  showDots?: boolean
  showLabels?: boolean
  showArea?: boolean
  formatValue?: (v: number) => string
}

/** Catmull-Rom → cubic-bezier SVG path for smooth curves */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ""
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

export function LineChart({
  data,
  height = 160,
  color = "var(--color-chart-1)",
  showDots = true,
  showLabels = true,
  showArea = true,
  formatValue,
}: LineChartProps) {
  const [hover, setHover] = useState<number | null>(null)

  const padding = useMemo(
    () => ({ top: 16, right: 12, bottom: showLabels ? 24 : 8, left: 40 }),
    [showLabels]
  )

  const minWidth = Math.max(data.length * 32, 320)
  const chartW = minWidth - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const minVal = 0
  const range = maxVal - minVal || 1

  const points = useMemo(
    () =>
      data.map((d, i) => ({
        x: padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
        y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
        ...d,
      })),
    [data, padding, chartW, chartH, minVal, range]
  )

  const linePath  = smoothPath(points)
  const gradId    = `line-grad-${color.replace(/[^a-z0-9]/gi, "")}`
  const ySteps    = 4
  const yLabels   = Array.from({ length: ySteps + 1 }, (_, i) =>
    Math.round(minVal + (range * i) / ySteps)
  )

  const fmt = formatValue ?? ((v: number) => String(v))

  if (data.length < 2) return null

  return (
    <div className="overflow-x-auto">
      <svg width={minWidth} height={height} className="block">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Y-axis grid lines + labels */}
        {yLabels.map((val, i) => {
          const y = padding.top + chartH - ((val - minVal) / range) * chartH
          return (
            <g key={i}>
              <line
                x1={padding.left} y1={y}
                x2={minWidth - padding.right} y2={y}
                stroke="var(--color-border)"
                strokeWidth="1"
                strokeDasharray={i === 0 ? "none" : "3 3"}
                opacity={i === 0 ? 0.6 : 0.35}
              />
              <text
                x={padding.left - 6} y={y + 3.5}
                textAnchor="end"
                fill="var(--color-muted-foreground)"
                fontSize="9"
              >
                {fmt(val)}
              </text>
            </g>
          )
        })}

        {/* Gradient area */}
        {showArea && linePath && (
          <path
            d={`${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`}
            fill={`url(#${gradId})`}
          />
        )}

        {/* Main line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))" }}
          />
        )}

        {/* Hover crosshair */}
        {hover !== null && points[hover] && (
          <>
            <line
              x1={points[hover].x} y1={padding.top}
              x2={points[hover].x} y2={padding.top + chartH}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
            />
          </>
        )}

        {/* Dots */}
        {showDots && points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r={hover === i ? 5 : (data.length <= 30 ? 3 : 2)}
            fill={hover === i ? color : "var(--color-card)"}
            stroke={color}
            strokeWidth={hover === i ? 2.5 : 1.5}
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {/* Tooltip */}
        {hover !== null && points[hover] && (() => {
          const p = points[hover]
          const label   = fmt(p.value)
          const boxW    = Math.max(label.length * 7 + 16, 56)
          const boxX    = Math.min(Math.max(p.x - boxW / 2, padding.left), minWidth - padding.right - boxW)
          return (
            <g>
              <rect x={boxX} y={p.y - 28} width={boxW} height={20} rx="5"
                fill="var(--color-popover)" stroke="var(--color-border)" strokeWidth="1"
              />
              <text x={boxX + boxW / 2} y={p.y - 14}
                textAnchor="middle" fill="var(--color-foreground)" fontSize="10" fontWeight="600"
              >
                {label}
              </text>
            </g>
          )
        })()}

        {/* X-axis labels */}
        {showLabels && points.map((p, i) => {
          const step = data.length > 20 ? Math.ceil(data.length / 10) : 1
          if (i % step !== 0 && i !== data.length - 1) return null
          return (
            <text key={i} x={p.x} y={height - 4}
              textAnchor="middle" fill="var(--color-muted-foreground)" fontSize="9"
            >
              {p.label}
            </text>
          )
        })}

        {/* Invisible wider hit targets */}
        {points.map((p, i) => (
          <rect
            key={i}
            x={p.x - 10} y={padding.top}
            width={20} height={chartH}
            fill="transparent"
            className="cursor-pointer"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
    </div>
  )
}