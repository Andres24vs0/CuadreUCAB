import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { filename, data } = body as { filename?: string; data?: string }
    if (!data) return NextResponse.json({ error: 'No data provided' }, { status: 400 })

    // data can be a data URL: data:<mime>;base64,<base64>
    let base64 = data
    let ext = 'png'
    if (data.startsWith('data:')) {
      const m = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/)
      if (m) {
        const mime = m[1]
        base64 = m[2]
        ext = mime.split('/')[1].split('+')[0]
      } else {
        // fallback: try to split on comma
        const parts = data.split(',')
        base64 = parts[1] || parts[0]
      }
    }

    const name = filename ? `${Date.now()}-${path.basename(filename)}` : `${Date.now()}.${ext}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    const filePath = path.join(uploadsDir, name)
    const buffer = Buffer.from(base64, 'base64')
    fs.writeFileSync(filePath, buffer)

    return NextResponse.json({ url: `/uploads/${name}`, filename: name })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
