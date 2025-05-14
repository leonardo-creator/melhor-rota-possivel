"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import RouteDisplay from "@/components/route-display"
import EnhancedRouteMap from "@/components/enhanced-route-map"
import { parseRouteData } from "@/lib/route-utils"
import { nearestNeighborAlgorithm, twoOptAlgorithm, geneticAlgorithm, calculateBestRoute } from "@/lib/route-algorithms"
import { exportToEnhancedXLSX } from "@/lib/enhanced-export-utils"
import type { RoutePoint, CalculatedRoute } from "@/lib/types"
import { Download, BarChart3, Map } from "lucide-react"

export default function MultiRouteOptimizer() {
  const [routeData, setRouteData] = useState("")
  const [points, setPoints] = useState<RoutePoint[]>([])
  const [error, setError] = useState("")
  const [calculatedRoutes, setCalculatedRoutes] = useState<{
    nearestNeighbor: CalculatedRoute | null
    twoOpt: CalculatedRoute | null
    genetic: CalculatedRoute | null
    best: CalculatedRoute | null
  }>({
    nearestNeighbor: null,
    twoOpt: null,
    genetic: null,
    best: null,
  })
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("best")
  const [startPointId, setStartPointId] = useState<string>("auto")
  const [endPointId, setEndPointId] = useState<string>("auto")
  const [activeTab, setActiveTab] = useState<string>("map")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      // Parse the route data
      const routePoints = parseRouteData(routeData)

      if (routePoints.length < 2) {
        setError("Please enter at least two route points to calculate a route")
        return
      }

      setPoints(routePoints)

      // Calculate routes with different algorithms
      const startIndex =
        startPointId && startPointId !== "auto"
          ? routePoints.findIndex((p) => p.id.toString() === startPointId)
          : undefined
      const endIndex =
        endPointId && endPointId !== "auto" ? routePoints.findIndex((p) => p.id.toString() === endPointId) : undefined

      if (startPointId && startPointId !== "auto" && startIndex === -1) {
        setError(`Start point with ID ${startPointId} not found`)
        return
      }

      if (endPointId && endPointId !== "auto" && endIndex === -1) {
        setError(`End point with ID ${endPointId} not found`)
        return
      }

      // Calculate routes with different algorithms
      const nnRoute = nearestNeighborAlgorithm(routePoints, startIndex, endIndex)
      const twoOptRoute = twoOptAlgorithm(routePoints, startIndex, endIndex)
      const geneticRoute = geneticAlgorithm(routePoints, startIndex, endIndex)
      const bestRoute = calculateBestRoute(routePoints, startIndex, endIndex)

      setCalculatedRoutes({
        nearestNeighbor: nnRoute,
        twoOpt: twoOptRoute,
        genetic: geneticRoute,
        best: bestRoute,
      })

      // If no start/end points were specified, set them based on the best route
      if (startPointId === "auto" && bestRoute.path.length > 0) {
        setStartPointId(routePoints[bestRoute.path[0]].id.toString())
      }

      if (endPointId === "auto" && bestRoute.path.length > 0) {
        setEndPointId(routePoints[bestRoute.path[bestRoute.path.length - 1]].id.toString())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid route data format")
    }
  }

  const handleAddExample = () => {
    setRouteData(
      "1 Office -11.684651 -49.85554651\n2 Warehouse -11.4651 -49.854651\n3 Store -11.11684651 -49.6854651\n4 Customer -11.852684651 -49.664651\n5 Supplier -11.55684651 -49.75554651\n6 Distribution -11.35684651 -49.55554651",
    )
  }

  const handleExportData = () => {
    const selectedRoute = getSelectedRoute()
    if (!selectedRoute || !points.length) return
    exportToEnhancedXLSX(selectedRoute, points)
  }

  const getSelectedRoute = (): CalculatedRoute | null => {
    switch (selectedAlgorithm) {
      case "nearestNeighbor":
        return calculatedRoutes.nearestNeighbor
      case "twoOpt":
        return calculatedRoutes.twoOpt
      case "genetic":
        return calculatedRoutes.genetic
      case "best":
      default:
        return calculatedRoutes.best
    }
  }

  const selectedRoute = getSelectedRoute()

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a0063] border-[#d4d4d8]">
        <CardHeader>
          <CardTitle className="text-[#42eedc]">Advanced Route Optimizer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="routeData" className="block mb-2 text-[#f1f5f9]">
                Route Data (one point per line, format: id description latitude longitude)
              </label>
              <Textarea
                id="routeData"
                value={routeData}
                onChange={(e) => setRouteData(e.target.value)}
                placeholder="1 Office -11.684651 -49.85554651&#10;2 Warehouse -11.4651 -49.854651"
                className="bg-[#110043] border-[#d4d4d8] text-[#f1f5f9] min-h-[150px] font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startPoint" className="text-[#f1f5f9]">
                  Start Point (optional)
                </Label>
                <Select value={startPointId} onValueChange={setStartPointId}>
                  <SelectTrigger id="startPoint" className="bg-[#110043] border-[#d4d4d8] text-[#f1f5f9]">
                    <SelectValue placeholder="Select start point" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0063] border-[#d4d4d8] text-[#f1f5f9]">
                    <SelectItem value="auto" className="text-[#f1f5f9] focus:bg-[#3700ff] focus:text-[#f1f5f9]">
                      Auto (algorithm decides)
                    </SelectItem>
                    {points.map((point) => (
                      <SelectItem
                        key={`start-${point.id}`}
                        value={point.id.toString()}
                        className="text-[#f1f5f9] focus:bg-[#3700ff] focus:text-[#f1f5f9]"
                      >
                        {point.id}: {point.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="endPoint" className="text-[#f1f5f9]">
                  End Point (optional)
                </Label>
                <Select value={endPointId} onValueChange={setEndPointId}>
                  <SelectTrigger id="endPoint" className="bg-[#110043] border-[#d4d4d8] text-[#f1f5f9]">
                    <SelectValue placeholder="Select end point" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0063] border-[#d4d4d8] text-[#f1f5f9]">
                    <SelectItem value="auto" className="text-[#f1f5f9] focus:bg-[#3700ff] focus:text-[#f1f5f9]">
                      Auto (algorithm decides)
                    </SelectItem>
                    {points.map((point) => (
                      <SelectItem
                        key={`end-${point.id}`}
                        value={point.id.toString()}
                        className="text-[#f1f5f9] focus:bg-[#3700ff] focus:text-[#f1f5f9]"
                      >
                        {point.id}: {point.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-[#110043] p-4 rounded-md">
              <Label className="text-[#f1f5f9] mb-2 block">Optimization Algorithm</Label>
              <RadioGroup
                value={selectedAlgorithm}
                onValueChange={setSelectedAlgorithm}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="best" id="best" className="text-[#a2ff00]" />
                  <Label htmlFor="best" className="text-[#f1f5f9]">
                    Best Result
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nearestNeighbor" id="nearestNeighbor" className="text-[#42eedc]" />
                  <Label htmlFor="nearestNeighbor" className="text-[#f1f5f9]">
                    Nearest Neighbor
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="twoOpt" id="twoOpt" className="text-[#42eedc]" />
                  <Label htmlFor="twoOpt" className="text-[#f1f5f9]">
                    2-Opt
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="genetic" id="genetic" className="text-[#42eedc]" />
                  <Label htmlFor="genetic" className="text-[#f1f5f9]">
                    Genetic Algorithm
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="bg-[#3700ff] hover:bg-[#3700ff]/90 text-[#f1f5f9]">
                Calculate Optimal Routes
              </Button>
              <Button
                type="button"
                onClick={handleAddExample}
                variant="outline"
                className="border-[#3700ff] text-[#42eedc]"
              >
                Load Example Data
              </Button>

              {selectedRoute && points.length > 0 && (
                <Button
                  type="button"
                  onClick={handleExportData}
                  variant="outline"
                  className="border-[#a2ff00] text-[#a2ff00] hover:bg-[#a2ff00]/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Route
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert className="bg-[#ff3f19]/10 border-[#ff3f19] text-[#ff3f19]">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedRoute && points.length > 0 && (
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-[#110043] border-[#d4d4d8] grid w-full grid-cols-2">
              <TabsTrigger value="map" className="data-[state=active]:bg-[#3700ff] data-[state=active]:text-[#f1f5f9]">
                <Map className="h-4 w-4 mr-2" />
                Map View
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="data-[state=active]:bg-[#3700ff] data-[state=active]:text-[#f1f5f9]"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Algorithm Comparison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="mt-4">
              <RouteDisplay route={selectedRoute} points={points} />
              <div className="mt-6">
                <EnhancedRouteMap
                  route={selectedRoute}
                  points={points}
                  startPointId={startPointId !== "auto" ? Number.parseInt(startPointId) : undefined}
                  endPointId={endPointId !== "auto" ? Number.parseInt(endPointId) : undefined}
                />
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="mt-4">
              <Card className="bg-[#1a0063] border-[#d4d4d8]">
                <CardHeader>
                  <CardTitle className="text-[#42eedc]">Algorithm Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {calculatedRoutes.nearestNeighbor && (
                        <div
                          className={`bg-[#110043] p-4 rounded-md border-2 ${selectedAlgorithm === "nearestNeighbor" ? "border-[#42eedc]" : "border-[#110043]"}`}
                        >
                          <h3 className="text-[#f1f5f9] font-bold mb-2">Nearest Neighbor</h3>
                          <p className="text-[#d4d4d8] text-sm mb-1">Total Distance:</p>
                          <p className="text-[#42eedc] text-xl font-bold mb-2">
                            {calculatedRoutes.nearestNeighbor.totalDistance.toFixed(2)} km
                          </p>
                          <p className="text-[#d4d4d8] text-sm mb-1">Computation:</p>
                          <p className="text-[#a2ff00] text-sm">Fast</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlgorithm("nearestNeighbor")}
                            className={`mt-2 w-full ${selectedAlgorithm === "nearestNeighbor" ? "bg-[#3700ff] text-[#f1f5f9]" : "border-[#3700ff] text-[#42eedc]"}`}
                          >
                            {selectedAlgorithm === "nearestNeighbor" ? "Selected" : "Select"}
                          </Button>
                        </div>
                      )}

                      {calculatedRoutes.twoOpt && (
                        <div
                          className={`bg-[#110043] p-4 rounded-md border-2 ${selectedAlgorithm === "twoOpt" ? "border-[#42eedc]" : "border-[#110043]"}`}
                        >
                          <h3 className="text-[#f1f5f9] font-bold mb-2">2-Opt Algorithm</h3>
                          <p className="text-[#d4d4d8] text-sm mb-1">Total Distance:</p>
                          <p className="text-[#42eedc] text-xl font-bold mb-2">
                            {calculatedRoutes.twoOpt.totalDistance.toFixed(2)} km
                          </p>
                          <p className="text-[#d4d4d8] text-sm mb-1">Computation:</p>
                          <p className="text-[#a2ff00] text-sm">Medium</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlgorithm("twoOpt")}
                            className={`mt-2 w-full ${selectedAlgorithm === "twoOpt" ? "bg-[#3700ff] text-[#f1f5f9]" : "border-[#3700ff] text-[#42eedc]"}`}
                          >
                            {selectedAlgorithm === "twoOpt" ? "Selected" : "Select"}
                          </Button>
                        </div>
                      )}

                      {calculatedRoutes.genetic && (
                        <div
                          className={`bg-[#110043] p-4 rounded-md border-2 ${selectedAlgorithm === "genetic" ? "border-[#42eedc]" : "border-[#110043]"}`}
                        >
                          <h3 className="text-[#f1f5f9] font-bold mb-2">Genetic Algorithm</h3>
                          <p className="text-[#d4d4d8] text-sm mb-1">Total Distance:</p>
                          <p className="text-[#42eedc] text-xl font-bold mb-2">
                            {calculatedRoutes.genetic.totalDistance.toFixed(2)} km
                          </p>
                          <p className="text-[#d4d4d8] text-sm mb-1">Computation:</p>
                          <p className="text-[#a2ff00] text-sm">Complex</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlgorithm("genetic")}
                            className={`mt-2 w-full ${selectedAlgorithm === "genetic" ? "bg-[#3700ff] text-[#f1f5f9]" : "border-[#3700ff] text-[#42eedc]"}`}
                          >
                            {selectedAlgorithm === "genetic" ? "Selected" : "Select"}
                          </Button>
                        </div>
                      )}

                      {calculatedRoutes.best && (
                        <div
                          className={`bg-[#110043] p-4 rounded-md border-2 ${selectedAlgorithm === "best" ? "border-[#a2ff00]" : "border-[#110043]"}`}
                        >
                          <h3 className="text-[#f1f5f9] font-bold mb-2">Best Result</h3>
                          <p className="text-[#d4d4d8] text-sm mb-1">Total Distance:</p>
                          <p className="text-[#42eedc] text-xl font-bold mb-2">
                            {calculatedRoutes.best.totalDistance.toFixed(2)} km
                          </p>
                          <p className="text-[#d4d4d8] text-sm mb-1">Algorithm:</p>
                          <p className="text-[#a2ff00] text-sm">
                            {calculatedRoutes.best.totalDistance === calculatedRoutes.nearestNeighbor?.totalDistance
                              ? "Nearest Neighbor"
                              : calculatedRoutes.best.totalDistance === calculatedRoutes.twoOpt?.totalDistance
                                ? "2-Opt"
                                : "Genetic"}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlgorithm("best")}
                            className={`mt-2 w-full ${selectedAlgorithm === "best" ? "bg-[#3700ff] text-[#f1f5f9]" : "border-[#3700ff] text-[#42eedc]"}`}
                          >
                            {selectedAlgorithm === "best" ? "Selected" : "Select"}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="bg-[#110043] p-4 rounded-md">
                      <h3 className="text-[#f1f5f9] font-bold mb-4">Distance Comparison</h3>
                      <div className="space-y-4">
                        {calculatedRoutes.nearestNeighbor && (
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-[#f1f5f9]">Nearest Neighbor</span>
                              <span className="text-[#42eedc]">
                                {calculatedRoutes.nearestNeighbor.totalDistance.toFixed(2)} km
                              </span>
                            </div>
                            <div className="w-full bg-[#1a0063] rounded-full h-2.5">
                              <div
                                className="bg-[#42eedc] h-2.5 rounded-full"
                                style={{
                                  width: `${
                                    (calculatedRoutes.nearestNeighbor.totalDistance /
                                      Math.max(
                                        calculatedRoutes.nearestNeighbor.totalDistance,
                                        calculatedRoutes.twoOpt?.totalDistance || 0,
                                        calculatedRoutes.genetic?.totalDistance || 0,
                                      )) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {calculatedRoutes.twoOpt && (
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-[#f1f5f9]">2-Opt Algorithm</span>
                              <span className="text-[#42eedc]">
                                {calculatedRoutes.twoOpt.totalDistance.toFixed(2)} km
                              </span>
                            </div>
                            <div className="w-full bg-[#1a0063] rounded-full h-2.5">
                              <div
                                className="bg-[#42eedc] h-2.5 rounded-full"
                                style={{
                                  width: `${
                                    (calculatedRoutes.twoOpt.totalDistance /
                                      Math.max(
                                        calculatedRoutes.nearestNeighbor?.totalDistance || 0,
                                        calculatedRoutes.twoOpt.totalDistance,
                                        calculatedRoutes.genetic?.totalDistance || 0,
                                      )) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {calculatedRoutes.genetic && (
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-[#f1f5f9]">Genetic Algorithm</span>
                              <span className="text-[#42eedc]">
                                {calculatedRoutes.genetic.totalDistance.toFixed(2)} km
                              </span>
                            </div>
                            <div className="w-full bg-[#1a0063] rounded-full h-2.5">
                              <div
                                className="bg-[#42eedc] h-2.5 rounded-full"
                                style={{
                                  width: `${
                                    (calculatedRoutes.genetic.totalDistance /
                                      Math.max(
                                        calculatedRoutes.nearestNeighbor?.totalDistance || 0,
                                        calculatedRoutes.twoOpt?.totalDistance || 0,
                                        calculatedRoutes.genetic.totalDistance,
                                      )) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#110043] p-4 rounded-md">
                      <h3 className="text-[#f1f5f9] font-bold mb-2">Algorithm Information</h3>
                      <div className="space-y-2 text-sm text-[#d4d4d8]">
                        <p>
                          <span className="text-[#42eedc] font-bold">Nearest Neighbor:</span> A greedy algorithm that
                          always selects the closest unvisited point. Fast but may not find the optimal solution.
                        </p>
                        <p>
                          <span className="text-[#42eedc] font-bold">2-Opt:</span> Improves an initial route by swapping
                          edges to reduce total distance. Better results than Nearest Neighbor with moderate computation
                          time.
                        </p>
                        <p>
                          <span className="text-[#42eedc] font-bold">Genetic Algorithm:</span> Uses evolutionary
                          principles to find optimal routes. Can find better solutions for complex routes but requires
                          more computation.
                        </p>
                        <p>
                          <span className="text-[#a2ff00] font-bold">Best Result:</span> Automatically selects the route
                          with the shortest total distance from all calculated algorithms.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
