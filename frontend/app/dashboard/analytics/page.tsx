"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart,
  ReferenceLine,
} from "recharts"
import {
  Download,
  RefreshCw,
  Calendar,
  BarChartIcon,
  PieChartIcon,
  Activity,
  Zap,
  Battery,
  Clock,
  AlertTriangle,
  Settings,
  MapPin,
  Wrench,
  Timer,
  TrendingUp,
  TrendingDown,
  Database,
  WifiOff,
  Info,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Sample data for device performance metrics
const devicePerformanceData = [
  { month: "Jan", uptime: 98.2, dataCompleteness: 96.5, batteryHealth: 95.0, signalStrength: 92.3 },
  { month: "Feb", uptime: 97.8, dataCompleteness: 95.8, batteryHealth: 93.2, signalStrength: 91.5 },
  { month: "Mar", uptime: 99.1, dataCompleteness: 97.2, batteryHealth: 91.5, signalStrength: 93.7 },
  { month: "Apr", uptime: 98.5, dataCompleteness: 96.8, batteryHealth: 89.8, signalStrength: 92.1 },
  { month: "May", uptime: 97.2, dataCompleteness: 94.5, batteryHealth: 87.3, signalStrength: 90.6 },
  { month: "Jun", uptime: 98.7, dataCompleteness: 97.0, batteryHealth: 85.1, signalStrength: 91.8 },
]

// Sample data for failure analysis
const failureTypeData = [
  { name: "Power Issues", value: 35 },
  { name: "Sensor Failures", value: 25 },
  { name: "Connectivity Issues", value: 30 },
  { name: "Physical Damage", value: 10 },
]

const failureColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"]

// Sample data for regional comparison
const regionalComparisonData = [
  {
    region: "East Africa",
    uptime: 98.5,
    mtbf: 120,
    mttr: 48,
    failureRate: 8.2,
    deviceCount: 42,
  },
  {
    region: "West Africa",
    uptime: 96.2,
    mtbf: 95,
    mttr: 72,
    failureRate: 12.5,
    deviceCount: 35,
  },
  {
    region: "North Africa",
    uptime: 99.1,
    mtbf: 145,
    mttr: 36,
    failureRate: 5.8,
    deviceCount: 28,
  },
  {
    region: "Southern Africa",
    uptime: 97.8,
    mtbf: 110,
    mttr: 54,
    failureRate: 9.3,
    deviceCount: 31,
  },
  {
    region: "Central Africa",
    uptime: 95.3,
    mtbf: 85,
    mttr: 68,
    failureRate: 14.2,
    deviceCount: 24,
  },
]

// Sample data for maintenance effectiveness
const maintenanceEffectivenessData = [
  { month: "Jan", preFailureRate: 12.5, postFailureRate: 8.2 },
  { month: "Feb", preFailureRate: 13.1, postFailureRate: 7.8 },
  { month: "Mar", preFailureRate: 11.8, postFailureRate: 6.5 },
  { month: "Apr", preFailureRate: 12.2, postFailureRate: 5.9 },
  { month: "May", preFailureRate: 14.5, postFailureRate: 7.2 },
  { month: "Jun", preFailureRate: 13.8, postFailureRate: 6.8 },
]

// Sample data for battery performance
const batteryPerformanceData = [
  { age: 1, performance: 98 },
  { age: 2, performance: 96 },
  { age: 3, performance: 94 },
  { age: 4, performance: 91 },
  { age: 5, performance: 87 },
  { age: 6, performance: 82 },
  { age: 7, performance: 76 },
  { age: 8, performance: 70 },
  { age: 9, performance: 63 },
  { age: 10, performance: 55 },
  { age: 11, performance: 46 },
  { age: 12, performance: 38 },
]

// Sample data for device reliability metrics
const deviceReliabilityData = [
  { category: "Uptime", value: 98.2 },
  { category: "Data Completeness", value: 96.5 },
  { category: "Battery Health", value: 87.3 },
  { category: "Signal Strength", value: 91.8 },
  { category: "Sensor Accuracy", value: 94.2 },
]

// Sample data for calibration drift over time
const calibrationDriftData = [
  { month: "Jan", pm25Drift: 0.5, pm10Drift: 0.8, tempDrift: 0.2, humidityDrift: 0.3 },
  { month: "Feb", pm25Drift: 0.8, pm10Drift: 1.2, tempDrift: 0.3, humidityDrift: 0.5 },
  { month: "Mar", pm25Drift: 1.2, pm10Drift: 1.8, tempDrift: 0.4, humidityDrift: 0.7 },
  { month: "Apr", pm25Drift: 1.6, pm10Drift: 2.3, tempDrift: 0.5, humidityDrift: 0.9 },
  { month: "May", pm25Drift: 2.1, pm10Drift: 2.8, tempDrift: 0.6, humidityDrift: 1.2 },
  { month: "Jun", pm25Drift: 2.8, pm10Drift: 3.5, tempDrift: 0.7, humidityDrift: 1.5 },
]

// Sample data for environmental impact on device performance
const environmentalImpactData = [
  { name: "Humidity", performance: 85, reliability: 80 },
  { name: "Temperature", performance: 90, reliability: 88 },
  { name: "Dust", performance: 70, reliability: 65 },
  { name: "Rainfall", performance: 75, reliability: 72 },
  { name: "UV Exposure", performance: 82, reliability: 78 },
]

// Sample data for data transmission tracking
const dataTransmissionByDeviceData = [
  { date: "2024-06-01", KLA001: 100, KLA002: 100, NBI001: 100, LAG001: 100, CAI001: 100 },
  { date: "2024-06-02", KLA001: 100, KLA002: 100, NBI001: 100, LAG001: 100, CAI001: 100 },
  { date: "2024-06-03", KLA001: 0, KLA002: 100, NBI001: 100, LAG001: 100, CAI001: 100 },
  { date: "2024-06-04", KLA001: 100, KLA002: 100, NBI001: 0, LAG001: 100, CAI001: 100 },
  { date: "2024-06-05", KLA001: 100, KLA002: 0, NBI001: 100, LAG001: 100, CAI001: 100 },
  { date: "2024-06-06", KLA001: 100, KLA002: 100, NBI001: 100, LAG001: 0, CAI001: 100 },
  { date: "2024-06-07", KLA001: 100, KLA002: 100, NBI001: 100, LAG001: 100, CAI001: 0 },
  { date: "2024-06-08", KLA001: 100, KLA002: 100, NBI001: 100, LAG001: 100, CAI001: 100 },
  { date: "2024-06-09", KLA001: 100, KLA002: 0, NBI001: 0, LAG001: 100, CAI001: 100 },
  { date: "2024-06-10", KLA001: 100, KLA002: 100, NBI001: 100, LAG001: 100, CAI001: 100 },
]

// Sample data for data volume over time
const dataVolumeOverTimeData = [
  { date: "2024-06-01", dataVolume: 1250, expectedVolume: 1250, devices: 5 },
  { date: "2024-06-02", dataVolume: 1250, expectedVolume: 1250, devices: 5 },
  { date: "2024-06-03", dataVolume: 1000, expectedVolume: 1250, devices: 4 },
  { date: "2024-06-04", dataVolume: 1000, expectedVolume: 1250, devices: 4 },
  { date: "2024-06-05", dataVolume: 1000, expectedVolume: 1250, devices: 4 },
  { date: "2024-06-06", dataVolume: 1000, expectedVolume: 1250, devices: 4 },
  { date: "2024-06-07", dataVolume: 1000, expectedVolume: 1250, devices: 4 },
  { date: "2024-06-08", dataVolume: 1250, expectedVolume: 1250, devices: 5 },
  { date: "2024-06-09", dataVolume: 750, expectedVolume: 1250, devices: 3 },
  { date: "2024-06-10", dataVolume: 1250, expectedVolume: 1250, devices: 5 },
]

// Sample data for hourly data transmission patterns
const hourlyDataTransmissionData = [
  { hour: "00:00", dataVolume: 45, devices: 5 },
  { hour: "01:00", dataVolume: 42, devices: 5 },
  { hour: "02:00", dataVolume: 40, devices: 5 },
  { hour: "03:00", dataVolume: 38, devices: 5 },
  { hour: "04:00", dataVolume: 35, devices: 5 },
  { hour: "05:00", dataVolume: 32, devices: 4 },
  { hour: "06:00", dataVolume: 38, devices: 5 },
  { hour: "07:00", dataVolume: 48, devices: 5 },
  { hour: "08:00", dataVolume: 55, devices: 5 },
  { hour: "09:00", dataVolume: 60, devices: 5 },
  { hour: "10:00", dataVolume: 62, devices: 5 },
  { hour: "11:00", dataVolume: 65, devices: 5 },
  { hour: "12:00", dataVolume: 68, devices: 5 },
  { hour: "13:00", dataVolume: 70, devices: 5 },
  { hour: "14:00", dataVolume: 72, devices: 5 },
  { hour: "15:00", dataVolume: 68, devices: 5 },
  { hour: "16:00", dataVolume: 65, devices: 5 },
  { hour: "17:00", dataVolume: 60, devices: 5 },
  { hour: "18:00", dataVolume: 55, devices: 5 },
  { hour: "19:00", dataVolume: 50, devices: 5 },
  { hour: "20:00", dataVolume: 48, devices: 5 },
  { hour: "21:00", dataVolume: 45, devices: 5 },
  { hour: "22:00", dataVolume: 42, devices: 5 },
  { hour: "23:00", dataVolume: 40, devices: 5 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month")

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Device Performance Analytics</h1>
        <div className="flex items-center space-x-2">
          <select className="border rounded-md p-2" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <Button variant="outline" size="sm" className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Average Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-xs text-muted-foreground">+0.7% from previous period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Timer className="mr-2 h-5 w-5 text-primary" />
              Average MTBF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">118 days</div>
            <p className="text-xs text-muted-foreground">+8 days from previous period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wrench className="mr-2 h-5 w-5 text-primary" />
              Average MTTR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52 hours</div>
            <p className="text-xs text-muted-foreground">-4 hours from previous period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-primary" />
              Failure Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9.8%</div>
            <p className="text-xs text-muted-foreground">-1.2% from previous period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="data-transmission" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="data-transmission">Data Transmission</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reliability">Reliability</TabsTrigger>
          <TabsTrigger value="regional">Regional Analysis</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="data-transmission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5 text-primary" />
                Data Transmission by Device
              </CardTitle>
              <CardDescription>
                Track which devices sent data at specific intervals (100% = data sent, 0% = no data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataTransmissionByDeviceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="KLA001" name="Kampala Central" fill="#4CAF50" />
                    <Bar dataKey="KLA002" name="Kampala East" fill="#2196F3" />
                    <Bar dataKey="NBI001" name="Nairobi CBD" fill="#FF9800" />
                    <Bar dataKey="LAG001" name="Lagos Island" fill="#9C27B0" />
                    <Bar dataKey="CAI001" name="Cairo Downtown" fill="#F44336" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                Multiple devices failed to transmit data on June 9th
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Data Volume Over Time
              </CardTitle>
              <CardDescription>Actual vs expected data volume with notable increases and decreases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dataVolumeOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="expectedVolume"
                      fill="#e3f2fd"
                      stroke="#2196F3"
                      name="Expected Data Volume"
                    />
                    <Line
                      type="monotone"
                      dataKey="dataVolume"
                      stroke="#FF5722"
                      strokeWidth={2}
                      name="Actual Data Volume"
                    />
                    <Bar dataKey="devices" fill="#4CAF50" name="Active Devices" />
                    <ReferenceLine x="2024-06-03" stroke="#F44336" strokeDasharray="3 3" label="Data Drop" />
                    <ReferenceLine x="2024-06-09" stroke="#F44336" strokeDasharray="3 3" label="Major Drop" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Data Flow Analysis</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Data volume decreased by 20% on June 3rd due to one device going offline</li>
                    <li>Data volume decreased by 40% on June 9th due to two devices going offline</li>
                    <li>Data volume returned to normal on June 10th when all devices came back online</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Hourly Data Transmission Pattern
                </CardTitle>
                <CardDescription>Data volume and active devices by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={hourlyDataTransmissionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="dataVolume"
                        fill="#e3f2fd"
                        stroke="#2196F3"
                        name="Data Volume (KB)"
                      />
                      <Line type="monotone" dataKey="devices" stroke="#FF5722" strokeWidth={2} name="Active Devices" />
                      <ReferenceLine x="05:00" stroke="#F44336" strokeDasharray="3 3" label="Device Offline" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-4 py-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="mr-2 h-4 w-4 text-primary" />
                  Data volume peaks during afternoon hours (12:00-14:00)
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <WifiOff className="mr-2 h-5 w-5 text-primary" />
                  Missing Data Analysis
                </CardTitle>
                <CardDescription>Devices with the most frequent data transmission failures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={[
                        { device: "KLA001", failures: 1, uptime: 90 },
                        { device: "KLA002", failures: 2, uptime: 80 },
                        { device: "NBI001", failures: 2, uptime: 80 },
                        { device: "LAG001", failures: 1, uptime: 90 },
                        { device: "CAI001", failures: 1, uptime: 90 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="device" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="failures" fill="#F44336" name="Data Transmission Failures" />
                      <Line type="monotone" dataKey="uptime" stroke="#4CAF50" name="Data Uptime (%)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <h3 className="text-md font-medium mb-2">Device Data Transmission Summary</h3>
                  <div className="space-y-2">
                    {[
                      { device: "KLA001", status: "1 failure on Jun 3", class: "bg-yellow-50 border-yellow-200" },
                      { device: "KLA002", status: "2 failures on Jun 5, Jun 9", class: "bg-red-50 border-red-200" },
                      { device: "NBI001", status: "2 failures on Jun 4, Jun 9", class: "bg-red-50 border-red-200" },
                      { device: "LAG001", status: "1 failure on Jun 6", class: "bg-yellow-50 border-yellow-200" },
                      { device: "CAI001", status: "1 failure on Jun 7", class: "bg-yellow-50 border-yellow-200" },
                    ].map((item) => (
                      <div key={item.device} className={`p-2 border rounded-md ${item.class}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.device}</span>
                          <span>{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Device Performance Metrics
              </CardTitle>
              <CardDescription>Key performance indicators over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={devicePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="uptime" stroke="#4CAF50" name="Uptime (%)" />
                    <Line type="monotone" dataKey="dataCompleteness" stroke="#2196F3" name="Data Completeness (%)" />
                    <Line type="monotone" dataKey="batteryHealth" stroke="#FF9800" name="Battery Health (%)" />
                    <Line type="monotone" dataKey="signalStrength" stroke="#9C27B0" name="Signal Strength (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                Overall device performance has improved by 2.3% compared to previous period
              </div>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Battery className="mr-2 h-5 w-5 text-primary" />
                  Battery Performance Over Time
                </CardTitle>
                <CardDescription>Battery performance degradation with age (months)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={batteryPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="performance"
                        stroke="#FF9800"
                        fill="#FFE0B2"
                        name="Battery Performance"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-4 py-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                  Battery performance drops below 70% after 8 months of deployment
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-primary" />
                  Calibration Drift Analysis
                </CardTitle>
                <CardDescription>Sensor drift percentage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={calibrationDriftData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="pm25Drift" stroke="#8884d8" name="PM2.5 Drift (%)" />
                      <Line type="monotone" dataKey="pm10Drift" stroke="#82ca9d" name="PM10 Drift (%)" />
                      <Line type="monotone" dataKey="tempDrift" stroke="#ffc658" name="Temp Drift (°C)" />
                      <Line type="monotone" dataKey="humidityDrift" stroke="#ff8042" name="Humidity Drift (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-4 py-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="mr-2 h-4 w-4 text-red-500" />
                  PM10 sensors show the highest drift rate, requiring more frequent calibration
                </div>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Environmental Impact on Device Performance
              </CardTitle>
              <CardDescription>How environmental factors affect device performance and reliability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={150} data={environmentalImpactData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="performance" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Reliability" dataKey="reliability" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                Dust exposure has the most significant negative impact on device performance and reliability
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="reliability" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="mr-2 h-5 w-5 text-primary" />
                  Failure Type Distribution
                </CardTitle>
                <CardDescription>Breakdown of device failures by cause</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={failureTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {failureTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={failureColors[index % failureColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-4 py-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                  Power issues are the leading cause of device failures (35%)
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChartIcon className="mr-2 h-5 w-5 text-primary" />
                  Device Reliability Metrics
                </CardTitle>
                <CardDescription>Key reliability indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviceReliabilityData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="category" type="category" width={150} />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#8884d8"
                        name="Reliability Score (%)"
                        label={{ position: "right", formatter: (value) => `${value}%` }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-4 py-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                  Uptime and sensor accuracy show the highest reliability scores
                </div>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Time Between Failures Analysis
              </CardTitle>
              <CardDescription>Distribution of time between device failures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="x" name="Days Between Failures" domain={[0, 200]} />
                    <YAxis type="number" dataKey="y" name="Frequency" />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter
                      name="MTBF Distribution"
                      data={[
                        { x: 20, y: 5 },
                        { x: 40, y: 8 },
                        { x: 60, y: 15 },
                        { x: 80, y: 25 },
                        { x: 100, y: 35 },
                        { x: 120, y: 42 },
                        { x: 140, y: 30 },
                        { x: 160, y: 18 },
                        { x: 180, y: 10 },
                        { x: 200, y: 5 },
                      ]}
                      fill="#8884d8"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Activity className="mr-2 h-4 w-4 text-primary" />
                Most devices operate for 100-140 days between failures
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Regional Performance Comparison
              </CardTitle>
              <CardDescription>Device performance metrics by region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Region</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Uptime (%)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">MTBF (days)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">MTTR (hours)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Failure Rate (%)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Device Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionalComparisonData.map((region, index) => (
                      <tr
                        key={region.region}
                        className={`border-b hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="py-3 px-4 font-medium">{region.region}</td>
                        <td className="py-3 px-4">{region.uptime}%</td>
                        <td className="py-3 px-4">{region.mtbf}</td>
                        <td className="py-3 px-4">{region.mttr}</td>
                        <td className="py-3 px-4">{region.failureRate}%</td>
                        <td className="py-3 px-4">{region.deviceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                North Africa shows the best overall device performance metrics
              </div>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Regional Uptime Comparison
                </CardTitle>
                <CardDescription>Device uptime percentage by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={regionalComparisonData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region" />
                      <YAxis domain={[90, 100]} />
                      <Tooltip />
                      <Bar dataKey="uptime" name="Uptime (%)" fill="#4CAF50" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-primary" />
                  Regional Failure Rate Comparison
                </CardTitle>
                <CardDescription>Device failure rates by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={regionalComparisonData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="failureRate" name="Failure Rate (%)" fill="#F44336" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5 text-primary" />
                Regional MTBF & MTTR Comparison
              </CardTitle>
              <CardDescription>Mean Time Between Failures and Mean Time To Repair by region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={regionalComparisonData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="mtbf" name="MTBF (days)" fill="#8884d8" />
                    <Bar dataKey="mttr" name="MTTR (hours)" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingDown className="mr-2 h-4 w-4 text-green-500" />
                North Africa has the highest MTBF and lowest MTTR, indicating superior device reliability
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="mr-2 h-5 w-5 text-primary" />
                Maintenance Effectiveness
              </CardTitle>
              <CardDescription>Impact of maintenance on device failure rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={maintenanceEffectivenessData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="preFailureRate"
                      stroke="#F44336"
                      name="Pre-Maintenance Failure Rate (%)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="postFailureRate"
                      stroke="#4CAF50"
                      name="Post-Maintenance Failure Rate (%)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingDown className="mr-2 h-4 w-4 text-green-500" />
                Maintenance activities reduce failure rates by an average of 48%
              </div>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  Maintenance Schedule Adherence
                </CardTitle>
                <CardDescription>Percentage of maintenance activities performed on schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "On Schedule", value: 78 },
                          { name: "Delayed", value: 15 },
                          { name: "Missed", value: 7 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#4CAF50" />
                        <Cell fill="#FFC107" />
                        <Cell fill="#F44336" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-4 py-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                  Maintenance schedule adherence has improved by 8% compared to previous period
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-primary" />
                  Maintenance Type Distribution
                </CardTitle>
                <CardDescription>Breakdown of maintenance activities by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Preventive", value: 45 },
                          { name: "Corrective", value: 30 },
                          { name: "Calibration", value: 20 },
                          { name: "Upgrade", value: 5 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#4CAF50" />
                        <Cell fill="#F44336" />
                        <Cell fill="#2196F3" />
                        <Cell fill="#9C27B0" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-4 py-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                  Preventive maintenance has increased by 15% compared to previous period
                </div>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Timer className="mr-2 h-5 w-5 text-primary" />
                Maintenance Time Analysis
              </CardTitle>
              <CardDescription>Average time spent on different maintenance activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { type: "Battery Replacement", time: 45 },
                      { type: "Sensor Calibration", time: 120 },
                      { type: "Housing Repair", time: 90 },
                      { type: "Firmware Update", time: 30 },
                      { type: "Connectivity Fix", time: 60 },
                      { type: "Cleaning", time: 20 },
                    ]}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="type" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="time" name="Average Time (minutes)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                Sensor calibration is the most time-consuming maintenance activity
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

