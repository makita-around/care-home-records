'use client'
import { useState } from 'react'
import Link from 'next/link'
import Header from '@/app/components/Header'

interface Resident {
  id: number; name: string; nameKana: string; roomNumber: string
  floor: string; gender: string; birthDate: string; careLevel: string
}

function calcAge(birthDate: string) {
  const b = new Date(birthDate); const today = new Date()
  let age = today.getFullYear() - b.getFullYear()
  if (today.getMonth() < b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) age--
  return age
}

export default function ResidentsClient({ residents, floors }: { residents: Resident[]; floors: string[] }) {
  const [floorFilter, setFloorFilter] = useState('')
  const filtered = floorFilter ? residents.filter(r => r.floor === floorFilter) : residents

  return (
    <div className="min-h-screen bg-slate-100">
      <Header title="利用者一覧" backUrl="/" />

      {/* フロアフィルター */}
      {floors.length > 0 && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-14 z-20">
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            <button
              onClick={() => setFloorFilter('')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                !floorFilter ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              全て
            </button>
            {floors.map(f => (
              <button
                key={f}
                onClick={() => setFloorFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                  floorFilter === f ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 利用者リスト */}
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        {filtered.map((r, i) => (
          <Link
            key={r.id}
            href={`/residents/${r.id}`}
            className={`flex items-center gap-3 px-4 py-4 hover:bg-teal-50 active:bg-teal-100 transition-colors ${
              i !== filtered.length - 1 ? 'border-b border-slate-100' : ''
            }`}
          >
            {/* アバター */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
              r.gender === '男' ? 'bg-blue-100' : 'bg-pink-100'
            }`}>
              <span className="text-2xl">{r.gender === '男' ? '👴' : '👵'}</span>
            </div>

            {/* 情報 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-teal-600">{r.roomNumber}号</span>
                {r.careLevel && <span className="text-xs text-slate-400">{r.careLevel}</span>}
              </div>
              <p className="font-bold text-slate-800 text-base leading-tight">{r.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{r.nameKana}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {r.gender}性　{calcAge(r.birthDate)}歳
              </p>
            </div>

            {/* シェブロン */}
            <svg className="text-slate-300 flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">利用者がいません</div>
      )}
    </div>
  )
}
