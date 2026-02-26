import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, 'prisma/dev.db'))

const now = new Date()
console.log('JST now:', now.toLocaleString('ja-JP', {timeZone:'Asia/Tokyo'}))
console.log('UTC now:', now.toISOString())
console.log()

const rows = db.prepare('SELECT id, residentId, recordedAt, beforeBreakfast, afterBreakfast, beforeLunch, afterLunch, beforeDinner, afterDinner, bedtime, eyeDrop FROM MedicationRecord ORDER BY recordedAt DESC LIMIT 10').all()
console.log('MedicationRecord (latest 10):')
for (const r of rows) {
  console.log(r)
}
db.close()
