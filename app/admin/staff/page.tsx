'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Staff { id: number; name: string; nameKana: string }

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [name, setName] = useState(''); const [nameKana, setNameKana] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => fetch('/api/staff').then(r=>r.json()).then(setStaff)
  useEffect(()=>{ load() },[])

  const handleAdd = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/staff', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, nameKana }) })
    setName(''); setNameKana(''); await load(); setSaving(false)
  }
  const handleDelete = async (id: number) => {
    if (!confirm('無効化しますか？')) return
    await fetch(`/api/staff/${id}`, { method:'DELETE' }); await load()
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-gray-700 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href="/admin" className="text-white text-2xl">←</Link>
        <h1 className="font-bold text-lg">職員管理</h1>
      </header>
      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h2 className="font-bold text-sm text-gray-600">新規追加</h2>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="氏名" className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input value={nameKana} onChange={e=>setNameKana(e.target.value)} placeholder="ふりがな" className="w-full border rounded-lg px-3 py-2 text-sm" />
          <button onClick={handleAdd} disabled={!name.trim()||saving} className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold disabled:opacity-40">追加する</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {staff.map(s=>(
            <div key={s.id} className="flex items-center px-4 py-3 gap-3">
              <div className="flex-1"><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-gray-400">{s.nameKana}</p></div>
              <button onClick={()=>handleDelete(s.id)} className="text-xs text-red-500 border border-red-200 rounded px-2 py-1">無効化</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
