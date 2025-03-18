"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { BarChart3, MapPin, Bell, Settings, Menu, X, Home, Users, FileText, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

// Update the imports to include useRouter
import { useRouter } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Inside the DashboardLayout component, add the router
  const router = useRouter()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-primary text-white transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="flex items-center justify-between p-4 border-b border-primary-foreground/10">
          <div className={`flex items-center ${!sidebarOpen && "justify-center w-full"}`}>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-8ystA7fUvSxUyn8lJlJplrEDq9D64a.png"
              alt="AirQo Logo"
              width={sidebarOpen ? 100 : 40}
              height={35}
              className="object-contain"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`text-white p-1 rounded-md hover:bg-primary-foreground/10 ${!sidebarOpen && "hidden"}`}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/dashboard" className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10">
                <Home className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Overview</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/analytics"
                className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10"
              >
                <BarChart3 className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Analytics</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/devices"
                className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10"
              >
                <MapPin className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Devices</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/alerts"
                className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10"
              >
                <Bell className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Alerts</span>}
              </Link>
            </li>
            <li>
              <Link href="/dashboard/users" className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10">
                <Users className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Users</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/reports"
                className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10"
              >
                <FileText className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Reports</span>}
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/settings"
                className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10"
              >
                <Settings className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Settings</span>}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-md hover:bg-gray-100 ${sidebarOpen && "hidden md:block"}`}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center space-x-4">
            <Bell className="h-5 w-5 text-gray-500 cursor-pointer hover:text-primary transition-colors" />
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">JD</div>
              {/* Update the logout button to use the router */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center text-gray-600 hover:text-primary"
                onClick={() => {
                  // Add logout functionality with router
                  router.push("/login?logout=true")
                }}
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}

