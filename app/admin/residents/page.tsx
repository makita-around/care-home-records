'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Resident { id: number; name: string; nameKana: string; roomNumber: string; floor: string; careLevel: string }

export default function AdminResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [form, setForm] = useState({ name:'', nameKana:'', roomNumber:'', floor:'', gender:'女', birthDate:'', careLevel:'' })
  const [saving, setSaving] = useState(false)

  const load = () => fetch('/api/residents').then(r=>r.json()).then(setResidents)
  useEffect(()=>{ load() },[])

  const update = (k: string, v: string) => setForm(prev=>({...prev,[k]:v}))
  const handleAdd = async () => {
    if (!form.name||!form.roomNumber||!form.birthDate) { alert('氏名・部屋番号・生年月日は必須です'); return }
    setSaving(true)
    await fetch('/api/residents', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    setForm({ name:'', nameKana:'', roomNumber:'', floor:'', gender:'女', birthDate:'', careLevel:'' }); await load(); setSaving(false)
  }
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`${name}を無効化しますか？`)) return
    await fetch(`/api/residents/${id}`, { method:'DELETE' }); await load()
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-gray-700 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href="/admin" className="text-white text-2xl">←</Link>
        <h1 className="font-bold text-lg">入居者管理</h1>
      </header>
      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
          <h2 className="font-bold text-sm text-gray-600">新規追加</h2>
          {[{k:'name',p:'氏名*'},{k:'nameKana',p:'ふりがな'},{k:'roomNumber',p:'部屋番号*'},{k:'floor',p:'フロア (例: 1F)'},{k:'careLevel',p:'要介護度 (例: 要介護3)'}].map(f=>(
            <input key={f.k} value={form[f.k as keyof typeof form]} onChange={e=>update(f.k,e.target.value)} placeholder={f.p} className="w-full border rounded-lg px-3 py-2 text-sm" />
          ))}
          <div className="flex gap-2">{['女','男'].map(g=><button key={g} onClick={()=>update('gender',g)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.gender===g?'bg-blue-600 text-white':'bg-gray-100 text-gray-600'}`}>{g}</button>)}</div>
          <div><label className="text-xs text-gray-500">生年月日*</label><input type="date" value={form.birthDate} onChange={e=>update('birthDate',e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" /></div>
          <button onClick={handleAdd} disabled={saving} className="w-full bg-green-600 text-white rounded-xl py-3 font-bold disabled:opacity-40">追加する</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {residents.map(r=>(
            <div key={r.id} className="flex items-center px-4 py-3 gap-3">
              <div className="flex-1"><p className="font-medium text-sm">{r.roomNumber}　{r.name}</p><p className="text-xs text-gray-400">{r.floor}　{r.careLevel}</p></div>
              <button onClick={()=>handleDelete(r.id,r.name)} className="text-xs text-red-500 border border-red-200 rounded px-2 py-1">無効化</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
