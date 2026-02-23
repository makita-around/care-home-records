'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Resident { id: number; name: string; roomNumber: string }
const TYPES = ['転倒','転落','誤嚥','誤薬','皮膚損傷','その他']

export default function AccidentReportPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [form, setForm] = useState({ residentId:'', accidentAt: new Date().toISOString().slice(0,16), location:'', accidentType:'', description:'', injury:'', injuryParts:'', response:'', afterStatus:'', familyReport:false, causeAnalysis:'', prevention:'' })
  const [staffId, setStaffId] = useState(''); const [saving, setSaving] = useState(false)

  useEffect(() => { setStaffId(localStorage.getItem('staffId')||''); fetch('/api/residents').then(r=>r.json()).then(setResidents) }, [])

  const update = (k: string, v: unknown) => setForm(prev => ({ ...prev, [k]: v }))
  const handleSave = async () => {
    if (!staffId) { alert('担当者を選択してください'); return }
    if (!form.residentId) { alert('利用者を選択してください'); return }
    setSaving(true)
    await fetch('/api/accident-report', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, reporterId: Number(staffId) }) })
    setSaving(false); alert('事故報告書を登録しました')
    setForm({ residentId:'', accidentAt: new Date().toISOString().slice(0,16), location:'', accidentType:'', description:'', injury:'', injuryParts:'', response:'', afterStatus:'', familyReport:false, causeAnalysis:'', prevention:'' })
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href="/" className="text-white text-2xl">←</Link>
        <h1 className="font-bold text-lg">事故報告書</h1>
      </header>
      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <div><label className="text-sm text-gray-600">利用者</label><select value={form.residentId} onChange={e=>update('residentId',e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1"><option value="">選択してください</option>{residents.map(r=><option key={r.id} value={r.id}>{r.roomNumber}　{r.name}</option>)}</select></div>
          <div><label className="text-sm text-gray-600">発生日時</label><input type="datetime-local" value={form.accidentAt} onChange={e=>update('accidentAt',e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" /></div>
          <div><label className="text-sm text-gray-600">発生場所</label><input value={form.location} onChange={e=>update('location',e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" /></div>
          <div>
            <label className="text-sm text-gray-600">事故種別</label>
            <div className="grid grid-cols-3 gap-2 mt-1">{TYPES.map(t=><button key={t} onClick={()=>update('accidentType',t)} className={`py-2 rounded-lg text-sm font-medium ${form.accidentType===t?'bg-red-500 text-white':'bg-gray-100 text-gray-600'}`}>{t}</button>)}</div>
          </div>
          {[{l:'発生状況',k:'description'},{l:'受傷内容',k:'injury'},{l:'受傷箇所',k:'injuryParts'},{l:'対応内容',k:'response'},{l:'事後状況',k:'afterStatus'},{l:'原因分析',k:'causeAnalysis'},{l:'再発防止策',k:'prevention'}].map(f=>(
            <div key={f.k}><label className="text-sm text-gray-600">{f.l}</label><textarea value={form[f.k as keyof typeof form] as string} onChange={e=>update(f.k,e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none h-16" /></div>
          ))}
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.familyReport} onChange={e=>update('familyReport',e.target.checked)} className="w-5 h-5 accent-red-600" /><span className="text-sm">家族への報告済み</span></label>
          <button onClick={handleSave} disabled={saving} className="w-full bg-red-600 text-white rounded-xl py-3 font-bold disabled:opacity-40">登録する</button>
        </div>
      </div>
    </div>
  )
}
