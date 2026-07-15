import { useEffect, useMemo, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { getEchartsCountryName } from '../../data/isoEchartsMap'
import type { CountryRiskScore, HeatmapMetric } from '../../types'
import { STATUS_META, BAND_META, bandFromScore } from '../../types'

const WORLD_MAP_URL = 'https://raw.githubusercontent.com/apache/echarts/4.9.0/map/json/world.json'

interface HeatmapChartProps {
  riskScores: CountryRiskScore[]
  metric: HeatmapMetric
  onChartClick: (params: unknown) => void
}

export default function HeatmapChart({ riskScores, metric, onChartClick }: HeatmapChartProps) {
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

    const metricLabel = metric === 'china_sentiment' ? 'China Sentiment' : 'Regulatory Severity'

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
          const rs = params.data.rawData as CountryRiskScore
          const band = BAND_META[bandFromScore(rs.risk_score)]
          const status = STATUS_META[rs.status]
          let html = `<div style="font-weight:600;margin-bottom:4px">${rs.country_name}</div>`
          html += `<div style="font-size:12px;color:#64748b">${metricLabel}: <b style="color:${band.color}">${rs.risk_score}/100</b> <span style="color:${band.color}">(${band.label})</span></div>`
          if (metric === 'regulatory_severity') {
            html += `<div style="font-size:12px;color:#64748b">China Sentiment: <b>${rs.china_sentiment}/100</b></div>`
          } else {
            html += `<div style="font-size:12px;color:#64748b">Regulatory Severity: <b>${rs.regulatory_severity}/100</b></div>`
          }
          html += `<div style="font-size:12px;color:#64748b">Status: <b style="color:${status?.color || '#64748b'}">${status?.label || rs.status}</b></div>`
          html += `<div style="font-size:12px;color:#64748b">Obligations: <b>${rs.total_obligations}</b></div>`
          html += '<div style="margin-top:4px;font-size:11px;color:#3b82f6">Click to view market detail →</div>'
          return html
        },
      },
      visualMap: {
        type: 'piecewise',
        left: 20,
        bottom: 20,
        realtime: false,
        // Discrete severity bands so each market snaps to one clear colour
        // (avoids the muddy-yellow blend of a continuous ramp)
        pieces: [
          { gte: 81, lte: 100, label: 'Severe (81-100)',  color: BAND_META.severe.color },
          { gte: 61, lt: 81,   label: 'High (61-80)',      color: BAND_META.high.color },
          { gte: 41, lt: 61,   label: 'Moderate (41-60)',  color: BAND_META.moderate.color },
          { gte: 21, lt: 41,   label: 'Low (21-40)',       color: BAND_META.low.color },
          { gte: 0,  lt: 21,   label: 'Minimal (0-20)',    color: BAND_META.minimal.color },
        ],
        textStyle: { fontSize: 11 },
      },
      series: [
        {
          name: metricLabel,
          type: 'map',
          map: 'world',
          roam: true,
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: '#93c5fd', borderColor: '#fff', borderWidth: 1 },
          },
          select: { disabled: true },
          itemStyle: {
            areaColor: '#f1f5f9',
            borderColor: '#cbd5e1',
            borderWidth: 0.5,
          },
          data: mapData,
        },
      ],
    }
  }, [riskScores, mapLoaded, metric])

  if (!riskScores.length) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        No markets match the current filter
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
