"use client"

import { useState, useEffect } from "react"
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
  {
    id: "KLA003",
    name: "Kampala North",
    status: "warning",
    lat: 0.36,
    lng: 32.59,
    lastUpdate: "25 min ago",
    battery: "30%",
    pm25: 35,
    pm10: 62,
  },
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
    id: "NBI002",
    name: "Nairobi West",
    status: "warning",
    lat: -1.31,
    lng: 36.8,
    lastUpdate: "30 min ago",
    battery: "15%",
    pm25: 18,
    pm10: 38,
  },
  {
    id: "DAR001",
    name: "Dar es Salaam Central",
    status: "active",
    lat: -6.7924,
    lng: 39.2083,
    lastUpdate: "8 min ago",
    battery: "90%",
    pm25: 35,
    pm10: 65,
  },
  {
    id: "DAR002",
    name: "Dar es Salaam Port",
    status: "offline",
    lat: -6.82,
    lng: 39.29,
    lastUpdate: "2 days ago",
    battery: "0%",
    pm25: 0,
    pm10: 0,
  },
  {
    id: "KGL001",
    name: "Kigali Central",
    status: "active",
    lat: -1.9441,
    lng: 30.0619,
    lastUpdate: "15 min ago",
    battery: "75%",
    pm25: 22,
    pm10: 40,
  },

  // West Africa
  {
    id: "ACC001",
    name: "Accra Central",
    status: "active",
    lat: 5.6037,
    lng: -0.187,
    lastUpdate: "15 min ago",
    battery: "82%",
    pm25: 42,
    pm10: 78,
  },
  {
    id: "ACC002",
    name: "Accra East",
    status: "active",
    lat: 5.62,
    lng: -0.17,
    lastUpdate: "20 min ago",
    battery: "88%",
    pm25: 38,
    pm10: 70,
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
    id: "LAG002",
    name: "Lagos Mainland",
    status: "warning",
    lat: 6.5,
    lng: 3.35,
    lastUpdate: "45 min ago",
    battery: "25%",
    pm25: 38,
    pm10: 72,
  },
  {
    id: "ABJ001",
    name: "Abidjan Central",
    status: "active",
    lat: 5.36,
    lng: -4.0083,
    lastUpdate: "18 min ago",
    battery: "80%",
    pm25: 36,
    pm10: 68,
  },
  {
    id: "DKR001",
    name: "Dakar Central",
    status: "offline",
    lat: 14.7167,
    lng: -17.4677,
    lastUpdate: "1 day ago",
    battery: "10%",
    pm25: 0,
    pm10: 0,
  },

  // North Africa
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
  {
    id: "CAI002",
    name: "Cairo East",
    status: "active",
    lat: 30.08,
    lng: 31.29,
    lastUpdate: "10 min ago",
    battery: "90%",
    pm25: 48,
    pm10: 88,
  },
  {
    id: "CAS001",
    name: "Casablanca Central",
    status: "active",
    lat: 33.5731,
    lng: -7.5898,
    lastUpdate: "22 min ago",
    battery: "85%",
    pm25: 32,
    pm10: 60,
  },
  {
    id: "TUN001",
    name: "Tunis Central",
    status: "warning",
    lat: 36.8065,
    lng: 10.1815,
    lastUpdate: "40 min ago",
    battery: "20%",
    pm25: 28,
    pm10: 55,
  },

  // Southern Africa
  {
    id: "JHB001",
    name: "Johannesburg Central",
    status: "active",
    lat: -26.2041,
    lng: 28.0473,
    lastUpdate: "8 min ago",
    battery: "88%",
    pm25: 30,
    pm10: 58,
  },
  {
    id: "CPT001",
    name: "Cape Town Central",
    status: "active",
    lat: -33.9249,
    lng: 18.4241,
    lastUpdate: "12 min ago",
    battery: "92%",
    pm25: 22,
    pm10: 42,
  },
  {
    id: "HRE001",
    name: "Harare Central",
    status: "offline",
    lat: -17.8252,
    lng: 31.0335,
    lastUpdate: "3 days ago",
    battery: "0%",
    pm25: 0,
    pm10: 0,
  },
  {
    id: "LUN001",
    name: "Lusaka Central",
    status: "active",
    lat: -15.3875,
    lng: 28.3228,
    lastUpdate: "25 min ago",
    battery: "70%",
    pm25: 34,
    pm10: 65,
  },

  // Central Africa
  {
    id: "KIN001",
    name: "Kinshasa Central",
    status: "active",
    lat: -4.4419,
    lng: 15.2663,
    lastUpdate: "30 min ago",
    battery: "65%",
    pm25: 40,
    pm10: 75,
  },
  {
    id: "YAO001",
    name: "Yaoundé Central",
    status: "warning",
    lat: 3.848,
    lng: 11.5021,
    lastUpdate: "50 min ago",
    battery: "18%",
    pm25: 32,
    pm10: 62,
  },
  {
    id: "LBV001",
    name: "Libreville Central",
    status: "active",
    lat: 0.4162,
    lng: 9.4673,
    lastUpdate: "15 min ago",
    battery: "78%",
    pm25: 28,
    pm10: 52,
  },

  // Horn of Africa
  {
    id: "ADD001",
    name: "Addis Ababa Central",
    status: "offline",
    lat: 9.0222,
    lng: 38.7468,
    lastUpdate: "1 day ago",
    battery: "5%",
    pm25: 0,
    pm10: 0,
  },
  {
    id: "ADD002",
    name: "Addis Ababa West",
    status: "active",
    lat: 9.01,
    lng: 38.72,
    lastUpdate: "20 min ago",
    battery: "82%",
    pm25: 36,
    pm10: 68,
  },
  {
    id: "KRT001",
    name: "Khartoum Central",
    status: "active",
    lat: 15.5007,
    lng: 32.5599,
    lastUpdate: "18 min ago",
    battery: "75%",
    pm25: 45,
    pm10: 85,
  },
]

export default function DevicesPage() {
  const [devices, setDevices] = useState(sampleDevices)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)

  // Filter devices based on search term and status filter
  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Count devices by status
  const activeDevices = devices.filter((d) => d.status === "active").length
  const warningDevices = devices.filter((d) => d.status === "warning").length
  const offlineDevices = devices.filter((d) => d.status === "offline").length

  // Set map as loaded after component mounts
  useEffect(() => {
    setIsMapLoaded(true)
  }, [])

  // Function to get battery icon based on percentage
  const getBatteryIcon = (batteryStr: string) => {
    const percentage = Number.parseInt(batteryStr.replace("%", ""))
    if (percentage >= 70) return <BatteryCharging className="h-6 w-6 text-green-500" />
    if (percentage >= 30) return <Battery className="h-6 w-6 text-yellow-500" />
    return <BatteryLow className="h-6 w-6 text-red-500" />
  }

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
            <div className="text-3xl font-bold">{devices.length}</div>
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
                style={{ width: `${(activeDevices / devices.length) * 100}%` }}
              ></div>
              <span className="text-xs text-muted-foreground ml-2">
                {Math.round((activeDevices / devices.length) * 100)}%
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
                style={{ width: `${(offlineDevices / devices.length) * 100}%` }}
              ></div>
              <span className="text-xs text-muted-foreground ml-2">
                {Math.round((offlineDevices / devices.length) * 100)}%
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
            {isMapLoaded && <AfricaMap devices={devices} onDeviceSelect={(id) => setSelectedDeviceId(id)} />}
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
                {filteredDevices.map((device, index) => (
                  <tr
                    key={device.id}
                    className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
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
                            {getBatteryIcon(device.battery)}
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

