import type { NewsItem } from '../../types'
import ActionTypeBadge from './ActionTypeBadge'

interface NewsCardProps {
  item: NewsItem
}

export default function NewsCard({ item }: NewsCardProps) {
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const confidenceColor = (c: number) => {
    if (c >= 0.85) return 'text-red-600'
    if (c >= 0.7) return 'text-green-600'
    if (c >= 0.5) return 'text-amber-600'
    return 'text-slate-500'
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      {/* Header: source + date + classification */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{item.source}</span>
          <span>•</span>
          <span>{formatDate(item.published_at)}</span>
        </div>
        <ActionTypeBadge
          type={item.classification.action_type}
          confidence={item.classification.confidence}
        />
      </div>

      {/* Title */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <h3 className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors leading-snug">
          {item.title}
        </h3>
      </a>

      {/* Snippet */}
      {item.snippet && (
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
          {item.snippet}
        </p>
      )}

      {/* Classification details */}
      {item.classification.action_type !== 'not_relevant' && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1">
          {item.classification.regulation_id && (
            <div className="text-xs text-slate-500">
              <span className="font-medium">Linked regulation:</span>{' '}
              <code className="text-slate-700 bg-slate-100 px-1 rounded">
                {item.classification.regulation_id}
              </code>
            </div>
          )}
          {item.classification.proposed_regulation_name && (
            <div className="text-xs text-slate-500">
              <span className="font-medium">Proposed:</span>{' '}
              {item.classification.proposed_regulation_name}
              {item.classification.proposed_jurisdiction_id && (
                <span className="text-slate-400"> ({item.classification.proposed_jurisdiction_id})</span>
              )}
            </div>
          )}
          {item.classification.reasoning && (
            <div className="text-xs text-slate-400 italic">
              {item.classification.reasoning}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs">
            <span className={`font-medium ${confidenceColor(item.classification.confidence)}`}>
              Confidence: {(item.classification.confidence * 100).toFixed(0)}%
            </span>
            {item.classification.auto_applied ? (
              <span className="text-green-600">✓ Auto-applied</span>
            ) : (
              <span className="text-amber-600">⏳ Pending review</span>
            )}
          </div>
        </div>
      )}

      {/* Link */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
      >
        Read full article ↗
      </a>
    </div>
  )
}
