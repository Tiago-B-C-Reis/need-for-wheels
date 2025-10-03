"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

type SubmitResult = {
  id: string
  resultImage: string
}

export default function TryPage() {
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [carFiles, setCarFiles] = useState<FileList | null>(null)
  const [wheelFile, setWheelFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!carFiles || carFiles.length === 0) {
      setError("Please upload at least one car photo")
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("brand", brand)
      fd.append("model", model)
      fd.append("year", year)
      const limit = Math.min(3, carFiles.length)
      for (let i = 0; i < limit; i++) {
        fd.append("carPhotos", carFiles.item(i) as File)
      }
      if (wheelFile) fd.append("wheelPhoto", wheelFile)

      const res = await fetch("/api/experiments", { method: "POST", body: fd })
      if (!res.ok) throw new Error(await res.text())
      const data: SubmitResult = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err?.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Try it</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
          >
            Home
          </Link>
          <Link href="/gallery" className="underline underline-offset-4">Gallery</Link>
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="block text-sm">Brand</span>
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={brand} onChange={e=>setBrand(e.target.value)} required />
          </label>
          <label className="block">
            <span className="block text-sm">Model</span>
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={model} onChange={e=>setModel(e.target.value)} required />
          </label>
          <label className="block">
            <span className="block text-sm">Year</span>
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={year} onChange={e=>setYear(e.target.value)} required />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="block text-sm">Car photos (up to 3)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e=>setCarFiles(e.target.files)}
              className="mt-1 w-full"
            />
          </label>
        </div>
        <div>
          <label className="block">
            <span className="block text-sm">Wheel photo (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={e=>setWheelFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {loading ? "Generating..." : "Send"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {result && (
        <div className="mt-8">
          <h2 className="mb-2 text-xl font-semibold">Your generated image</h2>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image src={result.resultImage} alt="result" fill className="object-contain bg-white" />
          </div>
        </div>
      )}
    </main>
  )
}
