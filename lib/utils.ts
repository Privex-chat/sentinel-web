/* lib/utils.ts */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Target } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * True when the target is still in the onboarding grace window. While true,
 * the selfbot suppresses alerts + anomaly surfacing for this target and the
 * panel should show a small "Bootstrapping…" hint instead of empty-state
 * messages like "no anomalies yet".
 *
 * Time-based: `bootstrap_completed_at` is a future epoch ms for new targets
 * and a past epoch ms for operational targets. The check just compares against
 * the client clock, so the banner naturally disappears the moment the grace
 * window elapses — no server round-trip required.
 *
 * Accepts undefined so it composes cleanly with `targets.find(...)`.
 */
export function isBootstrappingTarget(target: Target | null | undefined): boolean {
  if (!target) return false
  const v = target.bootstrap_completed_at
  if (v == null) return true  // unknown / legacy → assume bootstrapping
  return v > Date.now()
}

/**
 * Seconds remaining until the grace window expires. Returns 0 once the window
 * has passed. Useful for displaying a live countdown in the bootstrap banner.
 */
export function bootstrapSecondsRemaining(target: Target | null | undefined): number {
  if (!target) return 0
  const v = target.bootstrap_completed_at
  if (v == null) return 0
  return Math.max(0, Math.ceil((v - Date.now()) / 1000))
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000)    return "just now"
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`
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
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  })
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString()
}

export function parseEventData(data: string): Record<string, unknown> {
  try { return JSON.parse(data) } catch { return {} }
}

/**
 * Snap a pixel size to the nearest valid Discord CDN size.
 * Discord only accepts: 16, 32, 64, 128, 256, 512, 1024, 2048, 4096.
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
  try {
    const index = Number((BigInt(userId) >> 22n) % 6n)
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`
  } catch {
    return `https://cdn.discordapp.com/embed/avatars/0.png`
  }
}

/**
 * Returns the CDN URL for a user's profile banner, or null if no banner hash.
 * Animated banners (hash starts with "a_") use .gif extension.
 */
export function getBannerUrl(userId: string, bannerHash?: string | null, size = 480): string | null {
  if (!bannerHash) return null
  const discordSize = snapToDiscordSize(size)
  const ext = bannerHash.startsWith("a_") ? "gif" : "png"
  return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${ext}?size=${discordSize}`
}

/** Deterministic hue from a user ID string — used for avatar/banner placeholder colour. */
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