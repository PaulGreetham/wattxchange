import { readFile } from "node:fs/promises"
import path from "node:path"
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

export const runtime = "nodejs"

const DATA_DIR = path.join(process.cwd(), "public", "data")

async function readCsvFile<T>(fileName: string) {
  const filePath = path.join(DATA_DIR, fileName)
  const text = await readFile(filePath, "utf8")
  const parsed = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  })
  return parsed.data
}

export async function GET(request: Request) {
  try {
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

    const parks = (await readCsvFile<ParkInfo>("park_info.csv")) as ParkInfo[]

    if (mode === "all") {
      const solarParks = parks.filter((parkItem) => parkItem.energy_type === "Solar")
      const windParks = parks.filter((parkItem) => parkItem.energy_type === "Wind")

      const loadParkData = async (parkList: ParkInfo[]) => {
        const parkData = await Promise.all(
          parkList.map(async (parkItem) =>
            readCsvFile<EnergyReading>(`${parkItem.park_name}.csv`)
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

    const parkReadings = await readCsvFile<EnergyReading>(`${targetPark.park_name}.csv`)
    const aggregated = aggregateHourly(parkReadings, metric)
    return NextResponse.json({ parkName: targetPark.park_name, data: aggregated })
  } catch (error) {
    console.error("Failed to read CSV data", error)
    return NextResponse.json({ error: "Failed to load CSV data" }, { status: 500 })
  }
}

