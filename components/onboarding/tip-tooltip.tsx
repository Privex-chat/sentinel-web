/* components/onboarding/tip-tooltip.tsx */
"use client"

import { useState, useRef, useEffect, type ReactNode } from "react"
import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TipTooltipProps {
  content: ReactNode
  side?: "top" | "bottom" | "left" | "right"
  className?: string
  iconSize?: number
}

export function TipTooltip({ content, side = "top", className, iconSize = 14 }: TipTooltipProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setVisible(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [visible])

  const sideClass = {
    top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left:   "right-full top-1/2 -translate-y-1/2 mr-2",
    right:  "left-full top-1/2 -translate-y-1/2 ml-2",
  }[side]

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button
        type="button"
        className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        onClick={() => setVisible((v) => !v)}
        aria-label="Help"
      >
        <HelpCircle style={{ width: iconSize, height: iconSize }} />
      </button>

      {visible && (
        <div
          className={cn(
            "absolute z-50 w-64 rounded-xl border border-border bg-popover p-3 text-xs leading-relaxed text-foreground shadow-xl",
            "animate-fade-in",
            sideClass
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// Inline tour tooltip for specific UI elements
interface TourTipProps {
  title: string
  body: string
  children: ReactNode
  show?: boolean
  onDismiss?: () => void
  side?: "top" | "bottom" | "left" | "right"
}

export function TourTip({ title, body, children, show, onDismiss, side = "bottom" }: TourTipProps) {
  if (!show) return <>{children}</>

  const sideClass = {
    top:    "bottom-full left-0 mb-2",
    bottom: "top-full left-0 mt-2",
    left:   "right-full top-0 mr-2",
    right:  "left-full top-0 ml-2",
  }[side]

  return (
    <div className="relative inline-block">
      {children}
      <div
        className={cn(
          "absolute z-50 w-72 rounded-xl border border-primary/30 bg-card p-4 shadow-xl animate-slide-up",
          sideClass
        )}
      >
        {/* Pointer */}
        <div
          className="absolute h-2.5 w-2.5 rotate-45 border-l border-t border-primary/30 bg-card"
          style={
            side === "bottom" ? { top: -6, left: 12 } :
            side === "top"    ? { bottom: -6, left: 12, rotate: "225deg" } :
            {}
          }
        />
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="font-semibold text-sm text-primary">{title}</p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground text-[10px] underline underline-offset-2"
            >
              Got it
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </div>
  )
}
