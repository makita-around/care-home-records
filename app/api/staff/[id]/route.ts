import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const staff = await prisma.staff.update({ where: { id: Number(id) }, data: body })
  return NextResponse.json(staff)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)

  if (searchParams.get('permanent') === 'true') {
    const numId = Number(id)
    await prisma.$transaction([
      prisma.medicationRecord.deleteMany({ where: { staffId: numId } }),
      prisma.mealRecord.deleteMany({ where: { staffId: numId } }),
      prisma.vitalRecord.deleteMany({ where: { staffId: numId } }),
      prisma.mealChange.deleteMany({ where: { staffId: numId } }),
      prisma.nightPatrolRecord.deleteMany({ where: { staffId: numId } }),
      prisma.commentRecord.deleteMany({ where: { staffId: numId } }),
      prisma.notice.deleteMany({ where: { staffId: numId } }),
      prisma.accidentReport.deleteMany({ where: { reporterId: numId } }),
      prisma.staff.delete({ where: { id: numId } }),
    ])
    return NextResponse.json({ ok: true })
  }

  await prisma.staff.update({ where: { id: Number(id) }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
