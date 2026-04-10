/* app/page.tsx */
"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Header } from "@/components/layout/header"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { TargetCard } from "@/components/dashboard/target-card"
import { LiveFeed } from "@/components/dashboard/live-feed"
import { AddTargetForm } from "@/components/dashboard/add-target-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Spinner } from "@/components/ui/spinner"
import { useSentinel } from "@/lib/context"
import { Users, Plus, Settings, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { 
    targets, 
    targetStatuses, 
    recentEvents, 
    removeTarget, 
    isLoading, 
    connected,
    settings 
  } = useSentinel()
  const [showAddForm, setShowAddForm] = useState(false)

  // Not configured
  if (!settings.sentinelToken) {
    return (
      <AppShell>
        <Header title="Dashboard" />
        <div className="p-6">
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-6">
              <EmptyState
                icon={Settings}
                title="Configuration Required"
                message="Set up your Sentinel API connection in Settings to start tracking targets."
                action={
                  <Button asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Go to Settings
                    </Link>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <AppShell>
        <Header title="Dashboard" />
        <div className="flex items-center justify-center p-12">
          <Spinner size={32} />
        </div>
      </AppShell>
    )
  }

  // Not connected
  if (!connected) {
    return (
      <AppShell>
        <Header title="Dashboard" />
        <div className="p-6">
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-6">
              <EmptyState
                icon={AlertTriangle}
                title="Connection Failed"
                message="Unable to connect to your Sentinel API. Check your settings and ensure the server is running."
                action={
                  <div className="flex gap-2">
                    <Button asChild variant="outline">
                      <Link href="/settings">Check Settings</Link>
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      Retry Connection
                    </Button>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Header 
        title="Dashboard" 
        description="Monitor all tracked targets"
        actions={
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Target
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <StatsOverview />

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Targets section */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Targets ({targets.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {/* Add target form */}
                {showAddForm && (
                  <div className="mb-4">
                    <AddTargetForm onClose={() => setShowAddForm(false)} />
                  </div>
                )}

                {/* Targets grid */}
                {targets.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No Targets"
                    message="Add your first target to start tracking their Discord activity."
                    action={
                      <Button onClick={() => setShowAddForm(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Target
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {targets.map((target) => (
                      <TargetCard
                        key={target.user_id}
                        target={target}
                        status={targetStatuses[target.user_id]}
                        onRemove={() => removeTarget(target.user_id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live feed section */}
          <div>
            <LiveFeed events={recentEvents} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
