import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number((await params).id)
  const record = await prisma.medicationRecord.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (record.staffId !== session.staffId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const updated = await prisma.medicationRecord.update({
    where: { id },
    data: {
      beforeBreakfast: body.beforeBreakfast ?? null,
      afterBreakfast: body.afterBreakfast ?? null,
      beforeLunch: body.beforeLunch ?? null,
      afterLunch: body.afterLunch ?? null,
      beforeDinner: body.beforeDinner ?? null,
      afterDinner: body.afterDinner ?? null,
      bedtime: body.bedtime ?? null,
      eyeDrop: typeof body.eyeDrop === 'boolean' ? (body.eyeDrop ? 1 : null) : (body.eyeDrop != null ? Number(body.eyeDrop) : null),
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
  const record = await prisma.medicationRecord.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (record.staffId !== session.staffId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.medicationRecord.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
