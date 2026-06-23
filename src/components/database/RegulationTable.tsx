import { useState, useMemo } from 'react'
import type { Regulation } from '../../types'
import { useData } from '../../context/DataContext'
import { useFilters } from '../../context/FilterContext'
import { filterRegulations, sortRegulations } from '../../data/loader'
import StatusBadge from '../common/StatusBadge'
import ServiceTypeTag from '../common/ServiceTypeTag'
import ObligationTag from '../common/ObligationTag'
import RegulationDetail from './RegulationDetail'

type SortColumn = 'name' | 'jurisdiction' | 'status' | 'year' | 'obligations'
type SortOrder = 'asc' | 'desc'

export default function RegulationTable() {
  const { data } = useData()
  const { filters } = useFilters()
  const [sortColumn, setSortColumn] = useState<SortColumn>('status')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!data) return []
    const filteredRegs = filterRegulations(data.regulations, filters)
    return sortRegulations(filteredRegs, sortColumn, sortOrder)
  }, [data, filters, sortColumn, sortOrder])

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(col)
      setSortOrder(col === 'name' || col === 'jurisdiction' ? 'asc' : 'desc')
    }
  }

  const getJurisdictionName = (id: string) => {
    const j = data?.jurisdictions.find((j) => j.id === id)
    return j ? `${j.flag_emoji ? j.flag_emoji + ' ' : ''}${j.name}` : id
  }

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortColumn !== col) return <span className="text-slate-300 ml-1">↕</span>
    return <span className="text-blue-600 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  const thClass = "px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 transition-colors select-none"

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Results count */}
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{filtered.length}</span> regulation{filtered.length !== 1 ? 's' : ''}
          {data && filtered.length < data.regulations.length && (
            <span className="text-slate-400"> of {data.regulations.length} total</span>
          )}
        </span>
        {expandedId && (
          <button
            onClick={() => setExpandedId(null)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Collapse all
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className={thClass} onClick={() => handleSort('name')}>
                Regulation <SortIcon col="name" />
              </th>
              <th className={thClass} onClick={() => handleSort('jurisdiction')}>
                Jurisdiction <SortIcon col="jurisdiction" />
              </th>
              <th className={thClass} onClick={() => handleSort('status')}>
                Status <SortIcon col="status" />
              </th>
              <th className={thClass}>
                Service Types
              </th>
              <th className={thClass} onClick={() => handleSort('obligations')}>
                Obligations <SortIcon col="obligations" />
              </th>
              <th className={thClass} onClick={() => handleSort('year')}>
                Year <SortIcon col="year" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((reg) => {
              const isExpanded = expandedId === reg.id
              return (
                <FragmentRow
                  key={reg.id}
                  regulation={reg}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : reg.id)}
                  jurisdictionName={getJurisdictionName(reg.jurisdiction_id)}
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
          <p className="text-sm text-slate-500">No regulations match the current filters</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting or clearing your filters</p>
        </div>
      )}
    </div>
  )
}

function FragmentRow({
  regulation: reg,
  isExpanded,
  onToggle,
  jurisdictionName,
}: {
  regulation: Regulation
  isExpanded: boolean
  onToggle: () => void
  jurisdictionName: string
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
              <p className="font-medium text-slate-900 text-sm">{reg.name}</p>
              <p className="text-xs text-slate-400 line-clamp-1">{reg.id}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-2.5 text-slate-700 text-sm">{jurisdictionName}</td>
        <td className="px-3 py-2.5">
          <StatusBadge status={reg.status} />
        </td>
        <td className="px-3 py-2.5">
          <div className="flex flex-wrap gap-1 max-w-xs">
            {reg.service_type_ids.slice(0, 3).map((stid) => (
              <ServiceTypeTag key={stid} id={stid} />
            ))}
            {reg.service_type_ids.length > 3 && (
              <span className="text-xs text-slate-400">
                +{reg.service_type_ids.length - 3} more
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5">
          <div className="flex flex-wrap gap-1 max-w-xs">
            {reg.obligations.slice(0, 3).map((obl) => (
              <ObligationTag
                key={obl.id}
                type={obl.type}
                thresholdAge={obl.threshold_age}
                thresholdLabel={obl.threshold_label}
              />
            ))}
            {reg.obligations.length > 3 && (
              <span className="text-xs text-slate-400">
                +{reg.obligations.length - 3} more
              </span>
            )}
            {reg.obligations.length === 0 && (
              <span className="text-xs text-slate-300">—</span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-slate-700 text-sm">{reg.year}</td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <RegulationDetail regulation={reg} />
          </td>
        </tr>
      )}
    </>
  )
}
