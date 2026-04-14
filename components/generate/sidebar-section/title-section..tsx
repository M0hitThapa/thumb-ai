"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useGenerateStore } from "@/lib/store/generate-store"
import { cn } from "@/lib/utils"
import { IconLoader2, IconWand } from "@tabler/icons-react"
import { useState } from "react"

export function TitleSection() {
  const title = useGenerateStore((s) => s.title)
  const setTitle = useGenerateStore((s) => s.setTitle)

  const [titleVariants, setTitleVariants] = useState<string[]>([])
  const [titleVariantsLoading, setTitleVariantsLoading] = useState(false)
  const [titleVariantsError, setTitleVariantsError] = useState("")

  async function handleGenerateTitleVariants() {
    if (!title.trim() || titleVariantsLoading) return
    setTitleVariantsLoading(true)
    setTitleVariantsError("")
    setTitleVariants([])
    try {
      const res = await fetch("/api/generate/title-variant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      })
      const data = (await res.json()) as { variants?: string[]; error?: string }
      if (!res.ok || !data.variants) {
        setTitleVariantsError(data.error ?? "Could not generate variants.")
        return
      }
      setTitleVariants(data.variants)
    } catch {
      setTitleVariantsError("Network error.")
    } finally {
      setTitleVariantsLoading(false)
    }
  }
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
        className="min-h-20 rounded-sm"
        placeholder="e.g. I quit my $200k job to become a full-time YouTuber"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value.slice(0, 500))
          setTitleVariants([])
          setTitleVariantsError("")
        }}
      />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title.length}/500</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 gap-1.5 px-2 text-[11px]"
          disabled={!title.trim() || titleVariantsLoading}
          onClick={() => void handleGenerateTitleVariants()}
        >
          {titleVariantsLoading ? (
            <IconLoader2 className="h-3 w-3 animate-spin" />
          ) : (
            <IconWand className="h-3 w-3" />
          )}
          {titleVariantsLoading ? "Generating…" : "Title ideas"}
        </Button>
      </div>
      {titleVariantsError ? (
        <p className="text-[11px] text-destructive">{titleVariantsError}</p>
      ) : null}
      {titleVariants.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            5 Title Ideas — click to use
          </p>
          <ScrollArea className="h-[min(200px,40vh)]">
            <div className="pr-2">
              {titleVariants.map((v, i) => {
                const isActive = title === v
                return (
                  <Button
                    key={i}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTitle(v)
                      setTitleVariants([])
                    }}
                    className={cn(
                      "h-auto w-full justify-start rounded-none border-t border-border px-3 py-2 text-left text-xs font-normal",
                      isActive
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="mr-2 font-mono text-[10px] text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span className="flex-1 text-left leading-relaxed">
                      {v}
                    </span>
                    {isActive ? <span className="text-primary">✓</span> : null}
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  )
}
