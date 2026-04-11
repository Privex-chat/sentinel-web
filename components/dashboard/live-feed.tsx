"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { formatRelative, parseEventData } from "@/lib/utils"
import { EVENT_COLORS, EVENT_LABELS, type SSEEvent, type TargetStatus } from "@/lib/types"
import { Activity, ExternalLink } from "lucide-react"

interface LiveFeedProps {
  events: SSEEvent[]
  targetStatuses?: Record<string, TargetStatus>
  maxEvents?: number
}

export function LiveFeed({ events, targetStatuses = {}, maxEvents = 30 }: LiveFeedProps) {
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
              <EventItem
                key={`${event.target_id}-${event.event_type}-${event.timestamp}-${i}`}
                event={event}
                targetStatuses={targetStatuses}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function buildDiscordUrl(d: Record<string, unknown>, event: SSEEvent): string | null {
  const channelId = (
    d.channelId ?? d.channel_id ?? (event as unknown as Record<string, unknown>).channel_id
  ) as string | undefined
  if (!channelId) return null
  const guildId = (
    d.guildId ?? d.guild_id ?? (event as unknown as Record<string, unknown>).guild_id
  ) as string | undefined
  if (guildId) return `https://discord.com/channels/${guildId}/${channelId}`
  return `https://discord.com/channels/@me/${channelId}`
}

function extractDetail(event: SSEEvent, d: Record<string, unknown>): string {
  switch (event.event_type) {
    case "PRESENCE_UPDATE": {
      const oldS = d.oldStatus as string | undefined
      const newS = d.newStatus as string | undefined
      if (oldS && newS) return `${oldS} → ${newS}`
      if (newS) return newS
      return ""
    }
    case "MESSAGE_CREATE": {
      const chId = (d.channelId ?? d.channel_id) as string | undefined
      return chId ? `in #…${chId.slice(-8)}` : ""
    }
    case "MESSAGE_UPDATE": {
      const chId = (d.channelId ?? d.channel_id) as string | undefined
      return chId ? `edited in #…${chId.slice(-8)}` : "edited"
    }
    case "MESSAGE_DELETE": {
      const chId = (d.channelId ?? d.channel_id) as string | undefined
      return chId ? `deleted in #…${chId.slice(-8)}` : "deleted"
    }
    case "VOICE_JOIN": {
      const chId = (d.channelId ?? d.channel_id) as string | undefined
      return chId ? `joined …${chId.slice(-8)}` : "joined voice"
    }
    case "VOICE_LEAVE": {
      const chId = (d.channelId ?? d.channel_id) as string | undefined
      return chId ? `left …${chId.slice(-8)}` : "left voice"
    }
    case "VOICE_MOVE": {
      const from = (d.fromChannel) as string | undefined
      const to = (d.toChannel) as string | undefined
      if (from && to) return `…${from.slice(-6)} → …${to.slice(-6)}`
      return ""
    }
    case "PROFILE_UPDATE": {
      const changes = d.changes as string[] | undefined
      if (changes?.length) return changes.slice(0, 2).join(", ")
      return "profile updated"
    }
    case "ACTIVITY_START":
    case "INITIAL_ACTIVITY": {
      const name = d.name as string | undefined
      return name || ""
    }
    case "ACTIVITY_END": {
      const name = d.name as string | undefined
      return name ? `stopped ${name}` : ""
    }
    case "SPOTIFY_START": {
      const song = d.song as string | undefined
      const artist = d.artist as string | undefined
      if (song && artist) return `${song} – ${artist}`
      return song || ""
    }
    case "GHOST_TYPE": {
      const chId = (d.channelId ?? d.channel_id) as string | undefined
      return chId ? `in #…${chId.slice(-8)}` : ""
    }
    case "AVATAR_CHANGE":   return "avatar changed"
    case "USERNAME_CHANGE": {
      const oldV = d.old as string | undefined
      const newV = d.new as string | undefined
      if (oldV && newV) return `${oldV} → ${newV}`
      return "username changed"
    }
    case "NICKNAME_CHANGE": {
      const oldNick = d.oldNick as string | undefined
      const newNick = d.newNick as string | undefined
      if (newNick) return oldNick ? `${oldNick} → ${newNick}` : `→ ${newNick}`
      return "nickname changed"
    }
    case "SERVER_JOIN":
    case "SERVER_LEAVE": {
      const guildId = d.guildId as string | undefined
      return guildId ? `guild …${guildId.slice(-8)}` : ""
    }
    case "ACCOUNT_CONNECTED":
    case "ACCOUNT_DISCONNECTED": {
      const acType = d.type as string | undefined
      const name = d.name as string | undefined
      if (acType && name) return `${acType}: ${name}`
      return acType || ""
    }
    default: {
      if (d.newStatus) return `${d.oldStatus ?? "?"} → ${d.newStatus}`
      if (d.name) return String(d.name)
      if (d.song) return `${d.song}${d.artist ? ` – ${d.artist}` : ""}`
      return ""
    }
  }
}

function EventItem({
  event,
  targetStatuses,
}: {
  event: SSEEvent
  targetStatuses: Record<string, TargetStatus>
}) {
  const color    = EVENT_COLORS[event.event_type] || "var(--color-muted-foreground)"
  const label    = EVENT_LABELS[event.event_type] || event.event_type
  const targetId = event.target_id ?? "unknown"

  // Resolve display name
  const profile = targetStatuses[targetId]?.profile
  const displayName = profile?.global_name || profile?.username || `…${targetId.slice(-6)}`

  let detail = ""
  let discordUrl: string | null = null

  try {
    const raw = event.data
    const d: Record<string, unknown> =
      typeof raw === "string" ? parseEventData(raw) : (raw ?? {})
    discordUrl = buildDiscordUrl(d, event)
    detail = extractDetail(event, d)
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
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
            {displayName}
          </span>
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
      <div className="flex items-center gap-1 flex-shrink-0">
      {discordUrl && (
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded p-1 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Open in Discord"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <span className="text-[10px] text-muted-foreground">
          {event.timestamp ? formatRelative(event.timestamp) : ""}
        </span>
      </div>
    </Link>
  )
}