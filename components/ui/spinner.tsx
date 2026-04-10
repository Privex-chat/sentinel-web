"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 24, className }: SpinnerProps) {
  return (
    <div
      className={cn("flex items-center justify-center p-4", className)}
      suppressHydrationWarning
    >
      <Loader2
        className="animate-spin text-muted-foreground"
        style={{ width: size, height: size }}
      />
    </div>
  )
}