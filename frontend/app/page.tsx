import Link from "next/link"
import { Particles } from "@/components/ui/particles"

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Particles className="absolute inset-0" quantity={120} ease={70} color="#888" />
      <header className="flex items-center justify-between px-6 py-4 relative z-10">
        <h1 className="text-xl font-semibold">Need for Wheels</h1>
        <nav>
          <Link href="/gallery" className="underline underline-offset-4">Gallery</Link>
        </nav>
      </header>
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-5xl font-bold tracking-tight">Try new wheels on your car</h2>
        <p className="mt-4 text-lg opacity-80">
          Upload your car photos and visualize fresh wheel designs. No sign-up needed.
        </p>
        <div className="mt-8">
          <Link
            href="/try"
            className="inline-block rounded-md bg-black px-6 py-3 text-white dark:bg-white dark:text-black"
          >
            Try it now!
          </Link>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            Fast preview with mock results.
          </div>
          <div className="rounded-lg border p-4">
            Keep runs locally in your gallery.
          </div>
          <div className="rounded-lg border p-4">
            Private: images stored on your machine.
          </div>
        </div>
      </section>
    </main>
  )
}

