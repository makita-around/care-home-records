'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from './SessionContext'

interface HeaderProps {
  title: string
  backUrl?: string
  facilityName?: string
}

export default function Header({ title, backUrl, facilityName }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const session = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const menuItems = [
    { icon: '🏠', label: 'トップ',         href: '/' },
    { icon: '📨', label: '申し送り',       href: '/notices' },
    { icon: '👥', label: '利用者一覧',     href: '/residents' },
    { icon: '📝', label: '一括入力',       href: '/bulk-input' },
    { icon: '🍽', label: '食事変更',       href: '/meal-change' },
    { icon: '📋', label: '事故報告書',     href: '/accident-report' },
    { icon: '🚨', label: '事故報告書一覧', href: '/accident-reports' },
    { icon: '🔍', label: '記録検索・出力',  href: '/records' },
    ...(session?.isAdmin ? [{ icon: '⚙️', label: '管理者画面', href: '/admin' }] : []),
  ]

  return (
    <>
      {/* ヘッダーバー */}
      <header className="bg-teal-500 text-white h-14 flex items-center justify-between px-4 sticky top-0 z-30 shadow-md">
        {/* 左：戻るボタン or スペース */}
        <div className="w-10">
          {backUrl ? (
            <Link href={backUrl} className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-teal-400 active:bg-teal-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
          ) : null}
        </div>

        {/* 中央：タイトル */}
        <h1 className="text-base font-bold tracking-wide">{title}</h1>

        {/* 右：ハンバーガー */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 -mr-2 rounded-full hover:bg-teal-400 active:bg-teal-600 transition-colors"
        >
          <span className="w-5 h-0.5 bg-white rounded-full" />
          <span className="w-5 h-0.5 bg-white rounded-full" />
          <span className="w-5 h-0.5 bg-white rounded-full" />
        </button>
      </header>

      {/* オーバーレイ */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ドロワー */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-teal-500 z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 職員情報 */}
        <div className="pt-12 pb-6 px-6 border-b border-teal-400">
          <p className="text-white text-xl font-bold">{session?.name || '...'}</p>
          <p className="text-teal-200 text-sm mt-0.5">{facilityName || ''}</p>
        </div>

        {/* メニュー */}
        <nav className="flex-1 overflow-y-auto py-4">
          <p className="text-teal-300 text-xs font-bold px-6 mb-2 tracking-widest">メニュー</p>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-4 px-6 py-4 text-white hover:bg-teal-400 active:bg-teal-600 transition-colors"
            >
              <span className="text-xl w-7 text-center">{item.icon}</span>
              <span className="text-base font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* ログアウト */}
        <div className="p-4 border-t border-teal-400">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-teal-200 hover:text-white transition-colors px-2 py-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="text-sm">ログアウト</span>
          </button>
        </div>
      </div>
    </>
  )
}
