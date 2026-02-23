'use client'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'

interface Resident { id: number; name: string; roomNumber: string }
interface Sheet { address: string; emergencyContact: string; relationship: string; emergencyPhone: string; insuranceNumber: string; insurer: string; primaryDoctor: string; hospital: string; consciousness: string; vision: string; hearing: string; height: number|null; weight: number|null; bedsore: boolean; tubeFeed: boolean; catheter: boolean; insulin: boolean; dialysis: boolean; familyStructure: string; livingArrangement: string; hometown: string; education: string; workHistory: string; familyRequests: string; specialNotes: string }
const EMPTY: Sheet = { address:'', emergencyContact:'', relationship:'', emergencyPhone:'', insuranceNumber:'', insurer:'', primaryDoctor:'', hospital:'', consciousness:'', vision:'', hearing:'', height:null, weight:null, bedsore:false, tubeFeed:false, catheter:false, insulin:false, dialysis:false, familyStructure:'', livingArrangement:'', hometown:'', education:'', workHistory:'', familyRequests:'', specialNotes:'' }

export default function AssessmentPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const [resident, setResident] = useState<Resident|null>(null)
  const [sheet, setSheet] = useState<Sheet>(EMPTY)
  const [tab, setTab] = useState(0); const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(setResident)
    fetch(`/api/assessment/${residentId}`).then(r => r.json()).then(d => { if (d) setSheet({ ...EMPTY, ...d }) })
  }, [residentId])

  const update = (k: keyof Sheet, v: unknown) => setSheet(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    await fetch(`/api/assessment/${residentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sheet) })
    setSaving(false); alert('保存しました')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-purple-600 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href={`/residents/${residentId}`} className="text-white text-2xl">←</Link>
        <div><h1 className="font-bold text-lg">アセスメントシート</h1>{resident && <p className="text-xs text-purple-200">{resident.roomNumber}　{resident.name}</p>}</div>
      </header>
      <div className="flex border-b border-gray-200 bg-white sticky top-14 z-10">
        {['基本情報','生活歴','ADL評価'].map((t,i) => <button key={i} onClick={() => setTab(i)} className={`flex-1 py-3 text-sm font-medium ${tab===i ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}>{t}</button>)}
      </div>
      <div className="p-4 space-y-3">
        {tab === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            {[{l:'住所',k:'address'},{l:'緊急連絡先',k:'emergencyContact'},{l:'続柄',k:'relationship'},{l:'緊急電話',k:'emergencyPhone'},{l:'保険証番号',k:'insuranceNumber'},{l:'保険者',k:'insurer'},{l:'主治医',k:'primaryDoctor'},{l:'病院',k:'hospital'},{l:'意識・認知',k:'consciousness'},{l:'視覚',k:'vision'},{l:'聴覚',k:'hearing'}].map(f => (
              <div key={f.k}><label className="text-xs text-gray-500">{f.l}</label><input value={(sheet[f.k as keyof Sheet] as string)||''} onChange={e => update(f.k as keyof Sheet, e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" /></div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500">身長(cm)</label><input type="number" value={sheet.height||''} onChange={e => update('height', e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" /></div>
              <div><label className="text-xs text-gray-500">体重(kg)</label><input type="number" value={sheet.weight||''} onChange={e => update('weight', e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" /></div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-2 block">医療処置</label>
              <div className="grid grid-cols-2 gap-2">
                {[{k:'bedsore',l:'褥瘡'},{k:'tubeFeed',l:'経管栄養'},{k:'catheter',l:'膀胱カテーテル'},{k:'insulin',l:'インスリン'},{k:'dialysis',l:'人工透析'}].map(f => (
                  <label key={f.k} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={sheet[f.k as keyof Sheet] as boolean} onChange={e => update(f.k as keyof Sheet, e.target.checked)} className="w-5 h-5 accent-purple-600" /><span className="text-sm">{f.l}</span></label>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            {[{l:'家族構成',k:'familyStructure',m:true},{l:'現在の間取り',k:'livingArrangement',m:false},{l:'出身地',k:'hometown',m:false},{l:'学歴',k:'education',m:false},{l:'職歴',k:'workHistory',m:true},{l:'家族の意見・要望',k:'familyRequests',m:true},{l:'特記事項',k:'specialNotes',m:true}].map(f => (
              <div key={f.k}><label className="text-xs text-gray-500">{f.l}</label>
                {f.m ? <textarea value={(sheet[f.k as keyof Sheet] as string)||''} onChange={e => update(f.k as keyof Sheet, e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5 resize-none h-20" /> : <input value={(sheet[f.k as keyof Sheet] as string)||''} onChange={e => update(f.k as keyof Sheet, e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />}
              </div>
            ))}
          </div>
        )}
        {tab === 2 && <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-sm text-gray-500 text-center py-4">ADL評価は今後実装予定</p></div>}
        <button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 text-white rounded-xl py-3 font-bold disabled:opacity-40">保存する</button>
      </div>
    </div>
  )
}
