import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const all = new URL(req.url).searchParams.get('all') === 'true'
  const where = all ? {} : { isActive: true }
  const staff = await prisma.staff.findMany({ where, orderBy: { id: 'asc' } })
  return NextResponse.json(staff)
}

export async function POST(req: Request) {
  const body = await req.json()
  const staff = await prisma.staff.create({
    data: {
      name: body.name,
      nameKana: body.nameKana || '',
      isAdmin: body.isAdmin || false,
      pin: body.pin || null,
    },
  })
  return NextResponse.json(staff)
}
