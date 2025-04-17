<div className="space-y-2 w-full">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="mr-2 h-4 w-4 text-primary" />
                  {hourlyTransmissionData.length > 0 ? (
                    <>
                      Data volume peaks during {hourlyPatterns.peakHour?.hour || ''} with {hourlyPatterns.peakHour?.dataVolume || 0} readings
                    </>
                  ) : (
                    "Insufficient hourly data available"
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-2 border rounded-md bg-blue-50">
                    <div className="text-sm font-medium">Peak Hours</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {hourlyTransmissionData
                        .sort((a, b) => b.dataVolume - a.dataVolume)
                        .slice(0, 3)
                        .map(hour => `${hour.hour} (${hour.dataVolume})`)
                        .join(', ')}
                    </div>
                  </div>
                  
                  <div className="p-2 border rounded-md bg-yellow-50">
                    <div className="text-sm font-medium">Low Activity Hours</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {hourlyTransmissionData
                        .sort((a, b) => a.dataVolume - b.dataVolume)
                        .slice(0, 3)
                        .map(hour => `${hour.hour} (${hour.dataVolume})`)
                        .join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Weekly Transmission Pattern
                </CardTitle>
                <CardDescription>Data volume by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { day: 'Monday', volume: getDayOfWeekVolume(1, dataVolumeOverTime) },
                        { day: 'Tuesday', volume: getDayOfWeekVolume(2, dataVolumeOverTime) },
                        { day: 'Wednesday', volume: getDayOfWeekVolume(3, dataVolumeOverTime) },
                        { day: 'Thursday', volume: getDayOfWeekVolume(4, dataVolumeOverTime) },
                        { day: 'Friday', volume: getDayOfWeekVolume(5, dataVolumeOverTime) },
                        { day: 'Saturday', volume: getDayOfWeekVolume(6, dataVolumeOverTime) },
                        { day: 'Sunday', volume: getDayOfWeekVolume(0, dataVolumeOverTime) },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="volume" name="Data Volume" fill="#3F51B5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t px-4 py-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Info className="mr-2 h-4 w-4 text-primary" />
                  {getWeekdayInsight(dataVolumeOverTime)}
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-primary" />
                  Transmission Quality Analysis
                </CardTitle>
                <CardDescription>Indicators of data transmission quality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Data Completeness */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Data Completeness</span>
                      <span className="text-sm font-medium">{networkStats.dataCompleteness}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getQualityColorClass(networkStats.dataCompleteness)}`} 
                        style={{ width: `${networkStats.dataCompleteness}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Device Reliability */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Device Reliability</span>
                      <span className="text-sm font-medium">
                        {networkStats.totalDevices > 0 
                          ? `${Math.round(((networkStats.totalDevices - networkStats.failingDevices) / networkStats.totalDevices) * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          getQualityColorClass(networkStats.totalDevices > 0 
                            ? Math.round(((networkStats.totalDevices - networkStats.failingDevices) / networkStats.totalDevices) * 100)
                            : 0)
                        }`} 
                        style={{ 
                          width: `${networkStats.totalDevices > 0 
                            ? Math.round(((networkStats.totalDevices - networkStats.failingDevices) / networkStats.totalDevices) * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Consistency Score */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Transmission Consistency</span>
                      <span className="text-sm font-medium">
                        {calculateConsistencyScore(deviceTransmissionData)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getQualityColorClass(calculateConsistencyScore(deviceTransmissionData))}`} 
                        style={{ width: `${calculateConsistencyScore(deviceTransmissionData)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Hourly Coverage */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">24-Hour Coverage</span>
                      <span className="text-sm font-medium">
                        {hourlyTransmissionData.length > 0 
                          ? `${Math.round((hourlyTransmissionData.length / 24) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          getQualityColorClass(hourlyTransmissionData.length > 0 
                            ? Math.round((hourlyTransmissionData.length / 24) * 100)
                            : 0)
                        }`} 
                        style={{ 
                          width: `${hourlyTransmissionData.length > 0 
                            ? Math.round((hourlyTransmissionData.length / 24) * 100)
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 border rounded-md">
                    <h3 className="text-sm font-medium">Quality Assessment</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getQualityAssessment(
                        networkStats.dataCompleteness,
                        networkStats.totalDevices > 0 
                          ? Math.round(((networkStats.totalDevices - networkStats.failingDevices) / networkStats.totalDevices) * 100)
                          : 0,
                        calculateConsistencyScore(deviceTransmissionData),
                        hourlyTransmissionData.length > 0 
                          ? Math.round((hourlyTransmissionData.length / 24) * 100)
                          : 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Failure Analysis Tab */}
        <TabsContent value="failures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-primary" />
                Detailed Failure Analysis
              </CardTitle>
              <CardDescription>Comprehensive view of device failure patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-red-50 border border-red-100 rounded-md p-3">
                    <div className="text-sm font-medium">Total Failures</div>
                    <div className="text-2xl font-bold mt-1">
                      {failureAnalysis.reduce((sum, device) => sum + device.failures, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Across {failureAnalysis.filter(d => d.failures > 0).length} devices
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3">
                    <div className="text-sm font-medium">Average Uptime</div>
                    <div className="text-2xl font-bold mt-1">
                      {Math.round(failureAnalysis.reduce((sum, device) => sum + device.uptime, 0) / 
                        (failureAnalysis.length || 1))}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Network-wide average
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                    <div className="text-sm font-medium">Most Recent Failure</div>
                    <div className="text-lg font-bold mt-1">
                      {getLatestFailureDate(failureAnalysis)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Based on available data
                    </div>
                  </div>
                </div>
                
                {/* Devices with most failures */}
                <div>
                  <h3 className="text-md font-medium mb-3">Devices with Most Failures</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Device ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Failures
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Uptime
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {failureAnalysis.slice(0, 5).map((device) => (
                          <tr key={device.device}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {device.device}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {device.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Badge className={device.failures > 2 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                {device.failures}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div className={`h-2 rounded-full ${getQualityColorClass(device.uptime)}`} style={{ width: `${device.uptime}%` }}></div>
                                </div>
                                <span>{Math.round(device.uptime)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {device.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Failure calendar heat map - placeholder */}
                <div>
                  <h3 className="text-md font-medium mb-3">Failure Pattern Analysis</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Time-based patterns */}
                    <div className="border rounded-md p-3">
                      <h4 className="text-sm font-medium mb-2">Time-based Patterns</h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{getTimePatternsInsight(hourlyTransmissionData, failureAnalysis)}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{getWeekdayFailureInsight(dataVolumeOverTime, deviceTransmissionData)}</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Device-based patterns */}
                    <div className="border rounded-md p-3">
                      <h4 className="text-sm font-medium mb-2">Device-based Patterns</h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{getDevicePatternInsight(failureAnalysis)}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>
                            {failureAnalysis.length > 0 ? 
                              `${Math.round(100 * failureAnalysis.filter(d => d.failures > 0).length / failureAnalysis.length)}% of devices have experienced at least one failure.` :
                              "No failure data available."
                            }
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Recommendations */}
                <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
                  <h3 className="text-md font-medium mb-2 flex items-center">
                    <Share2 className="mr-2 h-4 w-4 text-blue-500" />
                    Recommendations
                  </h3>
                  <ul className="text-sm space-y-2">
                    {generateRecommendations(
                      networkStats, 
                      failureAnalysis,
                      hourlyTransmissionData,
                      dataDrops
                    ).map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper functions

// Calculate data volume for a specific day of week
function getDayOfWeekVolume(dayNumber, volumeData) {
  const matchingDays = volumeData.filter(day => {
    const date = new Date(day.date);
    return date.getDay() === dayNumber;
  });
  
  if (matchingDays.length === 0) return 0;
  return matchingDays.reduce((sum, day) => sum + day.dataVolume, 0) / matchingDays.length;
}

// Generate insight about weekday patterns
function getWeekdayInsight(volumeData) {
  const weekdayData = [
    { day: 0, name: 'Sunday', volume: getDayOfWeekVolume(0, volumeData) },
    { day: 1, name: 'Monday', volume: getDayOfWeekVolume(1, volumeData) },
    { day: 2, name: 'Tuesday', volume: getDayOfWeekVolume(2, volumeData) },
    { day: 3, name: 'Wednesday', volume: getDayOfWeekVolume(3, volumeData) },
    { day: 4, name: 'Thursday', volume: getDayOfWeekVolume(4, volumeData) },
    { day: 5, name: 'Friday', volume: getDayOfWeekVolume(5, volumeData) },
    { day: 6, name: 'Saturday', volume: getDayOfWeekVolume(6, volumeData) }
  ];
  
  // Find day with max volume
  const maxVolumeDay = weekdayData.reduce((max, day) => day.volume > max.volume ? day : max, weekdayData[0]);
  
  // Find day with min volume
  const minVolumeDay = weekdayData.reduce((min, day) => day.volume < min.volume ? day : min, weekdayData[0]);
  
  // Calculate weekday vs weekend difference
  const weekdayAvg = [1,2,3,4,5].reduce((sum, day) => 
    sum + getDayOfWeekVolume(day, volumeData), 0) / 5;
  const weekendAvg = [0,6].reduce((sum, day) => 
    sum + getDayOfWeekVolume(day, volumeData), 0) / 2;
  
  if (weekdayAvg > weekendAvg * 1.2) {
    return `Weekdays have ${Math.round((weekdayAvg / weekendAvg - 1) * 100)}% more data volume than weekends.`;
  } else if (weekendAvg > weekdayAvg * 1.2) {
    return `Weekends have ${Math.round((weekendAvg / weekdayAvg - 1) * 100)}% more data volume than weekdays.`;
  } else {
    return `${maxVolumeDay.name} has the highest data volume, ${minVolumeDay.name} has the lowest.`;
  }
}

// Generate insight about weekday failure patterns
function getWeekdayFailureInsight(volumeData, transmissionData) {
  if (!transmissionData || transmissionData.length === 0) {
    return "Insufficient data to analyze weekday failure patterns.";
  }
  
  // Count failures by day of week
  const failuresByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  
  transmissionData.forEach(day => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    
    // Count devices that didn't transmit
    let failuresOnThisDay = 0;
    Object.entries(day).forEach(([key, value]) => {
      if (key !== 'date' && value === 0) {
        failuresOnThisDay++;
      }
    });
    
    failuresByDayOfWeek[dayOfWeek] += failuresOnThisDay;
  });
  
  // Find day with most failures
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const maxFailureDay = failuresByDayOfWeek.indexOf(Math.max(...failuresByDayOfWeek));
  
  // Weekday vs weekend comparison
  const weekdayFailures = [1,2,3,4,5].reduce((sum, day) => sum + failuresByDayOfWeek[day], 0);
  const weekendFailures = failuresByDayOfWeek[0] + failuresByDayOfWeek[6];
  
  if (weekdayFailures > weekendFailures * 2) {
    return `Transmission failures occur most frequently on weekdays, with ${dayNames[maxFailureDay]} showing the highest rate.`;
  } else if (weekendFailures > weekdayFailures) {
    return `Transmission failures occur more frequently on weekends compared to weekdays.`;
  } else {
    return `${dayNames[maxFailureDay]} shows the highest rate of transmission failures.`;
  }
}

// Get color class based on quality score
function getQualityColorClass(score) {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-blue-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

// Calculate consistency score based on device transmission data
function calculateConsistencyScore(transmissionData) {
  if (!transmissionData || transmissionData.length === 0) return 0;
  
  // Get list of all devices
  const devices = new Set();
  transmissionData.forEach(day => {
    Object.keys(day).forEach(key => {
      if (key !== 'date') devices.add(key);
    });
  });
  
  // For each device, calculate % of days with transmission
  let totalScore = 0;
  devices.forEach(device => {
    let daysWithData = 0;
    
    transmissionData.forEach(day => {
      if (day[device] && day[device] > 0) {
        daysWithData++;
      }
    });
    
    const deviceScore = (daysWithData / transmissionData.length) * 100;
    totalScore += deviceScore;
  });
  
  // Average across all devices
  return Math.round(totalScore / devices.size);
}

// Get quality assessment based on metrics
function getQualityAssessment(completeness, reliability, consistency, coverage) {
  const averageScore = (completeness + reliability + consistency + coverage) / 4;
  
  if (averageScore >= 90) {
    return "Excellent data transmission quality. The network is performing optimally with high reliability and consistency.";
  } else if (averageScore >= 75) {
    return "Good data transmission quality. The network is performing well but some minor improvements could be made.";
  } else if (averageScore >= 60) {
    return "Fair data transmission quality. The network has areas that need attention to improve reliability.";
  } else {
    return "Poor data transmission quality. The network requires significant improvements to reliability and consistency.";
  }
}

// Get latest failure date from failure analysis
function getLatestFailureDate(failureAnalysis) {
  if (!failureAnalysis || failureAnalysis.length === 0) return "N/A";
  
  // Try to extract date from status field for devices with failures
  const devicesWithFailures = failureAnalysis.filter(d => d.failures > 0);
  if (devicesWithFailures.length === 0) return "No failures";
  
  const dateRegex = /(\d{4}-\d{2}-\d{2})/;
  const extractedDates = [];
  
  devicesWithFailures.forEach(device => {
    const match = device.status.match(dateRegex);
    if (match && match[1]) {
      extractedDates.push(match[1]);
    }
  });
  
  if (extractedDates.length === 0) return "Unknown date";
  
  // Sort dates in descending order and return the most recent
  extractedDates.sort((a, b) => new Date(b) - new Date(a));
  return extractedDates[0];
}

// Get time-based patterns insight
function getTimePatternsInsight(hourlyData, failureAnalysis) {
  if (!hourlyData || hourlyData.length === 0) {
    return "Insufficient hourly data to analyze time-based patterns.";
  }
  
  // Find hour with lowest device count
  const lowestDeviceHour = hourlyData.reduce(
    (min, hour) => hour.devices < min.devices ? hour : min,
    hourlyData[0]
  );
  
  const totalFailures = failureAnalysis.reduce((sum, device) => sum + device.failures, 0);
  
  if (totalFailures > 0 && lowestDeviceHour) {
    return `Most transmission failures occur around ${lowestDeviceHour.hour}, when device activity is lowest.`;
  } else if (hourlyData.length < 24) {
    return `Data is missing for ${24 - hourlyData.length} hours of the day, suggesting periodic connectivity issues.`;
  } else {
    return "No significant time-based failure patterns detected.";
  }
}

// Get device pattern insight
function getDevicePatternInsight(failureAnalysis) {
  if (!failureAnalysis || failureAnalysis.length === 0) {
    return "No device failure pattern data available.";
  }
  
  // Count devices with various failure levels
  const severeIssues = failureAnalysis.filter(d => d.failures > 3).length;
  const moderateIssues = failureAnalysis.filter(d => d.failures > 1 && d.failures <= 3).length;
  const minorIssues = failureAnalysis.filter(d => d.failures === 1).length;
  
  const totalDevices = failureAnalysis.length;
  
  if (severeIssues > totalDevices * 0.2) {
    return `${severeIssues} devices (${Math.round(severeIssues/totalDevices*100)}%) have severe transmission issues with 4+ failures.`;
  } else if (severeIssues + moderateIssues > totalDevices * 0.3) {
    return `${severeIssues + moderateIssues} devices (${Math.round((severeIssues+moderateIssues)/totalDevices*100)}%) have moderate to severe transmission issues.`;
  } else if (minorIssues > 0) {
    return `Most devices are reliable with only ${minorIssues} having a single transmission failure.`;
  } else {
    return "All devices show good transmission reliability with no detected failures.";
  }
}

// Generate recommendations based on data
function generateRecommendations(networkStats, failureAnalysis, hourlyData, dataDrops) {
  const recommendations = [];
  
  // Check for devices with high failure rates
  const highFailureDevices = failureAnalysis.filter(d => d.failures > 3);
  if (highFailureDevices.length > 0) {
    recommendations.push(`Investigate ${highFailureDevices.length} devices with high failure rates, starting with ${highFailureDevices[0].name || highFailureDevices[0].device}.`);
  }
  
  // Check for significant data drops
  if (dataDrops.length > 0) {
    recommendations.push(`Review network conditions on ${dataDrops[0].date} when a ${dataDrops[0].dropPercentage}% data volume drop occurred.`);
  }
  
  // Check data completeness
  if (networkStats.dataCompleteness < 80) {
    recommendations.push(`Improve overall data completeness from ${networkStats.dataCompleteness}% to at least 90% by addressing device reliability issues.`);
  }
  
  // Check hourly patterns
  if (hourlyData && hourlyData.length > 0) {
    const minDeviceHour = hourlyData.reduce((min, h) => h.devices < min.devices ? h : min, hourlyData[0]);
    if (minDeviceHour.devices < hourlyData[0].devices * 0.8) {
      recommendations.push(`Investigate why fewer devices are transmitting data during ${minDeviceHour.hour} hours.`);
    }
  }
  
  // Always recommend maintenance for failing devices
  if (networkStats.failingDevices > 0) {
    recommendations.push(`Schedule maintenance for ${networkStats.failingDevices} devices showing transmission failures.`);
  }
  
  // If we have few recommendations, add a default one
  if (recommendations.length === 0) {
    recommendations.push("Continue regular maintenance schedule to maintain current transmission quality.");
  }
  
  return recommendations;
}

export default DataTransmissionAnalysis;