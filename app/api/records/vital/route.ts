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
  const records = await prisma.vitalRecord.findMany({ where, include: { staff: true, resident: true }, orderBy: { recordedAt: 'desc' } })
  return NextResponse.json(records)
}

export async function POST(req: Request) {
  const body = await req.json()
  const record = await prisma.vitalRecord.create({
    data: {
      residentId: Number(body.residentId), staffId: Number(body.staffId),
      systolic: body.systolic ? Number(body.systolic) : null,
      diastolic: body.diastolic ? Number(body.diastolic) : null,
      pulse: body.pulse ? Number(body.pulse) : null,
      temperature: body.temperature ? Number(body.temperature) : null,
      spo2: body.spo2 ? Number(body.spo2) : null,
      comment: body.comment || '',
      ...(body.recordedAt ? { recordedAt: new Date(body.recordedAt) } : {}),
    },
    include: { staff: true, resident: true },
  })
  return NextResponse.json(record)
}