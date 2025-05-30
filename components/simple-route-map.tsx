"use client"

import type React from "react"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { RoutePoint, CalculatedRoute } from "@/lib/types"

interface SimpleRouteMapProps {
  route: CalculatedRoute
  points: RoutePoint[]
  startPointId?: number
  endPointId?: number
  className?: string
}

export default function SimpleRouteMap({
  route,
  points,
  startPointId,
  endPointId,
  className = ""
}: SimpleRouteMapProps) {
  // Calculate map bounds and dimensions
  const mapData = useMemo(() => {
    const latitudes = points.map(p => p.latitude)
    const longitudes = points.map(p => p.longitude)
    
    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)
    
    // Add padding (5%)
    const latPadding = (maxLat - minLat) * 0.05
    const lngPadding = (maxLng - minLng) * 0.05
    
    const bounds = {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding
    }
    
    const latRange = bounds.maxLat - bounds.minLat
    const lngRange = bounds.maxLng - bounds.minLng
    
    return { bounds, latRange, lngRange }
  }, [points])

  // Convert coordinates to SVG positions
  const getPosition = (point: RoutePoint, width: number, height: number) => {
    const x = ((point.longitude - mapData.bounds.minLng) / mapData.lngRange) * width
    const y = ((mapData.bounds.maxLat - point.latitude) / mapData.latRange) * height
    return { x, y }
  }

  // Generate SVG path for the route
  const routePath = useMemo(() => {
    if (!route.path.length) return ""
    
    const width = 800
    const height = 500
    
    const pathPoints = route.path.map(pointIndex => {
      const point = points[pointIndex]
      return getPosition(point, width, height)
    })
    
    return pathPoints.reduce((path, point, index) => {
      return index === 0 
        ? `M ${point.x} ${point.y}` 
        : `${path} L ${point.x} ${point.y}`
    }, "")
  }, [route.path, points, mapData])

  // Determine point types
  const isStartPoint = (point: RoutePoint) => {
    return startPointId !== undefined ? point.id === startPointId : false
  }

  const isEndPoint = (point: RoutePoint) => {
    return endPointId !== undefined ? point.id === endPointId : false
  }

  const width = 800
  const height = 500

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Mapa da Rota</span>
          <div className="flex gap-2">
            <Badge variant="secondary">
              Distância: {route.totalDistance.toFixed(1)} km
            </Badge>
            <Badge variant="outline">
              {points.length} pontos
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full bg-slate-50 rounded-lg border overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            style={{ aspectRatio: `${width}/${height}` }}
          >
            {/* Background grid */}
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Route path */}
            <path
              d={routePath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />

            {/* Route direction indicators */}
            {route.path.slice(0, -1).map((pointIndex, segmentIndex) => {
              const currentPoint = points[pointIndex]
              const nextPoint = points[route.path[segmentIndex + 1]]
              
              const currentPos = getPosition(currentPoint, width, height)
              const nextPos = getPosition(nextPoint, width, height)
              
              // Calculate midpoint and direction
              const midX = (currentPos.x + nextPos.x) / 2
              const midY = (currentPos.y + nextPos.y) / 2
              const angle = Math.atan2(nextPos.y - currentPos.y, nextPos.x - currentPos.x)
              
              return (
                <g key={`arrow-${segmentIndex}`}>
                  <polygon
                    points={`${midX + 8},${midY} ${midX - 4},${midY - 4} ${midX - 4},${midY + 4}`}
                    fill="#1e40af"
                    transform={`rotate(${(angle * 180) / Math.PI} ${midX} ${midY})`}
                  />
                </g>
              )
            })}

            {/* Points */}
            {points.map((point, index) => {
              const pos = getPosition(point, width, height)
              const isStart = isStartPoint(point)
              const isEnd = isEndPoint(point)
              const isInRoute = route.path.includes(index)
              
              return (
                <g key={point.id}>
                  {/* Point circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isStart || isEnd ? 12 : 8}
                    fill={
                      isStart 
                        ? "#22c55e" 
                        : isEnd 
                        ? "#ef4444" 
                        : isInRoute 
                        ? "#3b82f6" 
                        : "#64748b"
                    }
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="drop-shadow-sm"
                  />
                  
                  {/* Point ID */}
                  <text
                    x={pos.x}
                    y={pos.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white text-xs font-bold"
                  >
                    {point.id}
                  </text>
                  
                  {/* Start/End indicators */}
                  {(isStart || isEnd) && (
                    <text
                      x={pos.x + 18}
                      y={pos.y - 18}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-700 text-xs font-bold"
                    >
                      {isStart ? "INÍCIO" : "FIM"}
                    </text>
                  )}
                  
                  {/* Point description */}
                  <text
                    x={pos.x}
                    y={pos.y + 25}
                    textAnchor="middle"
                    className="fill-slate-700 text-xs font-medium"
                  >
                    {point.description.length > 15 
                      ? `${point.description.substring(0, 15)}...` 
                      : point.description
                    }
                  </text>
                </g>
              )
            })}

            {/* Distance labels on segments */}
            {route.segments.map((segment, index) => {
              const currentPoint = points[route.path[index]]
              const nextPoint = points[route.path[index + 1]]
              
              const currentPos = getPosition(currentPoint, width, height)
              const nextPos = getPosition(nextPoint, width, height)
              
              const midX = (currentPos.x + nextPos.x) / 2
              const midY = (currentPos.y + nextPos.y) / 2
              
              return (
                <g key={`distance-${index}`}>
                  <rect
                    x={midX - 25}
                    y={midY - 8}
                    width="50"
                    height="16"
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    rx="8"
                  />
                  <text
                    x={midX}
                    y={midY + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-600 text-xs font-medium"
                  >
                    {segment.distance.toFixed(1)}km
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        
        {/* Route summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="font-semibold text-slate-900">Total</div>
            <div className="text-blue-600">{route.totalDistance.toFixed(1)} km</div>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="font-semibold text-slate-900">Pontos</div>
            <div className="text-blue-600">{points.length}</div>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="font-semibold text-slate-900">Segmentos</div>
            <div className="text-blue-600">{route.segments.length}</div>
          </div>          <div className="text-center p-2 bg-slate-50 rounded">
            <div className="font-semibold text-slate-900">Algoritmo</div>
            <div className="text-blue-600 capitalize">
              {route.optimizationMethod || 'Otimizado'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
