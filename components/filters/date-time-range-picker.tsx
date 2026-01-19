"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type DateTimeRangeValue = {
  mode: "single" | "range"
  from?: Date
  to?: Date
  fromTime?: string
  toTime?: string
}

type DateTimeRangePickerProps = {
  value: DateTimeRangeValue
  onChange: (value: DateTimeRangeValue) => void
}

function formatTime(value?: string) {
  return value ?? "00:00"
}

function formatRangeLabel(value: DateTimeRangeValue) {
  if (!value.from) return "Pick date & time"
  const fromDate = format(value.from, "MMM d, yyyy")
  const fromTime = formatTime(value.fromTime)

  if (value.mode === "single") {
    const toTime = formatTime(value.toTime)
    return `${fromDate} ${fromTime}–${toTime}`
  }

  if (!value.to) return `${fromDate} ${fromTime}`
  const toDate = format(value.to, "MMM d, yyyy")
  const toTime = formatTime(value.toTime)
  return `${fromDate} ${fromTime} – ${toDate} ${toTime}`
}

export function DateTimeRangePicker({ value, onChange }: DateTimeRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: value.from,
    to: value.to,
  })

  React.useEffect(() => {
    setRange({ from: value.from, to: value.to })
  }, [value.from, value.to])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[220px] justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{formatRangeLabel(value)}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[90vw] overflow-auto p-4" align="end">
        <div className="flex flex-col gap-4">
          <Select
            value={value.mode}
            onValueChange={(mode) =>
              onChange({
                ...value,
                mode: mode as DateTimeRangeValue["mode"],
                to: mode === "single" ? value.from : value.to,
              })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single day</SelectItem>
              <SelectItem value="range">Range</SelectItem>
            </SelectContent>
          </Select>

          {value.mode === "single" ? (
            <Calendar
              mode="single"
              selected={value.from}
              onSelect={(date) => {
                onChange({
                  ...value,
                  from: date,
                  to: date,
                  fromTime: value.fromTime ?? "00:00",
                  toTime: value.toTime ?? "23:59",
                })
              }}
              numberOfMonths={1}
              className="rounded-lg border"
              captionLayout="dropdown"
            />
          ) : (
            <Calendar
              mode="range"
              selected={range}
              onSelect={(nextRange) => {
                setRange(nextRange)
                onChange({
                  ...value,
                  from: nextRange?.from,
                  to: nextRange?.to,
                  fromTime: nextRange?.from ? value.fromTime ?? "00:00" : value.fromTime,
                  toTime: nextRange?.to ? value.toTime ?? "23:59" : value.toTime,
                })
              }}
              numberOfMonths={2}
              className="rounded-lg border"
              captionLayout="dropdown"
            />
          )}

          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-20">Start</span>
              <Input
                type="time"
                value={value.fromTime ?? "00:00"}
                onChange={(event) => onChange({ ...value, fromTime: event.target.value })}
                step="60"
                className="bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-20">End</span>
              <Input
                type="time"
                value={value.toTime ?? "23:59"}
                onChange={(event) => onChange({ ...value, toTime: event.target.value })}
                step="60"
                className="bg-background"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

