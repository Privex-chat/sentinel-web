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
  const [showAddForm, setShowAddForm]   = useState(false)
  const [searchQuery, setSearchQuery]   = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)

  const filteredTargets = targets.filter((target) => {
    if (!debouncedSearch) return true
    const status = targetStatuses[target.user_id]
    const name   = status?.profile?.global_name || status?.profile?.username || ""
    return (
      target.user_id.includes(debouncedSearch) ||
      name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      target.label?.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  })

  // Show spinner while the initial connection attempt is in flight
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

  if (!settings.sentinelToken || !connected) {
    return (
      <AppShell>
        <Header title="Targets" description="Manage tracked users" />
        <div className="p-4 md:p-6">
          <EmptyState
            icon={AlertTriangle}
            title="Not Connected"
            message="Connect to your Sentinel API in Settings to manage targets."
          />
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
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="h-9 px-3 md:px-4"
          >
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Target</span>
          </Button>
        }
      />

      <div className="p-3 md:p-6 space-y-4">
        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search targets…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-base" /* text-base prevents iOS zoom */
            />
          </div>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredTargets.length}/{targets.length}
          </span>
        </div>

        {/* Add form */}
        {showAddForm && (
          <Card>
            <CardContent className="p-4">
              <AddTargetForm onClose={() => setShowAddForm(false)} />
            </CardContent>
          </Card>
        )}

        {/* Target grid */}
        {filteredTargets.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? "No Results" : "No Targets"}
            message={
              searchQuery
                ? "No targets match your search."
                : "Add your first target to start tracking."
            }
            action={
              !searchQuery && (
                <Button onClick={() => setShowAddForm(true)} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Target
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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