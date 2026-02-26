import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  const startJst = new Date(dateStr)
  const endJst = new Date(dateStr)
  endJst.setDate(endJst.getDate() + 1)

  const [residents, vitals, meals, patrols, meds] = await Promise.all([
    prisma.resident.findMany({
      where: { isActive: true },
      orderBy: { roomNumber: 'asc' },
      select: { id: true, name: true, roomNumber: true, floor: true },
    }),
    prisma.vitalRecord.findMany({
      where: { recordedAt: { gte: startJst, lt: endJst } },
      include: { staff: { select: { name: true } } },
      orderBy: { recordedAt: 'asc' },
    }),
    prisma.mealRecord.findMany({
      where: { recordedAt: { gte: startJst, lt: endJst } },
      include: { staff: { select: { name: true } } },
      orderBy: { recordedAt: 'asc' },
    }),
    prisma.nightPatrolRecord.findMany({
      where: { patrolTime: { gte: startJst, lt: endJst } },
      include: { staff: { select: { name: true } } },
      orderBy: { patrolTime: 'asc' },
    }),
    prisma.medicationRecord.findMany({
      where: { recordedAt: { gte: startJst, lt: endJst } },
      orderBy: { recordedAt: 'desc' },
    }),
  ])

  const floors = [...new Set(residents.map(r => r.floor).filter(Boolean))].sort()

  const mealSlot = (residentId: number, mealType: string) => {
    const m = meals.find(m => m.residentId === residentId && m.mealType === mealType)
    return m ? { mainDish: m.mainDish, sideDish: m.sideDish, staff: m.staff.name } : null
  }

  const result = residents.map(resident => {
    // 当日の最新服薬記録を取得
    const med = meds.find(m => m.residentId === resident.id) ?? null
    return {
      id: resident.id,
      name: resident.name,
      roomNumber: resident.roomNumber,
      floor: resident.floor,
      vitals: vitals
        .filter(v => v.residentId === resident.id)
        .map(v => ({
          recordedAt: v.recordedAt.toISOString(),
          systolic: v.systolic,
          diastolic: v.diastolic,
          pulse: v.pulse,
          temperature: v.temperature,
          spo2: v.spo2,
          staff: v.staff.name,
        })),
      meals: {
        '朝': mealSlot(resident.id, '朝'),
        '昼': mealSlot(resident.id, '昼'),
        '夕': mealSlot(resident.id, '夕'),
      },
      medication: med ? {
        beforeBreakfast: med.beforeBreakfast,
        afterBreakfast:  med.afterBreakfast,
        beforeLunch:     med.beforeLunch,
        afterLunch:      med.afterLunch,
        beforeDinner:    med.beforeDinner,
        afterDinner:     med.afterDinner,
        bedtime:         med.bedtime,
        eyeDrop:         med.eyeDrop,
      } : null,
      nightPatrols: patrols
        .filter(p => p.residentId === resident.id)
        .map(p => ({
          patrolTime: p.patrolTime.toISOString(),
          status: p.status,
          comment: p.comment,
          staff: p.staff.name,
        })),
    }
  })

  return NextResponse.json({ floors, residents: result })
}
