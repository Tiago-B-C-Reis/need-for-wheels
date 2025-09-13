import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import crypto from "crypto"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const brand = String(form.get("brand") ?? "")
    const model = String(form.get("model") ?? "")
    const year = String(form.get("year") ?? "")
    const carPhotos = form.getAll("carPhotos").filter(Boolean) as File[]
    const wheelPhoto = form.get("wheelPhoto") as File | null

    if (carPhotos.length === 0) {
      return new NextResponse("No car photos provided", { status: 400 })
    }

    const id = crypto.randomUUID()
    const baseDir = path.join(process.cwd(), "public", "experiments", id)
    await fs.mkdir(baseDir, { recursive: true })

    // Save metadata for later display if desired
    const meta = { id, brand, model, year, createdAt: new Date().toISOString() }
    await fs.writeFile(path.join(baseDir, "meta.json"), JSON.stringify(meta, null, 2))

    // Fire-and-forget: send metadata to backend if available
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
    fetch(`${backendUrl}/api/v1/experiments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id,
        brand,
        model,
        year,
        created_at: meta.createdAt,
      }),
    }).catch(() => {})

    const limit = Math.min(3, carPhotos.length)
    for (let i = 0; i < limit; i++) {
      const f = carPhotos[i]
      const buf = Buffer.from(await f.arrayBuffer())
      const ext = inferExt(f.type) || ".jpg"
      await fs.writeFile(path.join(baseDir, `car-${i + 1}${ext}`), buf)
    }
    if (wheelPhoto) {
      const buf = Buffer.from(await wheelPhoto.arrayBuffer())
      const ext = inferExt(wheelPhoto.type) || ".jpg"
      await fs.writeFile(path.join(baseDir, `wheel${ext}`), buf)
    }

    // Attempt real generation via backend
    const formOut = new FormData()
    formOut.append("brand", brand)
    formOut.append("model", model)
    formOut.append("year", year)
    for (let i = 0; i < limit; i++) {
      const f = carPhotos[i]
      formOut.append("car_photos", f, (f as any).name || `car-${i+1}`)
    }
    if (wheelPhoto) formOut.append("wheel_photo", wheelPhoto, (wheelPhoto as any).name || "wheel")
    const genRes = await fetch(`${backendUrl}/api/v1/experiments/generate`, {
      method: "POST",
      body: formOut,
    })
    if (!genRes.ok) {
      const msg = await genRes.text()
      return new NextResponse(`Generation failed: ${msg}`, { status: 502 })
    }
    const arrayBuf = await genRes.arrayBuffer()
    const outBuf = Buffer.from(arrayBuf)
    const resultFile = "result.png"
    await fs.writeFile(path.join(baseDir, resultFile), outBuf)
    const resultImage = `/experiments/${id}/${resultFile}`

    return NextResponse.json({ id, resultImage })
  } catch (e: any) {
    return new NextResponse(e?.message || "Server error", { status: 500 })
  }
}

function inferExt(mime: string | undefined) {
  if (!mime) return null
  if (mime.includes("png")) return ".png"
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg"
  if (mime.includes("webp")) return ".webp"
  return null
}

async function pickFirstImage(dir: string) {
  const files = await fs.readdir(dir)
  const candidate = files.find((f) => f.startsWith("car-")) || files[0]
  return candidate
}
