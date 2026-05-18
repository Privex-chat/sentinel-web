/* lib/utils.ts */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

// ── Timezone utilities ────────────────────────────────────────────────────────

const TZ_ABBREVIATIONS: Record<string, string> = {
  EST:  "America/New_York",  EDT:  "America/New_York",
  CST:  "America/Chicago",   CDT:  "America/Chicago",
  MST:  "America/Denver",    MDT:  "America/Denver",
  PST:  "America/Los_Angeles", PDT: "America/Los_Angeles",
  GMT:  "Europe/London",     BST:  "Europe/London",
  CET:  "Europe/Berlin",     CEST: "Europe/Berlin",
  EET:  "Europe/Bucharest",  EEST: "Europe/Bucharest",
  IST:  "Asia/Kolkata",      JST:  "Asia/Tokyo",
  KST:  "Asia/Seoul",        HKT:  "Asia/Hong_Kong",
  SGT:  "Asia/Singapore",    AEST: "Australia/Sydney",
  AEDT: "Australia/Sydney",  NZST: "Pacific/Auckland",
  NZDT: "Pacific/Auckland",  MSK:  "Europe/Moscow",
  IDT:  "Asia/Jerusalem",    GST:  "Asia/Dubai",
  PKT:  "Asia/Karachi",      SAST: "Africa/Johannesburg",
  HST:  "Pacific/Honolulu",  AKST: "America/Anchorage",
}

function isValidIANA(tz: string): boolean {
  try { Intl.DateTimeFormat(undefined, { timeZone: tz }); return true }
  catch { return false }
}

export interface ParsedTimezone {
  canonical: string
  display: string
}

export function parseTimezone(input: string): ParsedTimezone | null {
  const raw = input.trim()
  if (!raw) return null

  if (/^(UTC|GMT)$/i.test(raw)) return { canonical: "UTC", display: "UTC" }

  if (raw.includes("/")) {
    if (isValidIANA(raw)) return { canonical: raw, display: raw }
    const normalised = raw.split("/").map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join("/")
    if (isValidIANA(normalised)) return { canonical: normalised, display: normalised }
    return null
  }

  const offsetMatch = raw.match(/^(?:UTC|GMT)\s*([+-])?\s*(\d{1,2})(?::(\d{2}))?$/i)
  if (offsetMatch) return buildOffset(offsetMatch[1] || "+", parseInt(offsetMatch[2]), offsetMatch[3] ? parseInt(offsetMatch[3]) : 0)

  const bareMatch = raw.match(/^([+-])(\d{1,2})(?::(\d{2}))?$/)
  if (bareMatch) return buildOffset(bareMatch[1], parseInt(bareMatch[2]), bareMatch[3] ? parseInt(bareMatch[3]) : 0)

  const numVal = Number(raw)
  if (!Number.isNaN(numVal) && Number.isFinite(numVal) && Number.isInteger(numVal) && Math.abs(numVal) <= 14) {
    return buildOffset(numVal >= 0 ? "+" : "-", Math.abs(numVal), 0)
  }

  const mapped = TZ_ABBREVIATIONS[raw.toUpperCase()]
  if (mapped) return { canonical: mapped, display: `${mapped} (${raw.toUpperCase()})` }

  return null
}

function buildOffset(sign: string, hours: number, minutes: number): ParsedTimezone | null {
  if (hours > 14 || minutes > 59) return null
  if (hours === 0 && minutes === 0) return { canonical: "UTC", display: "UTC" }
  const minPart = minutes > 0 ? `:${String(minutes).padStart(2, "0")}` : ""
  const canonical = `UTC${sign}${hours}${minPart}`
  return { canonical, display: canonical }
}

export function getTimezoneOffsetMinutes(tz: string | null | undefined, atMs: number = Date.now()): number {
  if (!tz) return 0
  const m = tz.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/)
  if (m) {
    const sign = m[1] === "+" ? 1 : -1
    return sign * (parseInt(m[2]) * 60 + (m[3] ? parseInt(m[3]) : 0))
  }
  if (tz === "UTC") return 0
  try {
    const d = new Date(atMs)
    const extractParts = (timeZone: string) => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
        hour12: false,
      }).formatToParts(d)
      const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? "0", 10)
      return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") === 24 ? 0 : get("hour"), get("minute"), get("second"))
    }
    return Math.round((extractParts(tz) - extractParts("UTC")) / 60_000)
  } catch { return 0 }
}

export function tzLabel(tz: string | null | undefined): string {
  if (!tz) return "Server"
  if (tz.startsWith("UTC")) return tz
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date())
    const p = parts.find(p => p.type === "timeZoneName")
    return p?.value ?? tz
  } catch { return tz }
}

export function formatTimeInTz(ts: number, tz: string | null | undefined): string {
  if (!tz) return formatTime(ts)
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(ts))
  } catch { return formatTime(ts) }
}

export function formatDateTimeInTz(ts: number, tz: string | null | undefined): string {
  if (!tz) return formatDateTime(ts)
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(ts))
  } catch { return formatDateTime(ts) }
}

export function formatDateInTz(ts: number, tz: string | null | undefined): string {
  if (!tz) return formatDate(ts)
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      month: "short", day: "numeric",
    }).format(new Date(ts))
  } catch { return formatDate(ts) }
}