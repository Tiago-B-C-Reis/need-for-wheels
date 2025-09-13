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

    // Mocked generation: copy first car photo path as the result
    const firstName = await pickFirstImage(baseDir)
    const resultImage = `/experiments/${id}/${firstName}`

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

