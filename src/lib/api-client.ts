import type {
  AssetDTO,
  MatchInput,
  MatchResult,
  MetaDTO,
  NetworkDTO,
  ObservationSeriesDTO,
  ProtocolDTO,
  RevisionDTO,
  StrategyDTO,
  StrategyFilters,
  StrategyInput,
} from "@/lib/types"

/**
 * Typed REST client for the Matrix Strategy Archives API.
 * Both the public site and the admin CMS run on this single client —
 * the same API Matrix Finance / AI agents will consume later.
 */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
      if (body?.details) message = `${message}: ${JSON.stringify(body.details)}`
    } catch {
      /* keep default message */
    }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  if (!entries.length) return ""
  return `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&")}`
}

export function strategyFilterParams(filters: StrategyFilters): Record<string, string | undefined> {
  return {
    q: filters.q?.trim() || undefined,
    regime: filters.regimes?.length ? filters.regimes.join(",") : undefined,
    secondaryRegime: filters.secondaryRegimes?.length
      ? filters.secondaryRegimes.join(",")
      : undefined,
    risk: filters.risks?.length ? filters.risks.join(",") : undefined,
    type: filters.types?.length ? filters.types.join(",") : undefined,
    network: filters.networks?.length ? filters.networks.join(",") : undefined,
    protocol: filters.protocols?.length ? filters.protocols.join(",") : undefined,
    asset: filters.assets?.length ? filters.assets.join(",") : undefined,
    leverage: filters.leverage && filters.leverage !== "any" ? filters.leverage : undefined,
    liquidation:
      filters.liquidation && filters.liquidation !== "any" ? filters.liquidation : undefined,
    status: filters.status && filters.status !== "PUBLISHED" ? filters.status : undefined,
  }
}

export const api = {
  // --- Strategies -----------------------------------------------------------
  listStrategies(filters: StrategyFilters = {}): Promise<StrategyDTO[]> {
    return request<StrategyDTO[]>(`/api/strategies${qs(strategyFilterParams(filters))}`)
  },

  getStrategy(idOrSlug: string): Promise<StrategyDTO> {
    return request<StrategyDTO>(`/api/strategies/${encodeURIComponent(idOrSlug)}`)
  },

  createStrategy(input: StrategyInput): Promise<StrategyDTO> {
    return request<StrategyDTO>("/api/strategies", { method: "POST", body: JSON.stringify(input) })
  },

  updateStrategy(id: string, input: StrategyInput): Promise<StrategyDTO> {
    return request<StrategyDTO>(`/api/strategies/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  },

  deleteStrategy(id: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/api/strategies/${id}`, { method: "DELETE" })
  },

  // --- Observations ------------------------------------------------------------
  /** Daily observation series for one strategy (apy + tvl, ascending). */
  getObservations(idOrSlug: string, days = 365): Promise<ObservationSeriesDTO> {
    return request<ObservationSeriesDTO>(
      `/api/strategies/${encodeURIComponent(idOrSlug)}/observations?days=${days}`
    )
  },

  // --- Revisions --------------------------------------------------------------
  listRevisions(id: string): Promise<RevisionDTO[]> {
    return request<RevisionDTO[]>(`/api/strategies/${id}/revisions`)
  },

  restoreRevision(id: string, revisionId: string): Promise<StrategyDTO> {
    return request<StrategyDTO>(`/api/strategies/${id}/revisions/${revisionId}/restore`, {
      method: "POST",
    })
  },

  // --- Taxonomy -----------------------------------------------------------------
  listAssets(): Promise<AssetDTO[]> {
    return request<AssetDTO[]>("/api/assets")
  },
  createAsset(input: Partial<AssetDTO>): Promise<AssetDTO> {
    return request<AssetDTO>("/api/assets", { method: "POST", body: JSON.stringify(input) })
  },
  updateAsset(id: string, input: Partial<AssetDTO>): Promise<AssetDTO> {
    return request<AssetDTO>(`/api/assets/${id}`, { method: "PUT", body: JSON.stringify(input) })
  },

  listProtocols(): Promise<ProtocolDTO[]> {
    return request<ProtocolDTO[]>("/api/protocols")
  },
  createProtocol(input: Partial<ProtocolDTO>): Promise<ProtocolDTO> {
    return request<ProtocolDTO>("/api/protocols", { method: "POST", body: JSON.stringify(input) })
  },
  updateProtocol(id: string, input: Partial<ProtocolDTO>): Promise<ProtocolDTO> {
    return request<ProtocolDTO>(`/api/protocols/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  },

  listNetworks(): Promise<NetworkDTO[]> {
    return request<NetworkDTO[]>("/api/networks")
  },
  createNetwork(input: Partial<NetworkDTO>): Promise<NetworkDTO> {
    return request<NetworkDTO>("/api/networks", { method: "POST", body: JSON.stringify(input) })
  },
  updateNetwork(id: string, input: Partial<NetworkDTO>): Promise<NetworkDTO> {
    return request<NetworkDTO>(`/api/networks/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  },

  // --- Matching -----------------------------------------------------------------
  /** Rank published strategies against a profile (see match-engine weights). */
  match(input: MatchInput): Promise<MatchResult[]> {
    return request<MatchResult[]>("/api/match", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  // --- Meta -------------------------------------------------------------------
  meta(): Promise<MetaDTO> {
    return request<MetaDTO>("/api/meta")
  },
}
