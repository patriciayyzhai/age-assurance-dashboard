import FilterBar from '../components/database/FilterBar'
import RegulationTable from '../components/database/RegulationTable'

export default function DatabasePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Regulation Database</h2>
        <p className="text-sm text-slate-500">
          Browse and filter all tracked age assurance regulations. Click any row to see full details.
        </p>
      </div>
      <FilterBar />
      <RegulationTable />
    </div>
  )
}
