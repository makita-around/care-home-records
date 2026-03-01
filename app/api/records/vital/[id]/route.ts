import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number((await params).id)
  const record = await prisma.vitalRecord.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (record.staffId !== session.staffId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const updated = await prisma.vitalRecord.update({
    where: { id },
    data: {
      systolic: body.systolic != null ? Number(body.systolic) : null,
      diastolic: body.diastolic != null ? Number(body.diastolic) : null,
      pulse: body.pulse != null ? Number(body.pulse) : null,
      temperature: body.temperature != null ? Number(body.temperature) : null,
      spo2: body.spo2 != null ? Number(body.spo2) : null,
      comment: body.comment ?? '',
      ...(body.recordedAt ? { recordedAt: new Date(body.recordedAt) } : {}),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number((await params).id)
  const record = await prisma.vitalRecord.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (record.staffId !== session.staffId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.vitalRecord.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
