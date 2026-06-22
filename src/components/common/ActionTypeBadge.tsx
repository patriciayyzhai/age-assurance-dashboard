import type { ActionType } from '../../types'
import { ACTION_TYPE_META } from '../../types'

interface ActionTypeBadgeProps {
  type: ActionType
  confidence?: number
}

export default function ActionTypeBadge({ type, confidence }: ActionTypeBadgeProps) {
  const meta = ACTION_TYPE_META[type]
  if (!meta) return <span className="text-xs text-slate-400">{type}</span>

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-xs font-medium px-2.5 py-0.5"
      style={{
        backgroundColor: `${meta.color}15`,
        color: meta.color,
        border: `1px solid ${meta.color}30`,
      }}
    >
      <span>{meta.icon}</span>
      {meta.label}
      {confidence != null && (
        <span className="opacity-70 ml-0.5">
          {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </span>
  )
}
