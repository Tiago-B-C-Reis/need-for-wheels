import Link from "next/link"
import { Particles } from "@/components/ui/particles"
import { Camera, ShieldCheck, History } from "lucide-react"

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Particles className="absolute inset-0" quantity={120} ease={70} color="#888" />
      <header className="flex items-center justify-between px-6 py-4 relative z-10">
        <h1 className="text-xl font-semibold">Need for Wheels</h1>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/gallery" className="underline underline-offset-4">Gallery</Link>
          <Link
            href="/auth"
            className="rounded-full border border-current px-4 py-1 transition hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
          >
            Login / Sign up
          </Link>
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
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Camera className="mt-1 size-5" />
            <div>
              <div className="font-medium">Fast preview</div>
              <div className="text-sm opacity-80">Mocked results for instant feedback.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <History className="mt-1 size-5" />
            <div>
              <div className="font-medium">Local gallery</div>
              <div className="text-sm opacity-80">Keep runs saved on your device.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <ShieldCheck className="mt-1 size-5" />
            <div>
              <div className="font-medium">Private</div>
              <div className="text-sm opacity-80">Images stored locally, not uploaded.</div>
            </div>
          </div>
        </div>

      </section>
    </main>
  )
}
