import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'care-home-records-secret-key-2026'
)
const COOKIE_NAME = 'auth_session'

export interface SessionPayload {
  staffId: number
  name: string
  isAdmin: boolean
  staffCreatedAt: string
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(SECRET)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return {
      staffId: payload.staffId as number,
      name: payload.name as string,
      isAdmin: payload.isAdmin as boolean,
      staffCreatedAt: (payload.staffCreatedAt as string) || new Date(0).toISOString(),
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export function setSessionCookie(token: string): { name: string; value: string; httpOnly: boolean; sameSite: 'lax'; path: string } {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // max-age なし → セッションクッキー（タブ/ブラウザ閉じたら消滅）
  }
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME
