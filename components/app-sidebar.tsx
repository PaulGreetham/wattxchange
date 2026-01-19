"use client"

import * as React from "react"
import { AudioWaveform, Command, GalleryVerticalEnd } from "lucide-react"

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

const data = {
  user: {
    name: "Steven McTradealot",
    email: "s@wattxchange.com",
    avatar: "/avatars/steven.jpg",
  },
  teams: [
    {
      name: "WattXchange",
      logo: GalleryVerticalEnd,
      plan: "Internal Dashboard",
    },
    {
      name: "WattXchange #2",
      logo: AudioWaveform,
      plan: "Internal Dashboard",
    },
    {
      name: "WattXchange #3",
      logo: Command,
      plan: "Internal Dashboard",
    },
  ],
  navAllParks: [
    {
      title: "All Parks",
      url: "#",
      isActive: true,
      items: [
        { title: "Solar Total", url: "#all-parks-solar" },
        { title: "Wind Total", url: "#all-parks-wind" },
        { title: "Total Combined", url: "#all-parks-total" },
      ],
    },
  ],
  navIndividualParks: [
    {
      title: "Bemmel",
      url: "#",
      items: [
        { title: "Solar", url: "#bemmel-solar" },
        { title: "Wind", url: "#bemmel-wind" },
        { title: "Combined", url: "#bemmel-total" },
      ],
    },
    {
      title: "Netterden",
      url: "#",
      items: [
        { title: "Solar", url: "#netterden-solar" },
        { title: "Wind", url: "#netterden-wind" },
        { title: "Combined", url: "#netterden-total" },
      ],
    },
    {
      title: "Stadskanaal",
      url: "#",
      items: [
        { title: "Solar", url: "#stadskanaal-solar" },
        { title: "Wind", url: "#stadskanaal-wind" },
        { title: "Combined", url: "#stadskanaal-total" },
      ],
    },
    {
      title: "Windskanaal",
      url: "#",
      items: [
        { title: "Solar", url: "#windskanaal-solar" },
        { title: "Wind", url: "#windskanaal-wind" },
        { title: "Combined", url: "#windskanaal-total" },
      ],
    },
    {
      title: "Zwartenbergseweg",
      url: "#",
      items: [
        { title: "Solar", url: "#zwartenbergseweg-solar" },
        { title: "Wind", url: "#zwartenbergseweg-wind" },
        { title: "Combined", url: "#zwartenbergseweg-total" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="All Parks" items={data.navAllParks} />
        <NavMain label="Individual Parks" items={data.navIndividualParks} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
