/* components/ui/timezone-select.tsx */
"use client"

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import { createPortal } from "react-dom"
import { TIMEZONES } from "@/lib/timezones"
import { cn } from "@/lib/utils"
import { ChevronDown, Search, Check } from "lucide-react"

interface TimezoneSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  /** @deprecated — use `compact` instead of raw class overrides */
  inputClassName?: string
  placeholder?: string
  disabled?: boolean
  /** When true, renders a smaller trigger suitable for inline card editing. */
  compact?: boolean
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

/* ── helpers ────────────────────────────────────────────────────────────────── */

function getRegion(value: string): string {
  if (value === "UTC" || value === "GMT") return "Universal"
  const prefix = value.split("/")[0]
  switch (prefix) {
    case "America":  return "Americas"
    case "Europe":   return "Europe"
    case "Asia":     return "Asia"
    case "Africa":   return "Africa"
    case "Pacific":  return "Pacific"
    case "Australia": return "Australia"
    case "Atlantic": return "Atlantic"
    case "Indian":   return "Indian Ocean"
    default:         return "Other"
  }
}

/* ── component ──────────────────────────────────────────────────────────────── */

export function TimezoneSelect({
  value,
  onChange,
  className,
  inputClassName,
  placeholder = "Search timezones…",
  disabled,
  compact = false,
  onKeyDown: externalOnKeyDown,
}: TimezoneSelectProps) {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [activeIndex, setActiveIndex] = useState(-1)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  // Auto-detect compact when legacy inputClassName contains compact sizing
  const isCompact = compact || (inputClassName?.includes("h-5") || inputClassName?.includes("h-6")) || false

  // ── filtering & grouping ──────────────────────────────────────────────────
  const filtered = search.trim()
    ? TIMEZONES.filter((tz) => {
        const q = search.toLowerCase()
        return tz.value.toLowerCase().includes(q) || tz.label.toLowerCase().includes(q)
      })
    : TIMEZONES

  const grouped = filtered.reduce<Record<string, typeof TIMEZONES>>((acc, tz) => {
    const region = getRegion(tz.value)
    if (!acc[region]) acc[region] = []
    acc[region].push(tz)
    return acc
  }, {})

  const flatItems: typeof TIMEZONES = []
  for (const region of Object.keys(grouped)) {
    flatItems.push(...grouped[region])
  }

  // ── position the portal dropdown ─────────────────────────────────────────
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 300),
    })
  }, [])

  // ── open / close lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return

    updatePosition()

    // Reposition on scroll / resize
    const reposition = () => updatePosition()
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)

    // Click-outside closes
    const handleMouseDown = (e: globalThis.MouseEvent) => {
      if (
        containerRef.current?.contains(e.target as Node) ||
        listRef.current?.contains(e.target as Node)
      ) {
        return
      }
      setOpen(false)
      setSearch("")
    }
    document.addEventListener("mousedown", handleMouseDown)

    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
      document.removeEventListener("mousedown", handleMouseDown)
    }
  }, [open, updatePosition])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0) {
      itemRefs.current.get(activeIndex)?.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex])

  // Reset active index on search change
  useEffect(() => { setActiveIndex(-1) }, [search])

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (tzValue: string) => {
      onChange(tzValue)
      setOpen(false)
      setSearch("")
      setActiveIndex(-1)
    },
    [onChange],
  )

  const openDropdown = useCallback(() => {
    if (disabled) return
    setOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [disabled])

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault()
        openDropdown()
        return
      }
      externalOnKeyDown?.(e)
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && flatItems[activeIndex]) {
          handleSelect(flatItems[activeIndex].value)
        } else if (flatItems.length === 1) {
          handleSelect(flatItems[0].value)
        }
        break
      case "Escape":
        e.preventDefault()
        setOpen(false)
        setSearch("")
        externalOnKeyDown?.(e)
        break
      case "Tab":
        setOpen(false)
        setSearch("")
        break
    }
  }

  const stopPropagation = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // ── render ────────────────────────────────────────────────────────────────
  const displayText = value || ""

  const dropdown =
    open && dropdownPos
      ? createPortal(
          <div
            ref={listRef}
            role="listbox"
            id={`tz-listbox-${uid}`}
            onMouseDown={(e) => {
              // Prevent the portal click from reaching the document mousedown handler
              // and from blurring the input
              e.preventDefault()
              e.stopPropagation()
            }}
            className={cn(
              "fixed z-[9999] max-h-[260px] overflow-y-auto",
              "rounded-lg border border-border bg-popover text-popover-foreground",
              "shadow-xl shadow-black/40",
              "animate-fade-in",
            )}
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
            }}
          >
            {flatItems.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                No timezones match &ldquo;
                <span className="text-foreground font-medium">{search}</span>
                &rdquo;
              </div>
            ) : (
              (() => {
                let globalIdx = 0
                return Object.entries(grouped).map(([region, tzs]) => (
                  <div key={region}>
                    {/* Region header */}
                    <div className="sticky top-0 z-10 bg-popover/95 backdrop-blur-sm border-b border-border/50 px-3 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {region}
                      </span>
                    </div>

                    {/* Timezone items */}
                    {tzs.map((tz) => {
                      const idx = globalIdx++
                      const isActive = idx === activeIndex
                      const isSelected = tz.value === value

                      const dashIdx = tz.label.indexOf("—")
                      const shortLabel = dashIdx >= 0 ? tz.label.slice(dashIdx + 2) : ""

                      return (
                        <button
                          key={tz.value}
                          ref={(el) => {
                            if (el) itemRefs.current.set(idx, el)
                            else itemRefs.current.delete(idx)
                          }}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSelect(tz.value)
                          }}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors",
                            isActive && "bg-secondary",
                            isSelected && !isActive && "bg-primary/10",
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                "font-medium truncate",
                                isSelected ? "text-primary" : "text-foreground",
                              )}
                            >
                              {tz.value}
                            </div>
                            {shortLabel && (
                              <div className="text-[10px] text-muted-foreground truncate">
                                {shortLabel}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              })()
            )}
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? `tz-listbox-${uid}` : undefined}
        tabIndex={open ? -1 : 0}
        onClick={(e) => {
          stopPropagation(e)
          openDropdown()
        }}
        onKeyDown={(e) => {
          if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
            e.preventDefault()
            e.stopPropagation()
            openDropdown()
          }
        }}
        className={cn(
          // Base
          "flex items-center gap-1.5 w-full border bg-input text-foreground cursor-pointer",
          "transition-colors select-none",
          // Focus ring
          open
            ? "border-accent ring-1 ring-accent"
            : "border-border hover:border-muted-foreground/40",
          // Disabled
          disabled && "cursor-not-allowed opacity-50 pointer-events-none",
          // Size variants
          isCompact
            ? "rounded-md h-6 px-2 text-[10px]"
            : "rounded-lg px-3 py-2 text-sm",
        )}
      >
        {open ? (
          <>
            <Search className={cn("flex-shrink-0 text-muted-foreground", isCompact ? "h-2.5 w-2.5" : "h-3.5 w-3.5")} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={stopPropagation}
              onKeyDown={handleInputKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "flex-1 min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none",
                isCompact ? "text-[10px]" : "text-sm",
              )}
            />
          </>
        ) : (
          <>
            <span
              className={cn(
                "flex-1 truncate",
                displayText ? "text-foreground" : "text-muted-foreground",
                isCompact ? "text-[10px]" : "text-sm",
              )}
            >
              {displayText || placeholder}
            </span>
            <ChevronDown className={cn("flex-shrink-0 text-muted-foreground", isCompact ? "h-2.5 w-2.5" : "h-3 w-3")} />
          </>
        )}
      </div>

      {dropdown}
    </div>
  )
}
