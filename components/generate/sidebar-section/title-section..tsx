"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useGenerateStore } from "@/lib/store/generate-store"
import { useImagesStore } from "@/lib/store/image-store"
import { cn } from "@/lib/utils"
import {
  IconLoader2,
  IconWand,
  IconCopy,
  IconX,
  IconCheck,
  IconSquareRoundedPlus,
} from "@tabler/icons-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { toast } from "sonner"

const MAX_IMAGE_BYTES = 15 * 1024 * 1024

export async function readImageFiles(file: File): Promise<{
  base64: string
  mimeType: string
  preview: string
} | null> {
  if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES)
    return null

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const base64 = dataUrl.split(",")[1]
      if (!base64) return resolve(null)
      resolve({ base64, mimeType: file.type, preview: dataUrl })
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

export function TitleSection() {
  const title = useGenerateStore((s) => s.title)
  const setTitle = useGenerateStore((s) => s.setTitle)

  const uploadedImage = useImagesStore((s) => s.uploadedImages)
  const addImages = useImagesStore((s) => s.addImages)
  const removeImage = useImagesStore((s) => s.removeImage)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [titleVariants, setTitleVariants] = useState<string[]>([])
  const [titleVariantsLoading, setTitleVariantsLoading] = useState(false)
  const [titleVariantsError, setTitleVariantsError] = useState("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const MAX_IMAGES_COUNT = 6
  const canAddImages = uploadedImage.length < MAX_IMAGES_COUNT

  async function handlePickFiles(files: FileList) {
    const remaining = MAX_IMAGES_COUNT - uploadedImage.length

    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES_COUNT} images`)
      return
    }

    const slice = Array.from(files).slice(0, remaining)

    const added: {
      base64: string
      mimeType: string
      preview: string
      category: "unknown"
    }[] = []

    for (const file of slice) {
      const row = await readImageFiles(file)

      if (!row) {
        toast.error(`${file.name} is too large or not an image`)
        continue
      }

      added.push({ ...row, category: "unknown" })
    }

    if (added.length) addImages(added)
  }

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

      const data = await res.json()

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

  function handleCopy(text: string, index: number) {
    void navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1000)
  }

  return (
    <div className="space-y-2 px-1">
      <Label className="text-md font-semibold text-neutral-600 dark:text-neutral-400">
        Title <span className="text-red-500">*</span>
      </Label>

      <div className={cn("relative")}>
        <Textarea
          className="e squircle min-h-30 border-none bg-white pt-2 pb-28 shadow-sm shadow-neutral-300 dark:bg-neutral-800 dark:shadow-neutral-950"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value.slice(0, 100))
            setTitleVariants([])
            setTitleVariantsError("")
          }}
        />

        {uploadedImage.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 flex gap-2 overflow-x-auto px-3">
            {uploadedImage.map((img, i) => (
              <div
                key={`${i}-${img.preview.slice(0, 20)}`}
                className="group pointer-events-auto relative size-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-muted dark:border-neutral-600"
              >
                <Image
                  src={img.preview}
                  alt=""
                  className="size-full object-cover"
                  width={100}
                  height={100}
                />

                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-background/90 opacity-0 transition group-hover:opacity-100 hover:bg-red-500"
                >
                  <IconX className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-between px-2">
          <div className="pointer-events-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canAddImages}
              onClick={() => fileInputRef.current?.click()}
              className="size-10 cursor-pointer rounded-xl"
            >
              <IconSquareRoundedPlus className="size-6 text-neutral-600 dark:text-neutral-400" />
            </Button>
          </div>

          <div className="pointer-events-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!title.trim() || titleVariantsLoading}
              onClick={() => void handleGenerateTitleVariants()}
              className="squircle h-8 gap-1.5 rounded-md text-[12px] font-semibold"
            >
              {titleVariantsLoading ? (
                <IconLoader2 className="h-3 w-3 animate-spin" />
              ) : (
                <IconWand className="h-3 w-3" />
              )}
              {titleVariantsLoading ? "Generating…" : "Title ideas"}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handlePickFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {titleVariantsError && (
        <p className="text-xs text-red-500">{titleVariantsError}</p>
      )}

      {titleVariants.length > 0 && (
        <div className="rounded-md border bg-muted/40">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase">
            Title Ideas
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setTitleVariants([])}
            >
              <IconX className="h-3 w-3" />
            </Button>
          </div>

          <ScrollArea>
            {titleVariants.map((v, i) => (
              <div
                key={i}
                className="flex items-center gap-2 border-t px-3 py-2 text-xs hover:bg-muted/60"
              >
                <button
                  className="flex flex-1 text-left"
                  onClick={() => setTitle(v)}
                >
                  <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                  {v}
                </button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => handleCopy(v, i)}
                >
                  {copiedIndex === i ? (
                    <IconCheck className="h-3 w-3 text-green-500" />
                  ) : (
                    <IconCopy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
