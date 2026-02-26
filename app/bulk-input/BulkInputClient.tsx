'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NumKeypad from '@/app/components/NumKeypad'
import { useSession } from '@/app/components/SessionContext'

function nowLocal() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

type RecordType = 'vital' | 'meal' | 'medication' | 'night-patrol' | 'comment'
type Mode = 'select' | 'A-residents' | 'A-type' | 'A-form' | 'B-type' | 'B-overview'

interface Resident {
  id: number; name: string; nameKana: string; roomNumber: string; floor: string; gender: string
  hasRecord: boolean
  detail?: Record<string, { mainDish: number | null; sideDish: number | null }> // meal
    | { residentId: number; systolic: number | null; diastolic: number | null; pulse: number | null; temperature: number | null; spo2: number | null } // vital
    | Record<string, boolean | null> // medication
    | { patrolTime: string; status: string }[] // night-patrol
    | { category: string; content: string }[] // comment
    | null
}

type MealEntry = { main: string; side: string }
type MealForm = { '朝': MealEntry; '昼': MealEntry; '夕': MealEntry; comment: string }
type VitalForm = { systolic: string; diastolic: string; pulse: string; temperature: string; spo2: string; comment: string }
type MedForm = { beforeBreakfast: boolean; afterBreakfast: boolean; beforeLunch: boolean; afterLunch: boolean; beforeDinner: boolean; afterDinner: boolean; bedtime: boolean; eyeDrop: boolean; comment: string }
type CommentForm = { category: string; content: string }
type NightForm = { patrolTime: string; status: string; comment: string }

const MEAL_TYPES = ['朝', '昼', '夕'] as const
const RECORD_TYPES = [
  { key: 'vital' as RecordType,        label: 'バイタル', icon: '💓', color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
  { key: 'meal' as RecordType,         label: '食事',     icon: '🍚', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  { key: 'medication' as RecordType,   label: '服薬・点眼', icon: '💊', color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  { key: 'night-patrol' as RecordType, label: '夜間巡視', icon: '🌙', color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-200' },
  { key: 'comment' as RecordType,      label: 'コメント', icon: '📝', color: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200' },
]
const MED_LABELS: { key: keyof Omit<MedForm, 'comment'>; label: string }[] = [
  { key: 'beforeBreakfast', label: '朝食前' },
  { key: 'afterBreakfast',  label: '朝食後' },
  { key: 'beforeLunch',     label: '昼食前' },
  { key: 'afterLunch',      label: '昼食後' },
  { key: 'beforeDinner',    label: '夕食前' },
  { key: 'afterDinner',     label: '夕食後' },
  { key: 'bedtime',         label: '眠前' },
  { key: 'eyeDrop',         label: '点眼' },
]

function initMealForm(): MealForm {
  return { '朝': { main: '', side: '' }, '昼': { main: '', side: '' }, '夕': { main: '', side: '' }, comment: '' }
}
function initVitalForm(): VitalForm {
  return { systolic: '', diastolic: '', pulse: '', temperature: '', spo2: '', comment: '' }
}
function initMedForm(): MedForm {
  return { beforeBreakfast: false, afterBreakfast: false, beforeLunch: false, afterLunch: false, beforeDinner: false, afterDinner: false, bedtime: false, eyeDrop: false, comment: '' }
}
function initCommentForm(): CommentForm { return { category: 'ケア', content: '' } }
function initNightForm(): NightForm {
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return { patrolTime: `${hh}:${mm}`, status: '睡眠中', comment: '' }
}

function avatarBg(gender: string) { return gender === '男' ? 'bg-blue-100' : 'bg-pink-100' }
function avatarEmoji(gender: string) { return gender === '男' ? '👴' : '👵' }

export default function BulkInputClient() {
  const session = useSession()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('select')
  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  // Shared
  const [allResidents, setAllResidents] = useState<Resident[]>([])
  const [checklistResidents, setChecklistResidents] = useState<Resident[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [floorFilter, setFloorFilter] = useState('')
  const [selectedType, setSelectedType] = useState<RecordType | null>(null)
  const [loading, setLoading] = useState(false)

  // A-form
  const [aForms, setAForms] = useState<Map<number, MealForm | VitalForm | MedForm | CommentForm | NightForm>>(new Map())
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ ok: number; skip: number } | null>(null)

  // 共通日時
  const [bulkDatetime, setBulkDatetime] = useState(nowLocal)

  // 食事デフォルト値（A-form meal用）
  const [mealDefaultTimes, setMealDefaultTimes] = useState<string[]>([])
  const [mealDefaultMain, setMealDefaultMain] = useState<string>('')
  const [mealDefaultSide, setMealDefaultSide] = useState<string>('')

  // B-overview inline editing
  const [bExpandedId, setBExpandedId] = useState<number | null>(null)
  const [bEditMeal, setBEditMeal] = useState<'朝' | '昼' | '夕' | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bForm, setBForm] = useState<any>(null)
  const [bSavingId, setBSavingId] = useState<number | null>(null)

  // NumKeypad（バイタル用）
  const [activeKeypad, setActiveKeypad] = useState<{
    residentId: number; field: string; label: string; decimal?: boolean; maxVal?: number; isB?: boolean
  } | null>(null)

  // 食事量ピッカーポップアップ
  const [activeMealPicker, setActiveMealPicker] = useState<{
    residentId: number; field: string; label: string; isB?: boolean
  } | null>(null)

  const floors = [...new Set(allResidents.map(r => r.floor).filter(Boolean))].sort()

  const loadResidents = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/records/daily-status?date=${today}`)
    setAllResidents(await res.json())
    setLoading(false)
  }, [today])

  const loadChecklist = useCallback(async (type: RecordType, ids?: number[]) => {
    setLoading(true)
    const res = await fetch(`/api/records/daily-status?date=${today}&type=${type}&detail=true`)
    const data: Resident[] = await res.json()
    const filtered = ids ? data.filter(r => ids.includes(r.id)) : data
    setChecklistResidents(filtered)
    setLoading(false)
    return filtered
  }, [today])

  useEffect(() => {
    if (mode === 'A-residents') loadResidents()
  }, [mode, loadResidents])

  const filteredResidents = floorFilter ? allResidents.filter(r => r.floor === floorFilter) : allResidents

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const visible = filteredResidents.map(r => r.id)
    const allSelected = visible.length > 0 && visible.every(id => selectedIds.has(id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allSelected) visible.forEach(id => next.delete(id))
      else visible.forEach(id => next.add(id))
      return next
    })
  }

  const initAForms = (residents: Resident[], type: RecordType) => {
    const map = new Map<number, MealForm | VitalForm | MedForm | CommentForm | NightForm>()
    residents.forEach(r => {
      if (type === 'meal') map.set(r.id, initMealForm())
      else if (type === 'vital') map.set(r.id, initVitalForm())
      else if (type === 'medication') map.set(r.id, initMedForm())
      else if (type === 'comment') map.set(r.id, initCommentForm())
      else map.set(r.id, initNightForm())
    })
    setAForms(map)
  }

  const updateAMealEntry = (residentId: number, mt: '朝' | '昼' | '夕', field: 'main' | 'side', value: string) => {
    setAForms(prev => {
      const next = new Map(prev)
      const form = { ...(next.get(residentId) as MealForm) }
      form[mt] = { ...form[mt], [field]: value }
      next.set(residentId, form)
      return next
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateAForm = (residentId: number, updates: Record<string, any>) => {
    setAForms(prev => {
      const next = new Map(prev)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next.set(residentId, { ...next.get(residentId) as object, ...updates } as any)
      return next
    })
  }

  const handleKeypadConfirm = (val: string) => {
    if (!activeKeypad) return
    const { residentId, field, isB } = activeKeypad
    if (isB) {
      setBForm((prev: Record<string, string>) => ({ ...prev, [field]: val }))
    } else if (selectedType === 'meal') {
      const [mt, subField] = field.split('_')
      updateAMealEntry(residentId, mt as '朝' | '昼' | '夕', subField as 'main' | 'side', val)
    } else {
      updateAForm(residentId, { [field]: val })
    }
    setActiveKeypad(null)
  }

  // ─── MEAL DEFAULTS 一括適用 ───
  const applyMealDefaults = () => {
    if (mealDefaultTimes.length === 0) return
    checklistResidents.forEach(r => {
      mealDefaultTimes.forEach(mt => {
        updateAMealEntry(r.id, mt as '朝' | '昼' | '夕', 'main', mealDefaultMain)
        updateAMealEntry(r.id, mt as '朝' | '昼' | '夕', 'side', mealDefaultSide)
      })
    })
  }

  // ─── SAVE A-FORM ───
  const saveAForms = async () => {
    if (!session?.staffId) return
    setSaving(true)
    setSaveResult(null)
    let ok = 0; let skip = 0

    for (const r of checklistResidents) {
      const form = aForms.get(r.id)
      if (!form) { skip++; continue }

      try {
        if (selectedType === 'meal') {
          const mf = form as MealForm
          let saved = false
          for (const mt of MEAL_TYPES) {
            const entry = mf[mt]
            if (entry.main || entry.side) {
              await fetch('/api/records/meal', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  residentId: r.id, staffId: session.staffId, mealType: mt,
                  mainDish: entry.main ? Number(entry.main) : null,
                  sideDish: entry.side ? Number(entry.side) : null,
                  comment: mf.comment,
                  recordedAt: new Date(bulkDatetime).toISOString(),
                }),
              })
              saved = true
            }
          }
          if (saved) ok++; else skip++
        } else if (selectedType === 'vital') {
          const vf = form as VitalForm
          if (vf.systolic || vf.diastolic || vf.pulse || vf.temperature || vf.spo2) {
            await fetch('/api/records/vital', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                residentId: r.id, staffId: session.staffId,
                systolic: vf.systolic ? Number(vf.systolic) : null,
                diastolic: vf.diastolic ? Number(vf.diastolic) : null,
                pulse: vf.pulse ? Number(vf.pulse) : null,
                temperature: vf.temperature ? Number(vf.temperature) : null,
                spo2: vf.spo2 ? Number(vf.spo2) : null,
                comment: vf.comment,
                recordedAt: new Date(bulkDatetime).toISOString(),
              }),
            })
            ok++
          } else skip++
        } else if (selectedType === 'medication') {
          const mf = form as MedForm
          const hasAny = MED_LABELS.some(m => mf[m.key])
          if (hasAny) {
            await fetch('/api/records/medication', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ residentId: r.id, staffId: session.staffId, ...mf, recordedAt: new Date(bulkDatetime).toISOString() }),
            })
            ok++
          } else skip++
        } else if (selectedType === 'comment') {
          const cf = form as CommentForm
          if (cf.content) {
            await fetch('/api/records/comment', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ residentId: r.id, staffId: session.staffId, category: cf.category, content: cf.content, recordedAt: new Date(bulkDatetime).toISOString() }),
            })
            ok++
          } else skip++
        } else if (selectedType === 'night-patrol') {
          const nf = form as NightForm
          if (nf.status) {
            await fetch('/api/records/night-patrol', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                residentId: r.id, staffId: session.staffId,
                patrolTime: new Date(bulkDatetime).toISOString(),
                status: nf.status, comment: nf.comment,
              }),
            })
            ok++
          } else skip++
        }
      } catch { skip++ }
    }

    setSaving(false)
    setSaveResult({ ok, skip })
    if (ok > 0 && selectedType) {
      const ids = [...selectedIds]
      loadChecklist(selectedType, ids.length > 0 ? ids : undefined)
    }
    if (ok > 0) setTimeout(() => router.push('/'), 1500)
  }

  // ─── SAVE B-FORM (individual) ───
  const saveBForm = async (residentId: number) => {
    if (!session?.staffId || !bForm || !selectedType) return
    setBSavingId(residentId)
    try {
      if (selectedType === 'meal' && bEditMeal) {
        await fetch('/api/records/meal', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            residentId, staffId: session.staffId, mealType: bEditMeal,
            mainDish: bForm.main ? Number(bForm.main) : null,
            sideDish: bForm.side ? Number(bForm.side) : null,
            comment: '', recordedAt: new Date(bulkDatetime).toISOString(),
          }),
        })
      } else if (selectedType === 'vital') {
        await fetch('/api/records/vital', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            residentId, staffId: session.staffId,
            systolic: bForm.systolic ? Number(bForm.systolic) : null,
            diastolic: bForm.diastolic ? Number(bForm.diastolic) : null,
            pulse: bForm.pulse ? Number(bForm.pulse) : null,
            temperature: bForm.temperature ? Number(bForm.temperature) : null,
            spo2: bForm.spo2 ? Number(bForm.spo2) : null,
            comment: bForm.comment || '', recordedAt: new Date(bulkDatetime).toISOString(),
          }),
        })
      } else if (selectedType === 'medication') {
        await fetch('/api/records/medication', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ residentId, staffId: session.staffId, ...bForm, recordedAt: new Date(bulkDatetime).toISOString() }),
        })
      } else if (selectedType === 'comment') {
        await fetch('/api/records/comment', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ residentId, staffId: session.staffId, category: bForm.category, content: bForm.content, recordedAt: new Date(bulkDatetime).toISOString() }),
        })
      }
      // Reload to update display
      await loadChecklist(selectedType)
      setBExpandedId(null); setBForm(null); setBEditMeal(null)
    } catch {
      alert('保存に失敗しました')
    }
    setBSavingId(null)
  }

  // ────────────────────────────
  // MODE: select
  // ────────────────────────────
  if (mode === 'select') {
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm text-slate-500 font-medium px-1">入力パターンを選択してください</p>
        <button onClick={() => setMode('A-residents')}
          className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left hover:bg-teal-50 active:bg-teal-100 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="font-bold text-slate-700 text-base">パターン A</p>
              <p className="text-sm text-slate-500 mt-0.5">利用者を選ぶ → 種別を選ぶ</p>
              <p className="text-xs text-slate-400 mt-1">全員分のフォームをまとめて入力・一括保存</p>
            </div>
          </div>
        </button>
        <button onClick={() => setMode('B-type')}
          className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left hover:bg-orange-50 active:bg-orange-100 transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-400 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <p className="font-bold text-slate-700 text-base">パターン B</p>
              <p className="text-sm text-slate-500 mt-0.5">種別を選ぶ → 全員の入力状況を確認</p>
              <p className="text-xs text-slate-400 mt-1">入力状況を見ながら、未入力をタップして入力</p>
            </div>
          </div>
        </button>
      </div>
    )
  }

  // ────────────────────────────
  // MODE: A-residents
  // ────────────────────────────
  if (mode === 'A-residents') {
    const visibleIds = filteredResidents.map(r => r.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id))
    return (
      <div className="pb-28">
        {floors.length > 0 && (
          <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-14 z-20">
            <div className="flex gap-2 overflow-x-auto">
              <button onClick={() => setFloorFilter('')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${!floorFilter ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                全て
              </button>
              {floors.map(f => (
                <button key={f} onClick={() => setFloorFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${floorFilter === f ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm text-slate-500">{selectedIds.size}名 選択中</span>
          <button onClick={toggleAll} className="text-sm font-bold text-teal-600">
            {allVisibleSelected ? '選択解除' : '全て選択'}
          </button>
        </div>
        {loading ? (
          <div className="text-center py-12 text-slate-400">読み込み中...</div>
        ) : (
          <div className="bg-white mx-0 shadow-sm overflow-hidden">
            {filteredResidents.map((r, i) => {
              const selected = selectedIds.has(r.id)
              return (
                <button key={r.id} onClick={() => toggleSelect(r.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${selected ? 'bg-teal-50' : 'bg-white hover:bg-slate-50'} ${i !== filteredResidents.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white'}`}>
                    {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${avatarBg(r.gender)}`}>
                    <span className="text-lg">{avatarEmoji(r.gender)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-700 text-sm leading-tight">{r.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.roomNumber}号　{r.floor}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 p-3 flex gap-2">
          <button onClick={() => { setMode('select'); setSelectedIds(new Set()) }}
            className="bg-slate-100 text-slate-600 rounded-xl py-4 px-6 font-bold hover:bg-slate-200 transition-colors">
            戻る
          </button>
          <button disabled={selectedIds.size === 0} onClick={() => setMode('A-type')}
            className="flex-1 bg-teal-500 text-white rounded-xl py-4 font-bold disabled:opacity-40 hover:bg-teal-600 transition-colors">
            次へ ({selectedIds.size}名)
          </button>
        </div>
      </div>
    )
  }

  // ────────────────────────────
  // MODE: A-type / B-type
  // ────────────────────────────
  if (mode === 'A-type' || mode === 'B-type') {
    const isA = mode === 'A-type'
    return (
      <div className="pb-28">
        <div className="bg-white mt-2 shadow-sm px-4 py-4">
          <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">
            {isA ? `${selectedIds.size}名の記録種別を選択` : '記録種別を選択してください'}
          </p>
          <div className="space-y-2">
            {RECORD_TYPES.map(rt => (
              <button key={rt.key}
                onClick={async () => {
                  setSelectedType(rt.key)
                  setSaveResult(null)
                  setBExpandedId(null); setBForm(null); setBEditMeal(null)
                  if (isA) {
                    const list = await loadChecklist(rt.key, [...selectedIds])
                    initAForms(list, rt.key)
                    setMode('A-form')
                  } else {
                    await loadChecklist(rt.key)
                    setMode('B-overview')
                  }
                }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border ${rt.bg} hover:opacity-80 active:opacity-70 transition-opacity`}>
                <span className="text-2xl">{rt.icon}</span>
                <span className={`font-bold text-base ${rt.color}`}>{rt.label}</span>
                <svg className="ml-auto text-slate-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 p-3">
          <button onClick={() => setMode(isA ? 'A-residents' : 'select')}
            className="w-full bg-slate-100 text-slate-600 rounded-xl py-4 font-bold hover:bg-slate-200 transition-colors">
            戻る
          </button>
        </div>
      </div>
    )
  }

  // ────────────────────────────
  // MODE: A-form（全員一括フォーム）
  // ────────────────────────────
  if (mode === 'A-form') {
    const typeInfo = RECORD_TYPES.find(t => t.key === selectedType)!
    const doneCount = checklistResidents.filter(r => r.hasRecord).length

    return (
      <div className="pb-36">
        {/* ヘッダー情報 */}
        <div className={`px-4 py-3 flex items-center gap-3 ${typeInfo.bg} border-b`}>
          <span className="text-xl">{typeInfo.icon}</span>
          <div className="flex-1">
            <p className={`font-bold text-sm ${typeInfo.color}`}>{typeInfo.label}　一括入力</p>
            <p className="text-xs text-slate-500">{checklistResidents.length}名　本日入力有 {doneCount}名</p>
          </div>
        </div>

        {/* 共通日時入力 */}
        <div className="bg-white mx-3 mt-2 rounded-xl shadow-sm px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 flex-shrink-0">記録日時</span>
            <input
              type="datetime-local"
              value={bulkDatetime}
              onChange={e => setBulkDatetime(e.target.value)}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 text-slate-700"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">※ 全員の記録日時に反映されます</p>
        </div>

        {/* 食事デフォルト設定 */}
        {selectedType === 'meal' && (
          <div className="bg-orange-50 mx-3 rounded-xl shadow-sm px-4 py-3 space-y-3 border border-orange-200">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">デフォルト設定（全員に一括適用）</p>
            <div>
              <p className="text-xs text-slate-500 mb-1">食事時間帯</p>
              <div className="flex gap-2">
                {(['朝', '昼', '夕'] as const).map(mt => (
                  <button key={mt}
                    onClick={() => setMealDefaultTimes(prev => prev.includes(mt) ? prev.filter(t => t !== mt) : [...prev, mt])}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${mealDefaultTimes.includes(mt) ? 'bg-orange-400 text-white border-orange-400' : 'bg-white text-slate-500 border-slate-200'}`}>
                    {mt}食
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">主食デフォルト <span className={`font-bold ${mealDefaultMain ? 'text-orange-500' : 'text-slate-300'}`}>{mealDefaultMain ? `${mealDefaultMain}/10` : '□/10'}</span></p>
              <div className="flex flex-wrap gap-1">
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setMealDefaultMain(String(n))}
                    className={`w-7 h-7 rounded text-xs font-bold border transition-colors ${mealDefaultMain === String(n) ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-600 border-slate-200'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">副食デフォルト <span className={`font-bold ${mealDefaultSide ? 'text-orange-500' : 'text-slate-300'}`}>{mealDefaultSide ? `${mealDefaultSide}/10` : '□/10'}</span></p>
              <div className="flex flex-wrap gap-1">
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setMealDefaultSide(String(n))}
                    className={`w-7 h-7 rounded text-xs font-bold border transition-colors ${mealDefaultSide === String(n) ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-600 border-slate-200'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={applyMealDefaults}
              disabled={mealDefaultTimes.length === 0}
              className="w-full bg-orange-400 text-white rounded-lg py-2.5 font-bold text-sm hover:bg-orange-500 transition-colors disabled:opacity-40">
              全員に適用
            </button>
          </div>
        )}


        {loading ? (
          <div className="text-center py-12 text-slate-400">読み込み中...</div>
        ) : (
          <div className="space-y-2 mt-2 px-3">
            {checklistResidents.map(r => {
              const form = aForms.get(r.id)
              if (!form) return null
              return (
                <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* 利用者ヘッダー */}
                  <div className={`flex items-center gap-2 px-3 py-2 ${r.hasRecord ? 'bg-green-50' : 'bg-slate-50'} border-b border-slate-100`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${avatarBg(r.gender)}`}>
                      {avatarEmoji(r.gender)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-700 text-sm">{r.name}</span>
                      <span className="text-xs text-slate-400 ml-2">{r.roomNumber}号</span>
                    </div>
                    {r.hasRecord && <span className="text-xs text-green-600 font-bold">本日入力有</span>}
                  </div>

                  {/* 食事フォーム */}
                  {selectedType === 'meal' && (() => {
                    const mf = form as MealForm
                    return (
                      <div className="px-3 py-2 space-y-1.5">
                        {MEAL_TYPES.map(mt => (
                          <div key={mt} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 w-6 flex-shrink-0">{mt}食</span>
                            <button
                              onClick={() => setActiveMealPicker({ residentId: r.id, field: `${mt}_main`, label: `${mt}食 主食` })}
                              className="flex-1 border border-slate-200 rounded-lg py-1.5 text-center text-sm font-bold bg-slate-50 hover:border-teal-400 transition-colors min-w-0">
                              {mf[mt].main ? <span className="text-slate-700">{mf[mt].main}/10</span> : <span className="text-slate-300 text-xs">□/10</span>}
                            </button>
                            <button
                              onClick={() => setActiveMealPicker({ residentId: r.id, field: `${mt}_side`, label: `${mt}食 副食` })}
                              className="flex-1 border border-slate-200 rounded-lg py-1.5 text-center text-sm font-bold bg-slate-50 hover:border-teal-400 transition-colors min-w-0">
                              {mf[mt].side ? <span className="text-slate-700">{mf[mt].side}/10</span> : <span className="text-slate-300 text-xs">□/10</span>}
                            </button>
                          </div>
                        ))}
                        <textarea
                          value={mf.comment}
                          onChange={e => updateAForm(r.id, { comment: e.target.value })}
                          placeholder="コメント（任意）"
                          rows={1}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs resize-none outline-none focus:border-teal-400 text-slate-600"
                        />
                      </div>
                    )
                  })()}

                  {/* バイタルフォーム */}
                  {selectedType === 'vital' && (() => {
                    const vf = form as VitalForm
                    return (
                      <div className="px-3 py-2 space-y-1.5">
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { field: 'systolic', label: '高圧', unit: 'mmHg', max: 300 },
                            { field: 'diastolic', label: '低圧', unit: 'mmHg', max: 200 },
                            { field: 'pulse', label: '脈拍', unit: '回/分', max: 250 },
                          ].map(f => (
                            <div key={f.field}>
                              <p className="text-xs text-slate-400 text-center mb-0.5">{f.label}</p>
                              <button
                                onClick={() => setActiveKeypad({ residentId: r.id, field: f.field, label: `${r.name} ${f.label}`, maxVal: f.max })}
                                className="w-full border border-slate-200 rounded-lg py-1.5 text-center text-sm font-bold bg-slate-50 hover:border-teal-400 transition-colors">
                                {(vf as Record<string, string>)[f.field] || <span className="text-slate-300 text-xs">—</span>}
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { field: 'temperature', label: '体温', unit: '℃', decimal: true, max: 42 },
                            { field: 'spo2', label: 'SpO2', unit: '%', max: 100 },
                          ].map(f => (
                            <div key={f.field}>
                              <p className="text-xs text-slate-400 text-center mb-0.5">{f.label}</p>
                              <button
                                onClick={() => setActiveKeypad({ residentId: r.id, field: f.field, label: `${r.name} ${f.label}`, decimal: f.decimal, maxVal: f.max })}
                                className="w-full border border-slate-200 rounded-lg py-1.5 text-center text-sm font-bold bg-slate-50 hover:border-teal-400 transition-colors">
                                {(vf as Record<string, string>)[f.field] || <span className="text-slate-300 text-xs">—</span>}
                              </button>
                            </div>
                          ))}
                        </div>
                        <textarea
                          value={vf.comment}
                          onChange={e => updateAForm(r.id, { comment: e.target.value })}
                          placeholder="コメント（任意）"
                          rows={1}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs resize-none outline-none focus:border-teal-400 text-slate-600"
                        />
                      </div>
                    )
                  })()}

                  {/* 服薬フォーム */}
                  {selectedType === 'medication' && (() => {
                    const mf = form as MedForm
                    return (
                      <div className="px-3 py-2">
                        <div className="flex flex-wrap gap-1.5">
                          {MED_LABELS.map(m => (
                            <button key={m.key}
                              onClick={() => updateAForm(r.id, { [m.key]: !mf[m.key] })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${mf[m.key] ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                              {m.label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={mf.comment}
                          onChange={e => updateAForm(r.id, { comment: e.target.value })}
                          placeholder="コメント（任意）"
                          rows={1}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs resize-none outline-none focus:border-teal-400 text-slate-600 mt-1.5"
                        />
                      </div>
                    )
                  })()}

                  {/* コメントフォーム */}
                  {selectedType === 'comment' && (() => {
                    const cf = form as CommentForm
                    return (
                      <div className="px-3 py-2 space-y-1.5">
                        <div className="flex gap-1.5">
                          {['ケア', '生活記録'].map(cat => (
                            <button key={cat}
                              onClick={() => updateAForm(r.id, { category: cat })}
                              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${cf.category === cat ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                              {cat}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={cf.content}
                          onChange={e => updateAForm(r.id, { content: e.target.value })}
                          placeholder="コメントを入力..."
                          rows={2}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs resize-none outline-none focus:border-teal-400 text-slate-600"
                        />
                      </div>
                    )
                  })()}

                  {/* 夜間巡視フォーム */}
                  {selectedType === 'night-patrol' && (() => {
                    const nf = form as NightForm
                    return (
                      <div className="px-3 py-2 space-y-1.5">
                        <div className="flex items-center gap-2">
                          {['睡眠中', '覚醒'].map(s => (
                            <button key={s}
                              onClick={() => updateAForm(r.id, { status: s })}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${nf.status === s ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={nf.comment}
                          onChange={e => updateAForm(r.id, { comment: e.target.value })}
                          placeholder="コメント（任意）"
                          rows={1}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs resize-none outline-none focus:border-teal-400 text-slate-600"
                        />
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        )}

        {/* 固定ボタン */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 p-3 space-y-2">
          {saveResult && (
            <div className={`text-center text-sm font-bold py-1.5 rounded-lg ${saveResult.ok > 0 ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'}`}>
              {saveResult.ok > 0 ? `✓ ${saveResult.ok}名を保存しました` : '保存するデータがありませんでした'}
              {saveResult.skip > 0 && saveResult.ok > 0 && <span className="text-slate-400 font-normal">　（{saveResult.skip}名スキップ）</span>}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setMode('A-type')}
              className="bg-slate-100 text-slate-600 rounded-xl py-3.5 px-5 font-bold hover:bg-slate-200 transition-colors">
              戻る
            </button>
            <button onClick={saveAForms} disabled={saving}
              className="flex-1 bg-teal-500 text-white rounded-xl py-3.5 font-bold disabled:opacity-40 hover:bg-teal-600 transition-colors">
              {saving ? '保存中...' : `全員まとめて保存`}
            </button>
          </div>
        </div>

        {activeKeypad && !activeKeypad.isB && (
          <NumKeypad
            value={(() => {
              const form = aForms.get(activeKeypad.residentId)
              if (!form) return ''
              if (selectedType === 'meal' && activeKeypad.field.includes('_')) {
                const [mt, sub] = activeKeypad.field.split('_')
                return (form as MealForm)[mt as '朝' | '昼' | '夕'][sub as 'main' | 'side']
              }
              return (form as Record<string, string>)[activeKeypad.field] ?? ''
            })()}
            label={activeKeypad.label}
            decimal={activeKeypad.decimal}
            maxVal={activeKeypad.maxVal}
            onConfirm={handleKeypadConfirm}
            onClose={() => setActiveKeypad(null)}
          />
        )}

        {activeMealPicker && !activeMealPicker.isB && (() => {
          const form = aForms.get(activeMealPicker.residentId)
          const [mt, sub] = activeMealPicker.field.split('_')
          const currentVal = form ? (form as MealForm)[mt as '朝'|'昼'|'夕'][sub as 'main'|'side'] : ''
          return (
            <>
              <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setActiveMealPicker(null)} />
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-t-2xl z-50 px-5 pt-5 pb-8 shadow-2xl">
                <p className="text-sm font-bold text-slate-600 mb-4 text-center">{activeMealPicker.label}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n}
                      onClick={() => {
                        updateAMealEntry(activeMealPicker.residentId, mt as '朝'|'昼'|'夕', sub as 'main'|'side', String(n))
                        setActiveMealPicker(null)
                      }}
                      className={`w-14 h-14 rounded-xl text-xl font-bold border-2 transition-colors ${
                        currentVal === String(n)
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      updateAMealEntry(activeMealPicker.residentId, mt as '朝'|'昼'|'夕', sub as 'main'|'side', '')
                      setActiveMealPicker(null)
                    }}
                    className="flex-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl py-3 font-bold text-sm hover:bg-amber-100 transition-colors">
                    未記入
                  </button>
                  <button onClick={() => setActiveMealPicker(null)}
                    className="flex-1 bg-slate-100 text-slate-500 rounded-xl py-3 font-bold text-sm hover:bg-slate-200 transition-colors">
                    キャンセル
                  </button>
                </div>
              </div>
            </>
          )
        })()}
      </div>
    )
  }

  // ────────────────────────────
  // MODE: B-overview（全員状況一覧）
  // ────────────────────────────
  if (mode === 'B-overview') {
    const typeInfo = RECORD_TYPES.find(t => t.key === selectedType)!
    const doneCount = checklistResidents.filter(r => r.hasRecord).length
    const undoneCount = checklistResidents.length - doneCount

    // フロアフィルター
    const bFloors = [...new Set(checklistResidents.map(r => r.floor).filter(Boolean))].sort()
    const displayList = floorFilter ? checklistResidents.filter(r => r.floor === floorFilter) : checklistResidents

    const openBInline = (residentId: number, mealType?: '朝' | '昼' | '夕') => {
      if (bExpandedId === residentId && (!mealType || bEditMeal === mealType)) {
        setBExpandedId(null); setBForm(null); setBEditMeal(null)
        return
      }
      setBExpandedId(residentId)
      if (selectedType === 'meal') {
        setBEditMeal(mealType ?? '朝')
        setBForm({ main: '', side: '' })
      } else if (selectedType === 'vital') {
        setBEditMeal(null)
        setBForm({ systolic: '', diastolic: '', pulse: '', temperature: '', spo2: '', comment: '' })
      } else if (selectedType === 'medication') {
        setBEditMeal(null)
        setBForm(initMedForm())
      } else if (selectedType === 'comment') {
        setBEditMeal(null)
        setBForm({ category: 'ケア', content: '' })
      }
    }

    return (
      <div className="pb-28">
        {/* ヘッダー */}
        <div className={`px-4 py-3 flex items-center gap-3 ${typeInfo.bg} border-b`}>
          <span className="text-xl">{typeInfo.icon}</span>
          <div className="flex-1">
            <p className={`font-bold text-sm ${typeInfo.color}`}>{typeInfo.label}</p>
            <p className="text-xs text-slate-500">
              {doneCount}/{checklistResidents.length}名 本日入力有
              {undoneCount > 0 && <span className="text-red-500 font-bold ml-1">残り{undoneCount}名</span>}
              {undoneCount === 0 && checklistResidents.length > 0 && <span className="text-green-600 font-bold ml-1">全員完了 ✓</span>}
            </p>
          </div>
          <button onClick={() => loadChecklist(selectedType!)}
            className="text-xs text-slate-500 bg-white rounded-lg px-3 py-1.5 border border-slate-200 hover:bg-slate-50 transition-colors">
            更新
          </button>
        </div>

        {/* 共通日時入力 */}
        <div className="bg-white mx-3 mt-2 rounded-xl shadow-sm px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 flex-shrink-0">記録日時</span>
            <input
              type="datetime-local"
              value={bulkDatetime}
              onChange={e => setBulkDatetime(e.target.value)}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400 text-slate-700"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">※ 全員の記録日時に反映されます</p>
        </div>

        {/* フロアフィルター */}
        {bFloors.length > 0 && (
          <div className="bg-white border-b border-slate-200 px-4 py-2 sticky top-14 z-20">
            <div className="flex gap-2 overflow-x-auto">
              <button onClick={() => setFloorFilter('')}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${!floorFilter ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                全て
              </button>
              {bFloors.map(f => (
                <button key={f} onClick={() => setFloorFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${floorFilter === f ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-400">読み込み中...</div>
        ) : (
          <div className="bg-white mt-1 shadow-sm overflow-hidden">
            {displayList.map((r, i) => {
              const isExpanded = bExpandedId === r.id
              const isLast = i === displayList.length - 1

              return (
                <div key={r.id} className={`${!isLast ? 'border-b border-slate-100' : ''}`}>
                  {/* 利用者行 */}
                  <div className={`px-3 py-2.5 ${isExpanded ? 'bg-teal-50' : ''}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${avatarBg(r.gender)}`}>
                        {avatarEmoji(r.gender)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-700 text-sm">{r.name}</span>
                        <span className="text-xs text-slate-400 ml-1">{r.roomNumber}号</span>
                      </div>
                      {/* 全体ステータスバッジ（食事以外） */}
                      {selectedType !== 'meal' && (
                        <button
                          onClick={() => openBInline(r.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            r.hasRecord
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {r.hasRecord ? '本日入力有' : '未入力 ＋'}
                        </button>
                      )}
                    </div>

                    {/* 食事の朝/昼/夕バッジ */}
                    {selectedType === 'meal' && (() => {
                      const detail = r.detail as Record<string, { mainDish: number | null; sideDish: number | null }> | null ?? {}
                      return (
                        <div className="flex gap-1.5 ml-9">
                          {MEAL_TYPES.map(mt => {
                            const d = detail[mt]
                            const isDone = !!d
                            const isEditing = isExpanded && bEditMeal === mt
                            return (
                              <button key={mt}
                                onClick={() => openBInline(r.id, mt)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors text-center ${
                                  isEditing
                                    ? 'bg-teal-500 text-white border-teal-500'
                                    : isDone
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-orange-50 hover:border-orange-300'
                                }`}
                              >
                                <span className="block">{mt}食</span>
                                {isDone
                                  ? <span className="block text-green-600 leading-tight text-xs">{d.mainDish ?? '□'}/{d.sideDish ?? '□'}</span>
                                  : <span className="block text-slate-300 leading-tight">未</span>
                                }
                              </button>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* バイタル詳細表示（入力済みのみ） */}
                    {selectedType === 'vital' && r.hasRecord && (() => {
                      const d = r.detail as { systolic: number | null; diastolic: number | null; pulse: number | null; temperature: number | null; spo2: number | null } | null
                      if (!d) return null
                      return (
                        <div className="ml-9 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                          {d.systolic != null && <span>高圧 <b className="text-slate-700">{d.systolic}</b></span>}
                          {d.diastolic != null && <span>低圧 <b className="text-slate-700">{d.diastolic}</b></span>}
                          {d.pulse != null && <span>脈 <b className="text-slate-700">{d.pulse}</b></span>}
                          {d.temperature != null && <span>体温 <b className="text-slate-700">{d.temperature}</b></span>}
                          {d.spo2 != null && <span>SpO2 <b className="text-slate-700">{d.spo2}</b></span>}
                        </div>
                      )
                    })()}

                    {/* 服薬詳細表示（入力済みのみ） */}
                    {selectedType === 'medication' && r.hasRecord && (() => {
                      const d = r.detail as Record<string, boolean | null> | null
                      if (!d) return null
                      const checkedKeys = MED_LABELS.filter(m => d[m.key] === true).map(m => m.label)
                      return (
                        <div className="ml-9 flex flex-wrap gap-1 mt-0.5">
                          {checkedKeys.map(lbl => (
                            <span key={lbl} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{lbl}</span>
                          ))}
                        </div>
                      )
                    })()}
                  </div>

                  {/* インライン入力フォーム */}
                  {isExpanded && bForm && (
                    <div className="bg-teal-50 border-t border-teal-100 px-4 py-3">
                      {selectedType === 'meal' && bEditMeal && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-teal-700">{bEditMeal}食入力</p>
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <p className="text-xs text-slate-400 mb-1">主食</p>
                              <button
                                onClick={() => setActiveMealPicker({ residentId: r.id, field: 'main', label: `${bEditMeal}食 主食`, isB: true })}
                                className="w-full border border-slate-200 rounded-lg py-2 text-center text-sm font-bold bg-white hover:border-teal-400 transition-colors">
                                {bForm.main ? <span className="text-slate-700">{bForm.main}/10</span> : <span className="text-slate-300">□/10</span>}
                              </button>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-slate-400 mb-1">副食</p>
                              <button
                                onClick={() => setActiveMealPicker({ residentId: r.id, field: 'side', label: `${bEditMeal}食 副食`, isB: true })}
                                className="w-full border border-slate-200 rounded-lg py-2 text-center text-sm font-bold bg-white hover:border-teal-400 transition-colors">
                                {bForm.side ? <span className="text-slate-700">{bForm.side}/10</span> : <span className="text-slate-300">□/10</span>}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedType === 'vital' && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-teal-700">バイタル入力</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { field: 'systolic', label: '収縮', max: 300 },
                              { field: 'diastolic', label: '拡張', max: 200 },
                              { field: 'pulse', label: '脈拍', max: 250 },
                            ].map(f => (
                              <div key={f.field}>
                                <p className="text-xs text-slate-400 text-center mb-1">{f.label}</p>
                                <button
                                  onClick={() => setActiveKeypad({ residentId: r.id, field: f.field, label: `${f.label}`, maxVal: f.max, isB: true })}
                                  className="w-full border border-slate-200 rounded-lg py-2 text-sm font-bold bg-white hover:border-teal-400 transition-colors text-center">
                                  {bForm[f.field] || <span className="text-slate-300 text-xs font-normal">—</span>}
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { field: 'temperature', label: '体温', decimal: true, max: 42 },
                              { field: 'spo2', label: 'SpO2', max: 100 },
                            ].map(f => (
                              <div key={f.field}>
                                <p className="text-xs text-slate-400 text-center mb-1">{f.label}</p>
                                <button
                                  onClick={() => setActiveKeypad({ residentId: r.id, field: f.field, label: f.label, decimal: f.decimal, maxVal: f.max, isB: true })}
                                  className="w-full border border-slate-200 rounded-lg py-2 text-sm font-bold bg-white hover:border-teal-400 transition-colors text-center">
                                  {bForm[f.field] || <span className="text-slate-300 text-xs font-normal">—</span>}
                                </button>
                              </div>
                            ))}
                          </div>
                          <textarea
                            value={bForm.comment}
                            onChange={e => setBForm((p: Record<string, string>) => ({ ...p, comment: e.target.value }))}
                            placeholder="コメント（任意）"
                            rows={1}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs resize-none outline-none focus:border-teal-400 bg-white"
                          />
                        </div>
                      )}

                      {selectedType === 'medication' && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-teal-700">服薬入力</p>
                          <div className="flex flex-wrap gap-2">
                            {MED_LABELS.map(m => (
                              <button key={m.key}
                                onClick={() => setBForm((p: MedForm) => ({ ...p, [m.key]: !p[m.key] }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${bForm[m.key] ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedType === 'comment' && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-teal-700">コメント入力</p>
                          <div className="flex gap-2">
                            {['ケア', '生活記録'].map(cat => (
                              <button key={cat}
                                onClick={() => setBForm((p: CommentForm) => ({ ...p, category: cat }))}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${bForm.category === cat ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                                {cat}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={bForm.content}
                            onChange={e => setBForm((p: CommentForm) => ({ ...p, content: e.target.value }))}
                            placeholder="コメントを入力..."
                            rows={2}
                            className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs resize-none outline-none focus:border-teal-400 bg-white"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        <button onClick={() => { setBExpandedId(null); setBForm(null); setBEditMeal(null) }}
                          className="bg-white text-slate-500 border border-slate-200 rounded-lg py-2 px-4 text-xs font-bold hover:bg-slate-50 transition-colors">
                          キャンセル
                        </button>
                        <button onClick={() => saveBForm(r.id)} disabled={bSavingId === r.id}
                          className="flex-1 bg-teal-500 text-white rounded-lg py-2 text-xs font-bold disabled:opacity-40 hover:bg-teal-600 transition-colors">
                          {bSavingId === r.id ? '保存中...' : '保存'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 固定ボタン */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 p-3 flex gap-2">
          <button onClick={() => { setMode('B-type'); setFloorFilter(''); setBExpandedId(null); setBForm(null) }}
            className="bg-slate-100 text-slate-600 rounded-xl py-4 px-6 font-bold hover:bg-slate-200 transition-colors">
            戻る
          </button>
          <button onClick={() => { setMode('select'); setFloorFilter(''); setBExpandedId(null); setBForm(null) }}
            className="flex-1 bg-slate-500 text-white rounded-xl py-4 font-bold hover:bg-slate-600 transition-colors">
            最初から
          </button>
        </div>

        {/* NumKeypad (B-form) */}
        {activeKeypad?.isB && (
          <NumKeypad
            value={bForm?.[activeKeypad.field] ?? ''}
            label={activeKeypad.label}
            decimal={activeKeypad.decimal}
            maxVal={activeKeypad.maxVal}
            onConfirm={handleKeypadConfirm}
            onClose={() => setActiveKeypad(null)}
          />
        )}

        {activeMealPicker?.isB && (() => {
          const currentVal = bForm?.[activeMealPicker.field] ?? ''
          return (
            <>
              <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setActiveMealPicker(null)} />
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-t-2xl z-50 px-5 pt-5 pb-8 shadow-2xl">
                <p className="text-sm font-bold text-slate-600 mb-4 text-center">{activeMealPicker.label}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n}
                      onClick={() => {
                        setBForm((p: Record<string, string>) => ({ ...p, [activeMealPicker.field]: String(n) }))
                        setActiveMealPicker(null)
                      }}
                      className={`w-14 h-14 rounded-xl text-xl font-bold border-2 transition-colors ${
                        currentVal === String(n)
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setBForm((p: Record<string, string>) => ({ ...p, [activeMealPicker.field]: '' }))
                      setActiveMealPicker(null)
                    }}
                    className="flex-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl py-3 font-bold text-sm hover:bg-amber-100 transition-colors">
                    未記入
                  </button>
                  <button onClick={() => setActiveMealPicker(null)}
                    className="flex-1 bg-slate-100 text-slate-500 rounded-xl py-3 font-bold text-sm hover:bg-slate-200 transition-colors">
                    キャンセル
                  </button>
                </div>
              </div>
            </>
          )
        })()}
      </div>
    )
  }

  return null
}
