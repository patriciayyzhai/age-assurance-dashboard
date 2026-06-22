import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import NewsCard from '../components/common/NewsCard'
import type { ActionType } from '../types'
import { ACTION_TYPE_META } from '../types'

type FilterType = ActionType | 'all'

export default function NewsPage() {
  const { data, loading } = useData()
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const newsItems = useMemo(() => {
    if (!data?.news_items) return []
    let items = [...data.news_items]

    // Filter by action type
    if (filter !== 'all') {
      items = items.filter((i) => i.classification.action_type === filter)
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.source.toLowerCase().includes(q) ||
          (i.snippet?.toLowerCase().includes(q) ?? false)
      )
    }

    // Sort by published date, most recent first
    items.sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )

    return items
  }, [data, filter, search])

  // Count by type
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    if (data?.news_items) {
      for (const item of data.news_items) {
        const t = item.classification.action_type
        map[t] = (map[t] || 0) + 1
      }
    }
    return map
  }, [data])

  // Group items by date
  const grouped = useMemo(() => {
    const groups: { date: string; items: typeof newsItems }[] = []
    let currentDate = ''

    for (const item of newsItems) {
      const date = new Date(item.published_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })

      if (date !== currentDate) {
        currentDate = date
        groups.push({ date, items: [] })
      }
      groups[groups.length - 1].items.push(item)
    }

    return groups
  }, [newsItems])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Loading news...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">News Tracker</h2>
        <p className="text-sm text-slate-500">
          LLM-classified news on age assurance regulations worldwide. Auto-updated daily.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <div className="text-2xl font-bold text-slate-900">{data?.news_items?.length || 0}</div>
          <div className="text-xs text-slate-500">Total Articles</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{counts['new_regulation_proposed'] || 0}</div>
          <div className="text-xs text-slate-500">New Proposals</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{counts['existing_regulation_development'] || 0}</div>
          <div className="text-xs text-slate-500">Developments</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <div className="text-2xl font-bold text-slate-600">{counts['existing_regulation_report'] || 0}</div>
          <div className="text-xs text-slate-500">Reports</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({data?.news_items?.length || 0})
          </button>
          {(Object.keys(ACTION_TYPE_META) as ActionType[])
            .filter((t) => t !== 'not_relevant')
            .map((t) => {
              const meta = ACTION_TYPE_META[t]
              const active = filter === t
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                  style={active ? { backgroundColor: meta.color } : {}}
                >
                  {meta.icon} {meta.label} ({counts[t] || 0})
                </button>
              )
            })}
        </div>

        <div className="flex-1 min-w-48 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search news..."
            className="w-full pl-10 pr-4 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Timeline */}
      {newsItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-2">📰</div>
          <p className="text-sm text-slate-500">
            {data?.news_items?.length === 0
              ? 'No news articles tracked yet. Run the pipeline to fetch news.'
              : 'No news matches the current filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="text-sm font-semibold text-slate-700">{group.date}</div>
                <div className="flex-1 h-px bg-slate-200" />
                <div className="text-xs text-slate-400">{group.items.length} article{group.items.length !== 1 ? 's' : ''}</div>
              </div>
              {/* News cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.items.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
