"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Calendar,
  LayoutDashboardIcon,
  SettingsIcon,
  User2Icon,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = React.useState<{ fullName: string; email: string } | null>(null)

  // Fetch user from localStorage
  React.useEffect(() => {
    const storedUser = localStorage.getItem("userData")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing user from localStorage:", error)
      }
    }
  }, [])

  // Menu items
  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Personnel",
      url: "/personnel",
      icon: User2Icon,
    },
    {
      title: "Schedule",
      url: "/schedule",
      icon: Calendar,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: SettingsIcon,
    },
  ]

  return (
    <Sidebar collapsible="icon" className="bg-[#F9FAFC]">
      <SidebarHeader>
        <h1
          onClick={() => router.push("/")}
          className="w-full text-[#395B64] text-center text-3xl font-bold cursor-pointer"
        >
          Sk
        </h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="py-6">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    className={`cursor-pointer ${
                      pathname === item.url
                        ? "bg-[#395b64] text-white hover:bg-[#395b64] hover:text-white"
                        : "text-[#395B64]"
                    }`}
                  >
                    <p
                      onClick={() => item.url !== "#" && router.push(item.url)}
                      className="text-3xl p-6 flex justify-center"
                    >
                      <item.icon className="h-12" />
                    </p>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col items-center gap-3 p-4 border-t border-gray-200">
          <Avatar>
            <AvatarFallback>
              {user?.fullName ? user.fullName.charAt(0) : "U"}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            size="sm"
            className="border-[#395B64] cursor-pointer text-[#395B64] hover:bg-[#e0e7ea]"
            onClick={() => {
              // Placeholder for logout
              console.log("Logout clicked")
            }}
          >
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}