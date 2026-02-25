'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import VoiceInput from '@/app/components/VoiceInput'
import { useSession } from '@/app/components/SessionContext'

interface Resident { id: number; name: string; roomNumber: string }

export default function NoticesPage() {
  const router = useRouter()
  const session = useSession()
  const [residents, setResidents] = useState<Resident[]>([])
  const [residentId, setResidentId] = useState('')
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetch('/api/residents').then(r => r.json()).then(d => { if (Array.isArray(d)) setResidents(d) })
  }, [])

  const post = async () => {
    if (!text.trim() || !session?.staffId) return
    setPosting(true)
    try {
      await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          staffId: session.staffId,
          ...(residentId ? { residentId: Number(residentId) } : {}),
        }),
      })
      router.push('/')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header title="申し送り" backUrl="/" />
      <div className="bg-white mt-2 shadow-sm px-4 py-4 space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">対象</label>
          <select
            value={residentId}
            onChange={e => setResidentId(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1.5 outline-none focus:border-teal-400 bg-white"
          >
            <option value="">施設（利用者指定なし）</option>
            {residents.map(r => (
              <option key={r.id} value={String(r.id)}>{r.roomNumber}号　{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">内容</label>
            <VoiceInput onResult={t => setText(prev => prev ? prev + ' ' + t : t)} />
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="申し送りを入力..."
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none h-32 outline-none focus:border-teal-400 placeholder:text-slate-300"
          />
        </div>
        <button
          onClick={post}
          disabled={!text.trim() || posting || !session?.staffId}
          className="w-full bg-teal-500 text-white rounded-xl py-3.5 font-bold text-base hover:bg-teal-600 active:bg-teal-700 transition-colors disabled:opacity-40"
        >
          {posting ? '投稿中...' : '投稿する'}
        </button>
      </div>
    </div>
  )
}
