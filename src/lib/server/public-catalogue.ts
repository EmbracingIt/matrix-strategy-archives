import type { StrategyDTO } from "@/lib/types";

/** Shared gate for listing, search, metadata and app matching. Legacy records
 * cannot return through a status-only query after a revision restore. */
export const PUBLIC_STRATEGY_WHERE = {
  status: "PUBLISHED",
  recordType: "strategy",
  canonicalSlug: null,
  educationJson: { not: "{}" },
} as const;

/** Original research stays in the authenticated editor and revision history. */
export function publicStrategy(strategy: StrategyDTO): StrategyDTO {
  if (!strategy.education) return strategy;
  const { detailedResearch: _internalResearch, ...education } = strategy.education;
  return { ...strategy, education };
}
