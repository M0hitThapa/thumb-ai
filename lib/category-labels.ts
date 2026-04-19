import type { ImageCategory } from "@/lib/image-category"

export const CATEGORY_LABELS: Record<ImageCategory, string> = {
  person: "👤 Person",
  background: "🌄 Background",
  props: "🎯 Props",
  reference_style: "🎨 Style ref",
  before_after: "↔ Before/After",
  text_graphic: "✏️ Graphic",
  unknown: "📷 Image",
}
