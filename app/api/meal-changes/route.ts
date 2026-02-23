import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') || '50')
  const changes = await prisma.mealChange.findMany({
    include: { resident: true, staff: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return NextResponse.json(changes)
}

export async function POST(req: Request) {
  const body = await req.json()
  const change = await prisma.mealChange.create({
    data: {
      residentId: Number(body.residentId), staffId: Number(body.staffId),
      changeDate: new Date(body.changeDate),
      breakfast: body.breakfast || false, lunch: body.lunch || false, dinner: body.dinner || false,
      changeType: body.changeType,
    },
    include: { resident: true, staff: true },
  })
  return NextResponse.json(change)
}
