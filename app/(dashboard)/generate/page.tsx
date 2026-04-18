"use client"

import type { SubmitEvent } from "react"
import { DashboardShell } from "@/components/generate/layout/dashboard-shell"
import { useThumbnailGenerate } from "@/hooks/use-thumbnail-generate"
import { STRATEGY_LABELS, useImagesStore } from "@/lib/store/image-store"
import { useGenerateStore } from "@/lib/store/generate-store"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"

import { Separator } from "@/components/ui/separator"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { IconDownload, IconPhoto } from "@tabler/icons-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function Page() {
  const title = useGenerateStore((s) => s.title)
  const variants = useImagesStore((s) => s.variants)
  const generating = useImagesStore((s) => s.generating)
  const selectedVariant = useImagesStore((s) => s.selectedVariant)
  const setSelectedVariant = useImagesStore((s) => s.setSelectedVariant)

  const currentVariant = variants?.[selectedVariant]

  const { handleGenerate, isGenerating } = useThumbnailGenerate(
    undefined,
    false
  )

  function onSubmitGenerate(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) return
    void handleGenerate(e, "")
  }

  const handleDownload = () => {
    if (!currentVariant) return

    const link = document.createElement("a")
    link.href = `data:image/png;base64,${currentVariant.imageBase64}`
    link.download = `thumbnail-${Date.now()}.png`
    link.click()
  }

  const list = variants ?? []
  const showEmptyState = !generating && list.length === 0

  return (
    <SidebarProvider>
      <DashboardShell
        onSubmitGenerate={onSubmitGenerate}
        isGenerating={isGenerating}
      />

      <SidebarInset className="flex h-screen flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Build Your Thumbnail</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
          {!showEmptyState && (
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              {generating &&
                [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="aspect-video animate-pulse rounded-xl bg-muted/50"
                  />
                ))}

              {!generating &&
                list.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(i)}
                    className={cn(
                      "relative overflow-hidden rounded-xl border-2 text-left transition-all",
                      i === selectedVariant
                        ? "border-primary shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Image
                      src={`data:image/png;base64,${v.imageBase64}`}
                      alt={v.description || `Variant ${i + 1}`}
                      className="h-full w-full object-cover"
                      height={360}
                      width={640}
                    />
                  </button>
                ))}
            </div>
          )}

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            {showEmptyState && (
              <Empty className="max-w-md ">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconPhoto aria-hidden />
                  </EmptyMedia>
                  <EmptyTitle>No thumbnails yet</EmptyTitle>
                  <EmptyDescription>
                    Set your video title and optional references in the sidebar,
                    then use Generate to create three Hookify thumbnail
                    variants.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {currentVariant && (
              <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden">
                <div className="relative flex flex-1 overflow-hidden rounded-xl">
                  <Image
                    src={`data:image/png;base64,${currentVariant.imageBase64}`}
                    alt="Selected thumbnail"
                    fill
                    className=""
                    priority
                  />

                  <div className="absolute top-3 left-3 rounded-md bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    {STRATEGY_LABELS[currentVariant.strategy] ??
                      `Variant ${selectedVariant + 1}`}
                  </div>
                </div>

                <div className="shrink-0 p-3">
                  <Button onClick={handleDownload} className="w-full gap-2">
                    <IconDownload className="h-4 w-4" />
                    Download PNG
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
