import type { Regulation } from '../../types'
import { useData } from '../../context/DataContext'
import StatusBadge from '../common/StatusBadge'
import ObligationTag from '../common/ObligationTag'
import ServiceTypeTag from '../common/ServiceTypeTag'

interface RegulationDetailProps {
  regulation: Regulation
}

export default function RegulationDetail({ regulation: reg }: RegulationDetailProps) {
  const { data } = useData()
  const jurisdiction = data?.jurisdictions.find((j) => j.id === reg.jurisdiction_id)

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    } catch {
      return iso
    }
  }

  // Sort milestones by date
  const sortedMilestones = [...reg.milestones].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-4">
      {/* Summary */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Summary</h4>
        <p className="text-sm text-slate-700 leading-relaxed">{reg.summary}</p>
      </div>

      {/* Tags + Source */}
      <div className="flex flex-wrap items-center gap-2">
        {jurisdiction && (
          <span className="text-xs text-slate-500">
            📍 {jurisdiction.flag_emoji} {jurisdiction.name} ({jurisdiction.region})
          </span>
        )}
        {reg.source_url && (
          <a
            href={reg.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-0.5"
          >
            Source ↗
          </a>
        )}
        {reg.tags && reg.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reg.tags.map((tag) => (
              <span key={tag} className="text-xs bg-slate-200 text-slate-600 rounded px-1.5 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Obligations */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Platform Obligations ({reg.obligations.length})
          </h4>
          <div className="space-y-2">
            {reg.obligations.map((obl) => (
              <div key={obl.id} className="bg-white rounded-lg border border-slate-200 p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <ObligationTag
                    type={obl.type}
                    thresholdAge={obl.threshold_age}
                    thresholdLabel={obl.threshold_label}
                  />
                  {(obl.threshold_label?.trim() || (obl.threshold_age != null && obl.threshold_age > 0)) && (
                    <span className="text-xs text-slate-400">
                      Threshold: {obl.threshold_label?.trim() || `Age ${obl.threshold_age}`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{obl.description}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {obl.applies_to_service_types.map((stid) => (
                    <ServiceTypeTag key={stid} id={stid} />
                  ))}
                </div>
              </div>
            ))}
            {reg.obligations.length === 0 && (
              <p className="text-xs text-slate-400">No obligations recorded</p>
            )}
          </div>
        </div>

        {/* Milestones + Litigations */}
        <div className="space-y-4">
          {/* Milestones */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Timeline ({sortedMilestones.length})
            </h4>
            <div className="relative pl-4 space-y-2.5">
              <div className="absolute left-1 top-1 bottom-1 w-px bg-slate-300" />
              {sortedMilestones.map((ms) => (
                <div key={ms.id} className="relative">
                  <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                  <div className="bg-white rounded-lg border border-slate-200 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 capitalize">
                        {ms.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(ms.date)}</span>
                    </div>
                    {ms.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{ms.description}</p>
                    )}
                    {ms.source_url && (
                      <a
                        href={ms.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-0.5 inline-block"
                      >
                        Source ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {sortedMilestones.length === 0 && (
                <p className="text-xs text-slate-400">No milestones recorded</p>
              )}
            </div>
          </div>

          {/* Litigations */}
          {reg.litigations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Litigation ({reg.litigations.length})
              </h4>
              <div className="space-y-2">
                {reg.litigations.map((lit) => (
                  <div key={lit.id} className="bg-white rounded-lg border border-amber-200 p-2.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-slate-800">{lit.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 capitalize">
                        {lit.status}
                      </span>
                    </div>
                    {lit.court && (
                      <p className="text-xs text-slate-500">Court: {lit.court}</p>
                    )}
                    {lit.plaintiff && (
                      <p className="text-xs text-slate-500">Plaintiff: {lit.plaintiff}</p>
                    )}
                    {lit.filed_date && (
                      <p className="text-xs text-slate-400">Filed: {formatDate(lit.filed_date)}</p>
                    )}
                    {lit.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{lit.description}</p>
                    )}
                    {lit.source_url && (
                      <a
                        href={lit.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-0.5 inline-block"
                      >
                        Source ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-end gap-3 text-xs text-slate-400 pt-1">
        <span>Created: {formatDate(reg.created_at)}</span>
        <span>Updated: {formatDate(reg.updated_at)}</span>
        <StatusBadge status={reg.status} />
      </div>
    </div>
  )
}
