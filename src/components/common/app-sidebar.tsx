"use client";
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
} from "@/components/ui/sidebar";
import {
  Calendar,
  FlagIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  User2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function AppSidebar() {
  const router = useRouter();

  // Menu items.
  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Personnel",
      url: "#",
      icon: User2Icon,
    },
    {
      title: "Schedule",
      url: "/schedule",
      icon: Calendar,
    },
    {
      title: "Notifications",
      url: "#",
      icon: FlagIcon,
    },
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
  ];
  return (
    <Sidebar collapsible="icon" className="bg-[#F9FAFC]">
      <SidebarHeader>
        <h1
          onClick={() => router.push("/")}
          className="w-full text-[#395B64] text-center text-3xl font-bold"
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
                  <SidebarMenuButton asChild size={"lg"}>
                    <p
                      onClick={() => router.push(item.url)}
                      className="text-3xl p-6 flex justify-center"
                    >
                      <item.icon className="text-[#395B64] h-12" />
                    </p>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
