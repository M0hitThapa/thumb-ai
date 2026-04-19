import { create } from "zustand"
import type { ImageCategory } from "../image-category"

export interface UploadedImage {
  readonly base64: string
  readonly mimeType: string
  readonly preview: string
  category?: ImageCategory
  label?: string
  description?: string
  hasFace?: boolean
  classifying?: boolean
}

export interface GeneratedVariant {
  readonly imageBase64: string
  readonly description: string
  readonly strategy: string
  imageUrl?: string
}

export const IMAGE_COLOR_PALETTES = [
  { name: "Sunset Drama", colors: ["#FF6B35", "#F7C59F", "#004E89"] as const },
  { name: "Cyber Neon", colors: ["#00FFF0", "#BC13FE", "#0D0221"] as const },
  { name: "Ocean Calm", colors: ["#0077B6", "#90E0EF", "#03045E"] as const },
  { name: "Forest Luxe", colors: ["#2D6A4F", "#D4A373", "#1B4332"] as const },
  { name: "Royal Gold", colors: ["#FFD700", "#1A1A2E", "#C41E3A"] as const },
  { name: "Mono Pop", colors: ["#FFFFFF", "#000000", "#FF0000"] as const },
] as const

export const STRATEGY_LABELS: Record<string, string> = {
  dramatic: "🔥 Dramatic",
  clean: "✨ Clean",
  artistic: "🎨 Artistic",
  edited: "✏️ Edited",
}

export const CATEGORY_LABELS: Record<ImageCategory, string> = {
  person: "👤 Person",
  background: "🌄 Background",
  props: "🎯 Props",
  reference_style: "🎨 Style ref",
  before_after: "↔ Before/After",
  text_graphic: "✏️ Graphic",
  unknown: "📷 Image",
}

export const CATEGORY_COLORS: Record<ImageCategory, string> = {
  person:
    "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  background:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  props: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  reference_style:
    "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
  before_after:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  text_graphic:
    "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  unknown:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
}

interface ImagesState {
  title: string
  prompt: string
  style: string
  colorMode: "auto" | "palette"
  selectedPalette: string
  uploadedImages: UploadedImage[]
  useAiPerson: boolean
  referenceImageFromUpload: UploadedImage | null
  referenceImageFromUrl: UploadedImage | null
  referenceActiveSource: "upload" | "url" | null
  variants: GeneratedVariant[]
  selectedVariant: number
  editingImage: string | null
  generating: boolean
  editing: boolean

  setTitle: (v: string) => void
  setPrompt: (v: string) => void
  setStyle: (v: string) => void
  setColorMode: (v: "auto" | "palette") => void
  setSelectedPalette: (v: string) => void
  setUseAiPerson: (v: boolean) => void

  /** @returns start index of the appended slice */
  addImages: (images: UploadedImage[]) => number
  removeImage: (index: number) => void
  updateImageClassification: (
    index: number,
    data: Partial<UploadedImage>
  ) => void
  clearImages: () => void

  setReferenceImageFromUpload: (img: UploadedImage | null) => void
  setReferenceImageFromUrl: (img: UploadedImage | null) => void
  getActiveReferenceImage: () => UploadedImage | null

  getPersonImages: () => UploadedImage[]
  /** True if any upload is classified as a person (user-supplied face/model). */
  hasUploadedPersonImage: () => boolean
  getAllImagesForGeneration: () => UploadedImage[]

  addPersonImages: (images: UploadedImage[]) => void
  removePersonImage: (index: number) => void

  setGenerating: (v: boolean) => void
  setEditing: (v: boolean) => void
  setVariants: (variants: GeneratedVariant[]) => void
  appendVariant: (variant: GeneratedVariant) => void
  setSelectedVariant: (index: number) => void
  setEditingImage: (img: string | null) => void
  clearResults: () => void
}

export const useImagesStore = create<ImagesState>()((set, get) => ({
  title: "",
  prompt: "",
  style: "",
  colorMode: "auto",
  selectedPalette: IMAGE_COLOR_PALETTES[0]!.name,
  uploadedImages: [],
  useAiPerson: false,
  referenceImageFromUpload: null,
  referenceImageFromUrl: null,
  referenceActiveSource: null,
  variants: [],
  selectedVariant: 0,
  editingImage: null,
  generating: false,
  editing: false,

  setTitle: (title) => set({ title }),
  setPrompt: (prompt) => set({ prompt }),
  setStyle: (style) => set({ style }),
  setColorMode: (colorMode) => set({ colorMode }),
  setSelectedPalette: (selectedPalette) =>
    set({ selectedPalette, colorMode: "palette" }),

  setUseAiPerson: (useAiPerson) => set({ useAiPerson }),

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

  clearImages: () => set({ uploadedImages: [] }),

  setReferenceImageFromUpload: (img) =>
    set((s) => ({
      referenceImageFromUpload: img,
      referenceActiveSource: img
        ? "upload"
        : s.referenceActiveSource === "upload"
          ? s.referenceImageFromUrl
            ? "url"
            : null
          : s.referenceActiveSource,
    })),

  setReferenceImageFromUrl: (img) =>
    set((s) => ({
      referenceImageFromUrl: img,
      referenceActiveSource: img
        ? "url"
        : s.referenceActiveSource === "url"
          ? s.referenceImageFromUpload
            ? "upload"
            : null
          : s.referenceActiveSource,
    })),

  getActiveReferenceImage: () => {
    const s = get()
    const {
      referenceImageFromUpload,
      referenceImageFromUrl,
      referenceActiveSource,
    } = s
    if (referenceActiveSource === "upload" && referenceImageFromUpload) {
      return referenceImageFromUpload
    }
    if (referenceActiveSource === "url" && referenceImageFromUrl) {
      return referenceImageFromUrl
    }
    if (referenceImageFromUpload) return referenceImageFromUpload
    if (referenceImageFromUrl) return referenceImageFromUrl
    return null
  },

  getPersonImages: () => {
    const { uploadedImages } = get()
    const persons = uploadedImages.filter((img) => img.category === "person")
    return persons.length > 0
      ? persons
      : uploadedImages.filter(
          (img) => !img.category || img.category === "unknown"
        )
  },

  hasUploadedPersonImage: () =>
    get().uploadedImages.some((img) => img.category === "person"),

  getAllImagesForGeneration: () => {
    const { uploadedImages } = get()
    const referenceImage = get().getActiveReferenceImage()
    const all: UploadedImage[] = [...uploadedImages]
    if (referenceImage) {
      all.push({
        ...referenceImage,
        category: "reference_style",
        label: referenceImage.label || "Style reference thumbnail",
        description:
          referenceImage.description ||
          "Analyze this thumbnail's style, composition, colors, text placement, and visual energy. Create a NEW thumbnail INSPIRED by this aesthetic - do not copy it directly.",
      })
    }
    return all
  },

  addPersonImages: (images) => {
    const tagged = images.map(
      (img): UploadedImage => ({
        ...img,
        category: "person",
        label: "Person",
        classifying: true,
      })
    )
    set((s) => ({ uploadedImages: [...s.uploadedImages, ...tagged] }))
  },

  removePersonImage: (index) => {
    const { uploadedImages } = get()
    const personIndexes = uploadedImages
      .map((img, i) => ({ img, i }))
      .filter(({ img }) => img.category === "person" || !img.category)
      .map(({ i }) => i)
    const globalIndex = personIndexes[index]
    if (globalIndex === undefined) return
    set((s) => ({
      uploadedImages: s.uploadedImages.filter((_, i) => i !== globalIndex),
    }))
  },

  setGenerating: (generating) => set({ generating }),
  setEditing: (editing) => set({ editing }),
  setVariants: (variants) => set({ variants, selectedVariant: 0 }),
  appendVariant: (variant) =>
    set((s) => {
      const next = [...s.variants, variant]
      return { variants: next, selectedVariant: next.length - 1 }
    }),
  setSelectedVariant: (selectedVariant) => set({ selectedVariant }),
  setEditingImage: (editingImage) => set({ editingImage }),
  clearResults: () =>
    set({ variants: [], selectedVariant: 0, editingImage: null }),
}))
