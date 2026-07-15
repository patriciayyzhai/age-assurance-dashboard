import { useState, useMemo } from 'react'
import type { Market, SeverityBand } from '../../types'
import { BAND_META, OBLIGATION_TYPE_META, PRIORITY_THEME_META } from '../../types'
import { useData } from '../../context/DataContext'
import { useFilters } from '../../context/FilterContext'
import { filterMarkets, sortMarkets, type MarketSortKey } from '../../data/loader'
import StatusBadge from '../common/StatusBadge'
import ServiceTypeTag from '../common/ServiceTypeTag'
import ObligationTag from '../common/ObligationTag'

type SortOrder = 'asc' | 'desc'

function BandPill({ score, band }: { score: number; band: SeverityBand }) {
  const meta = BAND_META[band]
  // Deep-fill bands (moderate/high/severe) get dark text for contrast on strong colours;
  // the lighter minimal/low bands read better with a slate label.
  const darkText = band === 'severe'
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center rounded-md text-xs font-semibold px-2 py-0.5 min-w-[2.75rem]"
        style={{
          backgroundColor: meta.color,
          color: darkText ? '#fff' : '#1e293b',
        }}
        title={`${meta.label} (${meta.range})`}
      >
        {score}
      </span>
      <span className="text-xs text-slate-500">{meta.label}</span>
    </div>
  )
}

export default function MarketTable() {
  const { data } = useData()
  const { filters } = useFilters()
  const [sortColumn, setSortColumn] = useState<MarketSortKey>('regulatory_severity')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Database scope: only surface markets with Moderate-or-higher regulatory
  // severity (score >= 41). Low/Minimal markets are intentionally excluded
  // from the table (the world map still colours every market for context).
  const inScopeMarkets = useMemo(
    () => (data ? data.markets.filter((m) => m.regulatory_severity >= 41) : []),
    [data]
  )

  const filtered = useMemo(() => {
    if (!data) return []
    const rows = filterMarkets(inScopeMarkets, filters, data.jurisdictions)
    return sortMarkets(rows, sortColumn, sortOrder)
  }, [data, inScopeMarkets, filters, sortColumn, sortOrder])

  const handleSort = (col: MarketSortKey) => {
    if (sortColumn === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(col)
      setSortOrder(col === 'country' ? 'asc' : 'desc')
    }
  }

  const flagFor = (m: Market) => {
    const j = data?.jurisdictions.find((j) => j.id === m.jurisdiction_id)
    return j?.flag_emoji ? `${j.flag_emoji} ` : ''
  }
  const regionFor = (m: Market) => {
    const j = data?.jurisdictions.find((j) => j.id === m.jurisdiction_id)
    return j?.region ?? ''
  }

  const SortIcon = ({ col }: { col: MarketSortKey }) => {
    if (sortColumn !== col) return <span className="text-slate-300 ml-1">↕</span>
    return <span className="text-blue-600 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  const thClass = "px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 transition-colors select-none whitespace-nowrap"

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Results count */}
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{filtered.length}</span> market{filtered.length !== 1 ? 's' : ''}
          {filtered.length < inScopeMarkets.length && (
            <span className="text-slate-400"> of {inScopeMarkets.length} in scope</span>
          )}
        </span>
        {expandedId && (
          <button
            onClick={() => setExpandedId(null)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Collapse
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className={thClass} onClick={() => handleSort('country')}>
                Market <SortIcon col="country" />
              </th>
              <th className={thClass} onClick={() => handleSort('status')}>
                Regulatory Status <SortIcon col="status" />
              </th>
              <th className={thClass} onClick={() => handleSort('regulatory_severity')}>
                Reg. Severity <SortIcon col="regulatory_severity" />
              </th>
              <th className={thClass} onClick={() => handleSort('china_sentiment')}>
                China Sentiment <SortIcon col="china_sentiment" />
              </th>
              <th className={thClass} onClick={() => handleSort('obligations')}>
                Key Obligations <SortIcon col="obligations" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const isExpanded = expandedId === m.id
              return (
                <MarketRow
                  key={m.id}
                  market={m}
                  flag={flagFor(m)}
                  region={regionFor(m)}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : m.id)}
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm text-slate-500">No markets match the current filters</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting or clearing your filters</p>
        </div>
      )}
    </div>
  )
}

function MarketRow({
  market: m,
  flag,
  region,
  isExpanded,
  onToggle,
}: {
  market: Market
  flag: string
  region: string
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className={`border-b border-slate-100 cursor-pointer transition-colors ${
          isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50'
        }`}
        onClick={onToggle}
      >
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <svg
              className={`w-3 h-3 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div>
              <p className="font-medium text-slate-900 text-sm">{flag}{m.country}</p>
              <p className="text-xs text-slate-400">{region}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <StatusBadge status={m.regulatory_status} />
        </td>
        <td className="px-3 py-2.5">
          <BandPill score={m.regulatory_severity} band={m.regulatory_severity_band} />
        </td>
        <td className="px-3 py-2.5">
          <BandPill score={m.china_sentiment} band={m.china_sentiment_band} />
        </td>
        <td className="px-3 py-2.5">
          <div className="flex flex-wrap gap-1 max-w-md">
            {m.obligation_ids.slice(0, 4).map((o) => (
              <ObligationTag key={o} type={o} />
            ))}
            {m.obligation_ids.length > 4 && (
              <span className="text-xs text-slate-400 self-center">
                +{m.obligation_ids.length - 4} more
              </span>
            )}
            {m.obligation_ids.length === 0 && (
              <span className="text-xs text-slate-300">—</span>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="p-0">
            <MarketDetail market={m} />
          </td>
        </tr>
      )}
    </>
  )
}

function MarketDetail({ market: m }: { market: Market }) {
  // Which broadened T&S themes does this market touch?
  const themes = Array.from(
    new Set(m.obligation_ids.map((o) => OBLIGATION_TYPE_META[o]?.priority).filter(Boolean))
  )

  return (
    <div className="bg-slate-50 border-t border-slate-200 px-6 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assessment */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Assessment</h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {m.assessment_note || 'No assessment note recorded.'}
            </p>
          </div>

          {m.china_sentiment_trigger && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                China Sentiment Trigger
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{m.china_sentiment_trigger}</p>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              All Obligations ({m.obligation_ids.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {m.obligation_ids.map((o) => (
                <ObligationTag key={o} type={o} />
              ))}
              {m.obligation_ids.length === 0 && (
                <span className="text-xs text-slate-400">None recorded</span>
              )}
            </div>
          </div>
        </div>

        {/* Facts sidebar */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Scope / Service Types
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {m.service_type_ids.map((st) => (
                <ServiceTypeTag key={st} id={st} />
              ))}
              {m.service_type_ids.length === 0 && (
                <span className="text-xs text-slate-400">Not specified</span>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              T&amp;S Priority Themes
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {themes.map((t) => {
                const meta = PRIORITY_THEME_META[t]
                return (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-md text-xs font-medium px-2 py-0.5"
                    style={{ backgroundColor: `${meta.color}14`, color: meta.color }}
                  >
                    {meta.icon} {meta.label}
                  </span>
                )
              })}
            </div>
          </div>

          {m.source_url && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Reference</h4>
              <a
                href={m.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all inline-flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Source
              </a>
            </div>
          )}

          {m.updated_at && (
            <p className="text-xs text-slate-400">Updated {m.updated_at}</p>
          )}
        </div>
      </div>
    </div>
  )
}
