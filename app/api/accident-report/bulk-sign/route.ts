import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { staffId, staffName, staffCreatedAt } = await req.json()
  if (!staffId || !staffName) {
    return NextResponse.json({ error: '職員情報が必要です' }, { status: 400 })
  }

  const joinDate = staffCreatedAt ? new Date(staffCreatedAt) : new Date(0)

  // 入職日以降で自分がまだ署名していない報告書を取得
  const reports = await prisma.accidentReport.findMany({
    where: {
      createdAt: { gte: joinDate },
      NOT: {
        staffSignatures: { contains: `"staffId":${staffId}` },
      },
    },
    select: { id: true, staffSignatures: true },
  })

  if (reports.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  // 各報告書に署名を追加
  await Promise.all(
    reports.map(async (r) => {
      let sigs: { staffId: number; name: string }[] = []
      try { sigs = JSON.parse(r.staffSignatures || '[]') } catch { sigs = [] }
      sigs.push({ staffId, name: staffName })
      await prisma.accidentReport.update({
        where: { id: r.id },
        data: { staffSignatures: JSON.stringify(sigs) },
      })
    })
  )

  return NextResponse.json({ updated: reports.length })
}
