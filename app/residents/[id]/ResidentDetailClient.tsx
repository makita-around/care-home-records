'use client'
import Link from 'next/link'
import Header from '@/app/components/Header'

interface Resident { id: number; name: string; nameKana: string; roomNumber: string; floor: string; gender: string; birthDate: string; careLevel: string }

function calcAge(birthDate: string) {
  const b = new Date(birthDate); const today = new Date()
  let age = today.getFullYear() - b.getFullYear()
  if (today.getMonth() < b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) age--
  return age
}

const RECORD_TYPES = [
  { key: 'vital',        label: 'バイタル',    icon: '💓', color: 'bg-red-400',    border: 'border-l-red-400' },
  { key: 'meal',         label: '食事',         icon: '🍚', color: 'bg-orange-400', border: 'border-l-orange-400' },
  { key: 'medication',   label: '服薬',         icon: '💊', color: 'bg-green-500',  border: 'border-l-green-500' },
  { key: 'night-patrol', label: '夜間巡視',    icon: '🌙', color: 'bg-indigo-500', border: 'border-l-indigo-500' },
  { key: 'comment',      label: 'コメント',    icon: '📝', color: 'bg-teal-500',   border: 'border-l-teal-500' },
]

export default function ResidentDetailClient({ resident }: { resident: Resident }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header title="ケア記録" backUrl="/residents" />

      {/* 利用者情報カード */}
      <div className="bg-white mx-0 border-b border-slate-200 px-4 py-4 flex items-center gap-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
          resident.gender === '男' ? 'bg-blue-100' : 'bg-pink-100'
        }`}>
          <span className="text-3xl">{resident.gender === '男' ? '👴' : '👵'}</span>
        </div>
        <div>
          <p className="text-xs text-teal-600 font-bold">{resident.roomNumber}号　{resident.floor}</p>
          <p className="font-bold text-slate-800 text-xl leading-tight">{resident.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{resident.nameKana}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {resident.gender}性　{calcAge(resident.birthDate)}歳　{resident.careLevel}
          </p>
        </div>
      </div>

      {/* 記録種別リスト（アコーディオン風） */}
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        {RECORD_TYPES.map((rt, i) => (
          <Link
            key={rt.key}
            href={`/records/${rt.key}/${resident.id}`}
            className={`flex items-center gap-4 px-4 py-4 border-l-4 ${rt.border} hover:bg-slate-50 active:bg-slate-100 transition-colors ${
              i !== RECORD_TYPES.length - 1 ? 'border-b border-slate-100' : ''
            }`}
          >
            <div className={`w-10 h-10 rounded-full ${rt.color} flex items-center justify-center flex-shrink-0`}>
              <span className="text-lg">{rt.icon}</span>
            </div>
            <span className="font-bold text-slate-700 text-base flex-1">{rt.label}</span>
            <svg className="text-slate-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* ケア記録（過去記録閲覧） */}
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        <Link
          href={`/residents/${resident.id}/care-records`}
          className="flex items-center gap-4 px-4 py-4 border-l-4 border-l-cyan-500 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📅</span>
          </div>
          <span className="font-bold text-slate-700 text-base flex-1">ケア記録</span>
          <svg className="text-slate-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* アセスメントシート */}
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        <Link
          href={`/assessment/${resident.id}`}
          className="flex items-center gap-4 px-4 py-4 border-l-4 border-l-purple-400 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📋</span>
          </div>
          <span className="font-bold text-slate-700 text-base flex-1">アセスメントシート</span>
          <svg className="text-slate-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
