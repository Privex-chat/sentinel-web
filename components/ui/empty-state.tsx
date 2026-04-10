/* components/ui/empty-state.tsx */
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  message: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-secondary p-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      {title && <h3 className="mb-1 text-sm font-medium">{title}</h3>}
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
