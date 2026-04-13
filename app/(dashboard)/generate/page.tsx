"use client"

import type { SubmitEvent } from "react"
import { DashboardShell } from "@/components/generate/layout/dashboard-shell"
import { useThumbnailGenerate } from "@/hooks/use-thumbnail-generate"
import { useImagesStore } from "@/lib/store/image-store"
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

export default function Page() {
  const title = useGenerateStore((s) => s.title)
  const variants = useImagesStore((s) => s.variants)
  const generating = useImagesStore((s) => s.generating)
  const clearImgResults = useImagesStore((s) => s.clearResults)

  const { handleGenerate, isGenerating } = useThumbnailGenerate(
    undefined,
    false
  )

  function onSubmitGenerate(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) return
    void handleGenerate(e, "")
  }

  const list = variants ?? []

  return (
    <SidebarProvider>
      <DashboardShell
        onSubmitGenerate={onSubmitGenerate}
        isGenerating={isGenerating}
      />
      <SidebarInset>
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

        <div className="flex flex-1 flex-col gap-4 p-4">
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
                <div
                  key={i}
                  className={cn(
                    "aspect-video overflow-hidden rounded-xl border bg-muted/20 ring-1 ring-border"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${v.imageBase64}`}
                    alt={v.description || `Variant ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}

            {!generating && list.length === 0 && (
              <>
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
              </>
            )}
          </div>

          <div className="flex min-h-30 flex-1 items-start justify-end rounded-xl bg-muted/50 p-3 md:min-h-min">
            {list.length > 0 && (
              <button
                type="button"
                className="text-sm text-muted-foreground underline"
                onClick={clearImgResults}
              >
                Clear results
              </button>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
