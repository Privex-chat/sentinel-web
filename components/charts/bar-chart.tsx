/* components/charts/bar-chart.tsx */
"use client"

import { useState } from "react"

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  maxOverride?: number
  formatValue?: (v: number) => string
}

export function BarChart({ data, maxOverride, formatValue }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const max = maxOverride ?? Math.max(...data.map((d) => d.value), 1)
  const fmt = formatValue ?? ((v: number) => String(v))

  return (
    <div className="space-y-2.5">
      {data.map((item, i) => {
        const pct = (item.value / max) * 100
        const isHovered = hovered === i
        const barColor = item.color || "var(--color-primary)"

        return (
          <div
            key={i}
            className="group cursor-default"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
              <span
                className="truncate font-medium transition-colors duration-150"
                style={{ color: isHovered ? barColor : "var(--color-foreground)", maxWidth: "65%" }}
              >
                {item.label}
              </span>
              <span
                className="shrink-0 font-mono transition-opacity duration-150"
                style={{
                  color: barColor,
                  opacity: isHovered ? 1 : 0.7,
                  fontWeight: isHovered ? 600 : 400,
                }}
              >
                {fmt(item.value)}
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
              {/* Background track glow on hover */}
              <div
                className="absolute inset-0 rounded-full transition-opacity duration-200"
                style={{
                  background: `linear-gradient(90deg, ${barColor}15, ${barColor}05)`,
                  opacity: isHovered ? 1 : 0,
                }}
              />
              {/* Main fill bar */}
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                  boxShadow: isHovered ? `0 0 8px ${barColor}60` : "none",
                  transition: "width 0.5s cubic-bezier(0.4,0,0.2,1), box-shadow 0.15s",
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}