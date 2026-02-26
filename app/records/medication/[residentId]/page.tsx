'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import VoiceInput from '@/app/components/VoiceInput'
import { useSession } from '@/app/components/SessionContext'

interface Resident { id: number; name: string; roomNumber: string }
type TimingKey = 'beforeBreakfast'|'afterBreakfast'|'beforeLunch'|'afterLunch'|'beforeDinner'|'afterDinner'|'bedtime'|'eyeDrop'
const LABELS: Record<TimingKey, string> = {
  beforeBreakfast: '朝食前', afterBreakfast: '朝食後',
  beforeLunch: '昼食前', afterLunch: '昼食後',
  beforeDinner: '夕食前', afterDinner: '夕食後',
  bedtime: '眠前', eyeDrop: '点眼',
}
const ALL_TIMINGS: TimingKey[] = ['beforeBreakfast','afterBreakfast','beforeLunch','afterLunch','beforeDinner','afterDinner','bedtime','eyeDrop']

function nowLocal() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function MedicationPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const session = useSession()
  const router = useRouter()
  const [resident, setResident] = useState<Resident|null>(null)
  const [checks, setChecks] = useState<Record<TimingKey, boolean>>(
    Object.fromEntries(ALL_TIMINGS.map(k => [k, false])) as Record<TimingKey, boolean>
  )
  const [comment, setComment] = useState('')
  const [recordedAt, setRecordedAt] = useState(nowLocal)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(setResident)
  }, [residentId])

  const handleSave = async () => {
    if (!session?.staffId) { alert('ログインが必要です'); return }
    setSaving(true)
    const body: Record<string, unknown> = {
      residentId: Number(residentId), staffId: session.staffId, comment,
      recordedAt: new Date(recordedAt).toISOString(),
    }
    ALL_TIMINGS.forEach(k => { body[k] = checks[k] })
    await fetch('/api/records/medication', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    setChecks(Object.fromEntries(ALL_TIMINGS.map(k => [k, false])) as Record<TimingKey, boolean>)
    setComment(''); setRecordedAt(nowLocal())
    setSaving(false); setSaved(true)
    setTimeout(() => router.push('/'), 1000)
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <Header title="服薬・点眼入力" backUrl={`/residents/${residentId}`} />

      {resident && (
        <div className="bg-green-500 px-4 py-2.5">
          <p className="text-white text-sm font-medium">{resident.roomNumber}号　{resident.name}</p>
        </div>
      )}

      {/* 記録日時 */}
      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">記録日時</label>
        <input
          type="datetime-local"
          value={recordedAt}
          onChange={e => setRecordedAt(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1.5 outline-none focus:border-teal-400 text-slate-700"
        />
      </div>

      {/* タイミング選択 */}
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        {ALL_TIMINGS.map((k, i) => (
          <button
            key={k}
            onClick={() => setChecks(prev => ({ ...prev, [k]: !prev[k] }))}
            className={`w-full flex items-center gap-4 px-4 py-4 transition-colors text-left ${
              i !== ALL_TIMINGS.length - 1 ? 'border-b border-slate-100' : ''
            } ${checks[k] ? 'bg-green-50' : 'hover:bg-slate-50'}`}
          >
            <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
              checks[k] ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white'
            }`}>
              {checks[k] && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-base font-medium text-slate-700 flex-1">{LABELS[k]}</span>
            <span className={`text-xs font-bold ${checks[k] ? 'text-green-500' : 'text-slate-300'}`}>
              {checks[k] ? '済' : '未'}
            </span>
          </button>
        ))}
      </div>

      {/* コメント */}
      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">コメント</label>
          <VoiceInput onResult={text => setComment(prev => prev ? prev + ' ' + text : text)} />
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none h-16 outline-none focus:border-teal-400"
        />
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 p-3">
        <button onClick={handleSave} disabled={saving}
          className={`w-full rounded-xl py-4 font-bold text-base transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700'} disabled:opacity-40`}>
          {saved ? '✓ 保存しました' : '保存する'}
        </button>
      </div>
    </div>
  )
}
