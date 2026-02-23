'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'

interface Resident { id: number; name: string; roomNumber: string }
interface PatrolRecord { id: number; patrolTime: string; status: string; comment: string; staff: { name: string } }

export default function NightPatrolPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const [resident, setResident] = useState<Resident|null>(null)
  const [records, setRecords] = useState<PatrolRecord[]>([])
  const [status, setStatus] = useState('睡眠中')
  const [patrolTime, setPatrolTime] = useState(() => new Date().toISOString().slice(0, 16))
  const [comment, setComment] = useState('')
  const [staffId, setStaffId] = useState(''); const [saving, setSaving] = useState(false)

  const loadRecords = () => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/records/night-patrol?residentId=${residentId}&date=${today}`).then(r => r.json()).then(setRecords)
  }
  useEffect(() => {
    setStaffId(localStorage.getItem('staffId') || '')
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(setResident)
    loadRecords()
  }, [residentId])

  const handleSave = async () => {
    if (!staffId) { alert('担当者を選択してください'); return }
    setSaving(true)
    await fetch('/api/records/night-patrol', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ residentId: Number(residentId), staffId: Number(staffId), patrolTime, status, comment }) })
    loadRecords(); setComment(''); setSaving(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href={`/residents/${residentId}`} className="text-white text-2xl">←</Link>
        <div><h1 className="font-bold text-lg">夜間巡視入力</h1>{resident && <p className="text-xs text-indigo-200">{resident.roomNumber}　{resident.name}</p>}</div>
      </header>
      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <div><label className="text-sm text-gray-600">巡視時刻</label><input type="datetime-local" value={patrolTime} onChange={e => setPatrolTime(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" /></div>
          <div>
            <label className="text-sm text-gray-600">状態</label>
            <div className="flex gap-2 mt-1">
              {['睡眠中','覚醒'].map(s => <button key={s} onClick={() => setStatus(s)} className={`flex-1 py-3 rounded-lg font-bold text-sm ${status === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{s}</button>)}
            </div>
          </div>
          <div><label className="text-sm text-gray-600">コメント</label><textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none h-16" /></div>
          <button onClick={handleSave} disabled={saving} className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold disabled:opacity-40">保存する</button>
        </div>
        {records.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-bold text-sm text-gray-600 mb-2">本日の巡視記録</h2>
            {records.map(r => (
              <div key={r.id} className="text-sm border-t py-2 flex gap-3 items-start">
                <span className="text-gray-500">{new Date(r.patrolTime).toLocaleTimeString('ja', { hour:'2-digit', minute:'2-digit' })}</span>
                <span className={`font-medium ${r.status === '睡眠中' ? 'text-indigo-600' : 'text-orange-500'}`}>{r.status}</span>
                {r.comment && <span className="text-gray-400 text-xs flex-1">{r.comment}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
