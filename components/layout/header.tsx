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
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
            {title}
          </h1>
          {description && (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
          {/* Desktop-only stats */}
          {status && connected && (
            <div className="hidden items-center gap-5 text-xs text-muted-foreground lg:flex">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                <span>{formatNumber(status.eventCount)} events</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                <span>{status.dbSizeMB} MB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                <span>{status.uptimeFormatted}</span>
              </div>
            </div>
          )}

          {/* Actions — always visible */}
          {actions && <div className="flex items-center">{actions}</div>}
        </div>
      </div>
    </header>
  )
}