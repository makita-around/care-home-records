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
  const records = await prisma.medicationRecord.findMany({
    where, include: { staff: true, resident: { include: { medicationConfig: true } } }, orderBy: { recordedAt: 'desc' }
  })
  return NextResponse.json(records)
}

export async function POST(req: Request) {
  const body = await req.json()
  const record = await prisma.medicationRecord.create({
    data: {
      residentId: Number(body.residentId), staffId: Number(body.staffId),
      beforeBreakfast: body.beforeBreakfast ?? null, afterBreakfast: body.afterBreakfast ?? null,
      beforeLunch: body.beforeLunch ?? null, afterLunch: body.afterLunch ?? null,
      beforeDinner: body.beforeDinner ?? null, afterDinner: body.afterDinner ?? null,
      bedtime: body.bedtime ?? null, eyeDrop: body.eyeDrop ?? null,
      comment: body.comment || '',
      ...(body.recordedAt ? { recordedAt: new Date(body.recordedAt) } : {}),
    },
    include: { staff: true },
  })
  return NextResponse.json(record)
}