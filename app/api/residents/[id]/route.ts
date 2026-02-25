import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resident = await prisma.resident.findUnique({
    where: { id: Number(id) },
    include: { medicationConfig: true, assessmentSheet: true },
  })
  return NextResponse.json(resident)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = { ...body }
  if (body.birthDate) data.birthDate = new Date(body.birthDate)
  if (body.moveInDate) data.moveInDate = new Date(body.moveInDate)
  const resident = await prisma.resident.update({ where: { id: Number(id) }, data })
  return NextResponse.json(resident)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)

  if (searchParams.get('permanent') === 'true') {
    const numId = Number(id)
    await prisma.$transaction([
      prisma.medicationRecord.deleteMany({ where: { residentId: numId } }),
      prisma.mealRecord.deleteMany({ where: { residentId: numId } }),
      prisma.vitalRecord.deleteMany({ where: { residentId: numId } }),
      prisma.mealChange.deleteMany({ where: { residentId: numId } }),
      prisma.nightPatrolRecord.deleteMany({ where: { residentId: numId } }),
      prisma.commentRecord.deleteMany({ where: { residentId: numId } }),
      prisma.notice.deleteMany({ where: { residentId: numId } }),
      prisma.accidentReport.deleteMany({ where: { residentId: numId } }),
      prisma.assessmentSheet.deleteMany({ where: { residentId: numId } }),
      prisma.medicationConfig.deleteMany({ where: { residentId: numId } }),
      prisma.resident.delete({ where: { id: numId } }),
    ])
    return NextResponse.json({ ok: true })
  }

  await prisma.resident.update({ where: { id: Number(id) }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
