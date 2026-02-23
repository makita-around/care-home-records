import pkg from '@prisma/client'
const { PrismaClient } = pkg

const prisma = new PrismaClient()

async function main() {
  // Settings
  await prisma.setting.upsert({
    where: { key: 'facilityName' },
    update: {},
    create: { key: 'facilityName', value: '介護施設' },
  })

  // Staff
  const staffData = [
    { name: '山田 太郎', nameKana: 'やまだ たろう' },
    { name: '鈴木 花子', nameKana: 'すずき はなこ' },
    { name: '佐藤 次郎', nameKana: 'さとう じろう' },
    { name: '田中 美咲', nameKana: 'たなか みさき' },
    { name: '高橋 一郎', nameKana: 'たかはし いちろう' },
  ]
  for (const s of staffData) {
    await prisma.staff.upsert({
      where: { id: staffData.indexOf(s) + 1 },
      update: {},
      create: s,
    })
  }

  // Residents
  const residents = [
    { name: '青山 幸子', nameKana: 'あおやま さちこ', roomNumber: '101', floor: '1F', gender: '女', birthDate: new Date('1935-04-12'), careLevel: '要介護3' },
    { name: '伊藤 健一', nameKana: 'いとう けんいち', roomNumber: '102', floor: '1F', gender: '男', birthDate: new Date('1940-07-23'), careLevel: '要介護2' },
    { name: '上田 和子', nameKana: 'うえだ かずこ', roomNumber: '103', floor: '1F', gender: '女', birthDate: new Date('1938-11-05'), careLevel: '要介護4' },
    { name: '江川 正雄', nameKana: 'えがわ まさお', roomNumber: '104', floor: '1F', gender: '男', birthDate: new Date('1932-02-18'), careLevel: '要介護5' },
    { name: '岡本 ふみ', nameKana: 'おかもと ふみ', roomNumber: '201', floor: '2F', gender: '女', birthDate: new Date('1942-09-30'), careLevel: '要介護1' },
    { name: '川口 清', nameKana: 'かわぐち きよし', roomNumber: '202', floor: '2F', gender: '男', birthDate: new Date('1937-06-14'), careLevel: '要介護3' },
    { name: '木村 千代', nameKana: 'きむら ちよ', roomNumber: '203', floor: '2F', gender: '女', birthDate: new Date('1945-01-28'), careLevel: '要介護2' },
    { name: '黒田 茂', nameKana: 'くろだ しげる', roomNumber: '204', floor: '2F', gender: '男', birthDate: new Date('1933-08-09'), careLevel: '要介護4' },
  ]
  for (const r of residents) {
    await prisma.resident.upsert({
      where: { id: residents.indexOf(r) + 1 },
      update: {},
      create: r,
    })
  }

  // MedicationConfig for each resident (default: afterBreakfast, afterLunch, afterDinner)
  for (let i = 1; i <= residents.length; i++) {
    await prisma.medicationConfig.upsert({
      where: { residentId: i },
      update: {},
      create: { residentId: i },
    })
  }

  console.log('Seed completed!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
