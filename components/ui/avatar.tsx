/* components/ui/avatar.tsx */
"use client"

import { cn, getAvatarUrl, userIdToHue } from "@/lib/utils"
import { useState } from "react"

interface AvatarProps {
  userId: string
  avatarHash?: string | null
  size?: number
  className?: string
  status?: "online" | "idle" | "dnd" | "offline" | null
}

const STATUS_RING: Record<string, string> = {
  online:  "bg-status-online",
  idle:    "bg-status-idle",
  dnd:     "bg-status-dnd",
  offline: "bg-status-offline",
}

export function Avatar({ userId, avatarHash, size = 40, className, status }: AvatarProps) {
  // Three states: loading CDN image → failed → show coloured placeholder
  const [failed, setFailed] = useState(false)

  // Request at 2× for retina; snapToDiscordSize handles the rounding
  const url = getAvatarUrl(userId, avatarHash, size * 2)

  // Deterministic colour from the user ID so the placeholder is stable
  const hue = userIdToHue(userId)
  const initials = userId.slice(-2).toUpperCase()

  const dotSize = Math.max(Math.round(size * 0.28), 8)

  return (
    <div
      className={cn("relative flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {failed ? (
        /* Coloured initial placeholder */
        <div
          className="flex items-center justify-center rounded-full font-semibold select-none"
          style={{
            width: size,
            height: size,
            background: `linear-gradient(135deg, hsl(${hue},60%,45%) 0%, hsl(${(hue + 40) % 360},70%,55%) 100%)`,
            fontSize: Math.max(size * 0.35, 10),
            color: "white",
          }}
        >
          {initials}
        </div>
      ) : (
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
          onError={() => setFailed(true)}
          crossOrigin="anonymous"
        />
      )}

      {status && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-card",
            STATUS_RING[status] ?? STATUS_RING.offline
          )}
          style={{ width: dotSize, height: dotSize }}
        />
      )}
    </div>
  )
}