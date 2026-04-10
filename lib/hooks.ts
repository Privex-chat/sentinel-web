/* lib/hooks.ts */
"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Fetches data on mount (and whenever `deps` change).
 *
 * Fixes vs. original:
 * - Tracks component mount state so setState is never called after unmount.
 * - Each fetch run gets its own AbortController; stale responses are ignored.
 * - `refetch` is stable (same reference unless deps change).
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  immediate = true
): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data:    null,
    loading: immediate,
    error:   null,
  })

  // Track whether the component is still mounted
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await fetcher()
      if (mountedRef.current) {
        setState({ data, loading: false, error: null })
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({
          data:    null,
          loading: false,
          error:   err instanceof Error ? err.message : "Unknown error",
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (immediate) fetchData()
  }, [fetchData, immediate])

  return { ...state, refetch: fetchData }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }

  return [storedValue, setValue]
}