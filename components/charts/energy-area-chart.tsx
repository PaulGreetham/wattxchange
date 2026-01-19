"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { format, parseISO } from "date-fns"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { colors } from "@/lib/design"
import type { ChartDatum, SeriesConfig, TimeRangeOption } from "@/lib/charts/types"

type EnergyAreaChartProps = {
  title: string
  description?: string
  data: ChartDatum[]
  series: SeriesConfig[]
  timeRanges?: TimeRangeOption[]
  defaultTimeRange?: string
  selectWidthClassName?: string
}

const defaultTimeRanges: TimeRangeOption[] = [{ value: "all", label: "All time" }]

const seriesColorFallbacks: Record<string, string> = {
  wind: colors.wind,
  solar: colors.solar,
}

export function EnergyAreaChart({
  title,
  description,
  data,
  series,
  timeRanges = defaultTimeRanges,
  defaultTimeRange = "all",
  selectWidthClassName = "w-[200px]",
}: EnergyAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState(defaultTimeRange)

  const filteredData = React.useMemo(() => {
    if (!timeRanges.length || timeRange === "all") return data

    const range = timeRanges.find((option) => option.value === timeRange)
    if (!range || (!range.start && !range.end)) return data

    const start = range.start ? parseISO(range.start) : null
    const end = range.end ? parseISO(range.end) : null

    return data.filter((item) => {
      const date = parseISO(String(item.date))
      if (start && date < start) return false
      if (end && date > end) return false
      return true
    })
  }, [data, timeRange, timeRanges])

  const chartConfig = React.useMemo(() => {
    return series.reduce<ChartConfig>((acc, item) => {
      acc[item.key] = {
        label: item.label,
        color: item.color ?? seriesColorFallbacks[item.key],
      }
      return acc
    }, {})
  }, [series])

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {timeRanges.length > 1 ? (
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className={`hidden ${selectWidthClassName} rounded-lg sm:ml-auto sm:flex`}
              aria-label="Select a value"
            >
              <SelectValue placeholder={timeRanges[0]?.label ?? "All time"} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {timeRanges.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-lg">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              {series.map((item) => {
                const color = item.color ?? seriesColorFallbacks[item.key] ?? "var(--chart-1)"
                return (
                  <linearGradient key={item.key} id={`fill-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                )
              })}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => format(parseISO(String(value)), "MMM d")}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => format(parseISO(String(value)), "MMM d, yyyy")}
                  indicator="dot"
                />
              }
            />
            {series.map((item) => {
              const color = item.color ?? seriesColorFallbacks[item.key] ?? "var(--chart-1)"
              return (
                <Area
                  key={item.key}
                  dataKey={item.key}
                  type="natural"
                  fill={`url(#fill-${item.key})`}
                  stroke={color}
                  stackId="a"
                />
              )
            })}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

