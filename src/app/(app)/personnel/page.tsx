"use client"

import { User2Icon } from "lucide-react"

export default function PersonnelPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFC] text-[#395B64]">
      <div className="text-center">
        <User2Icon className="h-16 w-16 mx-auto mb-4 animate-pulse" />
        <h1 className="text-4xl font-bold mb-2">Personnel Coming Soon</h1>
        <p className="text-lg">Our personnel management features are in development. Check back soon!</p>
      </div>
    </div>
  )
}