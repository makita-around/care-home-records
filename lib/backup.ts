import fs from 'fs'
import path from 'path'
import { prisma } from './prisma'

export async function performBackup(): Promise<{ ok: boolean; message: string }> {
  const setting = await prisma.setting.findUnique({ where: { key: 'backupPath' } })
  const backupPath = setting?.value?.trim().replace(/^["']+|["']+$/g, '')

  if (!backupPath) {
    return { ok: false, message: 'バックアップ先が設定されていません' }
  }

  if (!fs.existsSync(backupPath)) {
    return { ok: false, message: 'バックアップ先フォルダが見つかりません' }
  }

  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
  if (!fs.existsSync(dbPath)) {
    return { ok: false, message: 'データベースファイルが見つかりません' }
  }

  const destPath = path.join(backupPath, '生活記録_backup.db')

  try {
    fs.copyFileSync(dbPath, destPath)

    const now = new Date().toISOString()
    await prisma.setting.upsert({
      where: { key: 'lastBackupAt' },
      update: { value: now },
      create: { key: 'lastBackupAt', value: now },
    })

    return { ok: true, message: 'バックアップが完了しました' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, message: `バックアップに失敗しました: ${msg}` }
  }
}

export async function shouldRunBackupOnStartup(): Promise<boolean> {
  const setting = await prisma.setting.findUnique({ where: { key: 'lastBackupAt' } })
  if (!setting?.value) return true

  const lastBackup = new Date(setting.value)
  const now = new Date()
  const diffHours = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60)
  return diffHours >= 24
}
