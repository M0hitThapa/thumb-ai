"use client"

import type { SubmitEvent } from "react"
import { create } from "zustand"
import type { GeneratedVariant, UploadedImage } from "@/lib/types"
import { DEFAULT_COLOR_PALETTE_NAME, IMAGE_COLOR_PALETTES } from "@/lib/thumbnail-ui-constants"
import { toast } from "sonner"

interface ThumbnailColorState {
  colorMode: "auto" | "palette"
  selectedPalette: string
  setColorMode: (v: "auto" | "palette") => void
  setSelectedPalette: (v: string) => void
}

export const useThumbnailColorStore = create<ThumbnailColorState>()((set) => ({
  colorMode: "auto",
  selectedPalette: DEFAULT_COLOR_PALETTE_NAME,
  setColorMode: (colorMode) => set({ colorMode }),
  setSelectedPalette: (selectedPalette) =>
    set({ selectedPalette, colorMode: "palette" }),
}))

export function useGeneratorColorThemeStr(): string {
  const colorMode = useThumbnailColorStore((s) => s.colorMode)
  const selectedPalette = useThumbnailColorStore((s) => s.selectedPalette)
  const palette =
    IMAGE_COLOR_PALETTES.find((p) => p.name === selectedPalette) ??
    IMAGE_COLOR_PALETTES[0]!
  return colorMode === "auto"
    ? ""
    : `3-color palette: primary ${palette.colors[0]}, secondary ${palette.colors[1]}, accent ${palette.colors[2]}`
}

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

const GENERATE_FETCH_TIMEOUT_MS = 315_000

interface ThumbnailGenerateResultsState {
  variants: GeneratedVariant[]
  generating: boolean
  /** How many variants are still being fetched (0–3) */
  pendingCount: number
  setGenerating: (v: boolean) => void
  setPendingCount: (v: number) => void
  setVariants: (variants: GeneratedVariant[]) => void
  appendVariant: (variant: GeneratedVariant) => void
  clearResults: () => void
}

export const useThumbnailGenerateResultsStore =
  create<ThumbnailGenerateResultsState>()((set) => ({
    variants: [],
    generating: false,
    pendingCount: 0,
    setGenerating: (generating) => set({ generating }),
    setPendingCount: (pendingCount) => set({ pendingCount }),
    setVariants: (variants) => set({ variants }),
    appendVariant: (variant) =>
      set((s) => ({ variants: [...s.variants, variant] })),
    clearResults: () => set({ variants: [], pendingCount: 0 }),
  }))

export function useThumbnailGenerate(
  onGenerate: ((e: SubmitEvent) => void) | undefined,
  propIsGenerating: boolean
) {
  const title = useTitleAndUploadsStore((s) => s.title)
  const uploadedImages = useTitleAndUploadsStore((s) => s.uploadedImages)
  const imgGenerating = useThumbnailGenerateResultsStore((s) => s.generating)
  const setImgGenerating = useThumbnailGenerateResultsStore(
    (s) => s.setGenerating
  )
  const setPendingCount = useThumbnailGenerateResultsStore(
    (s) => s.setPendingCount
  )
  const appendVariant = useThumbnailGenerateResultsStore((s) => s.appendVariant)
  const clearResults = useThumbnailGenerateResultsStore((s) => s.clearResults)

  const isGenerating = onGenerate ? propIsGenerating : imgGenerating

  async function handleGenerate(e: SubmitEvent, colorThemeStr: string) {
    if (onGenerate) {
      onGenerate(e)
      return
    }
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Please enter your video title")
      return
    }
    clearResults()

    setImgGenerating(true)
    setPendingCount(3)

    const { hasUploadedPersonImage, useAiPerson: wantAiPerson } =
      useTitleAndUploadsStore.getState()
    const effectiveUseAiPerson = hasUploadedPersonImage() ? false : wantAiPerson

    const imagesForAPI = uploadedImages
      .filter((img) => img.base64 && img.base64.length > 0)
      .map((img) => ({
        base64: img.base64,
        mimeType: img.mimeType,
        category: img.category ?? "unknown",
        label: img.label,
        description: img.description,
        hasFace: img.hasFace ?? false,
      }))

    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      GENERATE_FETCH_TIMEOUT_MS
    )

    try {
      const res = await fetch("/api/generate/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          style: "",
          colorTheme: colorThemeStr,
          variantCount: 3,
          images: imagesForAPI,
          useAiPerson: effectiveUseAiPerson,
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        let errMsg = "Generation failed."
        try {
          const errData = (await res.json()) as { error?: string }
          errMsg = errData.error ?? errMsg
        } catch {
          /* ignore */
        }
        toast.error(errMsg)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        toast.error("Invalid response from server.")
        return
      }

      const decoder = new TextDecoder()
      let buffer = ""
      let variantCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const msg = JSON.parse(line) as {
              type: string
              variant?: GeneratedVariant
              error?: string
            }

            if (msg.type === "variant" && msg.variant) {
              appendVariant(msg.variant)
              variantCount++
              setPendingCount(Math.max(0, 3 - variantCount))
            } else if (msg.type === "error") {
              toast.error(msg.error ?? "Generation failed")
            }
          } catch {
            /* skip malformed lines */
          }
        }
      }

      if (buffer.trim()) {
        try {
          const msg = JSON.parse(buffer) as {
            type: string
            variant?: GeneratedVariant
            error?: string
          }
          if (msg.type === "variant" && msg.variant) {
            appendVariant(msg.variant)
            variantCount++
          }
        } catch {
          /* skip */
        }
      }

      if (variantCount > 0) {
        toast.success(
          `${variantCount} thumbnail${variantCount > 1 ? "s" : ""} generated!`
        )
      }
    } catch (err) {
      const aborted =
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        (err as { name: string }).name === "AbortError"
      if (aborted) {
        toast.error(
          "Generation timed out. Try fewer variants or a smaller reference image, or check your host's serverless time limit."
        )
      } else {
        toast.error("Network error. Please try again.")
      }
    } finally {
      clearTimeout(timeoutId)
      setImgGenerating(false)
      setPendingCount(0)
    }
  }

  return { handleGenerate, isGenerating }
}
