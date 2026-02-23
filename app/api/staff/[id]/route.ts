import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const staff = await prisma.staff.update({ where: { id: Number(id) }, data: body })
  return NextResponse.json(staff)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.staff.update({ where: { id: Number(id) }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
