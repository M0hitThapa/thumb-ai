import { IMAGE_CATEGORY_LIST, type ImageCategory } from "./types"

export { IMAGE_CATEGORY_LIST }
export type { ImageCategory }

export function parseImageCategory(value: string | undefined): ImageCategory {
  if (!value) return "unknown"
  return (IMAGE_CATEGORY_LIST as readonly string[]).includes(value)
    ? (value as ImageCategory)
    : "unknown"
}
