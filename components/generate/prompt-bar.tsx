"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { NoiseBackground } from "@/components/noise-background"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTitleAndUploadsStore } from "@/components/generate/sidebar-section/title-section"
import { useThumbnailColorStore } from "@/components/generate/sidebar-section/color-section"
import { IMAGE_COLOR_PALETTES } from "@/lib/thumbnail-ui-constants"
import { CATEGORY_LABELS } from "@/lib/category-labels"
import {
  IconArrowUp,
  IconPalette,
  IconPaperclip,
  IconSparkles,
  IconLoader2,
  IconX,
  IconColorFilter,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface PromptBarProps {
  isGenerating: boolean
  onGenerate: () => void
}

const MAX_TITLE_LEN = 500

export function PromptBar({ isGenerating, onGenerate }: PromptBarProps) {
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

  const colorMode = useThumbnailColorStore((s) => s.colorMode)
  const selectedPalette = useThumbnailColorStore((s) => s.selectedPalette)
  const setColorMode = useThumbnailColorStore((s) => s.setColorMode)
  const setSelectedPalette = useThumbnailColorStore((s) => s.setSelectedPalette)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasPersonPhoto = hasUploadedPersonImage()
  const canAddImages = uploadedImages.length < 6

  const [colorDropdownOpen, setColorDropdownOpen] = useState(false)

  useEffect(() => {
    if (hasPersonPhoto && useAiPerson) setUseAiPerson(false)
  }, [hasPersonPhoto, useAiPerson, setUseAiPerson])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [title])

  const activePalette = IMAGE_COLOR_PALETTES.find(
    (p) => p.name === selectedPalette
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (title.trim() && !isGenerating) {
        onGenerate()
      }
    }
  }

  async function handlePickFiles(files: FileList) {
    const remaining = 6 - uploadedImages.length
    if (remaining <= 0) return

    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024)
        continue

      const row = await new Promise<{
        base64: string
        mimeType: string
        preview: string
      } | null>((resolve) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string
          const base64 = dataUrl.split(",")[1]
          if (!base64) return resolve(null)
          resolve({ base64, mimeType: file.type, preview: dataUrl })
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      })
      if (!row) continue

      const newIndex = addImages([{ ...row, classifying: true }])

      void (async () => {
        try {
          const res = await fetch("/api/classify-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64: row.base64,
              mimeType: row.mimeType,
            }),
          })
          if (!res.ok) throw new Error("classify failed")
          const data = (await res.json()) as {
            category?: string
            label?: string
            description?: string
            hasFace?: boolean
          }
          const { parseImageCategory } = await import("@/lib/image-category")
          updateImageClassification(newIndex, {
            category: parseImageCategory(data.category),
            label: String(data.label ?? ""),
            description: String(data.description ?? ""),
            hasFace: Boolean(data.hasFace),
            classifying: false,
          })
        } catch {
          updateImageClassification(newIndex, {
            classifying: false,
            category: "unknown",
          })
        }
      })()
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4">
      {uploadedImages.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
          {uploadedImages.map((img, i) => (
            <div
              key={`${i}-${img.preview.slice(0, 20)}`}
              className="group squircle relative size-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-muted dark:border-neutral-600"
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

      <NoiseBackground
        containerClassName="w-full squircle"
        gradientColors={[
          "rgb(255, 41, 0)",
          "rgb(100, 150, 255)",
          "rgb(255, 200, 100)",
        ]}
      >
        <Textarea
          ref={textareaRef}
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LEN))}
          onKeyDown={handleKeyDown}
          placeholder="Describe your thumbnail or paste a YouTube title..."
          className="squircle min-h-30 resize-none border-none bg-white/80 pt-2 pb-20 shadow-sm shadow-neutral-300 backdrop-blur-sm focus-visible:ring-0 focus-visible:outline-none dark:bg-neutral-800/80 dark:shadow-black"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          rows={1}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-between px-2">
          <div className="pointer-events-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent side="top">Attach images</TooltipContent>
            </Tooltip>

            <DropdownMenu
              open={colorDropdownOpen}
              onOpenChange={setColorDropdownOpen}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-10 cursor-pointer rounded-xl"
                      aria-label="Color theme"
                    >
                      {colorMode === "palette" && activePalette ? (
                        <span className="flex gap-0.5">
                          {activePalette.colors.map((c, i) => (
                            <span
                              key={i}
                              className="h-2.5 w-2.5 rounded-full border border-black/10"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </span>
                      ) : (
                        <IconColorFilter className="size-6 text-neutral-500 dark:text-neutral-400" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">Color theme</TooltipContent>
              </Tooltip>

              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  Choose Theme
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setColorMode("auto")}
                  className={cn(
                    "gap-1.5",
                    colorMode === "auto" && "bg-secondary text-foreground"
                  )}
                >
                  <IconSparkles className="h-3.5 w-3.5 shrink-0" />
                  Auto
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {IMAGE_COLOR_PALETTES.map((pal) => {
                  const isSelected =
                    colorMode === "palette" && selectedPalette === pal.name
                  return (
                    <DropdownMenuItem
                      key={pal.name}
                      onClick={() => {
                        setSelectedPalette(pal.name)
                        setColorMode("palette")
                      }}
                      className={cn(
                        "gap-1.5",
                        isSelected && "bg-secondary text-foreground"
                      )}
                    >
                      <span className="flex shrink-0 gap-0.5">
                        {pal.colors.map((c, i) => (
                          <span
                            key={i}
                            className="h-2.5 w-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </span>
                      <span className="truncate">{pal.name}</span>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
              <Switch
                id="ai-avatar-bar"
                checked={useAiPerson}
                disabled={hasPersonPhoto}
                onCheckedChange={setUseAiPerson}
              />
              <Label
                htmlFor="ai-avatar-bar"
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

          <div className="pointer-events-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  disabled={!title.trim() || isGenerating}
                  onClick={onGenerate}
                  className={cn(
                    "squircle size-10 cursor-pointer rounded-xl border-2 border-neutral-300 shadow-none dark:border-neutral-700",
                    title.trim() && !isGenerating
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                  aria-label="Generate thumbnails"
                >
                  {isGenerating ? (
                    <IconLoader2 className="size-5 animate-spin text-white" />
                  ) : (
                    <IconArrowUp className="size-5 text-white" />
                  )}
                </Button>
              </TooltipTrigger>
            </Tooltip>
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
      </NoiseBackground>
    </div>
  )
}
