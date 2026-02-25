import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const residentId = searchParams.get('residentId')
  const date = searchParams.get('date')
  const where: Record<string, unknown> = {}
  if (residentId) where.residentId = Number(residentId)
  if (date) {
    const d = new Date(date); const next = new Date(d); next.setDate(next.getDate() + 1)
    where.recordedAt = { gte: d, lt: next }
  }
  const records = await prisma.nightPatrolRecord.findMany({ where, include: { staff: true, resident: true }, orderBy: { patrolTime: 'asc' } })
  return NextResponse.json(records)
}

export async function POST(req: Request) {
  const body = await req.json()
  const record = await prisma.nightPatrolRecord.create({
    data: {
      residentId: Number(body.residentId), staffId: Number(body.staffId),
      patrolTime: new Date(body.patrolTime), status: body.status, comment: body.comment || '',
      recordedAt: new Date(body.patrolTime),
    },
    include: { staff: true },
  })
  return NextResponse.json(record)
}