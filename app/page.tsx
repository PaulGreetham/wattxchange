"use client"

import * as React from "react"
import Papa from "papaparse"

import { AppSidebar } from "@/components/app-sidebar"
import { EnergyAreaChart } from "@/components/charts/energy-area-chart"
import { type DateTimeRangeValue } from "@/components/filters/date-time-range-picker"
import { EnergyDataTable } from "@/components/tables/energy-data-table"
import { ModeToggle } from "@/components/mode-toggle"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { applyDateTimeRangeFilter, applyTimeRangeFilter, buildTimeRangesFromDates, aggregateHourly } from "@/lib/charts/utils"
import { colors } from "@/lib/design"

type ParkInfo = {
  park_name: string
  timezone: string
  energy_type: "Wind" | "Solar"
}

type EnergyReading = {
  datetime: string
  MW: number
}

const allParksHashToMode: Record<string, "solar" | "wind" | "combined"> = {
  "#all-parks-solar": "solar",
  "#all-parks-wind": "wind",
  "#all-parks-total": "combined",
}

const solarHashToPark: Record<string, string> = {
  "#bemmel-solar": "Bemmel",
  "#netterden-solar": "Netterden",
  "#stadskanaal-solar": "Stadskanaal",
  "#windskanaal-solar": "Windskanaal",
  "#zwartenbergseweg-solar": "Zwartenbergseweg",
}

const windHashToPark: Record<string, string> = {
  "#bemmel-wind": "Bemmel",
  "#netterden-wind": "Netterden",
  "#stadskanaal-wind": "Stadskanaal",
  "#windskanaal-wind": "Windskanaal",
  "#zwartenbergseweg-wind": "Zwartenbergseweg",
}

export default function Home() {
  const [activeHash, setActiveHash] = React.useState<string>("")
  const [chartData, setChartData] = React.useState<{ date: string; solar?: number; wind?: number }[]>([])
  const [timeRanges, setTimeRanges] = React.useState<{ value: string; label: string; start?: string; end?: string }[]>([])
  const [timeRange, setTimeRange] = React.useState("all")
  const [dateTimeRange, setDateTimeRange] = React.useState<DateTimeRangeValue>({
    mode: "range",
  })
  const [parkName, setParkName] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    function updateHash() {
      setActiveHash(window.location.hash)
    }

    updateHash()
    window.addEventListener("hashchange", updateHash)
    return () => window.removeEventListener("hashchange", updateHash)
  }, [])

  React.useEffect(() => {
    async function loadPark() {
      const selectedSolarPark = solarHashToPark[activeHash]
      const selectedWindPark = windHashToPark[activeHash]
      const allParksMode = allParksHashToMode[activeHash]
      const selectedPark = selectedSolarPark ?? selectedWindPark
      const selectedMetric = selectedSolarPark ? "solar" : selectedWindPark ? "wind" : null

      if (!selectedPark && !allParksMode) {
        setParkName("")
        setChartData([])
        setTimeRanges([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const parkInfoResponse = await fetch("/data/park_info.csv")
        const parkInfoText = await parkInfoResponse.text()
        const parkInfoParsed = Papa.parse<ParkInfo>(parkInfoText, {
          header: true,
          skipEmptyLines: true,
        })
        const parks = parkInfoParsed.data as ParkInfo[]

        const loadParkData = async (parkList: ParkInfo[]) => {
          const parkData = await Promise.all(
            parkList.map(async (park) => {
              const response = await fetch(`/data/${park.park_name}.csv`)
              const text = await response.text()
              const parsed = Papa.parse<EnergyReading>(text, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
              })
              return parsed.data
            })
          )
          return parkData.flat()
        }

        if (allParksMode) {
          const solarParks = parks.filter((park) => park.energy_type === "Solar")
          const windParks = parks.filter((park) => park.energy_type === "Wind")

          if (allParksMode === "solar") {
            const solarData = await loadParkData(solarParks)
            const aggregated = aggregateHourly(solarData, "solar")
            setParkName("All Parks")
            setChartData(aggregated as { date: string; solar: number }[])
            setTimeRanges(buildTimeRangesFromDates(aggregated.map((item) => item.date)))
            return
          }

          if (allParksMode === "wind") {
            const windData = await loadParkData(windParks)
            const aggregated = aggregateHourly(windData, "wind")
            setParkName("All Parks")
            setChartData(aggregated as { date: string; wind: number }[])
            setTimeRanges(buildTimeRangesFromDates(aggregated.map((item) => item.date)))
            return
          }

          const [solarData, windData] = await Promise.all([
            loadParkData(solarParks),
            loadParkData(windParks),
          ])
          const solarAggregated = aggregateHourly(solarData, "solar")
          const windAggregated = aggregateHourly(windData, "wind")
          const combinedMap = new Map<string, { date: string; solar?: number; wind?: number }>()

          solarAggregated.forEach((item) => {
            combinedMap.set(item.date, { date: item.date, solar: item.solar as number })
          })
          windAggregated.forEach((item) => {
            const existing = combinedMap.get(item.date) ?? { date: item.date }
            combinedMap.set(item.date, { ...existing, wind: item.wind as number })
          })

          const combined = Array.from(combinedMap.values()).sort((a, b) => a.date.localeCompare(b.date))
          setParkName("All Parks")
          setChartData(combined)
          setTimeRanges(buildTimeRangesFromDates(combined.map((item) => item.date)))
          return
        }

        const targetPark = parks.find((park) => park.park_name === selectedPark)
        if (!targetPark || !selectedMetric) return
        if (
          (selectedMetric === "solar" && targetPark.energy_type !== "Solar") ||
          (selectedMetric === "wind" && targetPark.energy_type !== "Wind")
        ) {
          setParkName("")
          setChartData([])
          setTimeRanges([])
          return
        }

        setParkName(targetPark.park_name)

        const parkResponse = await fetch(`/data/${targetPark.park_name}.csv`)
        const parkText = await parkResponse.text()
        const parkParsed = Papa.parse<EnergyReading>(parkText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        })

        const aggregated = aggregateHourly(parkParsed.data, selectedMetric)
        setChartData(aggregated as { date: string; solar?: number; wind?: number }[])
        setTimeRanges(buildTimeRangesFromDates(aggregated.map((item) => item.date)))
      } catch (error) {
        console.error("Failed to load park data", error)
      } finally {
        setLoading(false)
      }
    }

    setTimeRange("all")
    setDateTimeRange({ mode: "range" })
    loadPark()
  }, [activeHash])

  const filteredData = React.useMemo(() => {
    const timeFiltered = applyTimeRangeFilter(chartData, timeRange, timeRanges)
    return applyDateTimeRangeFilter(timeFiltered, dateTimeRange)
  }, [chartData, timeRange, timeRanges, dateTimeRange])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <ModeToggle />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {solarHashToPark[activeHash] || windHashToPark[activeHash] || allParksHashToMode[activeHash] ? (
            loading ? null : chartData.length ? (
              <div className="space-y-6">
                <EnergyAreaChart
                  title={
                    allParksHashToMode[activeHash] === "combined"
                      ? `${parkName} — Total Combined`
                      : `${parkName} — ${solarHashToPark[activeHash] || allParksHashToMode[activeHash] === "solar" ? "Solar Data" : "Wind Data"}`
                  }
                  description={
                    allParksHashToMode[activeHash] === "combined"
                      ? "Combined solar and wind production over time"
                      : `${solarHashToPark[activeHash] || allParksHashToMode[activeHash] === "solar" ? "Solar Data" : "Wind Data"} production over time`
                  }
                  data={filteredData}
                  series={
                    allParksHashToMode[activeHash] === "combined"
                      ? [
                          { key: "solar", label: "Solar Data", color: colors.solar },
                          { key: "wind", label: "Wind Data", color: colors.wind },
                        ]
                      : [
                          {
                            key:
                              solarHashToPark[activeHash] || allParksHashToMode[activeHash] === "solar"
                                ? "solar"
                                : "wind",
                            label:
                              solarHashToPark[activeHash] || allParksHashToMode[activeHash] === "solar"
                                ? "Solar Data"
                                : "Wind Data",
                            color:
                              solarHashToPark[activeHash] || allParksHashToMode[activeHash] === "solar"
                                ? colors.solar
                                : colors.wind,
                          },
                        ]
                  }
                  timeRanges={timeRanges}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  dateTimeRange={dateTimeRange}
                  onDateTimeRangeChange={setDateTimeRange}
                  selectWidthClassName="w-[220px]"
                />
                <EnergyDataTable
                  data={filteredData}
                  showSolar={
                    allParksHashToMode[activeHash] === "combined" ||
                    Boolean(solarHashToPark[activeHash]) ||
                    allParksHashToMode[activeHash] === "solar"
                  }
                  showWind={
                    allParksHashToMode[activeHash] === "combined" ||
                    Boolean(windHashToPark[activeHash]) ||
                    allParksHashToMode[activeHash] === "wind"
                  }
                />
              </div>
            ) : null
          ) : null}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
