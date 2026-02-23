import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execAsync = promisify(exec)

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]

export async function POST(req: Request) {
  const { html } = await req.json()
  const tmpHtml = join(tmpdir(), `pdf_${Date.now()}.html`)
  const tmpPdf = join(tmpdir(), `pdf_${Date.now()}.pdf`)

  try {
    await writeFile(tmpHtml, html, 'utf-8')

    let chromePath = ''
    for (const p of CHROME_PATHS) {
      try {
        await execAsync(`"${p}" --version`)
        chromePath = p
        break
      } catch {
        // not found, try next
      }
    }

    if (!chromePath) {
      return NextResponse.json({ error: 'Chrome/Edge not found' }, { status: 500 })
    }

    const htmlUrl = `file:///${tmpHtml.replace(/\\/g, '/')}`
    await execAsync(
      `"${chromePath}" --headless=new --disable-gpu --no-sandbox --print-to-pdf="${tmpPdf}" "${htmlUrl}"`,
      { timeout: 30000 }
    )

    const pdfBuffer = await readFile(tmpPdf)
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="output.pdf"',
      },
    })
  } finally {
    try { await unlink(tmpHtml) } catch { /* ignore */ }
    try { await unlink(tmpPdf) } catch { /* ignore */ }
  }
}
