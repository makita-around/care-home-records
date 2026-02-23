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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.resident.update({ where: { id: Number(id) }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
