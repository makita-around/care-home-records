'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import VoiceInput from '@/app/components/VoiceInput'
import { useSession } from '@/app/components/SessionContext'

interface Resident { id: number; name: string; roomNumber: string }
interface CommentRecord { id: number; category: string; content: string; recordedAt: string; staff: { name: string } }

function nowLocal() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function CommentPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const session = useSession()
  const router = useRouter()
  const [resident, setResident] = useState<Resident|null>(null)
  const [records, setRecords] = useState<CommentRecord[]>([])
  const [category, setCategory] = useState('ケア')
  const [content, setContent] = useState('')
  const [recordedAt, setRecordedAt] = useState(nowLocal)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadRecords = () => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/records/comment?residentId=${residentId}&dateFrom=${today}&dateTo=${today}`).then(r => r.json()).then(setRecords)
  }
  useEffect(() => {
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(setResident)
    loadRecords()
  }, [residentId])

  const handleSave = async () => {
    if (!session?.staffId) { alert('ログインが必要です'); return }
    if (!content.trim()) { alert('コメントを入力してください'); return }
    setSaving(true)
    await fetch('/api/records/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        residentId: Number(residentId), staffId: session.staffId,
        category, content, recordedAt: new Date(recordedAt).toISOString(),
      }),
    })
    loadRecords(); setContent(''); setRecordedAt(nowLocal())
    setSaving(false); setSaved(true)
    setTimeout(() => router.push('/'), 1000)
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <Header title="コメント入力" backUrl={`/residents/${residentId}`} />

      {resident && (
        <div className="bg-teal-500 px-4 py-2.5">
          <p className="text-white text-sm font-medium">{resident.roomNumber}号　{resident.name}</p>
        </div>
      )}

      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4 space-y-4">
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

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">分類</label>
          <div className="flex gap-2 mt-1.5">
            {['ケア','生活記録'].map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${category === c ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">コメント</label>
            <VoiceInput onResult={text => setContent(prev => prev ? prev + ' ' + text : text)} />
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="内容を入力..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none h-32 outline-none focus:border-teal-400"
          />
        </div>
      </div>

      {records.length > 0 && (
        <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4">
          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">本日のコメント</p>
          {records.map(r => (
            <div key={r.id} className="text-sm border-t border-slate-100 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">{r.category}</span>
                <span className="text-xs text-slate-400">
                  {new Date(r.recordedAt).toLocaleTimeString('ja', { hour:'2-digit', minute:'2-digit' })}　{r.staff.name}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 p-3">
        <button onClick={handleSave} disabled={saving}
          className={`w-full rounded-xl py-4 font-bold text-base transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700'} disabled:opacity-40`}>
          {saved ? '✓ 保存しました' : '保存する'}
        </button>
      </div>
    </div>
  )
}
