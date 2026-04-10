/* components/layout/app-shell.tsx */
"use client"

import { Sidebar }   from "./sidebar"
import { MobileNav } from "./mobile-nav"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />

      {/* Mobile bottom nav — only visible on mobile */}
      <MobileNav />

      {/*
        On mobile:  no left padding; add bottom padding so content clears the nav bar
        On desktop: left padding for sidebar
      */}
      <main className="md:pl-60 pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:pb-0">
        {children}
      </main>
    </div>
  )
}