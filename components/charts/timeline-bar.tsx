/* components/charts/timeline-bar.tsx */
"use client"

import { useState } from "react"
import { formatTime } from "@/lib/utils"

interface Session {
  type: string
  label: string
  start: number
  end: number
  color: string
}

interface TimelineBarProps {
  sessions: Session[]
  dayStart: number
  dayEnd: number
  height?: number
}

export function TimelineBar({ sessions, dayStart, dayEnd, height = 26 }: TimelineBarProps) {
  const [tooltip, setTooltip] = useState<{ session: Session; x: number; y: number } | null>(null)
  const totalMs = dayEnd - dayStart
  if (totalMs <= 0) return null

  const types = [...new Set(sessions.map((s) => s.type))]
  const hourMarks = Array.from({ length: 25 }, (_, i) => i)

  return (
    <div className="relative select-none">
      {/* Hour ruler */}
      <div
        className="relative mb-2 ml-14"
        style={{ height: 14 }}
      >
        {hourMarks.map((h) => {
          const pct = (h / 24) * 100
          const show = h % 4 === 0
          return (
            <div
              key={h}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
            >
              <div
                className="w-px bg-border"
                style={{ height: show ? 6 : 3, opacity: show ? 0.6 : 0.3 }}
              />
              {show && (
                <span className="text-[9px] text-muted-foreground mt-0.5">{h.toString().padStart(2, "0")}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Track rows */}
      <div className="space-y-1.5">
        {types.map((type) => (
          <div key={type} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-right text-[9px] text-muted-foreground uppercase tracking-wide leading-none">
              {type}
            </span>
            <div
              className="relative flex-1 overflow-hidden rounded-md bg-secondary/60"
              style={{ height }}
            >
              {sessions
                .filter((s) => s.type === type)
                .map((session, i) => {
                  const left  = Math.max(0, ((session.start - dayStart) / totalMs) * 100)
                  const right = Math.min(100, ((session.end - dayStart) / totalMs) * 100)
                  const width = right - left
                  if (width < 0.1) return null

                  return (
                    <div
                      key={i}
                      className="absolute inset-y-0 rounded-sm transition-opacity duration-100"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        background: `linear-gradient(180deg, ${session.color}ee 0%, ${session.color}99 100%)`,
                        borderLeft: `1.5px solid ${session.color}`,
                        opacity: tooltip && tooltip.session !== session ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        const rect = (e.currentTarget.closest(".relative") as HTMLElement).getBoundingClientRect()
                        setTooltip({ session, x: e.clientX - rect.left, y: -36 })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })}

              {/* In-row tooltip */}
              {tooltip && sessions.find((s) => s.type === type && s === tooltip.session) && (
                <div
                  className="pointer-events-none absolute z-20 rounded-md px-2.5 py-1.5 text-[10px] font-medium whitespace-nowrap shadow-lg"
                  style={{
                    left: Math.min(tooltip.x, 200),
                    top: -38,
                    backgroundColor: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-foreground)",
                  }}
                >
                  <span style={{ color: tooltip.session.color }}>●</span>{" "}
                  {tooltip.session.label}
                  <span className="ml-2 text-muted-foreground">
                    {formatTime(tooltip.session.start)} – {formatTime(tooltip.session.end)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}