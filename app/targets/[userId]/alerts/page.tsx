/* app/targets/[userId]/alerts/page.tsx */
"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
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
import { Bell, Plus, Trash2, Check } from "lucide-react"

export default function TargetAlertsPage() {
  const params = useParams()
  const userId = params.userId as string
  const { settings } = useSentinel()
  const [newType, setNewType] = useState<string>("COMES_ONLINE")

  const { data: rules, loading: rulesLoading, refetch: refetchRules } = useApi(
    () => api.getAlertRules(),
    [settings.sentinelToken],
    !!settings.sentinelToken
  )

  const { data: history, loading: historyLoading, refetch: refetchHistory } = useApi(
    () => api.getAlertHistory({ limit: "50" }),
    [settings.sentinelToken],
    !!settings.sentinelToken
  )

  const handleCreate = async () => {
    await api.createAlertRule({ targetId: userId, ruleType: newType })
    refetchRules()
  }

  const handleDelete = async (id: number) => {
    await api.deleteAlertRule(id)
    refetchRules()
  }

  const handleAck = async (id: number) => {
    await api.acknowledgeAlert(id)
    refetchHistory()
  }

  const filteredRules = (rules || []).filter((r) => !r.target_id || r.target_id === userId)
  const filteredHistory = (history || []).filter((h) => h.target_id === userId)

  return (
    <Tabs defaultValue="rules">
      <TabsList className="mb-6">
        <TabsTrigger value="rules">Rules</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="rules">
        {/* Create new rule */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Create Alert Rule for This Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="flex-1 h-9 rounded-md border bg-input px-3 text-sm"
              >
                {ALERT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rules list */}
        {rulesLoading ? (
          <Spinner />
        ) : filteredRules.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Alert Rules"
            message="Create an alert rule to get notified about this target's activity."
          />
        ) : (
          <div className="space-y-2">
            {filteredRules.map((rule) => (
              <Card key={rule.id}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                      <Bell className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <Badge variant="destructive">{rule.rule_type.replace(/_/g, " ")}</Badge>
                      {rule.target_id && (
                        <p className="mt-1 text-xs text-muted-foreground font-mono">
                          Target-specific
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(rule.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="history">
        {historyLoading ? (
          <Spinner />
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Alert History"
            message="Alerts for this target will appear here when triggered."
          />
        ) : (
          <div className="space-y-2">
            {filteredHistory.map((alert) => (
              <Card 
                key={alert.id}
                className={`transition-opacity ${alert.acknowledged ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      alert.acknowledged ? "bg-status-online/10" : "bg-destructive/10"
                    }`}>
                      {alert.acknowledged ? (
                        <Check className="h-4 w-4 text-status-online" />
                      ) : (
                        <Bell className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button variant="ghost" size="sm" onClick={() => handleAck(alert.id)}>
                      Acknowledge
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
