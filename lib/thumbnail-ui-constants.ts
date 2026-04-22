export const IMAGE_COLOR_PALETTES = [
  {
    name: "MrBeast Energy",
    colors: ["#1C1C1E", "#FFD600", "#FF2D2D", "#FFFFFF"] as const,
  },
  {
    name: "Tech Review Chrome",
    colors: ["#0A0A0A", "#2C2C2C", "#E8E8E8", "#00C7FF"] as const,
  },
  {
    name: "Finance Alert",
    colors: ["#0D1B2A", "#1B4332", "#52B788", "#FFE66D"] as const,
  },
  {
    name: "Vlog Pop",
    colors: ["#FF6B6B", "#FFEAA7", "#FDCB6E", "#2D3436"] as const,
  },
  {
    name: "Horror Tension",
    colors: ["#0D0D0D", "#3D0000", "#C0392B", "#F5F5F5"] as const,
  },
  {
    name: "Gaming Neon",
    colors: ["#120458", "#9B59B6", "#00FF9F", "#FFFFFF"] as const,
  },
  {
    name: "Educational Trust",
    colors: ["#1A237E", "#283593", "#F57C00", "#FFFFFF"] as const,
  },
  {
    name: "Beauty & Glow",
    colors: ["#FFF0F3", "#FFCCD5", "#C9184A", "#1A1A1A"] as const,
  },
  {
    name: "Wilderness Raw",
    colors: ["#212529", "#5C4033", "#A5D6A7", "#FF8F00"] as const,
  },
  {
    name: "Clickbait Classic",
    colors: ["#E53935", "#FDD835", "#0D47A1", "#FFFFFF"] as const,
  },
] as const

export const DEFAULT_COLOR_PALETTE_NAME = IMAGE_COLOR_PALETTES[0]!.name

export const STRATEGY_LABELS: Record<string, string> = {
  dramatic: "🔥 Dramatic",
  clean: "✨ Clean",
  artistic: "🎨 Artistic",
  edited: "✏️ Edited",
}
