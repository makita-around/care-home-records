import { prisma } from '@/lib/prisma'
import TopClient from './TopClient'

export const dynamic = 'force-dynamic'

export default async function TopPage() {
  const facilityName = await prisma.setting.findUnique({ where: { key: 'facilityName' } })
  return <TopClient facilityName={facilityName?.value || '生活記録'} />
}
