/* components/layout/app-shell.tsx */
"use client"

import { Sidebar } from "./sidebar"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-60">
        {children}
      </main>
    </div>
  )
}
