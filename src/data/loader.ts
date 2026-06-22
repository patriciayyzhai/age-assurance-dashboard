import { useState, useEffect, useCallback } from 'react'
import type { MergedData, FilterState, Regulation, ServiceTypeId } from '../types'
import { STATUS_META } from '../types'

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
  year_range: null,
}

export function filterRegulations(
  regulations: Regulation[],
  filters: FilterState
): Regulation[] {
  return regulations.filter((reg) => {
    // Search
    if (filters.search) {
      const search = filters.search.toLowerCase()
      const matchesSearch =
        reg.name.toLowerCase().includes(search) ||
        reg.summary.toLowerCase().includes(search) ||
        reg.jurisdiction_id.toLowerCase().includes(search)
      if (!matchesSearch) return false
    }

    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(reg.status)) {
      return false
    }

    // Jurisdiction filter
    if (filters.jurisdiction_ids.length > 0) {
      // Check direct match or parent match
      const matches = filters.jurisdiction_ids.some(
        (jid) => reg.jurisdiction_id === jid || reg.jurisdiction_id.startsWith(jid + '-')
      )
      if (!matches) return false
    }

    // Service type filter
    if (filters.service_type_ids.length > 0) {
      const matches = reg.service_type_ids.some((stid) =>
        filters.service_type_ids.includes(stid)
      )
      if (!matches) return false
    }

    // Obligation type filter
    if (filters.obligation_types.length > 0) {
      const matches = reg.obligations.some((obl) =>
        filters.obligation_types.includes(obl.type)
      )
      if (!matches) return false
    }

    // Year range filter
    if (filters.year_range) {
      const [min, max] = filters.year_range
      if (reg.year < min || reg.year > max) return false
    }

    return true
  })
}

export function sortRegulations(
  regulations: Regulation[],
  sortBy: 'name' | 'jurisdiction' | 'status' | 'year' | 'obligations',
  sortOrder: 'asc' | 'desc'
): Regulation[] {
  const sorted = [...regulations].sort((a, b) => {
    let cmp = 0
    switch (sortBy) {
      case 'name':
        cmp = a.name.localeCompare(b.name)
        break
      case 'jurisdiction':
        cmp = a.jurisdiction_id.localeCompare(b.jurisdiction_id)
        break
      case 'status':
        cmp = STATUS_META[a.status].order - STATUS_META[b.status].order
        break
      case 'year':
        cmp = a.year - b.year
        break
      case 'obligations':
        cmp = a.obligations.length - b.obligations.length
        break
    }
    return sortOrder === 'asc' ? cmp : -cmp
  })
  return sorted
}

// --- Heatmap Utilities ---

export interface CountryRiskScore {
  jurisdiction_id: string
  country_name: string
  iso_alpha2: string
  risk_score: number
  regulation_count: number
  total_obligations: number
  sub_national_breakdown?: {
    jurisdiction_id: string
    name: string
    risk_score: number
    regulation_count: number
  }[]
}

export function calculateRiskScores(
  regulations: Regulation[],
  jurisdictions: { id: string; name: string; iso_alpha2: string; parent_id: string | null }[],
  serviceTypeFilter: ServiceTypeId | 'all'
): CountryRiskScore[] {
  // Group regulations by parent jurisdiction (country level)
  const countryRegs = new Map<string, Regulation[]>()
  const subNationalRegs = new Map<string, Regulation[]>()

  for (const reg of regulations) {
    const jurisdiction = jurisdictions.find((j) => j.id === reg.jurisdiction_id)
    if (!jurisdiction) continue

    // Filter by service type
    if (serviceTypeFilter !== 'all') {
      const matchesService = reg.service_type_ids.includes(serviceTypeFilter) ||
        reg.obligations.some((o) => o.applies_to_service_types.includes(serviceTypeFilter))
      if (!matchesService) continue
    }

    if (jurisdiction.parent_id) {
      // Sub-national: add to parent country
      const parentId = jurisdiction.parent_id
      if (!countryRegs.has(parentId)) countryRegs.set(parentId, [])
      countryRegs.get(parentId)!.push(reg)

      if (!subNationalRegs.has(parentId)) subNationalRegs.set(parentId, [])
      subNationalRegs.get(parentId)!.push(reg)
    } else {
      // Country-level
      if (!countryRegs.has(jurisdiction.id)) countryRegs.set(jurisdiction.id, [])
      countryRegs.get(jurisdiction.id)!.push(reg)
    }
  }

  const MAX_RAW_SCORE = 500 // Normalization factor

  const results: CountryRiskScore[] = []
  for (const [countryId, regs] of countryRegs) {
    const jurisdiction = jurisdictions.find((j) => j.id === countryId)
    if (!jurisdiction) continue

    let rawScore = 0
    let totalObligations = 0

    for (const reg of regs) {
      const statusWeight = STATUS_META[reg.status]?.weight || 0
      const obligationCount = serviceTypeFilter === 'all'
        ? reg.obligations.length
        : reg.obligations.filter((o) => o.applies_to_service_types.includes(serviceTypeFilter)).length

      totalObligations += obligationCount
      rawScore += statusWeight * (1 + obligationCount * 0.3)
    }

    const riskScore = Math.min(Math.round((rawScore / MAX_RAW_SCORE) * 100), 100)

    // Build sub-national breakdown
    const subNationals = (subNationalRegs.get(countryId) || []).map((reg) => ({
      jurisdiction_id: reg.jurisdiction_id,
      name: jurisdictions.find((j) => j.id === reg.jurisdiction_id)?.name || reg.jurisdiction_id,
      risk_score: STATUS_META[reg.status]?.weight || 0,
      regulation_count: 1,
    }))

    // Deduplicate sub-nationals
    const seenSubs = new Set<string>()
    const uniqueSubs = subNationals.filter((s) => {
      if (seenSubs.has(s.jurisdiction_id)) return false
      seenSubs.add(s.jurisdiction_id)
      return true
    })

    results.push({
      jurisdiction_id: countryId,
      country_name: jurisdiction.name,
      iso_alpha2: jurisdiction.iso_alpha2,
      risk_score: riskScore,
      regulation_count: regs.length,
      total_obligations: totalObligations,
      sub_national_breakdown: uniqueSubs.length > 0 ? uniqueSubs : undefined,
    })
  }

  return results.sort((a, b) => b.risk_score - a.risk_score)
}

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
