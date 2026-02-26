import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const residentIdParam = searchParams.get('residentId')
  const residentId = residentIdParam ? Number(residentIdParam) : undefined

  const startJst = new Date(dateStr)
  const endJst = new Date(dateStr)
  endJst.setDate(endJst.getDate() + 1)

  const [vitals, meals, meds, patrols, comments] = await Promise.all([
    prisma.vitalRecord.findMany({
      where: { recordedAt: { gte: startJst, lt: endJst}, ...(residentId ? { residentId } : {}) },
      include: { resident: { select: { id: true, name: true, roomNumber: true } }, staff: { select: { name: true } } },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.mealRecord.findMany({
      where: { recordedAt: { gte: startJst, lt: endJst}, ...(residentId ? { residentId } : {}) },
      include: { resident: { select: { id: true, name: true, roomNumber: true } }, staff: { select: { name: true } } },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.medicationRecord.findMany({
      where: { recordedAt: { gte: startJst, lt: endJst}, ...(residentId ? { residentId } : {}) },
      include: { resident: { select: { id: true, name: true, roomNumber: true } }, staff: { select: { name: true } } },
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.nightPatrolRecord.findMany({
      where: { patrolTime: { gte: startJst, lt: endJst}, ...(residentId ? { residentId } : {}) },
      include: { resident: { select: { id: true, name: true, roomNumber: true } }, staff: { select: { name: true } } },
      orderBy: { patrolTime: 'desc' },
    }),
    prisma.commentRecord.findMany({
      where: { recordedAt: { gte: startJst, lt: endJst}, ...(residentId ? { residentId } : {}) },
      include: { resident: { select: { id: true, name: true, roomNumber: true } }, staff: { select: { name: true } } },
      orderBy: { recordedAt: 'desc' },
    }),
  ])

  const records = [
    ...vitals.map(r => ({
      id: `vital-${r.id}`,
      type: 'vital' as const,
      recordedAt: r.recordedAt.toISOString(),
      resident: r.resident,
      staff: r.staff,
      summary: [
        r.systolic   != null ? `高圧${r.systolic}`   : null,
        r.diastolic  != null ? `低圧${r.diastolic}`  : null,
        r.pulse      != null ? `脈${r.pulse}`        : null,
        r.temperature != null ? `体温${r.temperature}℃` : null,
        r.spo2       != null ? `SpO₂${r.spo2}%`     : null,
      ].filter(Boolean).join(' ') || '（値なし）',
    })),
    ...meals.map(r => ({
      id: `meal-${r.id}`,
      type: 'meal' as const,
      recordedAt: r.recordedAt.toISOString(),
      resident: r.resident,
      staff: r.staff,
      summary: `${r.mealType}食 主${r.mainDish ?? '—'}/10 副${r.sideDish ?? '—'}/10${r.comment ? ' ' + r.comment : ''}`,
    })),
    ...meds.map(r => {
      type MedKey = 'beforeBreakfast'|'afterBreakfast'|'beforeLunch'|'afterLunch'|'beforeDinner'|'afterDinner'|'bedtime'|'eyeDrop'
      const MED_MAP: [MedKey, string][] = [
        ['beforeBreakfast','朝食前'],['afterBreakfast','朝食後'],
        ['beforeLunch','昼食前'],['afterLunch','昼食後'],
        ['beforeDinner','夕食前'],['afterDinner','夕食後'],
        ['bedtime','眠前'],['eyeDrop','点眼'],
      ]
      const done = MED_MAP.filter(([k]) => r[k] === true).map(([, l]) => l)
      return {
        id: `med-${r.id}`,
        type: 'medication' as const,
        recordedAt: r.recordedAt.toISOString(),
        resident: r.resident,
        staff: r.staff,
        summary: done.length > 0 ? done.join('・') : '（なし）',
      }
    }),
    ...patrols.map(r => ({
      id: `patrol-${r.id}`,
      type: 'night-patrol' as const,
      recordedAt: r.patrolTime.toISOString(),
      resident: r.resident,
      staff: r.staff,
      summary: `${r.status}${r.comment ? ' ' + r.comment : ''}`,
    })),
    ...comments.map(r => ({
      id: `comment-${r.id}`,
      type: 'comment' as const,
      recordedAt: r.recordedAt.toISOString(),
      resident: r.resident,
      staff: r.staff,
      summary: `[${r.category}] ${r.content}`,
    })),
  ]

  records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())

  return NextResponse.json(records)
}
