import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ResidentDetailClient from './ResidentDetailClient'

export const dynamic = 'force-dynamic'

export default async function ResidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resident = await prisma.resident.findUnique({ where: { id: Number(id) } })
  if (!resident) notFound()
  return <ResidentDetailClient resident={JSON.parse(JSON.stringify(resident))} />
}
