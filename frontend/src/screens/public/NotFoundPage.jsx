'use client'

import { Home } from 'lucide-react'
import { Link } from '@/lib/react-router-dom-shim'

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-86px)] items-center justify-center overflow-hidden bg-[#f3fbf6] px-5 py-16 text-[#073c2d]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            linear-gradient(rgba(22, 101, 52, 0.075) 1px, transparent 1px),
            linear-gradient(90deg, rgba(22, 101, 52, 0.075) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      <section className="relative flex flex-col items-center text-center">
        <p className="m-0 font-sans text-[clamp(7rem,22vw,13rem)] font-black leading-none tracking-[-0.08em] text-[#073c2d]">
          404
        </p>

        <h1 className="mt-4 font-sans text-xl font-extrabold uppercase tracking-[0.3em] text-[#073c2d] sm:text-2xl">
          Not Found
        </h1>

        <Link
          to="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#126b3a] px-7 text-sm font-bold !text-white no-underline transition-colors hover:bg-[#0d572f] focus:outline-none focus:ring-4 focus:ring-emerald-700/20"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
      </section>
    </main>
  )
}