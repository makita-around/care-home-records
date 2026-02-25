import { PrismaClient } from '@/app/generated/prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasourceUrl: 'file:C:/Users/user/claude_projects/care-home-records/prisma/dev.db',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
