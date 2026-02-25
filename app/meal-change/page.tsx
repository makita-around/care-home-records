'use client'
import { useEffect, useState } from 'react'
import Header from '@/app/components/Header'
import { useSession } from '@/app/components/SessionContext'

interface Resident { id: number; name: string; roomNumber: string }

export default function MealChangePage() {
  const session = useSession()
  const [residents, setResidents] = useState<Resident[]>([])
  const [residentId, setResidentId] = useState('')
  const [changeDate, setChangeDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [breakfast, setBreakfast] = useState(false)
  const [lunch, setLunch] = useState(false)
  const [dinner, setDinner] = useState(false)
  const [changeType, setChangeType] = useState('追加')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/residents').then(r => r.json()).then(setResidents)
  }, [])

  const handleSave = async () => {
    if (!session?.staffId) { alert('ログインが必要です'); return }
    if (!residentId) { alert('利用者を選択してください'); return }
    if (!breakfast && !lunch && !dinner) { alert('時間帯を選択してください'); return }
    setSaving(true)
    await fetch('/api/meal-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ residentId: Number(residentId), staffId: session.staffId, changeDate, breakfast, lunch, dinner, changeType }),
    })
    setResidentId(''); setBreakfast(false); setLunch(false); setDinner(false)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-6">
      <Header title="食事変更" backUrl="/" />

      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4 space-y-4">
        {/* 利用者 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">利用者</label>
          <select
            value={residentId}
            onChange={e => setResidentId(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1.5 outline-none focus:border-teal-400 bg-white"
          >
            <option value="">選択してください</option>
            {residents.map(r => <option key={r.id} value={r.id}>{r.roomNumber}号　{r.name}</option>)}
          </select>
        </div>

        {/* 変更日 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">変更日</label>
          <input
            type="date"
            value={changeDate}
            onChange={e => setChangeDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1.5 outline-none focus:border-teal-400"
          />
        </div>

        {/* 時間帯 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">時間帯（複数選択可）</label>
          <div className="flex gap-2 mt-1.5">
            {[{ l: '朝食', v: breakfast, s: setBreakfast }, { l: '昼食', v: lunch, s: setLunch }, { l: '夕食', v: dinner, s: setDinner }].map(f => (
              <button
                key={f.l}
                onClick={() => f.s(!f.v)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${f.v ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* 種別 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">種別</label>
          <div className="flex gap-2 mt-1.5">
            {['追加', 'キャンセル'].map(t => (
              <button
                key={t}
                onClick={() => setChangeType(t)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                  changeType === t
                    ? t === '追加' ? 'bg-teal-500 text-white' : 'bg-red-400 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 固定ボタン */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 p-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full rounded-xl py-4 font-bold text-base transition-colors ${
            saved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700'
          } disabled:opacity-40`}
        >
          {saved ? '✓ 登録しました' : '登録する'}
        </button>
      </div>
      <div className="h-20" />
    </div>
  )
}
