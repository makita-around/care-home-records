import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LoginClient from './LoginClient'
import prisma from '@/lib/prisma'

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect('/')

  const staffList = await prisma.staff.findMany({
    where: { isActive: true },
    select: { id: true, name: true, nameKana: true, isAdmin: true },
    orderBy: { id: 'asc' },
  })

  return <LoginClient staffList={staffList} />
}
