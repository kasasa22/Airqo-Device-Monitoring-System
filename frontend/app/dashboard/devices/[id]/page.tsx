"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  BarChart,
} from "recharts"
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
  Wifi,
  WifiOff,
  AlertTriangle,
  Activity,
  Calendar,
  Zap,
  Timer,
  Wrench,
  Database,
  Info,
} from "lucide-react"
import dynamic from "next/dynamic"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
    installDate: "2023-05-15",
    lastMaintenance: "2024-01-20",
    firmwareVersion: "2.3.1",
    signalStrength: "92%",
    location: "Kampala City Center, Uganda",
    description: "Monitoring air quality in central Kampala business district",
    uptime: "98.5%",
    mtbf: "120 days",
    mttr: "48 hours",
    failureRate: "8.2%",
    dataCompleteness: "94.3%",
    lastCalibration: "2024-03-15",
    calibrationDrift: "2.8%",
    powerConsumption: "2.4W",
    batteryLife: "14 months",
    sensorHealth: "Good",
    hardwareVersion: "v3.2",
  },
  // More devices...
]

// Sample historical data with missing data points
const historicalData = [
  { date: "2024-06-01", uptime: 98, dataCompleteness: 100, batteryLevel: 95, signalStrength: 92, dataComplete: true },
  { date: "2024-06-02", uptime: 100, dataCompleteness: 100, batteryLevel: 93, signalStrength: 94, dataComplete: true },
  { date: "2024-06-03", uptime: 0, dataCompleteness: 0, batteryLevel: 90, signalStrength: 0, dataComplete: false },
  { date: "2024-06-04", uptime: 100, dataCompleteness: 100, batteryLevel: 89, signalStrength: 91, dataComplete: true },
  { date: "2024-06-05", uptime: 100, dataCompleteness: 100, batteryLevel: 87, signalStrength: 93, dataComplete: true },
  { date: "2024-06-06", uptime: 0, dataCompleteness: 0, batteryLevel: 85, signalStrength: 0, dataComplete: false },
  { date: "2024-06-07", uptime: 100, dataCompleteness: 100, batteryLevel: 85, signalStrength: 92, dataComplete: true },
]

// Sample calibration drift data
const calibrationDriftData = [
  { month: "Jan", pm25Drift: 0.5, pm10Drift: 0.8, tempDrift: 0.2, humidityDrift: 0.3 },
  { month: "Feb", pm25Drift: 0.8, pm10Drift: 1.2, tempDrift: 0.3, humidityDrift: 0.5 },
  { month: "Mar", pm25Drift: 1.2, pm10Drift: 1.8, tempDrift: 0.4, humidityDrift: 0.7 },
  { month: "Apr", pm25Drift: 1.6, pm10Drift: 2.3, tempDrift: 0.5, humidityDrift: 0.9 },
  { month: "May", pm25Drift: 2.1, pm10Drift: 2.8, tempDrift: 0.6, humidityDrift: 1.2 },
  { month: "Jun", pm25Drift: 2.8, pm10Drift: 3.5, tempDrift: 0.7, humidityDrift: 1.5 },
]

// Sample failure history
const failureHistory = [
  {
    date: "2024-05-10",
    type: "Connectivity",
    description: "Device lost connection due to network issues",
    downtime: "6 hours",
    resolution: "Network restored automatically",
  },
  {
    date: "2024-03-22",
    type: "Power",
    description: "Battery depletion due to solar panel malfunction",
    downtime: "48 hours",
    resolution: "Solar panel replaced",
  },
  {
    date: "2024-02-15",
    type: "Sensor",
    description: "PM2.5 sensor reading anomalies",
    downtime: "24 hours",
    resolution: "Sensor cleaned and recalibrated",
  },
  {
    date: "2023-11-30",
    type: "Physical",
    description: "Water ingress after heavy rainfall",
    downtime: "72 hours",
    resolution: "Device housing sealed and waterproofed",
  },
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

// Sample data for data transmission tracking
const dataTransmissionHistory = [
  { date: "2024-06-01", status: "complete", dataPoints: 144, expectedDataPoints: 144 },
  { date: "2024-06-02", status: "complete", dataPoints: 144, expectedDataPoints: 144 },
  { date: "2024-06-03", status: "missing", dataPoints: 0, expectedDataPoints: 144 },
  { date: "2024-06-04", status: "complete", dataPoints: 144, expectedDataPoints: 144 },
  { date: "2024-06-05", status: "complete", dataPoints: 144, expectedDataPoints: 144 },
  { date: "2024-06-06", status: "missing", dataPoints: 0, expectedDataPoints: 144 },
  { date: "2024-06-07", status: "complete", dataPoints: 144, expectedDataPoints: 144 },
  { date: "2024-06-08", status: "complete", dataPoints: 144, expectedDataPoints: 144 },
  { date: "2024-06-09", status: "partial", dataPoints: 96, expectedDataPoints: 144 },
  { date: "2024-06-10", status: "complete", dataPoints: 144, expectedDataPoints: 144 },
]

// Sample data for hourly data transmission
const hourlyDataTransmission = [
  { hour: "00:00", dataReceived: true, dataVolume: 10 },
  { hour: "01:00", dataReceived: true, dataVolume: 9 },
  { hour: "02:00", dataReceived: true, dataVolume: 8 },
  { hour: "03:00", dataReceived: true, dataVolume: 8 },
  { hour: "04:00", dataReceived: true, dataVolume: 7 },
  { hour: "05:00", dataReceived: false, dataVolume: 0 },
  { hour: "06:00", dataReceived: false, dataVolume: 0 },
  { hour: "07:00", dataReceived: true, dataVolume: 9 },
  { hour: "08:00", dataReceived: true, dataVolume: 12 },
  { hour: "09:00", dataReceived: true, dataVolume: 14 },
  { hour: "10:00", dataReceived: true, dataVolume: 15 },
  { hour: "11:00", dataReceived: true, dataVolume: 15 },
  { hour: "12:00", dataReceived: true, dataVolume: 16 },
  { hour: "13:00", dataReceived: true, dataVolume: 16 },
  { hour: "14:00", dataReceived: true, dataVolume: 15 },
  { hour: "15:00", dataReceived: true, dataVolume: 14 },
  { hour: "16:00", dataReceived: true, dataVolume: 13 },
  { hour: "17:00", dataReceived: true, dataVolume: 12 },
  { hour: "18:00", dataReceived: true, dataVolume: 11 },
  { hour: "19:00", dataReceived: true, dataVolume: 10 },
  { hour: "20:00", dataReceived: true, dataVolume: 9 },
  { hour: "21:00", dataReceived: true, dataVolume: 9 },
  { hour: "22:00", dataReceived: true, dataVolume: 8 },
  { hour: "23:00", dataReceived: true, dataVolume: 8 },
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
  const [dataTimeRange, setDataTimeRange] = useState("10days")

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

  // Function to get status badge for data transmission
  const getDataStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-500">Complete</Badge>
      case "partial":
        return <Badge className="bg-yellow-500">Partial</Badge>
      case "missing":
        return <Badge className="bg-red-500">Missing</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
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

  // Simplified chart rendering functions to avoid potential issues
  const renderDataTransmissionChart = () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dataTransmissionHistory}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="dataPoints" fill="#2196F3" name="Data Points Received" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const renderHourlyTransmissionChart = () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={hourlyDataTransmission}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="dataVolume" fill="#4CAF50" name="Data Volume (KB)" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const renderPerformanceChart = () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="uptime" stroke="#4CAF50" name="Uptime (%)" />
          <Line type="monotone" dataKey="dataCompleteness" stroke="#2196F3" name="Data Completeness (%)" />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  const renderBatteryChart = () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="batteryLevel" stroke="#FF9800" name="Battery Level (%)" />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  const renderCalibrationChart = () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={calibrationDriftData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="pm25Drift" stroke="#8884d8" name="PM2.5 Drift (%)" />
          <Line type="monotone" dataKey="pm10Drift" stroke="#82ca9d" name="PM10 Drift (%)" />
        </LineChart>
      </ResponsiveContainer>
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
            <CardTitle className="text-lg">Device Health</CardTitle>
            <CardDescription>Current performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Uptime</p>
                    <p className="text-xl font-semibold">{device.uptime}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Battery className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Battery</p>
                    <p className="text-xl font-semibold">{device.battery}</p>
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
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data Completeness</p>
                    <p className="text-xl font-semibold">{device.dataCompleteness}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <Zap className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Calibration Drift</p>
                    <p className="text-xl font-semibold">{device.calibrationDrift}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data-transmission">Data Transmission</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
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
                      <p className="text-sm text-gray-500">Hardware Version</p>
                      <p className="font-medium">{device.hardwareVersion}</p>
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
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Activity className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Uptime</p>
                        <p className="font-medium">{device.uptime}</p>
                      </div>
                    </div>
                    <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: device.uptime }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Timer className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">MTBF</p>
                        <p className="font-medium">{device.mtbf}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                        <Wrench className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">MTTR</p>
                        <p className="font-medium">{device.mttr}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Failure Rate</p>
                        <p className="font-medium">{device.failureRate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data-transmission" className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <Database className="mr-2 h-5 w-5 text-primary" />
                    Data Transmission History
                  </CardTitle>
                  <CardDescription>Track when data was sent and when it was missing</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    className="border rounded-md p-2 text-sm"
                    value={dataTimeRange}
                    onChange={(e) => setDataTimeRange(e.target.value)}
                  >
                    <option value="7days">Last 7 Days</option>
                    <option value="10days">Last 10 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-80">{renderDataTransmissionChart()}</div>

              <div className="mt-6">
                <h3 className="text-md font-medium mb-2">Data Transmission Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Data Points</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Expected</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Completeness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataTransmissionHistory.map((record, index) => (
                        <tr
                          key={record.date}
                          className={`border-b hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <td className="py-3 px-4">{record.date}</td>
                          <td className="py-3 px-4">{getDataStatusBadge(record.status)}</td>
                          <td className="py-3 px-4">{record.dataPoints}</td>
                          <td className="py-3 px-4">{record.expectedDataPoints}</td>
                          <td className="py-3 px-4">
                            {Math.round((record.dataPoints / record.expectedDataPoints) * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Data Transmission Analysis</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Device failed to transmit data on June 3rd and June 6th</li>
                    <li>Device sent partial data (67%) on June 9th</li>
                    <li>Overall data completeness for the period: 80%</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Hourly Data Transmission Pattern
              </CardTitle>
              <CardDescription>Data transmission by hour of day (last 24 hours)</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-80">{renderHourlyTransmissionChart()}</div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Info className="mr-2 h-4 w-4 text-primary" />
                Device failed to transmit data between 05:00-07:00, likely due to power-saving mode or connectivity
                issues
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="text-lg flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Data Flow Analysis
              </CardTitle>
              <CardDescription>Patterns in data transmission volume over time</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="text-md font-medium mb-2 text-blue-800">Data Flow Summary</h3>
                  <ul className="list-disc pl-5 space-y-2 text-blue-700">
                    <li>
                      <strong>Normal Pattern:</strong> Device typically sends 144 data points per day (6 per hour)
                    </li>
                    <li>
                      <strong>Peak Hours:</strong> Highest data volume occurs between 12:00-14:00 (16 KB/hour)
                    </li>
                    <li>
                      <strong>Low Hours:</strong> Lowest data volume occurs between 02:00-05:00 (7-8 KB/hour)
                    </li>
                    <li>
                      <strong>Missing Data:</strong> Complete data loss on June 3rd and 6th
                    </li>
                    <li>
                      <strong>Partial Data:</strong> 67% data completeness on June 9th
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="text-md font-medium mb-2 text-yellow-800">Data Transmission Patterns</h3>
                  <ul className="list-disc pl-5 space-y-2 text-yellow-700">
                    <li>
                      <strong>Periodic Gaps:</strong> Device shows a pattern of data transmission failures approximately
                      every 3-4 days, suggesting a potential issue with the device's power management or connectivity
                      cycle
                    </li>
                    <li>
                      <strong>Daily Patterns:</strong> Data volume consistently decreases during early morning hours
                      (02:00-05:00)
                    </li>
                    <li>
                      <strong>Recovery Time:</strong> After data transmission failures, the device typically resumes
                      normal operation within 24 hours
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-md font-medium mb-2 text-green-800">Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-2 text-green-700">
                    <li>
                      <strong>Investigate Power Issues:</strong> Check battery and solar panel performance during early
                      morning hours
                    </li>
                    <li>
                      <strong>Network Connectivity:</strong> Verify signal strength and network availability in the
                      device location
                    </li>
                    <li>
                      <strong>Firmware Update:</strong> Consider updating to the latest firmware version to improve data
                      transmission reliability
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Device Performance History</CardTitle>
                  <CardDescription>Uptime and data completeness over time</CardDescription>
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
              <div className="h-80">{renderPerformanceChart()}</div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center text-sm text-yellow-700">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>
                    <strong>Missing Data:</strong> Gaps in the chart indicate time periods when the device was offline
                    or didn't send data.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <CardTitle className="text-lg">Battery & Signal Strength</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-60">{renderBatteryChart()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <CardTitle className="text-lg">Calibration Drift</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-60">{renderCalibrationChart()}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="text-lg">Failure History</CardTitle>
              <CardDescription>Record of device failures and downtime</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Downtime</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failureHistory.map((record, index) => (
                      <tr
                        key={index}
                        className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td className="py-3 px-4">{record.date}</td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              record.type === "Connectivity"
                                ? "bg-blue-500"
                                : record.type === "Power"
                                  ? "bg-yellow-500"
                                  : record.type === "Sensor"
                                    ? "bg-purple-500"
                                    : "bg-red-500"
                            }
                          >
                            {record.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{record.description}</td>
                        <td className="py-3 px-4">{record.downtime}</td>
                        <td className="py-3 px-4">{record.resolution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
                    <p className="text-xl font-semibold">71.4%</p>
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500" style={{ width: "71.4%" }}></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">2 missing data points in last 7 days</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Sensor Health</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-semibold">Good</p>
                    <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: "94.8%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-md font-medium mb-2">Maintenance Recommendations</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                        <Battery className="h-4 w-4 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-medium">Battery Replacement</p>
                        <p className="text-sm text-gray-600">Recommended in 3 months based on current discharge rate</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Zap className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Sensor Calibration</p>
                        <p className="text-sm text-gray-600">
                          Due in 2 weeks (last calibration: {device.lastCalibration})
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Settings className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Routine Maintenance</p>
                        <p className="text-sm text-gray-600">Scheduled for next month</p>
                      </div>
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
                  <label className="block text-sm font-medium mb-1">Power Management</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Sleep Mode</label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="disabled">Disabled</option>
                        <option value="light">Light (Sensors only)</option>
                        <option value="deep">Deep (All systems)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Low Battery Threshold (%)</label>
                      <input type="number" className="w-full p-2 border rounded-md" defaultValue="20" />
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

