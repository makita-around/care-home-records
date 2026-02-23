'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Resident { id: number; name: string; roomNumber: string }

export default function MealChangePage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [residentId, setResidentId] = useState('')
  const [changeDate, setChangeDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [breakfast, setBreakfast] = useState(false); const [lunch, setLunch] = useState(false); const [dinner, setDinner] = useState(false)
  const [changeType, setChangeType] = useState('追加')
  const [staffId, setStaffId] = useState(''); const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStaffId(localStorage.getItem('staffId') || '')
    fetch('/api/residents').then(r => r.json()).then(setResidents)
  }, [])

  const handleSave = async () => {
    if (!staffId) { alert('担当者を選択してください'); return }
    if (!residentId) { alert('利用者を選択してください'); return }
    if (!breakfast && !lunch && !dinner) { alert('時間帯を選択してください'); return }
    setSaving(true)
    await fetch('/api/meal-changes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ residentId: Number(residentId), staffId: Number(staffId), changeDate, breakfast, lunch, dinner, changeType }) })
    setResidentId(''); setBreakfast(false); setLunch(false); setDinner(false); setSaving(false)
    alert('食事変更を登録しました')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-orange-500 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href="/" className="text-white text-2xl">←</Link>
        <h1 className="font-bold text-lg">食事変更</h1>
      </header>
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div><label className="text-sm text-gray-600">利用者</label><select value={residentId} onChange={e => setResidentId(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1"><option value="">選択してください</option>{residents.map(r => <option key={r.id} value={r.id}>{r.roomNumber}　{r.name}</option>)}</select></div>
          <div><label className="text-sm text-gray-600">変更日</label><input type="date" value={changeDate} onChange={e => setChangeDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" /></div>
          <div>
            <label className="text-sm text-gray-600">時間帯（複数選択可）</label>
            <div className="flex gap-2 mt-1">
              {[{l:'朝',v:breakfast,s:setBreakfast},{l:'昼',v:lunch,s:setLunch},{l:'夕',v:dinner,s:setDinner}].map(f => <button key={f.l} onClick={() => f.s(!f.v)} className={`flex-1 py-3 rounded-lg font-bold text-sm ${f.v ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{f.l}</button>)}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600">種別</label>
            <div className="flex gap-2 mt-1">
              {['追加','キャンセル'].map(t => <button key={t} onClick={() => setChangeType(t)} className={`flex-1 py-3 rounded-lg font-bold text-sm ${changeType === t ? (t === '追加' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-100 text-gray-600'}`}>{t}</button>)}
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full bg-orange-500 text-white rounded-xl py-3 font-bold disabled:opacity-40">登録する</button>
        </div>
      </div>
    </div>
  )
}
