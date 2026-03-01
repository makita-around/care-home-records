'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/app/components/Header'
import { useSession } from '@/app/components/SessionContext'

interface Resident { id: number; name: string; nameKana: string; roomNumber: string; floor: string; gender: string; birthDate: string; careLevel: string }

function calcAge(birthDate: string) {
  const b = new Date(birthDate); const today = new Date()
  let age = today.getFullYear() - b.getFullYear()
  if (today.getMonth() < b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) age--
  return age
}

const RECORD_TYPES = [
  { key: 'vital',        label: 'バイタル',    icon: '💓', color: 'bg-red-400',    border: 'border-l-red-400' },
  { key: 'meal',         label: '食事',         icon: '🍚', color: 'bg-orange-400', border: 'border-l-orange-400' },
  { key: 'medication',   label: '服薬',         icon: '💊', color: 'bg-green-500',  border: 'border-l-green-500' },
  { key: 'night-patrol', label: '夜間巡視',    icon: '🌙', color: 'bg-indigo-500', border: 'border-l-indigo-500' },
  { key: 'comment',      label: 'コメント',    icon: '📝', color: 'bg-teal-500',   border: 'border-l-teal-500' },
]

type HistoryRecord = {
  id: number
  staffId: number
  type: string
  recordedAt: string
  resident: { name: string; roomNumber: string }
  staff: string
  content: string
  rawData?: Record<string, unknown>
}

const TYPE_TO_API: Record<string, string> = {
  'バイタル': 'vital',
  '食事': 'meal',
  '服薬・点眼': 'medication',
  '夜間巡視': 'night-patrol',
}
function typeToApi(type: string): string {
  if (type.startsWith('コメント')) return 'comment'
  return TYPE_TO_API[type] || ''
}

const TYPE_BADGE: Record<string, string> = {
  'バイタル': 'bg-blue-100 text-blue-700',
  '食事': 'bg-orange-100 text-orange-700',
  '服薬・点眼': 'bg-green-100 text-green-700',
  '夜間巡視': 'bg-indigo-100 text-indigo-700',
}
function typeBadge(type: string) {
  if (type.startsWith('コメント')) return 'bg-teal-100 text-teal-700'
  return TYPE_BADGE[type] || 'bg-slate-100 text-slate-600'
}

const DAYS = ['日', '月', '火', '水', '木', '金', '土']
function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const MED_EDIT_LABELS: { key: string; label: string }[] = [
  { key: 'beforeBreakfast', label: '朝食前' }, { key: 'afterBreakfast', label: '朝食後' },
  { key: 'beforeLunch', label: '昼食前' }, { key: 'afterLunch', label: '昼食後' },
  { key: 'beforeDinner', label: '夕食前' }, { key: 'afterDinner', label: '夕食後' },
  { key: 'bedtime', label: '眠前' }, { key: 'eyeDrop', label: '点眼' },
]

export default function ResidentDetailClient({ resident }: { resident: Resident }) {
  const session = useSession()
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [editRow, setEditRow] = useState<HistoryRecord | null>(null)
  const [editForm, setEditForm] = useState<Record<string, unknown>>({})
  const [editSaving, setEditSaving] = useState(false)

  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams({
        residentId: String(resident.id),
        dateFrom: isoDate(sevenDaysAgo),
        dateTo: isoDate(today),
        types: 'vital,meal,medication,night-patrol,comment',
      })
      const res = await fetch(`/api/records/search?${params}`)
      const data = res.ok ? await res.json() : []
      // 新しい順にソート
      const sorted = [...(Array.isArray(data) ? data : [])].sort(
        (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      )
      setHistoryRecords(sorted)
    } catch { setHistoryRecords([]) }
    setHistoryLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resident.id])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleDelete = async (row: HistoryRecord) => {
    if (!confirm(`この記録を削除しますか？\n${fmtDateTime(row.recordedAt)} ${row.type} ${row.content}`)) return
    const api = typeToApi(row.type)
    if (!api) return
    const res = await fetch(`/api/records/${api}/${row.id}`, { method: 'DELETE' })
    if (res.ok) {
      setHistoryRecords(prev => prev.filter(r => r.id !== row.id))
    } else {
      alert('削除に失敗しました')
    }
  }

  const handleEditOpen = (row: HistoryRecord) => {
    setEditRow(row)
    setEditForm({ ...(row.rawData ?? {}) })
  }

  const handleEditSave = async () => {
    if (!editRow) return
    const api = typeToApi(editRow.type)
    if (!api) return
    setEditSaving(true)
    const res = await fetch(`/api/records/${api}/${editRow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditSaving(false)
    if (res.ok) {
      setEditRow(null)
      loadHistory()
    } else {
      alert('保存に失敗しました')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header title="ケア記録" backUrl="/residents" />

      {/* 利用者情報カード */}
      <div className="bg-white mx-0 border-b border-slate-200 px-4 py-4 flex items-center gap-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
          resident.gender === '男' ? 'bg-blue-100' : 'bg-pink-100'
        }`}>
          <span className="text-3xl">{resident.gender === '男' ? '👴' : '👵'}</span>
        </div>
        <div>
          <p className="text-xs text-teal-600 font-bold">{resident.roomNumber}号　{resident.floor}</p>
          <p className="font-bold text-slate-800 text-xl leading-tight">{resident.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{resident.nameKana}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {resident.gender}性　{calcAge(resident.birthDate)}歳　{resident.careLevel}
          </p>
        </div>
      </div>

      {/* 記録種別リスト（アコーディオン風） */}
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        {RECORD_TYPES.map((rt, i) => (
          <Link
            key={rt.key}
            href={`/records/${rt.key}/${resident.id}`}
            className={`flex items-center gap-4 px-4 py-4 border-l-4 ${rt.border} hover:bg-slate-50 active:bg-slate-100 transition-colors ${
              i !== RECORD_TYPES.length - 1 ? 'border-b border-slate-100' : ''
            }`}
          >
            <div className={`w-10 h-10 rounded-full ${rt.color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-lg">{rt.icon}</span>
            </div>
            <span className="font-bold text-slate-700 text-base flex-1">{rt.label}</span>
            <svg className="text-slate-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* ケア記録（過去記録閲覧） */}
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        <Link
          href={`/residents/${resident.id}/care-records`}
          className="flex items-center gap-4 px-4 py-4 border-l-4 border-l-cyan-500 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📅</span>
          </div>
          <span className="font-bold text-slate-700 text-base flex-1">ケア記録</span>
          <svg className="text-slate-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* アセスメントシート */}
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        <Link
          href={`/assessment/${resident.id}`}
          className="flex items-center gap-4 px-4 py-4 border-l-4 border-l-purple-400 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📋</span>
          </div>
          <span className="font-bold text-slate-700 text-base flex-1">アセスメントシート</span>
          <svg className="text-slate-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* 記録履歴（直近7日間） */}
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="font-bold text-slate-700 text-sm">記録履歴（直近7日間）</p>
          <button onClick={loadHistory} className="text-xs text-teal-600 font-medium hover:text-teal-700">
            更新
          </button>
        </div>
        {historyLoading ? (
          <div className="text-center py-8 text-slate-400 text-sm">読み込み中...</div>
        ) : historyRecords.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">記録がありません</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historyRecords.map((rec, i) => {
              const isMine = session?.staffId != null && rec.staffId === session.staffId
              const api = typeToApi(rec.type)
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400 font-mono">{fmtDateTime(rec.recordedAt)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${typeBadge(rec.type)}`}>
                          {rec.type}
                        </span>
                        <span className="text-xs text-slate-500">{rec.staff}</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1 leading-relaxed">{rec.content}</p>
                    </div>
                    {isMine && api && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => handleEditOpen(rec)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="編集">✏️</button>
                        <button onClick={() => handleDelete(rec)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="削除">🗑️</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {editRow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-2xl rounded-t-2xl px-5 pt-5 pb-8 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-slate-700">{editRow.type} 編集</p>
              <button onClick={() => setEditRow(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>

            {editRow.type === 'バイタル' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'systolic', label: '収縮期血圧' },
                    { key: 'diastolic', label: '拡張期血圧' },
                    { key: 'pulse', label: '脈拍' },
                    { key: 'temperature', label: '体温' },
                    { key: 'spo2', label: 'SpO2' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-slate-500">{f.label}</label>
                      <input type="number" value={(editForm[f.key] as string) ?? ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value ? Number(e.target.value) : null }))}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 mt-0.5" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-slate-500">コメント</label>
                  <textarea value={(editForm.comment as string) ?? ''} onChange={e => setEditForm(p => ({ ...p, comment: e.target.value }))}
                    rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 mt-0.5 resize-none" />
                </div>
              </div>
            )}

            {editRow.type === '食事' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500">食事区分</label>
                  <select value={(editForm.mealType as string) ?? ''} onChange={e => setEditForm(p => ({ ...p, mealType: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 mt-0.5 bg-white">
                    {['朝', '昼', '夕'].map(t => <option key={t} value={t}>{t}食</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">主食 (/10)</label>
                    <input type="number" min={0} max={10} value={(editForm.mainDish as string) ?? ''} onChange={e => setEditForm(p => ({ ...p, mainDish: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 mt-0.5" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">副食 (/10)</label>
                    <input type="number" min={0} max={10} value={(editForm.sideDish as string) ?? ''} onChange={e => setEditForm(p => ({ ...p, sideDish: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 mt-0.5" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500">コメント</label>
                  <textarea value={(editForm.comment as string) ?? ''} onChange={e => setEditForm(p => ({ ...p, comment: e.target.value }))}
                    rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 mt-0.5 resize-none" />
                </div>
              </div>
            )}

            {editRow.type === '服薬・点眼' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {MED_EDIT_LABELS.map(m => (
                    <button key={m.key}
                      onClick={() => setEditForm(p => ({ ...p, [m.key]: !p[m.key] }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${editForm[m.key] ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-slate-500">コメント</label>
                  <textarea value={(editForm.comment as string) ?? ''} onChange={e => setEditForm(p => ({ ...p, comment: e.target.value }))}
                    rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 mt-0.5 resize-none" />
                </div>
              </div>
            )}

            {editRow.type === '夜間巡視' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {['睡眠中', '覚醒'].map(s => (
                    <button key={s}
                      onClick={() => setEditForm(p => ({ ...p, status: s }))}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${editForm.status === s ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-slate-500">コメント</label>
                  <textarea value={(editForm.comment as string) ?? ''} onChange={e => setEditForm(p => ({ ...p, comment: e.target.value }))}
                    rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 mt-0.5 resize-none" />
                </div>
              </div>
            )}

            {editRow.type.startsWith('コメント') && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {['ケア', '生活記録'].map(cat => (
                    <button key={cat}
                      onClick={() => setEditForm(p => ({ ...p, category: cat }))}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${editForm.category === cat ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-slate-500">内容</label>
                  <textarea value={(editForm.content as string) ?? ''} onChange={e => setEditForm(p => ({ ...p, content: e.target.value }))}
                    rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 mt-0.5 resize-none" />
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditRow(null)}
                className="bg-slate-100 text-slate-600 rounded-xl py-3 px-6 font-bold hover:bg-slate-200 transition-colors">
                キャンセル
              </button>
              <button onClick={handleEditSave} disabled={editSaving}
                className="flex-1 bg-teal-500 text-white rounded-xl py-3 font-bold disabled:opacity-40 hover:bg-teal-600 transition-colors">
                {editSaving ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
