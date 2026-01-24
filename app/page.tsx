"use client"

import * as React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { EnergyAreaChart } from "@/components/charts/energy-area-chart"
import { type DateTimeRangeValue } from "@/components/filters/date-time-range-picker"
import { EnergyDataTable } from "@/components/tables/energy-data-table"
import { ModeToggle } from "@/components/mode-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { applyDateTimeRangeFilter, applyTimeRangeFilter, buildTimeRangesFromDates } from "@/lib/charts/utils"
import { colors } from "@/lib/design"

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
  const [filterMode, setFilterMode] = React.useState<"preset" | "dateTime">("preset")
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
        if (allParksMode) {
          const response = await fetch(`/api/energy?mode=all&metric=${allParksMode}`)
          const payload = await response.json()
          setParkName(payload.parkName ?? "All Parks")
          setChartData(payload.data ?? [])
          setTimeRanges(buildTimeRangesFromDates((payload.data ?? []).map((item: { date: string }) => item.date)))
          return
        }

        if (!selectedPark || !selectedMetric) return
        const response = await fetch(
          `/api/energy?mode=park&metric=${selectedMetric}&park=${encodeURIComponent(selectedPark)}`
        )
        const payload = await response.json()
        setParkName(payload.parkName ?? selectedPark)
        setChartData(payload.data ?? [])
        setTimeRanges(buildTimeRangesFromDates((payload.data ?? []).map((item: { date: string }) => item.date)))
      } catch (error) {
        console.error("Failed to load park data", error)
      } finally {
        setLoading(false)
      }
    }

    setTimeRange("all")
    setDateTimeRange({ mode: "range" })
    setFilterMode("preset")
    loadPark()
  }, [activeHash])

  const filteredData = React.useMemo(() => {
    if (filterMode === "dateTime") {
      return applyDateTimeRangeFilter(chartData, dateTimeRange)
    }
    return applyTimeRangeFilter(chartData, timeRange, timeRanges)
  }, [chartData, timeRange, timeRanges, dateTimeRange, filterMode])

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
                  filterMode={filterMode}
                  onFilterModeChange={setFilterMode}
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
          ) : (
            <Card className="pt-0">
              <CardHeader className="border-b py-5">
                <CardTitle>Welcome to WattXchange</CardTitle>
                <CardDescription>
                  An internal dashboard for monitoring solar and wind production across all parks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">How to use the dashboard</p>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>- Use the left navigation to choose All Parks totals or a specific park.</li>
                    <li>- Each selection shows an interactive chart and the underlying data table.</li>
                    <li>- Switch between preset quarters/years or a custom date/time range.</li>
                    <li>- Search and paginate the table to inspect hourly values.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Key features</p>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>- Solar and wind data segmented by park and combined totals.</li>
                    <li>- Date/time range filtering with hourly granularity.</li>
                    <li>- Dark mode toggle in the top-right corner.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
