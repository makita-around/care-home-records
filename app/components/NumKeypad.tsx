'use client'
import { useState } from 'react'

interface NumKeypadProps {
  value: string
  onConfirm: (val: string) => void
  onClose: () => void
  label?: string
  decimal?: boolean
  maxVal?: number
}

export default function NumKeypad({ value: initialValue, onConfirm, onClose, label, decimal, maxVal }: NumKeypadProps) {
  const [val, setVal] = useState(initialValue || '')

  const press = (k: string) => {
    if (k === 'del') { setVal(v => v.slice(0, -1)); return }
    if (k === '.' && !decimal) return
    if (k === '.' && val.includes('.')) return
    const next = val + k
    if (maxVal !== undefined && Number(next) > maxVal) return
    setVal(next)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-sm p-4" onClick={e => e.stopPropagation()}>
        {label && <p className="text-center text-sm text-gray-500 mb-2">{label}</p>}
        <div className="text-center text-3xl font-bold mb-4 min-h-10">{val || '—'}</div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {['7','8','9','4','5','6','1','2','3'].map(k => (
            <button key={k} onClick={() => press(k)} className="bg-gray-100 rounded-xl py-4 text-xl font-semibold active:bg-gray-300">{k}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {decimal ? <button onClick={() => press('.')} className="bg-gray-100 rounded-xl py-4 text-xl font-semibold active:bg-gray-300">.</button> : <div />}
          <button onClick={() => press('0')} className="bg-gray-100 rounded-xl py-4 text-xl font-semibold active:bg-gray-300">0</button>
          <button onClick={() => press('del')} className="bg-gray-100 rounded-xl py-4 text-xl font-semibold active:bg-gray-300">⌫</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onClose} className="bg-gray-200 rounded-xl py-3 font-semibold">キャンセル</button>
          <button onClick={() => onConfirm(val)} className="bg-blue-600 text-white rounded-xl py-3 font-semibold">確定</button>
        </div>
      </div>
    </div>
  )
}
