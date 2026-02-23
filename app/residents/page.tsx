import { prisma } from '@/lib/prisma'
import ResidentsClient from './ResidentsClient'

export const dynamic = 'force-dynamic'

export default async function ResidentsPage() {
  const residents = await prisma.resident.findMany({ where: { isActive: true }, orderBy: { roomNumber: 'asc' } })
  const floors = [...new Set(residents.map(r => r.floor).filter(Boolean))].sort()
  return <ResidentsClient residents={JSON.parse(JSON.stringify(residents))} floors={floors} />
}
