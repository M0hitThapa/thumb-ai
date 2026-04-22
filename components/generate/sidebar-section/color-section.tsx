"use client"

import { create } from "zustand"
import { ColorPalettePicker } from "@/components/color-picker"
import {
  DEFAULT_COLOR_PALETTE_NAME,
  IMAGE_COLOR_PALETTES,
} from "@/lib/thumbnail-ui-constants"

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

export function ColorSection() {
  const colorMode = useThumbnailColorStore((s) => s.colorMode)
  const selectedPalette = useThumbnailColorStore((s) => s.selectedPalette)
  const setColorMode = useThumbnailColorStore((s) => s.setColorMode)
  const setSelectedPalette = useThumbnailColorStore((s) => s.setSelectedPalette)

  return (
    <ColorPalettePicker
      colorMode={colorMode}
      selectedPalette={selectedPalette}
      onColorMode={setColorMode}
      onSelectPalette={setSelectedPalette}
    />
  )
}
