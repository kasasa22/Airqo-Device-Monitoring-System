"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
  PieChart,
  Pie,
  Cell,
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
  BarChart2,
  PieChart as PieChartIcon,
  Calendar,
  Check,
  X,
  Settings,
  Share2,
} from "lucide-react"
import { config } from "@/lib/config"

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border shadow-sm rounded-md">
        <p className="font-medium text-gray-700">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DataTransmissionAnalysis({ timeRange }) {
  const [deviceTransmissionData, setDeviceTransmissionData] = useState([])
  const [dataVolumeOverTime, setDataVolumeOverTime] = useState([])
  const [hourlyTransmissionData, setHourlyTransmissionData] = useState([])
  const [failureAnalysis, setFailureAnalysis] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateFilter, setDateFilter] = useState("7days") // Default to 7 days
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch data on component mount or when filters change
  useEffect(() => {
    fetchData()
  }, [dateFilter])

  useEffect(() => {
    fetchData()
  }, [dateFilter, timeRange])

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // ... existing code
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching data:", err);
          setError(err.message);
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [dateFilter, timeRange]);

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    
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

  // Handle refresh button click
  const handleRefresh = () => {
    fetchData()
  }

  // Calculate summary statistics
  const networkStats = useMemo(() => {
    if (!deviceTransmissionData.length || !dataVolumeOverTime.length || !failureAnalysis.length) {
      return {
        totalDevices: 0,
        activeDevices: 0,
        dataCompleteness: 0,
        failingDevices: 0,
      }
    }

    // Count unique devices from transmission data
    const uniqueDevices = new Set()
    deviceTransmissionData.forEach(day => {
      Object.keys(day).forEach(key => {
        if (key !== 'date') uniqueDevices.add(key)
      })
    })
    
    // Calculate data completeness
    const totalExpectedVolume = dataVolumeOverTime.reduce((sum, day) => sum + day.expectedVolume, 0)
    const totalActualVolume = dataVolumeOverTime.reduce((sum, day) => sum + day.dataVolume, 0)
    const completeness = totalExpectedVolume > 0 ? (totalActualVolume / totalExpectedVolume) * 100 : 0
    
    // Count failing devices (devices with at least one failure)
    const failingDevices = failureAnalysis.filter(device => device.failures > 0).length

    return {
      totalDevices: uniqueDevices.size,
      activeDevices: dataVolumeOverTime.length > 0 ? dataVolumeOverTime[dataVolumeOverTime.length - 1].devices : 0,
      dataCompleteness: Math.round(completeness * 10) / 10,
      failingDevices: failingDevices,
    }
  }, [deviceTransmissionData, dataVolumeOverTime, failureAnalysis])

  // Find days with significant data drops
  const dataDrops = useMemo(() => {
    if (!dataVolumeOverTime || dataVolumeOverTime.length === 0) return []
    
    return dataVolumeOverTime
      .filter(day => 
        day.expectedVolume > 0 && (day.dataVolume / day.expectedVolume) < 0.8 // Less than 80% of expected
      )
      .map(day => ({
        date: day.date,
        dropPercentage: Math.round((1 - day.dataVolume / day.expectedVolume) * 100),
        activeDevices: day.devices
      }))
  }, [dataVolumeOverTime])
  
  // Calculate failure distribution by device
  const failureDistribution = useMemo(() => {
    if (!failureAnalysis.length) return []
    
    const totalFailures = failureAnalysis.reduce((sum, device) => sum + device.failures, 0)
    
    // Get top 5 devices with most failures
    return failureAnalysis
      .slice(0, 5)
      .map(device => ({
        name: device.name || device.device,
        value: device.failures,
        percentage: Math.round((device.failures / totalFailures) * 100)
      }))
  }, [failureAnalysis])
  
  // Calculate hourly patterns for insight
  const hourlyPatterns = useMemo(() => {
    if (!hourlyTransmissionData.length) return { peakHour: null, lowHour: null }
    
    const peakHour = hourlyTransmissionData.reduce(
      (max, hour) => hour.dataVolume > max.dataVolume ? hour : max, 
      hourlyTransmissionData[0]
    )
    
    const lowHour = hourlyTransmissionData.reduce(
      (min, hour) => hour.dataVolume < min.dataVolume ? hour : min, 
      hourlyTransmissionData[0]
    )
    
    return {
      peakHour,
      lowHour
    }
  }, [hourlyTransmissionData])

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
        <h2 className="text-xl font-bold">Network Data Transmission Analysis</h2>
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

      {/* Key metrics summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="mr-2 h-5 w-5 text-primary" />
              Total Monitored Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              {networkStats.activeDevices} currently active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Data Completeness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.dataCompleteness}%</div>
            <p className="text-xs text-muted-foreground">
              Of expected data volume
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <WifiOff className="mr-2 h-5 w-5 text-primary" />
              Devices with Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.failingDevices}</div>
            <p className="text-xs text-muted-foreground">
              {networkStats.totalDevices > 0 ? 
                `${Math.round((networkStats.failingDevices / networkStats.totalDevices) * 100)}% of network` : 
                'No devices reporting'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Data Drop Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataDrops.length}</div>
            <p className="text-xs text-muted-foreground">
              {dataDrops.length > 0 ? 
                `Latest on ${dataDrops[dataDrops.length - 1]?.date}` : 
                'No significant data drops'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">
            <BarChart2 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Database className="mr-2 h-4 w-4" />
            Device Analysis
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <Clock className="mr-2 h-4 w-4" />
            Transmission Patterns
          </TabsTrigger>
          <TabsTrigger value="failures">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Failure Analysis
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
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
                    <Tooltip content={<CustomTooltip />} />
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
                  <PieChartIcon className="mr-2 h-5 w-5 text-primary" />
                  Failure Distribution
                </CardTitle>
                <CardDescription>Top 5 devices with most transmission failures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={failureDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                      {failureDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#F44336', '#FF9800', '#FFC107', '#9C27B0', '#673AB7'][index % 5]} />
                      ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-4 py-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="mr-2 h-4 w-4 text-primary" />
                  {failureDistribution.length > 0 ? 
                    `${failureDistribution[0].name} accounts for ${failureDistribution[0].percentage}% of all failures` :
                    'No device failures detected in the selected period'
                  }
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Network Insights
                </CardTitle>
                <CardDescription>Key observations about network transmission patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                    <h3 className="font-medium flex items-center">
                      <Activity className="mr-2 h-4 w-4 text-blue-500" />
                      Transmission Activity
                    </h3>
                    <p className="text-sm mt-1">
                      Network is capturing {networkStats.dataCompleteness}% of expected data volume
                      {networkStats.dataCompleteness < 90 ? " - below optimal levels" : " - good performance"}
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-100 rounded-md p-3">
                    <h3 className="font-medium flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-orange-500" />
                      Time-based Patterns
                    </h3>
                    <p className="text-sm mt-1">
                      {hourlyPatterns.peakHour ? 
                        `Peak transmission activity at ${hourlyPatterns.peakHour.hour} (${hourlyPatterns.peakHour.dataVolume} readings)` :
                        "No hourly patterns detected"
                      }
                    </p>
                    <p className="text-sm mt-1">
                      {hourlyPatterns.lowHour ? 
                        `Lowest activity at ${hourlyPatterns.lowHour.hour} (${hourlyPatterns.lowHour.dataVolume} readings)` :
                        ""
                      }
                    </p>
                  </div>
                  
                  <div className={`${dataDrops.length > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} border rounded-md p-3`}>
                    <h3 className="font-medium flex items-center">
                      {dataDrops.length > 0 ? 
                        <AlertTriangle className="mr-2 h-4 w-4 text-red-500" /> :
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                      }
                      Network Reliability
                    </h3>
                    <p className="text-sm mt-1">
                      {dataDrops.length > 0 ? 
                        `${dataDrops.length} significant data drops detected in the selected period` :
                        "No significant data drops detected in the selected period"
                      }
                    </p>
                  </div>
                  
                  <div className={`${networkStats.failingDevices > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} border rounded-md p-3`}>
                    <h3 className="font-medium flex items-center">
                      {networkStats.failingDevices > 0 ? 
                        <WifiOff className="mr-2 h-4 w-4 text-red-500" /> :
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                      }
                      Device Health
                    </h3>
                    <p className="text-sm mt-1">
                      {networkStats.failingDevices > 0 ? 
                        `${networkStats.failingDevices} devices reporting transmission failures` :
                        "All devices are transmitting data properly"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Device Analysis Tab */}
        <TabsContent value="devices" className="space-y-4">
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
                  <BarChart data={deviceTransmissionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {/* Dynamically render bars based on available devices */}
                    {deviceTransmissionData.length > 0 && 
                      Object.keys(deviceTransmissionData[0])
                        .filter(key => key !== 'date')
                        .slice(0, 10) // Limit to 10 devices to keep chart readable
                        .map((deviceKey, index) => {
                          // Generate colors programmatically
                          const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#3F51B5', '#009688', '#795548', '#607D8B', '#E91E63']
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
              {deviceTransmissionData.length > 0 && Object.keys(deviceTransmissionData[0]).length > 11 && (
                <div className="mt-2 text-sm text-muted-foreground text-center">
                  Showing 10 of {Object.keys(deviceTransmissionData[0]).length - 1} devices. Use the device selector below to view others.
                </div>
              )}
            </CardContent>
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
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="device" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="failures" fill="#F44336" name="Data Transmission Failures" />
                    <Line yAxisId="right" type="monotone" dataKey="uptime" stroke="#4CAF50" name="Data Uptime (%)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <h3 className="text-md font-medium mb-2">Device Data Transmission Summary</h3>
                <div className="space-y-2">
                  {failureAnalysis.slice(0, 5).map(item => (
                    <div 
                      key={item.device} 
                      className={`p-2 border rounded-md ${
                        item.failures > 2 ? "bg-red-50 border-red-200" : 
                        item.failures > 0 ? "bg-yellow-50 border-yellow-200" : 
                        "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.name || item.device}</span>
                        <span>
                          {item.failures === 0 
                            ? "No failures"
                            : `${item.failures} ${item.failures === 1 ? 'failure' : 'failures'} (${item.status})`}
                        </span>
                      </div>
                    </div>
                  ))}
                  {failureAnalysis.length > 5 && (
                    <div className="p-2 border rounded-md bg-gray-50">
                      <div className="text-center text-sm text-muted-foreground">
                        + {failureAnalysis.length - 5} more devices with transmission issues
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transmission Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
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
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="dataVolume"
                      fill="#e3f2fd"
                      stroke="#2196F3"
                      name="Data Volume (KB)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="devices"
                      stroke="#FF5722"
                      strokeWidth={2}
                      name="Active Devices"
                    />
                    {/* Add reference lines for hours with device issues */}
                    {hourlyTransmissionData.map((hour, index) => {
                      const maxDevices = Math.max(...hourlyTransmissionData.map(h => h.devices))
                      if (hour.devices < maxDevices) {
                        return (
                          <ReferenceLine 
                            key={index}
                            x={hour.hour} 
                            stroke="#F44336" 
                            strokeDasharray="3 3" 
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
              <div className="space-y-2 w-full">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="mr-2 h-4 w-4 text-primary" />
                  {hourlyTransmissionData.length > 0 ? (
                    <>
                      Data volume peaks during {hourlyPatterns.peakHour?.hour || ''} with {hourlyPatterns.peakHour?.dataVolume || 0} readings
                    </>
                  ) : (
                    "Insufficient hourly data available"
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-2 border rounded-md bg-blue-50">
                    <div className="text-sm font-medium">Peak Hours</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {hourlyTransmissionData
                        .sort((a, b) => b.dataVolume - a.dataVolume)
                        .slice(0, 3)
                        .map(hour => `${hour.hour} (${hour.dataVolume})`)
                        .join(', ')}
                    </div>
                  </div>
                  
                  <div className="p-2 border rounded-md bg-yellow-50">
                    <div className="text-sm font-medium">Low Activity Hours</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {hourlyTransmissionData
                        .sort((a, b) => a.dataVolume - b.dataVolume)
                        .slice(0, 3)
                        .map(hour => `${hour.hour} (${hour.dataVolume})`)
                        .join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Weekly Transmission Pattern
                </CardTitle>
                <CardDescription>Data volume by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { day: 'Monday', volume: getDayOfWeekVolume(1, dataVolumeOverTime) },
                        { day: 'Tuesday', volume: getDayOfWeekVolume(2, dataVolumeOverTime) },
                        { day: 'Wednesday', volume: getDayOfWeekVolume(3, dataVolumeOverTime) },
                        { day: 'Thursday', volume: getDayOfWeekVolume(4, dataVolumeOverTime) },
                        { day: 'Friday', volume: getDayOfWeekVolume(5, dataVolumeOverTime) },
                        { day: 'Saturday', volume: getDayOfWeekVolume(6, dataVolumeOverTime) },
                        { day: 'Sunday', volume: getDayOfWeekVolume(0, dataVolumeOverTime) },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="volume" name="Data Volume" fill="#3F51B5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-4 py-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="mr-2 h-4 w-4 text-primary" />
                  {getWeekdayInsight(dataVolumeOverTime)}
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-primary" />
                  Transmission Quality Analysis
                </CardTitle>
                <CardDescription>Indicators of data transmission quality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Data Completeness */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Data Completeness</span>
                      <span className="text-sm font-medium">{networkStats.dataCompleteness}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getQualityColorClass(networkStats.dataCompleteness)}`} 
                        style={{ width: `${networkStats.dataCompleteness}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Device Reliability */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Device Reliability</span>
                      <span className="text-sm font-medium">
                        {networkStats.totalDevices > 0 
                          ? `${Math.round(((networkStats.totalDevices - networkStats.failingDevices) / networkStats.totalDevices) * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          getQualityColorClass(networkStats.totalDevices > 0 
                            ? Math.round(((networkStats.totalDevices - networkStats.failingDevices) / networkStats.totalDevices) * 100)
                            : 0)
                        }`} 
                        style={{ 
                          width: `${networkStats.totalDevices > 0 
                            ? Math.round(((networkStats.totalDevices - networkStats.failingDevices) / networkStats.totalDevices) * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Consistency Score */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Transmission Consistency</span>
                      <span className="text-sm font-medium">
                        {calculateConsistencyScore(deviceTransmissionData)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getQualityColorClass(calculateConsistencyScore(deviceTransmissionData))}`} 
                        style={{ width: `${calculateConsistencyScore(deviceTransmissionData)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Hourly Coverage */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">24-Hour Coverage</span>
                      <span className="text-sm font-medium">
                        {hourlyTransmissionData.length > 0 
                          ? `${Math.round((hourlyTransmissionData.length / 24) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          getQualityColorClass(hourlyTransmissionData.length > 0 
                            ? Math.round((hourlyTransmissionData.length / 24) * 100)
                            : 0)
                        }`} 
                        style={{ 
                          width: `${hourlyTransmissionData.length > 0 
                            ? Math.round((hourlyTransmissionData.length / 24) * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 border rounded-md">
                    <h3 className="text-sm font-medium">Quality Assessment</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getQualityAssessment(
                        networkStats.dataCompleteness,
                        networkStats.totalDevices > 0 
                          ? Math.round(((networkStats.totalDevices - networkStats.failingDevices) / networkStats.totalDevices) * 100)
                          : 0,
                        calculateConsistencyScore(deviceTransmissionData),
                        hourlyTransmissionData.length > 0 
                          ? Math.round((hourlyTransmissionData.length / 24) * 100)
                          : 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Failure Analysis Tab */}
        <TabsContent value="failures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-primary" />
                Detailed Failure Analysis
              </CardTitle>
              <CardDescription>Comprehensive view of device failure patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-red-50 border border-red-100 rounded-md p-3">
                    <div className="text-sm font-medium">Total Failures</div>
                    <div className="text-2xl font-bold mt-1">
                      {failureAnalysis.reduce((sum, device) => sum + device.failures, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Across {failureAnalysis.filter(d => d.failures > 0).length} devices
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3">
                    <div className="text-sm font-medium">Average Uptime</div>
                    <div className="text-2xl font-bold mt-1">
                      {Math.round(failureAnalysis.reduce((sum, device) => sum + device.uptime, 0) / 
                        (failureAnalysis.length || 1))}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Network-wide average
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                    <div className="text-sm font-medium">Most Recent Failure</div>
                    <div className="text-lg font-bold mt-1">
                      {getLatestFailureDate(failureAnalysis)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Based on available data
                    </div>
                  </div>
                </div>
                
                {/* Devices with most failures */}
                <div>
                  <h3 className="text-md font-medium mb-3">Devices with Most Failures</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Device ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Failures
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Uptime
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {failureAnalysis.slice(0, 5).map((device) => (
                          <tr key={device.device}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {device.device}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {device.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Badge className={device.failures > 2 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                {device.failures}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div className={`h-2 rounded-full ${getQualityColorClass(device.uptime)}`} style={{ width: `${device.uptime}%` }}></div>
                                </div>
                                <span>{Math.round(device.uptime)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {device.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Failure pattern analysis */}
                <div>
                  <h3 className="text-md font-medium mb-3">Failure Pattern Analysis</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Time-based patterns */}
                    <div className="border rounded-md p-3">
                      <h4 className="text-sm font-medium mb-2">Time-based Patterns</h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{getTimePatternsInsight(hourlyTransmissionData, failureAnalysis)}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{getWeekdayFailureInsight(dataVolumeOverTime, deviceTransmissionData)}</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Device-based patterns */}
                    <div className="border rounded-md p-3">
                      <h4 className="text-sm font-medium mb-2">Device-based Patterns</h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{getDevicePatternInsight(failureAnalysis)}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>
                            {failureAnalysis.length > 0 ? 
                              `${Math.round(100 * failureAnalysis.filter(d => d.failures > 0).length / failureAnalysis.length)}% of devices have experienced at least one failure.` :
                              "No failure data available."
                            }
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Recommendations */}
                <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
                  <h3 className="text-md font-medium mb-2 flex items-center">
                    <Share2 className="mr-2 h-4 w-4 text-blue-500" />
                    Recommendations
                  </h3>
                  <ul className="text-sm space-y-2">
                    {generateRecommendations(
                      networkStats, 
                      failureAnalysis,
                      hourlyTransmissionData,
                      dataDrops
                    ).map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


  

  // Helper functions for DataTransmissionAnalysis component

// Calculate data volume for a specific day of week
function getDayOfWeekVolume(dayNumber, volumeData) {
   if (!volumeData || volumeData.length === 0) return 0;
    const matchingDays = volumeData.filter(day => {
      const date = new Date(day.date);
      return date.getDay() === dayNumber;
    });
    
    if (matchingDays.length === 0) return 0;
    return matchingDays.reduce((sum, day) => sum + day.dataVolume, 0) / matchingDays.length;
  }
  
  // Generate insight about weekday patterns
  function getWeekdayInsight(volumeData) {
    const weekdayData = [
      { day: 0, name: 'Sunday', volume: getDayOfWeekVolume(0, volumeData) },
      { day: 1, name: 'Monday', volume: getDayOfWeekVolume(1, volumeData) },
      { day: 2, name: 'Tuesday', volume: getDayOfWeekVolume(2, volumeData) },
      { day: 3, name: 'Wednesday', volume: getDayOfWeekVolume(3, volumeData) },
      { day: 4, name: 'Thursday', volume: getDayOfWeekVolume(4, volumeData) },
      { day: 5, name: 'Friday', volume: getDayOfWeekVolume(5, volumeData) },
      { day: 6, name: 'Saturday', volume: getDayOfWeekVolume(6, volumeData) }
    ];
    
    // Find day with max volume
    const maxVolumeDay = weekdayData.reduce((max, day) => day.volume > max.volume ? day : max, weekdayData[0]);
    
    // Find day with min volume
    const minVolumeDay = weekdayData.reduce((min, day) => day.volume < min.volume ? day : min, weekdayData[0]);
    
    // Calculate weekday vs weekend difference
    const weekdayAvg = [1,2,3,4,5].reduce((sum, day) => 
      sum + getDayOfWeekVolume(day, volumeData), 0) / 5;
    const weekendAvg = [0,6].reduce((sum, day) => 
      sum + getDayOfWeekVolume(day, volumeData), 0) / 2;
    
    if (weekdayAvg > weekendAvg * 1.2) {
      return `Weekdays have ${Math.round((weekdayAvg / weekendAvg - 1) * 100)}% more data volume than weekends.`;
    } else if (weekendAvg > weekdayAvg * 1.2) {
      return `Weekends have ${Math.round((weekendAvg / weekdayAvg - 1) * 100)}% more data volume than weekdays.`;
    } else {
      return `${maxVolumeDay.name} has the highest data volume, ${minVolumeDay.name} has the lowest.`;
    }
  }
  
  // Generate insight about weekday failure patterns
  function getWeekdayFailureInsight(volumeData, transmissionData) {
    if (!transmissionData || transmissionData.length === 0) {
      return "Insufficient data to analyze weekday failure patterns.";
    }
    
    // Count failures by day of week
    const failuresByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    
    transmissionData.forEach(day => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      
      // Count devices that didn't transmit
      let failuresOnThisDay = 0;
      Object.entries(day).forEach(([key, value]) => {
        if (key !== 'date' && value === 0) {
          failuresOnThisDay++;
        }
      });
      
      failuresByDayOfWeek[dayOfWeek] += failuresOnThisDay;
    });
    
    // Find day with most failures
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxFailureDay = failuresByDayOfWeek.indexOf(Math.max(...failuresByDayOfWeek));
    
    // Weekday vs weekend comparison
    const weekdayFailures = [1,2,3,4,5].reduce((sum, day) => sum + failuresByDayOfWeek[day], 0);
    const weekendFailures = failuresByDayOfWeek[0] + failuresByDayOfWeek[6];
    
    if (weekdayFailures > weekendFailures * 2) {
      return `Transmission failures occur most frequently on weekdays, with ${dayNames[maxFailureDay]} showing the highest rate.`;
    } else if (weekendFailures > weekdayFailures) {
      return `Transmission failures occur more frequently on weekends compared to weekdays.`;
    } else {
      return `${dayNames[maxFailureDay]} shows the highest rate of transmission failures.`;
    }
  }
  
  // Get color class based on quality score
  function getQualityColorClass(score) {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }
  
  // Calculate consistency score based on device transmission data
  function calculateConsistencyScore(transmissionData) {
    if (!transmissionData || transmissionData.length === 0) return 0;
    
    // Get list of all devices
    const devices = new Set();
    transmissionData.forEach(day => {
      Object.keys(day).forEach(key => {
        if (key !== 'date') devices.add(key);
      });
    });
    
    // For each device, calculate % of days with transmission
    let totalScore = 0;
    devices.forEach(device => {
      let daysWithData = 0;
      
      transmissionData.forEach(day => {
        if (day[device] && day[device] > 0) {
          daysWithData++;
        }
      });
      
      const deviceScore = (daysWithData / transmissionData.length) * 100;
      totalScore += deviceScore;
    });
    
    // Average across all devices
    return Math.round(totalScore / devices.size);
  }
  
  // Get quality assessment based on metrics
  function getQualityAssessment(completeness, reliability, consistency, coverage) {
    const averageScore = (completeness + reliability + consistency + coverage) / 4;
    
    if (averageScore >= 90) {
      return "Excellent data transmission quality. The network is performing optimally with high reliability and consistency.";
    } else if (averageScore >= 75) {
      return "Good data transmission quality. The network is performing well but some minor improvements could be made.";
    } else if (averageScore >= 60) {
      return "Fair data transmission quality. The network has areas that need attention to improve reliability.";
    } else {
      return "Poor data transmission quality. The network requires significant improvements to reliability and consistency.";
    }
  }
  
  // Get latest failure date from failure analysis
  function getLatestFailureDate(failureAnalysis) {
    if (!failureAnalysis || failureAnalysis.length === 0) return "N/A";
    
    // Try to extract date from status field for devices with failures
    const devicesWithFailures = failureAnalysis.filter(d => d.failures > 0);
    if (devicesWithFailures.length === 0) return "No failures";
    
    const dateRegex = /(\d{4}-\d{2}-\d{2})/;
    const extractedDates = [];
    
    devicesWithFailures.forEach(device => {
      const match = device.status?.match(dateRegex);
      if (match && match[1]) {
        extractedDates.push(match[1]);
      }
    });
    
    if (extractedDates.length === 0) return "Unknown date";
    
    // Sort dates in descending order and return the most recent
    extractedDates.sort((a, b) => new Date(b) - new Date(a));
    return extractedDates[0];
  }
  
  // Get time-based patterns insight
  function getTimePatternsInsight(hourlyData, failureAnalysis) {
    if (!hourlyData || hourlyData.length === 0) {
      return "Insufficient hourly data to analyze time-based patterns.";
    }
    
    // Find hour with lowest device count
    const lowestDeviceHour = hourlyData.reduce(
      (min, hour) => hour.devices < min.devices ? hour : min,
      hourlyData[0]
    );
    
    const totalFailures = failureAnalysis.reduce((sum, device) => sum + device.failures, 0);
    
    if (totalFailures > 0 && lowestDeviceHour) {
      return `Most transmission failures occur around ${lowestDeviceHour.hour}, when device activity is lowest.`;
    } else if (hourlyData.length < 24) {
      return `Data is missing for ${24 - hourlyData.length} hours of the day, suggesting periodic connectivity issues.`;
    } else {
      return "No significant time-based failure patterns detected.";
    }
  }
  
  // Get device pattern insight
  function getDevicePatternInsight(failureAnalysis) {
    if (!failureAnalysis || failureAnalysis.length === 0) {
      return "No device failure pattern data available.";
    }
    
    // Count devices with various failure levels
    const severeIssues = failureAnalysis.filter(d => d.failures > 3).length;
    const moderateIssues = failureAnalysis.filter(d => d.failures > 1 && d.failures <= 3).length;
    const minorIssues = failureAnalysis.filter(d => d.failures === 1).length;
    
    const totalDevices = failureAnalysis.length;
    
    if (severeIssues > totalDevices * 0.2) {
      return `${severeIssues} devices (${Math.round(severeIssues/totalDevices*100)}%) have severe transmission issues with 4+ failures.`;
    } else if (severeIssues + moderateIssues > totalDevices * 0.3) {
      return `${severeIssues + moderateIssues} devices (${Math.round((severeIssues+moderateIssues)/totalDevices*100)}%) have moderate to severe transmission issues.`;
    } else if (minorIssues > 0) {
      return `Most devices are reliable with only ${minorIssues} having a single transmission failure.`;
    } else {
      return "All devices show good transmission reliability with no detected failures.";
    }
  }
  
  
  export {
    getDayOfWeekVolume,
    getWeekdayInsight,
    getWeekdayFailureInsight,
    getQualityColorClass,
    calculateConsistencyScore,
    getQualityAssessment,
    getLatestFailureDate,
    getTimePatternsInsight,
    getDevicePatternInsight,
    generateRecommendations
  };