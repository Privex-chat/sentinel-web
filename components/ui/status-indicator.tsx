/* components/ui/status-indicator.tsx */
import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/lib/types";

interface StatusIndicatorProps {
  status: PresenceStatus;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const statusColors: Record<PresenceStatus, string> = {
  online: "bg-status-online",
  idle: "bg-status-idle",
  dnd: "bg-status-dnd",
  offline: "bg-status-offline",
  invisible: ""
};

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function StatusIndicator({
  status,
  size = "md",
  pulse = false,
  className,
}: StatusIndicatorProps) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <span
        className={cn(
          "rounded-full",
          statusColors[status],
          sizeClasses[size]
        )}
      />
      {pulse && status === "online" && (
        <span
          className={cn(
            "absolute inset-0 animate-ping rounded-full opacity-75",
            statusColors[status],
            sizeClasses[size]
          )}
        />
      )}
    </span>
  );
}

export function StatusText({ status }: { status: PresenceStatus }) {
  const labels: Record<PresenceStatus, string> = {
    online: "Online",
    idle: "Idle",
    dnd: "Do Not Disturb",
    offline: "Offline",
    invisible: ""
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <StatusIndicator status={status} size="sm" />
      <span className="text-muted-foreground">{labels[status]}</span>
    </span>
  );
}
