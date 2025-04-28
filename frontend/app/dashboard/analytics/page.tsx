"use client"

import { useState, useMemo } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Globe,
  Map,
  Layers,
  Signal,
  SignalZero,
  Percent,
  Wind,
  Search,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import SiteAnalyticsPage from "./site_analysis"
import RegionalAnalysis from "./RegionalAnalysisPage"
import CountryAnalysisPage from "./CountryAnalysisPage"
import DistrictAnalysisPage from "./DistrictAnalysisPage"

// Sample data for regional comparison
const regionalComparisonData = [
  {
    region: "East Africa",
    uptime: 98.5,
    deviceCount: 42,
    pm25: 28.5,
    pm10: 45.2,
    dataCompleteness: 95.8,
    onlineDevices: 38,
    offlineDevices: 4,
    countries: 5,
    districts: 18,
    aqiGood: 24,
    aqiModerate: 14,
    aqiUhfsg: 3,
    aqiUnhealthy: 1,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 92.5,
  },
  {
    region: "West Africa",
    uptime: 96.2,
    deviceCount: 35,
    pm25: 32.1,
    pm10: 52.7,
    dataCompleteness: 92.3,
    onlineDevices: 30,
    offlineDevices: 5,
    countries: 4,
    districts: 12,
    aqiGood: 18,
    aqiModerate: 12,
    aqiUhfsg: 4,
    aqiUnhealthy: 1,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 88.7,
  },
  {
    region: "North Africa",
    uptime: 99.1,
    deviceCount: 28,
    pm25: 24.3,
    pm10: 38.9,
    dataCompleteness: 97.5,
    onlineDevices: 27,
    offlineDevices: 1,
    countries: 3,
    districts: 8,
    aqiGood: 20,
    aqiModerate: 7,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 96.8,
  },
  {
    region: "Southern Africa",
    uptime: 97.8,
    deviceCount: 31,
    pm25: 26.8,
    pm10: 42.5,
    dataCompleteness: 94.2,
    onlineDevices: 28,
    offlineDevices: 3,
    countries: 4,
    districts: 10,
    aqiGood: 19,
    aqiModerate: 10,
    aqiUhfsg: 2,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 91.5,
  },
  {
    region: "Central Africa",
    uptime: 95.3,
    deviceCount: 24,
    pm25: 30.2,
    pm10: 48.6,
    dataCompleteness: 90.8,
    onlineDevices: 20,
    offlineDevices: 4,
    countries: 3,
    districts: 7,
    aqiGood: 12,
    aqiModerate: 9,
    aqiUhfsg: 2,
    aqiUnhealthy: 1,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 87.2,
  },
]

// Sample country data
const countryData = [
  {
    name: "Uganda",
    region: "East Africa",
    devices: 28,
    onlineDevices: 25,
    offlineDevices: 3,
    dataCompleteness: 96.2,
    pm25: 27.8,
    pm10: 44.5,
    districts: 12,
    uptime: 98.3,
    aqiGood: 16,
    aqiModerate: 9,
    aqiUhfsg: 2,
    aqiUnhealthy: 1,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 94.5,
    devicesList: [
      {
        id: "UG001",
        name: "Kampala Central",
        status: "online",
        lastUpdate: "10 min ago",
        pm25: 24.5,
        pm10: 42.3,
        batteryLevel: 85,
        signalStrength: 90,
      },
      {
        id: "UG002",
        name: "Entebbe Road",
        status: "online",
        lastUpdate: "5 min ago",
        pm25: 22.1,
        pm10: 38.7,
        batteryLevel: 72,
        signalStrength: 85,
      },
      {
        id: "UG003",
        name: "Jinja Road",
        status: "offline",
        lastUpdate: "2 hrs ago",
        pm25: 31.2,
        pm10: 49.8,
        batteryLevel: 23,
        signalStrength: 20,
      },
      {
        id: "UG004",
        name: "Gulu Central",
        status: "online",
        lastUpdate: "15 min ago",
        pm25: 18.9,
        pm10: 32.4,
        batteryLevel: 90,
        signalStrength: 95,
      },
      {
        id: "UG005",
        name: "Mbarara Town",
        status: "online",
        lastUpdate: "8 min ago",
        pm25: 20.5,
        pm10: 36.2,
        batteryLevel: 65,
        signalStrength: 75,
      },
    ],
  },
  {
    name: "Kenya",
    region: "East Africa",
    devices: 22,
    onlineDevices: 20,
    offlineDevices: 2,
    dataCompleteness: 95.1,
    pm25: 29.2,
    pm10: 46.8,
    districts: 8,
    uptime: 97.8,
    aqiGood: 12,
    aqiModerate: 8,
    aqiUhfsg: 1,
    aqiUnhealthy: 1,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 93.2,
    devicesList: [
      {
        id: "KE001",
        name: "Nairobi CBD",
        status: "online",
        lastUpdate: "7 min ago",
        pm25: 28.7,
        pm10: 45.9,
        batteryLevel: 88,
        signalStrength: 92,
      },
      {
        id: "KE002",
        name: "Mombasa Road",
        status: "online",
        lastUpdate: "12 min ago",
        pm25: 26.3,
        pm10: 43.1,
        batteryLevel: 75,
        signalStrength: 87,
      },
      {
        id: "KE003",
        name: "Kisumu Central",
        status: "offline",
        lastUpdate: "1 hr ago",
        pm25: 30.5,
        pm10: 48.2,
        batteryLevel: 20,
        signalStrength: 25,
      },
      {
        id: "KE004",
        name: "Nakuru Town",
        status: "online",
        lastUpdate: "20 min ago",
        pm25: 24.8,
        pm10: 40.3,
        batteryLevel: 68,
        signalStrength: 78,
      },
    ],
  },
  {
    name: "Tanzania",
    region: "East Africa",
    devices: 18,
    onlineDevices: 16,
    offlineDevices: 2,
    dataCompleteness: 94.5,
    pm25: 26.5,
    pm10: 43.2,
    districts: 6,
    uptime: 96.9,
    aqiGood: 10,
    aqiModerate: 7,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 91.8,
    devicesList: [
      {
        id: "TZ001",
        name: "Dar es Salaam",
        status: "online",
        lastUpdate: "15 min ago",
        pm25: 25.8,
        pm10: 42.7,
        batteryLevel: 92,
        signalStrength: 95,
      },
      {
        id: "TZ002",
        name: "Arusha",
        status: "online",
        lastUpdate: "22 min ago",
        pm25: 22.4,
        pm10: 37.9,
        batteryLevel: 78,
        signalStrength: 89,
      },
      {
        id: "TZ003",
        name: "Dodoma",
        status: "offline",
        lastUpdate: "1.5 hrs ago",
        pm25: 28.9,
        pm10: 46.3,
        batteryLevel: 10,
        signalStrength: 15,
      },
    ],
  },
  {
    name: "Rwanda",
    region: "East Africa",
    devices: 15,
    onlineDevices: 14,
    offlineDevices: 1,
    dataCompleteness: 97.8,
    pm25: 24.1,
    pm10: 39.5,
    districts: 5,
    uptime: 99.1,
    aqiGood: 11,
    aqiModerate: 4,
    aqiUhfsg: 0,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 96.5,
    devicesList: [
      {
        id: "RW001",
        name: "Kigali Central",
        status: "online",
        lastUpdate: "5 min ago",
        pm25: 23.1,
        pm10: 38.4,
        batteryLevel: 95,
        signalStrength: 98,
      },
      {
        id: "RW002",
        name: "Musanze",
        status: "online",
        lastUpdate: "18 min ago",
        pm25: 21.7,
        pm10: 36.2,
        batteryLevel: 82,
        signalStrength: 90,
      },
      {
        id: "RW003",
        name: "Huye",
        status: "online",
        lastUpdate: "25 min ago",
        pm25: 22.9,
        pm10: 37.8,
        batteryLevel: 78,
        signalStrength: 85,
      },
    ],
  },
  {
    name: "Nigeria",
    region: "West Africa",
    devices: 20,
    onlineDevices: 17,
    offlineDevices: 3,
    dataCompleteness: 93.2,
    pm25: 32.5,
    pm10: 53.8,
    districts: 7,
    uptime: 95.4,
    aqiGood: 8,
    aqiModerate: 9,
    aqiUhfsg: 2,
    aqiUnhealthy: 1,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 89.5,
    devicesList: [
      {
        id: "NG001",
        name: "Lagos Island",
        status: "online",
        lastUpdate: "12 min ago",
        pm25: 31.8,
        pm10: 52.4,
        batteryLevel: 70,
        signalStrength: 80,
      },
      {
        id: "NG002",
        name: "Abuja Central",
        status: "online",
        lastUpdate: "20 min ago",
        pm25: 29.5,
        pm10: 48.7,
        batteryLevel: 65,
        signalStrength: 75,
      },
      {
        id: "NG003",
        name: "Port Harcourt",
        status: "offline",
        lastUpdate: "2 hrs ago",
        pm25: 34.2,
        pm10: 56.1,
        batteryLevel: 15,
        signalStrength: 20,
      },
    ],
  },
  {
    name: "Ghana",
    region: "West Africa",
    devices: 15,
    onlineDevices: 13,
    offlineDevices: 2,
    dataCompleteness: 91.5,
    pm25: 31.8,
    pm10: 51.2,
    districts: 5,
    uptime: 94.8,
    aqiGood: 6,
    aqiModerate: 7,
    aqiUhfsg: 1,
    aqiUnhealthy: 1,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 88.3,
    devicesList: [
      {
        id: "GH001",
        name: "Accra Central",
        status: "online",
        lastUpdate: "15 min ago",
        pm25: 30.5,
        pm10: 49.8,
        batteryLevel: 68,
        signalStrength: 78,
      },
      {
        id: "GH002",
        name: "Kumasi",
        status: "online",
        lastUpdate: "25 min ago",
        pm25: 28.7,
        pm10: 47.2,
        batteryLevel: 72,
        signalStrength: 82,
      },
      {
        id: "GH003",
        name: "Tamale",
        status: "offline",
        lastUpdate: "1.5 hrs ago",
        pm25: 32.4,
        pm10: 53.1,
        batteryLevel: 18,
        signalStrength: 25,
      },
    ],
  },
  {
    name: "Egypt",
    region: "North Africa",
    devices: 18,
    onlineDevices: 17,
    offlineDevices: 1,
    dataCompleteness: 98.1,
    pm25: 23.5,
    pm10: 37.8,
    districts: 6,
    uptime: 99.3,
    aqiGood: 12,
    aqiModerate: 5,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 97.2,
    devicesList: [
      {
        id: "EG001",
        name: "Cairo Downtown",
        status: "online",
        lastUpdate: "8 min ago",
        pm25: 22.8,
        pm10: 36.9,
        batteryLevel: 90,
        signalStrength: 95,
      },
      {
        id: "EG002",
        name: "Alexandria",
        status: "online",
        lastUpdate: "17 min ago",
        pm25: 21.5,
        pm10: 35.2,
        batteryLevel: 85,
        signalStrength: 90,
      },
      {
        id: "EG003",
        name: "Giza",
        status: "online",
        lastUpdate: "22 min ago",
        pm25: 23.7,
        pm10: 38.4,
        batteryLevel: 82,
        signalStrength: 88,
      },
    ],
  },
  {
    name: "South Africa",
    region: "Southern Africa",
    devices: 24,
    onlineDevices: 22,
    offlineDevices: 2,
    dataCompleteness: 95.8,
    pm25: 25.2,
    pm10: 41.5,
    districts: 8,
    uptime: 98.1,
    aqiGood: 14,
    aqiModerate: 8,
    aqiUhfsg: 2,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 94.3,
    devicesList: [
      {
        id: "ZA001",
        name: "Johannesburg CBD",
        status: "online",
        lastUpdate: "10 min ago",
        pm25: 24.7,
        pm10: 40.8,
        batteryLevel: 88,
        signalStrength: 92,
      },
      {
        id: "ZA002",
        name: "Cape Town",
        status: "online",
        lastUpdate: "15 min ago",
        pm25: 22.9,
        pm10: 38.5,
        batteryLevel: 85,
        signalStrength: 90,
      },
      {
        id: "ZA003",
        name: "Durban",
        status: "online",
        lastUpdate: "20 min ago",
        pm25: 25.6,
        pm10: 42.3,
        batteryLevel: 80,
        signalStrength: 85,
      },
      {
        id: "ZA004",
        name: "Pretoria",
        status: "offline",
        lastUpdate: "1 hr ago",
        pm25: 27.8,
        pm10: 45.2,
        batteryLevel: 25,
        signalStrength: 30,
      },
    ],
  },
]

// Sample district data
const districtData = [
  {
    name: "Kampala",
    country: "Uganda",
    region: "East Africa",
    devices: 12,
    onlineDevices: 11,
    offlineDevices: 1,
    dataCompleteness: 97.2,
    pm25: 29.5,
    pm10: 47.8,
    uptime: 98.7,
    aqiGood: 7,
    aqiModerate: 4,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 95.8,
    devicesList: [
      {
        id: "KLA001",
        name: "Nakasero",
        status: "online",
        lastUpdate: "5 min ago",
        pm25: 28.7,
        pm10: 46.9,
        batteryLevel: 90,
        signalStrength: 95,
      },
      {
        id: "KLA002",
        name: "Kololo",
        status: "online",
        lastUpdate: "12 min ago",
        pm25: 27.5,
        pm10: 45.2,
        batteryLevel: 85,
        signalStrength: 90,
      },
      {
        id: "KLA003",
        name: "Bugolobi",
        status: "online",
        lastUpdate: "18 min ago",
        pm25: 29.1,
        pm10: 47.5,
        batteryLevel: 80,
        signalStrength: 85,
      },
      {
        id: "KLA004",
        name: "Makindye",
        status: "offline",
        lastUpdate: "1.5 hrs ago",
        pm25: 31.2,
        pm10: 50.3,
        batteryLevel: 20,
        signalStrength: 25,
      },
    ],
  },
  {
    name: "Wakiso",
    country: "Uganda",
    region: "East Africa",
    devices: 8,
    onlineDevices: 7,
    offlineDevices: 1,
    dataCompleteness: 95.8,
    pm25: 27.2,
    pm10: 43.5,
    uptime: 97.9,
    aqiGood: 5,
    aqiModerate: 2,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 93.5,
    devicesList: [
      {
        id: "WAK001",
        name: "Nansana",
        status: "online",
        lastUpdate: "10 min ago",
        pm25: 26.8,
        pm10: 42.9,
        batteryLevel: 85,
        signalStrength: 90,
      },
      {
        id: "WAK002",
        name: "Entebbe",
        status: "online",
        lastUpdate: "15 min ago",
        pm25: 25.9,
        pm10: 41.7,
        batteryLevel: 80,
        signalStrength: 85,
      },
      {
        id: "WAK003",
        name: "Kira",
        status: "offline",
        lastUpdate: "2 hrs ago",
        pm25: 28.4,
        pm10: 45.8,
        batteryLevel: 15,
        signalStrength: 20,
      },
    ],
  },
  {
    name: "Nairobi",
    country: "Kenya",
    region: "East Africa",
    devices: 10,
    onlineDevices: 9,
    offlineDevices: 1,
    dataCompleteness: 96.5,
    pm25: 30.1,
    pm10: 48.2,
    uptime: 98.2,
    aqiGood: 6,
    aqiModerate: 3,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 94.7,
    devicesList: [
      {
        id: "NBO001",
        name: "Westlands",
        status: "online",
        lastUpdate: "8 min ago",
        pm25: 29.5,
        pm10: 47.3,
        batteryLevel: 88,
        signalStrength: 92,
      },
      {
        id: "NBO002",
        name: "Kibera",
        status: "online",
        lastUpdate: "14 min ago",
        pm25: 31.2,
        pm10: 49.8,
        batteryLevel: 82,
        signalStrength: 88,
      },
      {
        id: "NBO003",
        name: "Karen",
        status: "online",
        lastUpdate: "20 min ago",
        pm25: 28.7,
        pm10: 46.2,
        batteryLevel: 78,
        signalStrength: 85,
      },
      {
        id: "NBO004",
        name: "Eastleigh",
        status: "offline",
        lastUpdate: "1 hr ago",
        pm25: 32.5,
        pm10: 51.4,
        batteryLevel: 22,
        signalStrength: 25,
      },
    ],
  },
  {
    name: "Mombasa",
    country: "Kenya",
    region: "East Africa",
    devices: 6,
    onlineDevices: 5,
    offlineDevices: 1,
    dataCompleteness: 94.2,
    pm25: 28.5,
    pm10: 45.8,
    uptime: 97.1,
    aqiGood: 3,
    aqiModerate: 2,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 92.8,
    devicesList: [
      {
        id: "MSA001",
        name: "Nyali",
        status: "online",
        lastUpdate: "12 min ago",
        pm25: 27.9,
        pm10: 44.8,
        batteryLevel: 85,
        signalStrength: 90,
      },
      {
        id: "MSA002",
        name: "Likoni",
        status: "online",
        lastUpdate: "18 min ago",
        pm25: 28.7,
        pm10: 46.2,
        batteryLevel: 80,
        signalStrength: 85,
      },
      {
        id: "MSA003",
        name: "Bamburi",
        status: "offline",
        lastUpdate: "1.5 hrs ago",
        pm25: 29.5,
        pm10: 47.3,
        batteryLevel: 18,
        signalStrength: 22,
      },
    ],
  },
  {
    name: "Dar es Salaam",
    country: "Tanzania",
    region: "East Africa",
    devices: 9,
    onlineDevices: 8,
    offlineDevices: 1,
    dataCompleteness: 95.1,
    pm25: 27.8,
    pm10: 44.2,
    uptime: 96.8,
    aqiGood: 5,
    aqiModerate: 3,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 93.2,
    devicesList: [
      {
        id: "DSM001",
        name: "Mikocheni",
        status: "online",
        lastUpdate: "10 min ago",
        pm25: 26.9,
        pm10: 43.5,
        batteryLevel: 88,
        signalStrength: 92,
      },
      {
        id: "DSM002",
        name: "Kinondoni",
        status: "online",
        lastUpdate: "15 min ago",
        pm25: 27.5,
        pm10: 44.1,
        batteryLevel: 85,
        signalStrength: 90,
      },
      {
        id: "DSM003",
        name: "Ilala",
        status: "online",
        lastUpdate: "22 min ago",
        pm25: 28.2,
        pm10: 45.3,
        batteryLevel: 80,
        signalStrength: 85,
      },
      {
        id: "DSM004",
        name: "Temeke",
        status: "offline",
        lastUpdate: "1 hr ago",
        pm25: 29.8,
        pm10: 47.2,
        batteryLevel: 20,
        signalStrength: 25,
      },
    ],
  },
  {
    name: "Kigali",
    country: "Rwanda",
    region: "East Africa",
    devices: 8,
    onlineDevices: 8,
    offlineDevices: 0,
    dataCompleteness: 98.5,
    pm25: 23.8,
    pm10: 38.5,
    uptime: 99.4,
    aqiGood: 6,
    aqiModerate: 2,
    aqiUhfsg: 0,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 97.8,
    devicesList: [
      {
        id: "KGL001",
        name: "Nyamirambo",
        status: "online",
        lastUpdate: "5 min ago",
        pm25: 22.9,
        pm10: 37.5,
        batteryLevel: 95,
        signalStrength: 98,
      },
      {
        id: "KGL002",
        name: "Kimihurura",
        status: "online",
        lastUpdate: "12 min ago",
        pm25: 23.5,
        pm10: 38.2,
        batteryLevel: 90,
        signalStrength: 95,
      },
      {
        id: "KGL003",
        name: "Kacyiru",
        status: "online",
        lastUpdate: "18 min ago",
        pm25: 24.1,
        pm10: 39.3,
        batteryLevel: 88,
        signalStrength: 92,
      },
    ],
  },
  {
    name: "Lagos",
    country: "Nigeria",
    region: "West Africa",
    devices: 12,
    onlineDevices: 10,
    offlineDevices: 2,
    dataCompleteness: 92.8,
    pm25: 33.5,
    pm10: 55.2,
    uptime: 95.2,
    aqiGood: 4,
    aqiModerate: 6,
    aqiUhfsg: 1,
    aqiUnhealthy: 1,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 90.5,
    devicesList: [
      {
        id: "LOS001",
        name: "Ikeja",
        status: "online",
        lastUpdate: "8 min ago",
        pm25: 32.8,
        pm10: 54.2,
        batteryLevel: 85,
        signalStrength: 90,
      },
      {
        id: "LOS002",
        name: "Victoria Island",
        status: "online",
        lastUpdate: "15 min ago",
        pm25: 31.5,
        pm10: 52.7,
        batteryLevel: 80,
        signalStrength: 85,
      },
      {
        id: "LOS003",
        name: "Lekki",
        status: "offline",
        lastUpdate: "1.5 hrs ago",
        pm25: 34.2,
        pm10: 56.8,
        batteryLevel: 18,
        signalStrength: 22,
      },
      {
        id: "LOS004",
        name: "Surulere",
        status: "offline",
        lastUpdate: "2 hrs ago",
        pm25: 35.1,
        pm10: 57.9,
        batteryLevel: 15,
        signalStrength: 20,
      },
    ],
  },
  {
    name: "Accra",
    country: "Ghana",
    region: "West Africa",
    devices: 8,
    onlineDevices: 7,
    offlineDevices: 1,
    dataCompleteness: 93.2,
    pm25: 31.2,
    pm10: 50.5,
    uptime: 94.9,
    aqiGood: 3,
    aqiModerate: 4,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 91.7,
    devicesList: [
      {
        id: "ACC001",
        name: "Osu",
        status: "online",
        lastUpdate: "10 min ago",
        pm25: 30.5,
        pm10: 49.8,
        batteryLevel: 82,
        signalStrength: 88,
      },
      {
        id: "ACC002",
        name: "Cantonments",
        status: "online",
        lastUpdate: "18 min ago",
        pm25: 29.8,
        pm10: 48.5,
        batteryLevel: 78,
        signalStrength: 85,
      },
      {
        id: "ACC003",
        name: "Airport Residential",
        status: "offline",
        lastUpdate: "1 hr ago",
        pm25: 32.4,
        pm10: 52.1,
        batteryLevel: 20,
        signalStrength: 25,
      },
    ],
  },
  {
    name: "Cairo",
    country: "Egypt",
    region: "North Africa",
    devices: 10,
    onlineDevices: 10,
    offlineDevices: 0,
    dataCompleteness: 98.8,
    pm25: 22.8,
    pm10: 36.5,
    uptime: 99.5,
    aqiGood: 7,
    aqiModerate: 3,
    aqiUhfsg: 0,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 97.9,
    devicesList: [
      {
        id: "CAI001",
        name: "Zamalek",
        status: "online",
        lastUpdate: "5 min ago",
        pm25: 21.9,
        pm10: 35.4,
        batteryLevel: 95,
        signalStrength: 98,
      },
      {
        id: "CAI002",
        name: "Maadi",
        status: "online",
        lastUpdate: "12 min ago",
        pm25: 22.5,
        pm10: 36.2,
        batteryLevel: 90,
        signalStrength: 95,
      },
      {
        id: "CAI003",
        name: "Heliopolis",
        status: "online",
        lastUpdate: "18 min ago",
        pm25: 23.2,
        pm10: 37.1,
        batteryLevel: 88,
        signalStrength: 92,
      },
    ],
  },
  {
    name: "Johannesburg",
    country: "South Africa",
    region: "Southern Africa",
    devices: 14,
    onlineDevices: 13,
    offlineDevices: 1,
    dataCompleteness: 96.2,
    pm25: 24.5,
    pm10: 40.2,
    uptime: 98.3,
    aqiGood: 8,
    aqiModerate: 5,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 95.1,
    devicesList: [
      {
        id: "JHB001",
        name: "Sandton",
        status: "online",
        lastUpdate: "7 min ago",
        pm25: 23.8,
        pm10: 39.5,
        batteryLevel: 90,
        signalStrength: 95,
      },
      {
        id: "JHB002",
        name: "Soweto",
        status: "online",
        lastUpdate: "15 min ago",
        pm25: 24.9,
        pm10: 40.8,
        batteryLevel: 85,
        signalStrength: 90,
      },
      {
        id: "JHB003",
        name: "Rosebank",
        status: "online",
        lastUpdate: "20 min ago",
        pm25: 24.2,
        pm10: 39.7,
        batteryLevel: 82,
        signalStrength: 88,
      },
      {
        id: "JHB004",
        name: "Braamfontein",
        status: "offline",
        lastUpdate: "1.5 hrs ago",
        pm25: 25.8,
        pm10: 42.3,
        batteryLevel: 18,
        signalStrength: 22,
      },
    ],
  },
]

// Sample village data
const villageData = [
  {
    name: "Nakasero",
    district: "Kampala",
    country: "Uganda",
    region: "East Africa",
    devices: 5,
    onlineDevices: 5,
    offlineDevices: 0,
    dataCompleteness: 98.5,
    pm25: 30.2,
    pm10: 49.1,
    uptime: 99.2,
    aqiGood: 3,
    aqiModerate: 2,
    aqiUhfsg: 0,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 97.8,
    devicesList: [
      {
        id: "NAK001",
        name: "Parliament Avenue",
        status: "online",
        lastUpdate: "5 min ago",
        pm25: 29.8,
        pm10: 48.5,
        batteryLevel: 92,
        signalStrength: 95,
      },
      {
        id: "NAK002",
        name: "Kampala Road",
        status: "online",
        lastUpdate: "12 min ago",
        pm25: 30.5,
        pm10: 49.7,
        batteryLevel: 88,
        signalStrength: 92,
      },
    ],
  },
  {
    name: "Kololo",
    district: "Kampala",
    country: "Uganda",
    region: "East Africa",
    devices: 4,
    onlineDevices: 3,
    offlineDevices: 1,
    dataCompleteness: 96.8,
    pm25: 28.9,
    pm10: 46.5,
    uptime: 97.5,
    aqiGood: 2,
    aqiModerate: 1,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 95.2,
    devicesList: [
      {
        id: "KOL001",
        name: "Upper Kololo",
        status: "online",
        lastUpdate: "8 min ago",
        pm25: 28.2,
        pm10: 45.9,
        batteryLevel: 85,
        signalStrength: 90,
      },
      {
        id: "KOL002",
        name: "Kololo Airstrip",
        status: "offline",
        lastUpdate: "1.5 hrs ago",
        pm25: 29.5,
        pm10: 47.8,
        batteryLevel: 20,
        signalStrength: 25,
      },
    ],
  },
  {
    name: "Bugolobi",
    district: "Kampala",
    country: "Uganda",
    region: "East Africa",
    devices: 3,
    onlineDevices: 3,
    offlineDevices: 0,
    dataCompleteness: 97.1,
    pm25: 29.4,
    pm10: 47.8,
    uptime: 98.9,
    aqiGood: 2,
    aqiModerate: 1,
    aqiUhfsg: 0,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 96.5,
    devicesList: [
      {
        id: "BUG001",
        name: "Bugolobi Flats",
        status: "online",
        lastUpdate: "10 min ago",
        pm25: 29.1,
        pm10: 47.3,
        batteryLevel: 88,
        signalStrength: 92,
      },
      {
        id: "BUG002",
        name: "Luthuli Avenue",
        status: "online",
        lastUpdate: "15 min ago",
        pm25: 29.7,
        pm10: 48.2,
        batteryLevel: 85,
        signalStrength: 90,
      },
    ],
  },
  {
    name: "Nansana",
    district: "Wakiso",
    country: "Uganda",
    region: "East Africa",
    devices: 4,
    onlineDevices: 3,
    offlineDevices: 1,
    dataCompleteness: 94.8,
    pm25: 27.5,
    pm10: 44.2,
    uptime: 97.2,
    aqiGood: 2,
    aqiModerate: 1,
    aqiUhfsg: 1,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 93.5,
    devicesList: [
      {
        id: "NAN001",
        name: "Nansana East",
        status: "online",
        lastUpdate: "12 min ago",
        pm25: 27.1,
        pm10: 43.8,
        batteryLevel: 82,
        signalStrength: 88,
      },
      {
        id: "NAN002",
        name: "Nansana West",
        status: "offline",
        lastUpdate: "2 hrs ago",
        pm25: 28.4,
        pm10: 45.9,
        batteryLevel: 18,
        signalStrength: 22,
      },
    ],
  },
  {
    name: "Entebbe",
    district: "Wakiso",
    country: "Uganda",
    region: "East Africa",
    devices: 4,
    onlineDevices: 4,
    offlineDevices: 0,
    dataCompleteness: 96.7,
    pm25: 26.8,
    pm10: 42.9,
    uptime: 98.6,
    aqiGood: 3,
    aqiModerate: 1,
    aqiUhfsg: 0,
    aqiUnhealthy: 0,
    aqiVeryUnhealthy: 0,
    aqiHazardous: 0,
    dataTransmissionRate: 95.8,
    devicesList: [
      {
        id: "ENT001",
        name: "Entebbe Airport",
        status: "online",
        lastUpdate: "7 min ago",
        pm25: 26.5,
        pm10: 42.3,
        batteryLevel: 90,
        signalStrength: 95,
      },
      {
        id: "ENT002",
        name: "Entebbe Town",
        status: "online",
        lastUpdate: "15 min ago",
        pm25: 27.1,
        pm10: 43.5,
        batteryLevel: 85,
        signalStrength: 90,
      },
    ],
  },
]

// Sample site data for site-specific analysis
const sitesList = [
  { id: "kampala", name: "Kampala City", adminLevel: "City", sites: 12 },
  { id: "nairobi", name: "Nairobi", adminLevel: "City", sites: 10 },
  { id: "dar", name: "Dar es Salaam", adminLevel: "City", sites: 8 },
  { id: "kigali", name: "Kigali", adminLevel: "City", sites: 6 },
  { id: "gulu", name: "Gulu City", adminLevel: "City", sites: 7 },
  { id: "mbarara", name: "Mbarara", adminLevel: "City", sites: 5 },
  { id: "jinja", name: "Jinja", adminLevel: "City", sites: 4 },
]

// Sample air quality data for sites
const siteAirQualityData = {
  kampala: { good: 3, moderate: 5, unhealthySensitive: 2, unhealthy: 1, veryUnhealthy: 1, hazardous: 0 },
  nairobi: { good: 2, moderate: 4, unhealthySensitive: 3, unhealthy: 1, veryUnhealthy: 0, hazardous: 0 },
  dar: { good: 1, moderate: 3, unhealthySensitive: 2, unhealthy: 2, veryUnhealthy: 0, hazardous: 0 },
  kigali: { good: 2, moderate: 3, unhealthySensitive: 1, unhealthy: 0, veryUnhealthy: 0, hazardous: 0 },
  gulu: { good: 0, moderate: 7, unhealthySensitive: 0, unhealthy: 0, veryUnhealthy: 0, hazardous: 0 },
  mbarara: { good: 1, moderate: 2, unhealthySensitive: 1, unhealthy: 1, veryUnhealthy: 0, hazardous: 0 },
  jinja: { good: 1, moderate: 2, unhealthySensitive: 1, unhealthy: 0, veryUnhealthy: 0, hazardous: 0 },
}

// Sample site performance data
const sitePerformanceData = {
  kampala: [
    { date: "2024-06-01", pm25: 28, pm10: 45, uptime: 98 },
    { date: "2024-06-02", pm25: 32, pm10: 52, uptime: 97 },
    { date: "2024-06-03", pm25: 35, pm10: 58, uptime: 99 },
    { date: "2024-06-04", pm25: 30, pm10: 48, uptime: 100 },
    { date: "2024-06-05", pm25: 25, pm10: 42, uptime: 98 },
    { date: "2024-06-06", pm25: 22, pm10: 38, uptime: 97 },
    { date: "2024-06-07", pm25: 18, pm10: 32, uptime: 99 },
  ],
  gulu: [
    { date: "2024-06-01", pm25: 22, pm10: 38, uptime: 100 },
    { date: "2024-06-02", pm25: 24, pm10: 42, uptime: 100 },
    { date: "2024-06-03", pm25: 26, pm10: 45, uptime: 98 },
    { date: "2024-06-04", pm25: 28, pm10: 48, uptime: 97 },
    { date: "2024-06-05", pm25: 25, pm10: 44, uptime: 99 },
    { date: "2024-06-06", pm25: 23, pm10: 40, uptime: 100 },
    { date: "2024-06-07", pm25: 21, pm10: 36, uptime: 100 },
  ],
}

// Regional summary data
const regionalSummaryData = {
  regions: 5,
  totalDevices: 160,
  countries: 12,
  countriesDevices: 160,
  districts: 48,
  districtsWithDevices: 42,
  onlineDevices: 143,
  offlineDevices: 17,
  dataCompleteness: 94.2,
  averagePM25: 28.4,
  averagePM10: 45.6,
}

// Function to format number with units
function formatNumber(value, decimals = 1) {
  // Check if value is null, undefined, or not a number
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "N/A"
  }
  return Number(value).toFixed(decimals) + " μg/m³"
}

// AQI color mapping
const aqiColors = {
  good: "#4CAF50",
  moderate: "#FFC107",
  unhealthySensitive: "#FF9800",
  unhealthy: "#F44336",
  veryUnhealthy: "#9C27B0",
  hazardous: "#B71C1C",
}

// PM2.5 time series data for comparison charts
const pm25TimeSeriesData = [
  { date: "4/18/2025", pm25: 9, pm10: 3 },
  { date: "4/19/2025", pm25: 26, pm10: 36 },
  { date: "4/20/2025", pm25: 17, pm10: 22 },
  { date: "4/21/2025", pm25: 19, pm10: 25 },
  { date: "4/22/2025", pm25: 22, pm10: 31 },
  { date: "4/23/2025", pm25: 17, pm10: 16 },
  { date: "4/24/2025", pm25: 18, pm10: 21 },
  { date: "4/25/2025", pm25: 16, pm10: 18 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month")
  const [activeTab, setActiveTab] = useState("network")
  const [selectedSite, setSelectedSite] = useState("kampala")
  const [selectedRegion, setSelectedRegion] = useState("East Africa")
  const [selectedRegionForCountry, setSelectedRegionForCountry] = useState("East Africa")
  const [selectedCountry, setSelectedCountry] = useState("Uganda")
  const [selectedRegionForDistrict, setSelectedRegionForDistrict] = useState("East Africa")
  const [selectedCountryForDistrict, setSelectedCountryForDistrict] = useState("Uganda")
  const [selectedDistrict, setSelectedDistrict] = useState("Kampala")
  const [selectedLocation, setSelectedLocation] = useState("Nakasero")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Get the current site data
  const currentSite = sitesList.find((site) => site.id === selectedSite) || sitesList[0]
  const currentSiteAirQuality =
    siteAirQualityData[selectedSite as keyof typeof siteAirQualityData] || siteAirQualityData.kampala
  const currentSitePerformance =
    sitePerformanceData[selectedSite as keyof typeof sitePerformanceData] || sitePerformanceData.kampala

  // Get the selected region data
  const currentRegion =
    regionalComparisonData.find((region) => region.region === selectedRegion) || regionalComparisonData[0]

  // Get the selected country data
  const currentCountry = countryData.find((country) => country.name === selectedCountry) || countryData[0]

  // Get the selected district data
  const currentDistrict = districtData.find((district) => district.name === selectedDistrict) || districtData[0]

  // Filter countries based on selected region
  const countriesInSelectedRegion = countryData.filter((country) => country.region === selectedRegionForCountry)

  // Filter districts based on selected country
  const districtsInSelectedCountry = districtData.filter((district) => district.country === selectedCountryForDistrict)

  // Filter locations based on selected district
  const locationsInSelectedDistrict = villageData.filter((village) => village.district === selectedDistrict)

  // Get the selected location data
  const currentLocation = villageData.find((village) => village.name === selectedLocation) || villageData[0]

  // Filter countries for the regional analysis view
  const countriesInRegion = countryData.filter((country) => country.region === selectedRegion)

  // Filter districts for the country analysis view
  const districtsInCountry = districtData.filter((district) => district.country === selectedCountry)

  // Find regions with highest and lowest offline devices
  const regionWithMostOfflineDevices = useMemo(() => {
    return regionalComparisonData.reduce((prev, current) => 
      (prev.offlineDevices > current.offlineDevices) ? prev : current
    );
  }, []);

  const regionWithLeastOfflineDevices = useMemo(() => {
    return regionalComparisonData.reduce((prev, current) => 
      (prev.offlineDevices < current.offlineDevices) ? prev : current
    );
  }, []);

  // Find countries with highest and lowest offline devices
  const countryWithMostOfflineDevices = useMemo(() => {
    return countryData.reduce((prev, current) => 
      (prev.offlineDevices > current.offlineDevices) ? prev : current
    );
  }, []);

  const countryWithLeastOfflineDevices = useMemo(() => {
    return countryData.reduce((prev, current) => 
      (prev.offlineDevices < current.offlineDevices && current.offlineDevices > 0) ? prev : current
    );
  }, []);

  // Find districts with highest and lowest offline devices
  const districtWithMostOfflineDevices = useMemo(() => {
    return districtData.reduce((prev, current) => 
      (prev.offlineDevices > current.offlineDevices) ? prev : current
    );
  }, []);

  const districtWithLeastOfflineDevices = useMemo(() => {
    return districtData.reduce((prev, current) => 
      (prev.offlineDevices < current.offlineDevices && current.offlineDevices > 0) ? prev : current
    );
  }, []);

  // Find locations with highest and lowest offline devices
  const locationWithMostOfflineDevices = useMemo(() => {
    return villageData.reduce((prev, current) => 
      (prev.offlineDevices > current.offlineDevices) ? prev : current
    );
  }, []);

  const locationWithLeastOfflineDevices = useMemo(() => {
    return villageData.reduce((prev, current) => 
      (prev.offlineDevices < current.offlineDevices && current.offlineDevices > 0) ? prev : current
    );
  }, []);

  // Find entities with best and worst data transmission rates
  const regionWithBestDataTransmission = useMemo(() => {
    return regionalComparisonData.reduce((prev, current) => 
      (prev.dataTransmissionRate > current.dataTransmissionRate) ? prev : current
    );
  }, []);

  const regionWithWorstDataTransmission = useMemo(() => {
    return regionalComparisonData.reduce((prev, current) => 
      (prev.dataTransmissionRate < current.dataTransmissionRate) ? prev : current
    );
  }, []);

  // Prepare AQI distribution data for pie chart
  const getAqiDistributionData = (entity) => {
    if (!entity) return [];
    
    return [
      { name: "Good", value: entity.aqiGood || 0, color: aqiColors.good },
      { name: "Moderate", value: entity.aqiModerate || 0, color: aqiColors.moderate },
      { name: "UHFSG", value: entity.aqiUhfsg || 0, color: aqiColors.unhealthySensitive },
      { name: "Unhealthy", value: entity.aqiUnhealthy || 0, color: aqiColors.unhealthy },
      { name: "V.Unhealthy", value: entity.aqiVeryUnhealthy || 0, color: aqiColors.veryUnhealthy },
      { name: "Hazardous", value: entity.aqiHazardous || 0, color: aqiColors.hazardous },
    ];
  };

  // Get AQI distribution data for current selections
  const regionAqiData = getAqiDistributionData(currentRegion);
  const countryAqiData = getAqiDistributionData(currentCountry);
  const districtAqiData = getAqiDistributionData(currentDistrict);
  const locationAqiData = getAqiDistributionData(currentLocation);

  // Filter devices based on search term and status filter
  const filterDevices = (devices) => {
    if (!devices) return [];
    
    return devices.filter((device) => {
      const matchesSearch = 
        device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || device.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredCountryDevices = filterDevices(currentCountry.devicesList);
  const filteredDistrictDevices = filterDevices(currentDistrict.devicesList);
  const filteredLocationDevices = filterDevices(currentLocation.devicesList);

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4 w-[400px]">
          <TabsTrigger value="network">Network Analytics</TabsTrigger>
          <TabsTrigger value="site">Site Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-6">
          {/* Regional Analysis Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-primary" />
                  Regions & Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regionalSummaryData.regions} Regions</div>
                <p className="text-sm text-muted-foreground">
                  {regionalSummaryData.totalDevices} devices across all regions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Map className="mr-2 h-5 w-5 text-primary" />
                  Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regionalSummaryData.countries} Countries</div>
                <p className="text-sm text-muted-foreground">
                  {regionalSummaryData.countriesDevices} devices across all countries
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Layers className="mr-2 h-5 w-5 text-primary" />
                  Districts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {regionalSummaryData.districtsWithDevices}/{regionalSummaryData.districts}
                </div>
                <p className="text-sm text-muted-foreground">Districts with active monitoring devices</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Device Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {regionalSummaryData.onlineDevices}/{regionalSummaryData.totalDevices}
                </div>
                <p className="text-sm text-muted-foreground">Devices currently online</p>
              </CardContent>
            </Card>
          </div>
          <Tabs defaultValue="regional" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="regional">Regional Analysis</TabsTrigger>
            <TabsTrigger value="country">Country Analysis</TabsTrigger>
            <TabsTrigger value="district">District Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="regional" className="space-y-4">
            <RegionalAnalysis timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="country" className="space-y-4">
            <CountryAnalysisPage timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="district" className="space-y-4">
            <DistrictAnalysisPage timeRange={timeRange} />
          </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="site" className="space-y-6">
          
          <SiteAnalyticsPage/>
      </TabsContent>
      </Tabs>
    </div>
  )
}

