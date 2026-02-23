'use client'
import Link from 'next/link'

interface Resident { id: number; name: string; roomNumber: string; floor: string; gender: string; birthDate: string; careLevel: string }

const RECORD_TYPES = [
  { key: 'vital', label: 'バイタル', icon: '💓', color: 'bg-red-500' },
  { key: 'meal', label: '食事', icon: '🍚', color: 'bg-orange-500' },
  { key: 'medication', label: '服薬', icon: '💊', color: 'bg-green-500' },
  { key: 'night-patrol', label: '夜間巡視', icon: '🌙', color: 'bg-indigo-500' },
  { key: 'comment', label: 'コメント', icon: '📝', color: 'bg-blue-500' },
]

export default function ResidentDetailClient({ resident }: { resident: Resident }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-700 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href="/residents" className="text-white text-2xl">←</Link>
        <div>
          <h1 className="font-bold text-lg">{resident.name}</h1>
          <p className="text-xs text-blue-200">{resident.roomNumber}　{resident.floor}　{resident.careLevel}</p>
        </div>
      </header>
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-500 font-medium">記録種別を選択</p>
        {RECORD_TYPES.map(rt => (
          <Link key={rt.key} href={`/records/${rt.key}/${resident.id}`}
            className={`${rt.color} text-white rounded-xl p-4 flex items-center gap-4 shadow-sm active:opacity-80`}>
            <span className="text-3xl">{rt.icon}</span>
            <span className="font-bold text-lg">{rt.label}</span>
          </Link>
        ))}
        <Link href={`/assessment/${resident.id}`} className="bg-purple-500 text-white rounded-xl p-4 flex items-center gap-4 shadow-sm active:opacity-80">
          <span className="text-3xl">📋</span>
          <span className="font-bold text-lg">アセスメントシート</span>
        </Link>
      </div>
    </div>
  )
}
