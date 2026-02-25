'use client'
import { useEffect, useState } from 'react'
import Header from '@/app/components/Header'
import { useSession } from '@/app/components/SessionContext'

interface Resident { id: number; name: string; roomNumber: string }
const TYPES = ['転倒','転落','誤嚥','誤薬','皮膚損傷','その他']

export default function AccidentReportPage() {
  const session = useSession()
  const [residents, setResidents] = useState<Resident[]>([])
  const [form, setForm] = useState({
    residentId:'', accidentAt: new Date().toISOString().slice(0,16),
    location:'', accidentType:'', description:'', injury:'',
    injuryParts:'', response:'', afterStatus:'', familyReport:false,
    causeAnalysis:'', prevention:'',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/residents').then(r => r.json()).then(setResidents)
  }, [])

  const update = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    if (!session?.staffId) { alert('ログインが必要です'); return }
    if (!form.residentId) { alert('利用者を選択してください'); return }
    setSaving(true)
    await fetch('/api/accident-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, reporterId: session.staffId }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setForm({ residentId:'', accidentAt: new Date().toISOString().slice(0,16), location:'', accidentType:'', description:'', injury:'', injuryParts:'', response:'', afterStatus:'', familyReport:false, causeAnalysis:'', prevention:'' })
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <Header title="事故報告書" backUrl="/" />

      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4 space-y-4">
        {/* 利用者 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">利用者 *</label>
          <select
            value={form.residentId}
            onChange={e => update('residentId', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1.5 outline-none focus:border-teal-400 bg-white"
          >
            <option value="">選択してください</option>
            {residents.map(r => <option key={r.id} value={r.id}>{r.roomNumber}号　{r.name}</option>)}
          </select>
        </div>

        {/* 発生日時 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">発生日時</label>
          <input
            type="datetime-local"
            value={form.accidentAt}
            onChange={e => update('accidentAt', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1.5 outline-none focus:border-teal-400"
          />
        </div>

        {/* 発生場所 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">発生場所</label>
          <input
            value={form.location}
            onChange={e => update('location', e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1.5 outline-none focus:border-teal-400"
          />
        </div>

        {/* 事故種別 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">事故種別</label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {TYPES.map(t => (
              <button key={t} onClick={() => update('accidentType', t)}
                className={`py-3 rounded-xl text-sm font-bold transition-colors ${form.accidentType === t ? 'bg-red-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* テキストエリア群 */}
        {[
          { l: '発生状況', k: 'description' }, { l: '受傷内容', k: 'injury' },
          { l: '受傷箇所', k: 'injuryParts' }, { l: '対応内容', k: 'response' },
          { l: '事後状況', k: 'afterStatus' }, { l: '原因分析', k: 'causeAnalysis' },
          { l: '再発防止策', k: 'prevention' },
        ].map(f => (
          <div key={f.k}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{f.l}</label>
            <textarea
              value={form[f.k as keyof typeof form] as string}
              onChange={e => update(f.k, e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1.5 resize-none h-16 outline-none focus:border-teal-400"
            />
          </div>
        ))}

        {/* 家族報告 */}
        <label
          className="flex items-center gap-3 py-2 cursor-pointer"
          onClick={() => update('familyReport', !form.familyReport)}
        >
          <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${form.familyReport ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white'}`}>
            {form.familyReport && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="text-sm text-slate-700">家族への報告済み</span>
        </label>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 p-3">
        <button onClick={handleSave} disabled={saving}
          className={`w-full rounded-xl py-4 font-bold text-base transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-red-400 text-white hover:bg-red-500 active:bg-red-600'} disabled:opacity-40`}>
          {saved ? '✓ 登録しました' : '登録する'}
        </button>
      </div>
    </div>
  )
}
