// DataTransmissionAnalysis.jsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts"
import {
  AlertTriangle,
  Download,
  RefreshCw,
  Database,
  Activity,
  Clock,
  WifiOff,
  Info,
  CalendarRange,
  Filter,
} from "lucide-react"
import {config} from "@/lib/config"

// This will be part of the existing analytics page, focusing on data transmission
export default function DataTransmissionAnalysis({ timeRange }) {
  const [deviceTransmissionData, setDeviceTransmissionData] = useState([])
  const [dataVolumeOverTime, setDataVolumeOverTime] = useState([])
  const [hourlyTransmissionData, setHourlyTransmissionData] = useState([])
  const [failureAnalysis, setFailureAnalysis] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateFilter, setDateFilter] = useState("7days") // Default to 7 days

  // Fetch data on component mount or when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get device transmission data
        const transmissionResponse = await fetch(`${config.apiUrl}/api/analytics/device-transmission?timeRange=${dateFilter}`)
        if (!transmissionResponse.ok) throw new Error("Failed to fetch device transmission data")
        const transmissionData = await transmissionResponse.json()
        setDeviceTransmissionData(transmissionData)

        // Get data volume over time
        const volumeResponse = await fetch(`${config.apiUrl}/api/analytics/data-volume?timeRange=${dateFilter}`)
        if (!volumeResponse.ok) throw new Error("Failed to fetch data volume information")
        const volumeData = await volumeResponse.json()
        setDataVolumeOverTime(volumeData)

        // Get hourly transmission patterns
        const hourlyResponse = await fetch(`${config.apiUrl}/api/analytics/hourly-transmission`)
        if (!hourlyResponse.ok) throw new Error("Failed to fetch hourly transmission data")
        const hourlyData = await hourlyResponse.json()
        setHourlyTransmissionData(hourlyData)

        // Get device failure analysis
        const failureResponse = await fetch(`${config.apiUrl}/api/analytics/device-failures?timeRange=${dateFilter}`)
        if (!failureResponse.ok) throw new Error("Failed to fetch device failure data")
        const failureData = await failureResponse.json()
        setFailureAnalysis(failureData)

        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateFilter])

  // Handle refresh button click
  const handleRefresh = () => {
    // Re-fetch data
    setIsLoading(true)
    // Reset cached data and trigger useEffect
    setDeviceTransmissionData([])
    setDataVolumeOverTime([])
    setHourlyTransmissionData([])
    setFailureAnalysis([])
  }

  // Format data for charts if needed
  const formatDeviceTransmissionForChart = (data) => {
    // This assumes the API returns data formatted for the chart
    // If not, you would transform it here
    return data
  }

  // Find days with significant data drops
  const findSignificantDataDrops = (data) => {
    if (!data || data.length === 0) return []
    
    return data
      .filter(day => 
        day.dataVolume / day.expectedVolume < 0.8 // Less than 80% of expected
      )
      .map(day => ({
        date: day.date,
        dropPercentage: Math.round((1 - day.dataVolume / day.expectedVolume) * 100),
        activeDevices: day.devices
      }))
  }

  const dataDrops = findSignificantDataDrops(dataVolumeOverTime)

  // If still loading, show a loading state
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading transmission data...</p>
      </div>
    )
  }

  // If there was an error, show error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load data transmission analysis: {error}
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Data Transmission Analysis</h2>
        <div className="flex items-center space-x-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <CalendarRange className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="flex items-center" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

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
              <BarChart data={formatDeviceTransmissionForChart(deviceTransmissionData)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {/* Dynamically render bars based on available devices */}
                {deviceTransmissionData.length > 0 && 
                  Object.keys(deviceTransmissionData[0])
                    .filter(key => key !== 'date')
                    .map((deviceKey, index) => {
                      // Generate colors programmatically
                      const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#3F51B5', '#009688']
                      return (
                        <Bar 
                          key={deviceKey} 
                          dataKey={deviceKey} 
                          name={deviceKey} 
                          fill={colors[index % colors.length]} 
                        />
                      )
                    })
                }
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        {dataDrops.length > 0 && (
          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <div className="flex items-center text-sm text-yellow-600">
              <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
              {dataDrops.length > 1 
                ? `Multiple devices failed to transmit data on ${dataDrops.length} days`
                : `Device data transmission failures detected on ${dataDrops[0].date}`
              }
            </div>
          </CardFooter>
        )}
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
              <ComposedChart data={dataVolumeOverTime}>
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
                
                {/* Add reference lines for significant data drops */}
                {dataDrops.map((drop, index) => (
                  <ReferenceLine 
                    key={index}
                    x={drop.date} 
                    stroke="#F44336" 
                    strokeDasharray="3 3" 
                    label={`${drop.dropPercentage}% Drop`} 
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        {dataDrops.length > 0 && (
          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Data Flow Analysis</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                  {dataDrops.map((drop, index) => (
                    <li key={index}>
                      Data volume decreased by {drop.dropPercentage}% on {drop.date} 
                      {drop.activeDevices ? ` with only ${drop.activeDevices} active devices` : ''}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </CardFooter>
        )}
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
                <ComposedChart data={hourlyTransmissionData}>
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
                  <Line
                    type="monotone"
                    dataKey="devices"
                    stroke="#FF5722"
                    strokeWidth={2}
                    name="Active Devices"
                  />
                  {/* Add reference lines for hours with device issues */}
                  {hourlyTransmissionData.map((hour, index) => {
                    if (hour.devices < hourlyTransmissionData[0].devices) {
                      return (
                        <ReferenceLine 
                          key={index}
                          x={hour.hour} 
                          stroke="#F44336" 
                          strokeDasharray="3 3" 
                          label="Device Offline" 
                        />
                      )
                    }
                    return null
                  })}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Info className="mr-2 h-4 w-4 text-primary" />
              {hourlyTransmissionData.length > 0 ? (
                <>
                  Data volume peaks during {(() => {
                    const maxHour = hourlyTransmissionData.reduce(
                      (max, hour) => hour.dataVolume > max.dataVolume ? hour : max, 
                      hourlyTransmissionData[0]
                    )
                    return maxHour.hour
                  })()} hours
                </>
              ) : (
                "Insufficient hourly data available"
              )}
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
                  data={failureAnalysis}
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
                {failureAnalysis.map(item => (
                  <div 
                    key={item.device} 
                    className={`p-2 border rounded-md ${
                      item.failures > 2 ? "bg-red-50 border-red-200" : 
                      item.failures > 0 ? "bg-yellow-50 border-yellow-200" : 
                      "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.device}</span>
                      <span>
                        {item.failures === 0 
                          ? "No failures"
                          : `${item.failures} ${item.failures === 1 ? 'failure' : 'failures'} (${item.status})`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}