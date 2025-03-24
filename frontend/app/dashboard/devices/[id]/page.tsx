"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  ArrowLeft,
  Battery,
  BatteryCharging,
  BatteryLow,
  Clock,
  Download,
  MapPin,
  RefreshCw,
  Settings,
  Thermometer,
  Wifi,
  WifiOff,
  Wind,
  AlertTriangle,
  Activity,
  Calendar,
  Droplets,
} from "lucide-react"
import dynamic from "next/dynamic"

// Sample device data
const sampleDevices = [
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
    temperature: 24.5,
    humidity: 65,
    installDate: "2023-05-15",
    lastMaintenance: "2024-01-20",
    firmwareVersion: "2.3.1",
    signalStrength: "92%",
    location: "Kampala City Center, Uganda",
    description: "Monitoring air quality in central Kampala business district",
  },
  // More devices...
]

// Sample historical data
const historicalData = [
  { date: "2024-06-01", pm25: 32, pm10: 58, temperature: 24.2, humidity: 62 },
  { date: "2024-06-02", pm25: 28, pm10: 52, temperature: 25.1, humidity: 60 },
  { date: "2024-06-03", pm25: 35, pm10: 65, temperature: 24.8, humidity: 63 },
  { date: "2024-06-04", pm25: 42, pm10: 78, temperature: 23.9, humidity: 65 },
  { date: "2024-06-05", pm25: 38, pm10: 70, temperature: 24.5, humidity: 64 },
  { date: "2024-06-06", pm25: 30, pm10: 55, temperature: 25.2, humidity: 61 },
  { date: "2024-06-07", pm25: 25, pm10: 48, temperature: 25.8, humidity: 58 },
]

// Sample maintenance history
const maintenanceHistory = [
  {
    date: "2024-02-05",
    type: "Routine",
    description: "Regular maintenance and sensor calibration",
    technician: "John Doe",
  },
  {
    date: "2023-11-15",
    type: "Repair",
    description: "Battery replacement and firmware update",
    technician: "Sarah Smith",
  },
  {
    date: "2023-08-22",
    type: "Calibration",
    description: "Sensor calibration and dust filter cleaning",
    technician: "Michael Johnson",
  },
  {
    date: "2023-05-10",
    type: "Installation",
    description: "Initial device installation and setup",
    technician: "David Wilson",
  },
]

// Dynamically import the map component with no SSR
const DeviceMap = dynamic(() => import("../device-map"), {
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

export default function DeviceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [device, setDevice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    // In a real app, you would fetch the device data from an API
    // For now, we'll use the sample data
    const deviceId = params.id as string
    const foundDevice = sampleDevices.find((d) => d.id === deviceId)

    if (foundDevice) {
      setDevice(foundDevice)
    }

    setLoading(false)

    // Delay showing the map to avoid React reconciliation issues
    const timer = setTimeout(() => {
      setShowMap(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [params.id])

  // Function to get battery icon based on percentage
  const getBatteryIcon = useCallback((batteryStr: string) => {
    const percentage = Number.parseInt(batteryStr.replace("%", ""))
    if (percentage >= 70) return <BatteryCharging className="h-6 w-6 text-green-500" />
    if (percentage >= 30) return <Battery className="h-6 w-6 text-yellow-500" />
    return <BatteryLow className="h-6 w-6 text-red-500" />
  }, [])

  // Function to get status icon
  const getStatusIcon = useCallback((status: string) => {
    if (status === "active") return <Wifi className="h-5 w-5 text-green-500" />
    if (status === "warning") return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <WifiOff className="h-5 w-5 text-red-500" />
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
          <p>Loading device information...</p>
        </div>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Devices
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Device Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The device you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push("/dashboard/devices")}>View All Devices</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Devices
        </Button>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  {getStatusIcon(device.status)}
                  <CardTitle className="ml-2">{device.name}</CardTitle>
                </div>
                <CardDescription className="mt-1">
                  ID: {device.id} • {device.location}
                </CardDescription>
              </div>
              <Badge
                className={
                  device.status === "active"
                    ? "bg-green-500 hover:bg-green-600"
                    : device.status === "warning"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-red-500 hover:bg-red-600"
                }
              >
                {device.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] w-full">
              {showMap ? (
                <DeviceMap devices={[device]} selectedDeviceId={device.id} />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Loading map...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t p-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              Last updated: {device.lastUpdate}
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <CardTitle className="text-lg">Current Readings</CardTitle>
            <CardDescription>Latest measurements from this device</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <Wind className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PM2.5</p>
                    <p className="text-xl font-semibold">{device.pm25} µg/m³</p>
                  </div>
                </div>
                <div
                  className={`h-3 w-3 rounded-full ${
                    device.pm25 < 30 ? "bg-green-500" : device.pm25 < 50 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                ></div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <Wind className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PM10</p>
                    <p className="text-xl font-semibold">{device.pm10} µg/m³</p>
                  </div>
                </div>
                <div
                  className={`h-3 w-3 rounded-full ${
                    device.pm10 < 50 ? "bg-green-500" : device.pm10 < 80 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                ></div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Thermometer className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Temperature</p>
                    <p className="text-xl font-semibold">{device.temperature}°C</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Droplets className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Humidity</p>
                    <p className="text-xl font-semibold">{device.humidity}%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="historical">Historical Data</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="settings">Device Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <CardTitle className="text-lg">Device Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Device ID</p>
                      <p className="font-medium">{device.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex items-center">
                        {getStatusIcon(device.status)}
                        <span className="ml-1 capitalize">{device.status}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Installation Date</p>
                      <p className="font-medium">{device.installDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Maintenance</p>
                      <p className="font-medium">{device.lastMaintenance}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Firmware Version</p>
                      <p className="font-medium">{device.firmwareVersion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Signal Strength</p>
                      <p className="font-medium">{device.signalStrength}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{device.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{device.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <CardTitle className="text-lg">Device Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium capitalize">{device.status}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        device.status === "active"
                          ? "bg-green-500 hover:bg-green-600"
                          : device.status === "warning"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-red-500 hover:bg-red-600"
                      }
                    >
                      {device.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        {getBatteryIcon(device.battery)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Battery</p>
                        <p className="font-medium">{device.battery}</p>
                      </div>
                    </div>
                    <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          Number.parseInt(device.battery) >= 70
                            ? "bg-green-500"
                            : Number.parseInt(device.battery) >= 30
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: device.battery }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <Wifi className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Signal Strength</p>
                        <p className="font-medium">{device.signalStrength}</p>
                      </div>
                    </div>
                    <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: device.signalStrength }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Update</p>
                        <p className="font-medium">{device.lastUpdate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Historical Data</CardTitle>
                  <CardDescription>Air quality measurements over time</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <select className="border rounded-md p-2 text-sm">
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
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
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <CardTitle className="text-lg">Temperature History</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#ff7300"
                        name="Temperature (°C)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <CardTitle className="text-lg">Humidity History</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="humidity" stroke="#0088fe" name="Humidity (%)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Maintenance History</CardTitle>
                  <CardDescription>Record of all maintenance activities</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  Schedule Maintenance
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Technician</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceHistory.map((record, index) => (
                      <tr
                        key={index}
                        className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td className="py-3 px-4">{record.date}</td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              record.type === "Routine"
                                ? "bg-blue-500"
                                : record.type === "Repair"
                                  ? "bg-yellow-500"
                                  : record.type === "Calibration"
                                    ? "bg-purple-500"
                                    : "bg-green-500"
                            }
                          >
                            {record.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{record.description}</td>
                        <td className="py-3 px-4">{record.technician}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="text-lg">Device Health</CardTitle>
              <CardDescription>Overall device performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Uptime</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-semibold">98.5%</p>
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: "98.5%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Data Completeness</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-semibold">96.2%</p>
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: "96.2%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Sensor Accuracy</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-semibold">94.8%</p>
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: "94.8%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="text-lg">Device Settings</CardTitle>
              <CardDescription>Configure device parameters</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Device Name</label>
                    <input type="text" className="w-full p-2 border rounded-md" defaultValue={device.name} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input type="text" className="w-full p-2 border rounded-md" defaultValue={device.location} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <input type="text" className="w-full p-2 border rounded-md" defaultValue={device.description} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Firmware Version</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="2.3.1">2.3.1 (Current)</option>
                      <option value="2.3.2">2.3.2 (Available)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Reporting Frequency</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="5">Every 5 minutes</option>
                    <option value="10">Every 10 minutes</option>
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Every hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Alert Thresholds</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">PM2.5 (µg/m³)</label>
                      <input type="number" className="w-full p-2 border rounded-md" defaultValue="50" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">PM10 (µg/m³)</label>
                      <input type="number" className="w-full p-2 border rounded-md" defaultValue="80" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

