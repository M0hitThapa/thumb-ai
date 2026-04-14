"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useGenerateStore } from "@/lib/store/generate-store"
import { cn } from "@/lib/utils"
import {
  IconLoader2,
  IconWand,
  IconCopy,
  IconX,
  IconCheck,
  IconCircleCheck,
} from "@tabler/icons-react"
import { useState } from "react"

export function TitleSection() {
  const title = useGenerateStore((s) => s.title)
  const setTitle = useGenerateStore((s) => s.setTitle)

  const [titleVariants, setTitleVariants] = useState<string[]>([])
  const [titleVariantsLoading, setTitleVariantsLoading] = useState(false)
  const [titleVariantsError, setTitleVariantsError] = useState("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

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
  function GlowLine({ position }: { position: "top" | "bottom" }) {
    const posClass = position === "top" ? "-top-px" : "-bottom-px"
    return (
      <>
        <span
          className={`absolute inset-x-0 ${posClass} block h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-100`}
        />
        <span
          className={`absolute -inset-x-4 ${posClass} mx-auto block h-px w-[calc(100%+2rem)] bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-80 blur-sm`}
        />
      </>
    )
  }
  function handleCopy(text: string, index: number) {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)

    setTimeout(() => {
      setCopiedIndex(null)
    }, 1000)
  }

  return (
    <div className="space-y-2 px-1">
      <Label
        htmlFor="title"
        className="text-md font-semibold tracking-tight text-neutral-600 dark:text-neutral-400"
      >
        Title <span className="text-red-500">*</span>
      </Label>

      <div className="relative">
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

        {/* Glow Lines */}
        <GlowLine position="top" />
        <GlowLine position="bottom" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title.length}/500</p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 gap-1.5 rounded-sm px-2 text-[11px]"
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
        <div className="relative overflow-hidden rounded-sm border border-border bg-muted/40">
          <div className="flex items-center justify-between px-3 py-3">
            <p className="text-[10px] font-semibold tracking-wide text-neutral-700 uppercase dark:text-neutral-300">
              Title Ideas — click to use
            </p>

            {/* Close Button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 cursor-pointer"
              onClick={() => setTitleVariants([])}
            >
              <IconX className="h-3 w-3" />
            </Button>
          </div>

          <ScrollArea>
            <div>
              {titleVariants.map((v, i) => {
                const isActive = title === v

                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 border-t border-border px-3 py-2",
                      isActive ? "bg-primary/10" : "hover:bg-muted/60"
                    )}
                  >
                    <button
                      onClick={() => setTitle(v)}
                      className="flex flex-1 cursor-pointer items-center gap-2 text-left text-xs"
                    >
                      {isActive ? (
                        <IconCircleCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                      ) : (
                        <span className="w-3.5" />
                      )}

                      <span className="font-mono text-[13px] text-muted-foreground">
                        {i + 1}.
                      </span>

                      <span className="flex-1">{v}</span>
                    </button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleCopy(v, i)}
                    >
                      {copiedIndex === i ? (
                        <IconCheck className="h-3 w-3 text-green-500" />
                      ) : (
                        <IconCopy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  )
}
