"use client"

import type { SubmitEvent } from "react"
import { create } from "zustand"
import { useTitleAndUploadsStore } from "@/components/generate/sidebar-section/title-section"
import type { GeneratedVariant } from "@/lib/types"
import { toast } from "sonner"

const GENERATE_FETCH_TIMEOUT_MS = 315_000

interface ThumbnailGenerateResultsState {
  variants: GeneratedVariant[]
  generating: boolean
  setGenerating: (v: boolean) => void
  setVariants: (variants: GeneratedVariant[]) => void
  clearResults: () => void
}

export const useThumbnailGenerateResultsStore =
  create<ThumbnailGenerateResultsState>()((set) => ({
    variants: [],
    generating: false,
    setGenerating: (generating) => set({ generating }),
    setVariants: (variants) => set({ variants }),
    clearResults: () => set({ variants: [] }),
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
  const setVariants = useThumbnailGenerateResultsStore((s) => s.setVariants)
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

    const { hasUploadedPersonImage, useAiPerson: wantAiPerson } =
      useTitleAndUploadsStore.getState()
    const effectiveUseAiPerson = hasUploadedPersonImage()
      ? false
      : wantAiPerson

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

      let data: { variants?: GeneratedVariant[]; error?: string }
      try {
        data = (await res.json()) as {
          variants?: GeneratedVariant[]
          error?: string
        }
      } catch {
        toast.error(
          res.ok ? "Invalid response from server." : "Generation failed."
        )
        return
      }

      if (!res.ok || !data.variants?.length) {
        toast.error(data.error ?? "Generation failed")
        return
      }
      setVariants(data.variants)
      toast.success(`${data.variants.length} thumbnails generated!`)
    } catch (err) {
      const aborted =
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        (err as { name: string }).name === "AbortError"
      if (aborted) {
        toast.error(
          "Generation timed out. Try fewer variants or a smaller reference image, or check your host’s serverless time limit."
        )
      } else {
        toast.error("Network error. Please try again.")
      }
    } finally {
      clearTimeout(timeoutId)
      setImgGenerating(false)
    }
  }

  return { handleGenerate, isGenerating }
}
