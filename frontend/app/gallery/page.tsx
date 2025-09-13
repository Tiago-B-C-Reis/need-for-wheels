import fs from "fs"
import { promises as fsp } from "fs"
import path from "path"
import Image from "next/image"
import Link from "next/link"
import { revalidatePath } from "next/cache"

type Experiment = {
  id: string
  thumb: string
  meta?: {
    brand?: string
    model?: string
    year?: string
  }
}

export default async function GalleryPage() {
  const experiments = await listExperiments()
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="rounded-md border px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-900">Home</Link>
          <h1 className="text-2xl font-semibold">Gallery</h1>
        </div>
        <Link href="/try" className="rounded-md bg-black px-3 py-1.5 text-white dark:bg-white dark:text-black">Try it out</Link>
      </div>
      {experiments.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="mb-4">No experiments yet.</p>
          <Link
            href="/try"
            className="inline-block rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
          >
            Try it out
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experiments.map((e) => (
            <div key={e.id} className="overflow-hidden rounded-lg border">
              <div className="relative aspect-video w-full bg-white">
                <Image src={e.thumb} alt={e.id} fill className="object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2 p-3 text-sm">
                <div className="opacity-80">
                  {e.meta?.brand ? (
                    <span>
                      {e.meta.brand} {e.meta.model} {e.meta.year}
                    </span>
                  ) : (
                    <span>Run {e.id}</span>
                  )}
                </div>
                <form action={deleteExperiment}>
                  <input type="hidden" name="id" value={e.id} />
                  <button
                    type="submit"
                    className="rounded-md border px-2 py-1 hover:bg-red-50 hover:text-red-700 dark:hover:bg-zinc-900"
                    aria-label={`Delete experiment ${e.id}`}
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

async function listExperiments(): Promise<Experiment[]> {
  const base = path.join(process.cwd(), "public", "experiments")
  if (!fs.existsSync(base)) return []
  const ids = fs.readdirSync(base).filter((d) => fs.statSync(path.join(base, d)).isDirectory())
  const out: Experiment[] = []
  for (const id of ids) {
    const dir = path.join(base, id)
    let thumb = ""
    const files = fs.readdirSync(dir)
    const image =
      files.find((f) => f === "result.png" || f.startsWith("result")) ||
      files.find((f) => f.startsWith("car-")) ||
      files.find((f) => /\.(png|jpe?g|webp)$/i.test(f))
    if (image) thumb = `/experiments/${id}/${image}`
    let meta: Experiment["meta"] | undefined
    const metaPath = path.join(dir, "meta.json")
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, "utf8"))
      } catch {}
    }
    if (thumb) out.push({ id, thumb, meta })
  }
  return out.sort((a, b) => (a.id < b.id ? 1 : -1))
}

async function deleteExperiment(formData: FormData) {
  "use server"
  const id = String(formData.get("id") || "")
  // basic guard to prevent path traversal
  if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
    return
  }
  const dir = path.join(process.cwd(), "public", "experiments", id)
  try {
    await fsp.rm(dir, { recursive: true, force: true })
  } catch {}
  revalidatePath("/gallery")
}
