'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'

interface Resident { id: number; name: string; roomNumber: string }
interface MedConfig { beforeBreakfast: boolean; afterBreakfast: boolean; beforeLunch: boolean; afterLunch: boolean; beforeDinner: boolean; afterDinner: boolean; bedtime: boolean; eyeDrop: boolean }
type TimingKey = keyof MedConfig
const LABELS: Record<TimingKey, string> = { beforeBreakfast:'朝食前', afterBreakfast:'朝食後', beforeLunch:'昼食前', afterLunch:'昼食後', beforeDinner:'夕食前', afterDinner:'夕食後', bedtime:'眠前', eyeDrop:'点眼' }

export default function MedicationPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const [resident, setResident] = useState<Resident|null>(null)
  const [config, setConfig] = useState<MedConfig|null>(null)
  const [checks, setChecks] = useState<Record<TimingKey, boolean>>({} as Record<TimingKey, boolean>)
  const [comment, setComment] = useState('')
  const [staffId, setStaffId] = useState(''); const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStaffId(localStorage.getItem('staffId') || '')
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(res => {
      setResident(res)
      if (res.medicationConfig) {
        setConfig(res.medicationConfig)
        const init: Partial<Record<TimingKey, boolean>> = {}
        ;(Object.keys(LABELS) as TimingKey[]).forEach(k => { if (res.medicationConfig[k]) init[k] = false })
        setChecks(init as Record<TimingKey, boolean>)
      }
    })
  }, [residentId])

  const activeTimings = config ? (Object.keys(LABELS) as TimingKey[]).filter(k => config[k]) : []

  const handleSave = async () => {
    if (!staffId) { alert('担当者を選択してください'); return }
    setSaving(true)
    const body: Record<string, unknown> = { residentId: Number(residentId), staffId: Number(staffId), comment }
    activeTimings.forEach(k => { body[k] = checks[k] ?? false })
    await fetch('/api/records/medication', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const reset = {} as Record<TimingKey, boolean>
    activeTimings.forEach(k => { reset[k] = false }); setChecks(reset); setComment(''); setSaving(false)
    alert('保存しました')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-green-600 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href={`/residents/${residentId}`} className="text-white text-2xl">←</Link>
        <div><h1 className="font-bold text-lg">服薬入力</h1>{resident && <p className="text-xs text-green-100">{resident.roomNumber}　{resident.name}</p>}</div>
      </header>
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          {activeTimings.length === 0 && <p className="text-gray-400 text-sm text-center py-4">服薬設定がありません</p>}
          {activeTimings.map(k => (
            <label key={k} className="flex items-center gap-3 py-2 border-b last:border-0 cursor-pointer">
              <input type="checkbox" checked={checks[k] ?? false} onChange={e => setChecks(prev => ({ ...prev, [k]: e.target.checked }))} className="w-6 h-6 accent-green-600" />
              <span className="text-base font-medium">{LABELS[k]}</span>
              <span className="text-xs text-gray-400 ml-auto">{checks[k] ? '✓ 服薬済' : '未'}</span>
            </label>
          ))}
          <div><label className="text-sm text-gray-600">コメント</label><textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none h-16" /></div>
          <button onClick={handleSave} disabled={saving} className="w-full bg-green-600 text-white rounded-xl py-3 font-bold disabled:opacity-40">保存する</button>
        </div>
      </div>
    </div>
  )
}
