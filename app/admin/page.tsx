import Link from 'next/link'
import Header from '@/app/components/Header'

const ITEMS = [
  { href: '/admin/staff',            label: '職員管理',       icon: '👤', color: 'border-l-blue-500' },
  { href: '/admin/residents',        label: '入居者管理',     icon: '🏠', color: 'border-l-green-500' },
  { href: '/admin/notices',          label: '申し送り管理',   icon: '📋', color: 'border-l-orange-500' },
  { href: '/admin/records',          label: '記録検索・出力', icon: '🔍', color: 'border-l-teal-500' },
  { href: '/admin/settings',         label: '基本設定',       icon: '⚙️', color: 'border-l-slate-500' },
]

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header title="管理者画面" backUrl="/" />
      <div className="bg-white mt-2 mx-0 shadow-sm overflow-hidden">
        {ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-4 py-4 border-l-4 ${item.color} hover:bg-slate-50 active:bg-slate-100 transition-colors ${
              i !== ITEMS.length - 1 ? 'border-b border-slate-100' : ''
            }`}
          >
            <span className="text-2xl w-8 text-center">{item.icon}</span>
            <span className="font-bold text-slate-700 text-base flex-1">{item.label}</span>
            <svg className="text-slate-300" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
