"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "recharts"

// Sample data for charts
const airQualityData = [
  { month: "Jan", pm25: 35, pm10: 65, no2: 20 },
  { month: "Feb", pm25: 28, pm10: 55, no2: 18 },
  { month: "Mar", pm25: 42, pm10: 78, no2: 25 },
  { month: "Apr", pm25: 38, pm10: 70, no2: 22 },
  { month: "May", pm25: 45, pm10: 85, no2: 28 },
  { month: "Jun", pm25: 30, pm10: 60, no2: 19 },
]

const deviceStatusData = [
  { name: "Active", value: 68, color: "#4CAF50" },
  { name: "Maintenance", value: 15, color: "#FFC107" },
  { name: "Offline", value: 17, color: "#F44336" },
]

const cityAirQualityData = [
  { city: "Kampala", aqi: 85 },
  { city: "Nairobi", aqi: 65 },
  { city: "Lagos", aqi: 95 },
  { city: "Accra", aqi: 55 },
  { city: "Dar es Salaam", aqi: 75 },
  { city: "Addis Ababa", aqi: 60 },
]

const devicePerformanceData = [
  { name: "Uptime", value: 98.5 },
  { name: "Data Completeness", value: 96.2 },
  { name: "Calibration Accuracy", value: 94.8 },
  { name: "Battery Performance", value: 92.3 },
  { name: "Signal Strength", value: 89.7 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month")

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Air Quality Analytics</h1>
        <div className="flex items-center space-x-2">
          <select className="border rounded-md p-2" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average PM2.5</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">36.3 µg/m³</div>
            <p className="text-xs text-muted-foreground">+2.5% from previous period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average PM10</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68.8 µg/m³</div>
            <p className="text-xs text-muted-foreground">-1.2% from previous period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average NO2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22.0 ppb</div>
            <p className="text-xs text-muted-foreground">+0.8% from previous period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68 / 100</div>
            <p className="text-xs text-muted-foreground">Network uptime: 98.5%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Air Quality Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={airQualityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pm25" stroke="#8884d8" name="PM2.5" />
                  <Line type="monotone" dataKey="pm10" stroke="#82ca9d" name="PM10" />
                  <Line type="monotone" dataKey="no2" stroke="#ffc658" name="NO2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
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
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>City Air Quality Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityAirQualityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="aqi" fill="#8884d8" name="Air Quality Index">
                    {cityAirQualityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.aqi < 60 ? "#4CAF50" : entry.aqi < 80 ? "#FFC107" : "#F44336"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={devicePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Performance (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

