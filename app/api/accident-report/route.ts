import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const residentId = searchParams.get('residentId')
  const where: Record<string, unknown> = {}
  if (residentId) where.residentId = Number(residentId)
  const reports = await prisma.accidentReport.findMany({ where, include: { resident: true, reporter: true }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(reports)
}

export async function POST(req: Request) {
  const body = await req.json()
  const report = await prisma.accidentReport.create({
    data: {
      residentId: Number(body.residentId), reporterId: Number(body.reporterId),
      accidentAt: new Date(body.accidentAt),
      location: body.location || '', accidentType: body.accidentType || '',
      description: body.description || '', injury: body.injury || '',
      injuryParts: body.injuryParts || '', response: body.response || '',
      afterStatus: body.afterStatus || '', familyReport: body.familyReport || false,
      causeAnalysis: body.causeAnalysis || '', prevention: body.prevention || '',
    },
    include: { resident: true, reporter: true },
  })
  return NextResponse.json(report)
}