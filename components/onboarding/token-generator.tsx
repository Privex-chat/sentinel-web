/* components/onboarding/token-generator.tsx */
"use client"

import { useState, useCallback } from "react"
import { RefreshCw, Copy, Check, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*"
const CHARSET_SIMPLE = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"

function generate(length = 32, simple = false): string {
  const chars = simple ? CHARSET_SIMPLE : CHARSET
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map((b) => chars[b % chars.length])
    .join("")
}

interface TokenGeneratorProps {
  value: string
  onChange: (v: string) => void
  length?: number
}

export function TokenGenerator({ value, onChange, length = 32 }: TokenGeneratorProps) {
  const [copied, setCopied] = useState(false)

  const regen = useCallback(() => {
    onChange(generate(length, true))
  }, [length, onChange])

  // Auto-generate on first render if empty
  useState(() => {
    if (!value) onChange(generate(length, true))
  })

  const copy = () => {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="flex-1 rounded-lg border border-border bg-[oklch(0.13_0_0)] px-3 py-2.5 font-mono text-sm tracking-wider text-foreground/90 select-all overflow-x-auto scrollbar-none"
          title="Your API Auth Token — click to select all"
        >
          {value || <span className="text-muted-foreground">Click generate…</span>}
        </div>
        <button
          onClick={copy}
          disabled={!value}
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border transition-all",
            copied
              ? "border-status-online/30 bg-status-online/10 text-status-online"
              : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
          )}
          title="Copy token"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
        <button
          onClick={regen}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all"
          title="Generate new token"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-status-online flex-shrink-0" />
        <span>Generated locally in your browser using <code className="text-[10px]">crypto.getRandomValues</code> — never sent anywhere.</span>
      </div>
    </div>
  )
}
