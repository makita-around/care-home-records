import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const staff = await prisma.staff.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } })
  return NextResponse.json(staff)
}

export async function POST(req: Request) {
  const body = await req.json()
  const staff = await prisma.staff.create({ data: { name: body.name, nameKana: body.nameKana || '' } })
  return NextResponse.json(staff)
}
