import { format, parseISO, startOfHour } from "date-fns"

import type { ChartDatum, TimeRangeOption } from "@/lib/charts/types"

type Reading = {
  datetime: string
  MW: number
}

export function aggregateHourly(readings: Reading[], key: string): ChartDatum[] {
  const hourly = new Map<string, { total: number; count: number }>()

  readings.forEach((reading) => {
    if (!reading.datetime || typeof reading.MW !== "number") return
    try {
      const date = parseISO(reading.datetime)
      const hourKey = format(startOfHour(date), "yyyy-MM-dd'T'HH:00:00")
      const current = hourly.get(hourKey) ?? { total: 0, count: 0 }
      current.total += reading.MW
      current.count += 1
      hourly.set(hourKey, current)
    } catch {
      // Skip invalid dates
    }
  })

  return Array.from(hourly.entries())
    .map(([date, value]) => ({
      date,
      [key]: value.count ? value.total / value.count : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function buildTimeRangesFromDates(dates: string[]): TimeRangeOption[] {
  const years = Array.from(
    new Set(
      dates
        .map((date) => {
          try {
            return parseISO(date).getFullYear()
          } catch {
            return null
          }
        })
        .filter((year): year is number => year !== null)
    )
  ).sort((a, b) => a - b)

  const ranges: TimeRangeOption[] = [{ value: "all", label: "All time" }]

  years.forEach((year) => {
    const yearStart = format(new Date(year, 0, 1), "yyyy-MM-dd")
    const yearEnd = format(new Date(year, 11, 31), "yyyy-MM-dd")
    ranges.push({
      value: `${year}`,
      label: `${year}`,
      start: yearStart,
      end: yearEnd,
    })

    const quarters = [
      { value: "q1", label: "Q1", startMonth: 0 },
      { value: "q2", label: "Q2", startMonth: 3 },
      { value: "q3", label: "Q3", startMonth: 6 },
      { value: "q4", label: "Q4", startMonth: 9 },
    ]

    quarters.forEach((quarter) => {
      const startDate = new Date(year, quarter.startMonth, 1)
      const endDate = new Date(year, quarter.startMonth + 3, 0)
      ranges.push({
        value: `${year}-${quarter.value}`,
        label: `${quarter.label} ${year}`,
        start: format(startDate, "yyyy-MM-dd"),
        end: format(endDate, "yyyy-MM-dd"),
      })
    })
  })

  return ranges
}

