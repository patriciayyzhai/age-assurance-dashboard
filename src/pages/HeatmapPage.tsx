import { lazy, Suspense, useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useFilters } from '../context/FilterContext'
import { calculateRiskScores } from '../data/loader'
import type { ServiceTypeId } from '../types'
import { SERVICE_TYPE_META, STATUS_META } from '../types'
import { useNavigate } from 'react-router-dom'

const HeatmapChart = lazy(() => import('../components/heatmap/HeatmapChart'))

export default function HeatmapPage() {
  const { data, loading } = useData()
  const { dispatch } = useFilters()
  const navigate = useNavigate()
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeId | 'all'>('all')

  // Calculate risk scores
  const riskScores = useMemo(() => {
    if (!data) return []
    return calculateRiskScores(
      data.regulations,
      data.jurisdictions,
      serviceTypeFilter
    )
  }, [data, serviceTypeFilter])

  const heatmapRegulations = useMemo(() => {
    if (!data) return []
    if (serviceTypeFilter === 'all') return data.regulations
    return data.regulations.filter((reg) =>
      reg.service_type_ids.includes(serviceTypeFilter)
    )
  }, [data, serviceTypeFilter])

  const onChartClick = (params: any) => {
    if (!params.data?.rawData) return
    const rs = params.data.rawData
    // Set jurisdiction filter and navigate to database
    dispatch({ type: 'SET_JURISDICTION', value: [rs.jurisdiction_id] })
    navigate('/database')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Loading heatmap data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Service Type Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700 mr-2">Filter by service type:</span>
        <button
          onClick={() => setServiceTypeFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            serviceTypeFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {(Object.keys(SERVICE_TYPE_META) as ServiceTypeId[]).map((stid) => {
          const meta = SERVICE_TYPE_META[stid]
          return (
            <button
              key={stid}
              onClick={() => setServiceTypeFilter(stid)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                serviceTypeFilter === stid
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {meta.icon} {meta.label}
            </button>
          )
        })}
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Global Regulatory Risk Heatmap
          </h2>
          <p className="text-sm text-slate-500">
            Risk score based on number of platform obligations and implementation status.
            Click a country to view detailed regulations.
          </p>
        </div>
        <div style={{ height: '600px' }}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-slate-500">
                Loading heatmap…
              </div>
            }
          >
            <HeatmapChart riskScores={riskScores} onChartClick={onChartClick} />
          </Suspense>
        </div>
      </div>

      {/* Risk Legend & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Risk Level Legend</h3>
          <div className="space-y-2">
            {[
              { range: '0-20', color: '#e0f2fe', label: 'Minimal' },
              { range: '21-40', color: '#7dd3fc', label: 'Low' },
              { range: '41-60', color: '#fbbf24', label: 'Moderate' },
              { range: '61-80', color: '#f97316', label: 'High' },
              { range: '81-100', color: '#ef4444', label: 'Severe' },
            ].map((item) => (
              <div key={item.range} className="flex items-center gap-2 text-sm">
                <div
                  className="w-8 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-700">{item.label}</span>
                <span className="text-slate-400 text-xs">({item.range})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Top 5 Highest Risk</h3>
          <div className="space-y-2">
            {riskScores.slice(0, 5).map((rs, i) => (
              <div
                key={rs.jurisdiction_id}
                className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1"
                onClick={() => {
                  dispatch({ type: 'SET_JURISDICTION', value: [rs.jurisdiction_id] })
                  navigate('/database')
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs w-4">{i + 1}</span>
                  {rs.country_name}
                </span>
                <span
                  className="font-semibold"
                  style={{ color: getRiskColor(rs.risk_score) }}
                >
                  {rs.risk_score}
                </span>
              </div>
            ))}
            {riskScores.length === 0 && (
              <p className="text-sm text-slate-400">No data</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Status Distribution</h3>
          <div className="space-y-1.5">
            {data && Object.entries(STATUS_META).map(([status, meta]) => {
              const count = heatmapRegulations.filter((r) => r.status === status).length
              if (count === 0) return null
              return (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    {meta.label}
                  </span>
                  <span className="font-semibold text-slate-700">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function getRiskColor(score: number): string {
  if (score <= 20) return '#0ea5e9'
  if (score <= 40) return '#38bdf8'
  if (score <= 60) return '#f59e0b'
  if (score <= 80) return '#f97316'
  return '#ef4444'
}
