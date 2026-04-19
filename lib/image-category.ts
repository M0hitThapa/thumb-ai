/**
 * Same values as POST /api/classify-image JSON response.
 */
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

export function parseImageCategory(value: string | undefined): ImageCategory {
  if (!value) return "unknown"
  return (IMAGE_CATEGORY_LIST as readonly string[]).includes(value)
    ? (value as ImageCategory)
    : "unknown"
}
