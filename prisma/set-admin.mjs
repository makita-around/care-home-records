// 最初の職員を管理者に設定するスクリプト
import pkg from '@prisma/client'
const { PrismaClient } = pkg

const prisma = new PrismaClient()

const staff = await prisma.staff.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } })
console.log('現在の職員:')
staff.forEach(s => console.log(` [${s.id}] ${s.name}  isAdmin=${s.isAdmin}  pin=${s.pin}`))

if (staff.length > 0) {
  const first = staff[0]
  if (!first.isAdmin) {
    await prisma.staff.update({ where: { id: first.id }, data: { isAdmin: true } })
    console.log(`\n✅ ${first.name} を管理者に設定しました（PIN不要でログイン可能）`)
  } else {
    console.log(`\n✅ ${first.name} はすでに管理者です`)
  }
}

await prisma.$disconnect()
