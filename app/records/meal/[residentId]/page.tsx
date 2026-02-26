'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import VoiceInput from '@/app/components/VoiceInput'
import { useSession } from '@/app/components/SessionContext'

interface Resident { id: number; name: string; roomNumber: string }
interface MealRecord { id: number; mealType: string; mainDish: number|null; sideDish: number|null; comment: string; recordedAt: string; staff: { name: string } }

function nowLocal() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function MealPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const session = useSession()
  const router = useRouter()
  const [resident, setResident] = useState<Resident|null>(null)
  const [records, setRecords] = useState<MealRecord[]>([])
  const [mealType, setMealType] = useState('朝')
  const [main, setMain] = useState(''); const [side, setSide] = useState('')
  const [comment, setComment] = useState('')
  const [recordedAt, setRecordedAt] = useState(nowLocal)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadRecords = () => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/records/meal?residentId=${residentId}&date=${today}`).then(r => r.json()).then(setRecords)
  }
  useEffect(() => {
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(setResident)
    loadRecords()
  }, [residentId])

  const handleSave = async () => {
    if (!session?.staffId) { alert('ログインが必要です'); return }
    setSaving(true)
    await fetch('/api/records/meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        residentId: Number(residentId), staffId: session.staffId, mealType,
        mainDish: main ? Number(main) : null, sideDish: side ? Number(side) : null,
        comment, recordedAt: new Date(recordedAt).toISOString(),
      }),
    })
    loadRecords(); setMain(''); setSide(''); setComment('')
    setRecordedAt(nowLocal())
    setSaving(false); setSaved(true)
    setTimeout(() => router.push('/'), 1000)
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <Header title="食事入力" backUrl={`/residents/${residentId}`} />

      {resident && (
        <div className="bg-orange-400 px-4 py-2.5">
          <p className="text-white text-sm font-medium">{resident.roomNumber}号　{resident.name}</p>
        </div>
      )}

      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4 space-y-4">
        {/* 記録日時 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">記録日時</label>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={e => setRecordedAt(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1.5 outline-none focus:border-teal-400 text-slate-700"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">食事区分</label>
          <div className="flex gap-2 mt-1.5">
            {['朝','昼','夕'].map(t => (
              <button key={t} onClick={() => setMealType(t)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${mealType === t ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {t}食
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {[{ label: '主食量', val: main, field: 'main' as const }, { label: '副食量', val: side, field: 'side' as const }].map(f => (
            <div key={f.field}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {f.label}
                <span className={`text-base font-bold ${f.val ? 'text-orange-500' : 'text-slate-300'}`}>
                  {f.val ? `${f.val}/10` : '□/10'}
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n}
                    onClick={() => f.field === 'main' ? setMain(String(n)) : setSide(String(n))}
                    className={`w-10 h-10 rounded-xl text-base font-bold border transition-colors ${
                      f.val === String(n)
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
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
          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">本日の記録</p>
          {records.map(r => (
            <div key={r.id} className="text-sm border-t border-slate-100 py-2.5 flex gap-3 items-start">
              <span className="font-bold text-orange-500 w-6">{r.mealType}</span>
              <span className="text-slate-600">主:{r.mainDish != null ? `${r.mainDish}/10` : '□/10'}　副:{r.sideDish != null ? `${r.sideDish}/10` : '□/10'}</span>
              {r.comment && <span className="text-slate-400 text-xs flex-1">{r.comment}</span>}
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
