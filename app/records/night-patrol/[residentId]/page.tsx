'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import VoiceInput from '@/app/components/VoiceInput'
import { useSession } from '@/app/components/SessionContext'

interface Resident { id: number; name: string; roomNumber: string }
interface PatrolRecord { id: number; patrolTime: string; status: string; comment: string; staff: { name: string } }

function nowLocal() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function NightPatrolPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const session = useSession()
  const router = useRouter()
  const [resident, setResident] = useState<Resident|null>(null)
  const [records, setRecords] = useState<PatrolRecord[]>([])
  const [status, setStatus] = useState('睡眠中')
  const [patrolTime, setPatrolTime] = useState(nowLocal)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadRecords = () => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/records/night-patrol?residentId=${residentId}&date=${today}`).then(r => r.json()).then(setRecords)
  }
  useEffect(() => {
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(setResident)
    loadRecords()
  }, [residentId])

  const handleSave = async () => {
    if (!session?.staffId) { alert('ログインが必要です'); return }
    setSaving(true)
    await fetch('/api/records/night-patrol', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ residentId: Number(residentId), staffId: session.staffId, patrolTime, status, comment }),
    })
    loadRecords(); setComment('')
    setSaving(false); setSaved(true)
    setTimeout(() => router.push('/'), 1000)
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <Header title="夜間巡視入力" backUrl={`/residents/${residentId}`} />

      {resident && (
        <div className="bg-indigo-500 px-4 py-2.5">
          <p className="text-white text-sm font-medium">{resident.roomNumber}号　{resident.name}</p>
        </div>
      )}

      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">巡視時刻</label>
          <input
            type="datetime-local"
            value={patrolTime}
            onChange={e => setPatrolTime(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1.5 outline-none focus:border-teal-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">状態</label>
          <div className="flex gap-2 mt-1.5">
            {['睡眠中','覚醒'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                  status === s ? (s === '睡眠中' ? 'bg-indigo-500 text-white' : 'bg-orange-400 text-white') : 'bg-slate-100 text-slate-500'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
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
      </div>

      {records.length > 0 && (
        <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4">
          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">本日の巡視記録</p>
          {records.map(r => (
            <div key={r.id} className="text-sm border-t border-slate-100 py-2.5 flex gap-3 items-start">
              <span className="text-slate-400 font-mono flex-shrink-0">
                {new Date(r.patrolTime).toLocaleTimeString('ja', { hour:'2-digit', minute:'2-digit' })}
              </span>
              <span className={`font-bold flex-shrink-0 ${r.status === '睡眠中' ? 'text-indigo-500' : 'text-orange-400'}`}>{r.status}</span>
              {r.comment && <span className="text-slate-400 text-xs">{r.comment}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 p-3">
        <button onClick={handleSave} disabled={saving}
          className={`w-full rounded-xl py-4 font-bold text-base transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700'} disabled:opacity-40`}>
          {saved ? '✓ 保存しました' : '保存する'}
        </button>
      </div>
    </div>
  )
}
