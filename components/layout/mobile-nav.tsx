/* components/layout/mobile-nav.tsx */
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSentinel } from "@/lib/context"
import { LayoutDashboard, Users, Bell, Settings } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/",        icon: LayoutDashboard },
  { name: "Targets",   href: "/targets", icon: Users },
  { name: "Alerts",    href: "/alerts",  icon: Bell },
  { name: "Settings",  href: "/settings",icon: Settings },
]

export function MobileNav() {
  const pathname   = usePathname()
  const { connected } = useSentinel()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
      style={{
        background: "linear-gradient(to top, var(--color-background) 70%, var(--color-background)cc)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {navigation.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors active:scale-95",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
            style={{ minHeight: 56 }}
          >
            {/* Active indicator pill */}
            {isActive && (
              <span
                className="absolute top-1.5 h-0.5 w-8 rounded-full"
                style={{ backgroundColor: "var(--color-primary)" }}
              />
            )}

            {/* Alert badge for connection status on Settings */}
            <span className="relative">
              <item.icon className="h-5 w-5" />
              {item.name === "Settings" && !connected && (
                <span
                  className="absolute -right-1 -top-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: "var(--color-destructive)" }}
                />
              )}
            </span>

            <span
              className={cn(
                "text-[10px] font-medium leading-none tracking-wide",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}