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
  User
} from "lucide-react"

const tabs = [
  { name: "Overview", href: "", icon: LayoutDashboard },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Insights", href: "/insights", icon: Brain },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Profile", href: "/profile", icon: User },
]

export default function TargetLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const userId = params.userId as string
  const { targetStatuses, targets } = useSentinel()

  const status = targetStatuses[userId]
  const target = targets.find((t) => t.user_id === userId)
  const presence = status?.presence
  const currentStatus = presence?.status || "offline"

  const basePath = `/targets/${userId}`
  
  const getCurrentTab = () => {
    const path = pathname.replace(basePath, "")
    return path || ""
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="border-b bg-background">
        <div className="flex items-center gap-4 px-6 py-4">
          <Link href="/targets">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          
          <Avatar
            userId={userId}
            avatarHash={status?.profile?.avatar_hash}
            size={44}
            status={currentStatus as "online" | "idle" | "dnd" | "offline"}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold truncate">
                {status?.profile?.global_name || status?.profile?.username || userId}
              </h1>
              {target?.label && <Badge variant="default">{target.label}</Badge>}
              {target?.priority && target.priority >= 2 && <Badge variant="destructive">Critical</Badge>}
            </div>
            <p className="font-mono text-xs text-muted-foreground">{userId}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              currentStatus === "online" && "bg-status-online animate-pulse-dot",
              currentStatus === "idle" && "bg-status-idle",
              currentStatus === "dnd" && "bg-status-dnd",
              currentStatus === "offline" && "bg-status-offline"
            )} />
            <span className="text-sm capitalize text-muted-foreground">{currentStatus}</span>
            {presence?.platform && (
              <span className="text-xs text-muted-foreground/60">({presence.platform})</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = getCurrentTab() === tab.href
            return (
              <Link
                key={tab.name}
                href={`${basePath}${tab.href}`}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">{children}</div>
    </AppShell>
  )
}
