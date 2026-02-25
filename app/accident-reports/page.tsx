'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/app/components/Header'
import { useSession } from '@/app/components/SessionContext'

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
  staffSignatures: string
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

export default function AccidentReportsPage() {
  const session = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkSigning, setBulkSigning] = useState(false)

  const loadReports = () =>
    fetch('/api/accident-report')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setReports(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))

  useEffect(() => { loadReports() }, [])

  // 自分が未確認かつ入職後の件数
  const unsignedCount = session ? reports.filter(r => {
    const afterJoin = !session.staffCreatedAt || new Date(session.staffCreatedAt) <= new Date(r.createdAt)
    const notSigned = (() => {
      try { return !JSON.parse(r.staffSignatures || '[]').some((s: { staffId: number }) => s.staffId === session.staffId) }
      catch { return true }
    })()
    return afterJoin && notSigned
  }).length : 0

  const handleBulkSign = async () => {
    if (!session?.staffId || bulkSigning) return
    if (!confirm(`未確認の${unsignedCount}件をまとめて「見ました」にしますか？`)) return
    setBulkSigning(true)
    try {
      await fetch('/api/accident-report/bulk-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: session.staffId,
          staffName: session.name,
          staffCreatedAt: session.staffCreatedAt,
        }),
      })
      await loadReports()
    } finally {
      setBulkSigning(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-6">
      <Header title="事故報告書一覧" backUrl="/" />

      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{reports.length}件</p>
        <div className="flex items-center gap-2">
          {unsignedCount > 0 && (
            <button
              onClick={handleBulkSign}
              disabled={bulkSigning}
              className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-teal-600 transition-colors disabled:opacity-40"
            >
              {bulkSigning ? '処理中...' : `✓ 一括見ました（${unsignedCount}件）`}
            </button>
          )}
          <Link
            href="/accident-report"
            className="text-xs bg-red-400 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-500 transition-colors"
          >
            ＋ 新規作成
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">読み込み中...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">事故報告書がありません</div>
      ) : (
        <div className="space-y-2 px-4">
          {reports.map(r => (
            <Link key={r.id} href={`/accident-report/${r.id}`} className="block">
              <div className="bg-white rounded-xl shadow-sm px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.accidentType && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${TYPE_COLOR[r.accidentType] || TYPE_COLOR['その他']}`}>
                          {r.accidentType}
                        </span>
                      )}
                      <span className="text-sm font-bold text-slate-700">
                        {r.resident.roomNumber}号　{r.resident.name}
                      </span>
                      {r.familyReport && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">家族報告済</span>
                      )}
                      {(() => {
                        const n = (() => { try { return JSON.parse(r.staffSignatures || '[]').length } catch { return 0 } })()
                        return n === 0
                          ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">未確認</span>
                          : <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">確認 {n}名</span>
                      })()}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {fmtDate(r.accidentAt)}
                      {r.location && `　@ ${r.location}`}
                      　報告: {r.reporter.name}
                    </p>
                    {r.description && (
                      <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{r.description}</p>
                    )}
                  </div>
                  <svg className="text-slate-300 flex-shrink-0 mt-1" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
