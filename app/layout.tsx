import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from './components/SessionContext'

export const metadata: Metadata = {
  title: '生活記録',
  description: '介護施設生活記録システム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-100">
        <SessionProvider>
          <div className="max-w-2xl mx-auto min-h-screen bg-slate-100 relative">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
