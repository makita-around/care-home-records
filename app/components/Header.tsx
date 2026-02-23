'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Staff { id: number; name: string }

export default function Header({ facilityName }: { facilityName?: string }) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState('')

  useEffect(() => {
    fetch('/api/staff').then(r => r.json()).then(setStaff)
    const saved = localStorage.getItem('staffId')
    if (saved) setSelectedStaffId(saved)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStaffId(e.target.value)
    localStorage.setItem('staffId', e.target.value)
  }

  return (
    <header className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow">
      <Link href="/" className="font-bold text-lg">{facilityName || '生活記録'}</Link>
      <select value={selectedStaffId} onChange={handleChange}
        className="text-sm bg-blue-600 text-white border border-blue-400 rounded px-2 py-1">
        <option value="">担当者選択</option>
        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </header>
  )
}
