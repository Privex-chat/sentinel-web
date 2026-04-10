/* app/targets/[userId]/layout.tsx */
"use client"

import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSentinel } from "@/lib/context"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  LayoutDashboard,
  Clock,
  BarChart3,
  MessageSquare,
  Brain,
  Bell,
  User,
} from "lucide-react"

const tabs = [
  { name: "Overview",  href: "",          icon: LayoutDashboard },
  { name: "Timeline",  href: "/timeline", icon: Clock },
  { name: "Analytics", href: "/analytics",icon: BarChart3 },
  { name: "Messages",  href: "/messages", icon: MessageSquare },
  { name: "Insights",  href: "/insights", icon: Brain },
  { name: "Alerts",    href: "/alerts",   icon: Bell },
  { name: "Profile",   href: "/profile",  icon: User },
]

export default function TargetLayout({ children }: { children: React.ReactNode }) {
  const params   = useParams()
  const pathname = usePathname()
  const userId   = params.userId as string
  const { targetStatuses, targets } = useSentinel()

  const status       = targetStatuses[userId]
  const target       = targets.find((t) => t.user_id === userId)
  const presence     = status?.presence
  const currentStatus= presence?.status || "offline"
  const basePath     = `/targets/${userId}`

  const getCurrentTab = () => pathname.replace(basePath, "") || ""

  const statusColor =
    currentStatus === "online"  ? "var(--color-status-online)"  :
    currentStatus === "idle"    ? "var(--color-status-idle)"    :
    currentStatus === "dnd"     ? "var(--color-status-dnd)"     :
                                  "var(--color-status-offline)"

  return (
    <AppShell>
      {/* ── Profile header ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b bg-background">
        {/* Top row: back + avatar + name + status */}
        <div className="flex items-center gap-3 px-3 py-3 md:px-6">
          <Link href="/targets" className="flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:h-8 md:w-8"
              aria-label="Back to targets"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <Avatar
            userId={userId}
            avatarHash={status?.profile?.avatar_hash}
            size={40}
            status={currentStatus as "online" | "idle" | "dnd" | "offline"}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="truncate text-sm font-semibold md:text-base">
                {status?.profile?.global_name ||
                  status?.profile?.username ||
                  userId}
              </h1>
              {target?.label && (
                <Badge variant="default">{target.label}</Badge>
              )}
              {target?.priority !== undefined && target.priority >= 2 && (
                <Badge variant="destructive">Critical</Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              />
              <p className="font-mono text-[10px] text-muted-foreground truncate">
                <span className="capitalize hidden sm:inline">{currentStatus} · </span>
                {userId}
              </p>
            </div>
          </div>
        </div>

        {/* ── Horizontally scrollable tab bar ───────────────────────── */}
        <div
          className="flex overflow-x-auto px-2 md:px-4 scrollbar-none"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {tabs.map((tab) => {
            const isActive = getCurrentTab() === tab.href
            return (
              <Link
                key={tab.name}
                href={`${basePath}${tab.href}`}
                className={cn(
                  "relative flex flex-shrink-0 items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors whitespace-nowrap",
                  "md:text-sm md:px-4",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                // Minimum 44px height for touch
                style={{ minHeight: 44 }}
              >
                <tab.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>{tab.name}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Page content */}
      <div className="p-3 md:p-6">{children}</div>
    </AppShell>
  )
}