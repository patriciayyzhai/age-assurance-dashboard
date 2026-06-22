import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { FilterState, RegulationStatus, ServiceTypeId, ObligationType } from '../types'
import { DEFAULT_FILTERS } from '../data/loader'

type FilterAction =
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'TOGGLE_STATUS'; value: RegulationStatus }
  | { type: 'TOGGLE_JURISDICTION'; value: string }
  | { type: 'TOGGLE_SERVICE_TYPE'; value: ServiceTypeId }
  | { type: 'TOGGLE_OBLIGATION_TYPE'; value: ObligationType }
  | { type: 'SET_YEAR_RANGE'; value: [number, number] | null }
  | { type: 'SET_JURISDICTION'; value: string[] }
  | { type: 'RESET' }

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.value }

    case 'TOGGLE_STATUS': {
      const has = state.statuses.includes(action.value)
      return {
        ...state,
        statuses: has
          ? state.statuses.filter((s) => s !== action.value)
          : [...state.statuses, action.value],
      }
    }

    case 'TOGGLE_JURISDICTION': {
      const has = state.jurisdiction_ids.includes(action.value)
      return {
        ...state,
        jurisdiction_ids: has
          ? state.jurisdiction_ids.filter((j) => j !== action.value)
          : [...state.jurisdiction_ids, action.value],
      }
    }

    case 'TOGGLE_SERVICE_TYPE': {
      const has = state.service_type_ids.includes(action.value)
      return {
        ...state,
        service_type_ids: has
          ? state.service_type_ids.filter((s) => s !== action.value)
          : [...state.service_type_ids, action.value],
      }
    }

    case 'TOGGLE_OBLIGATION_TYPE': {
      const has = state.obligation_types.includes(action.value)
      return {
        ...state,
        obligation_types: has
          ? state.obligation_types.filter((o) => o !== action.value)
          : [...state.obligation_types, action.value],
      }
    }

    case 'SET_YEAR_RANGE':
      return { ...state, year_range: action.value }

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
