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
  const [url, setUrl] = useState(settings.sentinelUrl)
  const [token, setToken] = useState(settings.sentinelToken)
  const [saved, setSaved] = useState(false)

  // Local state for the refresh-interval input so backspace doesn't fight React.
  // We only commit a valid value to context on blur.
  const [intervalStr, setIntervalStr] = useState(String(settings.dashboardRefreshInterval))

  const handleSave = () => {
    updateSettings({ sentinelUrl: url, sentinelToken: token })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleIntervalBlur = () => {
    const parsed = parseInt(intervalStr, 10)
    if (!isNaN(parsed) && parsed >= 5 && parsed <= 300) {
      updateSettings({ dashboardRefreshInterval: parsed })
    } else {
      // Revert to the last valid value
      setIntervalStr(String(settings.dashboardRefreshInterval))
    }
  }

  return (
    <AppShell>
      <Header title="Settings" description="Configure your Sentinel connection and preferences" />

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Server className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Connection Status</CardTitle>
                  <CardDescription>Current status of your Sentinel API connection</CardDescription>
                </div>
              </div>
              <Badge variant={connected ? "success" : "destructive"}>
                {connected ? (
                  <><CheckCircle className="mr-1 h-3 w-3" /> Connected</>
                ) : (
                  <><XCircle className="mr-1 h-3 w-3" /> Disconnected</>
                )}
              </Badge>
            </div>
          </CardHeader>
          {connected && status && (
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Uptime",   value: status.uptimeFormatted },
                  { label: "Events",   value: status.eventCount.toLocaleString() },
                  { label: "Targets",  value: status.activeTargets },
                  { label: "Database", value: `${status.dbSizeMB} MB` },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-lg font-semibold">{s.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Key className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>Configure your Sentinel API endpoint and authentication</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sentinel API URL
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:48923"
              />
              <p className="text-[11px] text-muted-foreground">The URL of your Sentinel selfbot API server</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                API Token
              </label>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your bearer token"
              />
              <p className="text-[11px] text-muted-foreground">Bearer token for API authentication</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave}>
                {saved ? <><CheckCircle className="mr-2 h-4 w-4" /> Saved</> : "Save Configuration"}
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconnect
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Zap className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your Sentinel dashboard experience</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SSE toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Real-time Updates (SSE)</p>
                <p className="text-xs text-muted-foreground">Enable live event streaming from the API</p>
              </div>
              <button
                onClick={() => updateSettings({ enableSSE: !settings.enableSSE })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.enableSSE ? "bg-primary" : "bg-secondary"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.enableSSE ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Notifications toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Desktop Notifications</p>
                <p className="text-xs text-muted-foreground">Show notifications for alerts</p>
              </div>
              <button
                onClick={() =>
                  updateSettings({ showDesktopNotifications: !settings.showDesktopNotifications })
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.showDesktopNotifications ? "bg-primary" : "bg-secondary"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    settings.showDesktopNotifications ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Refresh interval — fixed input: local string state, commit on blur */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Refresh Interval (seconds)
              </label>
              <Input
                type="number"
                min={5}
                max={300}
                value={intervalStr}
                onChange={(e) => setIntervalStr(e.target.value)}
                onBlur={handleIntervalBlur}
              />
              <p className="text-[11px] text-muted-foreground">
                How often to poll target statuses (5 – 300 s). Press Tab or click away to save.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}