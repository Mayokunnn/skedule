"use client";

import * as React from "react";
import { startOfWeek, addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";

interface DatePickerWithRangeProps {
  className?: string;
  date?: DateRange | undefined;
  onDateChange?: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
}: DatePickerWithRangeProps) {
  // Use provided date or fallback to current week
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(
    date
  );

  // Sync internalDate with prop
  React.useEffect(() => {
    setInternalDate(date);
    console.log("DatePicker sync date:", date);
  }, [date]);

  const handleDayClick = (day: Date) => {
    const weekStart = startOfWeek(day, { weekStartsOn: 1 }); // Monday
    const newDate = {
      from: weekStart,
      to: addDays(weekStart, 4), // Friday
    };
    setInternalDate(newDate);
    console.log("DatePicker selected range:", newDate);
    onDateChange?.(newDate);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !internalDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {internalDate?.from ? (
              internalDate.to ? (
                <>
                  {format(internalDate.from, "LLL dd, y")} -{" "}
                  {format(internalDate.to, "LLL dd, y")}
                </>
              ) : (
                format(internalDate.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={internalDate?.from}
            selected={internalDate}
            onDayClick={handleDayClick}
            numberOfMonths={1}
            showWeekNumber
            showOutsideDays
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}