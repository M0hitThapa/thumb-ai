
export type ImageCategory =
  | "person"
  | "background"
  | "props"
  | "reference_style"
  | "before_after"
  | "text_graphic"
  | "unknown"

export const IMAGE_CATEGORY_LIST: readonly ImageCategory[] = [
  "person",
  "background",
  "props",
  "reference_style",
  "before_after",
  "text_graphic",
  "unknown",
] as const


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


export interface ClassifyImageResult {
  category: ImageCategory
  label: string
  description: string
  hasFace: boolean
}


export interface ClassifyResult {
  category: ImageCategory
  label: string
  description: string
  hasFace: boolean
}


export interface ClassifiedImage {
  readonly base64: string
  readonly mimeType: string
  readonly category: ImageCategory
  readonly label?: string
  readonly description?: string
  readonly hasFace?: boolean
}

export interface GenerateImagesRequest {
  readonly title: string
  readonly style: string
  readonly colorTheme: string
  readonly images: ClassifiedImage[]
  readonly variantCount: 1 | 2 | 3
  readonly prompt?: string
  readonly useAiPerson?: boolean
}

export type ThumbnailVariantStrategy = "dramatic" | "clean" | "artistic"

export interface GeneratedVariant {
  readonly imageBase64: string
  readonly description: string
  readonly strategy: ThumbnailVariantStrategy
  readonly imageUrl?: string
}

export interface ThumbnailConcept {
  id: string
  title: string
  headline: string
  subheadline?: string
  thumbnailText?: string
  textPlacement?: string
  textStyle?: string
  visualDescription: string
  backgroundDescription: string
  subjectDescription?: string
  composition?: string
  lighting?: string
  colorPalette: string[]
  fontStyle: string
  emojiAccents: string[]
  props?: string[]
  designTips: string[]
  ctrScore: number
  ctrReasoning: string
  psychologyTrigger: string
  strategy: "curiosity" | "authority" | "shock" | "emotion" | "value"
  emotionalImpact?: string
  platformOptimisation?: string
}

export interface ThumbnailAnalysisResult {
  title: string
  style: string
  colorTheme: string
  concepts: ThumbnailConcept[]
  generalAdvice: string
  autoInferences?: {
    detectedEmotion: string
    recommendedColors: string
    platformTip: string
  }
  avoidList: string[]
  bestPractices: string[]
}

export interface GenerateConceptsOptions {
  title: string
  style?: string
  colorTheme?: string
  userId: string
}
