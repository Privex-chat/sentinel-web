/* components/ui/badge.tsx */
import { cn } from "@/lib/utils"
import { type HTMLAttributes } from "react"

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-secondary",
    outline: "text-foreground",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-status-online/10 text-status-online border-status-online/20",
    warning: "bg-status-idle/10 text-status-idle border-status-idle/20",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
