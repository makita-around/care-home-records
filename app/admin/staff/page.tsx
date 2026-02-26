'use client'
import { useEffect, useState } from 'react'
import Header from '@/app/components/Header'

interface Staff { id: number; name: string; nameKana: string; isAdmin: boolean; pin: string | null; isActive: boolean }

export default function AdminStaffPage() {
  const [allStaff, setAllStaff] = useState<Staff[]>([])
  const [name, setName] = useState('')
  const [nameKana, setNameKana] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editPinId, setEditPinId] = useState<number | null>(null)
  const [editPinValue, setEditPinValue] = useState('')
  const [editNameId, setEditNameId] = useState<number | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [editNameKanaValue, setEditNameKanaValue] = useState('')
  const [showRetired, setShowRetired] = useState(false)

  const activeStaff = allStaff.filter(s => s.isActive)
  const retiredStaff = allStaff.filter(s => !s.isActive)

  const load = () =>
    fetch('/api/staff?all=true')
      .then(r => r.json())
      .then(setAllStaff)

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, nameKana, isAdmin }),
    })
    setName(''); setNameKana(''); setIsAdmin(false)
    await load(); setSaving(false)
  }

  const handleRetire = async (id: number) => {
    if (!confirm('退職処理しますか？')) return
    await fetch(`/api/staff/${id}`, { method: 'DELETE' })
    await load()
  }

  const handlePermanentDelete = async (id: number, sName: string) => {
    if (!confirm(`【完全削除】${sName} のデータを完全に削除しますか？\nこの職員が作成した全ての記録（申し送り・バイタル・食事・服薬など）も削除されます。\nこの操作は元に戻せません。`)) return
    await fetch(`/api/staff/${id}?permanent=true`, { method: 'DELETE' })
    await load()
  }

  const handleRestore = async (id: number) => {
    if (!confirm('復職させますか？')) return
    await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    })
    await load()
  }

  const handleSavePin = async (id: number) => {
    const pin = editPinValue.trim()
    if (pin && !/^\d{4}$/.test(pin)) {
      alert('PINは4桁の数字で入力してください')
      return
    }
    await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin || null }),
    })
    setEditPinId(null)
    setEditPinValue('')
    await load()
  }

  const handleStartEditName = (s: Staff) => {
    setEditNameId(s.id)
    setEditNameValue(s.name)
    setEditNameKanaValue(s.nameKana ?? '')
    setEditPinId(null)
  }

  const handleSaveName = async (id: number) => {
    if (!editNameValue.trim()) { alert('氏名は必須です'); return }
    await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editNameValue.trim(), nameKana: editNameKanaValue.trim() }),
    })
    setEditNameId(null)
    await load()
  }

  const handleToggleAdmin = async (id: number, current: boolean) => {
    if (!confirm(current ? '管理者権限を削除しますか？' : '管理者に設定しますか？')) return
    await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdmin: !current }),
    })
    await load()
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-6">
      <Header title="職員管理" backUrl="/admin" />

      {/* 新規追加フォーム */}
      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4">
        <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">新規追加</p>
        <div className="space-y-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="氏名 *"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"
          />
          <input
            value={nameKana}
            onChange={e => setNameKana(e.target.value)}
            placeholder="ふりがな"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"
          />
          <label className="flex items-center gap-3 px-1 py-1 cursor-pointer">
            <div
              onClick={() => setIsAdmin(v => !v)}
              className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 ${isAdmin ? 'bg-teal-500' : 'bg-slate-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isAdmin ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-slate-700">管理者（PIN不要）</span>
          </label>
          <button
            onClick={handleAdd}
            disabled={!name.trim() || saving}
            className="w-full bg-teal-500 text-white rounded-xl py-3.5 font-bold disabled:opacity-40 hover:bg-teal-600 active:bg-teal-700 transition-colors"
          >
            追加する
          </button>
        </div>
      </div>

      {/* 在職中リスト */}
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        <p className="text-xs font-bold text-slate-500 px-4 py-3 border-b border-slate-100 uppercase tracking-wide">
          在職中 {activeStaff.length}名
        </p>
        {activeStaff.map((s, i) => (
          <div
            key={s.id}
            className={`px-4 py-3 ${i !== activeStaff.length - 1 ? 'border-b border-slate-100' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                s.isAdmin ? 'bg-teal-100' : 'bg-slate-100'
              }`}>
                <span className="text-sm font-bold text-teal-600">{s.name.slice(0, 1)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-700 text-sm">{s.name}</p>
                  {s.isAdmin && (
                    <span className="text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full">管理者</span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{s.nameKana}</p>
                <p className="text-xs mt-0.5">
                  {s.isAdmin ? (
                    <span className="text-teal-500">PIN不要</span>
                  ) : s.pin ? (
                    <span className="text-slate-500">PIN設定済み</span>
                  ) : (
                    <span className="text-red-400">PIN未設定</span>
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  onClick={() => editNameId === s.id ? setEditNameId(null) : handleStartEditName(s)}
                  className="text-xs text-teal-600 border border-teal-200 rounded-lg px-2 py-1 hover:bg-teal-50 transition-colors"
                >
                  {editNameId === s.id ? '閉じる' : '編集'}
                </button>
                <button
                  onClick={() => handleToggleAdmin(s.id, s.isAdmin)}
                  className="text-xs text-teal-600 border border-teal-200 rounded-lg px-2 py-1 hover:bg-teal-50 transition-colors"
                >
                  {s.isAdmin ? '管理者解除' : '管理者設定'}
                </button>
                {!s.isAdmin && (
                  <button
                    onClick={() => { setEditPinId(s.id); setEditPinValue(''); setEditNameId(null) }}
                    className="text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50 transition-colors"
                  >
                    PIN変更
                  </button>
                )}
                <button
                  onClick={() => handleRetire(s.id)}
                  className="text-xs text-red-400 border border-red-100 rounded-lg px-2 py-1 hover:bg-red-50 transition-colors"
                >
                  退職
                </button>
                <button
                  onClick={() => handlePermanentDelete(s.id, s.name)}
                  className="text-xs text-white bg-red-500 rounded-lg px-2 py-1 hover:bg-red-600 transition-colors"
                >
                  完全削除
                </button>
              </div>
            </div>

            {/* 名前編集 */}
            {editNameId === s.id && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                <input
                  value={editNameValue}
                  onChange={e => setEditNameValue(e.target.value)}
                  placeholder="氏名 *"
                  className="w-full border border-teal-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                />
                <input
                  value={editNameKanaValue}
                  onChange={e => setEditNameKanaValue(e.target.value)}
                  placeholder="ふりがな"
                  className="w-full border border-teal-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveName(s.id)}
                    className="flex-1 bg-teal-500 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-teal-600 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditNameId(null)}
                    className="bg-slate-100 text-slate-500 rounded-xl px-4 py-2.5 text-sm hover:bg-slate-200 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* PIN編集 */}
            {editPinId === s.id && (
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                <input
                  value={editPinValue}
                  onChange={e => setEditPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4桁PIN"
                  maxLength={4}
                  inputMode="numeric"
                  className="border border-teal-300 rounded-xl px-3 py-2 text-sm flex-1 outline-none focus:border-teal-500 text-center tracking-widest text-lg"
                />
                <button
                  onClick={() => handleSavePin(s.id)}
                  className="bg-teal-500 text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-teal-600 transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditPinId(null)}
                  className="bg-slate-100 text-slate-500 rounded-xl px-3 py-2 text-sm hover:bg-slate-200 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 退職者セクション */}
      {retiredStaff.length > 0 && (
        <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowRetired(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 text-left"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              退職者 {retiredStaff.length}名
            </p>
            <svg
              className={`text-slate-400 transition-transform ${showRetired ? 'rotate-180' : ''}`}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showRetired && retiredStaff.map((s, i) => (
            <div
              key={s.id}
              className={`px-4 py-3 ${i !== retiredStaff.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-slate-400">{s.name.slice(0, 1)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-400 text-sm">{s.name}</p>
                  <p className="text-xs text-slate-300">{s.nameKana}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => editNameId === s.id ? setEditNameId(null) : handleStartEditName(s)}
                    className="text-xs text-teal-600 border border-teal-200 rounded-lg px-2 py-1 hover:bg-teal-50 transition-colors"
                  >
                    {editNameId === s.id ? '閉じる' : '編集'}
                  </button>
                  <button
                    onClick={() => handleRestore(s.id)}
                    className="text-xs text-teal-600 border border-teal-200 rounded-lg px-2 py-1 hover:bg-teal-50 transition-colors"
                  >
                    復職
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(s.id, s.name)}
                    className="text-xs text-white bg-red-500 rounded-lg px-2 py-1 hover:bg-red-600 transition-colors"
                  >
                    完全削除
                  </button>
                </div>
              </div>
              {editNameId === s.id && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  <input
                    value={editNameValue}
                    onChange={e => setEditNameValue(e.target.value)}
                    placeholder="氏名 *"
                    className="w-full border border-teal-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                  />
                  <input
                    value={editNameKanaValue}
                    onChange={e => setEditNameKanaValue(e.target.value)}
                    placeholder="ふりがな"
                    className="w-full border border-teal-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveName(s.id)}
                      className="flex-1 bg-teal-500 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-teal-600 transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditNameId(null)}
                      className="bg-slate-100 text-slate-500 rounded-xl px-4 py-2.5 text-sm hover:bg-slate-200 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
