import { NextResponse } from 'next/server'
import { performBackup } from '@/lib/backup'

export async function POST() {
  const result = await performBackup()
  return NextResponse.json(result)
}
