"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useGenerateStore } from "@/lib/store/generate-store"

export function TitleSection() {
  const title = useGenerateStore((s) => s.title)
  const setTitle = useGenerateStore((s) => s.setTitle)

  return (
    <div className="space-y-2 px-1">
      <Label
        htmlFor="title"
        className="text-md font-semibold tracking-tight text-neutral-600 dark:text-neutral-400"
      >
        Title <span className="text-red-500">*</span>
      </Label>
      <Textarea
        id="title"
        className="min-h-[80px] rounded-sm"
        placeholder="e.g. I quit my $200k job to become a full-time YouTuber"
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 500))}
      />
    </div>
  )
}
