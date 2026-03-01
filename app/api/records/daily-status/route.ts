import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type RecordType = 'vital' | 'meal' | 'medication' | 'night-patrol' | 'comment'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const dateStr = searchParams.get('date') || new Date().toISOString().slice(0, 10)
  const type = searchParams.get('type') as RecordType | null
  const detail = searchParams.get('detail') === 'true'

  const dateStart = new Date(`${dateStr}T00:00:00`)
  const dateEnd   = new Date(`${dateStr}T23:59:59`)

  const residents = await prisma.resident.findMany({
    where: { isActive: true },
    select: { id: true, name: true, nameKana: true, roomNumber: true, floor: true, gender: true },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  })

  if (!type) {
    return NextResponse.json(residents.map(r => ({ ...r, hasRecord: false })))
  }

  if (type === 'meal') {
    const recs = await prisma.mealRecord.findMany({
      where: { recordedAt: { gte: dateStart, lte: dateEnd } },
      select: { id: true, staffId: true, residentId: true, mealType: true, mainDish: true, sideDish: true },
    })
    const mealMap = new Map<number, Record<string, { recordId: number; staffId: number; mainDish: number | null; sideDish: number | null }>>()
    recs.forEach(r => {
      if (!mealMap.has(r.residentId)) mealMap.set(r.residentId, {})
      mealMap.get(r.residentId)![r.mealType] = { recordId: r.id, staffId: r.staffId, mainDish: r.mainDish, sideDish: r.sideDish }
    })
    return NextResponse.json(residents.map(r => ({
      ...r,
      hasRecord: mealMap.has(r.id),
      detail: detail ? (mealMap.get(r.id) ?? {}) : undefined,
    })))
  }

  if (type === 'vital') {
    const recs = await prisma.vitalRecord.findMany({
      where: { recordedAt: { gte: dateStart, lte: dateEnd } },
      select: { id: true, staffId: true, residentId: true, systolic: true, diastolic: true, pulse: true, temperature: true, spo2: true },
      orderBy: { recordedAt: 'asc' },
    })
    const vitalMap = new Map<number, typeof recs[0]>()
    recs.forEach(r => vitalMap.set(r.residentId, r))
    return NextResponse.json(residents.map(r => ({
      ...r,
      hasRecord: vitalMap.has(r.id),
      detail: detail ? (vitalMap.get(r.id) ?? null) : undefined,
    })))
  }

  if (type === 'medication') {
    const recs = await prisma.medicationRecord.findMany({
      where: { recordedAt: { gte: dateStart, lte: dateEnd } },
      select: {
        id: true, staffId: true, residentId: true,
        beforeBreakfast: true, afterBreakfast: true,
        beforeLunch: true, afterLunch: true, beforeDinner: true,
        afterDinner: true, bedtime: true, eyeDrop: true,
      },
      orderBy: { recordedAt: 'asc' },
    })
    const medMap = new Map<number, typeof recs[0]>()
    recs.forEach(r => medMap.set(r.residentId, r))
    return NextResponse.json(residents.map(r => ({
      ...r,
      hasRecord: medMap.has(r.id),
      detail: detail ? (medMap.get(r.id) ?? null) : undefined,
    })))
  }

  if (type === 'night-patrol') {
    const recs = await prisma.nightPatrolRecord.findMany({
      where: { recordedAt: { gte: dateStart, lte: dateEnd } },
      select: { id: true, staffId: true, residentId: true, patrolTime: true, status: true },
      orderBy: { recordedAt: 'asc' },
    })
    const nightMap = new Map<number, typeof recs>()
    recs.forEach(r => {
      if (!nightMap.has(r.residentId)) nightMap.set(r.residentId, [])
      nightMap.get(r.residentId)!.push(r)
    })
    return NextResponse.json(residents.map(r => ({
      ...r,
      hasRecord: nightMap.has(r.id),
      detail: detail ? (nightMap.get(r.id) ?? []) : undefined,
    })))
  }

  if (type === 'comment') {
    const recs = await prisma.commentRecord.findMany({
      where: { recordedAt: { gte: dateStart, lte: dateEnd } },
      select: { id: true, staffId: true, residentId: true, category: true, content: true },
    })
    const commentMap = new Map<number, typeof recs>()
    recs.forEach(r => {
      if (!commentMap.has(r.residentId)) commentMap.set(r.residentId, [])
      commentMap.get(r.residentId)!.push(r)
    })
    return NextResponse.json(residents.map(r => ({
      ...r,
      hasRecord: commentMap.has(r.id),
      detail: detail ? (commentMap.get(r.id) ?? []) : undefined,
    })))
  }

  return NextResponse.json(residents.map(r => ({ ...r, hasRecord: false })))
}
