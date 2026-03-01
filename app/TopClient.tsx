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
interface GridVital {
  recordedAt: string
  systolic: number | null; diastolic: number | null
  pulse: number | null; temperature: number | null; spo2: number | null
  staff: string
}
interface GridMealSlot { mainDish: number | null; sideDish: number | null; staff: string }
interface GridPatrol { patrolTime: string; status: string; comment: string; staff: string }
interface GridMedication {
  beforeBreakfast: boolean|null; afterBreakfast: boolean|null
  beforeLunch: boolean|null; afterLunch: boolean|null
  beforeDinner: boolean|null; afterDinner: boolean|null
  bedtime: boolean|null; eyeDrop: number|null
}
interface GridResident {
  id: number; name: string; roomNumber: string; floor: string
  vitals: GridVital[]
  meals: { '朝': GridMealSlot | null; '昼': GridMealSlot | null; '夕': GridMealSlot | null }
  medication: GridMedication | null
  nightPatrols: GridPatrol[]
}

type MainTab = 'notice' | 'comment' | 'today'

interface CommentRecord {
  id: number
  recordedAt: string
  category: string
  content: string
  staff: { name: string }
  resident: { name: string; roomNumber: string }
}

const DAYS = ['日', '月', '火', '水', '木', '金', '土']
function fmtDate(s: string) {
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function fmtDay(s: string) {
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]})`
}

function fmtTime(s: string) {
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function vitalText(v: GridVital) {
  return [
    v.systolic != null && v.diastolic != null ? `${v.systolic}/${v.diastolic}` : null,
    v.pulse != null ? `脈${v.pulse}` : null,
    v.temperature != null ? `${v.temperature}℃` : null,
    v.spo2 != null ? `SpO₂${v.spo2}%` : null,
  ].filter(Boolean).join(' ')
}

// 服薬チェック：済なら緑、未入力ならグレー
function MedDot({ val }: { val: boolean|null }) {
  return val === true
    ? <span className="text-green-500 font-bold">●</span>
    : <span className="text-slate-300">─</span>
}

const MED_TIMING: Record<'朝'|'昼'|'夕', { before: keyof GridMedication; beforeLabel: string; after: keyof GridMedication; afterLabel: string }> = {
  '朝': { before: 'beforeBreakfast', beforeLabel: '朝食前', after: 'afterBreakfast', afterLabel: '朝食後' },
  '昼': { before: 'beforeLunch',     beforeLabel: '昼食前', after: 'afterLunch',     afterLabel: '昼食後' },
  '夕': { before: 'beforeDinner',    beforeLabel: '夕食前', after: 'afterDinner',    afterLabel: '夕食後' },
}

function ResidentGridCard({ resident }: { resident: GridResident }) {
  const hasVital = resident.vitals.length > 0
  const hasPatrol = resident.nightPatrols.length > 0
  const med = resident.medication

  const labelCell = 'w-14 flex-shrink-0 flex items-center justify-center bg-slate-50 border-r border-slate-100 text-[10px] font-bold text-slate-400 py-2 px-1 text-center leading-tight'
  const emptyLabel = 'w-14 flex-shrink-0 bg-slate-50 border-r border-slate-100 py-2'
  const valueCell = 'flex-1 px-2.5 py-2 text-xs leading-relaxed'

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* 利用者ヘッダー */}
      <Link href={`/residents/${resident.id}`} className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 transition-colors">
        <span className="text-xs font-bold text-teal-100">{resident.roomNumber}号</span>
        <span className="text-sm font-bold text-white">{resident.name}</span>
        {resident.floor && <span className="text-xs text-teal-200 ml-auto">{resident.floor}</span>}
      </Link>

      {/* バイタル行 */}
      {hasVital ? (
        resident.vitals.map((v, i) => (
          <div key={i} className="flex border-t border-slate-100">
            {i === 0 ? <div className={labelCell}>バイタル</div> : <div className={emptyLabel} />}
            <div className={`${valueCell} text-slate-700`}>
              <span className="text-slate-400 mr-1.5">{fmtTime(v.recordedAt)}</span>
              {vitalText(v)}
            </div>
          </div>
        ))
      ) : (
        <div className="flex border-t border-slate-100">
          <div className={labelCell}>バイタル</div>
          <div className={`${valueCell} text-slate-300`}>未入力</div>
        </div>
      )}

      {/* 食事・服薬行（朝/昼/夕を縦3行、食事量＋服薬チェックを横並び） */}
      {(['朝', '昼', '夕'] as const).map((t, i) => {
        const slot = resident.meals[t]
        const timing = MED_TIMING[t]
        return (
          <div key={t} className="flex border-t border-slate-100">
            {i === 0 ? <div className={labelCell}>食事<br />服薬</div> : <div className={emptyLabel} />}
            <div className={`${valueCell} flex items-center gap-2 flex-wrap`}>
              {/* 食事量 */}
              {slot ? (
                <span className="text-slate-700">
                  <span className="text-slate-400 mr-1">{t}</span>
                  {slot.mainDish ?? '─'}/{slot.sideDish ?? '─'}
                </span>
              ) : (
                <span className="text-slate-300">
                  <span className="mr-1">{t}</span>─/─
                </span>
              )}
              {/* 服薬チェック */}
              <span className="flex items-center gap-0.5 text-xs">
                <MedDot val={med?.[timing.before] === true ? true : med?.[timing.before] === false ? false : null} /><span className={`${med?.[timing.before] === true ? 'text-slate-600' : 'text-slate-300'}`}>{timing.beforeLabel}</span>
                <MedDot val={med?.[timing.after] === true ? true : med?.[timing.after] === false ? false : null} /><span className={`ml-0.5 ${med?.[timing.after] === true ? 'text-slate-600' : 'text-slate-300'}`}>{timing.afterLabel}</span>
              </span>
            </div>
          </div>
        )
      })}

      {/* 眠前・点眼行 */}
      <div className="flex border-t border-slate-100">
        <div className={labelCell}>眠前<br />点眼</div>
        <div className={`${valueCell} flex items-center gap-3 text-xs`}>
          <span className="flex items-center gap-0.5">
            <MedDot val={med?.bedtime ?? null} />
            <span className={med?.bedtime === true ? 'text-slate-600' : 'text-slate-300'}>眠前</span>
          </span>
          <span className={med?.eyeDrop != null && med.eyeDrop > 0 ? 'text-green-600 font-bold' : 'text-slate-300'}>
            点眼{med?.eyeDrop != null && med.eyeDrop > 0 ? `${med.eyeDrop}回` : '未入力'}
          </span>
        </div>
      </div>

      {/* 夜間巡視行 */}
      {hasPatrol ? (
        resident.nightPatrols.map((p, i) => (
          <div key={i} className="flex border-t border-slate-100">
            {i === 0 ? <div className={labelCell}>夜間<br />巡視</div> : <div className={emptyLabel} />}
            <div className={`${valueCell} text-slate-700`}>
              <span className="text-slate-400 mr-1.5">{fmtTime(p.patrolTime)}</span>
              {p.status}
              {p.comment && <span className="text-slate-400 ml-1.5">{p.comment}</span>}
            </div>
          </div>
        ))
      ) : (
        <div className="flex border-t border-slate-100">
          <div className={labelCell}>夜間<br />巡視</div>
          <div className={`${valueCell} text-slate-300`}>未入力</div>
        </div>
      )}
    </div>
  )
}

export default function TopClient({ facilityName }: { facilityName: string }) {
  const session = useSession()
  const [tab, setTab] = useState<MainTab>('notice')
  const [notices, setNotices] = useState<Notice[]>([])
  const [mealChanges, setMealChanges] = useState<MealChange[]>([])
  const [accidentReports, setAccidentReports] = useState<AccidentReport[]>([])
  const [gridResidents, setGridResidents] = useState<GridResident[]>([])
  const [gridFloors, setGridFloors] = useState<string[]>([])
  const [floorFilter, setFloorFilter] = useState('')
  const [todayLoading, setTodayLoading] = useState(false)
  const [selectedDateIdx, setSelectedDateIdx] = useState(0)
  const [commentRecords, setCommentRecords] = useState<CommentRecord[]>([])
  const [commentDateIdx, setCommentDateIdx] = useState(0)
  const [commentLoading, setCommentLoading] = useState(false)

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

  const loadTodayGrid = useCallback(async () => {
    setTodayLoading(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const r = await fetch(`/api/records/today-grid?date=${today}`)
      const data = r.ok ? await r.json() : {}
      setGridResidents(Array.isArray(data.residents) ? data.residents : [])
      setGridFloors(Array.isArray(data.floors) ? data.floors : [])
    } catch { setGridResidents([]); setGridFloors([]) }
    setTodayLoading(false)
  }, [])

  const loadComments = useCallback(async () => {
    setCommentLoading(true)
    try {
      const r = await fetch('/api/records/comment?dateFrom=&dateTo=')
      const data = r.ok ? await r.json() : []
      setCommentRecords(Array.isArray(data) ? data : [])
    } catch { setCommentRecords([]) }
    setCommentLoading(false)
  }, [])

  useEffect(() => { loadFeed() }, [loadFeed])
  useEffect(() => { if (tab === 'today') loadTodayGrid() }, [tab, loadTodayGrid])
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

  // 日付ごとにグループ化
  const feedDates = Array.from(new Set(feed.map(item => {
    const d = item.ts
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }))).sort((a, b) => b.localeCompare(a))
  const feedByDate: Record<string, FeedItem[]> = {}
  for (const item of feed) {
    const d = item.ts
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!feedByDate[key]) feedByDate[key] = []
    feedByDate[key].push(item)
  }
  const safeIdx = Math.min(selectedDateIdx, Math.max(0, feedDates.length - 1))
  const currentDateKey = feedDates[safeIdx] ?? null
  const currentFeed = currentDateKey ? feedByDate[currentDateKey] : []

  const mealLabel = (m: MealChange) => {
    const times = [m.breakfast && '朝', m.lunch && '昼', m.dinner && '夕'].filter(Boolean).join('・')
    return `${m.resident.name}　${fmtDay(m.changeDate)} ${times}　${m.changeType}`
  }

  // コメントタブ：日付ごとグループ
  const commentSorted = [...commentRecords].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
  const commentDates = Array.from(new Set(commentSorted.map(c => {
    const d = new Date(c.recordedAt)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }))).sort((a, b) => b.localeCompare(a))
  const commentByDate: Record<string, CommentRecord[]> = {}
  for (const c of commentSorted) {
    const d = new Date(c.recordedAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!commentByDate[key]) commentByDate[key] = []
    commentByDate[key].push(c)
  }
  const safeCommentIdx = Math.min(commentDateIdx, Math.max(0, commentDates.length - 1))
  const currentCommentKey = commentDates[safeCommentIdx] ?? null
  const currentComments = currentCommentKey ? commentByDate[currentCommentKey] : []

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <Header title={facilityName} facilityName={facilityName} />

      {/* タブ */}
      <div className="flex bg-white sticky top-14 z-20 border-b border-slate-200">
        {([['notice', '申し送り'], ['comment', 'コメント'], ['today', '本日のケア記録']] as [MainTab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-xs font-bold transition-colors ${
              tab === t ? 'text-teal-600 border-b-2 border-teal-500 bg-white' : 'text-slate-400 bg-white'
            }`}
          >
            {label}
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

          {/* 日付ナビゲーションバー */}
          {feedDates.length > 0 && (
            <div className="flex items-center justify-center gap-2 bg-white border-b border-slate-200 px-4 py-2.5 sticky top-[calc(3.5rem+2.75rem)] z-10">
              <button
                onClick={() => setSelectedDateIdx(i => Math.min(i + 1, feedDates.length - 1))}
                disabled={safeIdx >= feedDates.length - 1}
                className="p-1.5 rounded-lg text-teal-500 hover:bg-teal-50 active:bg-teal-100 disabled:text-slate-200 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-sm font-bold text-slate-700 min-w-[9rem] text-center">
                {currentDateKey && (() => {
                  const d = new Date(currentDateKey)
                  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAYS[d.getDay()]}）`
                })()}
              </span>
              <button
                onClick={() => setSelectedDateIdx(i => Math.max(i - 1, 0))}
                disabled={safeIdx <= 0}
                className="p-1.5 rounded-lg text-teal-500 hover:bg-teal-50 active:bg-teal-100 disabled:text-slate-200 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}

          {/* フィード */}
          <div className="space-y-1 px-4 mt-3">
            {currentFeed.map((item, i) => (
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
                    <div className="flex justify-end mt-1.5">
                      <span className="text-xs text-red-400 font-medium">詳細を確認する →</span>
                    </div>
                  </Link>
                )}
              </div>
            ))}
            {feedDates.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">記録がありません</div>
            )}
          </div>
        </div>
      )}

      {tab === 'comment' && (
        <div>
          {commentLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">読み込み中...</div>
          ) : (
            <>
              {/* 日付ナビゲーション */}
              {commentDates.length > 0 && (
                <div className="flex items-center justify-center gap-2 bg-white border-b border-slate-200 px-4 py-2.5 sticky top-[calc(3.5rem+2.75rem)] z-10">
                  <button
                    onClick={() => setCommentDateIdx(i => Math.min(i + 1, commentDates.length - 1))}
                    disabled={safeCommentIdx >= commentDates.length - 1}
                    className="p-1.5 rounded-lg text-teal-500 hover:bg-teal-50 active:bg-teal-100 disabled:text-slate-200 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <span className="text-sm font-bold text-slate-700 min-w-[9rem] text-center">
                    {currentCommentKey && (() => {
                      const d = new Date(currentCommentKey)
                      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAYS[d.getDay()]}）`
                    })()}
                  </span>
                  <button
                    onClick={() => setCommentDateIdx(i => Math.max(i - 1, 0))}
                    disabled={safeCommentIdx <= 0}
                    className="p-1.5 rounded-lg text-teal-500 hover:bg-teal-50 active:bg-teal-100 disabled:text-slate-200 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="space-y-1 px-4 mt-3">
                {currentComments.map((c, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                        {c.resident.roomNumber}号 {c.resident.name}
                      </span>
                      <span className="text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full font-medium">{c.category}</span>
                      <span className="text-xs font-bold text-teal-600">{c.staff.name}</span>
                      <span className="text-xs text-slate-400">{fmtDate(c.recordedAt)}</span>
                    </div>
                    <p className="text-sm mt-1.5 whitespace-pre-wrap text-slate-700 leading-relaxed">{c.content}</p>
                  </div>
                ))}
                {commentDates.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm">コメントがありません</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'today' && (
        <div>
          {/* フロアフィルター */}
          {gridFloors.length > 0 && (
            <div className="bg-white border-b border-slate-200 px-4 py-2.5 sticky top-[calc(3.5rem+2.75rem)] z-10">
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                <button
                  onClick={() => setFloorFilter('')}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    !floorFilter ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >全て</button>
                {gridFloors.map(f => (
                  <button
                    key={f}
                    onClick={() => setFloorFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      floorFilter === f ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >{f}</button>
                ))}
              </div>
            </div>
          )}

          {/* ヘッダー行（日付・更新） */}
          <div className="flex items-center justify-between mx-4 my-2.5">
            <span className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('ja', { month: 'long', day: 'numeric', weekday: 'short' })}の記録
            </span>
            <button onClick={loadTodayGrid}
              className="bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-600 transition-colors">
              更新
            </button>
          </div>

          {todayLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">読み込み中...</div>
          ) : (
            <div className="space-y-2 px-3 pb-4">
              {(floorFilter ? gridResidents.filter(r => r.floor === floorFilter) : gridResidents).map(resident => (
                <ResidentGridCard key={resident.id} resident={resident} />
              ))}
              {gridResidents.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">入居者が登録されていません</div>
              )}
            </div>
          )}
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
