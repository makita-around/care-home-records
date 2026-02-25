'use client'
import { useEffect, useState, use } from 'react'
import Header from '@/app/components/Header'
import NumKeypad from '@/app/components/NumKeypad'
import VoiceInput from '@/app/components/VoiceInput'
import { useSession } from '@/app/components/SessionContext'

interface Resident { id: number; name: string; roomNumber: string }
interface VitalRecord { id: number; systolic: number|null; diastolic: number|null; pulse: number|null; temperature: number|null; spo2: number|null; comment: string; recordedAt: string; staff: { name: string } }
type FieldKey = 'systolic'|'diastolic'|'pulse'|'temperature'|'spo2'
const FIELDS: { key: FieldKey; label: string; unit: string; decimal?: boolean; max?: number }[] = [
  { key: 'systolic',    label: '高圧',  unit: 'mmHg', max: 300 },
  { key: 'diastolic',   label: '低圧',  unit: 'mmHg', max: 200 },
  { key: 'pulse',       label: '脈拍',  unit: '回/分', max: 250 },
  { key: 'temperature', label: '体温',  unit: '℃',    decimal: true, max: 42 },
  { key: 'spo2',        label: 'SpO2',  unit: '%',    max: 100 },
]

function nowLocal() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function VitalPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const session = useSession()
  const [resident, setResident] = useState<Resident|null>(null)
  const [records, setRecords] = useState<VitalRecord[]>([])
  const [form, setForm] = useState<Record<FieldKey,string>>({ systolic:'', diastolic:'', pulse:'', temperature:'', spo2:'' })
  const [comment, setComment] = useState('')
  const [recordedAt, setRecordedAt] = useState(nowLocal)
  const [activeField, setActiveField] = useState<FieldKey|null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadRecords = () => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/records/vital?residentId=${residentId}&date=${today}`).then(r => r.json()).then(setRecords)
  }
  useEffect(() => {
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(setResident)
    loadRecords()
  }, [residentId])

  const handleSave = async () => {
    if (!session?.staffId) { alert('ログインが必要です'); return }
    setSaving(true)
    await fetch('/api/records/vital', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ residentId: Number(residentId), staffId: session.staffId, ...form, comment, recordedAt: new Date(recordedAt).toISOString() }),
    })
    loadRecords()
    setForm({ systolic:'', diastolic:'', pulse:'', temperature:'', spo2:'' }); setComment('')
    setRecordedAt(nowLocal())
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <Header title="バイタル入力" backUrl={`/residents/${residentId}`} />

      {resident && (
        <div className="bg-red-400 px-4 py-2.5">
          <p className="text-white text-sm font-medium">{resident.roomNumber}号　{resident.name}</p>
        </div>
      )}

      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4 space-y-3">
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

        {FIELDS.map(f => (
          <div key={f.key} className="flex items-center gap-3">
            <span className="text-sm text-slate-600 w-16 flex-shrink-0">{f.label}</span>
            <button
              onClick={() => setActiveField(f.key)}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-right text-xl font-bold bg-slate-50 hover:border-teal-400 transition-colors"
            >
              {form[f.key] || <span className="text-slate-300 font-normal text-sm">タップして入力</span>}
            </button>
            <span className="text-xs text-slate-400 w-10 flex-shrink-0">{f.unit}</span>
          </div>
        ))}

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
          <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">本日の記録</p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="text-slate-400">
                  <th className="text-left pb-2">時刻</th>
                  <th className="pb-2">高圧</th><th className="pb-2">低圧</th>
                  <th className="pb-2">脈拍</th><th className="pb-2">体温</th><th className="pb-2">SpO2</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2 text-slate-500">{new Date(r.recordedAt).toLocaleTimeString('ja', { hour:'2-digit', minute:'2-digit' })}</td>
                    <td className="text-center font-medium">{r.systolic ?? '—'}</td>
                    <td className="text-center font-medium">{r.diastolic ?? '—'}</td>
                    <td className="text-center font-medium">{r.pulse ?? '—'}</td>
                    <td className="text-center font-medium">{r.temperature ?? '—'}</td>
                    <td className="text-center font-medium">{r.spo2 ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 p-3">
        <button onClick={handleSave} disabled={saving}
          className={`w-full rounded-xl py-4 font-bold text-base transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700'} disabled:opacity-40`}>
          {saved ? '✓ 保存しました' : '保存する'}
        </button>
      </div>

      {activeField && (
        <NumKeypad
          value={form[activeField]}
          label={FIELDS.find(f => f.key === activeField)?.label}
          decimal={FIELDS.find(f => f.key === activeField)?.decimal}
          maxVal={FIELDS.find(f => f.key === activeField)?.max}
          onConfirm={val => { setForm(prev => ({ ...prev, [activeField]: val })); setActiveField(null) }}
          onClose={() => setActiveField(null)}
        />
      )}
    </div>
  )
}
