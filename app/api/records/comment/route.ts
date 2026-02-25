import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const residentId = searchParams.get('residentId')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const where: Record<string, unknown> = {}
  if (residentId) where.residentId = Number(residentId)
  if (dateFrom || dateTo) {
    const range: Record<string, Date> = {}
    if (dateFrom) range.gte = new Date(dateFrom)
    if (dateTo) { const d = new Date(dateTo); d.setDate(d.getDate() + 1); range.lt = d }
    where.recordedAt = range
  }
  const records = await prisma.commentRecord.findMany({ where, include: { staff: true, resident: true }, orderBy: { recordedAt: 'desc' } })
  return NextResponse.json(records)
}

export async function POST(req: Request) {
  const body = await req.json()
  const record = await prisma.commentRecord.create({
    data: {
      residentId: Number(body.residentId), staffId: Number(body.staffId),
      category: body.category, content: body.content,
      ...(body.recordedAt ? { recordedAt: new Date(body.recordedAt) } : {}),
    },
    include: { staff: true, resident: true },
  })
  return NextResponse.json(record)
}