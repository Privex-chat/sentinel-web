/* components/dashboard/target-card.tsx */
"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Target, TargetStatus } from "@/lib/types"
import { X, Gamepad2, Music, Mic } from "lucide-react"

interface TargetCardProps {
  target: Target
  status?: TargetStatus
  onRemove?: () => void
}

const STATUS_DOT: Record<string, string> = {
  online:  "bg-status-online",
  idle:    "bg-status-idle",
  dnd:     "bg-status-dnd",
  offline: "bg-status-offline",
}
const STATUS_GLOW: Record<string, string> = {
  online: "shadow-[0_0_12px_rgba(var(--status-online-rgb,101,201,109),0.25)]",
  idle:   "",
  dnd:    "",
  offline:"",
}

export function TargetCard({ target, status, onRemove }: TargetCardProps) {
  const [hovered, setHovered] = useState(false)

  const presence       = status?.presence
  const activities     = status?.activities || []
  const voiceState     = status?.voiceState
  const currentStatus  = presence?.status || "offline"
  const platform       = presence?.platform
  const gamingActivity = activities.find((a) => a.type === 0)
  const spotifyActivity= activities.find((a) => a.type === 2)

  const isOnline = currentStatus === "online"

  return (
    <Link
      href={`/targets/${target.user_id}`}
      className={cn(
        "group relative block rounded-xl border bg-card p-4 transition-all duration-200",
        "hover:border-primary/40 hover:bg-card/90",
        isOnline && "border-status-online/20"
      )}
      style={{
        boxShadow: hovered
          ? "0 0 0 1px var(--color-primary)20, 0 4px 16px rgba(0,0,0,0.3)"
          : isOnline
            ? "0 0 12px rgba(0,0,0,0.2)"
            : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove() }}
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-md"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar
          userId={target.user_id}
          avatarHash={status?.profile?.avatar_hash}
          size={44}
          status={currentStatus as "online" | "idle" | "dnd" | "offline"}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="truncate text-sm font-semibold">
              {status?.profile?.global_name || status?.profile?.username || `…${target.user_id.slice(-8)}`}
            </span>
            {target.label     && <Badge variant="default">{target.label}</Badge>}
            {target.priority >= 2 && <Badge variant="destructive">Critical</Badge>}
            {target.priority === 1 && <Badge variant="warning">High</Badge>}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[currentStatus] || "bg-status-offline")} />
            <span className="capitalize">{currentStatus}</span>
            {platform && <span className="opacity-60">({platform})</span>}
          </div>
        </div>
      </div>

      {/* Activity row */}
      <div className="mt-3 space-y-1.5">
        {gamingActivity && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
            style={{ backgroundColor: "var(--color-chart-1)15", border: "1px solid var(--color-chart-1)20" }}
          >
            <Gamepad2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-chart-1)" }} />
            <span className="truncate">
              <span className="text-muted-foreground">Playing </span>
              <span className="font-medium">{gamingActivity.name}</span>
            </span>
          </div>
        )}
        {spotifyActivity && !gamingActivity && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
            style={{ backgroundColor: "var(--color-spotify)15", border: "1px solid var(--color-spotify)20" }}
          >
            <Music className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-spotify)" }} />
            <span className="truncate">
              <span className="font-medium">{spotifyActivity.details || "Spotify"}</span>
              {spotifyActivity.state && <span className="text-muted-foreground"> by {spotifyActivity.state}</span>}
            </span>
          </div>
        )}
        {voiceState && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
            style={{ backgroundColor: "var(--color-status-online)12", border: "1px solid var(--color-status-online)20" }}
          >
            <Mic className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-status-online)" }} />
            <span style={{ color: "var(--color-status-online)" }}>
              In voice{voiceState.streaming && " · Streaming"}{voiceState.selfMute && " · Muted"}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}