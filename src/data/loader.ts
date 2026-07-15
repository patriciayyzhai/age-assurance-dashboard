import { useState, useEffect, useCallback } from 'react'
import type {
  MergedData, FilterState, Market, ServiceTypeId,
  CountryRiskScore, HeatmapMetric,
} from '../types'
import { STATUS_META, bandFromScore } from '../types'

// --- Data Loading ---

export async function loadMergedData(basePath?: string): Promise<MergedData> {
  const base = basePath || import.meta.env.VITE_BASE_PATH || '/'
  const url = `${base}data/merged.json`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Failed to load data: ${resp.status}`)
  return resp.json()
}

// --- Filter Utilities ---

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  statuses: [],
  jurisdiction_ids: [],
  service_type_ids: [],
  obligation_types: [],
  severity_bands: [],
  regions: [],
}

export function filterMarkets(
  markets: Market[],
  filters: FilterState,
  jurisdictions: { id: string; region: string }[],
): Market[] {
  const regionOf = new Map(jurisdictions.map((j) => [j.id, j.region]))
  return markets.filter((m) => {
    if (filters.search) {
      const s = filters.search.toLowerCase()
      const hit =
        m.country.toLowerCase().includes(s) ||
        m.assessment_note.toLowerCase().includes(s) ||
        m.regulatory_status_label.toLowerCase().includes(s) ||
        m.jurisdiction_id.toLowerCase().includes(s)
      if (!hit) return false
    }
    if (filters.statuses.length && !filters.statuses.includes(m.regulatory_status)) return false
    if (filters.jurisdiction_ids.length && !filters.jurisdiction_ids.includes(m.jurisdiction_id)) return false
    if (filters.service_type_ids.length &&
        !m.service_type_ids.some((st) => filters.service_type_ids.includes(st))) return false
    if (filters.obligation_types.length &&
        !m.obligation_ids.some((o) => filters.obligation_types.includes(o))) return false
    if (filters.severity_bands.length &&
        !filters.severity_bands.includes(m.regulatory_severity_band)) return false
    if (filters.regions.length) {
      const region = regionOf.get(m.jurisdiction_id)
      if (!region || !filters.regions.includes(region)) return false
    }
    return true
  })
}

export type MarketSortKey =
  | 'country' | 'status' | 'regulatory_severity' | 'china_sentiment' | 'obligations'

export function sortMarkets(
  markets: Market[],
  sortBy: MarketSortKey,
  sortOrder: 'asc' | 'desc',
): Market[] {
  const sorted = [...markets].sort((a, b) => {
    let cmp = 0
    switch (sortBy) {
      case 'country':
        cmp = a.country.localeCompare(b.country); break
      case 'status':
        cmp = STATUS_META[a.regulatory_status].order - STATUS_META[b.regulatory_status].order; break
      case 'regulatory_severity':
        cmp = a.regulatory_severity - b.regulatory_severity; break
      case 'china_sentiment':
        cmp = a.china_sentiment - b.china_sentiment; break
      case 'obligations':
        cmp = a.obligation_ids.length - b.obligation_ids.length; break
    }
    return sortOrder === 'asc' ? cmp : -cmp
  })
  return sorted
}

// --- Heatmap Utilities ---

// Drive the heatmap directly from the spreadsheet's 0-100 scores.
// `metric` selects regulatory severity vs China sentiment.
// An optional service-type filter narrows to markets whose scope includes it.
export function calculateRiskScores(
  markets: Market[],
  metric: HeatmapMetric,
  serviceTypeFilter: ServiceTypeId | 'all',
): CountryRiskScore[] {
  const results: CountryRiskScore[] = []
  for (const m of markets) {
    if (serviceTypeFilter !== 'all' && !m.service_type_ids.includes(serviceTypeFilter)) continue
    const value = metric === 'china_sentiment' ? m.china_sentiment : m.regulatory_severity
    results.push({
      jurisdiction_id: m.jurisdiction_id,
      country_name: m.country,
      iso_alpha2: m.jurisdiction_id,
      risk_score: value,
      metric,
      regulatory_severity: m.regulatory_severity,
      china_sentiment: m.china_sentiment,
      regulation_count: 1,
      total_obligations: m.obligation_ids.length,
      obligation_ids: m.obligation_ids,
      status: m.regulatory_status,
    })
  }
  return results.sort((a, b) => b.risk_score - a.risk_score)
}

export { bandFromScore }

// --- Hooks ---

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch {
      return initial
    }
  })

  const setStored = useCallback((v: T) => {
    setValue(v)
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      // ignore
    }
  }, [key])

  return [value, setStored]
}
