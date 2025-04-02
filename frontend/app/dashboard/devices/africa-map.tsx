"use client"

import { useEffect, useRef, useCallback } from "react"
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
  battery?: string
  pm25?: number
  pm10?: number
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
        // Fix for Leaflet icon issues
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        // Create map centered on Africa
        const map = L.map(mapRef.current).setView([5, 20], 3)

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map)

        mapInstanceRef.current = map
        hasInitializedRef.current = true
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

    try {
      // Add markers for each device
      if (Array.isArray(devices) && devices.length > 0) {
        // Create a bounds object directly from device coordinates
        const latLngs = devices.map((device) => L.latLng(device.lat, device.lng))
        const bounds = L.latLngBounds(latLngs)

        // Add markers
        devices.forEach((device) => {
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
              ${device.lastUpdate ? `<p style="margin: 0 0 5px;">Last Update: ${device.lastUpdate}</p>` : ""}
              ${device.battery ? `<p style="margin: 0 0 5px;">Battery: ${device.battery}</p>` : ""}
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

          // Make the marker clickable to navigate to the device detail page
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
      }

      // Add Africa outline GeoJSON for better visualization
      if (!geoJsonLayerRef.current) {
        // Use a more reliable source or provide a local fallback
        // Try to use fetch with error handling
        fetch("/api/africa-geojson")
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch Africa GeoJSON: ${response.status}`)
            }
            return response.json()
          })
          .then((data) => {
            if (!mapInstanceRef.current) return
            addAfricaOutline(data)
          })
          .catch((error) => {
            console.warn("Error loading Africa GeoJSON from API:", error)
            // Fallback: Just draw a simple polygon representing Africa
            drawSimpleAfricaOutline()
          })
      }
    } catch (error) {
      console.error("Error updating map markers:", error)
    }

    function addAfricaOutline(data: any) {
      if (!mapInstanceRef.current) return
      
      // Filter for African countries if data contains worldwide countries
      const africaCountries = data.features.filter((feature: any) => {
        const africanCountries = [
          "DZA", "AGO", "BEN", "BWA", "BFA", "BDI", "CMR", "CPV", "CAF", "TCD",
          "COM", "COG", "COD", "DJI", "EGY", "GNQ", "ERI", "ETH", "GAB", "GMB",
          "GHA", "GIN", "GNB", "CIV", "KEN", "LSO", "LBR", "LBY", "MDG", "MWI",
          "MLI", "MRT", "MUS", "MAR", "MOZ", "NAM", "NER", "NGA", "RWA", "STP",
          "SEN", "SYC", "SLE", "SOM", "ZAF", "SSD", "SDN", "SWZ", "TZA", "TGO",
          "TUN", "UGA", "ZMB", "ZWE"
        ]
        return africanCountries.includes(feature.properties.iso_a3)
      })

      geoJsonLayerRef.current = L.geoJSON(
        { type: "FeatureCollection", features: africaCountries },
        {
          style: {
            color: "#666",
            weight: 1,
            fillColor: "#f8f8f8",
            fillOpacity: 0.1,
          },
        }
      ).addTo(mapInstanceRef.current)
    }

    function drawSimpleAfricaOutline() {
      if (!mapInstanceRef.current) return

      // Simplified polygon coordinates representing Africa's rough outline
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

      geoJsonLayerRef.current = L.geoJSON() // Create an empty GeoJSON layer as a placeholder
      mapInstanceRef.current.addLayer(geoJsonLayerRef.current)
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        // Clear all markers
        markersRef.current.forEach((marker) => {
          marker.remove()
        })
        markersRef.current = []

        // Remove GeoJSON layer
        if (geoJsonLayerRef.current) {
          geoJsonLayerRef.current.remove()
          geoJsonLayerRef.current = null
        }

        // Remove map
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        hasInitializedRef.current = false
      }
    }
  }, [devices, selectedDeviceId, createCustomIcon, onDeviceSelect, router])

  return <div ref={mapRef} className="h-full w-full" />
}