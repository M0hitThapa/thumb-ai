"use client"

import { LoginForm } from "@/components/auth/login-form"
import { AppLogo } from "@/components/icons/logos"

import { IconLayoutRows } from "@tabler/icons-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div
        className="absolute inset-0 z-0 [background-image:linear-gradient(to_right,rgba(231,229,228,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(231,229,228,0.6)_1px,transparent_1px)] [background-size:20px_20px] dark:[background-image:linear-gradient(to_right,rgba(120,113,108,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,113,108,0.25)_1px,transparent_1px)]"
        style={{
          maskImage: `
        repeating-linear-gradient(
          to right,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        repeating-linear-gradient(
          to bottom,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
      `,
          WebkitMaskImage: `
        repeating-linear-gradient(
          to right,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        repeating-linear-gradient(
          to bottom,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)
      `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />
      <div className="absolute flex w-full max-w-sm flex-col gap-6">
        <Link
          href="#"
          className="flex items-center gap-2 self-center font-medium"
        >
          <AppLogo />
          <div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              Hookify
            </span>
          </div>
        </Link>
        <LoginForm />
      </div>
    </div>
  )
}
