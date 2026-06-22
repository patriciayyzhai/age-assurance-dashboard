import type { ServiceTypeId } from '../../types'
import { SERVICE_TYPE_META } from '../../types'

interface ServiceTypeTagProps {
  id: ServiceTypeId
}

export default function ServiceTypeTag({ id }: ServiceTypeTagProps) {
  const meta = SERVICE_TYPE_META[id]
  if (!meta) return <span className="text-xs text-slate-400">{id}</span>

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5">
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  )
}
