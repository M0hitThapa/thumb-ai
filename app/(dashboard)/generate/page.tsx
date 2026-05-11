"use client"

import type { SubmitEvent } from "react"
import { useCallback } from "react"
import { DashboardShell } from "@/components/generate/layout/dashboard-shell"
import { PromptBar } from "@/components/generate/prompt-bar"
import { useThumbnailGenerate } from "@/hooks/use-thumbnail-generate"
import { STRATEGY_LABELS } from "@/lib/thumbnail-ui-constants"
import { useTitleAndUploadsStore } from "@/components/generate/sidebar-section/title-section"
import { useGeneratorColorThemeStr } from "@/components/generate/sidebar-section/color-section"
import { useThumbnailGenerateResultsStore } from "@/hooks/use-thumbnail-generate"
import type { GeneratedVariant } from "@/lib/types"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { IconDownload } from "@tabler/icons-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

const PLACEHOLDER_IMAGES = [
  { src: "/temp.png", alt: "Thumbnail placeholder 1" },
  { src: "/temp.png", alt: "Thumbnail placeholder 2" },
  { src: "/temp.png", alt: "Thumbnail placeholder 3" },
  { src: "/temp.png", alt: "Thumbnail placeholder 4" },
  { src: "/temp.png", alt: "Thumbnail placeholder 5" },
  { src: "/thumb.png", alt: "Thumbnail placeholder 6" },
  { src: "/temp.png", alt: "Thumbnail placeholder 7" },
  { src: "/temp.png", alt: "Thumbnail placeholder 8" },
  { src: "/temp.png", alt: "Thumbnail placeholder 9" },
]

function downloadVariant(variant: GeneratedVariant, index: number) {
  const link = document.createElement("a")
  link.href = `data:image/png;base64,${variant.imageBase64}`
  link.download = `hookify-thumbnail-${index + 1}-${Date.now()}.png`
  link.click()
}

export default function Page() {
  const title = useTitleAndUploadsStore((s) => s.title)
  const variants = useThumbnailGenerateResultsStore((s) => s.variants)
  const generating = useThumbnailGenerateResultsStore((s) => s.generating)
  const pendingCount = useThumbnailGenerateResultsStore((s) => s.pendingCount)
  const colorThemeStr = useGeneratorColorThemeStr()

  const { handleGenerate, isGenerating } = useThumbnailGenerate(
    undefined,
    false
  )

  const onGenerate = useCallback(() => {
    if (!title.trim()) return
    const fakeEvent = {
      preventDefault: () => {},
    } as SubmitEvent
    void handleGenerate(fakeEvent, colorThemeStr)
  }, [colorThemeStr, handleGenerate, title])

  const list = variants ?? []
  const showEmptyState = !generating && list.length === 0

  return (
    <SidebarProvider className="flex-col bg-background md:h-svh md:max-h-svh md:flex-row md:overflow-hidden">
      <DashboardShell className="md:overflow-y-auto" />

      <section
        aria-label="Generated thumbnails"
        className={cn(
          "relative flex min-h-svh flex-1 flex-col overflow-hidden md:min-h-0"
        )}
      >
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink href="#">Build Your Thumbnail</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem className="sm:hidden">
                <BreadcrumbLink href="#">Thumbnail</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex flex-1 flex-col gap-4 p-4 pb-44">
            {showEmptyState && (
              <div className="flex h-full w-full items-center justify-center overflow-hidden">
                <div className="grid w-full grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:gap-4 sm:px-5">
                  {PLACEHOLDER_IMAGES.map((img, i) => {
                    const isHighlighted = i === 5
                    const isHiddenOnMobile = i >= 6

                    return (
                      <div
                        key={i}
                        className={cn(
                          isHiddenOnMobile ? "hidden sm:block" : "block",
                          "relative"
                        )}
                      >
                        <div
                          className={cn(
                            "relative aspect-video overflow-hidden rounded-xl transition-all duration-300",
                            isHighlighted
                              ? "shadow-xl ring-2 ring-primary ring-offset-2 ring-offset-background"
                              : "opacity-40 grayscale"
                          )}
                        >
                          <Image
                            src={img.src}
                            alt={img.alt}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {isHighlighted && (
                          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                            <span className="absolute size-16 animate-ping rounded-full bg-white/30" />

                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="64"
                              height="64"
                              viewBox="0 0 24 24"
                              fill="white"
                              stroke="white"
                              strokeWidth="0.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="relative animate-bounce drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
                              style={{
                                animationDuration: "1s",
                                transform: "rotate(-30deg)",
                              }}
                            >
                              <path
                                stroke="none"
                                d="M0 0h24v24H0z"
                                fill="none"
                              />
                              <path d="M14.185 13.14l5.644 -2.202c1.625 -.634 1.538 -2.962 -.13 -3.473l-14.319 -4.382c-1.41 -.431 -2.73 .888 -2.298 2.298l4.382 14.318c.51 1.668 2.84 1.755 3.473 .13l2.202 -5.644a1.84 1.84 0 0 1 1.045 -1.045" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!showEmptyState && (
              <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                {list.map((v, i) => (
                  <div
                    key={i}
                    className={cn(
                      "relative aspect-video overflow-hidden rounded-xl border border-border bg-muted/20 shadow-sm",
                      "animate-in duration-500 fade-in-0 zoom-in-95"
                    )}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <Image
                      src={`data:image/png;base64,${v.imageBase64}`}
                      alt={v.description || `Variant ${i + 1}`}
                      className="h-full w-full object-cover"
                      height={360}
                      width={640}
                    />

                    <div className="absolute top-2 left-2 max-w-[min(100%,14rem)] rounded-md bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                      {STRATEGY_LABELS[v.strategy] ?? `Variant ${i + 1}`}
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 size-10 rounded-full border border-border/80 bg-background/95 shadow-md backdrop-blur-sm hover:bg-background"
                      aria-label={`Download thumbnail ${i + 1}`}
                      onClick={() => downloadVariant(v, i)}
                    >
                      <IconDownload className="size-5" aria-hidden />
                    </Button>
                  </div>
                ))}

                {generating &&
                  Array.from({ length: pendingCount }).map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="aspect-video animate-pulse rounded-xl bg-muted/50"
                    />
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-0">
          <PromptBar isGenerating={isGenerating} onGenerate={onGenerate} />
        </div>
      </section>
    </SidebarProvider>
  )
}
