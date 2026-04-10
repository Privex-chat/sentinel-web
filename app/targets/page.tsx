/* app/targets/page.tsx */
"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Header } from "@/components/layout/header"
import { TargetCard } from "@/components/dashboard/target-card"
import { AddTargetForm } from "@/components/dashboard/add-target-form"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Spinner } from "@/components/ui/spinner"
import { useSentinel } from "@/lib/context"
import { useDebounce } from "@/lib/hooks"
import { Users, Plus, Search, AlertTriangle } from "lucide-react"

export default function TargetsPage() {
  const { targets, targetStatuses, removeTarget, isLoading, connected, settings } = useSentinel()
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Filter targets
  const filteredTargets = targets.filter((target) => {
    if (!debouncedSearch) return true
    const status = targetStatuses[target.user_id]
    const name = status?.profile?.global_name || status?.profile?.username || ""
    return (
      target.user_id.includes(debouncedSearch) ||
      name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      target.label?.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  })

  if (!settings.sentinelToken || !connected) {
    return (
      <AppShell>
        <Header title="Targets" description="Manage tracked users" />
        <div className="p-6">
          <EmptyState
            icon={AlertTriangle}
            title="Not Connected"
            message="Connect to your Sentinel API in Settings to manage targets."
          />
        </div>
      </AppShell>
    )
  }

  if (isLoading) {
    return (
      <AppShell>
        <Header title="Targets" description="Manage tracked users" />
        <div className="flex items-center justify-center p-12">
          <Spinner size={32} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Header 
        title="Targets" 
        description={`${targets.length} users tracked`}
        actions={
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Target
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredTargets.length} of {targets.length} targets
          </span>
        </div>

        {/* Add target form */}
        {showAddForm && (
          <Card className="max-w-md">
            <CardContent className="p-4">
              <AddTargetForm onClose={() => setShowAddForm(false)} />
            </CardContent>
          </Card>
        )}

        {/* Targets grid */}
        {filteredTargets.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? "No Results" : "No Targets"}
            message={
              searchQuery
                ? "No targets match your search criteria."
                : "Add your first target to start tracking their Discord activity."
            }
            action={
              !searchQuery && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Target
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTargets.map((target) => (
              <TargetCard
                key={target.user_id}
                target={target}
                status={targetStatuses[target.user_id]}
                onRemove={() => removeTarget(target.user_id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
