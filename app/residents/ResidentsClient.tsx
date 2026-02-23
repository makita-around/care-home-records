'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Resident { id: number; name: string; nameKana: string; roomNumber: string; floor: string; gender: string; birthDate: string; careLevel: string }

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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-700 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href="/" className="text-white text-2xl">←</Link>
        <h1 className="font-bold text-lg">利用者一覧</h1>
      </header>
      {floors.length > 0 && (
        <div className="flex gap-2 px-4 py-2 bg-white border-b overflow-x-auto">
          <button onClick={() => setFloorFilter('')} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${!floorFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>全て</button>
          {floors.map(f => <button key={f} onClick={() => setFloorFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${floorFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{f}</button>)}
        </div>
      )}
      <div className="p-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {filtered.map(r => (
          <Link key={r.id} href={`/residents/${r.id}`} className="bg-white rounded-xl shadow-sm p-3 flex flex-col gap-1 active:bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-blue-600">{r.roomNumber}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${r.gender === '男' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{r.gender}</span>
            </div>
            <p className="font-bold text-sm">{r.name}</p>
            <p className="text-xs text-gray-400">{r.nameKana}</p>
            <p className="text-xs text-gray-500">{calcAge(r.birthDate)}歳　{r.careLevel}</p>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-gray-400 py-8">利用者がいません</p>}
    </div>
  )
}
