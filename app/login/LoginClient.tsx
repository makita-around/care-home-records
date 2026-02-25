'use client'

import { useState } from 'react'

type StaffItem = { id: number; name: string; nameKana: string; isAdmin: boolean }

type UnreadData = {
  notices: { id: number; content: string; staffName: string; createdAt: string }[]
  accidentReports: { id: number; residentName: string; accidentAt: string }[]
}

export default function LoginClient({ staffList }: { staffList: StaffItem[] }) {
  const regularStaff = staffList.filter(s => !s.isAdmin)
  const adminStaff = staffList.filter(s => s.isAdmin)

  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState<UnreadData | null>(null)

  const handleStaffSelect = (staff: StaffItem) => {
    setSelectedStaff(staff)
    setPin('')
    setError('')
    if (staff.isAdmin) {
      doLogin(staff.id, '', true)
    }
  }

  const doLogin = async (staffId: number, pinValue: string, isAdmin: boolean) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, pin: pinValue }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'ログインに失敗しました')
        setLoading(false)
        if (isAdmin) setSelectedStaff(null)
        return
      }
      const totalUnread = data.unread.notices.length + data.unread.accidentReports.length
      if (totalUnread > 0) {
        setUnread(data.unread)
      } else {
        window.location.replace('/')
      }
    } catch {
      setError('通信エラーが発生しました')
      setLoading(false)
    }
  }

  const handlePinInput = (digit: string) => {
    if (pin.length >= 4) return
    const next = pin + digit
    setPin(next)
    if (next.length === 4 && selectedStaff) {
      doLogin(selectedStaff.id, next, false)
    }
  }

  const handlePinDelete = () => {
    setPin((p) => p.slice(0, -1))
    setError('')
  }

  if (unread) {
    return <UnreadPopup unread={unread} onClose={() => { window.location.replace('/') }} />
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
            <span className="text-white text-2xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-700">生活記録</h1>
          <p className="text-slate-400 text-sm mt-1">ログイン</p>
        </div>

        {!selectedStaff ? (
          /* 職員選択 */
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm text-slate-500 font-medium">職員を選択してください</p>
              </div>
              {regularStaff.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => handleStaffSelect(staff)}
                  className="w-full flex items-center gap-3 px-4 py-4 border-b border-slate-50 last:border-0 hover:bg-teal-50 active:bg-teal-100 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-600 font-bold text-sm">{staff.name.slice(0, 1)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700">{staff.name}</p>
                    <p className="text-xs text-slate-400">{staff.nameKana}</p>
                  </div>
                </button>
              ))}
            </div>

            {adminStaff.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                  <span className="text-slate-500">⚙️</span>
                  <p className="text-xs text-slate-500 font-bold">管理者画面</p>
                </div>
                {adminStaff.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => handleStaffSelect(staff)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-500 font-bold text-sm">{staff.name.slice(0, 1)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-700 text-sm">{staff.name}</p>
                    </div>
                    <span className="text-xs text-slate-400">タップでログイン</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* PIN入力 */
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* 選択中の職員 */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <button
                onClick={() => { setSelectedStaff(null); setPin(''); setError('') }}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-teal-500"
              >
                ←
              </button>
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-teal-600 font-bold">{selectedStaff.name.slice(0, 1)}</span>
              </div>
              <div>
                <p className="font-medium text-slate-700">{selectedStaff.name}</p>
                <p className="text-xs text-slate-400">4桁PINを入力してください</p>
              </div>
            </div>

            {/* PIN ドット表示 */}
            <div className="flex justify-center gap-4 py-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-colors ${
                    i < pin.length ? 'bg-teal-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-center text-red-500 text-sm pb-3 px-4">{error}</p>
            )}

            {/* キーパッド */}
            <div className="grid grid-cols-3 border-t border-slate-100">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
                <button
                  key={i}
                  disabled={loading || key === ''}
                  onClick={() => key === '⌫' ? handlePinDelete() : key && handlePinInput(key)}
                  className={`py-5 text-xl font-medium border-r border-b border-slate-100 last:border-r-0 transition-colors
                    ${key === '' ? 'bg-slate-50 cursor-default' : ''}
                    ${key === '⌫' ? 'text-slate-400 hover:bg-slate-50 active:bg-slate-100' : ''}
                    ${key !== '' && key !== '⌫' ? 'text-slate-700 hover:bg-teal-50 active:bg-teal-100' : ''}
                    ${loading ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  {loading && pin.length === 4 ? (
                    i === 4 ? <span className="text-teal-500 text-sm">...</span> : key
                  ) : key}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function UnreadPopup({ unread, onClose }: { unread: UnreadData; onClose: () => void }) {
  const total = unread.notices.length + unread.accidentReports.length

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-teal-500 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-white text-xl">🔔</span>
            <div>
              <p className="text-white font-bold">未読のお知らせ</p>
              <p className="text-teal-100 text-sm">{total}件の未読があります</p>
            </div>
          </div>
        </div>

        {/* 内容 */}
        <div className="max-h-80 overflow-y-auto">
          {unread.notices.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-slate-50 border-b">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  申し送り {unread.notices.length}件
                </p>
              </div>
              {unread.notices.map((n) => (
                <div key={n.id} className="px-4 py-3 border-b border-slate-100">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm text-slate-700 flex-1">{n.content}</p>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-teal-600 mt-0.5">{n.staffName}</p>
                </div>
              ))}
            </div>
          )}

          {unread.accidentReports.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-slate-50 border-b">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide">
                  事故報告書 署名待ち {unread.accidentReports.length}件
                </p>
              </div>
              {unread.accidentReports.map((r) => (
                <div key={r.id} className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-700">{r.residentName}</p>
                  <p className="text-xs text-slate-400">{formatDate(r.accidentAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4">
          <button
            onClick={onClose}
            className="w-full bg-teal-500 text-white py-3.5 rounded-xl font-bold text-base hover:bg-teal-600 active:bg-teal-700 transition-colors"
          >
            確認しました
          </button>
        </div>
      </div>
    </div>
  )
}
