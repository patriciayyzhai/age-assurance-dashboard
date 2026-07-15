import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { FilterState, RegulationStatus, ServiceTypeId, ObligationType, SeverityBand } from '../types'
import { DEFAULT_FILTERS } from '../data/loader'

type FilterAction =
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'TOGGLE_STATUS'; value: RegulationStatus }
  | { type: 'TOGGLE_JURISDICTION'; value: string }
  | { type: 'TOGGLE_SERVICE_TYPE'; value: ServiceTypeId }
  | { type: 'TOGGLE_OBLIGATION_TYPE'; value: ObligationType }
  | { type: 'TOGGLE_SEVERITY_BAND'; value: SeverityBand }
  | { type: 'TOGGLE_REGION'; value: string }
  | { type: 'SET_JURISDICTION'; value: string[] }
  | { type: 'RESET' }

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]
}

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.value }
    case 'TOGGLE_STATUS':
      return { ...state, statuses: toggle(state.statuses, action.value) }
    case 'TOGGLE_JURISDICTION':
      return { ...state, jurisdiction_ids: toggle(state.jurisdiction_ids, action.value) }
    case 'TOGGLE_SERVICE_TYPE':
      return { ...state, service_type_ids: toggle(state.service_type_ids, action.value) }
    case 'TOGGLE_OBLIGATION_TYPE':
      return { ...state, obligation_types: toggle(state.obligation_types, action.value) }
    case 'TOGGLE_SEVERITY_BAND':
      return { ...state, severity_bands: toggle(state.severity_bands, action.value) }
    case 'TOGGLE_REGION':
      return { ...state, regions: toggle(state.regions, action.value) }
    case 'SET_JURISDICTION':
      return { ...state, jurisdiction_ids: action.value }
    case 'RESET':
      return DEFAULT_FILTERS
    default:
      return state
  }
}

interface FilterContextValue {
  filters: FilterState
  dispatch: React.Dispatch<FilterAction>
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, dispatch] = useReducer(filterReducer, DEFAULT_FILTERS)
  return (
    <FilterContext.Provider value={{ filters, dispatch }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}
