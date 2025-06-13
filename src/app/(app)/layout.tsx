import { AppSidebar } from "@/components/common/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
        <SidebarProvider>
        <AppSidebar />
        <main className="p-1 md:p-10 w-full">
          {children}
        </main>
      </SidebarProvider>
    );
  }
  