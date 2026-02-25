import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') || '50')
  const notices = await prisma.notice.findMany({
    include: {
      staff: { select: { name: true } },
      resident: { select: { name: true, roomNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return NextResponse.json(notices)
}

export async function DELETE() {
  await prisma.notice.deleteMany({})
  return NextResponse.json({ ok: true })
}

export async function POST(req: Request) {
  const body = await req.json()
  const notice = await prisma.notice.create({
    data: {
      content: body.content,
      staffId: Number(body.staffId),
      ...(body.residentId ? { residentId: Number(body.residentId) } : {}),
    },
    include: { staff: { select: { name: true } } },
  })
  return NextResponse.json(notice)
}
