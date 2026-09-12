import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import type { StrategyFilters } from "@/lib/types"

/** Query keys — invalidate via queryClient.invalidateQueries({ queryKey: ['strategies'] }) etc. */
export const qk = {
  strategies: (filters: StrategyFilters) => ["strategies", filters] as const,
  strategy: (idOrSlug: string) => ["strategy", idOrSlug] as const,
  observations: (idOrSlug: string) => ["observations", idOrSlug] as const,
  revisions: (id: string) => ["revisions", id] as const,
  assets: ["assets"] as const,
  protocols: ["protocols"] as const,
  networks: ["networks"] as const,
  meta: ["meta"] as const,
}

/** Public archive query (server-side filtering + search). */
export function useStrategies(filters: StrategyFilters = {}) {
  return useQuery({
    queryKey: qk.strategies(filters),
    queryFn: () => api.listStrategies(filters),
  })
}

/** Single strategy by id (admin) or slug (public). */
export function useStrategy(idOrSlug: string | null | undefined) {
  return useQuery({
    queryKey: qk.strategy(idOrSlug ?? ""),
    queryFn: () => api.getStrategy(idOrSlug!),
    enabled: Boolean(idOrSlug),
  })
}

/**
 * Daily observation series for one strategy (public slug or admin id).
 * The full year is fetched once; range windows (30D / 90D) are sliced
 * client-side so switching ranges never re-requests.
 */
export function useObservations(idOrSlug: string | null | undefined, days = 365) {
  return useQuery({
    queryKey: [...qk.observations(idOrSlug ?? ""), days],
    queryFn: () => api.getObservations(idOrSlug!, days),
    enabled: Boolean(idOrSlug),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRevisions(id: string | null | undefined) {
  return useQuery({
    queryKey: qk.revisions(id ?? ""),
    queryFn: () => api.listRevisions(id!),
    enabled: Boolean(id),
  })
}

export function useAssets() {
  return useQuery({ queryKey: qk.assets, queryFn: () => api.listAssets() })
}

export function useProtocols() {
  return useQuery({ queryKey: qk.protocols, queryFn: () => api.listProtocols() })
}

export function useNetworks() {
  return useQuery({ queryKey: qk.networks, queryFn: () => api.listNetworks() })
}

export function useMeta() {
  return useQuery({ queryKey: qk.meta, queryFn: () => api.meta() })
}
