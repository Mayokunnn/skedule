"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode } from "react";
import { useGenerateFairGreedyScheduleMutation } from "@/api/schedule";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface ScheduleDialogProps {
  children: ReactNode;
  dateRange: DateRange | undefined;
  onConfirm?: () => void;
}

export function ScheduleDialog({
  children,
  dateRange,
  onConfirm,
}: ScheduleDialogProps) {
  const {
    mutate: generateSchedule,
    isPending,
    error,
  } = useGenerateFairGreedyScheduleMutation();

  const handleConfirm = () => {
    if (dateRange?.from && dateRange?.to) {
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      generateSchedule(
        {
          from: fromDate,
          to: toDate,
          weekStart: fromDate,
        },
        {
          onSuccess: (data) => {
            console.log(data);
            onConfirm?.();
          },
          onError: (error) => {
            console.error("Schedule generation error:", error.message);
          },
        }
      );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white text-[#395B64]">
        <DialogHeader>
          <DialogTitle>Confirm Schedule Generation</DialogTitle>
          <DialogDescription>
            Generate a new schedule using the Fair Greedy algorithm for{" "}
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "LLL dd, y")} - ${format(
                  dateRange.to,
                  "LLL dd, y"
                )}`
              : "the selected date range"}
            .
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-red-500 text-sm">{error.message}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            className="border-[#395B64] text-[#395B64] hover:bg-[#e0e7ea]"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#395B64] text-white hover:bg-[#2f4d56]"
            onClick={handleConfirm}
            disabled={isPending || !dateRange?.from || !dateRange?.to}
          >
            {isPending ? "Generating..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
