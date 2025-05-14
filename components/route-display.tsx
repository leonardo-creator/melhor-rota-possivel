import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { RoutePoint, CalculatedRoute } from "@/lib/types"

interface RouteDisplayProps {
  route: CalculatedRoute
  points: RoutePoint[]
}

export default function RouteDisplay({ route, points }: RouteDisplayProps) {
  // Calculate total time (assuming 60 km/h average speed)
  const totalTimeHours = route.totalDistance / 60
  const hours = Math.floor(totalTimeHours)
  const minutes = Math.round((totalTimeHours - hours) * 60)

  return (
    <Card className="bg-[#1a0063] border-[#d4d4d8]">
      <CardHeader>
        <CardTitle className="text-[#42eedc]">Optimal Route</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-[#110043] p-4 rounded-md">
              <p className="text-sm text-[#d4d4d8]">Total Distance</p>
              <p className="text-2xl font-bold text-[#a2ff00]">{route.totalDistance.toFixed(2)} km</p>
            </div>
            <div className="bg-[#110043] p-4 rounded-md">
              <p className="text-sm text-[#d4d4d8]">Estimated Time</p>
              <p className="text-2xl font-bold text-[#42eedc]">
                {hours > 0 ? `${hours}h ` : ""}
                {minutes}m
              </p>
            </div>
            <div className="bg-[#110043] p-4 rounded-md">
              <p className="text-sm text-[#d4d4d8]">Route Points</p>
              <p className="text-2xl font-bold text-[#f1f5f9]">{points.length}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 text-[#f1f5f9]">Route Sequence</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {route.path.map((pointIndex, i) => (
                <div key={i} className="flex items-center">
                  <Badge
                    className={`
                      ${
                        i === 0
                          ? "bg-[#a2ff00] text-[#110043]"
                          : i === route.path.length - 1
                            ? "bg-[#ff3f19]"
                            : "bg-[#3700ff]"
                      } mr-1
                    `}
                  >
                    {points[pointIndex].id}
                  </Badge>
                  <span className="text-[#f1f5f9]">{points[pointIndex].description}</span>
                  {i < route.path.length - 1 && <span className="mx-2 text-[#d4d4d8]">→</span>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 text-[#f1f5f9]">Route Details</h3>
            <Table>
              <TableHeader>
                <TableRow className="border-[#d4d4d8]">
                  <TableHead className="text-[#42eedc]">Segment</TableHead>
                  <TableHead className="text-[#42eedc]">From</TableHead>
                  <TableHead className="text-[#42eedc]">To</TableHead>
                  <TableHead className="text-[#42eedc] text-right">Distance (km)</TableHead>
                  <TableHead className="text-[#42eedc] text-right">Est. Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {route.segments.map((segment, index) => {
                  const fromPoint = points[segment.fromIndex]
                  const toPoint = points[segment.toIndex]
                  const timeMinutes = Math.round((segment.distance / 60) * 60)

                  return (
                    <TableRow key={index} className="border-[#d4d4d8]">
                      <TableCell className="font-medium text-[#f1f5f9]">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge className={`${index === 0 ? "bg-[#a2ff00] text-[#110043]" : "bg-[#3700ff]"} mr-2`}>
                            {fromPoint.id}
                          </Badge>
                          <span className="text-[#f1f5f9]">{fromPoint.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge
                            className={`${index === route.segments.length - 1 ? "bg-[#ff3f19]" : "bg-[#3700ff]"} mr-2`}
                          >
                            {toPoint.id}
                          </Badge>
                          <span className="text-[#f1f5f9]">{toPoint.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-[#f1f5f9]">{segment.distance.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-[#f1f5f9]">{timeMinutes} min</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
