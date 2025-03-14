"use client"

import Link from "next/link";
import { useState } from "react";

// Improved AfricaMap component with a more accurate outline
const AfricaMap = () => {
  const [tooltip, setTooltip] = useState(null);
  
  // Sensor data with more accurate coordinates for African cities
  const sensors = [
    { id: 1, name: "KLA-001", x: 240, y: 200, status: "active" }, // Kampala
    { id: 2, name: "NBO-002", x: 255, y: 220, status: "active" }, // Nairobi
    { id: 3, name: "ACC-003", x: 180, y: 205, status: "offline" }, // Accra
    { id: 4, name: "DAR-004", x: 260, y: 240, status: "active" }, // Dar es Salaam
    { id: 5, name: "LOS-005", x: 175, y: 210, status: "offline" }, // Lagos
    { id: 6, name: "CAI-006", x: 240, y: 150, status: "active" }, // Cairo
    { id: 7, name: "CPT-007", x: 225, y: 330, status: "active" }, // Cape Town
  ];

  return (
    <div className="h-full w-full bg-white relative">
      <svg viewBox="0 0 450 450" className="h-full w-full">
        {/* More accurate Africa outline */}
        <path
          d="M200,90 C195,95 190,100 185,105 C180,115 175,120 170,130 C165,140 160,155 165,170 C170,190 175,200 185,210 C195,220 205,225 215,230 C225,235 235,240 245,245 C250,250 255,255 260,260 C265,270 270,275 275,285 C280,290 285,305 290,320 C295,330 305,340 315,345 C320,350 330,345 335,340 C340,335 345,330 350,320 C355,310 360,300 360,290 C360,280 355,275 350,265 C345,255 340,245 335,235 C330,225 330,215 335,205 C340,195 345,185 345,175 C345,165 340,155 330,145 C320,135 310,130 300,130 C290,130 275,125 265,115 C255,110 245,105 235,95 C225,90 215,85 200,90Z"
          fill="#F0F0F0"
          stroke="#A0A0A0"
          strokeWidth="2"
        />
        
        {/* Country borders - simplified */}
        <path
          d="M200,90 C210,130 220,150 230,170 M230,170 C250,190 260,220 240,240 M240,240 C260,260 280,270 290,320 M240,170 C280,160 300,150 345,175 M240,240 C280,220 300,210 335,205"
          fill="none"
          stroke="#D0D0D0"
          strokeWidth="1"
        />
        
        {/* Mediterranean Sea */}
        <path
          d="M150,80 C180,70 220,70 250,80 C270,85 290,90 310,85 C330,80 350,75 370,80"
          fill="none"
          stroke="#B8D0E0"
          strokeWidth="2"
        />
        
        {/* Sensors as dots on the map */}
        {sensors.map((sensor) => (
          <g key={sensor.id}>
            <circle
              cx={sensor.x}
              cy={sensor.y}
              r={8}
              fill={sensor.status === "active" ? "#3B82F6" : "#EF4444"}
              stroke="#FFFFFF"
              strokeWidth="2"
              onMouseEnter={() => setTooltip({ id: sensor.id, x: sensor.x, y: sensor.y, ...sensor })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: "pointer" }}
            />
          </g>
        ))}
        
        {/* Sensor tooltip */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x + 10}
              y={tooltip.y - 30}
              width={80}
              height={25}
              rx={4}
              fill="white"
              stroke="#D1D5DB"
              strokeWidth="1"
            />
            <text
              x={tooltip.x + 20}
              y={tooltip.y - 12}
              fontSize={12}
              fill="#374151"
            >
              {tooltip.name}
            </text>
            <circle
              cx={tooltip.x + 70}
              cy={tooltip.y - 18}
              r={4}
              fill={tooltip.status === "active" ? "#10B981" : "#EF4444"}
            />
          </g>
        )}
      </svg>
      
      {/* Map attribution */}
      <div className="absolute bottom-1 left-2 text-xs text-gray-400">
        Interactive sensor map
      </div>
    </div>
  );
};

export default function Home() {
  const [timeRange, setTimeRange] = useState("7d");
  
  // Sample data that would normally come from your API
  const deviceCounts = {
    total: 128,
    active: 112,
    maintenance: 8,
    offline: 8
  };
  
  const alerts = [
    {
      id: "alert1",
      message: "Battery level critically low (10%)",
      severity: "critical",
      time: "4:47:55 PM",
      location: "Kampala, Uganda"
    },
    {
      id: "alert2",
      message: "Poor signal strength detected",
      severity: "warning",
      time: "3:47:55 PM",
      location: "Nairobi, Kenya"
    }
  ];
  
  const maintenanceEvents = [
    {
      id: "maint1",
      location: "Kampala Central",
      technician: "John Doe",
      type: "routine",
      date: "3/14/2025"
    }
  ];

  // Performance metrics
  const performanceMetrics = {
    uptime: 98.7,
    avgResponseTime: 156,
    dataQuality: 96.2,
    batteryHealth: 87.5
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-8 h-8 mr-3 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
            </svg>
            <h1 className="text-xl font-semibold text-gray-800">AirQo Device Monitoring</h1>
          </div>
          <nav className="flex space-x-6">
            <Link href="/" className="text-blue-600 font-medium">Dashboard</Link>
            <Link href="/devices" className="text-gray-600 hover:text-gray-900">Devices</Link>
            <Link href="/analytics" className="text-gray-600 hover:text-gray-900">Analytics</Link>
            <Link href="/reports" className="text-gray-600 hover:text-gray-900">Reports</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header with Time Range Selector */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Network Overview</h2>
          <div className="bg-white rounded-md shadow-sm p-1 flex">
            <button 
              className={`px-3 py-1 text-sm rounded-md ${timeRange === '24h' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              onClick={() => setTimeRange('24h')}
            >
              24h
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-md ${timeRange === '7d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              onClick={() => setTimeRange('7d')}
            >
              7d
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-md ${timeRange === '30d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              onClick={() => setTimeRange('30d')}
            >
              30d
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'custom' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              onClick={() => setTimeRange('custom')}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Devices</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{deviceCounts.total}</p>
              </div>
              <div className="bg-gray-100 rounded-md p-2">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500">Deployment rate</span>
                <span className="ml-2 text-sm font-medium text-green-600">+4.3%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Devices</p>
                <p className="mt-1 text-3xl font-semibold text-green-600">{deviceCounts.active}</p>
              </div>
              <div className="bg-green-100 rounded-md p-2">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500">Active rate</span>
                <span className="ml-2 text-sm font-medium text-green-600">{Math.round(deviceCounts.active/deviceCounts.total*100)}%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Under Maintenance</p>
                <p className="mt-1 text-3xl font-semibold text-yellow-600">{deviceCounts.maintenance}</p>
              </div>
              <div className="bg-yellow-100 rounded-md p-2">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500">Avg. resolution time</span>
                <span className="ml-2 text-sm font-medium text-gray-600">1.2 days</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Offline Devices</p>
                <p className="mt-1 text-3xl font-semibold text-red-600">{deviceCounts.offline}</p>
              </div>
              <div className="bg-red-100 rounded-md p-2">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500">MTTR</span>
                <span className="ml-2 text-sm font-medium text-gray-600">6.8 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map and Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Map of Africa */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Device Network - Africa</h3>
            </div>
            <div className="p-5 h-96 relative">
              {/* Integrated Africa Map component */}
              <AfricaMap />
              
              {/* Map Legend */}
              <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 p-3 rounded-md shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-xs text-gray-700">Active Sensors ({deviceCounts.active})</span>
                </div>
                <div className="flex items-center mb-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-xs text-gray-700">Offline Sensors ({deviceCounts.offline})</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-xs text-gray-700">Maintenance ({deviceCounts.maintenance})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Network Performance</h3>
            </div>
            <div className="p-5">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Network Uptime</span>
                  <span className="text-sm font-medium text-gray-900">{performanceMetrics.uptime}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${performanceMetrics.uptime}%` }}></div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Avg Response Time</span>
                  <span className="text-sm font-medium text-gray-900">{performanceMetrics.avgResponseTime} ms</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${100 - (performanceMetrics.avgResponseTime/200)*100}%` }}></div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Data Quality</span>
                  <span className="text-sm font-medium text-gray-900">{performanceMetrics.dataQuality}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${performanceMetrics.dataQuality}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Battery Health</span>
                  <span className="text-sm font-medium text-gray-900">{performanceMetrics.batteryHealth}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${performanceMetrics.batteryHealth}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts and Maintenance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Critical Alerts</h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{alerts.length} Active</span>
            </div>
            <div className="divide-y divide-gray-200">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-5">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      alert.severity === 'critical' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <svg className="h-3 w-3 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {alert.location}
                    </div>
                    <div className="flex items-center">
                      <svg className="h-3 w-3 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {alert.time}
                    </div>
                  </div>
                </div>
              ))}
              <div className="px-5 py-3 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View all alerts
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Maintenance */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Scheduled Maintenance</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{maintenanceEvents.length} Scheduled</span>
            </div>
            <div className="divide-y divide-gray-200">
              {maintenanceEvents.map((event) => (
                <div key={event.id} className="p-5">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium text-gray-800">{event.location}</p>
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {event.type}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <svg className="h-3 w-3 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {event.technician}
                    </div>
                    <div className="flex items-center">
                      <svg className="h-3 w-3 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      {event.date}
                    </div>
                  </div>
                </div>
              ))}
              <div className="px-5 py-3 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View all scheduled maintenance
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}