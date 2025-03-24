"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  FileText,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  FileBarChart,
  FilePieChart,
  FileSpreadsheet,
  FileCheck,
  Share2,
  AlertCircle,
  CalendarClock,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Sample report data
const sampleReports = [
  {
    id: 1,
    name: "Monthly Air Quality Summary - June 2024",
    type: "summary",
    createdBy: "John Doe",
    createdAt: "2024-06-30",
    status: "completed",
    format: "pdf",
    size: "2.4 MB",
    description: "Monthly summary of air quality metrics across all monitoring stations",
  },
  {
    id: 2,
    name: "Kampala Air Quality Trends Q2 2024",
    type: "analysis",
    createdBy: "Sarah Smith",
    createdAt: "2024-06-28",
    status: "completed",
    format: "xlsx",
    size: "4.1 MB",
    description: "Quarterly analysis of air quality trends in Kampala region",
  },
  {
    id: 3,
    name: "Device Performance Report - May 2024",
    type: "technical",
    createdBy: "Michael Johnson",
    createdAt: "2024-06-15",
    status: "completed",
    format: "pdf",
    size: "3.7 MB",
    description: "Monthly report on device performance, uptime, and maintenance needs",
  },
  {
    id: 4,
    name: "Comparative Analysis: Urban vs Rural Air Quality",
    type: "analysis",
    createdBy: "Emily Davis",
    createdAt: "2024-06-10",
    status: "completed",
    format: "pdf",
    size: "5.2 MB",
    description: "Comparative study of air quality between urban and rural monitoring stations",
  },
  {
    id: 5,
    name: "PM2.5 Concentration Report - July 2024",
    type: "forecast",
    createdBy: "David Wilson",
    createdAt: "2024-06-25",
    status: "scheduled",
    format: "pdf",
    size: "-",
    description: "Forecasted PM2.5 concentration levels for July 2024",
  },
  {
    id: 6,
    name: "Annual Air Quality Report 2023",
    type: "summary",
    createdBy: "John Doe",
    createdAt: "2024-01-15",
    status: "completed",
    format: "pdf",
    size: "8.6 MB",
    description: "Comprehensive annual report on air quality metrics for 2023",
  },
  {
    id: 7,
    name: "Nairobi Air Quality Analysis - June 2024",
    type: "analysis",
    createdBy: "Robert Taylor",
    createdAt: "2024-06-20",
    status: "in_progress",
    format: "xlsx",
    size: "-",
    description: "Monthly analysis of air quality in Nairobi region",
  },
  {
    id: 8,
    name: "Pollution Source Attribution Study",
    type: "research",
    createdBy: "Lisa Anderson",
    createdAt: "2024-06-05",
    status: "completed",
    format: "pdf",
    size: "6.3 MB",
    description: "Research study on attribution of pollution sources in urban areas",
  },
]

// Sample scheduled reports
const scheduledReports = [
  {
    id: 1,
    name: "Monthly Air Quality Summary",
    frequency: "Monthly",
    nextRun: "2024-07-31",
    recipients: ["john.doe@airqo.net", "sarah.smith@airqo.net"],
    format: "pdf",
    createdBy: "John Doe",
  },
  {
    id: 2,
    name: "Weekly Device Status Report",
    frequency: "Weekly",
    nextRun: "2024-07-07",
    recipients: ["michael.johnson@airqo.net", "david.wilson@airqo.net"],
    format: "xlsx",
    createdBy: "Michael Johnson",
  },
  {
    id: 3,
    name: "Quarterly Air Quality Trends",
    frequency: "Quarterly",
    nextRun: "2024-09-30",
    recipients: ["sarah.smith@airqo.net", "emily.davis@airqo.net"],
    format: "pdf",
    createdBy: "Sarah Smith",
  },
  {
    id: 4,
    name: "Daily PM2.5 Alert Summary",
    frequency: "Daily",
    nextRun: "2024-07-01",
    recipients: ["alerts@airqo.net"],
    format: "pdf",
    createdBy: "David Wilson",
  },
]

// Sample report templates
const reportTemplates = [
  {
    id: 1,
    name: "Monthly Summary",
    type: "Summary",
    description: "Monthly summary of air quality metrics across all monitoring stations",
  },
  {
    id: 2,
    name: "Quarterly Analysis",
    type: "Analysis",
    description: "Quarterly analysis of air quality trends with detailed visualizations",
  },
  {
    id: 3,
    name: "Device Performance",
    type: "Technical",
    description: "Technical report on device performance, uptime, and maintenance needs",
  },
  {
    id: 4,
    name: "Raw Data Export",
    type: "Data",
    description: "Export of raw air quality data in spreadsheet format for further analysis",
  },
  {
    id: 5,
    name: "Annual Report",
    type: "Summary",
    description: "Comprehensive annual report on air quality metrics and trends",
  },
]

// Sample data for charts
const monthlyAirQualityData = [
  { month: "Jan", pm25: 35, pm10: 65 },
  { month: "Feb", pm25: 28, pm10: 55 },
  { month: "Mar", pm25: 42, pm10: 78 },
  { month: "Apr", pm25: 38, pm10: 70 },
  { month: "May", pm25: 45, pm10: 85 },
  { month: "Jun", pm25: 30, pm10: 60 },
]

const reportTypeData = [
  { name: "Summary", value: 35 },
  { name: "Analysis", value: 40 },
  { name: "Technical", value: 15 },
  { name: "Research", value: 10 },
]

export default function ReportsPage() {
  const [reports] = useState(sampleReports)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all-reports")

  // Filter reports based on search term, type filter, and status filter
  const getFilteredReports = useCallback(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === "all" || report.type === typeFilter
      const matchesStatus = statusFilter === "all" || report.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [reports, searchTerm, typeFilter, statusFilter])

  const filteredReports = getFilteredReports()

  // Count reports by status
  const completedReports = reports.filter((r) => r.status === "completed").length
  const inProgressReports = reports.filter((r) => r.status === "in_progress").length
  const scheduledReportsCount = reports.filter((r) => r.status === "scheduled").length

  // Function to get status badge
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "in_progress":
        return <Badge className="bg-blue-500">In Progress</Badge>
      case "scheduled":
        return <Badge className="bg-yellow-500">Scheduled</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
  }, [])

  // Function to get format icon
  const getFormatIcon = useCallback((format: string) => {
    switch (format) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />
      case "xlsx":
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      case "csv":
        return <FileBarChart className="h-5 w-5 text-blue-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Dialog open={isCreateReportOpen} onOpenChange={setIsCreateReportOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Configure the parameters for your new report. You can generate it immediately or schedule it for later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input id="reportName" placeholder="Monthly Air Quality Summary - July 2024" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="forecast">Forecast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateRange">Date Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input id="startDate" type="date" />
                  <Input id="endDate" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="devices">Devices</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select devices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="kampala">Kampala Devices</SelectItem>
                    <SelectItem value="nairobi">Nairobi Devices</SelectItem>
                    <SelectItem value="active">Active Devices Only</SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metrics">Metrics to Include</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="pm25" className="rounded" defaultChecked />
                    <label htmlFor="pm25">PM2.5</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="pm10" className="rounded" defaultChecked />
                    <label htmlFor="pm10">PM10</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="temperature" className="rounded" defaultChecked />
                    <label htmlFor="temperature">Temperature</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="humidity" className="rounded" defaultChecked />
                    <label htmlFor="humidity">Humidity</label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Generate now or schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Generate Now</SelectItem>
                    <SelectItem value="once">Schedule Once</SelectItem>
                    <SelectItem value="daily">Schedule Daily</SelectItem>
                    <SelectItem value="weekly">Schedule Weekly</SelectItem>
                    <SelectItem value="monthly">Schedule Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateReportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateReportOpen(false)}>Create Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Generated and scheduled reports</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileCheck className="mr-2 h-5 w-5 text-green-500" />
              Completed Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{completedReports}</div>
            <div className="flex items-center mt-1">
              <div
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${(completedReports / reports.length) * 100}%` }}
              ></div>
              <span className="text-xs text-muted-foreground ml-2">
                {Math.round((completedReports / reports.length) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 bg-gradient-to-r from-yellow-500/10 to-transparent">
            <CardTitle className="text-sm font-medium flex items-center">
              <CalendarClock className="mr-2 h-5 w-5 text-yellow-500" />
              Scheduled Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{scheduledReportsCount}</div>
            <div className="flex items-center mt-1">
              <div
                className="h-2 bg-yellow-500 rounded-full"
                style={{ width: `${(scheduledReportsCount / reports.length) * 100}%` }}
              ></div>
              <span className="text-xs text-muted-foreground ml-2">
                {Math.round((scheduledReportsCount / reports.length) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4 w-[400px]">
          <TabsTrigger value="all-reports">All Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="all-reports">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Report Library
              </CardTitle>
              <CardDescription>Browse, download, and manage your reports</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search reports..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    className="border rounded-md p-2 bg-white"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="summary">Summary</option>
                    <option value="analysis">Analysis</option>
                    <option value="technical">Technical</option>
                    <option value="research">Research</option>
                    <option value="forecast">Forecast</option>
                  </select>
                  <select
                    className="border rounded-md p-2 bg-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Report</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Created By</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Format</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Size</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {getFormatIcon(report.format)}
                            <div className="ml-3">
                              <p className="font-medium">{report.name}</p>
                              <p className="text-xs text-muted-foreground">{report.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize">{report.type}</td>
                        <td className="py-3 px-4">{report.createdBy}</td>
                        <td className="py-3 px-4">{report.createdAt}</td>
                        <td className="py-3 px-4">{getStatusBadge(report.status)}</td>
                        <td className="py-3 px-4 uppercase">{report.format}</td>
                        <td className="py-3 px-4">{report.size}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-1">
                            {report.status === "completed" && (
                              <Button variant="ghost" size="icon" title="Download">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" title="Share">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="More Options">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3 flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredReports.length} of {reports.length} reports
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export List
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>View and manage your scheduled report generation</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Report Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Frequency</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Next Run</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Recipients</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Format</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Created By</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium">{report.name}</td>
                        <td className="py-3 px-4">{report.frequency}</td>
                        <td className="py-3 px-4">{report.nextRun}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            {report.recipients.map((recipient, i) => (
                              <span key={i} className="text-sm">
                                {recipient}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 uppercase">{report.format}</td>
                        <td className="py-3 px-4">{report.createdBy}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon" title="Edit">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Run Now">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="More Options">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t px-4 py-3 flex justify-between">
              <div className="text-sm text-muted-foreground">
                <AlertCircle className="inline-block h-4 w-4 mr-1" />
                Scheduled reports will be automatically generated and sent to recipients
              </div>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Schedule New Report
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center">
                <FileBarChart className="mr-2 h-5 w-5 text-primary" />
                Report Templates
              </CardTitle>
              <CardDescription>Standardized report templates for quick generation</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportTemplates.map((template) => (
                  <Card key={template.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-primary" />
                        {template.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between">
                      <Badge>{template.type}</Badge>
                      <Button variant="ghost" size="sm">
                        Use Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

                <Card className="border-dashed border-2 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center">
                  <CardContent className="flex flex-col items-center justify-center py-6">
                    <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Create Custom Template</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                  Report Generation Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyAirQualityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="pm25" stroke="#8884d8" name="Reports Generated" />
                      <Line type="monotone" dataKey="pm10" stroke="#82ca9d" name="Reports Downloaded" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                <CardTitle className="flex items-center">
                  <FilePieChart className="mr-2 h-5 w-5 text-primary" />
                  Report Types Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Number of Reports" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

