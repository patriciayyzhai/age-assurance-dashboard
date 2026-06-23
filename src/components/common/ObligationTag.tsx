import type { ObligationType } from '../../types'
import { OBLIGATION_TYPE_META } from '../../types'

interface ObligationTagProps {
  type: ObligationType
  thresholdAge?: number | null
  thresholdLabel?: string | null
}

export default function ObligationTag({ type, thresholdAge, thresholdLabel }: ObligationTagProps) {
  const meta = OBLIGATION_TYPE_META[type]
  if (!meta) return <span className="text-xs text-slate-400">{type}</span>
  void thresholdAge

  const resolvedThresholdLabel =
    thresholdLabel?.trim() || null

  return (
    <span
      className="inline-flex items-center gap-1 rounded-md text-xs font-medium px-2 py-0.5"
      style={{
        backgroundColor: `${meta.color}12`,
        color: meta.color,
      }}
    >
      {meta.label}
      {resolvedThresholdLabel && (
        <span className="opacity-70">({resolvedThresholdLabel})</span>
      )}
    </span>
  )
}
