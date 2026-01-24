"use client"

import * as React from "react"
import { Zap, Sun, Wind } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { solarParks, windParks } from "@/lib/parks"

const data = {
  user: {
    name: "Steven McTradealot",
    email: "s@wattxchange.com",
    avatar: "",
  },
  teams: [
    {
      name: "WattXchange",
      logo: Zap,
      plan: "Internal Dashboard",
    },
    {
      name: "WattXchange 2",
      logo: Zap,
      plan: "Internal Dashboard",
    },
    {
      name: "WattXchange 3",
      logo: Zap,
      plan: "Internal Dashboard",
    },
  ],
  navAllParks: [
    {
      title: "All Parks",
      url: "/",
      isActive: true,
      icon: Zap,
      items: [
        { title: "Solar Data Total", url: "/?view=all-parks-solar" },
        { title: "Wind Data Total", url: "/?view=all-parks-wind" },
        { title: "Total Combined", url: "/?view=all-parks-total" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const toHash = (parkName: string, type: "solar" | "wind") =>
    `${parkName.toLowerCase()}-${type}`

  const solarItems = solarParks.map((park) => ({
    title: park.name,
    url: "/",
    icon: Sun,
    items: [
      {
        title: "Solar Data",
        url: `/?view=${toHash(park.name, "solar")}`,
      },
    ],
  }))

  const windItems = windParks.map((park) => ({
    title: park.name,
    url: "/",
    icon: Wind,
    items: [
      {
        title: "Wind Data",
        url: `/?view=${toHash(park.name, "wind")}`,
      },
    ],
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="All Parks" items={data.navAllParks} />
        <NavMain label="Solar Parks" items={solarItems} />
        <NavMain label="Wind Parks" items={windItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
