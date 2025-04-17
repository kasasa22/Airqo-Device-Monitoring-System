import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Battery,
  Clock,
  Download,
  RefreshCw,
  Signal,
  ThermometerSun,
  Zap,
  Timer,
  Calendar,
} from "lucide-react";
import { config } from "@/lib/config";

const DevicePerformanceMetrics = ({ deviceId, timeRange = "7days" }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMetricTab, setActiveMetricTab] = useState("data-quality");

  // Format percentages with proper precision
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return "N/A";
    return `${Number(value).toFixed(1)}%`;
  };

  // Calculate color based on value
  const getStatusColor = (value, thresholds = { warning: 70, danger: 50 }) => {
    if (value === undefined || value === null) return "gray";
    const numValue = Number(value);
    if (numValue >= thresholds.warning) return "green";
    if (numValue >= thresholds.danger) return "yellow";
    return "red";
  };

  // Fetch performance metrics from the API
  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${config.apiUrl}/device-performance/${deviceId}?timeRange=${timeRange}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setPerformanceData(data);
    } catch (err) {
      console.error("Error fetching performance metrics:", err);
      setError(err.message);

      // Fallback to simulated data in case of error
      setPerformanceData(generateSimulatedPerformanceData());
    } finally {
      setLoading(false);
    }
  };

  // Generate simulated performance data for development/fallback
  const generateSimulatedPerformanceData = () => {
    const generateDailyData = (days) => {
      const data = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        data.push({
          date: dateStr,
          uptime: Math.floor(Math.random() * 30) + 70,
          dataCompleteness: Math.floor(Math.random() * 30) + 60,
          batteryLevel: Math.floor(Math.random() * 30) + 60,
          signalStrength: Math.floor(Math.random() * 40) + 60,
          dataSamples: Math.floor(Math.random() * 50) + 50,
          expectedSamples: 96,
        });
      }
      
      return data;
    };

    // Simulated data for the last 30 days
    const dailyData = generateDailyData(30);
    
    // Calculated summary metrics
    const avgUptime = dailyData.reduce((sum, day) => sum + day.uptime, 0) / dailyData.length;
    const avgDataCompleteness = dailyData.reduce((sum, day) => sum + day.dataCompleteness, 0) / dailyData.length;
    const totalSamples = dailyData.reduce((sum, day) => sum + day.dataSamples, 0);
    const totalExpectedSamples = dailyData.reduce((sum, day) => sum + day.expectedSamples, 0);
    const dataCollectionRate = (totalSamples / totalExpectedSamples) * 100;

    // Calculate MTBF (Mean Time Between Failures) and MTTR (Mean Time To Recovery)
    // For simulation, we'll just use random realistic values
    const mtbf = Math.floor(Math.random() * 30) + 45; // days
    const mttr = Math.floor(Math.random() * 6) + 2; // hours
    
    // Calculate calibration drift (simulated)
    const calibrationDrift = Math.random() * 5; // percent
    
    return {
      summary: {
        uptime: avgUptime,
        dataCompleteness: avgDataCompleteness,
        dataCollectionRate: dataCollectionRate,
        mtbf: mtbf,
        mttr: mttr,
        calibrationDrift: calibrationDrift,
        batteryHealth: Math.floor(Math.random() * 20) + 80,
        signalQuality: Math.floor(Math.random() * 30) + 70,
      },
      dailyData: dailyData,
      statusHistory: [
        { status: "active", duration: 45, startDate: "2025-03-05" },
        { status: "maintenance", duration: 2, startDate: "2025-03-03" },
        { status: "offline", duration: 3, startDate: "2025-02-28" },
        { status: "active", duration: 30, startDate: "2025-01-29" },
      ],
      maintenanceHistory: [
        { date: "2025-03-03", type: "Routine", description: "Regular calibration and cleaning" },
        { date: "2025-01-15", type: "Repair", description: "Replaced battery and power module" },
        { date: "2024-11-22", type: "Installation", description: "Initial deployment and setup" },
      ],
      calibrationData: [
        { month: "Jan", pm25Drift: 0.5, pm10Drift: 0.7 },
        { month: "Feb", pm25Drift: 0.8, pm10Drift: 1.2 },
        { month: "Mar", pm25Drift: 1.5, pm10Drift: 1.8 },
        { month: "Apr", pm25Drift: 2.2, pm10Drift: 2.3 },
      ],
    };
  };

  // Initialize data fetching
  useEffect(() => {
    fetchPerformanceMetrics();
  }, [deviceId, timeRange]);

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 text-primary animate-spin mr-2" />
        <p>Loading performance metrics...</p>
      </div>
    );
  }

  // Render error state
  if (error && !performanceData) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center text-red-700">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>
            Error loading performance metrics: {error}
          </span>
        </div>
        <Button 
          className="mt-2" 
          variant="outline" 
          size="sm"
          onClick={fetchPerformanceMetrics}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // If we're here, we have performance data (either real or simulated)
  const { summary, dailyData, statusHistory, maintenanceHistory, calibrationData } = performanceData;

  // Calculate time range for metrics
  const calculateTimeRangeText = () => {
    switch (timeRange) {
      case "7days": return "Last 7 Days";
      case "30days": return "Last 30 Days";
      case "90days": return "Last 90 Days";
      default: return "Custom Range";
    }
  };

  // Render metrics dashboard
  return (
    <div className="space-y-6">
      {/* Summary metrics cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-3 mb-2 bg-${getStatusColor(summary.uptime)}-100`}>
                <Activity className={`h-6 w-6 text-${getStatusColor(summary.uptime)}-500`} />
              </div>
              <div className="text-2xl font-bold">{formatPercentage(summary.uptime)}</div>
              <p className="text-muted-foreground text-sm">Device Uptime</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-3 mb-2 bg-${getStatusColor(summary.dataCompleteness)}-100`}>
                <Zap className={`h-6 w-6 text-${getStatusColor(summary.dataCompleteness)}-500`} />
              </div>
              <div className="text-2xl font-bold">{formatPercentage(summary.dataCompleteness)}</div>
              <p className="text-muted-foreground text-sm">Data Completeness</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="rounded-full p-3 mb-2 bg-blue-100">
                <Timer className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{summary.mtbf || 'N/A'} days</div>
              <p className="text-muted-foreground text-sm">Mean Time Between Failures</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="rounded-full p-3 mb-2 bg-purple-100">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">{summary.mttr || 'N/A'} hours</div>
              <p className="text-muted-foreground text-sm">Mean Time To Recovery</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed performance metrics tabs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>
                Detailed metrics for {calculateTimeRangeText()}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="flex items-center" onClick={fetchPerformanceMetrics}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeMetricTab} onValueChange={setActiveMetricTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="data-quality">Data Quality</TabsTrigger>
              <TabsTrigger value="device-health">Device Health</TabsTrigger>
              <TabsTrigger value="calibration">Calibration</TabsTrigger>
            </TabsList>

            <TabsContent value="data-quality" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="uptime" 
                      name="Uptime (%)" 
                      stroke="#4CAF50" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="dataCompleteness" 
                      name="Data Completeness (%)" 
                      stroke="#2196F3" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </TabsContent>

            <TabsContent value="device-health" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Battery Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyData.slice(0, 14)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="batteryLevel" 
                            name="Battery Level (%)" 
                            stroke="#FF9800" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 flex justify-between items-center p-3 bg-white rounded-lg">
                      <div className="flex items-center">
                        <Battery className={`h-5 w-5 mr-2 text-${getStatusColor(summary.batteryHealth)}-500`} />
                        <span>Battery Health</span>
                      </div>
                      <Badge className={`bg-${getStatusColor(summary.batteryHealth)}-500`}>
                        {formatPercentage(summary.batteryHealth)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Signal Strength</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyData.slice(0, 14)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="signalStrength" 
                            name="Signal Strength (%)" 
                            stroke="#9C27B0" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 flex justify-between items-center p-3 bg-white rounded-lg">
                      <div className="flex items-center">
                        <Signal className={`h-5 w-5 mr-2 text-${getStatusColor(summary.signalQuality)}-500`} />
                        <span>Overall Signal Quality</span>
                      </div>
                      <Badge className={`bg-${getStatusColor(summary.signalQuality)}-500`}>
                        {formatPercentage(summary.signalQuality)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Maintenance History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {maintenanceHistory.map((entry, index) => (
                      <div key={index} className="p-3 bg-white rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-primary" />
                            <span className="font-medium">{entry.date}</span>
                          </div>
                          <Badge className={
                            entry.type === "Routine" ? "bg-green-500" : 
                            entry.type === "Repair" ? "bg-red-500" : 
                            "bg-blue-500"
                          }>
                            {entry.type}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{entry.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calibration" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Calibration Drift</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={calibrationData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="pm25Drift" 
                            name="PM2.5 Drift (%)" 
                            stroke="#8884d8" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="pm10Drift" 
                            name="PM10 Drift (%)" 
                            stroke="#82ca9d" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 flex justify-between items-center p-3 bg-white rounded-lg">
                      <div className="flex items-center">
                        <ThermometerSun className={`h-5 w-5 mr-2 text-${
                          summary.calibrationDrift < 2 ? "green" : 
                          summary.calibrationDrift < 4 ? "yellow" : "red"
                        }-500`} />
                        <span>Current Calibration Drift</span>
                      </div>
                      <Badge className={`bg-${
                        summary.calibrationDrift < 2 ? "green" : 
                        summary.calibrationDrift < 4 ? "yellow" : "red"
                      }-500`}>
                        {summary.calibrationDrift.toFixed(1)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recalibration Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-white rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Next Recalibration Due</p>
                          <p className="text-xl font-medium">May 15, 2025</p>
                        </div>
                        <div className="h-16 w-16">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Elapsed', value: 70 },
                                  { name: 'Remaining', value: 30 },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={20}
                                outerRadius={30}
                                dataKey="value"
                              >
                                <Cell fill="#4CAF50" />
                                <Cell fill="#E0E0E0" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        70% of calibration period elapsed
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white rounded-lg">
                      <h3 className="font-medium mb-2">Calibration Recommendations</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start">
                          <div className="min-w-4 mr-2">•</div>
                          <div>Schedule recalibration when drift exceeds 3% to maintain data accuracy</div>
                        </li>
                        <li className="flex items-start">
                          <div className="min-w-4 mr-2">•</div>
                          <div>Consider co-location testing with reference devices quarterly</div>
                        </li>
                        <li className="flex items-start">
                          <div className="min-w-4 mr-2">•</div>
                          <div>Calibration history indicates consistent drift pattern - check sensor baseline</div>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevicePerformanceMetrics;