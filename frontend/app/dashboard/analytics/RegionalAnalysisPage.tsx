// components/RegionalAnalysis.jsx
"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Download,
  RefreshCw,
  Activity,
  Signal,
  SignalZero,
  Percent,
  Wind,
} from "lucide-react"
import { config } from "@/lib/config"

// AQI color mapping
const aqiColors = {
  good: "#4CAF50",
  moderate: "#FFC107",
  unhealthySensitive: "#FF9800",
  unhealthy: "#F44336",
  veryUnhealthy: "#9C27B0",
  hazardous: "#B71C1C",
}

export default function RegionalAnalysis({ timeRange }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [regions, setRegions] = useState([])
  const [selectedRegion, setSelectedRegion] = useState("")
  const [currentRegion, setCurrentRegion] = useState(null)
  const [summary, setSummary] = useState(null)
  const [countriesInRegion, setCountriesInRegion] = useState([])

  // Fetch all regions on component mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${config.apiUrl}/network-analysis/regional`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        
        const data = await response.json()
        if (data.regions && data.regions.length > 0) {
          setRegions(data.regions)
          // Set first region as selected by default
          setSelectedRegion(data.regions[0].region)
        }
      } catch (err) {
        console.error("Failed to fetch regions:", err)
        setError("Failed to load regions. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    const fetchSummary = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/network-analysis/summary`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        
        const data = await response.json()
        setSummary(data)
      } catch (err) {
        console.error("Failed to fetch summary:", err)
      }
    }

    fetchRegions()
    fetchSummary()
  }, [])

  // Fetch specific region data when selectedRegion changes
  useEffect(() => {
    if (!selectedRegion) return

    const fetchRegionData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${config.apiUrl}/network-analysis/regional/${encodeURIComponent(selectedRegion)}`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        
        const regionData = await response.json()
        setCurrentRegion(regionData)

        // Fetch countries in this region
        await fetchCountriesInRegion(selectedRegion)
      } catch (err) {
        console.error(`Failed to fetch data for region ${selectedRegion}:`, err)
        setError(`Failed to load data for ${selectedRegion}. Please try again later.`)
      } finally {
        setLoading(false)
      }
    }

    fetchRegionData()
  }, [selectedRegion])

  // Fetch countries in selected region
  const fetchCountriesInRegion = async (region) => {
    try {
      const response = await fetch(`${config.apiUrl}/network-analysis/countries`)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      
      const data = await response.json()
      // Filter countries based on selected region
      const countries = data.countries.filter(country => {
        return country.data && country.data.region === region
      })
      
      setCountriesInRegion(countries)
    } catch (err) {
      console.error("Failed to fetch countries:", err)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    if (selectedRegion) {
      // Re-fetch the current region data
      const fetchRegionData = async () => {
        try {
          setLoading(true)
          const response = await fetch(`${config.apiUrl}/network-analysis/regional/${encodeURIComponent(selectedRegion)}`)
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
          }
          
          const regionData = await response.json()
          setCurrentRegion(regionData)
          await fetchCountriesInRegion(selectedRegion)
        } catch (err) {
          console.error(`Failed to refresh data for region ${selectedRegion}:`, err)
          setError(`Failed to refresh data for ${selectedRegion}. Please try again later.`)
        } finally {
          setLoading(false)
        }
      }

      fetchRegionData()
    }
  }

  // Prepare AQI distribution data for pie chart
  const getAqiDistributionData = () => {
    if (!currentRegion || !currentRegion.data) return []
    
    const aqiData = currentRegion.data

    return [
      { name: "Good", value: aqiData.aqiGood || 0, color: aqiColors.good },
      { name: "Moderate", value: aqiData.aqiModerate || 0, color: aqiColors.moderate },
      { name: "UHFSG", value: aqiData.aqiUhfsg || 0, color: aqiColors.unhealthySensitive },
      { name: "Unhealthy", value: aqiData.aqiUnhealthy || 0, color: aqiColors.unhealthy },
      { name: "V.Unhealthy", value: aqiData.aqiVeryUnhealthy || 0, color: aqiColors.veryUnhealthy },
      { name: "Hazardous", value: aqiData.aqiHazardous || 0, color: aqiColors.hazardous },
    ]
  }

  // Format country data for charts
  const getCountryChartData = () => {
    if (!countriesInRegion || countriesInRegion.length === 0) return []
    
    return countriesInRegion.map(country => {
      const onlineDevices = country.data?.onlineDevices || 0;
      const offlineDevices = country.data?.offlineDevices || 0;
      
      return {
        name: country.country,
        devices: onlineDevices + offlineDevices, 
        onlineDevices: onlineDevices,
        offlineDevices: offlineDevices
      }
    })
  }

  // Show loading state
  if (loading && !currentRegion) {
    return <div className="p-8 text-center">Loading regional data...</div>
  }

  // Show error state
  if (error && !currentRegion) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    )
  }

  // Extract region data
  const regionData = currentRegion?.data || {}
  const regionAqiData = getAqiDistributionData()
  const countryChartData = getCountryChartData()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.region} value={region.region}>
                  {region.region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="flex items-center" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
        </div>
      </div>

      {/* AQI Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {regionAqiData.map((item) => (
          <Card key={item.name} className="overflow-hidden">
            <CardHeader className={`pb-2 bg-gradient-to-r from-${item.name.toLowerCase()}-500/10 to-transparent`}>
              <CardTitle className="text-sm font-medium text-center">{item.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex justify-center">
              <div 
                className="text-3xl font-bold flex items-center justify-center h-16 w-16 rounded-full text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Region-specific metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Signal className="mr-2 h-5 w-5 text-green-500" />
              Online Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regionData.onlineDevices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {regionData.deviceCount ? 
                ((regionData.onlineDevices / regionData.deviceCount) * 100).toFixed(1) : 0}% of total devices
            </p>
            <div className="mt-2">
              <Progress
                value={regionData.deviceCount ? 
                  (regionData.onlineDevices / regionData.deviceCount) * 100 : 0}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <SignalZero className="mr-2 h-5 w-5 text-red-500" />
              Offline Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regionData.offlineDevices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {regionData.deviceCount ? 
                ((regionData.offlineDevices / regionData.deviceCount) * 100).toFixed(1) : 0}% of total devices
            </p>
            <div className="mt-2">
              <Progress
                value={regionData.deviceCount ? 
                  (regionData.offlineDevices / regionData.deviceCount) * 100 : 0}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Percent className="mr-2 h-5 w-5 text-primary" />
              Data Completeness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regionData.dataCompleteness?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Average across all devices</p>
            <div className="mt-2">
              <Progress value={regionData.dataCompleteness || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wind className="mr-2 h-5 w-5 text-primary" />
              Average PM2.5
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regionData.pm25?.toFixed(1) || 0} μg/m³</div>
            <p className="text-xs text-muted-foreground">Regional average</p>
            <div className="mt-2">
              <Progress value={Math.min(100, ((regionData.pm25 || 0) / 50) * 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wind className="mr-2 h-5 w-5 text-primary" />
              Average PM10
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regionData.pm10?.toFixed(1) || 0} μg/m³</div>
            <p className="text-xs text-muted-foreground">Regional average</p>
            <div className="mt-2">
              <Progress value={Math.min(100, ((regionData.pm10 || 0) / 100) * 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Data Transmission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regionData.dataTransmissionRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Regional average</p>
            <div className="mt-2">
              <Progress value={regionData.dataTransmissionRate || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Device Distribution by Country
            </CardTitle>
            <CardDescription>Number of devices by country in {selectedRegion}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={countryChartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="devices" name="Total Devices" fill="#4CAF50" />
                  <Bar dataKey="onlineDevices" name="Online Devices" fill="#2196F3" />
                  <Bar dataKey="offlineDevices" name="Offline Devices" fill="#F44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wind className="mr-2 h-5 w-5 text-primary" />
              AQI Distribution
            </CardTitle>
            <CardDescription>Distribution of AQI categories in {selectedRegion}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionAqiData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {regionAqiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}