"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ReactNode } from "react"

interface ExportDialogProps {
  children: ReactNode
  onConfirm: () => void
}

export function ExportDialog({ children, onConfirm }: ExportDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white text-[#395B64]">
        <DialogHeader>
          <DialogTitle>Confirm Export</DialogTitle>
          <DialogDescription>
            Are you sure you want to export the schedule? This will download the schedule as a file.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            className="border-[#395B64] text-[#395B64] hover:bg-[#e0e7ea]"
            onClick={() => {}}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#395B64] text-white hover:bg-[#2f4d56]"
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}