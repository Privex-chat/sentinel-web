/* app/settings/page.tsx */
"use client"

import { useState, useEffect, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TipTooltip } from "@/components/onboarding/tip-tooltip"
import { useSentinel } from "@/lib/context"
import { useTour } from "@/components/onboarding/product-tour"
import { api } from "@/lib/api"
import type { RuntimeConfig, RuntimeKey } from "@/lib/types"
import { Server, Key, RefreshCw, Zap, CheckCircle, XCircle, BookOpen, Sparkles, Brain, Settings, Eye, EyeOff, Edit2, Webhook, Bot, Database } from "lucide-react"
import type { ReactNode } from "react"
import Link from "next/link"

export default function SettingsPage() {
  const { settings, updateSettings, connected, status } = useSentinel()
  const [url,         setUrl]         = useState(settings.sentinelUrl)
  const [token,       setToken]       = useState(settings.sentinelToken)
  const [saved,       setSaved]       = useState(false)
  const [intervalStr, setIntervalStr] = useState(String(settings.dashboardRefreshInterval))
  const [intervalSaved, setIntervalSaved] = useState(false)
  const { reset: resetTour } = useTour()
  const [tourReset, setTourReset] = useState(false)

  const handleSave = () => {
    updateSettings({ sentinelUrl: url, sentinelToken: token })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleIntervalBlur = () => {
    const parsed = parseInt(intervalStr, 10)
    if (!isNaN(parsed) && parsed >= 5 && parsed <= 300) {
      updateSettings({ dashboardRefreshInterval: parsed })
      setIntervalSaved(true)
      setTimeout(() => setIntervalSaved(false), 2000)
    } else {
      setIntervalStr(String(settings.dashboardRefreshInterval))
    }
  }

  const handleIntervalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleIntervalBlur()
  }

  const handleResetTour = () => {
    resetTour()
    setTourReset(true)
    setTimeout(() => setTourReset(false), 2000)
    window.location.href = "/"
  }

  return (
    <AppShell>
      <Header title="Settings" description="Configure your Sentinel connection" />
      <div className="p-3 md:p-6 space-y-4 md:space-y-6 max-w-3xl">

        {/* Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Server className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm md:text-base">Connection Status</CardTitle>
                  <CardDescription className="hidden sm:block">Sentinel API connection</CardDescription>
                </div>
              </div>
              <Badge variant={connected ? "success" : "destructive"} className="flex-shrink-0">
                {connected
                  ? <><CheckCircle className="mr-1 h-3 w-3" />Connected</>
                  : <><XCircle   className="mr-1 h-3 w-3" />Disconnected</>
                }
              </Badge>
            </div>
          </CardHeader>
          {connected && status && (
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Uptime",   value: status.uptimeFormatted },
                  { label: "Events",   value: status.eventCount.toLocaleString() },
                  { label: "Targets",  value: status.activeTargets },
                  { label: "Database", value: `${status.dbSizeMB} MB` },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-base font-semibold">{s.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
          {!connected && (
            <CardContent>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Not connected to a Sentinel API. Need help setting one up?
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/setup">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Open Setup Guide
                  </Link>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* API Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Key className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  API Configuration
                  <TipTooltip
                    content={
                      <div>
                        <p className="font-semibold mb-1">API Configuration</p>
                        <p className="text-muted-foreground">Set the URL where your Sentinel selfbot is running and the API_AUTH_TOKEN you chose when setting it up.</p>
                        <p className="mt-2 text-muted-foreground">Don't have an API yet? <Link href="/setup" className="text-primary underline-offset-2 hover:underline">Run the setup guide.</Link></p>
                      </div>
                    }
                  />
                </CardTitle>
                <CardDescription className="hidden sm:block">Endpoint and authentication</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sentinel API URL
                <TipTooltip
                  side="right"
                  content={
                    <div>
                      <p className="font-semibold mb-1">API URL</p>
                      <p className="text-muted-foreground text-[11px]">
                        Local: <code>http://localhost:48923</code><br />
                        VPS: <code>http://YOUR_IP:48923</code><br />
                        Railway: your Railway public domain
                      </p>
                    </div>
                  }
                />
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:48923"
                className="h-11 text-base"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="url"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                API Token
                <TipTooltip
                  side="right"
                  content={
                    <div>
                      <p className="font-semibold mb-1">API_AUTH_TOKEN</p>
                      <p className="text-muted-foreground text-[11px]">This is the password you set in your selfbot's .env file as API_AUTH_TOKEN. If you used the setup guide, it was auto-generated for you.</p>
                    </div>
                  }
                />
              </label>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Your API_AUTH_TOKEN"
                className="h-11 text-base"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button onClick={handleSave} className="h-11 flex-1 sm:flex-none">
                {saved
                  ? <><CheckCircle className="mr-2 h-4 w-4" />Saved</>
                  : "Save Configuration"
                }
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="h-11 flex-1 sm:flex-none"
              >
                <RefreshCw className="mr-2 h-4 w-4" />Reconnect
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Zap className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm md:text-base">Preferences</CardTitle>
                <CardDescription className="hidden sm:block">Customize your experience</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleRow
              label="Real-time Updates (SSE)"
              description="Live event streaming from the API"
              enabled={settings.enableSSE}
              onToggle={() => updateSettings({ enableSSE: !settings.enableSSE })}
              tip="Server-Sent Events stream live data from your selfbot API. Disable if you're on a slow connection."
            />
            <ToggleRow
              label="Desktop Notifications"
              description="Show notifications for alerts"
              enabled={settings.showDesktopNotifications}
              onToggle={() => updateSettings({ showDesktopNotifications: !settings.showDesktopNotifications })}
              tip="Browser notifications for alert events (requires notification permission)."
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Refresh Interval (seconds)
                  <TipTooltip
                    side="right"
                    content="How often to poll the API for updated target statuses. Lower = more real-time, higher = less API calls."
                  />
                </label>
                {intervalSaved && (
                  <span className="flex items-center gap-1 text-xs text-status-online">
                    <CheckCircle className="h-3 w-3" />
                    Saved
                  </span>
                )}
              </div>
              <Input
                type="number"
                inputMode="numeric"
                min={5}
                max={300}
                value={intervalStr}
                onChange={(e) => setIntervalStr(e.target.value)}
                onBlur={handleIntervalBlur}
                onKeyDown={handleIntervalKeyDown}
                className="h-11 text-base"
              />
              <p className="text-[11px] text-muted-foreground">
                Poll interval for target statuses (5–300 s). Press Enter or tap away to save.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Runtime config — hot-swap settings */}
        {connected && <RuntimeConfigPanel />}

        {/* Help & onboarding */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm md:text-base">Help & Onboarding</CardTitle>
                <CardDescription className="hidden sm:block">Setup guides and tutorials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="outline" className="h-10 flex-1">
                <Link href="/setup">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Open Setup Guide
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleResetTour}
                className="h-10 flex-1"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {tourReset ? "Tour reset! Redirecting…" : "Replay Product Tour"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              The setup guide walks you through deploying the selfbot API locally, on a VPS, or on Railway.
              The product tour highlights key features of this dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  tip,
}: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
  tip?: string
}) {
  return (
    <div
      className="flex items-center justify-between rounded-xl border p-4 cursor-pointer active:bg-secondary/50 transition-colors select-none"
      style={{ minHeight: 64 }}
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onToggle()}
    >
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium">{label}</p>
          {tip && (
            <TipTooltip
              content={tip}
              side="right"
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div
        className="relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200"
        style={{ backgroundColor: enabled ? "var(--color-primary)" : "var(--color-secondary)" }}
      >
        <span
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: enabled ? "translateX(20px)" : "translateX(4px)" }}
        />
      </div>
    </div>
  )
}

// ── Runtime Config Panel ────────────────────────────────────────────────────────

const SENSITIVE: Set<RuntimeKey> = new Set([
  "DISCORD_TOKEN",
  "AI_API_KEY",
  "SUPABASE_SERVICE_KEY",
  "ALERT_WEBHOOK_URL",
  "CRITICAL_WEBHOOK_URL",
])

interface ConfigField {
  key: RuntimeKey
  label: string
  description: string
  placeholder?: string
  type?: "text" | "select" | "boolean" | "number"
  options?: string[]
}

const CONFIG_GROUPS: { title: string; icon: ReactNode; fields: ConfigField[] }[] = [
  {
    title: "Discord",
    icon: <Bot className="h-5 w-5 text-muted-foreground" />,
    fields: [
      { key: "DISCORD_TOKEN", label: "Discord Token", description: "User account token for the selfbot", placeholder: "Paste new token…" },
    ],
  },
  {
    title: "Webhooks",
    icon: <Webhook className="h-5 w-5 text-muted-foreground" />,
    fields: [
      { key: "ALERT_WEBHOOK_URL",    label: "Alert Webhook URL",    description: "Discord webhook for normal alerts and startup notifications", placeholder: "https://discord.com/api/webhooks/…" },
      { key: "CRITICAL_WEBHOOK_URL", label: "Critical Webhook URL", description: "Separate webhook for critical errors (auth failures, API exhaustion). Falls back to alert webhook if empty.", placeholder: "https://discord.com/api/webhooks/…" },
    ],
  },
  {
    title: "AI",
    icon: <Brain className="h-5 w-5 text-muted-foreground" />,
    fields: [
      { key: "AI_PROVIDER",                  label: "Provider",              description: "AI backend to use", type: "select", options: ["none", "gemini", "openai", "anthropic", "ollama"] },
      { key: "AI_MODEL",                      label: "Model",                 description: "Model name (e.g. gemini-2.0-flash, gpt-4o-mini, claude-haiku-4-5)", placeholder: "gemini-2.0-flash" },
      { key: "AI_API_KEY",                    label: "API Key",               description: "API key for the selected provider", placeholder: "Paste new key…" },
      { key: "AI_BASE_URL",                   label: "Base URL",              description: "Custom base URL — only needed for Ollama or self-hosted APIs", placeholder: "http://localhost:11434/v1" },
      { key: "AI_ANALYSIS_INTERVAL_MS",       label: "Analysis Interval (ms)", description: "How often to run AI analysis (social graph, categorization). Default 86400000 = 24 h", type: "number", placeholder: "86400000" },
      { key: "AI_CATEGORIZATION_BATCH_SIZE",  label: "Categorization Batch",  description: "Messages analyzed per AI call. Lower = cheaper but slower.", type: "number", placeholder: "50" },
    ],
  },
  {
    title: "Briefs & Alerts",
    icon: <Settings className="h-5 w-5 text-muted-foreground" />,
    fields: [
      { key: "BRIEF_GENERATION_TIME",  label: "Brief Generation Time", description: "Daily intelligence brief time in HH:MM format (24 h, UTC)", placeholder: "07:00" },
      { key: "ALERT_DIGEST_MODE",      label: "Digest Mode",           description: "Batch alerts into a digest instead of firing individually", type: "boolean" },
      { key: "ALERT_DIGEST_INTERVAL_MS",label: "Digest Interval (ms)", description: "How often to flush the alert digest. Default 900000 = 15 min", type: "number", placeholder: "900000" },
      { key: "ALERT_FATIGUE_THRESHOLD",label: "Fatigue Threshold",     description: "Max alert fires in 24 h before auto-suppression", type: "number", placeholder: "20" },
    ],
  },
  {
    title: "Polling",
    icon: <RefreshCw className="h-5 w-5 text-muted-foreground" />,
    fields: [
      { key: "PROFILE_POLL_INTERVAL_MS",  label: "Profile Poll (ms)",  description: "How often to refresh target profile snapshots. Default 300000 = 5 min", type: "number", placeholder: "300000" },
      { key: "STATUS_POLL_INTERVAL_MS",   label: "Status Poll (ms)",   description: "How often to poll target statuses. Default 120000 = 2 min", type: "number", placeholder: "120000" },
      { key: "DAILY_SUMMARY_INTERVAL_MS", label: "Summary Interval (ms)", description: "How often to compute daily summaries. Default 3600000 = 1 h", type: "number", placeholder: "3600000" },
    ],
  },
  {
    title: "Backfill",
    icon: <Database className="h-5 w-5 text-muted-foreground" />,
    fields: [
      { key: "BACKFILL_ENABLED",                 label: "Backfill Enabled",          description: "Run message backfill on startup", type: "boolean" },
      { key: "BACKFILL_MAX_DAYS",                label: "Max Days",                  description: "How far back to backfill messages", type: "number", placeholder: "90" },
      { key: "BACKFILL_MAX_MESSAGES_PER_CHANNEL",label: "Max Messages Per Channel",  description: "Hard cap on messages fetched per channel", type: "number", placeholder: "5000" },
    ],
  },
  {
    title: "Supabase",
    icon: <Database className="h-5 w-5 text-muted-foreground" />,
    fields: [
      { key: "SUPABASE_URL",              label: "Supabase URL",          description: "Supabase project URL (required for local+cloud or cloud modes)", placeholder: "https://xyz.supabase.co" },
      { key: "SUPABASE_SERVICE_KEY",      label: "Service Key",           description: "Supabase service role key", placeholder: "Paste new key…" },
      { key: "SUPABASE_SYNC_INTERVAL_MS", label: "Sync Interval (ms)",   description: "How often to push data to Supabase. Default 30000 in cloud mode", type: "number", placeholder: "30000" },
    ],
  },
]

function RuntimeConfigPanel() {
  const [cfg, setCfg]       = useState<RuntimeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const data = await api.getRuntimeConfig()
      setCfg(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = useCallback(async (key: RuntimeKey, value: string) => {
    await api.updateRuntimeConfig(key, value)
    // Refresh — sensitive values stay masked, non-sensitive show updated
    const fresh = await api.getRuntimeConfig()
    setCfg(fresh)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading configuration…
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          Failed to load config: {error}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {CONFIG_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                {group.icon}
              </div>
              <div>
                <CardTitle className="text-sm md:text-base">{group.title}</CardTitle>
                <CardDescription className="hidden sm:block">Live configuration — changes take effect immediately</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.fields.map((field) => (
              <ConfigRow
                key={field.key}
                field={field}
                currentValue={cfg?.[field.key] ?? ""}
                onSave={handleSave}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  )
}

function ConfigRow({
  field,
  currentValue,
  onSave,
}: {
  field: ConfigField
  currentValue: string
  onSave: (key: RuntimeKey, value: string) => Promise<void>
}) {
  const isSensitive = SENSITIVE.has(field.key)
  const isMasked    = isSensitive && currentValue === "••••••••"

  const [editing, setEditing]   = useState(false)
  const [draft,   setDraft]     = useState("")
  const [revealed, setRevealed] = useState(false)
  const [saving,  setSaving]    = useState(false)
  const [saved,   setSaved]     = useState(false)
  const [err,     setErr]       = useState<string | null>(null)

  const startEdit = () => {
    // For sensitive fields always start with empty — we can't pre-fill the masked value
    setDraft(isMasked || isSensitive ? "" : currentValue)
    setEditing(true)
    setErr(null)
    setRevealed(false)
  }

  const cancel = () => { setEditing(false); setDraft(""); setErr(null) }

  const save = async () => {
    if (saving) return
    setSaving(true)
    setErr(null)
    try {
      await onSave(field.key, draft)
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2_000)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Display value in view mode
  const displayValue = isMasked
    ? "••••••••"
    : currentValue || <span className="italic text-muted-foreground/50">not set</span>

  return (
    <div className="rounded-xl border bg-card/50 p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium">{field.label}</span>
            {isSensitive && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal border-yellow-500/40 text-yellow-600 dark:text-yellow-400">
                sensitive
              </Badge>
            )}
            {saved && (
              <span className="flex items-center gap-0.5 text-[10px] text-status-online">
                <CheckCircle className="h-2.5 w-2.5" />saved
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{field.description}</p>
        </div>
        {!editing && (
          <Button size="sm" variant="ghost" className="h-7 px-2 flex-shrink-0" onClick={startEdit}>
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="flex items-center gap-1.5">
          <code className="text-[11px] font-mono text-muted-foreground truncate max-w-full">
            {displayValue}
          </code>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          {field.type === "select" && field.options ? (
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            >
              {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : field.type === "boolean" ? (
            <div className="flex gap-2">
              {["true", "false"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setDraft(opt)}
                  className={`flex-1 rounded-md border py-2 text-xs font-medium transition-colors ${
                    draft === opt
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="relative">
              <Input
                type={isSensitive && !revealed ? "password" : "text"}
                inputMode={field.type === "number" ? "numeric" : "text"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={field.placeholder}
                className="h-9 text-sm pr-9"
                autoComplete="off"
                onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel() }}
              />
              {isSensitive && (
                <button
                  type="button"
                  onClick={() => setRevealed((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          )}
          {err && <p className="text-[10px] text-destructive">{err}</p>}
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-xs flex-1" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={cancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
