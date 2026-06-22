import type { RegulationStatus } from '../../types'
import { STATUS_META } from '../../types'

interface StatusBadgeProps {
  status: RegulationStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const meta = STATUS_META[status]
  if (!meta) return <span className="text-xs text-slate-400">{status}</span>

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: `${meta.color}15`,
        color: meta.color,
        border: `1px solid ${meta.color}30`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  )
}
