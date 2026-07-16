import { lazy, Suspense, useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useFilters } from '../context/FilterContext'
import { calculateRiskScores } from '../data/loader'
import type { ServiceTypeId, HeatmapMetric, ObligationType } from '../types'
import {
  SERVICE_TYPE_META, STATUS_META, BAND_META, PRIORITY_THEME_META,
  OBLIGATION_TYPE_META, bandFromScore,
} from '../types'
import { useNavigate } from 'react-router-dom'

const HeatmapChart = lazy(() => import('../components/heatmap/HeatmapChart'))

const METRIC_LABEL: Record<HeatmapMetric, string> = {
  regulatory_severity: 'Regulatory Severity',
  china_sentiment: 'China Sentiment',
}

export default function HeatmapPage() {
  const { data, loading } = useData()
  const { dispatch } = useFilters()
  const navigate = useNavigate()
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeId | 'all'>('all')
  const [obligationFilter, setObligationFilter] = useState<ObligationType | 'all'>('all')
  const [metric, setMetric] = useState<HeatmapMetric>('regulatory_severity')

  const riskScores = useMemo(() => {
    if (!data) return []
    return calculateRiskScores(data.markets, metric, serviceTypeFilter, obligationFilter)
  }, [data, metric, serviceTypeFilter, obligationFilter])

  const scopedMarkets = useMemo(() => {
    if (!data) return []
    return data.markets.filter(
      (m) =>
        (serviceTypeFilter === 'all' || m.service_type_ids.includes(serviceTypeFilter)) &&
        (obligationFilter === 'all' || m.obligation_ids.includes(obligationFilter)),
    )
  }, [data, serviceTypeFilter, obligationFilter])

  // Priority-theme coverage across the scoped markets (breadth of T&S expectations)
  const priorityCoverage = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of scopedMarkets) {
      const themes = new Set(
        m.obligation_ids.map((o: ObligationType) => OBLIGATION_TYPE_META[o]?.priority).filter(Boolean),
      )
      for (const t of themes) counts[t as string] = (counts[t as string] || 0) + 1
    }
    return counts
  }, [scopedMarkets])

  const onChartClick = (params: any) => {
    if (!params.data?.rawData) return
    const rs = params.data.rawData
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
      {/* Metric toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700 mr-1">View by:</span>
        {(Object.keys(METRIC_LABEL) as HeatmapMetric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              metric === m ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {METRIC_LABEL[m]}
          </button>
        ))}
      </div>

      {/* Service Type Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700 mr-2">Affected service type:</span>
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

      {/* Obligation Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700 mr-2">Key obligation:</span>
        <button
          onClick={() => setObligationFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            obligationFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {(Object.keys(OBLIGATION_TYPE_META) as ObligationType[]).map((oid) => {
          const meta = OBLIGATION_TYPE_META[oid]
          const active = obligationFilter === oid
          return (
            <button
              key={oid}
              onClick={() => setObligationFilter(oid)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              style={active ? { backgroundColor: meta.color } : {}}
            >
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Global Trust &amp; Safety {METRIC_LABEL[metric]} Heatmap
          </h2>
          <p className="text-sm text-slate-500">
            {metric === 'regulatory_severity'
              ? 'Regulatory severity (0–100) across online-safety obligations, weighted by status and breadth of affected services. Click a market for detail.'
              : 'China-sentiment posture (0–100) reflecting scrutiny and restrictions on Chinese platforms. Click a market for detail.'}
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
            <HeatmapChart riskScores={riskScores} metric={metric} onChartClick={onChartClick} />
          </Suspense>
        </div>
      </div>

      {/* Legend & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Band legend */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Severity Bands</h3>
          <div className="space-y-2">
            {(['severe', 'high', 'moderate', 'low', 'minimal'] as const).map((b) => {
              const item = BAND_META[b]
              return (
                <div key={b} className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-4 rounded" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700">{item.label}</span>
                  <span className="text-slate-400 text-xs">({item.range})</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top 5 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Top 5 — {METRIC_LABEL[metric]}</h3>
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
                <span className="font-semibold" style={{ color: BAND_META[bandFromScore(rs.risk_score)].color }}>
                  {rs.risk_score}
                </span>
              </div>
            ))}
            {riskScores.length === 0 && <p className="text-sm text-slate-400">No data</p>}
          </div>
        </div>

        {/* Status distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Status Distribution</h3>
          <div className="space-y-1.5">
            {data && Object.entries(STATUS_META).map(([status, meta]) => {
              const count = scopedMarkets.filter((m) => m.regulatory_status === status).length
              if (count === 0) return null
              return (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                  </span>
                  <span className="font-semibold text-slate-700">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* T&S Priority coverage */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">T&amp;S Priority Coverage</h3>
          <div className="space-y-1.5">
            {Object.entries(PRIORITY_THEME_META).map(([key, meta]) => {
              const count = priorityCoverage[key] || 0
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{meta.icon}</span>
                    {meta.label}
                  </span>
                  <span className="font-semibold" style={{ color: meta.color }}>{count}</span>
                </div>
              )
            })}
            <p className="text-xs text-slate-400 pt-1">Markets addressing each priority theme.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
