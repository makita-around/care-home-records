'use client'
import { useEffect, useState, useMemo } from 'react'
import Header from '@/app/components/Header'

type Resident = { id: number; name: string; roomNumber: string }

type RecordRow = {
  type: string
  recordedAt: string
  resident: { name: string; roomNumber: string }
  staff: string
  content: string
}

const ALL_TYPES = [
  { key: 'vital',        label: 'バイタル' },
  { key: 'meal',         label: '食事' },
  { key: 'medication',   label: '服薬・点眼' },
  { key: 'night-patrol', label: '夜間巡視' },
  { key: 'comment',      label: 'コメント' },
]

function todayStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const TYPE_COLOR: Record<string, string> = {
  'バイタル':    'bg-blue-100 text-blue-700',
  '食事':        'bg-orange-100 text-orange-700',
  '服薬・点眼':  'bg-green-100 text-green-700',
  '夜間巡視':   'bg-indigo-100 text-indigo-700',
}
function typeColor(type: string) {
  if (type.startsWith('コメント')) return 'bg-teal-100 text-teal-700'
  return TYPE_COLOR[type] || 'bg-slate-100 text-slate-600'
}

const PRINT_STYLE = `
  @media print {
    @page { size: A4 portrait; margin: 12mm; }
    body { font-size: 9pt; }
    .print\\:hidden { display: none !important; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 2mm; border-bottom: 0.5pt solid #ccc; font-size: 8pt; }
    th { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
    .resident-section + .resident-section { break-before: right; }
  }
`

function RecordTable({ rows, showResident }: { rows: RecordRow[]; showResident: boolean }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50">
          <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 whitespace-nowrap">日時</th>
          {showResident && <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 whitespace-nowrap">部屋・名前</th>}
          <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 whitespace-nowrap">種別</th>
          <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500">内容</th>
          <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 whitespace-nowrap">職員</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
            <td className="px-4 py-2.5 text-slate-500 font-mono whitespace-nowrap">{fmtDateTime(row.recordedAt)}</td>
            {showResident && (
              <td className="px-4 py-2.5 whitespace-nowrap">
                <span className="text-slate-400 text-xs">{row.resident.roomNumber}号</span>
                <span className="ml-1 font-medium text-slate-700">{row.resident.name}</span>
              </td>
            )}
            <td className="px-4 py-2.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${typeColor(row.type)}`}>
                {row.type}
              </span>
            </td>
            <td className="px-4 py-2.5 text-slate-700 leading-relaxed">{row.content}</td>
            <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap text-xs">{row.staff}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function getQuickDates() {
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  // toISOString()はUTC基準のため、ローカル日付で生成する
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  // 今週：月曜日〜今日（getDay(): 0=日, 1=月, ..., 6=土）
  const daysFromMonday = (today.getDay() + 6) % 7
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - daysFromMonday)

  // 先週：先週月曜日〜先週日曜日
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(thisWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(thisWeekStart)
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1)

  // 今月：1日〜今日、先月：先月1日〜先月末日
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

  return [
    { label: '今日', from: iso(today),          to: iso(today) },
    { label: '昨日', from: iso(yesterday),       to: iso(yesterday) },
    { label: '今週', from: iso(thisWeekStart),   to: iso(today) },
    { label: '先週', from: iso(lastWeekStart),   to: iso(lastWeekEnd) },
    { label: '今月', from: iso(thisMonthStart),  to: iso(today) },
    { label: '先月', from: iso(lastMonthStart),  to: iso(lastMonthEnd) },
  ]
}

function groupByResident(rows: RecordRow[]) {
  const map = new Map<string, { resident: RecordRow['resident']; rows: RecordRow[] }>()
  for (const row of rows) {
    const key = row.resident.roomNumber + '___' + row.resident.name
    if (!map.has(key)) map.set(key, { resident: row.resident, rows: [] })
    map.get(key)!.rows.push(row)
  }
  return [...map.values()].sort((a, b) =>
    Number(a.resident.roomNumber) - Number(b.resident.roomNumber)
  )
}

export default function AdminRecordsPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [dateFrom, setDateFrom] = useState(todayStr)
  const [dateTo, setDateTo] = useState(todayStr)
  const [residentId, setResidentId] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(ALL_TYPES.map(t => t.key)))
  const [rows, setRows] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    fetch('/api/residents').then(r => r.json()).then(setResidents)
  }, [])

  const isIndividual = residentId === 'all-individual'

  const groupedRows = useMemo(() =>
    isIndividual ? groupByResident(rows) : null,
    [rows, isIndividual]
  )

  const toggleType = (key: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev)
      if (next.has(key)) { if (next.size > 1) next.delete(key) } else next.add(key)
      return next
    })
  }

  const buildApiParams = () => {
    const params = new URLSearchParams({
      dateFrom,
      dateTo,
      types: [...selectedTypes].join(','),
    })
    // 全員（個別）は全員分を取得するのでresidentId不要
    if (residentId && !isIndividual) params.set('residentId', residentId)
    return params
  }

  const handleSearch = async () => {
    setLoading(true)
    const res = await fetch(`/api/records/search?${buildApiParams()}`)
    const data = await res.json()
    setRows(data)
    setSearched(true)
    setLoading(false)
  }

  const handlePrint = () => window.print()

  const handlePdf = async () => {
    const res = await fetch(`/api/records/search?${buildApiParams()}`)
    const data: RecordRow[] = await res.json()

    const residentLabel = isIndividual
      ? '全員（個別）'
      : residentId
        ? residents.find(r => String(r.id) === residentId)?.name || ''
        : '全員'

    const html = buildPrintHtml(data, dateFrom, dateTo, residentLabel, isIndividual)

    const pdfRes = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, landscape: false }),
    })
    if (!pdfRes.ok) { alert('PDF生成に失敗しました'); return }
    const blob = await pdfRes.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const dateLabel = dateFrom === dateTo ? dateFrom : `${dateFrom}〜${dateTo}`
    a.download = `生活記録一覧_${residentLabel}_${dateLabel}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const quickDates = getQuickDates()

  return (
    <div className="min-h-screen bg-slate-100 pb-6">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLE }} />
      <Header title="記録検索・出力" backUrl="/admin" />

      {/* 検索フォーム */}
      <div className="bg-white mt-2 mx-0 shadow-sm px-4 py-4 space-y-4 print:hidden">
        {/* 期間 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">期間</label>
          <div className="flex items-center gap-2 mt-1.5">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
            <span className="text-slate-400 text-sm">〜</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-400" />
          </div>
          {/* クイック期間ボタン */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {quickDates.map(q => (
              <button key={q.label} onClick={() => { setDateFrom(q.from); setDateTo(q.to) }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-teal-100 hover:text-teal-700 transition-colors font-medium">
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* 利用者 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">利用者</label>
          <select value={residentId} onChange={e => setResidentId(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1.5 outline-none focus:border-teal-400 bg-white">
            <option value="">全員</option>
            <option value="all-individual">全員（個別）</option>
            {residents.map(r => (
              <option key={r.id} value={String(r.id)}>{r.roomNumber}号　{r.name}</option>
            ))}
          </select>
        </div>

        {/* 記録種別 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">記録種別</label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {ALL_TYPES.map(t => (
              <button key={t.key} onClick={() => toggleType(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedTypes.has(t.key) ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading}
          className="w-full bg-teal-500 text-white py-3.5 rounded-xl font-bold text-base hover:bg-teal-600 active:bg-teal-700 transition-colors disabled:opacity-40">
          {loading ? '検索中...' : '検索する'}
        </button>
      </div>

      {/* 結果 */}
      {searched && (
        <div className="bg-white mt-2 mx-0 shadow-sm">
          {/* ツールバー */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between print:hidden">
            <p className="text-sm font-bold text-slate-600">{rows.length}件</p>
            <div className="flex gap-2">
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors">
                🖨️ 印刷
              </button>
              <button onClick={handlePdf}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors">
                📄 PDF
              </button>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="text-center text-slate-400 py-10 text-sm">記録が見つかりませんでした</p>
          ) : isIndividual && groupedRows ? (
            // 全員（個別）モード：利用者ごとにセクション分け
            <div>
              {groupedRows.map((group, i) => (
                <div key={i} className="resident-section">
                  <div className="px-4 py-2.5 bg-teal-50 border-b border-teal-100 border-t font-bold text-teal-800">
                    {group.resident.roomNumber}号　{group.resident.name}
                    <span className="ml-2 text-xs font-normal text-teal-600">{group.rows.length}件</span>
                  </div>
                  <div className="overflow-x-auto">
                    <RecordTable rows={group.rows} showResident={false} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 通常モード（全員まとめ・個人指定）
            <div className="overflow-x-auto">
              <RecordTable rows={rows} showResident={true} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function buildPrintHtml(rows: RecordRow[], dateFrom: string, dateTo: string, residentLabel: string, individual: boolean): string {
  const tableHtml = (tableRows: RecordRow[], showResident: boolean) => {
    const bodyRows = tableRows.map(r => `
      <tr>
        <td>${fmtDateTime(r.recordedAt)}</td>
        ${showResident ? `<td>${r.resident.roomNumber}号 ${r.resident.name}</td>` : ''}
        <td>${r.type}</td>
        <td>${r.content}</td>
        <td>${r.staff}</td>
      </tr>
    `).join('')
    return `
      <table>
        <thead><tr>
          <th>日時</th>
          ${showResident ? '<th>利用者</th>' : ''}
          <th>種別</th><th>内容</th><th>職員</th>
        </tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `
  }

  let bodyContent: string
  if (individual) {
    const groups = groupByResident(rows)
    bodyContent = groups.map((g, i) => `
      <div${i > 0 ? ' class="break-before-right"' : ''}>
        <h2>${g.resident.roomNumber}号　${g.resident.name}</h2>
        <p class="sub">期間: ${dateFrom} 〜 ${dateTo}　${g.rows.length}件</p>
        ${tableHtml(g.rows, false)}
      </div>
    `).join('')
  } else {
    bodyContent = `
      <h2>記録一覧</h2>
      <p class="sub">期間: ${dateFrom} 〜 ${dateTo}　利用者: ${residentLabel}　全${rows.length}件</p>
      ${tableHtml(rows, true)}
    `
  }

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<style>
  @page { size: A4 portrait; margin: 12mm; }
  body { font-family: 'Noto Sans JP', sans-serif; font-size: 9pt; color: #222; }
  h2 { font-size: 11pt; margin: 0 0 4mm; }
  p.sub { font-size: 8pt; color: #666; margin: 0 0 4mm; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f1f5f9; font-size: 8pt; text-align: left; padding: 3mm 2mm; border-bottom: 1pt solid #cbd5e1; white-space: nowrap; }
  td { padding: 2mm; border-bottom: 0.5pt solid #e2e8f0; vertical-align: top; }
  td:first-child { white-space: nowrap; font-family: monospace; }
  td:nth-child(2) { white-space: nowrap; }
  .break-before-right { break-before: right; }
</style></head><body>
${bodyContent}
</body></html>`
}
