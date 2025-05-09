"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  AlertCircle, 
  AlertTriangle, 
  Bell, 
  Calendar, 
  Check,
  CheckCircle, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  Clock, 
  Filter, 
  MapPin,  
  MoreHorizontal, 
  RefreshCw, 
  Search, 
  WifiOff, 
  Zap,
  Wifi,
  Battery,
  Thermometer
} from "lucide-react"
import { format, subDays, isAfter, isBefore, parseISO } from "date-fns"
import { config } from "@/lib/config"

export default function AlertsPage() {
  // State management
  const [alerts, setAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filtering and pagination state
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const alertsPerPage = 10

  // Fetch alerts from API (in this case using maintenance history from devices)
  const fetchAlerts = async () => {
    try {
      setIsLoading(true)
      
      // Using the devices-detail endpoint to get maintenance history
      const response = await fetch(`${config.apiUrl}/devices-detail`)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      const devices = data.devices || []
      
      // Process all maintenance events as alerts
      const allAlerts = devices
        .flatMap(device => 
          (device.maintenance_history || []).map(event => ({
            id: `${device.device.id}-${event.timestamp}`,
            deviceId: device.device.id,
            deviceName: device.device.name,
            type: getAlertType(event.maintenance_type),
            message: event.description,
            location: device.location.name || 
                    (device.location.city ? `${device.location.city}, ${device.location.country || ''}` : "Unknown location"),
            timestamp: event.timestamp,
            formattedDate: format(new Date(event.timestamp), 'MMM dd, yyyy'),
            formattedTime: format(new Date(event.timestamp), 'HH:mm'),
            icon: getAlertIcon(event.maintenance_type),
            status: event.maintenance_type
          }))
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      setAlerts(allAlerts)
      setTotalPages(Math.ceil(allAlerts.length / alertsPerPage))
      setError(null)
    } catch (err) {
      console.error("Error fetching alerts:", err)
      setError("Failed to load alerts data")
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to determine alert type
  function getAlertType(maintenanceType) {
    switch(maintenanceType) {
      case "Offline":
        return "critical"
      case "Restored":
        return "success"
      default:
        return "warning"
    }
  }
  
  // Helper function to determine alert icon
  function getAlertIcon(maintenanceType) {
    switch(maintenanceType) {
      case "Offline":
        return <WifiOff className="h-4 w-4" />
      case "Restored":
        return <Wifi className="h-4 w-4" />
      case "Low Battery":
        return <Battery className="h-4 w-4" />
      case "Temperature Warning":
        return <Thermometer className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Load alerts when component mounts
  useEffect(() => {
    fetchAlerts()
  }, [])

  // Filter and sort alerts based on user selections
  const filteredAlerts = alerts.filter(alert => {
    // Search term filter
    const matchesSearch = 
      alert.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Type filter
    const matchesType = 
      typeFilter === "all" || 
      (typeFilter === "critical" && alert.type === "critical") ||
      (typeFilter === "warning" && alert.type === "warning") ||
      (typeFilter === "success" && alert.type === "success")
    
    // Time filter
    let matchesTime = true
    const alertDate = new Date(alert.timestamp)
    const now = new Date()
    
    if (timeFilter === "today") {
      const startOfToday = new Date(now)
      startOfToday.setHours(0, 0, 0, 0)
      matchesTime = isAfter(alertDate, startOfToday)
    } else if (timeFilter === "yesterday") {
      const startOfYesterday = new Date(now)
      startOfYesterday.setDate(startOfYesterday.getDate() - 1)
      startOfYesterday.setHours(0, 0, 0, 0)
      const startOfToday = new Date(now)
      startOfToday.setHours(0, 0, 0, 0)
      matchesTime = isAfter(alertDate, startOfYesterday) && isBefore(alertDate, startOfToday)
    } else if (timeFilter === "week") {
      const startOfWeek = subDays(now, 7)
      matchesTime = isAfter(alertDate, startOfWeek)
    }
    
    return matchesSearch && matchesType && matchesTime
  })

  // Sort the filtered alerts
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.timestamp) - new Date(a.timestamp)
    } else {
      return new Date(a.timestamp) - new Date(b.timestamp)
    }
  })

  // Get current page of alerts
  const currentAlerts = sortedAlerts.slice(
    (currentPage - 1) * alertsPerPage,
    currentPage * alertsPerPage
  )

  // Calculate alert counts by type
  const criticalCount = alerts.filter(alert => alert.type === "critical").length
  const warningCount = alerts.filter(alert => alert.type === "warning").length
  const successCount = alerts.filter(alert => alert.type === "success").length

  // Update total pages when filters change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredAlerts.length / alertsPerPage))
    setCurrentPage(1) // Reset to first page when filters change
  }, [filteredAlerts.length, alertsPerPage])

  // Get alert variant based on type
  const getAlertVariant = (type) => {
    switch(type) {
      case "critical":
        return "destructive"
      case "success":
        return "success"
      default:
        return "warning"
    }
  }

  // Get CSS classes for alert styling
  const getAlertClasses = (type) => {
    switch(type) {
      case "critical":
        return "border-l-4 border-l-red-500 bg-red-50 text-red-800"
      case "success":
        return "border-l-4 border-l-green-500 bg-green-50 text-green-800"
      default:
        return "border-l-4 border-l-yellow-500 bg-yellow-50 text-yellow-800"
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Alerts</h1>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center"
          onClick={fetchAlerts}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> 
          {isLoading ? 'Loading...' : 'Refresh Alerts'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 bg-gradient-to-r from-red-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-red-500">
              {isLoading ? '...' : criticalCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 bg-gradient-to-r from-yellow-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
              Warning Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-yellow-500">
              {isLoading ? '...' : warningCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <Check className="mr-2 h-5 w-5 text-green-500" />
              Resolved Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-500">
              {isLoading ? '...' : successCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" onValueChange={setTypeFilter}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-4">
          <TabsList>
            <TabsTrigger value="all" className="relative">
              All Alerts
              <Badge className="ml-2 bg-gray-200 text-gray-800">{filteredAlerts.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="critical" className="relative">
              Critical
              <Badge className="ml-2 bg-red-100 text-red-800">{criticalCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="warning" className="relative">
              Warning
              <Badge className="ml-2 bg-yellow-100 text-yellow-800">{warningCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="success" className="relative">
              Resolved
              <Badge className="ml-2 bg-green-100 text-green-800">{successCount}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search alerts..."
                className="pl-9 w-full sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Past week</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[130px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mr-2" />
                  <p>Loading alerts...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="h-96 flex items-center justify-center flex-col p-6">
                  <Bell className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg text-gray-500 mb-1">No alerts found</p>
                  <p className="text-sm text-gray-400">
                    {searchTerm ? "Try adjusting your search or filters" : "All systems are running normally"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {currentAlerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      variant={getAlertVariant(alert.type)}
                      className={`${getAlertClasses(alert.type)} hover:shadow-sm transition-shadow`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="mr-3">
                            {alert.icon}
                          </div>
                          <div>
                            <AlertTitle className="flex items-center font-medium mb-1">
                              {alert.deviceName}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {alert.status}
                              </Badge>
                            </AlertTitle>
                            <AlertDescription className="text-sm">{alert.message}</AlertDescription>
                            <div className="flex items-center mt-1.5 text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="mr-4">{alert.location}</span>
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{alert.formattedDate} {alert.formattedTime}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
            {!isLoading && filteredAlerts.length > 0 && (
              <CardFooter className="flex items-center justify-between border-t p-4">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * alertsPerPage + 1}-
                  {Math.min(currentPage * alertsPerPage, filteredAlerts.length)} of {filteredAlerts.length} alerts
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="critical" className="mt-0">
          <Card>
            <CardContent className="p-4 space-y-4">
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mr-2" />
                  <p>Loading critical alerts...</p>
                </div>
              ) : currentAlerts.length === 0 ? (
                <div className="h-96 flex items-center justify-center flex-col">
                  <CheckCircle className="h-16 w-16 text-green-300 mb-4" />
                  <p className="text-lg text-gray-500">No critical alerts found</p>
                </div>
              ) : (
                currentAlerts
                  .filter(alert => alert.type === "critical")
                  .map((alert) => (
                    <Alert
                      key={alert.id}
                      variant="destructive"
                      className="border-l-4 border-l-red-500 bg-red-50 text-red-800 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="mr-3">
                            {alert.icon}
                          </div>
                          <div>
                            <AlertTitle className="flex items-center font-medium mb-1">
                              {alert.deviceName}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {alert.status}
                              </Badge>
                            </AlertTitle>
                            <AlertDescription className="text-sm">{alert.message}</AlertDescription>
                            <div className="flex items-center mt-1.5 text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="mr-4">{alert.location}</span>
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{alert.formattedDate} {alert.formattedTime}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </Alert>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="warning" className="mt-0">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Warning alerts content - similar structure */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="success" className="mt-0">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Success/resolved alerts content - similar structure */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Alert Distribution Over Time</CardTitle>
          <CardDescription>
            Visualization of alert frequency by type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* You could add a chart here showing alert distribution over time */}
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Alert trend visualization would appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}