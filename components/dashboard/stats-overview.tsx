/* components/dashboard/stats-overview.tsx */
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useSentinel } from "@/lib/context"
import { formatNumber } from "@/lib/utils"
import { Users, Activity, Database, Clock, Zap, Radio } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatDef {
  label:   string
  value:   string | number
  icon:    LucideIcon
  color:   string
  bg:      string
  border:  string
}

export function StatsOverview() {
  const { status, connected, targets, recentEvents } = useSentinel()

  const stats: StatDef[] = [
    {
      label:  "Connection",
      value:  connected ? "Live" : "Offline",
      icon:   Radio,
      color:  connected ? "var(--color-status-online)" : "var(--color-status-offline)",
      bg:     connected ? "var(--color-status-online)12" : "var(--color-status-offline)10",
      border: connected ? "var(--color-status-online)25" : "var(--color-status-offline)20",
    },
    {
      label: "Targets",
      value: targets.length,
      icon:  Users,
      color: "var(--color-chart-1)",
      bg:    "var(--color-chart-1)12",
      border:"var(--color-chart-1)25",
    },
    {
      label: "Total Events",
      value: status ? formatNumber(status.eventCount) : "—",
      icon:  Activity,
      color: "var(--color-chart-3)",
      bg:    "var(--color-chart-3)12",
      border:"var(--color-chart-3)25",
    },
    {
      label: "Database",
      value: status ? `${status.dbSizeMB} MB` : "—",
      icon:  Database,
      color: "var(--color-chart-5)",
      bg:    "var(--color-chart-5)12",
      border:"var(--color-chart-5)25",
    },
    {
      label: "Uptime",
      value: status?.uptimeFormatted || "—",
      icon:  Clock,
      color: "var(--color-chart-4)",
      bg:    "var(--color-chart-4)12",
      border:"var(--color-chart-4)25",
    },
    {
      label: "Recent Events",
      value: recentEvents.length,
      icon:  Zap,
      color: "var(--color-primary)",
      bg:    "var(--color-primary)12",
      border:"var(--color-primary)25",
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl p-3.5 transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: stat.bg,
            border: `1px solid ${stat.border}`,
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${stat.color}20` }}
            >
              <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-wider" style={{ color: stat.color, opacity: 0.8 }}>
                {stat.label}
              </p>
              <p className="text-base font-bold leading-tight truncate" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}