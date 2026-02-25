'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/app/components/Header'

interface Report {
  id: number
  accidentAt: string
  location: string
  accidentType: string
  description: string
  injury: string
  response: string
  afterStatus: string
  causeAnalysis: string
  prevention: string
  familyReport: boolean
  createdAt: string
  resident: { name: string; roomNumber: string }
  reporter: { name: string }
}

const DAYS = ['日', '月', '火', '水', '木', '金', '土']
function fmtDate(s: string) {
  const d = new Date(s)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const TYPE_COLOR: Record<string, string> = {
  '転倒': 'bg-orange-100 text-orange-700',
  '転落': 'bg-red-100 text-red-700',
  '誤嚥': 'bg-purple-100 text-purple-700',
  '誤薬': 'bg-yellow-100 text-yellow-700',
  '皮膚損傷': 'bg-pink-100 text-pink-700',
  'その他': 'bg-slate-100 text-slate-600',
}

export default function AccidentReportsListPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/accident-report')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setReports(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const Field = ({ label, value }: { label: string; value: string }) =>
    value ? (
      <div className="mt-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mt-0.5">{value}</p>
      </div>
    ) : null

  return (
    <div className="min-h-screen bg-slate-100 pb-6">
      <Header title="事故報告書一覧" backUrl="/admin" />

      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">{reports.length}件</p>
        <Link
          href="/accident-report"
          className="text-xs bg-red-400 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-500 transition-colors"
        >
          ＋ 新規作成
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">読み込み中...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">事故報告書がありません</div>
      ) : (
        <div className="space-y-2 px-4">
          {reports.map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* サマリ行 */}
              <button
                className="w-full text-left px-4 py-3.5"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${TYPE_COLOR[r.accidentType] || TYPE_COLOR['その他']}`}>
                        {r.accidentType || '種別未入力'}
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {r.resident.roomNumber}号　{r.resident.name}
                      </span>
                      {r.familyReport && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">家族報告済</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {fmtDate(r.accidentAt)}　{r.location && `@ ${r.location}`}　報告: {r.reporter.name}
                    </p>
                    {r.description && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">{r.description}</p>
                    )}
                  </div>
                  <svg
                    className={`text-slate-300 flex-shrink-0 mt-1 transition-transform ${expanded === r.id ? 'rotate-90' : ''}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>

              {/* 詳細展開 */}
              {expanded === r.id && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-0.5">
                  <Field label="発生状況" value={r.description} />
                  <Field label="受傷内容" value={r.injury} />
                  <Field label="対応内容" value={r.response} />
                  <Field label="事後状況" value={r.afterStatus} />
                  <Field label="原因分析" value={r.causeAnalysis} />
                  <Field label="再発防止策" value={r.prevention} />
                  <p className="text-xs text-slate-400 pt-2">登録: {fmtDate(r.createdAt)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
