'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Header from './components/Header'

interface Notice {
  id: number
  content: string
  createdAt: string
  staff: { name: string }
}

interface MealChange {
  id: number
  createdAt: string
  changeDate: string
  breakfast: boolean
  lunch: boolean
  dinner: boolean
  changeType: string
  resident: { name: string }
  staff: { name: string }
}

interface CommentRecord {
  id: number
  category: string
  content: string
  recordedAt: string
  staff: { name: string }
  resident: { roomNumber: string; name: string }
}

type MainTab = 'notice' | 'comment'
type NoticeFilter = 'all' | 'notice' | 'meal'

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
  const [tab, setTab] = useState<MainTab>('notice')
  const [filter, setFilter] = useState<NoticeFilter>('all')
  const [notices, setNotices] = useState<Notice[]>([])
  const [mealChanges, setMealChanges] = useState<MealChange[]>([])
  const [comments, setComments] = useState<CommentRecord[]>([])
  const [commentDateFrom, setCommentDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10)
  })
  const [commentDateTo, setCommentDateTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [newNotice, setNewNotice] = useState('')
  const [staffId, setStaffId] = useState('')
  const [posting, setPosting] = useState(false)

  const loadNotices = useCallback(async () => {
    const [n, m] = await Promise.all([
      fetch('/api/notices?limit=100').then(r => r.json()),
      fetch('/api/meal-changes?limit=100').then(r => r.json()),
    ])
    setNotices(n)
    setMealChanges(m)
  }, [])

  const loadComments = useCallback(async () => {
    const r = await fetch(`/api/records/comment?dateFrom=${commentDateFrom}&dateTo=${commentDateTo}`)
    setComments(await r.json())
  }, [commentDateFrom, commentDateTo])

  useEffect(() => { loadNotices() }, [loadNotices])
  useEffect(() => { if (tab === 'comment') loadComments() }, [tab, loadComments])
  useEffect(() => { setStaffId(localStorage.getItem('staffId') || '') }, [])

  const postNotice = async () => {
    if (!newNotice.trim() || !staffId) return
    setPosting(true)
    await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newNotice, staffId: Number(staffId) }),
    })
    setNewNotice('')
    await loadNotices()
    setPosting(false)
  }

  const deleteNotice = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await fetch(`/api/notices/${id}`, { method: 'DELETE' })
    setNotices(prev => prev.filter(n => n.id !== id))
  }

  type FeedItem = { ts: Date; type: 'notice'; notice: Notice } | { ts: Date; type: 'meal'; meal: MealChange }
  const feed: FeedItem[] = []
  if (filter !== 'meal') notices.forEach(n => feed.push({ ts: new Date(n.createdAt), type: 'notice', notice: n }))
  if (filter !== 'notice') mealChanges.forEach(m => feed.push({ ts: new Date(m.createdAt), type: 'meal', meal: m }))
  feed.sort((a, b) => b.ts.getTime() - a.ts.getTime())

  const mealLabel = (m: MealChange) => {
    const times = [m.breakfast && '朝', m.lunch && '昼', m.dinner && '夕'].filter(Boolean).join('・')
    return `${fmtDate(m.createdAt)}　${m.resident.name} / ${fmtDay(m.changeDate)} ${times}　${m.changeType}`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header facilityName={facilityName} />
      <div className="flex border-b border-gray-200 bg-white sticky top-14 z-10">
        {(['notice', 'comment'] as MainTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium ${tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
            {t === 'notice' ? '申し送り' : 'コメント'}
          </button>
        ))}
      </div>

      {tab === 'notice' && (
        <div>
          <div className="flex gap-2 px-4 py-2 bg-white border-b">
            {(['all', 'notice', 'meal'] as NoticeFilter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {f === 'all' ? '全て' : f === 'notice' ? '申し送り' : '食事変更'}
              </button>
            ))}
          </div>
          <div className="px-4 py-3 bg-white border-b">
            <textarea value={newNotice} onChange={e => setNewNotice(e.target.value)}
              placeholder="申し送りを入力..."
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none h-20" />
            <button onClick={postNotice} disabled={!newNotice.trim() || !staffId || posting}
              className="mt-2 w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40">
              {staffId ? '投稿する' : '担当者を選択してください'}
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {feed.map((item, i) => (
              <div key={i} className="px-4 py-3 bg-white">
                {item.type === 'notice' ? (
                  <div>
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-gray-400">{fmtDate(item.notice.createdAt)}　{item.notice.staff.name}</p>
                      <button onClick={() => deleteNotice(item.notice.id)} className="text-xs text-red-400 ml-2">削除</button>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{item.notice.content}</p>
                  </div>
                ) : (
                  <p className="text-xs text-orange-500">🍽 {mealLabel(item.meal)}</p>
                )}
              </div>
            ))}
            {feed.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">記録がありません</p>}
          </div>
        </div>
      )}

      {tab === 'comment' && (
        <div>
          <div className="flex gap-2 px-4 py-2 bg-white border-b items-center">
            <span className="text-xs text-gray-500">期間:</span>
            <input type="date" value={commentDateFrom} onChange={e => setCommentDateFrom(e.target.value)} className="border rounded px-2 py-1 text-xs" />
            <span className="text-xs">〜</span>
            <input type="date" value={commentDateTo} onChange={e => setCommentDateTo(e.target.value)} className="border rounded px-2 py-1 text-xs" />
          </div>
          <div className="divide-y divide-gray-100">
            {comments.map(c => (
              <div key={c.id} className="px-4 py-3 bg-white">
                <p className="text-xs text-gray-400">{fmtDate(c.recordedAt)}　{c.category} / {c.resident.roomNumber}　{c.resident.name} / {c.staff.name}</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">コメントがありません</p>}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3">
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
          <Link href="/residents" className="bg-blue-600 text-white rounded-xl py-4 text-center font-semibold text-sm flex flex-col items-center gap-1">
            <span className="text-2xl">👥</span>利用者一覧
          </Link>
          <Link href="/meal-change" className="bg-orange-500 text-white rounded-xl py-4 text-center font-semibold text-sm flex flex-col items-center gap-1">
            <span className="text-2xl">🍽</span>食事変更
          </Link>
          <Link href="/accident-report" className="bg-red-500 text-white rounded-xl py-4 text-center font-semibold text-sm flex flex-col items-center gap-1">
            <span className="text-2xl">📋</span>事故報告書
          </Link>
          <Link href="/admin" className="bg-gray-600 text-white rounded-xl py-4 text-center font-semibold text-sm flex flex-col items-center gap-1">
            <span className="text-2xl">⚙️</span>管理者画面
          </Link>
        </div>
      </div>
      <div className="h-32" />
    </div>
  )
}
