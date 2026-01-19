export type TimeRangeOption = {
  value: string
  label: string
  start?: string
  end?: string
}

export type SeriesConfig = {
  key: string
  label: string
  color?: string
}

export type ChartDatum = {
  date: string
  [key: string]: number | string | undefined
}

export type DateTimeRange = {
  mode: "single" | "range"
  from?: Date
  to?: Date
  fromTime?: string
  toTime?: string
}

