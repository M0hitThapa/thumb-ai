"use client"

import type { SubmitEvent } from "react"
import { useCallback, useState } from "react"
import { DashboardShell } from "@/components/generate/layout/dashboard-shell"
import { useThumbnailGenerate } from "@/hooks/use-thumbnail-generate"
import { STRATEGY_LABELS } from "@/lib/thumbnail-ui-constants"
import { useTitleAndUploadsStore } from "@/components/generate/sidebar-section/title-section"
import { useGeneratorColorThemeStr } from "@/components/generate/sidebar-section/color-section"
import { useThumbnailGenerateResultsStore } from "@/hooks/use-thumbnail-generate"
import type { GeneratedVariant } from "@/lib/types"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconDownload, IconPhoto } from "@tabler/icons-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { SidebarProvider } from "@/components/ui/sidebar"

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
  const colorThemeStr = useGeneratorColorThemeStr()

  const { handleGenerate, isGenerating } = useThumbnailGenerate(
    undefined,
    false
  )

  const [mobileStep, setMobileStep] = useState<"form" | "preview">("form")

  const onSubmitGenerate = useCallback(
    (e: SubmitEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!title.trim()) return
      setMobileStep("preview")
      void handleGenerate(e, colorThemeStr)
    },
    [colorThemeStr, handleGenerate, title]
  )

  const list = variants ?? []
  const showEmptyState = !generating && list.length === 0

  return (
    <SidebarProvider className="flex-col bg-background md:h-svh md:max-h-svh md:flex-row md:overflow-hidden">
      <DashboardShell
        onSubmitGenerate={onSubmitGenerate}
        isGenerating={isGenerating}
        className={cn(
          "max-md:min-h-svh",
          mobileStep === "preview" && "max-md:hidden",
          "md:overflow-y-auto"
        )}
      />

      <section
        aria-label="Generated thumbnails"
        className={cn(
          "flex min-h-svh flex-1 flex-col overflow-hidden md:min-h-0",
          mobileStep === "form" && "max-md:hidden"
        )}
      >
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          {mobileStep === "preview" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 md:hidden"
              onClick={() => setMobileStep("form")}
            >
              <IconArrowLeft className="size-4" aria-hidden />
              Edit details
            </Button>
          )}
          <Breadcrumb
            className={cn(mobileStep === "preview" && "max-md:flex-1")}
          >
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

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {showEmptyState && (
            <div className="flex flex-1 items-center justify-center py-8">
              <Empty className="max-w-md">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconPhoto aria-hidden />
                  </EmptyMedia>
                  <EmptyTitle>No thumbnails yet</EmptyTitle>
                  <EmptyDescription>
                    Set your video title and optional references in the form,
                    then tap Generate to create three Hookify thumbnail
                    variants.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}

          {!showEmptyState && (
            <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {generating &&
                [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="aspect-video animate-pulse rounded-xl bg-muted/50"
                  />
                ))}

              {!generating &&
                list.map((v, i) => (
                  <div
                    key={i}
                    className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted/20 shadow-sm"
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
            </div>
          )}
        </div>
      </section>
    </SidebarProvider>
  )
}
