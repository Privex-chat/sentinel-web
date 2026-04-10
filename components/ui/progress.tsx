/* components/ui/progress.tsx */
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export function Progress({
  value,
  max = 100,
  size = "md",
  color = "bg-accent",
  showLabel = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-foreground">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-muted", sizeClasses[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-300", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface SegmentedProgressProps {
  segments: Array<{ value: number; color: string; label?: string }>;
  total: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SegmentedProgress({
  segments,
  total,
  size = "md",
  className,
}: SegmentedProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex w-full overflow-hidden rounded-full bg-muted", sizeClasses[size])}>
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          return (
            <div
              key={index}
              className={cn("h-full transition-all duration-300", segment.color)}
              style={{ width: `${percentage}%` }}
              title={segment.label}
            />
          );
        })}
      </div>
    </div>
  );
}
