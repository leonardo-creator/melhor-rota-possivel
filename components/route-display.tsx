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
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-primary">Optimal Route</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-accent p-4 rounded-md">
              <p className="text-sm text-muted-foreground">Total Distance</p>
              <p className="text-2xl font-bold text-success">{route.totalDistance.toFixed(2)} km</p>
            </div>
            <div className="bg-accent p-4 rounded-md">
              <p className="text-sm text-muted-foreground">Estimated Time</p>
              <p className="text-2xl font-bold text-primary">
                {hours > 0 ? `${hours}h ` : ""}
                {minutes}m
              </p>
            </div>
            <div className="bg-accent p-4 rounded-md">
              <p className="text-sm text-muted-foreground">Route Points</p>
              <p className="text-2xl font-bold text-foreground">{points.length}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 text-foreground">Route Sequence</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {route.path.map((pointIndex, i) => (
                <div key={i} className="flex items-center">
                  <Badge
                    className={`
                      ${
                        i === 0
                          ? "bg-success text-success-foreground"
                          : i === route.path.length - 1
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-primary text-primary-foreground"
                      } mr-1
                    `}
                  >
                    {points[pointIndex].id}
                  </Badge>
                  <span className="text-foreground">{points[pointIndex].description}</span>
                  {i < route.path.length - 1 && <span className="mx-2 text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3 text-foreground">Route Details</h3>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-primary">Segment</TableHead>
                  <TableHead className="text-primary">From</TableHead>
                  <TableHead className="text-primary">To</TableHead>
                  <TableHead className="text-primary text-right">Distance (km)</TableHead>
                  <TableHead className="text-primary text-right">Est. Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {route.segments.map((segment, index) => {
                  const fromPoint = points[segment.fromIndex]
                  const toPoint = points[segment.toIndex]
                  const timeMinutes = Math.round((segment.distance / 60) * 60)

                  return (
                    <TableRow key={index} className="border-border">
                      <TableCell className="font-medium text-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge className={`${index === 0 ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"} mr-2`}>
                            {fromPoint.id}
                          </Badge>
                          <span className="text-foreground">{fromPoint.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge
                            className={`${index === route.segments.length - 1 ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"} mr-2`}
                          >
                            {toPoint.id}
                          </Badge>
                          <span className="text-foreground">{toPoint.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-foreground">{segment.distance.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-foreground">{timeMinutes} min</TableCell>
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
