"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Table as TableInstance,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type EnergyTableRow = {
  date: string
  solar?: number
  wind?: number
}

function formatNumber(value: number) {
  const rounded = Number(value.toFixed(2))
  const normalized = Object.is(rounded, -0) ? 0 : rounded
  return normalized.toFixed(2)
}

function formatDateTime(value: string) {
  try {
    return format(parseISO(value), "MMM d, yyyy HH:mm")
  } catch {
    return value
  }
}

function formatDateOnly(value: string) {
  try {
    return format(parseISO(value), "MMM d, yyyy")
  } catch {
    return value
  }
}

type EnergyDataTableProps = {
  data: EnergyTableRow[]
  showSolar: boolean
  showWind: boolean
}

function buildColumns({
  showSolar,
  showWind,
  dateFormatter,
  labelPrefix = "",
}: {
  showSolar: boolean
  showWind: boolean
  dateFormatter: (value: string) => string
  labelPrefix?: string
}): ColumnDef<EnergyTableRow>[] {
  const columns: ColumnDef<EnergyTableRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="font-medium">{dateFormatter(String(row.getValue("date")))}</div>
      ),
    },
  ]

  if (showSolar) {
    columns.push({
      accessorKey: "solar",
      header: () => <div className="text-right">{labelPrefix}Solar Data (MW)</div>,
      cell: ({ row }) => {
        const value = Number(row.getValue("solar") ?? 0)
        return <div className="text-right tabular-nums">{formatNumber(value)}</div>
      },
    })
  }

  if (showWind) {
    columns.push({
      accessorKey: "wind",
      header: () => <div className="text-right">{labelPrefix}Wind Data (MW)</div>,
      cell: ({ row }) => {
        const value = Number(row.getValue("wind") ?? 0)
        return <div className="text-right tabular-nums">{formatNumber(value)}</div>
      },
    })
  }

  if (showSolar && showWind) {
    columns.push({
      id: "total",
      header: () => <div className="text-right">{labelPrefix}Total Energy (MW)</div>,
      cell: ({ row }) => {
        const solar = Number(row.getValue("solar") ?? 0)
        const wind = Number(row.getValue("wind") ?? 0)
        const total = solar + wind
        return <div className="text-right font-semibold tabular-nums">{formatNumber(total)}</div>
      },
    })
  }

  return columns
}

function buildAverageRows(data: EnergyTableRow[]) {
  const averages = new Map<
    string,
    { date: string; solarTotal: number; solarCount: number; windTotal: number; windCount: number }
  >()

  data.forEach((row) => {
    const rawDate = String(row.date)
    let dayKey = rawDate
    try {
      dayKey = format(parseISO(rawDate), "yyyy-MM-dd")
    } catch {
      // Keep raw date for grouping
    }

    const current = averages.get(dayKey) ?? {
      date: dayKey,
      solarTotal: 0,
      solarCount: 0,
      windTotal: 0,
      windCount: 0,
    }

    if (typeof row.solar === "number" && Number.isFinite(row.solar)) {
      current.solarTotal += row.solar
      current.solarCount += 1
    }

    if (typeof row.wind === "number" && Number.isFinite(row.wind)) {
      current.windTotal += row.wind
      current.windCount += 1
    }

    averages.set(dayKey, current)
  })

  return Array.from(averages.values())
    .map((entry) => ({
      date: entry.date,
      solar: entry.solarCount ? entry.solarTotal / entry.solarCount : undefined,
      wind: entry.windCount ? entry.windTotal / entry.windCount : undefined,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function EnergyDataTable({ data, showSolar, showWind }: EnergyDataTableProps) {
  const [activeTab, setActiveTab] = React.useState("current")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [searchValue, setSearchValue] = React.useState("")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  const [averagePagination, setAveragePagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

  const columns = React.useMemo(
    () => buildColumns({ showSolar, showWind, dateFormatter: formatDateTime }),
    [showSolar, showWind]
  )
  const averageColumns = React.useMemo(
    () =>
      buildColumns({
        showSolar,
        showWind,
        dateFormatter: formatDateOnly,
        labelPrefix: "Average ",
      }),
    [showSolar, showWind]
  )

  const averageData = React.useMemo(() => buildAverageRows(data), [data])

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      columnFilters,
      pagination,
    },
  })
   
  const averageTable = useReactTable({
    data: averageData,
    columns: averageColumns,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setAveragePagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      columnFilters,
      pagination: averagePagination,
    },
  })

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchValue(value)
    setColumnFilters(value ? [{ id: "date", value }] : [])
  }

  const renderTable = (instance: TableInstance<EnergyTableRow>, cols: ColumnDef<EnergyTableRow>[]) => (
    <>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {instance.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {instance.getRowModel().rows?.length ? (
              instance.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={cols.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-sm">
          {(() => {
            const total = instance.getFilteredRowModel().rows.length
            const { pageIndex, pageSize } = instance.getState().pagination
            const start = total === 0 ? 0 : pageIndex * pageSize + 1
            const end = Math.min(total, (pageIndex + 1) * pageSize)
            return `Showing ${start}-${end} of ${total} rows`
          })()}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${instance.getState().pagination.pageSize}`}
              onValueChange={(value) => instance.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue placeholder={instance.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 25, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => instance.previousPage()}
              disabled={!instance.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => instance.nextPage()}
              disabled={!instance.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="w-full space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Input
            placeholder="Search date..."
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full sm:max-w-sm"
          />
          <TabsList className="ml-auto">
            <TabsTrigger value="current">Hourly Data</TabsTrigger>
            <TabsTrigger value="average">Daily Data</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="current">{renderTable(table, columns)}</TabsContent>
        <TabsContent value="average">{renderTable(averageTable, averageColumns)}</TabsContent>
      </Tabs>
    </div>
  )
}

