'use client'
import { useEffect, useState, use, useRef } from 'react'
import Header from '@/app/components/Header'

interface Resident { id: number; name: string; nameKana: string; roomNumber: string; floor: string; gender: string; careLevel: string }

interface DayRecord {
  id: string
  type: 'vital' | 'meal' | 'medication' | 'night-patrol' | 'comment'
  recordedAt: string
  staff: { name: string }
  summary: string
}

const TYPE_INFO: Record<string, { label: string; color: string; border: string }> = {
  vital:          { label: 'バイタル',  color: 'bg-red-100 text-red-600',       border: 'border-l-red-400' },
  meal:           { label: '食事',      color: 'bg-orange-100 text-orange-600', border: 'border-l-orange-400' },
  medication:     { label: '服薬',      color: 'bg-green-100 text-green-700',   border: 'border-l-green-500' },
  'night-patrol': { label: '夜間巡視', color: 'bg-indigo-100 text-indigo-600', border: 'border-l-indigo-500' },
  comment:        { label: 'コメント',  color: 'bg-teal-100 text-teal-700',     border: 'border-l-teal-500' },
}

const DAYS = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日（${DAYS[d.getDay()]}）`
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function CareRecordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [resident, setResident] = useState<Resident | null>(null)
  const [records, setRecords] = useState<DayRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  // スワイプ検出用
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    fetch(`/api/residents/${id}`).then(r => r.json()).then(setResident)
  }, [id])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/records/today?date=${date}&residentId=${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setRecords(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setRecords([]); setLoading(false) })
  }, [date, id])

  const today = new Date().toISOString().slice(0, 10)
  const isToday = date === today

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 50) return
    if (dx < 0) {
      // 左スワイプ → 次の日（未来）
      if (!isToday) setDate(d => addDays(d, 1))
    } else {
      // 右スワイプ → 前の日（過去）
      setDate(d => addDays(d, -1))
    }
  }

  return (
    <div
      className="min-h-screen bg-slate-100 pb-8"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Header title="ケア記録" backUrl={`/residents/${id}`} />

      {/* 利用者名バー */}
      {resident && (
        <div className="bg-cyan-500 px-4 py-2.5">
          <p className="text-white text-sm font-medium">{resident.roomNumber}号　{resident.name}</p>
        </div>
      )}

      {/* 日付ナビゲーション */}
      <div className="bg-white sticky top-14 z-10 border-b border-slate-200 flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setDate(d => addDays(d, -1))}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="text-center">
          <p className="font-bold text-slate-700 text-base">{formatDate(date)}</p>
          {isToday && <p className="text-xs text-teal-600 font-medium">今日</p>}
        </div>

        <button
          onClick={() => { if (!isToday) setDate(d => addDays(d, 1)) }}
          disabled={isToday}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
            isToday ? 'text-slate-300 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 記録一覧 */}
      <div className="px-4 mt-3 space-y-1.5">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">読み込み中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">この日の記録がありません</div>
        ) : (
          records.map(r => {
            const info = TYPE_INFO[r.type] ?? { label: r.type, color: 'bg-slate-100 text-slate-600', border: 'border-l-slate-400' }
            const time = new Date(r.recordedAt).toLocaleTimeString('ja', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={r.id} className={`bg-white rounded-xl shadow-sm px-4 py-3 border-l-4 ${info.border}`}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs text-slate-400 font-mono">{time}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${info.color}`}>{info.label}</span>
                  <span className="text-xs text-slate-400 ml-auto">{r.staff.name}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{r.summary}</p>
              </div>
            )
          })
        )}
      </div>

      {/* 今日へ戻るボタン（今日以外の時） */}
      {!isToday && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <button
            onClick={() => setDate(today)}
            className="bg-teal-500 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg hover:bg-teal-600 transition-colors"
          >
            今日へ戻る
          </button>
        </div>
      )}
    </div>
  )
}
