"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import RouteDisplay from "@/components/route-display"
import RouteMap from "@/components/route-map"
import { parseRouteString, calculateRoute } from "@/lib/route-utils"
import type { RoutePoint, CalculatedRoute } from "@/lib/types"

export default function RouteCalculator() {
  const [routeString, setRouteString] = useState("")
  const [routes, setRoutes] = useState<RoutePoint[]>([])
  const [error, setError] = useState("")
  const [calculatedRoute, setCalculatedRoute] = useState<CalculatedRoute | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      // Parse multiple route points
      const routePoints = routeString
        .split(" ")
        .filter((str) => str.trim() !== "")
        .map((str) => parseRouteString(str))

      if (routePoints.length < 2) {
        setError("Please enter at least two route points to calculate a route")
        return
      }

      setRoutes(routePoints)

      // Calculate the optimal route
      const result = calculateRoute(routePoints)
      setCalculatedRoute(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid route format")
    }
  }

  const handleAddExample = () => {
    setRouteString(
      "1/house1/-11.65464654/-49.654165415 2/store/-11.65864123/-49.65123456 3/park/-11.66123456/-49.64987654",
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a0063] border-[#d4d4d8]">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="routeString" className="block mb-2">
                Route String (format: /id/description/latitude/longitude)
              </label>
              <div className="flex gap-2">
                <Input
                  id="routeString"
                  value={routeString}
                  onChange={(e) => setRouteString(e.target.value)}
                  placeholder="1/house1/-11.65464654/-49.654165415 2/store/-11.65864123/-49.65123456"
                  className="bg-[#110043] border-[#d4d4d8] text-[#f1f5f9]"
                />
                <Button
                  type="button"
                  onClick={handleAddExample}
                  variant="outline"
                  className="border-[#3700ff] text-[#42eedc]"
                >
                  Example
                </Button>
              </div>
              <p className="text-sm text-[#d4d4d8] mt-1">Separate multiple points with spaces</p>
            </div>

            <Button type="submit" className="bg-[#3700ff] hover:bg-[#3700ff]/90 text-[#f1f5f9]">
              Calculate Route
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert className="bg-[#ff3f19]/10 border-[#ff3f19] text-[#ff3f19]">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {calculatedRoute && routes.length > 0 && (
        <div className="space-y-6">
          <RouteDisplay route={calculatedRoute} points={routes} />
          <RouteMap route={calculatedRoute} points={routes} />
        </div>
      )}
    </div>
  )
}
