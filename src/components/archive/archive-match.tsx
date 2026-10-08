"use client"

import { Check } from "lucide-react"
import type { MatchedRecord } from "@/lib/matching"
import { cn } from "@/lib/utils"

/**
 * Plain-language context for retrieved records. Ranking remains internal;
 * the public interface presents market/phase reasoning without scores.
 */

export function WhyItMatches({ record, className }: { record: MatchedRecord; className?: string }) {
  if (record.reasons.length === 0) return null
  return (
    <div className={cn("space-y-2", className)}>
      <p className="arc-mono text-arc-dim">WHY IT MATCHES</p>
      <ul className="space-y-1.5">
        {record.reasons.map((reason) => (
          <li key={reason} className="flex items-start gap-2.5 text-[13px] leading-snug text-arc-muted">
            <Check className="mt-0.5 size-3.5 shrink-0 text-arc-green" aria-hidden />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
