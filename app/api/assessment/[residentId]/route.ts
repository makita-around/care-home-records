import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = await params
  const sheet = await prisma.assessmentSheet.findUnique({ where: { residentId: Number(residentId) }, include: { resident: true } })
  return NextResponse.json(sheet)
}

export async function PUT(req: Request, { params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = await params
  const body = await req.json()
  const data: Record<string, unknown> = { ...body }
  if (body.insuranceExpiry) data.insuranceExpiry = new Date(body.insuranceExpiry)
  if (body.certPeriodStart) data.certPeriodStart = new Date(body.certPeriodStart)
  if (body.certPeriodEnd) data.certPeriodEnd = new Date(body.certPeriodEnd)
  if (body.adlData && typeof body.adlData === 'object') data.adlData = JSON.stringify(body.adlData)
  const sheet = await prisma.assessmentSheet.upsert({
    where: { residentId: Number(residentId) },
    update: data,
    create: { residentId: Number(residentId), ...data },
  })
  return NextResponse.json(sheet)
}