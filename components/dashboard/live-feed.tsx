"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { formatRelative, parseEventData } from "@/lib/utils"
import { EVENT_COLORS, EVENT_LABELS, type SSEEvent } from "@/lib/types"
import { Activity, Radio } from "lucide-react"

interface LiveFeedProps {
  events: SSEEvent[]
  maxEvents?: number
}

export function LiveFeed({ events, maxEvents = 30 }: LiveFeedProps) {
  const displayEvents = events
    .filter((e) => e && typeof e.timestamp !== "undefined")
    .slice(0, maxEvents)

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="border-b pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-online opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-status-online" />
            </span>
            Live Feed
          </CardTitle>
          <span className="text-xs text-muted-foreground">{displayEvents.length} events</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 max-h-[500px] overflow-y-auto p-0">
        {displayEvents.length === 0 ? (
          <EmptyState
            icon={Activity}
            message="Events will appear here in real-time as they occur."
            className="py-8"
          />
        ) : (
          <div className="divide-y">
            {displayEvents.map((event, i) => (
              <EventItem key={`${event.timestamp}-${i}`} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EventItem({ event }: { event: SSEEvent }) {
  const color    = EVENT_COLORS[event.event_type] || "var(--color-muted-foreground)"
  const label    = EVENT_LABELS[event.event_type] || event.event_type
  const targetId = event.target_id ?? "unknown"

  let detail = ""
  try {
    const d = typeof event.data === "string" ? parseEventData(event.data) : (event.data ?? {})
    if (d?.newStatus)  detail = `${d.oldStatus || "?"} → ${d.newStatus}`
    else if (d?.name)  detail = String(d.name)
    else if (d?.messageId) detail = `msg ${String(d.messageId).slice(-6)}`
    else if (d?.song)  detail = `${d.song} – ${d.artist ?? ""}`
  } catch { /* ignore */ }

  return (
    <Link
      href={`/targets/${targetId}`}
      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/40"
    >
      <div
        className="h-6 w-0.5 flex-shrink-0 rounded-full self-stretch"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] text-muted-foreground">{targetId.slice(-6)}</span>
          <span
            className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide border"
            style={{ backgroundColor: `${color}18`, color, borderColor: `${color}30` }}
          >
            {label}
          </span>
        </div>
        {detail && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{detail}</p>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground flex-shrink-0">
        {event.timestamp ? formatRelative(event.timestamp) : ""}
      </span>
    </Link>
  )
}