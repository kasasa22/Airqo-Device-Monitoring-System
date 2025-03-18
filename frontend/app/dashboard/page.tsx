"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Wifi,
  WifiOff,
  BarChart3,
  Wind,
  Thermometer,
  Droplets,
  Clock,
  Activity,
  TrendingUp,
  Layers,
  Settings,
  RefreshCw,
} from "lucide-react"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

// Dynamically import the map component
const AfricaMap = dynamic(() => import("./devices/africa-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
})

// Sample data
const airQualityData = [
  { date: "2024-01", pm25: 35, pm10: 65 },
  { date: "2024-02", pm25: 28, pm10: 55 },
  { date: "2024-03", pm25: 42, pm10: 78 },
  { date: "2024-04", pm25: 38, pm10: 70 },
  { date: "2024-05", pm25: 45, pm10: 85 },
  { date: "2024-06", pm25: 30, pm10: 60 },
]

const deviceStatusData = [
  { name: "Active", value: 68, color: "#4CAF50" },
  { name: "Maintenance", value: 15, color: "#FFC107" },
  { name: "Offline", value: 17, color: "#F44336" },
]

const alerts = [
  { id: 1, type: "critical", message: "Device KLA001 offline for 24 hours", location: "Kampala" },
  { id: 2, type: "warning", message: "Device NBI002 battery low (15%)", location: "Nairobi" },
  { id: 3, type: "critical", message: "Device ACC003 temperature exceeds threshold", location: "Accra" },
]

// Sample devices for the map
const sampleDevices = [
  { id: "KLA001", name: "Kampala Central", status: "active", lat: 0.3476, lng: 32.5825 },
  { id: "NBI001", name: "Nairobi CBD", status: "active", lat: -1.2921, lng: 36.8219 },
  { id: "DAR001", name: "Dar es Salaam Central", status: "active", lat: -6.7924, lng: 39.2083 },
  { id: "ACC001", name: "Accra Central", status: "active", lat: 5.6037, lng: -0.187 },
  { id: "LAG001", name: "Lagos Island", status: "active", lat: 6.455, lng: 3.3841 },
  { id: "CAI001", name: "Cairo Downtown", status: "active", lat: 30.0444, lng: 31.2357 },
  { id: "JHB001", name: "Johannesburg Central", status: "active", lat: -26.2041, lng: 28.0473 },
  { id: "NBI002", name: "Nairobi West", status: "warning", lat: -1.31, lng: 36.8 },
  { id: "LAG002", name: "Lagos Mainland", status: "warning", lat: 6.5, lng: 3.35 },
  { id: "DAR002", name: "Dar es Salaam Port", status: "offline", lat: -6.82, lng: 39.29 },
  { id: "ADD001", name: "Addis Ababa Central", status: "offline", lat: 9.0222, lng: 38.7468 },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <Button variant="outline" size="sm" className="flex items-center">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <Layers className="mr-2 h-5 w-5 text-primary" />
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">100</div>
            <p className="text-xs text-muted-foreground mt-1">Devices deployed across Africa</p>
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
            <div className="text-3xl font-bold">68</div>
            <div className="flex items-center mt-1">
              <div className="h-2 bg-green-500 rounded-full" style={{ width: "68%" }}></div>
              <span className="text-xs text-muted-foreground ml-2">68%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gradient-to-r from-yellow-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="mr-2 h-5 w-5 text-yellow-500" />
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">15</div>
            <div className="flex items-center mt-1">
              <div className="h-2 bg-yellow-500 rounded-full" style={{ width: "15%" }}></div>
              <span className="text-xs text-muted-foreground ml-2">15%</span>
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
            <div className="text-3xl font-bold">17</div>
            <div className="flex items-center mt-1">
              <div className="h-2 bg-red-500 rounded-full" style={{ width: "17%" }}></div>
              <span className="text-xs text-muted-foreground ml-2">17%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Air Quality Trends
            </CardTitle>
            <CardDescription>PM2.5 and PM10 measurements over time</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={airQualityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pm25" stroke="#8884d8" name="PM2.5" strokeWidth={2} />
                  <Line type="monotone" dataKey="pm10" stroke="#82ca9d" name="PM10" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Activity className="mr-2 h-4 w-4 text-primary" />
              Last updated: Today at 10:30 AM
            </div>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-primary" />
              Device Locations
            </CardTitle>
            <CardDescription>
              <Link href="/dashboard/devices" className="text-primary hover:underline flex items-center">
                View detailed map <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] w-full">
              <AfricaMap devices={sampleDevices} />
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-4 py-3 flex justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
                <span className="text-xs">Active</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></div>
                <span className="text-xs">Warning</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                <span className="text-xs">Offline</span>
              </div>
            </div>
            <Link href="/dashboard/devices" className="text-xs text-primary hover:underline">
              View all devices
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Device Status
            </CardTitle>
            <CardDescription>Current status of all devices</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {deviceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              Last updated: Today at 10:30 AM
            </div>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2 hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-primary" />
                Recent Alerts
              </CardTitle>
              <CardDescription>Latest device status notifications</CardDescription>
            </div>
            <Link href="/dashboard/alerts" className="text-sm text-primary flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={alert.type === "critical" ? "destructive" : "warning"}
                className="border-l-4 border-l-red-500 bg-red-50 text-red-800 hover:shadow-sm transition-shadow"
              >
                {alert.type === "critical" ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <AlertTitle className="font-medium">{alert.location}</AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              Last updated: Today at 10:30 AM
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Wind className="mr-2 h-5 w-5 text-primary" />
                Environmental Metrics
              </CardTitle>
              <CardDescription>Current average readings across all active devices</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Thermometer className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Temperature</p>
                  <p className="text-xl font-semibold">24.5°C</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Droplets className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Humidity</p>
                  <p className="text-xl font-semibold">65%</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <Wind className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">PM2.5</p>
                  <p className="text-xl font-semibold">36.3 µg/m³</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <Wind className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">PM10</p>
                  <p className="text-xl font-semibold">68.8 µg/m³</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
              PM2.5 levels improved by 2.5% from previous period
            </div>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Layers className="mr-2 h-5 w-5 text-primary" />
                Recent Devices
              </CardTitle>
              <CardDescription>Latest added or updated devices</CardDescription>
            </div>
            <Link href="/dashboard/devices" className="text-sm text-primary flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Wifi className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">KLA003</p>
                    <p className="text-sm text-muted-foreground">Kampala North</p>
                  </div>
                </div>
                <Badge className="bg-green-500">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Wifi className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">NBI004</p>
                    <p className="text-sm text-muted-foreground">Nairobi East</p>
                  </div>
                </div>
                <Badge className="bg-green-500">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-medium">LAG003</p>
                    <p className="text-sm text-muted-foreground">Lagos South</p>
                  </div>
                </div>
                <Badge className="bg-yellow-500">Warning</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                    <WifiOff className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium">ADD002</p>
                    <p className="text-sm text-muted-foreground">Addis Ababa West</p>
                  </div>
                </div>
                <Badge className="bg-red-500">Offline</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

