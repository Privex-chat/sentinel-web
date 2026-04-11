/* components/onboarding/welcome-modal.tsx */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Shield, ArrowRight, X, Settings } from "lucide-react"

const LS_KEY = "sentinel_onboarding_dismissed"

export function WelcomeModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(LS_KEY)
      if (!dismissed) setShow(true)
    } catch { /* ignore */ }
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(LS_KEY, "1") } catch { /* ignore */ }
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-slide-up">
        {/* Gradient top bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-chart-5))" }}
        />

        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-7">
          {/* Icon */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h2 className="mb-2 text-center text-2xl font-bold">Welcome to Sentinel</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground leading-relaxed">
            To get started, you need to deploy the Sentinel selfbot API and connect it to this panel.
            The setup guide will walk you through everything — takes about 5 minutes.
          </p>

          <div className="space-y-3">
            <Link
              href="/setup"
              onClick={dismiss}
              className="flex items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-white hover:bg-primary/90 transition-colors group"
            >
              <div>
                <p className="font-semibold">Start Setup Guide</p>
                <p className="text-xs text-white/70 mt-0.5">Deploy the selfbot and connect the panel</p>
              </div>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/settings"
              onClick={dismiss}
              className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3.5 text-foreground hover:bg-secondary transition-colors group"
            >
              <div>
                <p className="font-semibold text-sm">I already have an API</p>
                <p className="text-xs text-muted-foreground mt-0.5">Go straight to Settings to connect</p>
              </div>
              <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </div>

          <button
            onClick={dismiss}
            className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Dismiss — I&apos;ll figure it out myself
          </button>
        </div>
      </div>
    </div>
  )
}
