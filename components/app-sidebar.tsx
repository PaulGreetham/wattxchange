"use client"

import * as React from "react"
import Papa from "papaparse"
import { AudioWaveform, Command, GalleryVerticalEnd, Sun, Wind, Zap } from "lucide-react"

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

type ParkInfo = {
  park_name: string
  timezone: string
  energy_type: "Wind" | "Solar"
}

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
      icon: Zap,
      items: [
        { title: "Solar Data Total", url: "#all-parks-solar" },
        { title: "Wind Data Total", url: "#all-parks-wind" },
        { title: "Total Combined", url: "#all-parks-total" },
      ],
    },
  ],
  navIndividualParks: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [solarParks, setSolarParks] = React.useState<
    { title: string; url: string; items: { title: string; url: string }[] }[]
  >([])
  const [windParks, setWindParks] = React.useState<
    { title: string; url: string; items: { title: string; url: string }[] }[]
  >([])

  React.useEffect(() => {
    async function loadParks() {
      try {
        const response = await fetch("/data/park_info.csv")
        const text = await response.text()
        const parsed = Papa.parse<ParkInfo>(text, {
          header: true,
          skipEmptyLines: true,
        })
        const parks = parsed.data as ParkInfo[]

        const toHash = (parkName: string, type: "solar" | "wind") =>
          `#${parkName.toLowerCase()}-${type}`

        const solar = parks
          .filter((park) => park.energy_type === "Solar")
          .map((park) => ({
            title: park.park_name,
            url: "#",
            icon: Sun,
            items: [{ title: "Solar Data", url: toHash(park.park_name, "solar") }],
          }))

        const wind = parks
          .filter((park) => park.energy_type === "Wind")
          .map((park) => ({
            title: park.park_name,
            url: "#",
            icon: Wind,
            items: [{ title: "Wind Data", url: toHash(park.park_name, "wind") }],
          }))

        setSolarParks(solar)
        setWindParks(wind)
      } catch (error) {
        console.error("Failed to load parks for sidebar", error)
      }
    }

    loadParks()
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="All Parks" items={data.navAllParks} />
        <NavMain label="Solar Parks" items={solarParks} />
        <NavMain label="Wind Parks" items={windParks} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
