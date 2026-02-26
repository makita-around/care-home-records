import { PrismaClient } from './app/generated/prisma/client.js'
const prisma = new PrismaClient()
const today = new Date().toISOString().slice(0,10)
console.log('UTC today:', today)
console.log('JST now:', new Date().toLocaleString('ja-JP', {timeZone:'Asia/Tokyo'}))
const meds = await prisma.medicationRecord.findMany({ orderBy:{recordedAt:'desc'}, take:10 })
for(const m of meds) {
  console.log('med id:', m.id, 'residentId:', m.residentId, 'recordedAt(UTC):', m.recordedAt.toISOString(), 'bedtime:', m.bedtime, 'eyeDrop:', m.eyeDrop, 'afterBreakfast:', m.afterBreakfast)
}
await prisma.$disconnect()
