# Need for Wheels – Frontend

This is a Next.js (App Router) + TypeScript + Tailwind CSS app scaffolded for the "need for wheels" project. Backend calls are mocked. Uploads are saved locally under `public/experiments/<UID>`.

## Tech Stack
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- next-themes (for dark mode)
- shadcn-compatible structure (components under `components/ui`)

## Quick Start
1. Install dependencies:
   - `cd frontend`
   - `pnpm install` or `npm install` or `yarn`
2. Run the dev server:
   - `pnpm dev` or `npm run dev` or `yarn dev`
3. Open http://localhost:3000

## Project Structure
- `app/` – App Router pages (`/`, `/try`, `/gallery`, API route)
- `components/ui/` – UI building blocks (shadcn-style). Includes `particles.tsx`.
- `components/` – App-level components (e.g. theme provider)
- `lib/` – Utilities (e.g. `cn` helper)
- `public/experiments/` – Local storage for uploaded images (grouped by UID)
- `app/api/experiments/route.ts` – Handles uploads and returns a mocked result

## Components and Styles Paths
- Components default path: `components/ui` (shadcn convention). This keeps reusable UI primitives in a predictable place and makes shadcn CLI drops consistent.
- Global styles: `app/globals.css` (Tailwind base, components, utilities are registered here).

If your project uses a different components path, create `components/ui` to align with shadcn’s conventions; many generators and examples assume this path.

## shadcn UI Setup (optional)
You can use the shadcn UI CLI to add more components later:

```bash
# inside frontend/
pnpm dlx shadcn@latest init
# or: npx shadcn@latest init
```

During init, set the components path to `components/ui`.
Then add components as needed, e.g.:

```bash
pnpm dlx shadcn@latest add button card input
```

## Tailwind Setup
Tailwind is preconfigured:
- `tailwind.config.ts` includes `app/**`, `components/**`, `pages/**` globs
- `postcss.config.js` enables Tailwind and Autoprefixer
- `app/globals.css` registers Tailwind layers

If you’re setting up from scratch, run:
```bash
pnpm i -D tailwindcss postcss autoprefixer
pnpx tailwindcss init -p
```
Then configure `tailwind.config.*` and import `globals.css` in `app/layout.tsx`.

## Particles Component
- Files copied to `components/ui/particles.tsx` and `components/ui/demo.tsx`
- Depends on `@/lib/utils` for `cn` helper and `next-themes` for color switching
- Use in pages as a background or demo block

## Pages
- `/` – Landing page with Particles background and a “Try it now!” CTA. Top-right link to Gallery.
- `/try` – Upload up to 3 car photos + optional wheel photo, add brand/model/year; submits to API. Mock response displays the first uploaded car image as the “generated” result.
- `/gallery` – Lists previous experiments by reading `public/experiments`. If empty, shows a “Try it out” button.

## API (Mocked Backend)
- `POST /api/experiments`
  - Accepts `multipart/form-data` with fields:
    - `brand`, `model`, `year`
    - `carPhotos` (up to 3 files)
    - `wheelPhoto` (optional single file)
  - Saves files to `public/experiments/<UID>/` and returns JSON `{ id, resultImage }` where `resultImage` is the first car photo URL.

## Notes
- Images are stored locally under `public/experiments/` so they are served statically and appear in the Gallery.
- No real image generation is happening yet; it’s mocked to return the first car image.
- Ensure Node 18+ for `Request.formData()` file support in route handlers.

## Assets and Icons
- If components require icons, use `lucide-react` (installed). Example:
  ```tsx
  import { Camera } from "lucide-react"
  ```
- Stock images are not required by the current components; you can add Unsplash images to `public/` if you want demo content.

