/* app/alerts/page.tsx */
"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { useApi } from "@/lib/hooks"
import { api } from "@/lib/api"
import { useSentinel } from "@/lib/context"
import { ALERT_TYPES } from "@/lib/types"
import { formatDateTime } from "@/lib/utils"
import { Bell, Plus, Trash2, Check, AlertTriangle } from "lucide-react"

export default function AlertsPage() {
  const { connected, settings } = useSentinel()
  const [newType, setNewType] = useState<string>("COMES_ONLINE")

  const { data: rules,   loading: rulesLoading,   refetch: refetchRules }   = useApi(
    () => api.getAlertRules(),
    [settings.sentinelToken],
    !!settings.sentinelToken
  )
  const { data: history, loading: historyLoading, refetch: refetchHistory } = useApi(
    () => api.getAlertHistory({ limit: "50" }),
    [settings.sentinelToken],
    !!settings.sentinelToken
  )

  const handleCreate = async () => { await api.createAlertRule({ ruleType: newType }); refetchRules() }
  const handleDelete = async (id: number) => { await api.deleteAlertRule(id); refetchRules() }
  const handleAck    = async (id: number) => { await api.acknowledgeAlert(id); refetchHistory() }

  if (!connected) {
    return (
      <AppShell>
        <Header title="Alerts" description="Configure alert rules and view history" />
        <div className="p-4 md:p-6">
          <EmptyState
            icon={AlertTriangle}
            title="Not Connected"
            message="Connect to your Sentinel API in Settings to manage alerts."
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Header
        title="Alerts"
        description="Configure alert rules and view history"
        actions={
          <Button size="sm" onClick={handleCreate} className="h-9 px-3 md:px-4">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Rule</span>
          </Button>
        }
      />

      <div className="p-3 md:p-6">
        <Tabs defaultValue="rules">
          <TabsList className="mb-5">
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            {/* Create rule card */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Create Alert Rule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="flex-1 h-10 rounded-md border bg-input px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {ALERT_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <Button onClick={handleCreate} className="h-10">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {rulesLoading ? (
              <Spinner />
            ) : !rules || rules.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No Alert Rules"
                message="Create your first alert rule to get notified about target activity."
              />
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <Card key={rule.id}>
                    <div className="flex items-center justify-between p-4" style={{ minHeight: 56 }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                          <Bell className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <Badge variant="destructive">{rule.rule_type.replace(/_/g, " ")}</Badge>
                          {rule.target_id && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground font-mono">
                              Target: {rule.target_id.slice(-8)}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Large touch target for delete */}
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors"
                        aria-label="Delete rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {historyLoading ? (
              <Spinner />
            ) : !history || history.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No Alert History"
                message="Alert events will appear here when they are triggered."
              />
            ) : (
              <div className="space-y-2">
                {history.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`transition-opacity ${alert.acknowledged ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3 p-4" style={{ minHeight: 56 }}>
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                          alert.acknowledged ? "bg-status-online/10" : "bg-destructive/10"
                        }`}
                      >
                        {alert.acknowledged
                          ? <Check className="h-4 w-4 text-status-online" />
                          : <Bell  className="h-4 w-4 text-destructive"   />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{alert.message}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDateTime(alert.timestamp)}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAck(alert.id)}
                          className="flex-shrink-0 h-9 px-3"
                        >
                          Ack
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}