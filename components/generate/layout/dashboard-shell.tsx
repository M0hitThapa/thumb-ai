"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/theme-provider"
import Link from "next/link"
import { AppLogo } from "@/components/icons/logos"
import { cn } from "@/lib/utils"
import { IconBookmarks } from "@tabler/icons-react"

type DashboardShellProps = React.ComponentProps<"aside">

export function DashboardShell({ className, ...props }: DashboardShellProps) {
  return (
    <Sidebar className={cn("max-md:hidden", className)} {...props}>
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

      <SidebarContent className="flex-1 space-y-2 px-2 pt-2">
        <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
          <IconBookmarks className="mb-3 size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Saved Thumbnails
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">Coming soon</p>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
