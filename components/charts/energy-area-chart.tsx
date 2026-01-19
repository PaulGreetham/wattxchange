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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DateTimeRangePicker, type DateTimeRangeValue } from "@/components/filters/date-time-range-picker"
import { colors } from "@/lib/design"
import type { ChartDatum, SeriesConfig, TimeRangeOption } from "@/lib/charts/types"

type EnergyAreaChartProps = {
  title: string
  description?: string
  data: ChartDatum[]
  series: SeriesConfig[]
  timeRanges?: TimeRangeOption[]
  timeRange?: string
  onTimeRangeChange?: (value: string) => void
  dateTimeRange: DateTimeRangeValue
  onDateTimeRangeChange: (value: DateTimeRangeValue) => void
  filterMode: "preset" | "dateTime"
  onFilterModeChange: (mode: "preset" | "dateTime") => void
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
  timeRange = "all",
  onTimeRangeChange,
  dateTimeRange,
  onDateTimeRangeChange,
  filterMode,
  onFilterModeChange,
  selectWidthClassName = "w-[200px]",
}: EnergyAreaChartProps) {
  const handleTimeRangeChange = onTimeRangeChange ?? (() => {})
  const filterSwitchId = React.useId()

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
      <CardHeader className="flex flex-col gap-3 space-y-0 border-b py-5 sm:flex-row sm:items-center">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
          <div className="flex items-center gap-2">
            <Switch
              id={filterSwitchId}
              checked={filterMode === "dateTime"}
              onCheckedChange={(checked) =>
                onFilterModeChange(checked ? "dateTime" : "preset")
              }
            />
            <Label htmlFor={filterSwitchId} className="text-muted-foreground">
              Toggle Date Filter
            </Label>
          </div>
          {filterMode === "preset" && timeRanges.length > 1 ? (
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
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
          {filterMode === "dateTime" ? (
            <DateTimeRangePicker value={dateTimeRange} onChange={onDateTimeRangeChange} />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
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
                  labelFormatter={(value) => format(parseISO(String(value)), "MMM d, yyyy HH:mm")}
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

