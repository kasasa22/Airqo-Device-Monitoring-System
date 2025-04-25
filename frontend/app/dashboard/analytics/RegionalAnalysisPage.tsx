// RegionalAnalysisPage.js
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
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
import {
  Download,
  Signal,
  SignalZero,
  Percent,
  Wind,
  Activity,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegionalAnalysisPage({
  selectedRegion,
  setSelectedRegion,
  regionalComparisonData,
  currentRegion,
  countriesInRegion,
  regionAqiData,
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a region" />
            </SelectTrigger>
            <SelectContent>
              {regionalComparisonData.map((region) => (
                <SelectItem key={region.region} value={region.region}>
                  {region.region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
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
            <div className="text-2xl font-bold">{currentRegion.onlineDevices}</div>
            <p className="text-xs text-muted-foreground">
              {((currentRegion.onlineDevices / currentRegion.deviceCount) * 100).toFixed(1)}% of total devices
            </p>
            <div className="mt-2">
              <Progress
                value={(currentRegion.onlineDevices / currentRegion.deviceCount) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Other metric cards... */}
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
                  data={countriesInRegion}
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
                    data={regionAqiData.filter(item => item.value > 0)}
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