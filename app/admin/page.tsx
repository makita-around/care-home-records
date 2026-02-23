import Link from 'next/link'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gray-700 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href="/" className="text-white text-2xl">←</Link>
        <h1 className="font-bold text-lg">管理者画面</h1>
      </header>
      <div className="p-4 space-y-3">
        {[{href:'/admin/staff',l:'職員管理',i:'👤',c:'bg-blue-500'},{href:'/admin/residents',l:'入居者管理',i:'🏠',c:'bg-green-500'},{href:'/admin/settings',l:'基本設定',i:'⚙️',c:'bg-gray-500'}].map(item=>(
          <Link key={item.href} href={item.href} className={`${item.c} text-white rounded-xl p-4 flex items-center gap-4 shadow-sm active:opacity-80`}>
            <span className="text-3xl">{item.i}</span><span className="font-bold text-lg">{item.l}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
