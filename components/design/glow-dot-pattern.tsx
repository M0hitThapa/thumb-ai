"use client"

import { cn } from "@/lib/utils"
import { DotPattern } from "../dot-pattern"
export function DotPatternWithGlowEffect() {
  return (
    <div className="relative flex h-125 w-full flex-col items-center justify-center overflow-hidden">
      <DotPattern
        glow={true}
        className={cn(
          "mask-[radial-gradient(400px_circle_at_center,white,transparent)]"
        )}
      />
    </div>
  )
}
