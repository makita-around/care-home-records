import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signSession, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { staffId, pin } = await req.json()

  if (!staffId) {
    return NextResponse.json({ error: '職員を選択してください' }, { status: 400 })
  }

  const staff = await prisma.staff.findUnique({ where: { id: staffId } })
  if (!staff || !staff.isActive) {
    return NextResponse.json({ error: '職員が見つかりません' }, { status: 404 })
  }

  // 管理者はPIN不要
  if (!staff.isAdmin) {
    if (!staff.pin) {
      return NextResponse.json({ error: 'PINが設定されていません。管理者に連絡してください' }, { status: 403 })
    }
    if (staff.pin !== pin) {
      return NextResponse.json({ error: 'PINが違います' }, { status: 401 })
    }
  }

  // 未読通知を取得（lastLoginAt 以降の新着）
  const lastLogin = staff.lastLoginAt
  const [newNotices, unsignedReports] = await Promise.all([
    prisma.notice.findMany({
      where: {
        staffId: { not: staffId },
        ...(lastLogin ? { createdAt: { gt: lastLogin } } : {}),
      },
      include: { staff: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.accidentReport.findMany({
      where: {
        createdAt: { gte: staff.createdAt },
        NOT: {
          staffSignatures: { contains: `"staffId":${staffId}` },
        },
      },
      include: {
        resident: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  // lastLoginAt を更新
  await prisma.staff.update({
    where: { id: staffId },
    data: { lastLoginAt: new Date() },
  })

  // JWT 発行
  const token = await signSession({
    staffId: staff.id,
    name: staff.name,
    isAdmin: staff.isAdmin,
    staffCreatedAt: staff.createdAt.toISOString(),
  })

  const cookieOpts = setSessionCookie(token)
  const res = NextResponse.json({
    ok: true,
    staff: { id: staff.id, name: staff.name, isAdmin: staff.isAdmin },
    unread: {
      notices: newNotices.map((n) => ({
        id: n.id,
        content: n.content.slice(0, 60),
        staffName: n.staff.name,
        createdAt: n.createdAt,
      })),
      accidentReports: unsignedReports.map((r) => ({
        id: r.id,
        residentName: r.resident.name,
        accidentAt: r.accidentAt,
      })),
    },
  })

  res.cookies.set(cookieOpts.name, cookieOpts.value, {
    httpOnly: cookieOpts.httpOnly,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
  })

  return res
}
