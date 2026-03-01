import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const MED_LABELS: Record<string, string> = {
  beforeBreakfast: '朝食前', afterBreakfast: '朝食後',
  beforeLunch: '昼食前', afterLunch: '昼食後',
  beforeDinner: '夕食前', afterDinner: '夕食後',
  bedtime: '眠前', eyeDrop: '点眼',
}
const MED_KEYS = Object.keys(MED_LABELS)

export async function GET(req: NextRequest) {
  try {
  const sp = req.nextUrl.searchParams
  const dateFrom = sp.get('dateFrom')
  const dateTo = sp.get('dateTo')
  const residentId = sp.get('residentId')
  const typesParam = sp.get('types')
  const types = typesParam ? typesParam.split(',').filter(Boolean) : ['vital', 'meal', 'medication', 'night-patrol', 'comment']

  const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date(0)
  const to = dateTo ? new Date(dateTo + 'T23:59:59') : new Date()
  const resWhere = residentId ? { residentId: Number(residentId) } : {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any[] = []

  if (types.includes('vital')) {
    const rows = await prisma.vitalRecord.findMany({
      where: { ...resWhere, recordedAt: { gte: from, lte: to } },
      include: { resident: true, staff: true },
      orderBy: { recordedAt: 'desc' },
    })
    rows.forEach(r => results.push({
      id: r.id,
      staffId: r.staffId,
      type: 'バイタル',
      recordedAt: r.recordedAt,
      resident: { name: r.resident.name, roomNumber: r.resident.roomNumber },
      staff: r.staff.name,
      content: [
        r.systolic != null ? `高圧:${r.systolic}` : null,
        r.diastolic != null ? `低圧:${r.diastolic}` : null,
        r.pulse != null ? `脈拍:${r.pulse}` : null,
        r.temperature != null ? `体温:${r.temperature}` : null,
        r.spo2 != null ? `SpO2:${r.spo2}` : null,
        r.comment || null,
      ].filter(Boolean).join('　'),
      rawData: { systolic: r.systolic, diastolic: r.diastolic, pulse: r.pulse, temperature: r.temperature, spo2: r.spo2, comment: r.comment, recordedAt: r.recordedAt },
    }))
  }

  if (types.includes('meal')) {
    const rows = await prisma.mealRecord.findMany({
      where: { ...resWhere, recordedAt: { gte: from, lte: to } },
      include: { resident: true, staff: true },
      orderBy: { recordedAt: 'desc' },
    })
    rows.forEach(r => results.push({
      id: r.id,
      staffId: r.staffId,
      type: '食事',
      recordedAt: r.recordedAt,
      resident: { name: r.resident.name, roomNumber: r.resident.roomNumber },
      staff: r.staff.name,
      content: [
        `${r.mealType}食`,
        r.mainDish != null ? `主:${r.mainDish}` : null,
        r.sideDish != null ? `副:${r.sideDish}` : null,
        r.comment || null,
      ].filter(Boolean).join('　'),
      rawData: { mealType: r.mealType, mainDish: r.mainDish, sideDish: r.sideDish, comment: r.comment, recordedAt: r.recordedAt },
    }))
  }

  if (types.includes('medication')) {
    const rows = await prisma.medicationRecord.findMany({
      where: { ...resWhere, recordedAt: { gte: from, lte: to } },
      include: { resident: true, staff: true },
      orderBy: { recordedAt: 'desc' },
    })
    rows.forEach(r => {
      const taken = MED_KEYS.filter(k => (r as Record<string, unknown>)[k] === true).map(k => MED_LABELS[k])
      results.push({
        id: r.id,
        staffId: r.staffId,
        type: '服薬・点眼',
        recordedAt: r.recordedAt,
        resident: { name: r.resident.name, roomNumber: r.resident.roomNumber },
        staff: r.staff.name,
        content: [
          taken.length > 0 ? taken.join('・') : null,
          r.comment || null,
        ].filter(Boolean).join('　'),
        rawData: { beforeBreakfast: r.beforeBreakfast, afterBreakfast: r.afterBreakfast, beforeLunch: r.beforeLunch, afterLunch: r.afterLunch, beforeDinner: r.beforeDinner, afterDinner: r.afterDinner, bedtime: r.bedtime, eyeDrop: r.eyeDrop, comment: r.comment, recordedAt: r.recordedAt },
      })
    })
  }

  if (types.includes('night-patrol')) {
    const rows = await prisma.nightPatrolRecord.findMany({
      where: { ...resWhere, recordedAt: { gte: from, lte: to } },
      include: { resident: true, staff: true },
      orderBy: { recordedAt: 'desc' },
    })
    rows.forEach(r => results.push({
      id: r.id,
      staffId: r.staffId,
      type: '夜間巡視',
      recordedAt: r.recordedAt,
      resident: { name: r.resident.name, roomNumber: r.resident.roomNumber },
      staff: r.staff.name,
      content: [r.status, r.comment || null].filter(Boolean).join('　'),
      rawData: { patrolTime: r.patrolTime, status: r.status, comment: r.comment },
    }))
  }

  if (types.includes('comment')) {
    const rows = await prisma.commentRecord.findMany({
      where: { ...resWhere, recordedAt: { gte: from, lte: to } },
      include: { resident: true, staff: true },
      orderBy: { recordedAt: 'desc' },
    })
    rows.forEach(r => results.push({
      id: r.id,
      staffId: r.staffId,
      type: `コメント(${r.category})`,
      recordedAt: r.recordedAt,
      resident: { name: r.resident.name, roomNumber: r.resident.roomNumber },
      staff: r.staff.name,
      content: r.content,
      rawData: { category: r.category, content: r.content, recordedAt: r.recordedAt },
    }))
  }

  if (types.includes('meal-changes')) {
    const rows = await prisma.mealChange.findMany({
      where: { ...(residentId ? { residentId: Number(residentId) } : {}), createdAt: { gte: from, lte: to } },
      include: { resident: true, staff: true },
    })
    rows.forEach(r => {
      const meals = [r.breakfast && '朝', r.lunch && '昼', r.dinner && '夕'].filter(Boolean).join('・')
      const d = new Date(r.changeDate)
      results.push({
        type: '食事変更',
        recordedAt: r.createdAt,
        resident: { name: r.resident.name, roomNumber: r.resident.roomNumber },
        staff: r.staff.name,
        content: `${d.getMonth() + 1}/${d.getDate()} ${meals} ${r.changeType}`,
      })
    })
  }

  if (types.includes('notices')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (prisma.notice as any).findMany({
      where: { ...(residentId ? { residentId: Number(residentId) } : {}), createdAt: { gte: from, lte: to } },
      include: { staff: true },
    })
    // residentId がある場合は別途取得
    const noticeResidentIds = [...new Set(rows.filter((r: { residentId: number | null }) => r.residentId != null).map((r: { residentId: number }) => r.residentId))]
    const noticeResidentMap = new Map<number, { name: string; roomNumber: string }>()
    if (noticeResidentIds.length > 0) {
      const nResidents = await prisma.resident.findMany({ where: { id: { in: noticeResidentIds as number[] } } })
      nResidents.forEach(r => noticeResidentMap.set(r.id, { name: r.name, roomNumber: r.roomNumber }))
    }
    rows.forEach((r: { createdAt: Date; residentId: number | null; staff: { name: string }; content: string }) => results.push({
      type: '申し送り',
      recordedAt: r.createdAt,
      resident: r.residentId != null
        ? (noticeResidentMap.get(r.residentId) ?? { name: '利用者', roomNumber: '' })
        : { name: '全体', roomNumber: '' },
      staff: r.staff.name,
      content: r.content,
    }))
  }

  results.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
  return NextResponse.json(results)
  } catch (e) {
    console.error('[search] error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
