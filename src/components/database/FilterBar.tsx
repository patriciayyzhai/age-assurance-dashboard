import { useEffect, useMemo, useState } from 'react'
import { useFilters } from '../../context/FilterContext'
import { useData } from '../../context/DataContext'
import { useDebounce } from '../../data/loader'
import type { RegulationStatus, ServiceTypeId, ObligationType, SeverityBand } from '../../types'
import { STATUS_META, SERVICE_TYPE_META, OBLIGATION_TYPE_META, BAND_META } from '../../types'

function normalizeForSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isFuzzyMatch(text: string, query: string) {
  if (!query) return true

  let queryIndex = 0
  for (const char of text) {
    if (char === query[queryIndex]) queryIndex += 1
    if (queryIndex === query.length) return true
  }
  return false
}

function jurisdictionMatchScore(text: string, query: string) {
  if (!query) return 0
  if (text.startsWith(query)) return 0
  if (text.includes(query)) return 1
  if (isFuzzyMatch(text, query)) return 2
  return 99
}

// Database is scoped to Moderate-or-higher severity, so only offer those bands.
const BAND_ORDER: SeverityBand[] = ['moderate', 'high', 'severe']

export default function FilterBar() {
  const { data } = useData()
  const { filters, dispatch } = useFilters()
  const [searchInput, setSearchInput] = useState(filters.search)
  const [jurisdictionQuery, setJurisdictionQuery] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  // Sync debounced search to filter state
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      dispatch({ type: 'SET_SEARCH', value: debouncedSearch })
    }
  }, [debouncedSearch, dispatch, filters.search])

  const activeFilterCount =
    filters.statuses.length +
    filters.jurisdiction_ids.length +
    filters.service_type_ids.length +
    filters.obligation_types.length +
    filters.severity_bands.length +
    filters.regions.length

  // Get unique jurisdictions from data, sorted by region then name
  const jurisdictions = data
    ? [...data.jurisdictions].sort((a, b) =>
        a.region !== b.region
          ? a.region.localeCompare(b.region)
          : a.name.localeCompare(b.name)
      )
    : []

  // Distinct regions present in the data
  const regions = useMemo(
    () => (data ? Array.from(new Set(data.jurisdictions.map((j) => j.region))).sort() : []),
    [data]
  )

  const normalizedJurisdictionQuery = normalizeForSearch(jurisdictionQuery.trim())
  const visibleJurisdictions = jurisdictions
    .filter((j) => {
      if (!normalizedJurisdictionQuery) return true
      const haystacks = [
        normalizeForSearch(j.name),
        normalizeForSearch(j.region),
        normalizeForSearch(j.id),
        normalizeForSearch(`${j.name} ${j.region} ${j.id}`),
      ]
      return haystacks.some((text) =>
        text.includes(normalizedJurisdictionQuery) || isFuzzyMatch(text, normalizedJurisdictionQuery)
      )
    })
    .sort((a, b) => {
      if (!normalizedJurisdictionQuery) {
        return a.region !== b.region
          ? a.region.localeCompare(b.region)
          : a.name.localeCompare(b.name)
      }

      const aScore = jurisdictionMatchScore(
        normalizeForSearch(`${a.name} ${a.region} ${a.id}`),
        normalizedJurisdictionQuery
      )
      const bScore = jurisdictionMatchScore(
        normalizeForSearch(`${b.name} ${b.region} ${b.id}`),
        normalizedJurisdictionQuery
      )

      if (aScore !== bScore) return aScore - bScore
      if (a.region !== b.region) return a.region.localeCompare(b.region)
      return a.name.localeCompare(b.name)
    })

  const toggleStatus = (s: RegulationStatus) => dispatch({ type: 'TOGGLE_STATUS', value: s })
  const toggleServiceType = (s: ServiceTypeId) => dispatch({ type: 'TOGGLE_SERVICE_TYPE', value: s })
  const toggleObligationType = (o: ObligationType) => dispatch({ type: 'TOGGLE_OBLIGATION_TYPE', value: o })
  const toggleBand = (b: SeverityBand) => dispatch({ type: 'TOGGLE_SEVERITY_BAND', value: b })
  const toggleRegion = (r: string) => dispatch({ type: 'TOGGLE_REGION', value: r })

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
      {/* Search + Reset */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search markets by country, status, or assessment..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={() => {
              dispatch({ type: 'RESET' })
              setSearchInput('')
            }}
            className="px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Severity band filters */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Regulatory Severity Band</label>
        <div className="flex flex-wrap gap-1.5">
          {BAND_ORDER.map((b) => {
            const meta = BAND_META[b]
            const active = filters.severity_bands.includes(b)
            return (
              <button
                key={b}
                onClick={() => toggleBand(b)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  active ? 'shadow-sm' : 'hover:opacity-80'
                }`}
                style={
                  active
                    ? { backgroundColor: meta.color, color: b === 'severe' ? '#fff' : '#1e293b', borderColor: meta.color }
                    : { backgroundColor: `${meta.color}22`, color: '#475569', borderColor: `${meta.color}55` }
                }
              >
                {meta.label} <span className="opacity-70">({meta.range})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Status filters */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Regulatory Status</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(STATUS_META) as RegulationStatus[]).map((s) => {
            const meta = STATUS_META[s]
            const active = filters.statuses.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                style={active ? { backgroundColor: meta.color } : {}}
              >
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Service type filters */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Scope / Service Type</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SERVICE_TYPE_META) as ServiceTypeId[]).map((stid) => {
            const meta = SERVICE_TYPE_META[stid]
            const active = filters.service_type_ids.includes(stid)
            return (
              <button
                key={stid}
                onClick={() => toggleServiceType(stid)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {meta.icon} {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Obligation type filters */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Key Obligation</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(OBLIGATION_TYPE_META) as ObligationType[]).map((o) => {
            const meta = OBLIGATION_TYPE_META[o]
            const active = filters.obligation_types.includes(o)
            return (
              <button
                key={o}
                onClick={() => toggleObligationType(o)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                style={active ? { backgroundColor: meta.color } : {}}
              >
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Region + Jurisdiction in a row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Region */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            Region {filters.regions.length > 0 && `(${filters.regions.length})`}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {regions.map((r) => {
              const active = filters.regions.includes(r)
              return (
                <button
                  key={r}
                  onClick={() => toggleRegion(r)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    active
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {r}
                </button>
              )
            })}
            {regions.length === 0 && (
              <span className="text-xs text-slate-400">No regions available</span>
            )}
          </div>
        </div>

        {/* Jurisdiction */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            Market {filters.jurisdiction_ids.length > 0 && `(${filters.jurisdiction_ids.length})`}
          </label>
          <div className="space-y-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={jurisdictionQuery}
                onChange={(e) => setJurisdictionQuery(e.target.value)}
                placeholder="Search country, region, or code..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="rounded-lg border border-slate-300 bg-slate-50/50 p-1.5 h-36 overflow-y-auto">
              <div className="space-y-1">
                {visibleJurisdictions.map((j) => {
                  const active = filters.jurisdiction_ids.includes(j.id)
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => dispatch({ type: 'TOGGLE_JURISDICTION', value: j.id })}
                      className={`w-full flex items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                        active
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate pr-3">
                        {j.flag_emoji ? `${j.flag_emoji} ` : ''}{j.name} ({j.region})
                      </span>
                      <span className={`text-xs ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                        {j.id}
                      </span>
                    </button>
                  )
                })}
                {visibleJurisdictions.length === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-slate-400">
                    No markets match "{jurisdictionQuery}".
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400">Search supports partial and fuzzy matches. Click to toggle multiple markets.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
