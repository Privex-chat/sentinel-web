/* app/targets/[userId]/page.tsx */
"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { useApi } from "@/lib/hooks"
import { api } from "@/lib/api"
import { useSentinel } from "@/lib/context"
import { formatRelative, formatMs } from "@/lib/utils"
import { EVENT_COLORS, EVENT_LABELS } from "@/lib/types"
import {
  Activity,
  Gamepad2,
  Music,
  Mic,
  AlertTriangle,
  Clock,
  MessageSquare,
  Ghost,
  Trash2,
  Edit,
} from "lucide-react"

export default function TargetOverviewPage() {
  const params = useParams()
  const userId = params.userId as string
  const { targetStatuses, targets, cacheVersion, settings } = useSentinel()

  const status = targetStatuses[userId]
  const target = targets.find((t) => t.user_id === userId)

  const { data: timeline } = useApi(
    () => api.getTimeline(userId, { limit: "15" }),
    [userId, cacheVersion, settings.sentinelToken],
    !!settings.sentinelToken
  )
  const { data: daily } = useApi(
    () => api.getDailySummaries(userId, 1),
    [userId, cacheVersion, settings.sentinelToken],
    !!settings.sentinelToken
  )
  const { data: anomalies } = useApi(
    () => api.getAnomalies(userId),
    [userId, settings.sentinelToken],
    !!settings.sentinelToken
  )

  const presence        = status?.presence
  const activities      = status?.activities || []
  const voiceState      = status?.voiceState
  const todaySummary    = daily?.[0]
  const recentEvents    = timeline?.events || []
  const recentAnomalies = (anomalies || []).slice(0, 3)

  const gamingActivity    = activities.find((a) => a.type === 0)
  const spotifyActivity   = activities.find((a) => a.type === 2)
  const streamingActivity = activities.find((a) => a.type === 1)
  const customStatus      = activities.find((a) => a.type === 4)

  const todayActiveMinutes = todaySummary
    ? (todaySummary.total_active_minutes ??
        (todaySummary.online_minutes + todaySummary.idle_minutes + todaySummary.dnd_minutes))
    : 0

  return (
    <div className="space-y-5">
      {/* Custom status */}
      {customStatus?.state && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm italic text-muted-foreground">
          &quot;{customStatus.state}&quot;
        </div>
      )}

      {/* Live activity */}
      {(gamingActivity || spotifyActivity || streamingActivity || voiceState) && (
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-online opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-status-online" />
              </span>
              Right Now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            {gamingActivity && (
              <ActivityTile
                icon={<Gamepad2 className="h-4 w-4" style={{ color: "var(--color-chart-1)" }} />}
                title={gamingActivity.name}
                sub={[gamingActivity.details, gamingActivity.state].filter(Boolean).join(" · ")}
                accent="var(--color-chart-1)"
              />
            )}
            {spotifyActivity && (
              <ActivityTile
                icon={<Music className="h-4 w-4" style={{ color: "var(--color-spotify)" }} />}
                title={spotifyActivity.details || "Spotify"}
                sub={spotifyActivity.state ? `by ${spotifyActivity.state}` : undefined}
                accent="var(--color-spotify)"
              />
            )}
            {streamingActivity && (
              <ActivityTile
                icon={<Activity className="h-4 w-4" style={{ color: "var(--color-chart-4)" }} />}
                title={streamingActivity.name}
                sub={streamingActivity.details}
                accent="var(--color-chart-4)"
              />
            )}
            {voiceState && (
              <ActivityTile
                icon={<Mic className="h-4 w-4" style={{ color: "var(--color-status-online)" }} />}
                title="In Voice Channel"
                sub={[
                  voiceState.streaming && "Streaming",
                  voiceState.selfMute   && "Muted",
                  voiceState.selfDeaf   && "Deafened",
                ].filter(Boolean).join(" · ") || "Active"}
                accent="var(--color-status-online)"
              />
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Today's stats */}
        {todaySummary && (
          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Today — {todaySummary.date}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-4 gap-2">
                <StatCard value={`${todayActiveMinutes}m`}           label="Active"   color="var(--color-status-online)"  icon={Activity}     />
                <StatCard value={todaySummary.message_count}          label="Messages" color="var(--color-chart-3)"        icon={MessageSquare}/>
                <StatCard value={todaySummary.ghost_type_count}       label="Ghosts"   color="var(--color-chart-4)"        icon={Ghost}        />
                <StatCard value={todaySummary.delete_count}           label="Deleted"  color="var(--color-destructive)"    icon={Trash2}       />
                <StatCard value={`${todaySummary.voice_minutes}m`}    label="Voice"    color="var(--color-chart-1)"        icon={Mic}          />
                <StatCard value={todaySummary.edit_count}             label="Edited"   color="var(--color-chart-3)"        icon={Edit}         />
                <StatCard
                  value={
                    todaySummary.first_seen
                      ? new Date(todaySummary.first_seen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "—"
                  }
                  label="First Seen"
                  color="var(--color-muted-foreground)"
                  icon={Clock}
                />
                <StatCard value={todaySummary.reaction_count} label="Reactions" color="var(--color-chart-3)" icon={Activity} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Anomalies */}
        {recentAnomalies.length > 0 && (
          <Card className="border-destructive/25">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Active Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
              {recentAnomalies.map((a, i) => (
                <AnomalyRow key={i} a={a} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent activity timeline */}
      {recentEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-0.5 max-h-[320px] overflow-y-auto pr-1">
              {recentEvents.map((event, i) => {
                const color = EVENT_COLORS[event.event_type] || "var(--color-muted-foreground)"
                const label = EVENT_LABELS[event.event_type] || event.event_type
                let detail  = ""
                try {
                  const d = typeof event.data === "string" ? JSON.parse(event.data) : event.data
                  if (d.newStatus)  detail = `${d.oldStatus || "?"} → ${d.newStatus}`
                  else if (d.name)  detail = d.name
                  else if (d.changes) detail = Array.isArray(d.changes) ? d.changes.slice(0, 2).join(", ") : String(d.changes)
                  else if (d.song)  detail = `${d.song} · ${d.artist}`
                } catch { /* ignore */ }

                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary/40"
                  >
                    <div
                      className="h-7 w-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide border"
                          style={{ backgroundColor: `${color}18`, color, borderColor: `${color}30` }}
                        >
                          {label}
                        </span>
                        {detail && (
                          <span className="truncate text-xs text-muted-foreground">{detail}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatRelative(event.timestamp)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {target?.notes && (
        <Card className="border-chart-1/20">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{target.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function ActivityTile({
  icon, title, sub, accent,
}: {
  icon: React.ReactNode
  title: string
  sub?: string
  accent: string
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5"
      style={{
        backgroundColor: `${accent}12`,
        border: `1px solid ${accent}25`,
      }}
    >
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accent}20` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

function StatCard({
  value, label, color, icon: Icon,
}: {
  value: string | number
  label: string
  color: string
  icon: React.ElementType
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl p-2.5 text-center"
      style={{ backgroundColor: `${color}10`, border: `1px solid ${color}20` }}
    >
      <Icon className="mb-1 h-3.5 w-3.5 opacity-70" style={{ color }} />
      <p className="text-sm font-bold leading-none" style={{ color }}>{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}

function AnomalyRow({ a }: { a: { severity: string; type: string; description: string; timestamp: number } }) {
  const severityColor =
    a.severity === "high"   ? "var(--color-destructive)" :
    a.severity === "medium" ? "var(--color-status-idle)" :
                              "var(--color-muted-foreground)"
  const variant =
    a.severity === "high"   ? "destructive" :
    a.severity === "medium" ? "warning"     : "secondary"

  return (
    <div className="flex items-start gap-3 rounded-lg bg-secondary/50 px-3 py-2">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: severityColor }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={variant as "destructive" | "warning" | "secondary"}>{a.severity}</Badge>
          <span className="text-[10px] text-muted-foreground">{a.type}</span>
        </div>
        <p className="mt-1 text-xs">{a.description}</p>
      </div>
      <span className="text-[10px] text-muted-foreground flex-shrink-0">
        {formatRelative(a.timestamp)}
      </span>
    </div>
  )
}