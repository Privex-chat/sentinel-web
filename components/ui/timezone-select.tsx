/* components/ui/timezone-select.tsx */
"use client"

import { useId } from "react"
import { TIMEZONES } from "@/lib/timezones"
import { cn } from "@/lib/utils"

interface TimezoneSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  inputClassName?: string
  placeholder?: string
  disabled?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function TimezoneSelect({
  value,
  onChange,
  className,
  inputClassName,
  placeholder = "Timezone (e.g. America/New_York)",
  disabled,
  onKeyDown,
}: TimezoneSelectProps) {
  const uid     = useId()
  const listId  = `tz-list-${uid}`

  return (
    <div className={cn("relative", className)}>
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        onKeyDown={onKeyDown}
        className={cn(
          "w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground",
          "transition-colors placeholder:text-muted-foreground",
          "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          inputClassName
        )}
      />
      <datalist id={listId}>
        {TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </datalist>
    </div>
  )
}
