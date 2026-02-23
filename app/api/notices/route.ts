import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') || '50')
  const notices = await prisma.notice.findMany({
    include: { staff: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return NextResponse.json(notices)
}

export async function POST(req: Request) {
  const body = await req.json()
  const notice = await prisma.notice.create({
    data: { content: body.content, staffId: Number(body.staffId) },
    include: { staff: true },
  })
  return NextResponse.json(notice)
}
