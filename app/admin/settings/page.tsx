'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminSettingsPage() {
  const [facilityName, setFacilityName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch('/api/settings').then(r=>r.json()).then(d=>{ if(d.facilityName) setFacilityName(d.facilityName) }) }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ facilityName }) })
    setSaving(false); alert('保存しました')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-gray-700 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href="/admin" className="text-white text-2xl">←</Link>
        <h1 className="font-bold text-lg">基本設定</h1>
      </header>
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <div><label className="text-sm text-gray-600">施設名</label><input value={facilityName} onChange={e=>setFacilityName(e.target.value)} placeholder="施設名を入力" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
          <button onClick={handleSave} disabled={saving} className="w-full bg-gray-700 text-white rounded-xl py-3 font-bold disabled:opacity-40">保存する</button>
        </div>
      </div>
    </div>
  )
}
