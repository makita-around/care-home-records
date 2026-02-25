export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { performBackup, shouldRunBackupOnStartup } = await import('./lib/backup')

    // 起動時チェック：前回バックアップから24時間以上経過していれば実行
    const shouldBackup = await shouldRunBackupOnStartup()
    if (shouldBackup) {
      await performBackup()
    }

    // 毎日0時に自動バックアップ
    const cron = await import('node-cron')
    cron.default.schedule('0 0 * * *', async () => {
      await performBackup()
    })
  }
}
