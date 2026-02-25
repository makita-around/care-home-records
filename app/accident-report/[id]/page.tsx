'use client'
import { useEffect, useState, use } from 'react'
import Header from '@/app/components/Header'
import { useSession } from '@/app/components/SessionContext'

type Signature = { staffId: number; name: string }

interface Report {
  id: number
  accidentAt: string
  location: string
  accidentType: string
  description: string
  injury: string
  injuryParts: string
  response: string
  afterStatus: string
  familyReport: boolean
  causeAnalysis: string
  prevention: string
  staffSignatures: string
  createdAt: string
  resident: { name: string; roomNumber: string }
  reporter: { name: string }
}

const DAYS = ['日', '月', '火', '水', '木', '金', '土']
function fmtDate(s: string) {
  const d = new Date(s)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${DAYS[d.getDay()]}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const TYPE_COLOR: Record<string, string> = {
  '転倒': 'bg-orange-100 text-orange-700',
  '転落': 'bg-red-100 text-red-700',
  '誤嚥': 'bg-purple-100 text-purple-700',
  '誤薬': 'bg-yellow-100 text-yellow-700',
  '皮膚損傷': 'bg-pink-100 text-pink-700',
  'その他': 'bg-slate-100 text-slate-600',
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="py-3 border-b border-slate-100">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  )
}

export default function AccidentReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const session = useSession()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    fetch(`/api/accident-report/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setReport(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const signatures: Signature[] = (() => {
    try { return JSON.parse(report?.staffSignatures || '[]') } catch { return [] }
  })()

  const alreadySigned = session ? signatures.some(s => s.staffId === session.staffId) : false
  const isBeforeJoinDate = session?.staffCreatedAt && report
    ? new Date(session.staffCreatedAt) > new Date(report.createdAt)
    : false

  const handleSign = async () => {
    if (!session?.staffId || alreadySigned || signing) return
    setSigning(true)
    const newSig: Signature = { staffId: session.staffId, name: session.name }
    const updated = [...signatures, newSig]
    // 楽観的更新
    setReport(prev => prev ? { ...prev, staffSignatures: JSON.stringify(updated) } : prev)
    try {
      await fetch(`/api/accident-report/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffSignatures: JSON.stringify(updated) }),
      })
    } catch {
      // 失敗したら元に戻す
      setReport(prev => prev ? { ...prev, staffSignatures: JSON.stringify(signatures) } : prev)
    } finally {
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header title="事故報告書" backUrl="/accident-reports" />
        <div className="text-center py-20 text-slate-400 text-sm">読み込み中...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header title="事故報告書" backUrl="/accident-reports" />
        <div className="text-center py-20 text-slate-400 text-sm">報告書が見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-8">
      <Header title="事故報告書" backUrl="/accident-reports" />

      {/* 利用者バナー */}
      <div className="bg-red-400 px-4 py-2.5">
        <p className="text-white text-sm font-medium">{report.resident.roomNumber}号　{report.resident.name}</p>
      </div>

      {/* 基本情報 */}
      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {report.accidentType && (
            <span className={`text-sm px-3 py-1 rounded-full font-bold ${TYPE_COLOR[report.accidentType] || TYPE_COLOR['その他']}`}>
              {report.accidentType}
            </span>
          )}
          {report.familyReport && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">家族報告済</span>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">発生日時</p>
          <p className="text-base font-bold text-slate-700 mt-0.5">{fmtDate(report.accidentAt)}</p>
        </div>
        {report.location && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">発生場所</p>
            <p className="text-sm text-slate-700 mt-0.5">{report.location}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">報告者</p>
          <p className="text-sm text-slate-700 mt-0.5">{report.reporter.name}</p>
        </div>
      </div>

      {/* 詳細 */}
      <div className="bg-white mt-2 mx-0 shadow-sm px-4">
        <Field label="発生状況" value={report.description} />
        <Field label="受傷内容" value={report.injury} />
        <Field label="受傷箇所" value={report.injuryParts} />
        <Field label="対応内容" value={report.response} />
        <Field label="事後状況" value={report.afterStatus} />
        <Field label="原因分析" value={report.causeAnalysis} />
        <Field label="再発防止策" value={report.prevention} />
        {!report.description && !report.injury && !report.response && !report.afterStatus && !report.causeAnalysis && !report.prevention && (
          <p className="text-center text-slate-400 text-sm py-6">詳細情報なし</p>
        )}
      </div>

      {/* 見ました（確認署名） */}
      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">確認署名</p>

        {/* 確認済み職員一覧 */}
        {signatures.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {signatures.map((s, i) => (
              <span key={i} className="flex items-center gap-1 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-sm font-medium border border-teal-200">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {s.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 mb-4">まだ確認者がいません</p>
        )}

        {/* 見ましたボタン */}
        {isBeforeJoinDate ? (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5">
            <span className="text-slate-400 text-sm">入職前の報告書のため確認不要です</span>
          </div>
        ) : alreadySigned ? (
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-teal-700 font-bold text-sm">確認済みです</span>
          </div>
        ) : (
          <button
            onClick={handleSign}
            disabled={signing || !session?.staffId}
            className="w-full bg-teal-500 text-white rounded-xl py-4 font-bold text-base hover:bg-teal-600 active:bg-teal-700 transition-colors disabled:opacity-40"
          >
            {signing ? '送信中...' : '✓ 見ました'}
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center mt-4 mb-2">登録: {fmtDate(report.createdAt)}</p>
    </div>
  )
}
