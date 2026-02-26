'use client'
import { useEffect, useState } from 'react'
import Header from '@/app/components/Header'

interface Resident { id: number; name: string; nameKana: string; roomNumber: string; floor: string; careLevel: string; gender: string; birthDate: string; isActive: boolean }

const emptyForm = { name: '', nameKana: '', roomNumber: '', floor: '', gender: '女', birthDate: '', careLevel: '' }

export default function AdminResidentsPage() {
  const [allResidents, setAllResidents] = useState<Resident[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [showDischarged, setShowDischarged] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)

  const activeResidents = allResidents.filter(r => r.isActive)
  const dischargedResidents = allResidents.filter(r => !r.isActive)

  const load = () => fetch('/api/residents?all=true').then(r => r.json()).then(setAllResidents)
  useEffect(() => { load() }, [])

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  const updateEdit = (k: string, v: string) => setEditForm(prev => ({ ...prev, [k]: v }))

  const handleAdd = async () => {
    if (!form.name || !form.roomNumber || !form.birthDate) { alert('氏名・部屋番号・生年月日は必須です'); return }
    setSaving(true)
    await fetch('/api/residents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm(emptyForm)
    await load(); setSaving(false)
  }

  const handleStartEdit = (r: Resident) => {
    setEditId(r.id)
    setEditForm({
      name: r.name,
      nameKana: r.nameKana ?? '',
      roomNumber: r.roomNumber ?? '',
      floor: r.floor ?? '',
      gender: r.gender ?? '女',
      birthDate: r.birthDate ? r.birthDate.slice(0, 10) : '',
      careLevel: r.careLevel ?? '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.roomNumber) { alert('氏名・部屋番号は必須です'); return }
    await fetch(`/api/residents/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditId(null)
    await load()
  }

  const handleDischarge = async (id: number, name: string) => {
    if (!confirm(`${name}を退居処理しますか？`)) return
    await fetch(`/api/residents/${id}`, { method: 'DELETE' }); await load()
  }

  const handlePermanentDelete = async (id: number, name: string) => {
    if (!confirm(`【完全削除】${name} のデータを完全に削除しますか？\n全ての記録（バイタル・食事・服薬・申し送りなど）も削除されます。\nこの操作は元に戻せません。`)) return
    await fetch(`/api/residents/${id}?permanent=true`, { method: 'DELETE' }); await load()
  }

  const handleRestore = async (id: number, name: string) => {
    if (!confirm(`${name}を再入居させますか？`)) return
    await fetch(`/api/residents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    })
    await load()
  }

  const ResidentEditForm = () => (
    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      {[{ k: 'name', p: '氏名 *' }, { k: 'nameKana', p: 'ふりがな' }, { k: 'roomNumber', p: '部屋番号 *' }, { k: 'floor', p: 'フロア（例: 1F）' }, { k: 'careLevel', p: '要介護度（例: 要介護3）' }].map(f => (
        <input
          key={f.k}
          value={editForm[f.k as keyof typeof editForm]}
          onChange={e => updateEdit(f.k, e.target.value)}
          placeholder={f.p}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400"
        />
      ))}
      <div className="flex gap-2">
        {['女', '男'].map(g => (
          <button
            key={g}
            onClick={() => updateEdit('gender', g)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${editForm.gender === g ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            {g}性
          </button>
        ))}
      </div>
      <div>
        <label className="text-xs text-slate-500 ml-1">生年月日</label>
        <input
          type="date"
          value={editForm.birthDate}
          onChange={e => updateEdit('birthDate', e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:border-teal-400"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSaveEdit}
          className="flex-1 bg-teal-500 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-teal-600 transition-colors"
        >
          保存
        </button>
        <button
          onClick={() => setEditId(null)}
          className="bg-slate-100 text-slate-500 rounded-xl px-4 py-2.5 text-sm hover:bg-slate-200 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 pb-6">
      <Header title="入居者管理" backUrl="/admin" />

      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4">
        <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">新規追加</p>
        <div className="space-y-2">
          {[{ k: 'name', p: '氏名 *' }, { k: 'nameKana', p: 'ふりがな' }, { k: 'roomNumber', p: '部屋番号 *' }, { k: 'floor', p: 'フロア（例: 1F）' }, { k: 'careLevel', p: '要介護度（例: 要介護3）' }].map(f => (
            <input
              key={f.k}
              value={form[f.k as keyof typeof form]}
              onChange={e => update(f.k, e.target.value)}
              placeholder={f.p}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"
            />
          ))}
          <div className="flex gap-2">
            {['女', '男'].map(g => (
              <button
                key={g}
                onClick={() => update('gender', g)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${form.gender === g ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                {g}性
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-500 ml-1">生年月日 *</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={e => update('birthDate', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:border-teal-400"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full bg-teal-500 text-white rounded-xl py-3.5 font-bold disabled:opacity-40 hover:bg-teal-600 active:bg-teal-700 transition-colors"
          >
            追加する
          </button>
        </div>
      </div>

      {/* 在籍中リスト */}
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        <p className="text-xs font-bold text-slate-500 px-4 py-3 border-b border-slate-100 uppercase tracking-wide">
          在籍中 {activeResidents.length}名
        </p>
        {activeResidents.map((r, i) => (
          <div
            key={r.id}
            className={`px-4 py-3 ${i !== activeResidents.length - 1 ? 'border-b border-slate-100' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-700">{r.roomNumber}号　{r.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.floor}　{r.careLevel}</p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  onClick={() => editId === r.id ? setEditId(null) : handleStartEdit(r)}
                  className="text-xs text-teal-600 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition-colors"
                >
                  {editId === r.id ? '閉じる' : '編集'}
                </button>
                <button
                  onClick={() => handleDischarge(r.id, r.name)}
                  className="text-xs text-red-400 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                >
                  退居
                </button>
                <button
                  onClick={() => handlePermanentDelete(r.id, r.name)}
                  className="text-xs text-white bg-red-500 rounded-lg px-3 py-1.5 hover:bg-red-600 transition-colors"
                >
                  完全削除
                </button>
              </div>
            </div>
            {editId === r.id && <ResidentEditForm />}
          </div>
        ))}
      </div>

      {/* 退居者セクション */}
      {dischargedResidents.length > 0 && (
        <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowDischarged(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-100 text-left"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              退居者 {dischargedResidents.length}名
            </p>
            <svg
              className={`text-slate-400 transition-transform ${showDischarged ? 'rotate-180' : ''}`}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showDischarged && dischargedResidents.map((r, i) => (
            <div
              key={r.id}
              className={`px-4 py-3 ${i !== dischargedResidents.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-400">{r.roomNumber}号　{r.name}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{r.floor}　{r.careLevel}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => editId === r.id ? setEditId(null) : handleStartEdit(r)}
                    className="text-xs text-teal-600 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition-colors"
                  >
                    {editId === r.id ? '閉じる' : '編集'}
                  </button>
                  <button
                    onClick={() => handleRestore(r.id, r.name)}
                    className="text-xs text-teal-600 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition-colors"
                  >
                    再入居
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(r.id, r.name)}
                    className="text-xs text-white bg-red-500 rounded-lg px-3 py-1.5 hover:bg-red-600 transition-colors"
                  >
                    完全削除
                  </button>
                </div>
              </div>
              {editId === r.id && <ResidentEditForm />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
