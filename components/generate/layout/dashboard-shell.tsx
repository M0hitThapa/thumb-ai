"use client"

import * as React from "react"
import type { SubmitEvent } from "react"
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/theme-provider"
import Link from "next/link"
import { AppLogo } from "@/components/icons/logos"
import { TitleSection } from "../sidebar-section/title-section"
import { IconLoader2 } from "@tabler/icons-react"
import { ColorSection } from "../sidebar-section/color-section"
import { cn } from "@/lib/utils"

type DashboardShellProps = React.ComponentProps<"aside"> & {
  onSubmitGenerate: (e: SubmitEvent<HTMLFormElement>) => void
  isGenerating: boolean
}

export function DashboardShell({
  onSubmitGenerate,
  isGenerating,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <aside
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-col bg-sidebar text-sidebar-foreground md:h-full md:w-80 md:shrink-0 md:border-r md:border-sidebar-border lg:w-96 xl:w-[32rem]",
        className
      )}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between border-b border-sidebar-border py-[3.5px] pr-3 hover:bg-sidebar-accent">
            <SidebarMenuButton
              size="default"
              className="rounded-none py-7 [&_svg]:size-8!"
            >
              <Link href="/" className="flex items-center gap-2">
                <AppLogo />
                <div>
                  <span className="text-xl font-semibold tracking-tight text-foreground">
                    Hookify
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>

            <ModeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="space-y-2 px-2 pt-2">
        <TitleSection />
        <ColorSection />
      </SidebarContent>

      <SidebarFooter>
        <form className="p-1" onSubmit={onSubmitGenerate}>
          <Button
            type="submit"
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground shadow-none"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <IconLoader2 className="mr-2 size-4 animate-spin" />
                Generating…
              </>
            ) : (
              "Generate Thumbnail"
            )}
          </Button>
        </form>
      </SidebarFooter>
    </aside>
  )
}


