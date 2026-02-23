import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const report = await prisma.accidentReport.findUnique({ where: { id: Number(id) }, include: { resident: true, reporter: true } })
  return NextResponse.json(report)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = { ...body }
  if (body.accidentAt) data.accidentAt = new Date(body.accidentAt)
  const report = await prisma.accidentReport.update({ where: { id: Number(id) }, data, include: { resident: true, reporter: true } })
  return NextResponse.json(report)
}