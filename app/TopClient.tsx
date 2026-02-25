'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Header from './components/Header'
import { useSession } from './components/SessionContext'

interface Notice {
  id: number; content: string; createdAt: string
  staff: { name: string }
  resident: { name: string; roomNumber: string } | null
}
interface MealChange {
  id: number; createdAt: string; changeDate: string
  breakfast: boolean; lunch: boolean; dinner: boolean; changeType: string
  resident: { name: string }; staff: { name: string }
}
interface AccidentReport {
  id: number; accidentAt: string; location: string; accidentType: string
  description: string; createdAt: string; staffSignatures: string
  resident: { name: string; roomNumber: string }
  reporter: { name: string }
}
interface CommentRecord {
  id: number; category: string; content: string; recordedAt: string
  staff: { name: string }; resident: { roomNumber: string; name: string }
}

type MainTab = 'notice' | 'comment'

const DAYS = ['日', '月', '火', '水', '木', '金', '土']
function fmtDate(s: string) {
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function fmtDay(s: string) {
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]})`
}

export default function TopClient({ facilityName }: { facilityName: string }) {
  const session = useSession()
  const [tab, setTab] = useState<MainTab>('notice')
  const [notices, setNotices] = useState<Notice[]>([])
  const [mealChanges, setMealChanges] = useState<MealChange[]>([])
  const [accidentReports, setAccidentReports] = useState<AccidentReport[]>([])
  const [comments, setComments] = useState<CommentRecord[]>([])
  const [commentDateFrom, setCommentDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10)
  })
  const [commentDateTo, setCommentDateTo] = useState(() => new Date().toISOString().slice(0, 10))

  const loadFeed = useCallback(async () => {
    try {
      const [n, m, a] = await Promise.all([
        fetch('/api/notices?limit=200').then(r => r.ok ? r.json() : null),
        fetch('/api/meal-changes?limit=100').then(r => r.ok ? r.json() : null),
        fetch('/api/accident-report?limit=50').then(r => r.ok ? r.json() : null),
      ])
      if (Array.isArray(n)) setNotices(n)
      if (Array.isArray(m)) setMealChanges(m)
      if (Array.isArray(a)) setAccidentReports(a)
    } catch { /* silent */ }
  }, [])

  const loadComments = useCallback(async () => {
    try {
      const r = await fetch(`/api/records/comment?dateFrom=${commentDateFrom}&dateTo=${commentDateTo}`)
      const data = r.ok ? await r.json() : []
      setComments(Array.isArray(data) ? data : [])
    } catch { setComments([]) }
  }, [commentDateFrom, commentDateTo])

  useEffect(() => { loadFeed() }, [loadFeed])
  useEffect(() => { if (tab === 'comment') loadComments() }, [tab, loadComments])

  type FeedItem =
    | { ts: Date; type: 'notice'; notice: Notice }
    | { ts: Date; type: 'meal'; meal: MealChange }
    | { ts: Date; type: 'accident'; accident: AccidentReport }

  const feed: FeedItem[] = [
    ...notices.map(n => ({ ts: new Date(n.createdAt), type: 'notice' as const, notice: n })),
    ...mealChanges.map(m => ({ ts: new Date(m.createdAt), type: 'meal' as const, meal: m })),
    ...accidentReports.map(a => ({ ts: new Date(a.createdAt), type: 'accident' as const, accident: a })),
  ]
  feed.sort((a, b) => b.ts.getTime() - a.ts.getTime())

  const mealLabel = (m: MealChange) => {
    const times = [m.breakfast && '朝', m.lunch && '昼', m.dinner && '夕'].filter(Boolean).join('・')
    return `${m.resident.name}　${fmtDay(m.changeDate)} ${times}　${m.changeType}`
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <Header title={facilityName} facilityName={facilityName} />

      {/* タブ */}
      <div className="flex bg-white sticky top-14 z-20 border-b border-slate-200">
        {(['notice', 'comment'] as MainTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-sm font-bold transition-colors ${
              tab === t ? 'text-teal-600 border-b-2 border-teal-500 bg-white' : 'text-slate-400 bg-white'
            }`}
          >
            {t === 'notice' ? '申し送り' : 'コメント'}
          </button>
        ))}
      </div>

      {tab === 'notice' && (
        <div>
          {/* 申し送り投稿ページへのリンク */}
          <Link
            href="/notices"
            className="flex items-center justify-center gap-2 mx-4 mt-3 py-3 rounded-xl bg-teal-500 text-white font-bold text-sm hover:bg-teal-600 active:bg-teal-700 transition-colors shadow-sm"
          >
            <span>📨</span>
            <span>申し送りを書く</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* 最新フィードプレビュー */}
          <div className="space-y-1 px-4 mt-3">
            {feed.map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm px-4 py-3">
                {item.type === 'notice' ? (
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-teal-600">{item.notice.staff.name}</span>
                      {item.notice.resident ? (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                          {item.notice.resident.roomNumber}号 {item.notice.resident.name}
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">施設</span>
                      )}
                      <span className="text-xs text-slate-400">{fmtDate(item.notice.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-1.5 whitespace-pre-wrap text-slate-700 leading-relaxed line-clamp-3">{item.notice.content}</p>
                  </div>
                ) : item.type === 'meal' ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-orange-500 text-sm">🍽</span>
                      <span className="text-xs text-slate-400">{fmtDate(item.meal.createdAt)}　{item.meal.staff.name}</span>
                    </div>
                    <p className="text-sm text-orange-600 font-medium">{mealLabel(item.meal)}</p>
                  </div>
                ) : (
                  <Link href={`/accident-report/${item.accident.id}`} className="block">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-red-500 text-sm">🚨</span>
                      <span className="text-xs font-bold text-red-500">事故報告書</span>
                      <span className="text-xs text-slate-400">{fmtDate(item.accident.accidentAt)}</span>
                      {(() => {
                        const n = (() => { try { return JSON.parse(item.accident.staffSignatures || '[]').length } catch { return 0 } })()
                        return n === 0
                          ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">未確認</span>
                          : <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">確認 {n}名</span>
                      })()}
                    </div>
                    <p className="text-sm text-red-600 font-medium">
                      {item.accident.resident.roomNumber}号 {item.accident.resident.name}
                      {item.accident.accidentType && `　${item.accident.accidentType}`}
                    </p>
                  </Link>
                )}
              </div>
            ))}
            {feed.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">記録がありません</div>
            )}
          </div>
        </div>
      )}

      {tab === 'comment' && (
        <div>
          <div className="mx-4 my-3 bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">期間</span>
            <input type="date" value={commentDateFrom} onChange={e => setCommentDateFrom(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-teal-400" />
            <span className="text-xs text-slate-400">〜</span>
            <input type="date" value={commentDateTo} onChange={e => setCommentDateTo(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-teal-400" />
            <button onClick={loadComments}
              className="bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-600 transition-colors">
              表示
            </button>
          </div>
          <div className="space-y-1 px-4">
            {comments.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{c.category}</span>
                  <span className="text-xs font-bold text-teal-600">{c.resident.roomNumber}号　{c.resident.name}</span>
                  <span className="text-xs text-slate-400">{fmtDate(c.recordedAt)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap text-slate-700 leading-relaxed">{c.content}</p>
                <p className="text-xs text-slate-400 mt-1">{c.staff.name}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">コメントがありません</div>
            )}
          </div>
        </div>
      )}

      {/* 固定ボトムナビ */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 shadow-lg z-20">
        <div className="flex gap-1 px-2 py-2">
          <Link href="/notices"
            className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl bg-teal-400 text-white text-center hover:bg-teal-500 active:bg-teal-600 transition-colors">
            <span className="text-xl leading-none">📨</span>
            <span className="text-xs font-bold leading-tight">申し送り</span>
          </Link>
          <Link href="/residents"
            className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl bg-teal-500 text-white text-center hover:bg-teal-600 active:bg-teal-700 transition-colors">
            <span className="text-xl leading-none">👥</span>
            <span className="text-xs font-bold leading-tight">利用者</span>
          </Link>
          <Link href="/bulk-input"
            className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl bg-teal-600 text-white text-center hover:bg-teal-700 active:bg-teal-800 transition-colors">
            <span className="text-xl leading-none">📝</span>
            <span className="text-xs font-bold leading-tight">一括入力</span>
          </Link>
          <Link href="/meal-change"
            className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl bg-orange-400 text-white text-center hover:bg-orange-500 active:bg-orange-600 transition-colors">
            <span className="text-xl leading-none">🍽</span>
            <span className="text-xs font-bold leading-tight">食事変更</span>
          </Link>
          <Link href="/accident-report"
            className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl bg-red-400 text-white text-center hover:bg-red-500 active:bg-red-600 transition-colors">
            <span className="text-xl leading-none">📋</span>
            <span className="text-xs font-bold leading-tight">事故報告</span>
          </Link>
          {session?.isAdmin && (
            <Link href="/admin"
              className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl bg-slate-500 text-white text-center hover:bg-slate-600 active:bg-slate-700 transition-colors">
              <span className="text-xl leading-none">⚙️</span>
              <span className="text-xs font-bold leading-tight">管理者</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
