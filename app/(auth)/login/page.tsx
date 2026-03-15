"use client"

import { LoginForm } from "@/components/auth/login-form"
import { DotPatternWithGlowEffect } from "@/components/design/glow-dot-pattern"
import { IconLayoutRows } from "@tabler/icons-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
       <DotPatternWithGlowEffect />
      <div className="flex w-full max-w-sm flex-col gap-6 absolute">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <IconLayoutRows className="size-4" />
          </div>
          Acme Inc.
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
