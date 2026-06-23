import { useEffect, useMemo, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { getEchartsCountryName } from '../../data/isoEchartsMap'
import type { CountryRiskScore } from '../../types'

const WORLD_MAP_URL = 'https://raw.githubusercontent.com/apache/echarts/4.9.0/map/json/world.json'

interface HeatmapChartProps {
  riskScores: CountryRiskScore[]
  onChartClick: (params: unknown) => void
}

export default function HeatmapChart({ riskScores, onChartClick }: HeatmapChartProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const chartRef = useRef<ReactECharts>(null)

  useEffect(() => {
    if (mapLoaded) return
    fetch(WORLD_MAP_URL)
      .then((r) => r.json())
      .then((geoJson) => {
        echarts.registerMap('world', geoJson)
        setMapLoaded(true)
      })
      .catch((e) => console.error('Failed to load world map:', e))
  }, [mapLoaded])

  const chartOption = useMemo(() => {
    if (!riskScores.length || !mapLoaded) return {}

    const mapData = riskScores
      .map((rs) => ({
        name: getEchartsCountryName(rs.iso_alpha2) || rs.country_name,
        value: rs.risk_score,
        rawData: rs,
      }))
      .filter((d) => d.name)

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (!params.data?.rawData) return params.name
          const rs = params.data.rawData
          let html = `<div style="font-weight:600;margin-bottom:4px">${rs.country_name}</div>`
          html += `<div style="font-size:12px;color:#64748b">Risk Score: <b style="color:${getRiskColor(rs.risk_score)}">${rs.risk_score}/100</b></div>`
          html += `<div style="font-size:12px;color:#64748b">Regulations: <b>${rs.regulation_count}</b></div>`
          html += `<div style="font-size:12px;color:#64748b">Obligations: <b>${rs.total_obligations}</b></div>`
          if (rs.sub_national_breakdown?.length) {
            html += '<div style="margin-top:4px;font-size:11px;color:#94a3b8">Sub-national:</div>'
            for (const sub of rs.sub_national_breakdown) {
              html += `<div style="font-size:11px;color:#94a3b8">• ${sub.name}: ${sub.regulation_count} reg(s)</div>`
            }
          }
          html += '<div style="margin-top:4px;font-size:11px;color:#3b82f6">Click to view regulations →</div>'
          return html
        },
      },
      visualMap: {
        min: 0,
        max: 100,
        left: 20,
        bottom: 20,
        text: ['High Risk', 'Low Risk'],
        realtime: false,
        calculable: true,
        inRange: {
          color: [
            '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8',
            '#fbbf24', '#f59e0b', '#f97316', '#ef4444', '#dc2626',
          ],
        },
        textStyle: { fontSize: 11 },
      },
      series: [
        {
          name: 'Regulatory Risk',
          type: 'map',
          map: 'world',
          roam: true,
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: '#fbbf24', borderColor: '#fff', borderWidth: 1 },
          },
          select: {
            disabled: true,
          },
          itemStyle: {
            areaColor: '#f1f5f9',
            borderColor: '#cbd5e1',
            borderWidth: 0.5,
          },
          data: mapData,
        },
      ],
    }
  }, [riskScores, mapLoaded])

  if (!riskScores.length) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        No regulations match the current filter
      </div>
    )
  }

  if (!mapLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Loading map…
      </div>
    )
  }

  return (
    <ReactECharts
      ref={chartRef}
      option={chartOption}
      onEvents={{ click: onChartClick }}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  )
}

function getRiskColor(score: number): string {
  if (score <= 20) return '#0ea5e9'
  if (score <= 40) return '#38bdf8'
  if (score <= 60) return '#f59e0b'
  if (score <= 80) return '#f97316'
  return '#ef4444'
}
