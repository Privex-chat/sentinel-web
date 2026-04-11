/* components/onboarding/env-builder.tsx */
"use client"

import { useState } from "react"
import { Copy, Check, Eye, EyeOff } from "lucide-react"

type DeployMethod = "local" | "vps" | "railway"

interface EnvBuilderProps {
  method: DeployMethod
  apiToken: string
  discordToken: string
}

export function EnvBuilder({ method, apiToken, discordToken }: EnvBuilderProps) {
  const [copied, setCopied] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)

  const mask = (val: string, placeholder: string) => {
    if (!val) return placeholder
    if (!showSecrets) return val.slice(0, 6) + "…" + val.slice(-4)
    return val
  }

  const raw = (val: string, placeholder: string) => val || placeholder

  const localEnv = `DISCORD_TOKEN=${raw(discordToken, "YOUR_DISCORD_TOKEN_HERE")}
API_PORT=48923
API_AUTH_TOKEN=${raw(apiToken, "YOUR_GENERATED_TOKEN_HERE")}
DB_PATH=./data/sentinel.db
LOG_LEVEL=info
PROFILE_POLL_INTERVAL_MS=300000
STATUS_POLL_INTERVAL_MS=120000
DAILY_SUMMARY_INTERVAL_MS=3600000
RANDOM_JITTER=true
DB_MODE=local`

  const vpsEnv = `DISCORD_TOKEN=${raw(discordToken, "YOUR_DISCORD_TOKEN_HERE")}
API_PORT=48923
API_AUTH_TOKEN=${raw(apiToken, "YOUR_GENERATED_TOKEN_HERE")}
DB_PATH=./data/sentinel.db
LOG_LEVEL=info
PROFILE_POLL_INTERVAL_MS=300000
STATUS_POLL_INTERVAL_MS=120000
DAILY_SUMMARY_INTERVAL_MS=3600000
RANDOM_JITTER=true
DB_MODE=local`

  const railwayEnv = `DISCORD_TOKEN=${raw(discordToken, "YOUR_DISCORD_TOKEN_HERE")}
API_PORT=48923
API_AUTH_TOKEN=${raw(apiToken, "YOUR_GENERATED_TOKEN_HERE")}
DB_PATH=/data/sentinel.db
LOG_LEVEL=info
PROFILE_POLL_INTERVAL_MS=300000
STATUS_POLL_INTERVAL_MS=120000
DAILY_SUMMARY_INTERVAL_MS=3600000
RANDOM_JITTER=true
DB_MODE=cloud
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SYNC_INTERVAL_MS=30000`

  const envContent = method === "local" ? localEnv : method === "vps" ? vpsEnv : railwayEnv

  // Display version (masked)
  const displayContent = envContent
    .replace(raw(discordToken, ""), discordToken ? mask(discordToken, "") : "YOUR_DISCORD_TOKEN_HERE")
    .replace(raw(apiToken, ""), apiToken ? mask(apiToken, "") : "YOUR_GENERATED_TOKEN_HERE")

  const copy = () => {
    navigator.clipboard.writeText(envContent).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const fields: { key: string; value: string; desc: string; secret?: boolean }[] = [
    {
      key: "DISCORD_TOKEN",
      value: discordToken ? mask(discordToken, "—") : "Not set yet",
      desc: "Your dedicated Discord account token",
      secret: true,
    },
    {
      key: "API_AUTH_TOKEN",
      value: apiToken ? mask(apiToken, "—") : "Not set yet",
      desc: "Your generated API password",
      secret: true,
    },
    {
      key: "DB_MODE",
      value: method === "railway" ? "cloud" : "local",
      desc: method === "railway" ? "Sync all data to Supabase (Railway has ephemeral storage)" : "Store data locally in SQLite",
    },
    ...(method === "railway"
      ? [
          { key: "SUPABASE_URL", value: "Your Supabase project URL", desc: "From Supabase → Settings → API" },
          { key: "SUPABASE_SERVICE_KEY", value: "Your service_role key", desc: "From Supabase → Settings → API → service_role", secret: true },
          { key: "SUPABASE_SYNC_INTERVAL_MS", value: "30000", desc: "Sync every 30s (limits data loss on container restart)" },
        ]
      : []),
    { key: "DB_PATH", value: method === "railway" ? "/data/sentinel.db" : "./data/sentinel.db", desc: "Where the local SQLite file is stored" },
    { key: "API_PORT", value: "48923", desc: "The port the API listens on" },
    { key: "RANDOM_JITTER", value: "true", desc: "Adds random timing variation to polling — helps avoid detection" },
  ]

  return (
    <div className="space-y-4">
      {/* Field table */}
      <div className="rounded-xl border border-border bg-secondary/20 overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Environment Variables</h4>
          <button
            onClick={() => setShowSecrets((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSecrets ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showSecrets ? "Hide secrets" : "Reveal secrets"}
          </button>
        </div>
        <div className="divide-y divide-border">
          {fields.map((f) => (
            <div key={f.key} className="grid grid-cols-[auto_1fr] gap-x-4 px-4 py-3 text-xs hover:bg-secondary/30 transition-colors">
              <code className="font-mono font-bold text-primary text-[11px] self-start mt-0.5">{f.key}</code>
              <div>
                <div className="font-mono text-foreground/90 mb-0.5 truncate" title={showSecrets && f.secret ? f.value : undefined}>
                  {f.secret && !showSecrets
                    ? <span className="text-muted-foreground text-[10px]">●●●●●●●● (click &apos;Reveal secrets&apos; to see)</span>
                    : f.value}
                </div>
                <div className="text-muted-foreground/70">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw .env block */}
      <div className="relative rounded-xl border border-border bg-[oklch(0.12_0_0)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">.env</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSecrets((v) => !v)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSecrets ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-status-online" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy all"}
            </button>
          </div>
        </div>
        <pre className="overflow-x-auto p-4 text-[11px] leading-relaxed text-foreground/80 scrollbar-none">
          {showSecrets ? envContent : displayContent}
        </pre>
      </div>

      {!discordToken && (
        <p className="text-[11px] text-status-idle flex items-center gap-1.5">
          ⚠ You haven&apos;t entered your Discord token yet. The env file above shows a placeholder — replace it before running.
        </p>
      )}
    </div>
  )
}
