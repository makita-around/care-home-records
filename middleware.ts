import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from './lib/auth'

// 認証不要のパス
const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 静的ファイルや Next.js 内部は除外
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/generate-pdf')
  ) {
    return NextResponse.next()
  }

  // 認証不要パスはそのまま通す
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // セッション確認
  const session = await getSessionFromRequest(req)
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // 管理者専用パスのチェック
  if (pathname.startsWith('/admin') && !session.isAdmin) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
