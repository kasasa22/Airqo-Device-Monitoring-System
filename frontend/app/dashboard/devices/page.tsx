"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  MapPin,
  Wifi,
  WifiOff,
  AlertTriangle,
  BarChart3,
  Plus,
  Layers,
  Battery,
  BatteryCharging,
  BatteryLow,
  ArrowRight,
} from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"

// Sample data with more devices across Africa
const sampleDevices = [
  // East Africa
  {
    id: "KLA001",
    name: "Kampala Central",
    status: "active",
    lat: 0.3476,
    lng: 32.5825,
    lastUpdate: "10 min ago",
    battery: "85%",
    pm25: 28,
    pm10: 52,
  },
  {
    id: "KLA002",
    name: "Kampala East",
    status: "active",
    lat: 0.33,
    lng: 32.61,
    lastUpdate: "5 min ago",
    battery: "92%",
    pm25: 32,
    pm10: 58,
  },
  // More devices...
  // Include just a few more for the example
  {
    id: "NBI001",
    name: "Nairobi CBD",
    status: "active",
    lat: -1.2921,
    lng: 36.8219,
    lastUpdate: "12 min ago",
    battery: "78%",
    pm25: 24,
    pm10: 45,
  },
  {
    id: "LAG001",
    name: "Lagos Island",
    status: "active",
    lat: 6.455,
    lng: 3.3841,
    lastUpdate: "7 min ago",
    battery: "75%",
    pm25: 48,
    pm10: 85,
  },
  {
    id: "CAI001",
    name: "Cairo Downtown",
    status: "active",
    lat: 30.0444,
    lng: 31.2357,
    lastUpdate: "5 min ago",
    battery: "95%",
    pm25: 52,
    pm10: 95,
  },
]

// Dynamically import the map component to avoid SSR issues
const AfricaMap = dynamic(() => import("./africa-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Loading map of Africa...</p>
      </div>
    </div>
  ),
})

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)

  // Count devices by status
  const activeDevices = useMemo(() => sampleDevices.filter((d) => d.status === "active").length, [])
  const warningDevices = useMemo(() => sampleDevices.filter((d) => d.status === "warning").length, [])
  const offlineDevices = useMemo(() => sampleDevices.filter((d) => d.status === "offline").length, [])

  // Filter devices based on search term and status filter
  const filteredDevices = useMemo(() => {
    return sampleDevices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || device.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter])

  // Delay showing the map to avoid React reconciliation issues
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMap(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Function to get battery icon based on percentage
  const getBatteryIcon = useCallback((batteryStr: string) => {
    const percentage = Number.parseInt(batteryStr.replace("%", ""))
    if (percentage >= 70) return <BatteryCharging className="h-6 w-6 text-green-500" />
    if (percentage >= 30) return <Battery className="h-6 w-6 text-yellow-500" />
    return <BatteryLow className="h-6 w-6 text-red-500" />
  }, [])

  // Handle device selection
  const handleDeviceSelect = useCallback((id: string) => {
    setSelectedDeviceId(id)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Device Management</h1>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Add Device
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <Layers className="mr-2 h-5 w-5 text-primary" />
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{sampleDevices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Deployed across Africa</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wifi className="mr-2 h-5 w-5 text-green-500" />
              Active Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{activeDevices}</div>
            <div className="flex items-center mt-1">
              <div
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${(activeDevices / sampleDevices.length) * 100}%` }}
              ></div>
              <span className="text-xs text-muted-foreground ml-2">
                {Math.round((activeDevices / sampleDevices.length) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gradient-to-r from-red-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <WifiOff className="mr-2 h-5 w-5 text-red-500" />
              Offline Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{offlineDevices}</div>
            <div className="flex items-center mt-1">
              <div
                className="h-2 bg-red-500 rounded-full"
                style={{ width: `${(offlineDevices / sampleDevices.length) * 100}%` }}
              ></div>
              <span className="text-xs text-muted-foreground ml-2">
                {Math.round((offlineDevices / sampleDevices.length) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-md transition-shadow overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-primary" />
            Device Locations Across Africa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            {showMap ? (
              <AfricaMap
                devices={sampleDevices}
                onDeviceSelect={handleDeviceSelect}
                selectedDeviceId={selectedDeviceId || undefined}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Loading map of Africa...</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-50 flex items-center justify-center space-x-6 border-t">
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm">Active ({activeDevices})</span>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-sm">Warning ({warningDevices})</span>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm">Offline ({offlineDevices})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Device List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search devices..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="border rounded-md p-2 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="warning">Warning</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Device ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Last Update</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Battery</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">PM2.5</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">PM10</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">{device.id}</td>
                    <td className="py-3 px-4">{device.name}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`flex items-center ${
                          device.status === "active"
                            ? "bg-green-500 hover:bg-green-600"
                            : device.status === "warning"
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        {device.status === "active" ? (
                          <Wifi className="mr-1 h-3 w-3" />
                        ) : device.status === "warning" ? (
                          <AlertTriangle className="mr-1 h-3 w-3" />
                        ) : (
                          <WifiOff className="mr-1 h-3 w-3" />
                        )}
                        {device.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{device.lastUpdate}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {device.status !== "offline" ? (
                          <>
                            {getBatteryIcon(device.battery || "0%")}
                            <span className="ml-2">{device.battery}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {device.status !== "offline" ? (
                        <div className="flex items-center">
                          <div
                            className={`h-2 w-2 rounded-full mr-2 ${
                              device.pm25 < 30 ? "bg-green-500" : device.pm25 < 50 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                          ></div>
                          {device.pm25} µg/m³
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {device.status !== "offline" ? (
                        <div className="flex items-center">
                          <div
                            className={`h-2 w-2 rounded-full mr-2 ${
                              device.pm10 < 50 ? "bg-green-500" : device.pm10 < 80 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                          ></div>
                          {device.pm10} µg/m³
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/devices/${device.id}`}
                        className="flex items-center text-primary hover:underline"
                      >
                        View Details <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

