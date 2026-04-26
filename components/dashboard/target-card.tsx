/* components/dashboard/target-card.tsx */
"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useSentinel } from "@/lib/context"
import { api } from "@/lib/api"
import type { Target, TargetStatus } from "@/lib/types"
import { X, Gamepad2, Music, Mic, Pencil, Check } from "lucide-react"

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

export function TargetCard({ target, status, onRemove }: TargetCardProps) {
  const [hovered,       setHovered]       = useState(false)
  const [editingLabel,  setEditingLabel]  = useState(false)
  const [labelValue,    setLabelValue]    = useState(target.label || "")
  const [savingLabel,   setSavingLabel]   = useState(false)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const { refreshTargets } = useSentinel()

  // Sync when target prop changes
  useEffect(() => {
    if (!editingLabel) {
      setLabelValue(target.label || "")
    }
  }, [target.label, editingLabel])

  useEffect(() => {
    if (editingLabel) {
      labelInputRef.current?.focus()
      labelInputRef.current?.select()
    }
  }, [editingLabel])

  const presence        = status?.presence
  const activities      = status?.activities || []
  const voiceState      = status?.voiceState
  const currentStatus   = presence?.status || "offline"
  const platform        = presence?.platform
  const gamingActivity  = activities.find((a) => a.type === 0)
  const spotifyActivity = activities.find((a) => a.type === 2)
  const isOnline        = currentStatus === "online"

  const handleLabelSave = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (savingLabel) return
    setSavingLabel(true)
    try {
      const trimmed = labelValue.trim()
      // Send null explicitly so an empty string clears the label in the DB
      await api.updateTarget(target.user_id, { label: trimmed || null })
      await refreshTargets()
    } catch (err) {
      console.error("Failed to update label:", err)
    } finally {
      setSavingLabel(false)
      setEditingLabel(false)
    }
  }

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter")  { e.preventDefault(); handleLabelSave() }
    if (e.key === "Escape") {
      e.preventDefault()
      setLabelValue(target.label || "")
      setEditingLabel(false)
    }
  }

  const startEditing = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLabelValue(target.label || "")
    setEditingLabel(true)
  }

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
      {onRemove && !editingLabel && (
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
          {/* Name + label row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="truncate text-sm font-semibold">
              {status?.profile?.global_name ||
                status?.profile?.username ||
                `…${target.user_id.slice(-8)}`}
            </span>

            {/* Inline label editor */}
            {editingLabel ? (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.preventDefault()}
              >
                <input
                  ref={labelInputRef}
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  onKeyDown={handleLabelKeyDown}
                  placeholder="Label…"
                  disabled={savingLabel}
                  className="h-5 w-20 rounded px-1.5 text-[10px] font-semibold border border-primary bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleLabelSave}
                  disabled={savingLabel}
                  className="rounded p-0.5 text-status-online hover:bg-secondary transition-colors disabled:opacity-50"
                  title="Save"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setLabelValue(target.label || "")
                    setEditingLabel(false)
                  }}
                  className="rounded p-0.5 text-muted-foreground hover:bg-secondary transition-colors"
                  title="Cancel"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <>
                {target.label && <Badge variant="default">{target.label}</Badge>}
                {hovered && (
                  <button
                    onClick={startEditing}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title={target.label ? "Edit label" : "Add label"}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </>
            )}

            {target.priority >= 2 && <Badge variant="destructive">Critical</Badge>}
            {target.priority === 1 && <Badge variant="warning">High</Badge>}
          </div>

          {/* Status row */}
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
            style={{
              backgroundColor: "var(--color-chart-1)15",
              border: "1px solid var(--color-chart-1)20",
            }}
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
            style={{
              backgroundColor: "var(--color-spotify)15",
              border: "1px solid var(--color-spotify)20",
            }}
          >
            <Music className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-spotify)" }} />
            <span className="truncate">
              <span className="font-medium">{spotifyActivity.details || "Spotify"}</span>
              {spotifyActivity.state && (
                <span className="text-muted-foreground"> by {spotifyActivity.state}</span>
              )}
            </span>
          </div>
        )}
        {voiceState && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
            style={{
              backgroundColor: "var(--color-status-online)12",
              border: "1px solid var(--color-status-online)20",
            }}
          >
            <Mic className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-status-online)" }} />
            <span style={{ color: "var(--color-status-online)" }}>
              In voice
              {voiceState.streaming && " · Streaming"}
              {voiceState.selfMute  && " · Muted"}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}