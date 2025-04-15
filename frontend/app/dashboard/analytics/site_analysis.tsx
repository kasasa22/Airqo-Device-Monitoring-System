
"use client"

import { useState, useEffect } from "react"
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
  ComposedChart,
  Area,
} from "recharts"
import {
  Download,
  RefreshCw,
  Activity,
  AlertTriangle,
  Settings,
  MapPin,
  Info,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// Define API base path with a fallback to localhost if env variable isn't set
const apiBasePath = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// AQI color mapping
const aqiColors = {
  "good": "#4CAF50",
  "moderate": "#FFC107",
  "unhealthy for sensitive groups": "#FF9800",
  "unhealthy": "#F44336",
  "very unhealthy": "#9C27B0",
  "hazardous": "#B71C1C"
}

export default function SiteAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("week")
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState("")
  const [locationData, setLocationData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch locations list on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${apiBasePath}/site-analytics/locations`)
        if (!response.ok) {
          throw new Error('Failed to fetch locations')
        }
        const data = await response.json()
        
        // Filter to unique location_ids by creating a Map
        // This ensures each location_id only appears once in the dropdown
        const uniqueLocationsMap = new Map();
        
        data.forEach(location => {
          // If we haven't seen this location_id before, or want to replace with a better entry
          if (!uniqueLocationsMap.has(location.location_id)) {
            uniqueLocationsMap.set(location.location_id, location);
          }
        });
        
        // Convert Map back to array
        const uniqueLocations = Array.from(uniqueLocationsMap.values());
        
        setLocations(uniqueLocations)
        
        // Set the first location as default if available
        if (uniqueLocations.length > 0 && !selectedLocation) {
          setSelectedLocation(uniqueLocations[0].location_id)
        }
      } catch (err) {
        setError('Error loading locations: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLocations()
  }, [])

  // Fetch location data when selectedLocation or timeRange changes
  useEffect(() => {
    if (!selectedLocation) return
    
    const fetchLocationData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Make sure to include both the location ID and time range in the request
        const response = await fetch(`${apiBasePath}/site-analytics/location/${selectedLocation}?time_range=${timeRange}`)
        if (!response.ok) {
          throw new Error('Failed to fetch location data')
        }
        const data = await response.json()
        setLocationData(data)
      } catch (err) {
        setError('Error loading location data: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLocationData()
  }, [selectedLocation, timeRange])

  // Handle refresh
  const handleRefresh = () => {
    if (selectedLocation) {
      const fetchLocationData = async () => {
        setIsLoading(true)
        setError(null)
        
        try {
          const response = await fetch(`${apiBasePath}/site-analytics/locations/${selectedLocation}?time_range=${timeRange}`)
          if (!response.ok) {
            throw new Error('Failed to fetch location data')
          }
          const data = await response.json()
          setLocationData(data)
        } catch (err) {
          setError('Error refreshing data: ' + err.message)
        } finally {
          setIsLoading(false)
        }
      }

      fetchLocationData()
    }
  }

  // Format the AQI distribution data for charts
  const formatAqiDistributionForChart = (aqiData) => {
    if (!aqiData) return []
    
    return [
      { name: "Good", value: aqiData.good || 0, color: "#4CAF50" },
      { name: "Moderate", value: aqiData.moderate || 0, color: "#FFC107" },
      { name: "Unhealthy for Sensitive Groups", value: aqiData.unhealthy_sensitive || 0, color: "#FF9800" },
      { name: "Unhealthy", value: aqiData.unhealthy || 0, color: "#F44336" },
      { name: "Very Unhealthy", value: aqiData.very_unhealthy || 0, color: "#9C27B0" },
      { name: "Hazardous", value: aqiData.hazardous || 0, color: "#B71C1C" }
    ].filter(item => item.value > 0) // Only include non-zero values
  }

  // Render loading state
  if (isLoading && !locationData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading location data...</p>
        </div>
      </div>
    )
  }

  // Render error state
  if (error && !locationData) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Site Analytics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last Day</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="flex items-center">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Location Selector */}
      <div className="mb-6">
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.location_id} value={location.location_id}>
                {location.display_name} ({location.location_type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {locationData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="text-sm font-medium">Location</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{locationData.location.display_name || locationData.location.country}</div>
                <div className="text-sm text-muted-foreground capitalize">{locationData.location.location_type}</div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="text-sm font-medium">Sites</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{locationData.metrics.total_sites || 0}</div>
                <div className="text-sm text-muted-foreground">Monitoring sites in this location</div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="text-sm font-medium">Data Completeness</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{locationData.metrics.avg_data_completeness ? Math.round(locationData.metrics.avg_data_completeness) + '%' : 'N/A'}</div>
                <div className="text-sm text-muted-foreground">Average data completeness</div>
              </CardContent>
            </Card>
          </div>

          {/* Average PM2.5 and PM10 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Average PM2.5
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {locationData.metrics.avg_pm25 
                    ? `${locationData.metrics.avg_pm25.toFixed(1)} μg/m³` 
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Average PM2.5 across all sites</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Average PM10
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {locationData.metrics.avg_pm10
                    ? `${locationData.metrics.avg_pm10.toFixed(1)} μg/m³`
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Average PM10 across all sites</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Active Sites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {locationData.time_series && locationData.time_series.length > 0 
                    ? locationData.time_series[locationData.time_series.length - 1].active_sites || 0
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">Currently active monitoring sites</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {locationData.time_series && locationData.time_series.length > 0 
                    ? `${Math.round(locationData.time_series[locationData.time_series.length - 1].uptime || 0)}%`
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Average uptime for all devices</p>
              </CardContent>
            </Card>
          </div>

          {/* AQI Distribution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 to-transparent">
                <CardTitle className="text-sm font-medium text-center">Good</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex justify-center">
                <div className="text-3xl font-bold flex items-center justify-center h-16 w-16 rounded-full bg-green-500 text-white">
                  {locationData.aqi_distribution.good || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-yellow-500/10 to-transparent">
                <CardTitle className="text-sm font-medium text-center">Moderate</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex justify-center">
                <div className="text-3xl font-bold flex items-center justify-center h-16 w-16 rounded-full bg-yellow-500 text-white">
                  {locationData.aqi_distribution.moderate || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-orange-500/10 to-transparent">
                <CardTitle className="text-sm font-medium text-center">UHFSG</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex justify-center">
                <div className="text-3xl font-bold flex items-center justify-center h-16 w-16 rounded-full bg-orange-500 text-white">
                  {locationData.aqi_distribution.unhealthy_sensitive || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-red-500/10 to-transparent">
                <CardTitle className="text-sm font-medium text-center">Unhealthy</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex justify-center">
                <div className="text-3xl font-bold flex items-center justify-center h-16 w-16 rounded-full bg-red-500 text-white">
                  {locationData.aqi_distribution.unhealthy || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/10 to-transparent">
                <CardTitle className="text-sm font-medium text-center">V.Unhealthy</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex justify-center">
                <div className="text-3xl font-bold flex items-center justify-center h-16 w-16 rounded-full bg-purple-500 text-white">
                  {locationData.aqi_distribution.very_unhealthy || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-gradient-to-r from-red-900/10 to-transparent">
                <CardTitle className="text-sm font-medium text-center">Hazardous</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex justify-center">
                <div className="text-3xl font-bold flex items-center justify-center h-16 w-16 rounded-full bg-red-900 text-white">
                  {locationData.aqi_distribution.hazardous || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Site Overview</TabsTrigger>
              <TabsTrigger value="air-quality">Air Quality</TabsTrigger>
              <TabsTrigger value="devices">Device Details</TabsTrigger>
              <TabsTrigger value="time-series">Time Series</TabsTrigger>
            </TabsList>

            {/* Tab contents remain the same */}
            {/* ... */}
            
            <TabsContent value="devices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-primary" />
                    Sites in {locationData.location.display_name || locationData.location.country}
                  </CardTitle>
                  <CardDescription>Details of all monitoring sites in this location with latest PM readings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Site Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Latest PM2.5</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Latest PM10</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Last Reading</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">AQI Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locationData.sites && locationData.sites.length > 0 ? (
                          locationData.sites.map((site, index) => (
                            <tr 
                              key={`${site.site_id}_${index}`} // Ensure unique keys for sites
                              className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                            >
                              <td className="py-3 px-4 font-medium">{site.site_name || site.site_id}</td>
                              <td className="py-3 px-4">{site.location_name || `${site.city || site.district || site.country}`}</td>
                              <td className="py-3 px-4">
                                {site.latest_pm2_5 !== undefined ? `${site.latest_pm2_5.toFixed(1)} μg/m³` : "N/A"}
                              </td>
                              <td className="py-3 px-4">
                                {site.latest_pm10 !== undefined ? `${site.latest_pm10.toFixed(1)} μg/m³` : "N/A"}
                              </td>
                              <td className="py-3 px-4">
                                {site.last_reading_time ? new Date(site.last_reading_time).toLocaleString() : "N/A"}
                              </td>
                              <td className="py-3 px-4">
                                {site.aqi_category ? (
                                  <Badge 
                                    style={{ 
                                      backgroundColor: aqiColors[site.aqi_category.toLowerCase()] || "#888",
                                      color: "#fff" 
                                    }}
                                  >
                                    {site.aqi_category}
                                  </Badge>
                                ) : "N/A"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-4 text-center text-muted-foreground">No sites found in this location</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="time-series" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-primary" />
                    Active Sites and Uptime
                  </CardTitle>
                  <CardDescription>Number of active sites and data uptime percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {locationData.time_series && locationData.time_series.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={locationData.time_series}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="reading_date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString()} 
                          />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <Legend />
                          <Bar 
                            yAxisId="left" 
                            dataKey="active_sites" 
                            name="Active Sites" 
                            fill="#8884d8" 
                          />
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="uptime" 
                            name="Uptime (%)" 
                            stroke="#ff7300" 
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No uptime data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}