import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle } from "lucide-react"

// Sample alerts data
const alerts = [
  {
    id: 1,
    type: "critical",
    message: "Device KLA001 offline for 24 hours",
    location: "Kampala",
    timestamp: "2024-06-10 14:30",
  },
  {
    id: 2,
    type: "warning",
    message: "Device NBI002 battery low (15%)",
    location: "Nairobi",
    timestamp: "2024-06-10 12:15",
  },
  {
    id: 3,
    type: "critical",
    message: "Device ACC003 temperature exceeds threshold",
    location: "Accra",
    timestamp: "2024-06-10 10:45",
  },
  {
    id: 4,
    type: "warning",
    message: "Device LAG004 signal strength weak",
    location: "Lagos",
    timestamp: "2024-06-09 23:20",
  },
]

export default function AlertsPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.map((alert) => (
            <Alert key={alert.id} variant={alert.type === "critical" ? "destructive" : "warning"}>
              {alert.type === "critical" ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>
                {alert.location} - {alert.timestamp}
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

