"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { parseTimezone, tzLabel, type ParsedTimezone } from "@/lib/utils"
import { Globe, Check, X, Clock } from "lucide-react"

interface TimezoneModalProps {
  open: boolean
  onClose: () => void
  currentTimezone: string | null
  onSave: (timezone: string | null) => Promise<void>
}

const QUICK_PICKS = [
  { label: "UTC",   value: "UTC" },
  { label: "EST",   value: "America/New_York" },
  { label: "CST",   value: "America/Chicago" },
  { label: "PST",   value: "America/Los_Angeles" },
  { label: "CET",   value: "Europe/Berlin" },
  { label: "EET",   value: "Europe/Bucharest" },
  { label: "MSK",   value: "Europe/Moscow" },
  { label: "IST",   value: "Asia/Kolkata" },
  { label: "JST",   value: "Asia/Tokyo" },
  { label: "AEST",  value: "Australia/Sydney" },
]

export function TimezoneModal({ open, onClose, currentTimezone, onSave }: TimezoneModalProps) {
  const [input, setInput] = useState("")
  const [preview, setPreview] = useState<ParsedTimezone | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setInput(currentTimezone ?? "")
      setError(null)
      setPreview(currentTimezone ? parseTimezone(currentTimezone) : null)
    }
  }, [open, currentTimezone])

  const handleInputChange = (value: string) => {
    setInput(value)
    setError(null)
    if (!value.trim()) {
      setPreview(null)
      return
    }
    const parsed = parseTimezone(value)
    setPreview(parsed)
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setError(null)

    try {
      if (!input.trim()) {
        await onSave(null)
      } else {
        const parsed = parseTimezone(input)
        if (!parsed) {
          setError(`Unrecognized timezone: "${input}"`)
          setSaving(false)
          return
        }
        await onSave(parsed.canonical)
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save timezone")
    } finally {
      setSaving(false)
    }
  }

  const handleQuickPick = async (value: string) => {
    setInput(value)
    setPreview(parseTimezone(value))
    setSaving(true)
    setError(null)
    try {
      await onSave(value)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save timezone")
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(null)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear timezone")
    } finally {
      setSaving(false)
    }
  }

  const currentDisplay = currentTimezone ? `${currentTimezone} (${tzLabel(currentTimezone)})` : "Not set"

  return (
    <Modal open={open} onClose={onClose} title="Set Timezone">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Current: <span className="font-medium text-foreground">{currentDisplay}</span></span>
        </div>

        <div className="space-y-1.5">
          <Input
            placeholder="e.g. EST, UTC+2, GMT-5, Europe/Berlin, Asia/Tokyo, +3"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave() } }}
            className={error ? "border-destructive" : preview ? "border-status-online" : ""}
          />
          {preview && (
            <div className="flex items-center gap-1.5 text-xs text-status-online">
              <Check className="h-3 w-3" />
              <span>{preview.display}</span>
            </div>
          )}
          {input.trim() && !preview && !error && (
            <p className="text-xs text-muted-foreground">
              Try: IANA names (Europe/Berlin), abbreviations (EST, CET), offsets (UTC+2, GMT-5, +3)
            </p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">Quick Pick</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PICKS.map((qp) => (
              <button
                key={qp.value}
                onClick={() => handleQuickPick(qp.value)}
                disabled={saving}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-primary/10 hover:border-primary/50 disabled:opacity-50 ${
                  currentTimezone === qp.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleSave} loading={saving} disabled={!input.trim() && !currentTimezone} className="flex-1">
            <Globe className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>
          {currentTimezone && (
            <Button variant="outline" onClick={handleClear} disabled={saving} className="text-xs">
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
