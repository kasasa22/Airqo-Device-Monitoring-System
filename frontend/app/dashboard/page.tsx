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
  Clock,
  Activity,
  TrendingUp,
  Layers,
  Settings,
  RefreshCw,
  Wrench,
  Timer,
  Zap,
  BarChart,
  PieChart,
  Battery,
} from "lucide-react"
import {
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
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
const deviceStatusData = [
  { name: "Active", value: 68, color: "#4CAF50" },
  { name: "Maintenance", value: 15, color: "#FFC107" },
  { name: "Offline", value: 17, color: "#F44336" },
]

// Sample device failure data
const deviceFailureData = [
  { month: "Jan", powerIssues: 5, sensorFailures: 3, connectivityIssues: 7, physicalDamage: 2 },
  { month: "Feb", powerIssues: 4, sensorFailures: 2, connectivityIssues: 5, physicalDamage: 1 },
  { month: "Mar", powerIssues: 6, sensorFailures: 4, connectivityIssues: 3, physicalDamage: 2 },
  { month: "Apr", powerIssues: 3, sensorFailures: 5, connectivityIssues: 6, physicalDamage: 3 },
  { month: "May", powerIssues: 7, sensorFailures: 3, connectivityIssues: 4, physicalDamage: 1 },
  { month: "Jun", powerIssues: 5, sensorFailures: 2, connectivityIssues: 8, physicalDamage: 2 },
]

// Sample regional device longevity data
const regionalLongevityData = [
  { region: "East Africa", avgLifespan: 36, failureRate: 12, mtbf: 120, mttr: 48 },
  { region: "West Africa", avgLifespan: 32, failureRate: 15, mtbf: 100, mttr: 72 },
  { region: "North Africa", avgLifespan: 40, failureRate: 8, mtbf: 150, mttr: 36 },
  { region: "Southern Africa", avgLifespan: 38, failureRate: 10, mtbf: 130, mttr: 42 },
  { region: "Central Africa", avgLifespan: 30, failureRate: 18, mtbf: 90, mttr: 60 },
]

// Sample calibration drift data
const calibrationDriftData = [
  { month: "Jan", pm25Drift: 2.5, pm10Drift: 3.2, tempDrift: 0.5, humidityDrift: 1.2 },
  { month: "Feb", pm25Drift: 2.8, pm10Drift: 3.5, tempDrift: 0.6, humidityDrift: 1.5 },
  { month: "Mar", pm25Drift: 3.2, pm10Drift: 4.1, tempDrift: 0.8, humidityDrift: 1.8 },
  { month: "Apr", pm25Drift: 3.5, pm10Drift: 4.5, tempDrift: 0.7, humidityDrift: 1.6 },
  { month: "May", pm25Drift: 3.8, pm10Drift: 4.8, tempDrift: 0.9, humidityDrift: 2.0 },
  { month: "Jun", pm25Drift: 4.2, pm10Drift: 5.2, tempDrift: 1.0, humidityDrift: 2.2 },
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
        <h1 className="text-2xl font-bold">Device Performance Dashboard</h1>
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
              Device Failure Patterns
            </CardTitle>
            <CardDescription>Monthly breakdown of device failure causes</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={deviceFailureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="powerIssues" name="Power Issues" fill="#8884d8" />
                  <Bar dataKey="sensorFailures" name="Sensor Failures" fill="#82ca9d" />
                  <Bar dataKey="connectivityIssues" name="Connectivity Issues" fill="#ffc658" />
                  <Bar dataKey="physicalDamage" name="Physical Damage" fill="#ff8042" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Activity className="mr-2 h-4 w-4 text-primary" />
              Connectivity issues are the leading cause of device failures
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
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
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
                </RechartsPieChart>
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
                <Timer className="mr-2 h-5 w-5 text-primary" />
                Device Performance Metrics
              </CardTitle>
              <CardDescription>Regional comparison of key device metrics</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Region</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Avg. Lifespan (months)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Failure Rate (%)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">MTBF (days)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">MTTR (hours)</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalLongevityData.map((region, index) => (
                    <tr
                      key={region.region}
                      className={`border-b hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="py-3 px-4 font-medium">{region.region}</td>
                      <td className="py-3 px-4">{region.avgLifespan}</td>
                      <td className="py-3 px-4">{region.failureRate}%</td>
                      <td className="py-3 px-4">{region.mtbf}</td>
                      <td className="py-3 px-4">{region.mttr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
              North Africa shows the highest device longevity and lowest failure rates
            </div>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-primary" />
              Calibration Drift Analysis
            </CardTitle>
            <CardDescription>For devices under colocation testing</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={calibrationDriftData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pm25Drift" name="PM2.5 Drift (%)" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="pm10Drift" name="PM10 Drift (%)" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="tempDrift" name="Temp Drift (°C)" stroke="#ffc658" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="humidityDrift"
                    name="Humidity Drift (%)"
                    stroke="#ff8042"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Wrench className="mr-2 h-4 w-4 text-primary" />
              Calibration drift increases over time, with PM10 showing the highest drift rate
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5 text-primary" />
              Overall Device Uptime
            </CardTitle>
            <CardDescription>Monthly uptime percentage across all devices</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Overall Uptime</p>
                    <p className="text-xl font-semibold">94.3%</p>
                  </div>
                </div>
                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: "94.3%" }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Timer className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average MTBF</p>
                    <p className="text-xl font-semibold">118 days</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                    <Wrench className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average MTTR</p>
                    <p className="text-xl font-semibold">52 hours</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average Failure Rate</p>
                    <p className="text-xl font-semibold">12.6%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary" />
              Device Maintenance Needs
            </CardTitle>
            <CardDescription>Current maintenance requirements by category</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                    <Battery className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Battery Replacement</p>
                    <p className="text-xl font-semibold">8 devices</p>
                  </div>
                </div>
                <Badge className="bg-red-500">Urgent</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                    <Zap className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sensor Calibration</p>
                    <p className="text-xl font-semibold">12 devices</p>
                  </div>
                </div>
                <Badge className="bg-yellow-500">Medium</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Wifi className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Connectivity Issues</p>
                    <p className="text-xl font-semibold">5 devices</p>
                  </div>
                </div>
                <Badge className="bg-blue-500">Scheduled</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Settings className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Routine Maintenance</p>
                    <p className="text-xl font-semibold">15 devices</p>
                  </div>
                </div>
                <Badge className="bg-green-500">Planned</Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Wrench className="mr-2 h-4 w-4 text-primary" />
              20 devices require maintenance in the next 30 days
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

