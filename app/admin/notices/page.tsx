'use client'
import { useEffect, useState } from 'react'
import Header from '@/app/components/Header'

interface Notice {
  id: number
  content: string
  createdAt: string
  staff: { name: string }
  resident: { name: string; roomNumber: string } | null
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const data = await fetch('/api/notices?limit=1000').then(r => r.json())
    setNotices(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('この申し送りを削除しますか？')) return
    await fetch(`/api/notices/${id}`, { method: 'DELETE' })
    await load()
  }

  const handleDeleteAll = async () => {
    if (notices.length === 0) return
    if (!confirm(`全ての申し送り（${notices.length}件）を完全に削除しますか？\nこの操作は元に戻せません。`)) return
    await fetch('/api/notices', { method: 'DELETE' })
    await load()
  }

  const fmt = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-6">
      <Header title="申し送り管理" backUrl="/admin" />

      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {loading ? '読み込み中…' : `${notices.length}件`}
        </p>
        {notices.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors font-bold"
          >
            全件削除
          </button>
        )}
      </div>

      {!loading && notices.length === 0 && (
        <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-8 text-center text-slate-400 text-sm">
          申し送りはありません
        </div>
      )}

      {notices.length > 0 && (
        <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
          {notices.map((n, i) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 ${i !== notices.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs text-slate-400">{fmt(n.createdAt)}</span>
                  <span className="text-xs text-slate-500 font-medium">{n.staff.name}</span>
                  {n.resident ? (
                    <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">
                      {n.resident.roomNumber}号 {n.resident.name}
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">施設全体</span>
                  )}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{n.content}</p>
              </div>
              <button
                onClick={() => handleDelete(n.id)}
                className="text-xs text-red-400 border border-red-100 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors flex-shrink-0 mt-0.5"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
