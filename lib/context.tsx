/* lib/context.tsx */
"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { api, setApiConfig, getApiConfig } from "./api"
import type { SSEEvent, SentinelStatus, Target, TargetStatus } from "./types"

// ── Settings ───────────────────────────────────────────────────────────────────

interface Settings {
  sentinelUrl: string
  sentinelToken: string
  dashboardRefreshInterval: number
  enableSSE: boolean
  showDesktopNotifications: boolean
}

// Always start with safe server-side defaults so the initial SSR render and
// the client hydration render are identical.  localStorage is read in a
// useEffect below after hydration, which avoids the mismatch warning.
const INITIAL_SETTINGS: Settings = {
  sentinelUrl:               "http://localhost:48923",
  sentinelToken:             "",
  dashboardRefreshInterval:  30,
  enableSSE:                 true,
  showDesktopNotifications:  true,
}

// ── Context ────────────────────────────────────────────────────────────────────

interface SentinelContextValue {
  settings:        Settings
  updateSettings:  (newSettings: Partial<Settings>) => void
  connected:       boolean
  status:          SentinelStatus | null
  recentEvents:    SSEEvent[]
  cacheVersion:    number
  targets:         Target[]
  targetStatuses:  Record<string, TargetStatus>
  refreshTargets:  () => Promise<void>
  addTarget:       (userId: string, label?: string) => Promise<void>
  removeTarget:    (userId: string) => Promise<void>
  isLoading:       boolean
  error:           string | null
}

const SentinelContext = createContext<SentinelContextValue | null>(null)

// ── Provider ───────────────────────────────────────────────────────────────────

export function SentinelProvider({ children }: { children: ReactNode }) {
  const [settings,       setSettings]       = useState<Settings>(INITIAL_SETTINGS)
  const [hydrated,       setHydrated]       = useState(false)
  const [connected,      setConnected]      = useState(false)
  const [status,         setStatus]         = useState<SentinelStatus | null>(null)
  const [recentEvents,   setRecentEvents]   = useState<SSEEvent[]>([])
  const [cacheVersion,   setCacheVersion]   = useState(0)
  const [targets,        setTargets]        = useState<Target[]>([])
  const [targetStatuses, setTargetStatuses] = useState<Record<string, TargetStatus>>({})
  const [isLoading,      setIsLoading]      = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  // Used to debounce cacheVersion increments triggered by SSE events.
  // Without this, every incoming event would invalidate all useApi caches and
  // trigger a cascade of refetches across every open tab/component.
  const cacheDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Hydrate settings from localStorage (client-only, after first render) ────
  useEffect(() => {
    try {
      const savedUrl   = localStorage.getItem("sentinel_url")
      const savedToken = localStorage.getItem("sentinel_token")
      if (savedUrl || savedToken) {
        setSettings((s) => ({
          ...s,
          sentinelUrl:   savedUrl   || s.sentinelUrl,
          sentinelToken: savedToken || s.sentinelToken,
        }))
      }
    } catch {
      // localStorage not available (e.g. private browsing restrictions)
    }
    setHydrated(true)
  }, [])

  // ── Keep API config in sync with settings ──────────────────────────────────
  useEffect(() => {
    setApiConfig(settings.sentinelUrl, settings.sentinelToken)
  }, [settings.sentinelUrl, settings.sentinelToken])

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      try {
        if (newSettings.sentinelUrl   !== undefined) localStorage.setItem("sentinel_url",   newSettings.sentinelUrl)
        if (newSettings.sentinelToken !== undefined) localStorage.setItem("sentinel_token", newSettings.sentinelToken)
      } catch { /* ignore */ }
      return updated
    })
  }, [])

  // ── Parallel target + status fetch ────────────────────────────────────────
  const refreshTargets = useCallback(async () => {
    if (!settings.sentinelToken) return
    try {
      const targetList = await api.getTargets()
      setTargets(targetList)

      // Fetch all statuses concurrently — sequential was O(n) round-trips
      const results = await Promise.allSettled(
        targetList.map((t) => api.getTargetStatus(t.user_id))
      )

      const statuses: Record<string, TargetStatus> = {}
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          statuses[targetList[i].user_id] = result.value
        }
      })
      setTargetStatuses(statuses)
    } catch (e) {
      console.error("Failed to fetch targets:", e)
    }
  }, [settings.sentinelToken])

  const addTarget = useCallback(
    async (userId: string, label?: string) => {
      await api.addTarget(userId, label)
      api.clearCache()
      await refreshTargets()
    },
    [refreshTargets]
  )

  const removeTarget = useCallback(
    async (userId: string) => {
      await api.removeTarget(userId)
      api.clearCache()
      await refreshTargets()
    },
    [refreshTargets]
  )

  // ── Initial connection + periodic status check ─────────────────────────────
  // Wait for hydration so we have the real token before attempting to connect.
  useEffect(() => {
    if (!hydrated) return
    if (!settings.sentinelToken) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    const checkConnection = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const statusData = await api.getStatus()
        if (cancelled) return
        setStatus(statusData)
        setConnected(true)
        await refreshTargets()
      } catch (e) {
        if (cancelled) return
        setConnected(false)
        setError(e instanceof Error ? e.message : "Connection failed")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    checkConnection()

    const statusInterval = setInterval(async () => {
      if (cancelled) return
      try {
        const statusData = await api.getStatus()
        if (cancelled) return
        setStatus(statusData)
        setConnected(true)
      } catch {
        if (!cancelled) setConnected(false)
      }
    }, 30_000)

    return () => {
      cancelled = true
      clearInterval(statusInterval)
    }
  }, [hydrated, settings.sentinelToken, refreshTargets])

  // ── Periodic target-status refresh ────────────────────────────────────────
  useEffect(() => {
    if (!connected || targets.length === 0) return

    const interval = setInterval(async () => {
      const results = await Promise.allSettled(
        targets.map((t) => api.getTargetStatus(t.user_id))
      )
      const statuses: Record<string, TargetStatus> = {}
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          statuses[targets[i].user_id] = result.value
        }
      })
      setTargetStatuses(statuses)
    }, settings.dashboardRefreshInterval * 1_000)

    return () => clearInterval(interval)
  }, [connected, targets, settings.dashboardRefreshInterval])

  // ── SSE live event stream ──────────────────────────────────────────────────
  useEffect(() => {
    if (!settings.enableSSE || !settings.sentinelToken || !connected) return

    const { baseUrl, token } = getApiConfig()
    if (!baseUrl || !token) return

    const url = `${baseUrl}/api/events/stream`
    let abortController: AbortController | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let reconnectDelay = 1_000
    const MAX_RECONNECT_DELAY = 30_000
    let stopped = false

    const connect = async () => {
      if (stopped) return
      try {
        abortController = new AbortController()

        const response = await fetch(url, {
          headers:  { Authorization: `Bearer ${token}` },
          signal:   abortController.signal,
          // Tell the browser not to buffer the response
          cache:    "no-store",
        })

        if (!response.ok || !response.body) {
          throw new Error(`SSE connection failed: ${response.status}`)
        }

        // Successful connection — reset backoff
        reconnectDelay = 1_000

        const reader  = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer    = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            try {
              const raw = JSON.parse(line.slice(6))
              // Skip the initial "connected" handshake message
              if (raw?.type === "connected") continue

              const data = raw as SSEEvent
              setRecentEvents((prev) => [data, ...prev].slice(0, 100))

              // Invalidate caches for the affected target only, debounced so
              // a burst of events doesn't trigger a refetch storm.
              if (cacheDebounceRef.current) clearTimeout(cacheDebounceRef.current)
              cacheDebounceRef.current = setTimeout(() => {
                if (data.target_id) api.clearCacheForTarget(data.target_id)
                setCacheVersion((v) => v + 1)
              }, 4_000)
            } catch {
              // Ignore malformed payloads
            }
          }
        }
      } catch (e) {
        if (stopped) return
        if ((e as Error).name === "AbortError") return

        // Exponential back-off before reconnecting
        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY)
        console.warn(`SSE disconnected, reconnecting in ${reconnectDelay}ms`)
        reconnectTimeout = setTimeout(connect, reconnectDelay)
      }
    }

    connect()

    return () => {
      stopped = true
      if (abortController)    abortController.abort()
      if (reconnectTimeout)   clearTimeout(reconnectTimeout)
      if (cacheDebounceRef.current) clearTimeout(cacheDebounceRef.current)
    }
  }, [settings.enableSSE, settings.sentinelToken, connected])

  return (
    <SentinelContext.Provider
      value={{
        settings,
        updateSettings,
        connected,
        status,
        recentEvents,
        cacheVersion,
        targets,
        targetStatuses,
        refreshTargets,
        addTarget,
        removeTarget,
        isLoading,
        error,
      }}
    >
      {children}
    </SentinelContext.Provider>
  )
}

export function useSentinel() {
  const context = useContext(SentinelContext)
  if (!context) throw new Error("useSentinel must be used within a SentinelProvider")
  return context
}