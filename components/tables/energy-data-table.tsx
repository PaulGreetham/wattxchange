"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
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

export type EnergyTableRow = {
  date: string
  solar?: number
  wind?: number
}

type EnergyDataTableProps = {
  data: EnergyTableRow[]
  showSolar: boolean
  showWind: boolean
}

function buildColumns(showSolar: boolean, showWind: boolean): ColumnDef<EnergyTableRow>[] {
  const columns: ColumnDef<EnergyTableRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <div className="font-medium">{row.getValue("date")}</div>,
    },
  ]

  if (showSolar) {
    columns.push({
      accessorKey: "solar",
      header: () => <div className="text-right">Solar Data (MW)</div>,
      cell: ({ row }) => {
        const value = Number(row.getValue("solar") ?? 0)
        return <div className="text-right tabular-nums">{value.toFixed(2)}</div>
      },
    })
  }

  if (showWind) {
    columns.push({
      accessorKey: "wind",
      header: () => <div className="text-right">Wind Data (MW)</div>,
      cell: ({ row }) => {
        const value = Number(row.getValue("wind") ?? 0)
        return <div className="text-right tabular-nums">{value.toFixed(2)}</div>
      },
    })
  }

  return columns
}

export function EnergyDataTable({ data, showSolar, showWind }: EnergyDataTableProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

  const columns = React.useMemo(() => buildColumns(showSolar, showWind), [showSolar, showWind])

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

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search date..."
          value={(table.getColumn("date")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("date")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
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
            const total = table.getFilteredRowModel().rows.length
            const { pageIndex, pageSize } = table.getState().pagination
            const start = total === 0 ? 0 : pageIndex * pageSize + 1
            const end = Math.min(total, (pageIndex + 1) * pageSize)
            return `Showing ${start}-${end} of ${total} rows`
          })()}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
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
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

