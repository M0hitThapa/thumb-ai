import type { ImageCategory } from "@/lib/image-category"

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

/** Response shape from POST /api/classify-image */
export interface ClassifyImageResult {
  category: ImageCategory
  label: string
  description: string
  hasFace: boolean
}
