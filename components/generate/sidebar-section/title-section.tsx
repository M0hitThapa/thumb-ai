"use client"

import { create } from "zustand"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

import { CATEGORY_LABELS } from "@/lib/category-labels"
import { parseImageCategory } from "@/lib/image-category"
import type { ClassifyImageResult, UploadedImage } from "@/lib/types"
import {
  IconLoader2,
  IconWand,
  IconCopy,
  IconX,
  IconCheck,
  IconPaperclip,
} from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

interface TitleAndUploadsState {
  title: string
  uploadedImages: UploadedImage[]
  useAiPerson: boolean
  setTitle: (v: string) => void
  setUseAiPerson: (v: boolean) => void
  hasUploadedPersonImage: () => boolean
  addImages: (images: UploadedImage[]) => number
  removeImage: (index: number) => void
  updateImageClassification: (
    index: number,
    data: Partial<UploadedImage>
  ) => void
}

export const useTitleAndUploadsStore = create<TitleAndUploadsState>()(
  (set, get) => ({
    title: "",
    uploadedImages: [],
    useAiPerson: false,

    setTitle: (title) => set({ title }),
    setUseAiPerson: (useAiPerson) => set({ useAiPerson }),
    hasUploadedPersonImage: () =>
      get().uploadedImages.some((img) => img.category === "person"),

    addImages: (images) => {
      const start = get().uploadedImages.length
      set((s) => ({ uploadedImages: [...s.uploadedImages, ...images] }))
      return start
    },

    removeImage: (index) =>
      set((s) => ({
        uploadedImages: s.uploadedImages.filter((_, i) => i !== index),
      })),

    updateImageClassification: (index, data) =>
      set((s) => ({
        uploadedImages: s.uploadedImages.map((img, i) =>
          i === index ? { ...img, ...data } : img
        ),
      })),
  })
)

const MAX_TITLE_LEN = 500
const MAX_IMAGES_COUNT = 6
const MAX_IMAGE_BYTES = 15 * 1024 * 1024

async function readImageFiles(file: File): Promise<{
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

async function classifyImage(
  base64: string,
  mimeType: string
): Promise<ClassifyImageResult | null> {
  try {
    const res = await fetch("/api/classify-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, mimeType }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as Partial<{
      category: string
      label: string
      description: string
      hasFace: boolean
    }>
    return {
      category: parseImageCategory(data.category),
      label: String(data.label ?? ""),
      description: String(data.description ?? ""),
      hasFace: Boolean(data.hasFace),
    }
  } catch {
    return null
  }
}

export function TitleSection() {
  const title = useTitleAndUploadsStore((s) => s.title)
  const setTitle = useTitleAndUploadsStore((s) => s.setTitle)

  const uploadedImages = useTitleAndUploadsStore((s) => s.uploadedImages)
  const addImages = useTitleAndUploadsStore((s) => s.addImages)
  const removeImage = useTitleAndUploadsStore((s) => s.removeImage)
  const updateImageClassification = useTitleAndUploadsStore(
    (s) => s.updateImageClassification
  )
  const useAiPerson = useTitleAndUploadsStore((s) => s.useAiPerson)
  const setUseAiPerson = useTitleAndUploadsStore((s) => s.setUseAiPerson)
  const hasUploadedPersonImage = useTitleAndUploadsStore(
    (s) => s.hasUploadedPersonImage
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasPersonPhoto = hasUploadedPersonImage()

  useEffect(() => {
    if (hasPersonPhoto && useAiPerson) setUseAiPerson(false)
  }, [hasPersonPhoto, useAiPerson, setUseAiPerson])

  const [titleVariants, setTitleVariants] = useState<string[]>([])
  const [titleVariantsLoading, setTitleVariantsLoading] = useState(false)
  const [titleVariantsError, setTitleVariantsError] = useState("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const canAddImages = uploadedImages.length < MAX_IMAGES_COUNT

  async function handlePickFiles(files: FileList) {
    const remaining = MAX_IMAGES_COUNT - uploadedImages.length
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES_COUNT} images`)
      return
    }

    for (const file of Array.from(files).slice(0, remaining)) {
      const row = await readImageFiles(file)
      if (!row) {
        toast.error(`${file.name} is too large or not an image`)
        continue
      }

      const newIndex = addImages([{ ...row, classifying: true }])

      void classifyImage(row.base64, row.mimeType).then((result) => {
        if (result) {
          updateImageClassification(newIndex, {
            category: result.category,
            label: result.label,
            description: result.description,
            hasFace: result.hasFace,
            classifying: false,
          })
        } else {
          updateImageClassification(newIndex, {
            classifying: false,
            category: "unknown",
          })
        }
      })
    }
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

      const data = (await res.json()) as {
        variants?: string[]
        error?: string
      }

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
    window.setTimeout(() => setCopiedIndex(null), 1000)
  }

  return (
    <div className="space-y-2 px-1">
      <Label className="text-md font-semibold text-neutral-600 dark:text-neutral-400">
        Title <span className="text-red-500">*</span>
      </Label>

      <div className="relative">
        <Textarea
          className="squircle min-h-30 resize-none border-none bg-white pt-2 pb-32 shadow-sm shadow-neutral-300 dark:bg-neutral-800 dark:shadow-neutral-950"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value.slice(0, MAX_TITLE_LEN))
            setTitleVariants([])
            setTitleVariantsError("")
          }}
        />

        {uploadedImages.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 flex gap-2 overflow-x-auto px-3">
            {uploadedImages.map((img, i) => (
              <div
                key={`${i}-${img.preview.slice(0, 20)}`}
                className="group squircle pointer-events-auto relative size-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-muted dark:border-neutral-600"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt=""
                  className="size-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-background/90 opacity-0 transition group-hover:opacity-100 hover:bg-red-500"
                  aria-label="Remove"
                >
                  <IconX className="size-3" />
                </button>

                <div className="absolute right-0 bottom-0 left-0 px-0.5 py-0.5">
                  {img.classifying ? (
                    <div className="flex items-center justify-center gap-0.5 rounded bg-black/65 py-0.5 text-[8px] text-white">
                      <IconLoader2 className="size-2.5 shrink-0 animate-spin" />
                      <span className="truncate">Analysing…</span>
                    </div>
                  ) : (
                    <div className="truncate rounded bg-black/65 px-0.5 py-0.5 text-center text-[8px] font-semibold text-white">
                      {CATEGORY_LABELS[img.category ?? "unknown"]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-between px-2">
          <div className="pointer-events-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canAddImages}
              onClick={() => fileInputRef.current?.click()}
              className="size-10 cursor-pointer rounded-xl"
              aria-label="Add images"
            >
              <IconPaperclip className="size-6 text-neutral-500 dark:text-neutral-400" />
            </Button>
            <div className="flex max-w-[140px] flex-col gap-0.5 sm:max-w-none">
              <div className="flex items-center gap-2">
                <Switch
                  id="ai-avatar"
                  checked={useAiPerson}
                  disabled={hasPersonPhoto}
                  onCheckedChange={setUseAiPerson}
                />
                <Label
                  htmlFor="ai-avatar"
                  className="cursor-pointer text-sm font-medium text-neutral-600 dark:text-neutral-400"
                >
                  AI person
                </Label>
              </div>
              {hasPersonPhoto ? (
                <p className="pl-1 text-[9px] leading-tight text-muted-foreground">
                  Using your uploaded person photo
                </p>
              ) : null}
            </div>
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

      <p className="text-[11px] text-muted-foreground">
        {title.length}/{MAX_TITLE_LEN}
      </p>

      {titleVariantsError ? (
        <p className="text-xs text-red-500">{titleVariantsError}</p>
      ) : null}

      {titleVariants.length > 0 ? (
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
                  type="button"
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
      ) : null}
    </div>
  )
}
