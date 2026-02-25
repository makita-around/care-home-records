import Header from '@/app/components/Header'
import BulkInputClient from './BulkInputClient'

export default function BulkInputPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header title="一括入力" backUrl="/" />
      <BulkInputClient />
    </div>
  )
}
