import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = await params
  const config = await prisma.medicationConfig.findUnique({ where: { residentId: Number(residentId) } })
  return NextResponse.json(config)
}

export async function PUT(req: Request, { params }: { params: Promise<{ residentId: string }> }) {
  const { residentId } = await params
  const body = await req.json()
  const config = await prisma.medicationConfig.upsert({
    where: { residentId: Number(residentId) },
    update: body,
    create: { residentId: Number(residentId), ...body },
  })
  return NextResponse.json(config)
}