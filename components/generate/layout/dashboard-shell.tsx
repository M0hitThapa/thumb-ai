"use client"

import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/theme-provider"
import Link from "next/link"
import { AppLogo } from "@/components/icons/logos"
import { TitleSection } from "../sidebar-section/title-section."

export function DashboardShell({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between border-b border-sidebar-border px-3 py-[3.5px] hover:bg-sidebar-accent">
            <SidebarMenuButton
              size="default"
              asChild
              className="rounded-none py-7 [&_svg]:size-8!"
            >
              <Link href="/">
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
      <SidebarContent className="space-y-2 px-2">
        <TitleSection />
      </SidebarContent>
      <SidebarFooter>
        <div className="p-1">
          <Button className="w-full bg-sidebar-primary text-sidebar-primary-foreground shadow-none">
            Subscribe
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
