import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const floor = searchParams.get('floor')
  const where: { isActive: boolean; floor?: string } = { isActive: true }
  if (floor) where.floor = floor
  const residents = await prisma.resident.findMany({ where, orderBy: { roomNumber: 'asc' } })
  return NextResponse.json(residents)
}

export async function POST(req: Request) {
  const body = await req.json()
  const resident = await prisma.resident.create({
    data: {
      name: body.name, nameKana: body.nameKana || '', roomNumber: body.roomNumber,
      floor: body.floor || '', gender: body.gender,
      birthDate: new Date(body.birthDate),
      moveInDate: body.moveInDate ? new Date(body.moveInDate) : new Date(),
      careLevel: body.careLevel || '',
    },
  })
  await prisma.medicationConfig.create({ data: { residentId: resident.id } })
  return NextResponse.json(resident)
}
