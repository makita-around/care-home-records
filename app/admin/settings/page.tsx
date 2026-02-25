'use client'
import { useEffect, useState } from 'react'
import Header from '@/app/components/Header'

export default function AdminSettingsPage() {
  const [facilityName, setFacilityName] = useState('')
  const [backupPath, setBackupPath] = useState('')
  const [lastBackupAt, setLastBackupAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [backingUp, setBackingUp] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.facilityName) setFacilityName(d.facilityName)
      if (d.backupPath) setBackupPath(d.backupPath)
      if (d.lastBackupAt) setLastBackupAt(d.lastBackupAt)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityName, backupPath }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleBackup = async () => {
    setBackingUp(true)
    setBackupMsg(null)
    const res = await fetch('/api/backup', { method: 'POST' })
    const data = await res.json()
    setBackingUp(false)
    setBackupMsg({ ok: data.ok, text: data.message })
    if (data.ok) {
      setLastBackupAt(new Date().toISOString())
    }
    setTimeout(() => setBackupMsg(null), 4000)
  }

  const formatDate = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-6">
      <Header title="基本設定" backUrl="/admin" />

      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4">
        <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">施設情報</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-600 font-medium ml-1">施設名</label>
            <input
              value={facilityName}
              onChange={e => setFacilityName(e.target.value)}
              placeholder="施設名を入力"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:border-teal-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4">
        <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">バックアップ</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-600 font-medium ml-1">バックアップ先フォルダ</label>
            <input
              value={backupPath}
              onChange={e => setBackupPath(e.target.value)}
              placeholder="例: G:\マイドライブ\施設バックアップ"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mt-1 outline-none focus:border-teal-400"
            />
            <p className="text-xs text-slate-400 mt-1 ml-1">Googleドライブ等のフォルダパスを入力してください</p>
          </div>
          {lastBackupAt && (
            <p className="text-xs text-slate-500 ml-1">最終バックアップ: {formatDate(lastBackupAt)}</p>
          )}
          <button
            onClick={handleBackup}
            disabled={backingUp || !backupPath.trim()}
            className="w-full rounded-xl py-3 font-bold text-sm bg-slate-600 text-white hover:bg-slate-700 active:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            {backingUp ? 'バックアップ中...' : '今すぐバックアップ'}
          </button>
          {backupMsg && (
            <p className={`text-sm text-center font-medium ${backupMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {backupMsg.ok ? '✓ ' : '✗ '}{backupMsg.text}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full rounded-xl py-3.5 font-bold transition-colors ${
            saved ? 'bg-green-500 text-white' : 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700'
          } disabled:opacity-40`}
        >
          {saved ? '✓ 保存しました' : '保存する'}
        </button>
      </div>
    </div>
  )
}
