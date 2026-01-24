import { NextResponse } from "next/server"
import Papa from "papaparse"

import { aggregateHourly } from "@/lib/charts/utils"

type ParkInfo = {
  park_name: string
  timezone: string
  energy_type: "Wind" | "Solar"
}

type EnergyReading = {
  datetime: string
  MW: number
}

const REVALIDATE_SECONDS = 60 * 60

function getBaseUrl(requestUrl: string) {
  if (process.env.CSV_BASE_URL) return process.env.CSV_BASE_URL.replace(/\/$/, "")
  const origin = new URL(requestUrl).origin
  return `${origin}/data`
}

async function fetchCsv<T>(url: string) {
  const response = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } })
  const text = await response.text()
  const parsed = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  })
  return parsed.data
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode")
  const metric = searchParams.get("metric")
  const park = searchParams.get("park")

  if (!metric || (metric !== "solar" && metric !== "wind" && metric !== "combined")) {
    return NextResponse.json({ error: "Invalid metric" }, { status: 400 })
  }

  if (!mode || (mode !== "all" && mode !== "park")) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
  }

  const baseUrl = getBaseUrl(request.url)
  const parkInfoUrl = `${baseUrl}/park_info.csv`
  const parks = (await fetchCsv<ParkInfo>(parkInfoUrl)) as ParkInfo[]

  if (mode === "all") {
    const solarParks = parks.filter((parkItem) => parkItem.energy_type === "Solar")
    const windParks = parks.filter((parkItem) => parkItem.energy_type === "Wind")

    const loadParkData = async (parkList: ParkInfo[]) => {
      const parkData = await Promise.all(
        parkList.map(async (parkItem) =>
          fetchCsv<EnergyReading>(`${baseUrl}/${parkItem.park_name}.csv`)
        )
      )
      return parkData.flat()
    }

    if (metric === "solar") {
      const solarData = await loadParkData(solarParks)
      const aggregated = aggregateHourly(solarData, "solar")
      return NextResponse.json({ parkName: "All Parks", data: aggregated })
    }

    if (metric === "wind") {
      const windData = await loadParkData(windParks)
      const aggregated = aggregateHourly(windData, "wind")
      return NextResponse.json({ parkName: "All Parks", data: aggregated })
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
    return NextResponse.json({ parkName: "All Parks", data: combined })
  }

  if (!park) {
    return NextResponse.json({ error: "Missing park" }, { status: 400 })
  }

  const targetPark = parks.find((parkItem) => parkItem.park_name === park)
  if (!targetPark) {
    return NextResponse.json({ error: "Unknown park" }, { status: 404 })
  }

  if (
    (metric === "solar" && targetPark.energy_type !== "Solar") ||
    (metric === "wind" && targetPark.energy_type !== "Wind")
  ) {
    return NextResponse.json({ parkName: targetPark.park_name, data: [] })
  }

  const parkReadings = await fetchCsv<EnergyReading>(`${baseUrl}/${targetPark.park_name}.csv`)
  const aggregated = aggregateHourly(parkReadings, metric)
  return NextResponse.json({ parkName: targetPark.park_name, data: aggregated })
}

