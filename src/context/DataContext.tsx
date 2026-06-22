import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { MergedData } from '../types'
import { loadMergedData } from '../data/loader'

interface DataContextValue {
  data: MergedData | null
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MergedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    loadMergedData()
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <DataContext.Provider value={{
      data,
      loading,
      error,
      lastUpdated: data?.last_updated || null,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
