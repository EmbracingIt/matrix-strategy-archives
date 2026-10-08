import { z } from "zod";

export const implementationSchema = z.object({
  key: z.string(),
  label: z.string(),
  protocol: z.string(),
  product: z.string(),
  network: z.string(),
  assets: z.array(z.string()),
  requirements: z.array(z.string()),
  enter: z.string(),
  accounting: z.string(),
  exit: z.string(),
  risks: z.string(),
  sources: z.array(z.string().url()),
  reviewedAt: z.string(),
});
export const educationSchema = z.object({
  family: z.enum([
    "Lending",
    "Staking",
    "Liquidity Provision",
    "Yield Farming",
    "Real-World Assets",
    "Hedging",
  ]),
  goal: z.enum(["earn", "accumulate", "sell", "liquidity", "rewards", "hedge"]),
  editorialVersion: z.string().optional(),
  complexity: z.enum(["Basic", "Intermediate", "Advanced"]),
  management: z.enum([
    "Occasional checks",
    "Regular monitoring",
    "Active management",
  ]),
  returnSource: z.string(),
  exposure: z.string(),
  tradeOff: z.string(),
  fitsIf: z.array(z.string()),
  reconsiderIf: z.array(z.string()),
  example: z.object({
    title: z.string(),
    starting: z.string(),
    action: z.string(),
    assumptions: z.string(),
    benchmark: z.string(),
    scenarios: z
      .array(
        z.object({
          label: z.string(),
          condition: z.string(),
          assets: z.string(),
          value: z.string(),
          next: z.string(),
        }),
      )
      .min(3),
  }),
  monitor: z.array(z.string()),
  exit: z.string(),
  implementations: z.array(implementationSchema).min(1),
  foundations: z.array(z.string()),
  tools: z.array(z.string()),
  incomeNote: z.string().optional(),
  detailedResearch: z.string().optional(),
});
export type StrategyEducation = z.infer<typeof educationSchema>;
export const protocolReviewSchema = z.object({
  categories: z.array(z.string()),
  status: z.enum(["reviewed", "candidate", "retired"]),
  products: z.array(
    z.object({
      name: z.string(),
      networks: z.array(z.string()),
      purpose: z.string(),
    }),
  ),
  docs: z.array(z.string().url()),
  officialX: z.string().url().optional(),
  reviewedAt: z.string().nullable(),
  prerequisites: z.string(),
  exit: z.string(),
  risks: z.string(),
  unresolved: z.string(),
});
export type ProtocolReview = z.infer<typeof protocolReviewSchema>;

// Compatibility boundary for Matrix app consumers. SIDEWAYS remains the wire
// alias of NEUTRAL; historical phase tags are not overwritten or scored.
export const APP_REGIME_MAP = {
  BULL: "BULL",
  SIDEWAYS: "NEUTRAL",
  BEAR: "BEAR",
} as const;
export const APP_STATES = [
  "Bull-Trending",
  "Bull-Late/Overheated",
  "Neutral-Range-LowVol",
  "Neutral-Range-HighVol",
  "Bear-Trending",
  "Bear-Capitulation/Deleveraging",
  "Transition/Uncertain",
] as const;
