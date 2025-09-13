import Link from "next/link"
import Image from "next/image"
import { Particles } from "@/components/ui/particles"
import { Camera, ShieldCheck, History } from "lucide-react"

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

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60" alt="Car 1" fill className="object-cover" />
          </div>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8" alt="Car 2" fill className="object-cover" />
          </div>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image src="https://images.unsplash.com/photo-1461632830798-3adb3034e4f6" alt="Car 3" fill className="object-cover" />
          </div>
        </div>
      </section>
    </main>
  )
}
