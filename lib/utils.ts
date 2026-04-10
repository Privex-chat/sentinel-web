/* lib/utils.ts */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return "just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export function formatMs(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" })
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

export function parseEventData(data: string): Record<string, unknown> {
  try {
    return JSON.parse(data)
  } catch {
    return {}
  }
}

/**
 * Snap a pixel size to the nearest valid Discord CDN size.
 * Discord only accepts: 16, 32, 64, 128, 256, 512, 1024, 2048, 4096.
 * Passing any other value returns a broken image.
 */
function snapToDiscordSize(px: number): number {
  const valid = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096]
  for (const s of valid) {
    if (s >= px) return s
  }
  return 4096
}

export function getAvatarUrl(userId: string, avatarHash?: string | null, size = 64): string {
  const discordSize = snapToDiscordSize(size)
  if (avatarHash) {
    const ext = avatarHash.startsWith("a_") ? "gif" : "png"
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${ext}?size=${discordSize}`
  }
  // Default avatar: new pomelo system uses (userId >> 22) % 6
  try {
    const index = Number((BigInt(userId) >> 22n) % 6n)
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`
  } catch {
    return `https://cdn.discordapp.com/embed/avatars/0.png`
  }
}

/** Deterministic hue from a user ID string — used for avatar placeholder colour. */
export function userIdToHue(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return hash % 360
}

export function validateDiscordUserId(userId: string): boolean {
  return /^\d{17,20}$/.test(userId)
}