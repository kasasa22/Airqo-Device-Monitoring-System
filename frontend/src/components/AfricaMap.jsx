// src/components/AfricaMap.jsx
"use client"

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// Sample sensor data with coordinates
const sensors = [
  { id: 1, name: "KLA-001", lat: 0.3476, lng: 32.5825, status: "active" }, // Kampala
  { id: 2, name: "NBO-002", lat: -1.2921, lng: 36.8219, status: "active" }, // Nairobi
  { id: 3, name: "ACC-003", lat: 5.6037, lng: -0.1870, status: "offline" }, // Accra
  { id: 4, name: "DAR-004", lat: -6.7924, lng: 39.2083, status: "active" }, // Dar es Salaam
  { id: 5, name: "LOS-005", lat: 6.5244, lng: 3.3792, status: "offline" }, // Lagos
];

export default function AfricaMap() {
  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{
        scale: 400,
        center: [20, 3]
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <Geographies geography="/africa.json">
        {({ geographies }) =>
          geographies.map(geo => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill="#EAEAEC"
              stroke="#D6D6DA"
            />
          ))
        }
      </Geographies>
      {sensors.map(({ id, name, lat, lng, status }) => (
        <Marker key={id} coordinates={[lng, lat]}>
          <circle
            r={5}
            fill={status === "active" ? "#3B82F6" : "#EF4444"}
            stroke="#FFF"
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            y={-10}
            style={{ 
              fontFamily: "system-ui", 
              fontSize: "8px",
              fill: "#5D5D5D"
            }}
          >
            {name}
          </text>
        </Marker>
      ))}
    </ComposableMap>
  );
}