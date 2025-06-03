"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DateRange } from "react-day-picker"
import { format, isSameDay, startOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { useAssignSingleScheduleMutation } from "@/api/schedule"
import { useGetAllEmployeesQuery } from "@/api/user"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface ScheduleDataTableProps {
  dateRange: DateRange | undefined
}

interface EmployeeRow {
  id: string
  email: string
  fullName: string
  position: string
  avatar: string
  schedules: {
    [key: string]: { id: string; date: Date } | undefined
  }
}

// Tailwind background colors for scheduled days
const colors = [
  "bg-blue-200",
  "bg-green-200",
  "bg-yellow-200",
  "bg-pink-200",
  "bg-purple-200",
  "bg-teal-200",
  "bg-orange-200",
]

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)]

export function ScheduleDataTable({ dateRange }: ScheduleDataTableProps) {
  const {
    data: employees,
    isLoading: employeesLoading,
    error: employeesError,
  } = useGetAllEmployeesQuery()
  const assignSchedule = useAssignSingleScheduleMutation()
  const queryClient = useQueryClient()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedEmployee, setSelectedEmployee] = React.useState<{ id: string; fullName: string } | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

  // Generate week dates for Monday to Friday based on dateRange
  const weekDates: { [key: string]: Date } = React.useMemo(() => {
    const dates: { [key: string]: Date } = {}
    const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday"]
    if (dateRange?.from) {
      let currentDate = startOfDay(toZonedTime(dateRange.from, "Africa/Lagos"))
      // Adjust to start on Monday in WAT
      while (format(currentDate, "EEEE").toLowerCase() !== "monday") {
        currentDate = new Date(currentDate.setDate(currentDate.getDate() - 1))
      }
      for (let i = 0; i < 5; i++) {
        dates[dayNames[i]] = startOfDay(new Date(currentDate))
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
      }
    }
    return dates
  }, [dateRange])

  // Map schedules to employees
  const data: EmployeeRow[] = React.useMemo(() => {
    if (!employees) return []

    interface ApiSchedule {
      id: string
      workday: {
        date: string // ISO string
      }
    }

    interface ApiEmployee {
      id: string
      email: string
      fullName: string
      role: string
      position: string
      schedules: ApiSchedule[]
    }

    return (employees as ApiEmployee[]).map((employee: ApiEmployee): EmployeeRow => {
      const employeeSchedules: EmployeeRow["schedules"] = {
        monday: undefined,
        tuesday: undefined,
        wednesday: undefined,
        thursday: undefined,
        friday: undefined,
      }

      // Map schedules based on workday.date
      employee.schedules.forEach((schedule: ApiSchedule) => {
        // Convert UTC workday.date to WAT
        const scheduleDate: Date = startOfDay(
          toZonedTime(new Date(schedule.workday.date), "Africa/Lagos")
        )

        // Filter by dateRange if provided
        if (
          !dateRange?.from ||
          !dateRange?.to ||
          (scheduleDate >= startOfDay(toZonedTime(dateRange.from, "Africa/Lagos")) &&
            scheduleDate <= startOfDay(toZonedTime(dateRange.to, "Africa/Lagos")))
        ) {
          for (const day of Object.keys(weekDates)) {
            if (weekDates[day] && isSameDay(scheduleDate, weekDates[day])) {
              employeeSchedules[day] = { id: schedule.id, date: scheduleDate }
              break
            }
          }
        }
      })

      return {
        id: employee.id,
        email: employee.email,
        fullName: employee.fullName,
        position: employee.position, // Use role since position isn't in data
        avatar: `https://i.pravatar.cc/150?u=${employee.email}`,
        schedules: employeeSchedules,
      }
    })
  }, [employees, dateRange, weekDates])

  const handleAssignSchedule = () => {
    if (selectedEmployee && selectedDate) {
      assignSchedule.mutate(
        {
          employeeId: selectedEmployee.id,
          date: format(selectedDate, "yyyy-MM-dd"),
        },
        {
          onSuccess: () => {
            toast.success("Schedule Assigned", {
              description: `Assigned ${selectedEmployee.fullName} to ${format(selectedDate, "LLL dd, y")}.`,
            })
            queryClient.invalidateQueries({ queryKey: ["allEmployees"] })
            setDialogOpen(false)
            setSelectedEmployee(null)
            setSelectedDate(null)
          },
          onError: (error) => {
            toast.error("Error", {
              description: error.message,
            })
          },
        }
      )
    }
  }

  const columns: ColumnDef<EmployeeRow>[] = [
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <Input
          placeholder="Search employee..."
          onChange={(e) => column.setFilterValue(e.target.value)}
          className="w-full p-3 border-0"
        />
      ),
      cell: ({ row }: { row: import("@tanstack/react-table").Row<EmployeeRow> }) => {
        const data = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={data.avatar} />
              <AvatarFallback>{data.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{data.fullName}</div>
              <div className="text-sm text-muted-foreground">{data.position}</div>
            </div>
          </div>
        )
      },
    },
    ...["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => ({
      id: day.toLowerCase(),
      header: day,
      cell: ({ row }: { row: import("@tanstack/react-table").Row<EmployeeRow> }) => {
        const schedule = row.original.schedules[day.toLowerCase()]
        const color = getRandomColor()
        const weekDate = weekDates[day.toLowerCase()]
        return (
          <div className="flex justify-center w-full h-full">
            {schedule ? (
              <div
                className={`${color} w-full h-12 flex items-center justify-center rounded-md`}
                title={`Scheduled on ${format(schedule.date, "LLL dd, y")}`}
              >
                Pay Edge
              </div>
            ) : (
              <button
                className="w-6 h-6 flex items-center cursor-pointer justify-center rounded-sm border-2 hover:bg-gray-100"
                onClick={() => {
                  if (weekDate) {
                    setSelectedEmployee({ id: row.original.id, fullName: row.original.fullName })
                    setSelectedDate(weekDate)
                    setDialogOpen(true)
                  }
                }}
                disabled={!weekDate}
                title={weekDate ? `Assign ${row.original.fullName} to ${format(weekDate, "LLL dd, y")}` : "No date available"}
              >
                <Plus />
              </button>
            )}
          </div>
        )
      },
    })),
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  })

  if (employeesLoading) {
    return <p className="text-[#395B64]">Loading employees...</p>
  }

  if (employeesError) {
    return <p className="text-red-500">Error: {employeesError.message}</p>
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="border p-4">
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="border p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {table.getRowCount()} employees
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white text-[#395B64]">
          <DialogHeader>
            <DialogTitle>Confirm Schedule Assignment</DialogTitle>
            <DialogDescription>
              Assign {selectedEmployee?.fullName} to the schedule on{" "}
              {selectedDate ? format(selectedDate, "LLL dd, y") : "selected date"}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-[#395B64] text-[#395B64] hover:bg-[#e0e7ea]"
              onClick={() => setDialogOpen(false)}
              disabled={assignSchedule.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#395B64] text-white hover:bg-[#2f4d56]"
              onClick={handleAssignSchedule}
              disabled={assignSchedule.isPending}
            >
              {assignSchedule.isPending ? "Assigning..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}