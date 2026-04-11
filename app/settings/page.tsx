/* app/settings/page.tsx */
"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSentinel } from "@/lib/context"
import { Server, Key, RefreshCw, Zap, CheckCircle, XCircle } from "lucide-react"

export default function SettingsPage() {
  const { settings, updateSettings, connected, status } = useSentinel()
  const [url,         setUrl]         = useState(settings.sentinelUrl)
  const [token,       setToken]       = useState(settings.sentinelToken)
  const [saved,       setSaved]       = useState(false)
  const [intervalStr, setIntervalStr] = useState(String(settings.dashboardRefreshInterval))
  const [intervalSaved, setIntervalSaved] = useState(false)

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
        </Card>

        {/* API Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Key className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm md:text-base">API Configuration</CardTitle>
                <CardDescription className="hidden sm:block">Endpoint and authentication</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sentinel API URL
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
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                API Token
              </label>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Bearer token"
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
            />
            <ToggleRow
              label="Desktop Notifications"
              description="Show notifications for alerts"
              enabled={settings.showDesktopNotifications}
              onToggle={() => updateSettings({ showDesktopNotifications: !settings.showDesktopNotifications })}
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Refresh Interval (seconds)
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
      </div>
    </AppShell>
  )
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
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
        <p className="text-sm font-medium">{label}</p>
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