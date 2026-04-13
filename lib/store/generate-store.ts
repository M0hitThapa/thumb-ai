import { create } from "zustand"
import type { ThumbnailAnalysisResult } from "@/lib/thumbnail"

interface GenerateState {
  title: string
  style: string
  colorTheme: string
  result: ThumbnailAnalysisResult | null
  loading: boolean
  setTitle: (v: string) => void
  setStyle: (v: string) => void
  setColorTheme: (v: string) => void
  setLoading: (v: boolean) => void
  setResult: (result: ThumbnailAnalysisResult) => void
  clearResult: () => void
}

export const useGenerateStore = create<GenerateState>()((set) => ({
  title: "",
  style: "",
  colorTheme: "",
  result: null,
  loading: false,
  setTitle: (title) => set({ title }),
  setStyle: (style) => set({ style }),
  setColorTheme: (colorTheme) => set({ colorTheme }),
  setLoading: (loading) => set({ loading }),
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}))
