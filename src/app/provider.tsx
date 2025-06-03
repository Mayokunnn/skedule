"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useGetUserQuery } from "@/api/auth"
import { Toaster } from "@/components/ui/sonner"

const queryClient = new QueryClient()

function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: user, isLoading, error } = useGetUserQuery()

  // Define public routes
  const publicRoutes = ["/", "/signin", "/signup"]
  const isPublicRoute = publicRoutes.includes(pathname)
  const isDashboardRoute = pathname === "/dashboard"


  useEffect(() => {
    // Handle unauthenticated users trying to access dashboard
    if (!user && isDashboardRoute) {
      router.replace("/signin")
    }

    // Handle authentication errors (e.g., invalid token)
    // if (error && isDashboardRoute) {
    //   localStorage.removeItem("token") // Clear invalid token
    //   localStorage.removeItem("userData")
    //   router.replace("/signin")
    // }
  }, [user, error, isDashboardRoute, pathname, router])

    // Show overlay during authentication check
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center min-h-screen bg-white bg-opacity-80 text-black z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#395B64]"></div>
          <p className="text-lg">Checking Authentication...</p>
        </div>
      </div>
    )
  }


  // Allow rendering for public routes or authenticated users
  if (isPublicRoute || user) {
    return <>{children}</>
  }

  // Return null while redirect is pending
  return null
}

export default function Provider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <ReactQueryDevtools initialIsOpen={false}/> */}
      <AuthProvider>{children}</AuthProvider>
      <Toaster position="top-right"/>
    </QueryClientProvider>
  )
}