/* components/ui/switch.tsx */
"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn("inline-flex cursor-pointer items-center gap-3", className)}
      >
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            ref={ref}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-5 w-9 rounded-full bg-muted transition-colors",
              "peer-checked:bg-accent peer-focus:ring-2 peer-focus:ring-accent/20",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            )}
          />
          <div
            className={cn(
              "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-foreground transition-transform",
              "peer-checked:translate-x-4"
            )}
          />
        </div>
        {label && <span className="text-sm text-foreground">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = "Switch";
