'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'

interface Resident { id: number; name: string; roomNumber: string }
interface CommentRecord { id: number; category: string; content: string; recordedAt: string; staff: { name: string } }

export default function CommentPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const [resident, setResident] = useState<Resident|null>(null)
  const [records, setRecords] = useState<CommentRecord[]>([])
  const [category, setCategory] = useState('ケア')
  const [content, setContent] = useState('')
  const [staffId, setStaffId] = useState(''); const [saving, setSaving] = useState(false)

  const loadRecords = () => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/records/comment?residentId=${residentId}&dateFrom=${today}&dateTo=${today}`).then(r => r.json()).then(setRecords)
  }
  useEffect(() => {
    setStaffId(localStorage.getItem('staffId') || '')
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(setResident)
    loadRecords()
  }, [residentId])

  const handleSave = async () => {
    if (!staffId) { alert('担当者を選択してください'); return }
    if (!content.trim()) { alert('コメントを入力してください'); return }
    setSaving(true)
    await fetch('/api/records/comment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ residentId: Number(residentId), staffId: Number(staffId), category, content }) })
    loadRecords(); setContent(''); setSaving(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href={`/residents/${residentId}`} className="text-white text-2xl">←</Link>
        <div><h1 className="font-bold text-lg">コメント入力</h1>{resident && <p className="text-xs text-blue-200">{resident.roomNumber}　{resident.name}</p>}</div>
      </header>
      <div className="p-4 space-y-3">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <div className="flex gap-2">
            {['ケア','生活記録'].map(c => <button key={c} onClick={() => setCategory(c)} className={`flex-1 py-2 rounded-lg font-bold text-sm ${category === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{c}</button>)}
          </div>
          <div><label className="text-sm text-gray-600">コメント</label><textarea value={content} onChange={e => setContent(e.target.value)} placeholder="内容を入力..." className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none h-28" /></div>
          <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold disabled:opacity-40">保存する</button>
        </div>
        {records.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-bold text-sm text-gray-600 mb-2">本日のコメント</h2>
            {records.map(r => (
              <div key={r.id} className="text-sm border-t py-2">
                <p className="text-xs text-gray-400">{new Date(r.recordedAt).toLocaleTimeString('ja', { hour:'2-digit', minute:'2-digit' })}　{r.category}　{r.staff.name}</p>
                <p className="mt-1 whitespace-pre-wrap">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
