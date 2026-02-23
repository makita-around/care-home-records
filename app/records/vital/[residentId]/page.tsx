'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import NumKeypad from '@/app/components/NumKeypad'

interface Resident { id: number; name: string; roomNumber: string }
interface VitalRecord { id: number; systolic: number|null; diastolic: number|null; pulse: number|null; temperature: number|null; spo2: number|null; comment: string; recordedAt: string; staff: { name: string } }
type FieldKey = 'systolic'|'diastolic'|'pulse'|'temperature'|'spo2'
const FIELDS: { key: FieldKey; label: string; unit: string; decimal?: boolean; max?: number }[] = [
  { key: 'systolic', label: '収縮期血圧', unit: 'mmHg', max: 300 },
  { key: 'diastolic', label: '拡張期血圧', unit: 'mmHg', max: 200 },
  { key: 'pulse', label: '脈拍', unit: '回/分', max: 250 },
  { key: 'temperature', label: '体温', unit: '℃', decimal: true, max: 42 },
  { key: 'spo2', label: 'SpO2', unit: '%', max: 100 },
]

export default function VitalPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const [resident, setResident] = useState<Resident|null>(null)
  const [records, setRecords] = useState<VitalRecord[]>([])
  const [form, setForm] = useState<Record<FieldKey,string>>({ systolic:'', diastolic:'', pulse:'', temperature:'', spo2:'' })
  const [comment, setComment] = useState('')
  const [activeField, setActiveField] = useState<FieldKey|null>(null)
  const [staffId, setStaffId] = useState('')
  const [saving, setSaving] = useState(false)

  const loadRecords = () => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/records/vital?residentId=${residentId}&date=${today}`).then(r => r.json()).then(setRecords)
  }
  useEffect(() => {
    setStaffId(localStorage.getItem('staffId') || '')
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(setResident)
    loadRecords()
  }, [residentId])

  const handleSave = async () => {
    if (!staffId) { alert('担当者を選択してください'); return }
    setSaving(true)
    await fetch('/api/records/vital', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ residentId: Number(residentId), staffId: Number(staffId), ...form, comment }) })
    loadRecords()
    setForm({ systolic:'', diastolic:'', pulse:'', temperature:'', spo2:'' }); setComment('')
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href={`/residents/${residentId}`} className="text-white text-2xl">←</Link>
        <div><h1 className="font-bold text-lg">バイタル入力</h1>{resident && <p className="text-xs text-red-200">{resident.roomNumber}　{resident.name}</p>}</div>
      </header>
      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          {FIELDS.map(f => (
            <div key={f.key} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-28 shrink-0">{f.label}</span>
              <button onClick={() => setActiveField(f.key)} className="flex-1 border rounded-lg px-3 py-2 text-right text-lg font-bold bg-gray-50">
                {form[f.key] || <span className="text-gray-300 font-normal text-sm">タップして入力</span>}
              </button>
              <span className="text-xs text-gray-400 w-12">{f.unit}</span>
            </div>
          ))}
          <div>
            <label className="text-sm text-gray-600">コメント</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none h-16" />
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full bg-red-600 text-white rounded-xl py-3 font-bold disabled:opacity-40">保存する</button>
        </div>
        {records.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-bold text-sm text-gray-600 mb-3">本日の記録</h2>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead><tr className="text-gray-400"><th className="text-left pb-1">時刻</th><th>収縮</th><th>拡張</th><th>脈拍</th><th>体温</th><th>SpO2</th></tr></thead>
                <tbody>{records.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="py-1 text-gray-500">{new Date(r.recordedAt).toLocaleTimeString('ja', { hour:'2-digit', minute:'2-digit' })}</td>
                    <td className="text-center">{r.systolic ?? '—'}</td><td className="text-center">{r.diastolic ?? '—'}</td>
                    <td className="text-center">{r.pulse ?? '—'}</td><td className="text-center">{r.temperature ?? '—'}</td><td className="text-center">{r.spo2 ?? '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {activeField && (
        <NumKeypad value={form[activeField]} label={FIELDS.find(f => f.key === activeField)?.label} decimal={FIELDS.find(f => f.key === activeField)?.decimal} maxVal={FIELDS.find(f => f.key === activeField)?.max}
          onConfirm={val => { setForm(prev => ({ ...prev, [activeField]: val })); setActiveField(null) }} onClose={() => setActiveField(null)} />
      )}
    </div>
  )
}
