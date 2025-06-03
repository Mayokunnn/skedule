import { SettingsIcon } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFC] text-[#395B64]">
      <div className="text-center">
        <SettingsIcon className="h-16 w-16 mx-auto mb-4 animate-pulse" />
        <h1 className="text-4xl font-bold mb-2">Settings Coming Soon</h1>
        <p className="text-lg">We&apos;re working on bringing you a powerful settings experience. Stay tuned!</p>
      </div>
    </div>
  )
}