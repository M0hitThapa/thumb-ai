"use client"

import type { SubmitEvent } from "react"
import { useGenerateStore } from "@/lib/store/generate-store"
import { useImagesStore, type GeneratedVariant } from "@/lib/store/image-store"
import { toast } from "sonner"

const GENERATE_FETCH_TIMEOUT_MS = 315_000

export function useThumbnailGenerate(
  onGenerate: ((e: SubmitEvent) => void) | undefined,
  propIsGenerating: boolean
) {
  const title = useGenerateStore((s) => s.title)
  const style = useGenerateStore((s) => s.style)
  const clearResult = useGenerateStore((s) => s.clearResult)

  const prompt = useImagesStore((s) => s.prompt)
  const uploadedImages = useImagesStore((s) => s.uploadedImages)
  const useAiPerson = useImagesStore((s) => s.useAiPerson)
  const getActiveReferenceImage = useImagesStore(
    (s) => s.getActiveReferenceImage
  )
  const imgGenerating = useImagesStore((s) => s.generating)
  const setImgGenerating = useImagesStore((s) => s.setGenerating)
  const setVariants = useImagesStore((s) => s.setVariants)
  const clearImgResults = useImagesStore((s) => s.clearResults)

  const referenceImage = getActiveReferenceImage()
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
    clearResult()
    clearImgResults()

    setImgGenerating(true)
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

    if (
      referenceImage &&
      referenceImage.base64 &&
      referenceImage.base64.length > 0
    ) {
      imagesForAPI.push({
        base64: referenceImage.base64,
        mimeType: referenceImage.mimeType,
        category: "reference_style",
        label: referenceImage.label || "Thumbnail style reference",
        description:
          "STYLE REFERENCE - Analyze this thumbnail's composition, color palette, text placement, contrast levels, visual hierarchy, and overall aesthetic. Use this as INSPIRATION to create a fresh thumbnail with similar visual energy and style principles, but adapted for the new video title. Do NOT copy directly - understand WHY this works and apply those principles.",
        hasFace: referenceImage.hasFace ?? false,
      })
    }

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
          prompt: prompt.trim() || undefined,
          style,
          colorTheme: colorThemeStr,
          variantCount: 3,
          images: imagesForAPI,
          useAiPerson,
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
