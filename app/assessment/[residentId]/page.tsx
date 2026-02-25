'use client'
import { useEffect, useState, use } from 'react'
import Header from '@/app/components/Header'

interface Resident { id: number; name: string; roomNumber: string }
interface Sheet { address: string; emergencyContact: string; relationship: string; emergencyPhone: string; insuranceNumber: string; insurer: string; primaryDoctor: string; hospital: string; consciousness: string; vision: string; hearing: string; height: number|null; weight: number|null; bedsore: boolean; tubeFeed: boolean; catheter: boolean; insulin: boolean; dialysis: boolean; familyStructure: string; livingArrangement: string; hometown: string; education: string; workHistory: string; familyRequests: string; specialNotes: string }
const EMPTY: Sheet = { address:'', emergencyContact:'', relationship:'', emergencyPhone:'', insuranceNumber:'', insurer:'', primaryDoctor:'', hospital:'', consciousness:'', vision:'', hearing:'', height:null, weight:null, bedsore:false, tubeFeed:false, catheter:false, insulin:false, dialysis:false, familyStructure:'', livingArrangement:'', hometown:'', education:'', workHistory:'', familyRequests:'', specialNotes:'' }

export default function AssessmentPage({ params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = use(params)
  const [resident, setResident] = useState<Resident|null>(null)
  const [sheet, setSheet] = useState<Sheet>(EMPTY)
  const [tab, setTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/residents/${residentId}`).then(r => r.json()).then(setResident)
    fetch(`/api/assessment/${residentId}`).then(r => r.json()).then(d => { if (d) setSheet({ ...EMPTY, ...d }) })
  }, [residentId])

  const update = (k: keyof Sheet, v: unknown) => setSheet(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    await fetch(`/api/assessment/${residentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sheet) })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <Header title="アセスメントシート" backUrl={`/residents/${residentId}`} />

      {resident && (
        <div className="bg-purple-500 px-4 py-2.5">
          <p className="text-white text-sm font-medium">{resident.roomNumber}号　{resident.name}</p>
        </div>
      )}

      {/* タブ */}
      <div className="flex bg-white sticky top-14 z-20 border-b border-slate-200">
        {['基本情報','生活歴','ADL評価'].map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`flex-1 py-3.5 text-sm font-bold transition-colors ${
              tab === i ? 'text-purple-600 border-b-2 border-purple-500 bg-white' : 'text-slate-400 bg-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4 space-y-3">
        {tab === 0 && (
          <>
            {[{l:'住所',k:'address'},{l:'緊急連絡先',k:'emergencyContact'},{l:'続柄',k:'relationship'},{l:'緊急電話',k:'emergencyPhone'},{l:'保険証番号',k:'insuranceNumber'},{l:'保険者',k:'insurer'},{l:'主治医',k:'primaryDoctor'},{l:'病院',k:'hospital'},{l:'意識・認知',k:'consciousness'},{l:'視覚',k:'vision'},{l:'聴覚',k:'hearing'}].map(f => (
              <div key={f.k}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{f.l}</label>
                <input
                  value={(sheet[f.k as keyof Sheet] as string)||''}
                  onChange={e => update(f.k as keyof Sheet, e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:border-purple-400"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">身長(cm)</label>
                <input type="number" value={sheet.height||''} onChange={e => update('height', e.target.value ? Number(e.target.value) : null)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">体重(kg)</label>
                <input type="number" value={sheet.weight||''} onChange={e => update('weight', e.target.value ? Number(e.target.value) : null)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:border-purple-400" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">医療処置</label>
              <div className="grid grid-cols-2 gap-2">
                {[{k:'bedsore',l:'褥瘡'},{k:'tubeFeed',l:'経管栄養'},{k:'catheter',l:'膀胱カテーテル'},{k:'insulin',l:'インスリン'},{k:'dialysis',l:'人工透析'}].map(f => (
                  <label key={f.k} className="flex items-center gap-3 py-2 cursor-pointer"
                    onClick={() => update(f.k as keyof Sheet, !(sheet[f.k as keyof Sheet] as boolean))}>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${sheet[f.k as keyof Sheet] ? 'bg-purple-500 border-purple-500' : 'border-slate-300 bg-white'}`}>
                      {sheet[f.k as keyof Sheet] && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </div>
                    <span className="text-sm text-slate-700">{f.l}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 1 && (
          <>
            {[{l:'家族構成',k:'familyStructure',m:true},{l:'現在の間取り',k:'livingArrangement',m:false},{l:'出身地',k:'hometown',m:false},{l:'学歴',k:'education',m:false},{l:'職歴',k:'workHistory',m:true},{l:'家族の意見・要望',k:'familyRequests',m:true},{l:'特記事項',k:'specialNotes',m:true}].map(f => (
              <div key={f.k}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{f.l}</label>
                {f.m ? (
                  <textarea value={(sheet[f.k as keyof Sheet] as string)||''} onChange={e => update(f.k as keyof Sheet, e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1 resize-none h-20 outline-none focus:border-purple-400" />
                ) : (
                  <input value={(sheet[f.k as keyof Sheet] as string)||''} onChange={e => update(f.k as keyof Sheet, e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:border-purple-400" />
                )}
              </div>
            ))}
          </>
        )}

        {tab === 2 && (
          <p className="text-sm text-slate-400 text-center py-8">ADL評価は今後実装予定</p>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border-t border-slate-200 p-3">
        <button onClick={handleSave} disabled={saving}
          className={`w-full rounded-xl py-4 font-bold text-base transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700'} disabled:opacity-40`}>
          {saved ? '✓ 保存しました' : '保存する'}
        </button>
      </div>
    </div>
  )
}
