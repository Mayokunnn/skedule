"use client"

import { DatePickerWithRange } from "@/components/common/schedule/DatePicker"
import { ScheduleDataTable } from "@/components/common/schedule/ScheduleTable"
import { PublishDialog } from "@/components/common/schedule/PublishDialog"
import { ExportDialog } from "@/components/common/schedule/ExportDialog"
import { ScheduleDialog } from "@/components/common/schedule/ScheduleDialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PrinterIcon } from "lucide-react"
import { useState } from "react"
import { DateRange } from "react-day-picker"
import { useQueryClient } from "@tanstack/react-query"

export default function Schedule() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 5, 2), // Jun 2, 2025 (Monday)
    to: new Date(2025, 5, 6), // Jun 6, 2025 (Friday)
  })
  const queryClient = useQueryClient()


  const handlePublish = () => {
    console.log("Publishing schedule...")
  }

  const handleExport = () => {
    console.log("Exporting schedule...")
  }

  const handleSkeduleConfirm = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] })
    queryClient.invalidateQueries({ queryKey: ["employees"] })
  }

  return (
    <div className="text-[#395B64] w-full">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-black font-bold text-2xl">My Calendar</h2>
      </div>
      <Separator className="my-8 bg-[#585a5b] h-[1px] w-full" />
      <Card className="p-4">
        <CardHeader className="p-3 gap-0 border-b-1">
          <div className="flex justify-between items-center pt-3">
            <CardTitle className="text-xl">Skeduler</CardTitle>
            <CardDescription>Manage your team’s schedule</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex justify-between items-center">
            <DatePickerWithRange
              className="w-full max-w-[300px]"
              onDateChange={setDateRange}
            />
            <div className="w-full flex justify-end gap-2">
              <ScheduleDialog dateRange={dateRange} onConfirm={handleSkeduleConfirm}>
                <Button className="bg-[#395B64] text-white rounded-md px-4 py-2 cursor-pointer">
                  Skedule
                </Button>
              </ScheduleDialog>
              <ExportDialog onConfirm={handleExport}>
                <Button className="text-[#395B64] bg-sidebar-accent hover:bg-[#585a5b] rounded-md px-4 py-2 cursor-pointer">
                  Export
                </Button>
              </ExportDialog>
              <PublishDialog onConfirm={handlePublish}>
                <Button className="bg-[#395B64] text-white rounded-md px-4 py-2">
                  <PrinterIcon className="text-white cursor-pointer" /> Publish
                </Button>
              </PublishDialog>
            </div>
          </div>
          <div className="w-full mt-4">
            <ScheduleDataTable dateRange={dateRange} />
          </div>
        </CardContent>
        <CardFooter>
          <p>Schedule Management</p>
        </CardFooter>
      </Card>
    </div>
  )
}