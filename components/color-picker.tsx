"use client"
import { IMAGE_COLOR_PALETTES } from "@/lib/thumbnail-ui-constants"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { IconSparkles } from "@tabler/icons-react"

interface ColorPalettePickerProps {
  colorMode: "auto" | "palette"
  selectedPalette: string
  onColorMode: (mode: "auto" | "palette") => void
  onSelectPalette: (name: string) => void
}

export function ColorPalettePicker({
  colorMode,
  selectedPalette,
  onColorMode,
  onSelectPalette,
}: ColorPalettePickerProps) {
  const isAuto = colorMode === "auto"

  return (
    <div className="space-y-2.5">
      <Label className="text-md font-semibold text-neutral-600 dark:text-neutral-400">
        Choose Theme
      </Label>

      <div className="flex flex-wrap items-center gap-1.5">

        <button
          type="button"
          onClick={() => onColorMode("auto")}
          className={cn(
            "squircle flex cursor-pointer items-center gap-1.5 rounded-md border-2 px-2.5 py-[5px] text-xs font-medium transition-all",
            isAuto
              ? "border-border bg-secondary text-foreground shadow-[0_0_0_1.5px_hsl(var(--border))]"
              : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
          )}
        >
          <IconSparkles className="h-3.5 w-3.5 shrink-0" />
          Auto
        </button>

        <span className="mx-0.5 h-4 w-px bg-border/50" />


        {IMAGE_COLOR_PALETTES.map((pal) => {
          const isSelected = !isAuto && selectedPalette === pal.name
          return (
            <button
              type="button"
              key={pal.name}
              onClick={() => {
                onSelectPalette(pal.name)
                onColorMode("palette")
              }}
              className={cn(
                "squircle flex max-w-[11rem] cursor-pointer items-center gap-1.5 rounded-md border-2 px-2.5 py-[5px] text-xs font-medium transition-all",
                isSelected
                  ? "border-border bg-secondary text-foreground shadow-[0_0_0_1.5px_hsl(var(--border))]"
                  : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <span className="flex shrink-0 gap-0.5">
                {pal.colors.map((c, i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span className="truncate">{pal.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
