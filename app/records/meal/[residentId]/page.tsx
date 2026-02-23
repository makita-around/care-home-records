'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import NumKeypad from '@/app/components/NumKeypad'

interface Resident { id: number; name: string; roomNumber: string }
interface MealRecord { id: number; mealType: string; mainDish: number|null; sideDish: number|null; comment: string; recordedAt: string; staff: { name: string } }

export default function MealPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const [resident, setResident] = useState<Resident|null>(null)
  const [records, setRecords] = useState<MealRecord[]>([])
  const [mealType, setMealType] = useState('朝')
  const [main, setMain] = useState(''); const [side, setSide] = useState('')
  const [comment, setComment] = useState('')
  const [activeField, setActiveField] = useState<'main'|'side'|null>(null)
  const [staffId, setStaffId] = useState(''); const [saving, setSaving] = useState(false)

  const loadRecords = () => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/records/meal?residentId=${residentId}&date=${today}`).then(r => r.json()).then(setRecords)
  }
  useEffect(() => {
    setStaffId(localStorage.getItem('staffId') || '')
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(setResident)
    loadRecords()
  }, [residentId])

  const handleSave = async () => {
    if (!staffId) { alert('担当者を選択してください'); return }
    setSaving(true)
    await fetch('/api/records/meal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ residentId: Number(residentId), staffId: Number(staffId), mealType, mainDish: main ? Number(main) : null, sideDish: side ? Number(side) : null, comment }) })
    loadRecords(); setMain(''); setSide(''); setComment(''); setSaving(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-orange-500 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href={`/residents/${residentId}`} className="text-white text-2xl">←</Link>
        <div><h1 className="font-bold text-lg">食事入力</h1>{resident && <p className="text-xs text-orange-100">{resident.roomNumber}　{resident.name}</p>}</div>
      </header>
      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div className="flex gap-2">
            {['朝','昼','夕'].map(t => <button key={t} onClick={() => setMealType(t)} className={`flex-1 py-2 rounded-lg font-bold text-sm ${mealType === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{label:'主食',val:main,field:'main' as const},{label:'副食',val:side,field:'side' as const}].map(f => (
              <div key={f.field}>
                <label className="text-sm text-gray-600">{f.label} (0〜10)</label>
                <button onClick={() => setActiveField(f.field)} className="w-full border rounded-lg px-3 py-3 text-2xl font-bold bg-gray-50 mt-1">
                  {f.val || <span className="text-gray-300 text-sm font-normal">入力</span>}
                </button>
              </div>
            ))}
          </div>
          <div><label className="text-sm text-gray-600">コメント</label><textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none h-16" /></div>
          <button onClick={handleSave} disabled={saving} className="w-full bg-orange-500 text-white rounded-xl py-3 font-bold disabled:opacity-40">保存する</button>
        </div>
        {records.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-bold text-sm text-gray-600 mb-2">本日の記録</h2>
            {records.map(r => <div key={r.id} className="text-sm border-t py-2 flex gap-3"><span className="font-bold w-6">{r.mealType}</span><span>主:{r.mainDish ?? '—'} 副:{r.sideDish ?? '—'}</span>{r.comment && <span className="text-gray-400 text-xs">{r.comment}</span>}</div>)}
          </div>
        )}
      </div>
      {activeField && <NumKeypad value={activeField === 'main' ? main : side} label={activeField === 'main' ? '主食量 (0-10)' : '副食量 (0-10)'} maxVal={10} onConfirm={val => { activeField === 'main' ? setMain(val) : setSide(val); setActiveField(null) }} onClose={() => setActiveField(null)} />}
    </div>
  )
}
