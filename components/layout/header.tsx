/* components/layout/header.tsx */
"use client"

import { useSentinel } from "@/lib/context"
import { formatNumber } from "@/lib/utils"
import { Database, Activity, Zap } from "lucide-react"

interface HeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function Header({ title, description, actions }: HeaderProps) {
  const { status, connected } = useSentinel()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Stats */}
        {status && connected && (
          <div className="hidden items-center gap-6 text-xs text-muted-foreground md:flex">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              <span>{formatNumber(status.eventCount)} events</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5" />
              <span>{status.dbSizeMB} MB</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              <span>{status.uptimeFormatted}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        {actions}
      </div>
    </header>
  )
}
