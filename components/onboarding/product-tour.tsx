/* components/onboarding/product-tour.tsx */
"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const LS_KEY = "sentinel_tour_v1_done"

interface TourStep {
  title: string
  body: string
  highlight?: string // CSS selector to highlight
  position?: "center" | "top" | "bottom"
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Sentinel! 👋",
    body: "This quick tour covers the main features. You can dismiss it anytime and re-run it from Settings.",
    position: "center",
  },
  {
    title: "Dashboard",
    body: "The Dashboard shows all your tracked targets at a glance, with live status indicators and a real-time event feed.",
    position: "center",
  },
  {
    title: "Targets",
    body: "Each target is a Discord user you're monitoring. Click a target card to dive into their detailed analytics, timeline, messages, and insights.",
    position: "center",
  },
  {
    title: "Live Feed",
    body: "The live feed on the right updates in real-time via Server-Sent Events (SSE). Every status change, message, or activity appears here instantly.",
    position: "center",
  },
  {
    title: "Analytics",
    body: "Inside each target's page you'll find Presence analytics, Gaming profiles, Music listening habits, Voice call data, Social graphs, and Heatmaps.",
    position: "center",
  },
  {
    title: "Insights & Sleep Schedule",
    body: "Sentinel automatically detects sleep patterns, daily routines, anomalies, and behavioral changes from collected data.",
    position: "center",
  },
  {
    title: "Alerts",
    body: "Set up alert rules to get notified when a target comes online, starts a game, sends a message, ghost-types, and more.",
    position: "center",
  },
  {
    title: "You're all set! 🚀",
    body: "Add your first target from the Dashboard to start collecting data. The more data collected over time, the richer the insights become.",
    position: "center",
  },
]

interface ProductTourProps {
  forceShow?: boolean
  onComplete?: () => void
}

export function ProductTour({ forceShow, onComplete }: ProductTourProps) {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (forceShow) {
      setShow(true)
      setStep(0)
      return
    }
    try {
      const done = localStorage.getItem(LS_KEY)
      if (!done) {
        // Delay slightly so page renders first
        const t = setTimeout(() => setShow(true), 1500)
        return () => clearTimeout(t)
      }
    } catch { /* ignore */ }
  }, [forceShow])

  const complete = useCallback(() => {
    try { localStorage.setItem(LS_KEY, "1") } catch { /* ignore */ }
    setShow(false)
    onComplete?.()
  }, [onComplete])

  if (!show) return null

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1
  const isFirst = step === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      {/* Tour card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl animate-slide-up overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Close */}
        <button
          onClick={complete}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Step counter */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {step + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <h2 className="mb-2 text-lg font-bold">{current.title}</h2>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">{current.body}</p>

          {/* Dot indicators */}
          <div className="mb-4 flex justify-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === step ? "bg-primary w-4" : "bg-border w-1.5 hover:bg-muted-foreground"
                )}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button
              onClick={isLast ? complete : () => setStep(step + 1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              {isLast ? "Done!" : "Next"}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

          <button
            onClick={complete}
            className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook to re-trigger the tour from anywhere (e.g. Settings page)
export function useTour() {
  const reset = () => {
    try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
  }
  return { reset }
}
