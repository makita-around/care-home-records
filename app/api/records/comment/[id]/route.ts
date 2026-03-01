import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number((await params).id)
  const record = await prisma.commentRecord.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (record.staffId !== session.staffId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const updated = await prisma.commentRecord.update({
    where: { id },
    data: {
      category: body.category,
      content: body.content,
      ...(body.recordedAt ? { recordedAt: new Date(body.recordedAt) } : {}),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number((await params).id)
  const record = await prisma.commentRecord.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (record.staffId !== session.staffId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.commentRecord.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
