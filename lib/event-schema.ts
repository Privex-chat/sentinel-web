/**
 * Re-exports the canonical SSEEvent type and provides a safe Zod-validated
 * parser.  The type is defined once in lib/types.ts to avoid drift between
 * the two definitions that previously existed.
 */
import { z } from "zod"
import type { SSEEvent } from "./types"

export type { SSEEvent }

const SSEEventSchema = z.object({
  timestamp:  z.number(),
  event_type: z.string(),
  target_id:  z.string(),
  data:       z.record(z.string(), z.unknown()).optional().default({}),
})

export function parseSSEEvent(input: unknown): SSEEvent | null {
  const result = SSEEventSchema.safeParse(input)
  if (!result.success) {
    console.warn("Invalid SSE event:", result.error.issues)
    return null
  }
  return result.data as SSEEvent
}