"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface Device {
  id: string
  name: string
  status: string
  lat: number
  lng: number
  lastUpdate?: string
  pm25?: number
  pm10?: number
  location?: string
}

interface AfricaMapProps {
  devices: Device[]
  onDeviceSelect?: (id: string) => void
  selectedDeviceId?: string
}

export default function AfricaMap({ devices = [], onDeviceSelect, selectedDeviceId }: AfricaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)
  const hasInitializedRef = useRef(false)
  const [apiDevices, setApiDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real device data when component mounts if no devices are provided
  useEffect(() => {
    if (devices.length === 0) {
      fetchDeviceData()
    }
  }, [devices])

  const fetchDeviceData = async () => {
    try {
      setIsLoading(true)
      console.log("Fetching device data from API...")
      
      const response = await fetch('/api/valid-device-locations')
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Received", data.length, "devices from API")
      
      // Transform API data to match the component's expected format
      const transformedDevices = data.map(device => ({
        id: device.id,
        name: device.name,
        status: device.status === "ACTIVE" ? "active" : "offline",
        lat: parseFloat(device.latitude),
        lng: parseFloat(device.longitude),
        lastUpdate: device.reading_timestamp ? new Date(device.reading_timestamp).toLocaleString() : "Unknown",
        pm25: device.pm2_5,
        pm10: device.pm10,
        location: device.location?.name
      }))
      
      console.log("Transformed", transformedDevices.length, "devices for display")
      setApiDevices(transformedDevices)
    } catch (error) {
      console.error("Error fetching device data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Use provided devices if available, otherwise use fetched API devices
  const displayDevices = devices.length > 0 ? devices : apiDevices
  
  // Define createCustomIcon outside useEffect to avoid recreating it on every render
  const createCustomIcon = useCallback((status: string, isSelected = false) => {
    const markerColor = status === "active" ? "#4CAF50" : status === "warning" ? "#FFC107" : "#F44336"
    const size = isSelected ? 30 : 20
    const borderWidth = isSelected ? 3 : 2

    return L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: ${markerColor}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${borderWidth}px solid white; ${isSelected ? "box-shadow: 0 0 0 2px #000;" : ""}"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
  }, [])

  // Initialize map and update markers in a single useEffect
  useEffect(() => {
    // Skip if no map container
    if (!mapRef.current) return

    // Create map only once
    if (!mapInstanceRef.current) {
      try {
        console.log("Initializing map...")
        
        // Fix for Leaflet icon issues
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        // Create map centered on Uganda initially
        const map = L.map(mapRef.current).setView([0.3476, 32.5825], 7)

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map)

        mapInstanceRef.current = map
        hasInitializedRef.current = true
        console.log("Map initialized successfully")
      } catch (error) {
        console.error("Error initializing map:", error)
        return
      }
    }

    // Skip marker updates if map isn't initialized
    if (!hasInitializedRef.current || !mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.remove()
    })
    markersRef.current = []

    // Add markers for each device
    if (displayDevices.length > 0) {
      console.log("Adding", displayDevices.length, "markers to map")
      
      try {
        // Create a bounds object directly from device coordinates
        const latLngs = displayDevices.map((device) => L.latLng(device.lat, device.lng))
        const bounds = L.latLngBounds(latLngs)
        
        // Add markers
        displayDevices.forEach((device) => {
          if (isNaN(device.lat) || isNaN(device.lng)) {
            console.warn(`Invalid coordinates for device ${device.id}:`, device.lat, device.lng)
            return
          }
          
          const isSelected = device.id === selectedDeviceId
          const icon = createCustomIcon(device.status, isSelected)

          const marker = L.marker([device.lat, device.lng], {
            icon: icon,
          }).addTo(mapInstanceRef.current!)

          // Store marker for cleanup
          markersRef.current.push(marker)

          // Add popup with device info
          marker.bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 5px; font-weight: bold;">${device.name}</h3>
              <p style="margin: 0 0 5px;">ID: ${device.id}</p>
              <p style="margin: 0 0 5px;">Status: 
                <span style="color: ${
                  device.status === "active" ? "#4CAF50" : device.status === "warning" ? "#FFC107" : "#F44336"
                }; font-weight: bold;">
                  ${device.status.toUpperCase()}
                </span>
              </p>
              ${device.location ? `<p style="margin: 0 0 5px;">Location: ${device.location}</p>` : ""}
              ${device.lastUpdate ? `<p style="margin: 0 0 5px;">Last Update: ${device.lastUpdate}</p>` : ""}
              ${
                device.status !== "offline"
                  ? `
                <p style="margin: 0 0 5px;">PM2.5: ${device.pm25} µg/m³</p>
                <p style="margin: 0 0 5px;">PM10: ${device.pm10} µg/m³</p>
              `
                  : ""
              }
              <div style="margin-top: 10px; text-align: center;">
                <a href="/dashboard/devices/${device.id}" style="display: inline-block; padding: 5px 10px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">View Details</a>
              </div>
            </div>
          `)

          // Make the marker clickable
          marker.on("click", () => {
            if (onDeviceSelect) {
              onDeviceSelect(device.id)
            }
          })

          // Add double click event to navigate to device detail page
          marker.on("dblclick", () => {
            router.push(`/dashboard/devices/${device.id}`)
          })

          // If this is the selected device, open its popup
          if (isSelected) {
            marker.openPopup()
          }
        })

        // Fit the map to the bounds with some padding
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 6,
        })
        
        console.log("Added", markersRef.current.length, "markers to map")
      } catch (error) {
        console.error("Error adding markers to map:", error)
      }
    } else {
      console.log("No devices available to show on map")
    }

    // Add Africa outline for context
    if (!geoJsonLayerRef.current) {
      drawSimpleAfricaOutline()
    }

    function drawSimpleAfricaOutline() {
      if (!mapInstanceRef.current) return

      // Simplified polygon coordinates for Africa
      const africaCoords = [
        [37, -4], [40, 15], [23, 32], [12, 30], [-10, 28], 
        [-18, 15], [-16, -16], [20, -36], [38, -30], [42, -10], [37, -4]
      ]

      // Create a polygon and add it to the map
      const africaPolygon = L.polygon(africaCoords.map(coord => [coord[1], coord[0]]), {
        color: "#666",
        weight: 1,
        fillColor: "#f8f8f8",
        fillOpacity: 0.1
      }).addTo(mapInstanceRef.current)

      geoJsonLayerRef.current = L.geoJSON() // Empty GeoJSON layer as a placeholder
      mapInstanceRef.current.addLayer(geoJsonLayerRef.current)
    }
  }, [displayDevices, selectedDeviceId, createCustomIcon, onDeviceSelect, router])

  // Add a refresh button to manually reload data if needed
  const handleRefresh = () => {
    fetchDeviceData()
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      
      {isLoading && (
        <div className="absolute top-2 right-2 bg-white rounded-md shadow-md px-2 py-1 z-[1000]">
          <div className="flex items-center">
            <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-xs">Loading data...</span>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-2 right-2 bg-white rounded-md shadow-md px-2 py-1 z-[1000]">
        <div className="flex items-center">
          <span className="text-xs mr-2">{displayDevices.length} devices</span>
          <button 
            onClick={handleRefresh}
            className="text-xs bg-blue-500 text-white rounded px-2 py-0.5"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}