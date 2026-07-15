import FilterBar from '../components/database/FilterBar'
import MarketTable from '../components/database/MarketTable'

export default function DatabasePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Market Database</h2>
        <p className="text-sm text-slate-500">
          Trust &amp; Safety posture across markets with <span className="font-medium text-slate-600">Moderate-to-Severe</span> regulatory
          severity — showing severity, China sentiment, and key obligations. Lower-risk markets are tracked on the heatmap but
          excluded here. Filter by band, status, scope, or region, and click any row for the full assessment.
        </p>
      </div>
      <FilterBar />
      <MarketTable />
    </div>
  )
}
