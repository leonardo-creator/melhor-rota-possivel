"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import type { RoutePoint, CalculatedRoute } from "@/lib/types"

interface RouteMapProps {
  route: CalculatedRoute
  points: RoutePoint[]
  startPointId?: number
  endPointId?: number
}

export default function RouteMap({ route, points, startPointId, endPointId }: RouteMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 500 })
  const [isInitialized, setIsInitialized] = useState(false)

  // Calculate map bounds once
  const boundsRef = useRef({
    minLat: Math.min(...points.map((p) => p.latitude)),
    maxLat: Math.max(...points.map((p) => p.latitude)),
    minLng: Math.min(...points.map((p) => p.longitude)),
    maxLng: Math.max(...points.map((p) => p.longitude)),
  })

  // Add padding to bounds (10%)
  const bounds = boundsRef.current
  const latPadding = (bounds.maxLat - bounds.minLat) * 0.1
  const lngPadding = (bounds.maxLng - bounds.minLng) * 0.1
  bounds.minLat -= latPadding
  bounds.maxLat += latPadding
  bounds.minLng -= lngPadding
  bounds.maxLng += lngPadding

  // Initialize canvas size based on container
  useEffect(() => {
    if (!containerRef.current || isInitialized) return

    const updateCanvasSize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      setCanvasSize({ width, height: 500 })
      setIsInitialized(true)
    }

    updateCanvasSize()

    // Add resize listener
    window.addEventListener("resize", updateCanvasSize)

    return () => {
      window.removeEventListener("resize", updateCanvasSize)
    }
  }, [isInitialized])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5))
  }

  const handleReset = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    // Prevent default to avoid text selection during drag
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / (rect.right - rect.left)) * canvas.width
    const y = ((e.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height

    // Check if hovering over a point
    let foundPoint = false
    points.forEach((_, i) => {
      const pointPos = getPointPosition(i)
      const distance = Math.sqrt(Math.pow(x - pointPos.x, 2) + Math.pow(y - pointPos.y, 2))
      if (distance < 15) {
        setHoveredPoint(i)
        foundPoint = true
      }
    })

    if (!foundPoint) {
      setHoveredPoint(null)
    }

    // Check if hovering over a segment
    if (!foundPoint) {
      let foundSegment = false
      route.segments.forEach((segment, i) => {
        const fromPos = getPointPosition(segment.fromIndex)
        const toPos = getPointPosition(segment.toIndex)

        // Calculate distance from point to line segment
        const distance = distToSegment(x, y, fromPos.x, fromPos.y, toPos.x, toPos.y)
        if (distance < 10) {
          setHoveredSegment(i)
          foundSegment = true
        }
      })

      if (!foundSegment) {
        setHoveredSegment(null)
      }
    }

    // Handle dragging
    if (isDragging) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
      setDragStart({ x: e.clientX, y: e.clientY })
      // Prevent default to avoid text selection during drag
      e.preventDefault()
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setHoveredSegment(null)
    setHoveredPoint(null)
  }

  // Helper function to calculate distance from point to line segment
  function distToSegment(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
    const A = x - x1
    const B = y - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const len_sq = C * C + D * D
    let param = -1

    if (len_sq !== 0) param = dot / len_sq

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = x - xx
    const dy = y - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Helper function to get canvas position for a point
  function getPointPosition(index: number) {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const canvas = canvasRef.current
    const padding = 40
    const width = canvas.width - padding * 2
    const height = canvas.height - padding * 2

    const point = points[index]

    // Convert coordinates to canvas position with zoom and offset
    const x = padding + ((point.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width * zoom + offset.x
    // Invert Y axis since canvas 0,0 is top-left
    const y = padding + ((bounds.maxLat - point.latitude) / (bounds.maxLat - bounds.minLat)) * height * zoom + offset.y

    return { x, y }
  }

  // Helper function to determine if a point is a start point
  function isStartPoint(index: number): boolean {
    if (startPointId !== undefined) {
      return points[index].id === startPointId
    }
    return index === route.path[0]
  }

  // Helper function to determine if a point is an end point
  function isEndPoint(index: number): boolean {
    if (endPointId !== undefined) {
      return points[index].id === endPointId
    }
    return index === route.path[route.path.length - 1]
  }

  // Draw the map
  useEffect(() => {
    if (!canvasRef.current || !isInitialized) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions explicitly
    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    // Create background gradient for light theme
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    bgGradient.addColorStop(0, "#F3F4F6") // Light gray at top
    bgGradient.addColorStop(1, "#E5E7EB") // Slightly darker light gray at bottom

    // Clear canvas with gradient background
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw decorative pattern (subtle for light theme)
    ctx.strokeStyle = "rgba(156, 163, 175, 0.1)" // Light gray with low opacity
    ctx.lineWidth = 1

    // Draw hexagonal grid pattern
    const hexSize = 40
    const hexHeight = hexSize * Math.sqrt(3)
    const hexWidth = hexSize * 2
    const hexVerticalOffset = hexHeight * 0.75

    for (let row = -1; row < canvas.height / hexVerticalOffset + 1; row++) {
      for (let col = -1; col < canvas.width / hexWidth + 1; col++) {
        const centerX = col * hexWidth + (row % 2 === 0 ? 0 : hexWidth / 2)
        const centerY = row * hexVerticalOffset

        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i
          const x = centerX + hexSize * Math.cos(angle)
          const y = centerY + hexSize * Math.sin(angle)
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()
        ctx.stroke()
      }
    }

    // Draw glow effect for segments (subtle for light theme)
    route.segments.forEach((segment, i) => {
      const fromPos = getPointPosition(segment.fromIndex)
      const toPos = getPointPosition(segment.toIndex)

      // Draw glow effect
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(fromPos.x, fromPos.y)
      ctx.lineTo(toPos.x, toPos.y)
      ctx.lineWidth = 8
      ctx.strokeStyle = "rgba(59, 130, 246, 0.1)" // Light blue glow
      ctx.stroke()
      ctx.restore()
    })

    // Draw segments with enhanced styling
    route.segments.forEach((segment, i) => {
      const fromPos = getPointPosition(segment.fromIndex)
      const toPos = getPointPosition(segment.toIndex)

      // Create gradient for the line (light theme appropriate)
      const gradient = ctx.createLinearGradient(fromPos.x, fromPos.y, toPos.x, toPos.y)
      gradient.addColorStop(0, "#3B82F6") // Blue
      gradient.addColorStop(0.5, "#06B6D4") // Cyan
      gradient.addColorStop(1, "#10B981") // Green

      // Draw line with gradient
      ctx.beginPath()
      ctx.moveTo(fromPos.x, fromPos.y)
      ctx.lineTo(toPos.x, toPos.y)

      // Highlight hovered segment
      if (hoveredSegment === i) {
        ctx.lineWidth = 6
        ctx.strokeStyle = "#EF4444" // Red for hover

        // Add pulsing effect for hovered segment
        ctx.shadowColor = "#EF4444"
        ctx.shadowBlur = 10
      } else {
        ctx.lineWidth = 4
        ctx.strokeStyle = gradient
      }

      ctx.stroke()
      ctx.shadowBlur = 0 // Reset shadow

      // Draw animated dashes for direction (darker for light theme)
      ctx.beginPath()
      ctx.setLineDash([5, 10])
      ctx.lineDashOffset = -((Date.now() / 100) % 15) // Animate dash
      ctx.moveTo(fromPos.x, fromPos.y)
      ctx.lineTo(toPos.x, toPos.y)
      ctx.lineWidth = 2
      ctx.strokeStyle = "#4B5563" // Dark gray dashes
      ctx.stroke()
      ctx.setLineDash([]) // Reset dash

      // Draw distance label with enhanced styling
      const midX = (fromPos.x + toPos.x) / 2
      const midY = (fromPos.y + toPos.y) / 2
      const dx = toPos.x - fromPos.x
      const dy = toPos.y - fromPos.y
      const angle = Math.atan2(dy, dx)

      ctx.save()
      ctx.translate(midX, midY)
      ctx.rotate(angle)
      ctx.translate(0, -15)

      const distanceText = `${segment.distance.toFixed(1)} km`
      ctx.font = "bold 12px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Draw text background with rounded corners
      const textWidth = ctx.measureText(distanceText).width
      const textHeight = 20
      const cornerRadius = 5

      ctx.beginPath()
      ctx.moveTo(-textWidth / 2 - 5 + cornerRadius, -textHeight / 2)
      ctx.lineTo(textWidth / 2 + 5 - cornerRadius, -textHeight / 2)
      ctx.arcTo(textWidth / 2 + 5, -textHeight / 2, textWidth / 2 + 5, -textHeight / 2 + cornerRadius, cornerRadius)
      ctx.lineTo(textWidth / 2 + 5, textHeight / 2 - cornerRadius)
      ctx.arcTo(textWidth / 2 + 5, textHeight / 2, textWidth / 2 + 5 - cornerRadius, textHeight / 2, cornerRadius)
      ctx.lineTo(-textWidth / 2 - 5 + cornerRadius, textHeight / 2)
      ctx.arcTo(-textWidth / 2 - 5, textHeight / 2, -textWidth / 2 - 5, textHeight / 2 - cornerRadius, cornerRadius)
      ctx.lineTo(-textWidth / 2 - 5, -textHeight / 2 + cornerRadius)
      ctx.arcTo(-textWidth / 2 - 5, -textHeight / 2, -textWidth / 2 - 5 + cornerRadius, -textHeight / 2, cornerRadius)
      ctx.closePath()

      // Create gradient for label background (light theme)
      const labelGradient = ctx.createLinearGradient(-textWidth / 2 - 5, 0, textWidth / 2 + 5, 0)
      labelGradient.addColorStop(0, "rgba(229, 231, 235, 0.9)") // Light gray
      labelGradient.addColorStop(1, "rgba(209, 213, 219, 0.9)") // Slightly darker light gray

      ctx.fillStyle = labelGradient
      ctx.fill()

      // Add subtle border (darker for light theme)
      ctx.strokeStyle = "#9CA3AF" // Medium gray border
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw text with glow effect - FIXED TEXT COLOR FOR READABILITY
      ctx.shadowColor = hoveredSegment === i ? "#EF4444" : "#06B6D4" // Red or Cyan glow
      ctx.shadowBlur = 5
      ctx.fillStyle = "#1F2937" // Dark text for readability on light background
      ctx.fillText(distanceText, 0, 0)
      ctx.shadowBlur = 0

      ctx.restore()
    })

    // Draw points with enhanced styling
    points.forEach((point, i) => {
      const pos = getPointPosition(i)
      const isStart = isStartPoint(i)
      const isEnd = isEndPoint(i)
      const isHovered = hoveredPoint === i

      // Draw outer glow (subtle for light theme)
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2)

      // Different glow colors based on point type
      if (isHovered) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.2)" // Red glow for hover
      } else if (isStart) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.2)" // Green glow for start
      } else if (isEnd) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.2)" // Red glow for end
      } else {
        ctx.fillStyle = "rgba(6, 182, 212, 0.2)" // Cyan glow for regular points
      }
      ctx.fill()

      // Draw point shadow (lighter for light theme)
      ctx.beginPath()
      ctx.arc(pos.x, pos.y + 2, 12, 0, Math.PI * 2) // Reduced offset for shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)" // Lighter shadow
      ctx.fill()

      // Draw main circle with gradient
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2)

      // Create radial gradient for point (light theme appropriate)
      const pointGradient = ctx.createRadialGradient(pos.x - 3, pos.y - 3, 0, pos.x, pos.y, 12)

      // Determine point colors
      if (isHovered) {
        pointGradient.addColorStop(0, "#F87171") // Lighter red
        pointGradient.addColorStop(1, "#EF4444") // Darker red
      } else if (isStart) {
        pointGradient.addColorStop(0, "#34D399") // Lighter green
        pointGradient.addColorStop(1, "#10B981") // Darker green
      } else if (isEnd) {
        pointGradient.addColorStop(0, "#F87171") // Lighter red
        pointGradient.addColorStop(1, "#EF4444") // Darker red
      } else {
        pointGradient.addColorStop(0, "#22D3EE") // Lighter cyan
        pointGradient.addColorStop(1, "#06B6D4") // Darker cyan
      }

      ctx.fillStyle = pointGradient
      ctx.fill()

      // Draw point border with glow (darker border for light theme)
      ctx.lineWidth = 2
      ctx.strokeStyle = "#1F2937" // Dark border
      ctx.shadowColor = isHovered ? "#EF4444" : isStart ? "#10B981" : isEnd ? "#EF4444" : "#06B6D4"
      ctx.shadowBlur = 5
      ctx.stroke()
      ctx.shadowBlur = 0 // Reset shadow

      // Draw point ID - FIXED TEXT COLOR FOR READABILITY
      ctx.fillStyle = "#FFFFFF" // White text on dark point
      ctx.font = "bold 12px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(point.id.toString(), pos.x, pos.y)

      // Add clearer indicators for start/end points
      if (isStart || isEnd) {
        const indicatorX = pos.x + 18
        const indicatorY = pos.y - 18

        ctx.beginPath()
        ctx.arc(indicatorX, indicatorY, 10, 0, Math.PI * 2)
        ctx.fillStyle = isStart ? "#10B981" : "#EF4444" // Green or Red
        ctx.fill()
        ctx.strokeStyle = "#1F2937" // Dark border
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = "#FFFFFF" // White text for readability
        ctx.font = "bold 10px Arial"
        ctx.fillText(isStart ? "S" : "E", indicatorX, indicatorY)
      }

      // Draw point description with enhanced styling (light theme)
      const description = point.description
      ctx.font = "12px Arial"
      const textWidth = ctx.measureText(description).width
      const textHeight = 20
      const cornerRadius = 5

      // Draw rounded rectangle for description (light theme)
      ctx.beginPath()
      ctx.moveTo(pos.x - textWidth / 2 - 5 + cornerRadius, pos.y + 20)
      ctx.lineTo(pos.x + textWidth / 2 + 5 - cornerRadius, pos.y + 20)
      ctx.arcTo(
        pos.x + textWidth / 2 + 5,
        pos.y + 20,
        pos.x + textWidth / 2 + 5,
        pos.y + 20 + cornerRadius,
        cornerRadius,
      )
      ctx.lineTo(pos.x + textWidth / 2 + 5, pos.y + 20 + textHeight - cornerRadius)
      ctx.arcTo(
        pos.x + textWidth / 2 + 5,
        pos.y + 20 + textHeight,
        pos.x + textWidth / 2 + 5 - cornerRadius,
        pos.y + 20 + textHeight,
        cornerRadius,
      )
      ctx.lineTo(pos.x - textWidth / 2 - 5 + cornerRadius, pos.y + 20 + textHeight)
      ctx.arcTo(
        pos.x - textWidth / 2 - 5,
        pos.y + 20 + textHeight,
        pos.x - textWidth / 2 - 5,
        pos.y + 20 + textHeight - cornerRadius,
        cornerRadius,
      )
      ctx.lineTo(pos.x - textWidth / 2 - 5, pos.y + 20 + cornerRadius)
      ctx.arcTo(
        pos.x - textWidth / 2 - 5,
        pos.y + 20,
        pos.x - textWidth / 2 - 5 + cornerRadius,
        pos.y + 20,
        cornerRadius,
      )
      ctx.closePath()

      // Create gradient for description background (light theme)
      const descriptionGradient = ctx.createLinearGradient(
        pos.x - textWidth / 2 - 5,
        pos.y + 20,
        pos.x + textWidth / 2 + 5,
        pos.y + 20 + textHeight,
      )
      descriptionGradient.addColorStop(0, "rgba(243, 244, 246, 0.9)") // Light gray
      descriptionGradient.addColorStop(1, "rgba(229, 231, 235, 0.9)") // Slightly darker light gray

      ctx.fillStyle = descriptionGradient
      ctx.fill()

      // Add subtle border (darker for light theme)
      ctx.strokeStyle = "#9CA3AF" // Medium gray border
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw description text (dark text for light theme)
      ctx.fillStyle = "#1F2937" // Dark text
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(description, pos.x, pos.y + 20 + textHeight / 2)
    })

    // Draw compass with enhanced styling (light theme)
    const compassX = canvas.width - 50
    const compassY = 50
    const compassRadius = 30

    // Draw compass background
    ctx.beginPath()
    ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(229, 231, 235, 0.8)" // Light gray background
    ctx.fill()
    ctx.strokeStyle = "#9CA3AF" // Medium gray border
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw compass markings (N, E, S, W)
    ctx.font = "bold 12px Arial"
    ctx.fillStyle = "#1F2937" // Dark text
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("N", compassX, compassY - compassRadius * 0.7)
    ctx.fillText("E", compassX + compassRadius * 0.7, compassY)
    ctx.fillText("S", compassX, compassY + compassRadius * 0.7)
    ctx.fillText("W", compassX - compassRadius * 0.7, compassY)

    // Draw compass needle with gradient (darker for light theme)
    ctx.beginPath()
    ctx.moveTo(compassX, compassY - compassRadius * 0.6)
    ctx.lineTo(compassX - compassRadius * 0.15, compassY)
    ctx.lineTo(compassX, compassY + compassRadius * 0.15)
    ctx.lineTo(compassX + compassRadius * 0.15, compassY)
    ctx.closePath()

    // Create gradient for north-pointing needle
    const needleGradient = ctx.createLinearGradient(
      compassX,
      compassY - compassRadius * 0.6,
      compassX,
      compassY + compassRadius * 0.15,
    )
    needleGradient.addColorStop(0, "#4B5563") // Dark gray for North
    needleGradient.addColorStop(0.5, "#6B7280") // Medium gray
    needleGradient.addColorStop(1, "#9CA3AF") // Lighter gray

    ctx.fillStyle = needleGradient
    ctx.fill()

    // Add needle border
    ctx.strokeStyle = "#1F2937" // Dark border
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw enhanced scale bar (light theme)
    const scaleBarLength = 100
    const scaleBarX = 20
    const scaleBarY = canvas.height - 20
    const scaleBarHeight = 6

    // Calculate scale based on the distance represented by the scale bar
    const scalePoint1 = {
      latitude: bounds.minLat,
      longitude: bounds.minLng,
    }

    const scalePoint2 = {
      latitude: bounds.minLat,
      longitude: bounds.minLng + ((bounds.maxLng - bounds.minLng) * (scaleBarLength / canvas.width)) / zoom,
    }

    const scaleDistance = calculateDistance(
      scalePoint1.latitude,
      scalePoint1.longitude,
      scalePoint2.latitude,
      scalePoint2.longitude,
    )

    // Round to a nice number
    const roundedDistance = Math.round(scaleDistance * 10) / 10

    // Draw scale bar background with gradient (light theme)
    ctx.beginPath()
    ctx.rect(scaleBarX, scaleBarY - scaleBarHeight / 2, scaleBarLength, scaleBarHeight)

    // Create gradient for scale bar
    const scaleGradient = ctx.createLinearGradient(scaleBarX, scaleBarY, scaleBarX + scaleBarLength, scaleBarY)
    scaleGradient.addColorStop(0, "#D1D5DB") // Light gray
    scaleGradient.addColorStop(0.5, "#E5E7EB") // Lighter gray
    scaleGradient.addColorStop(1, "#9CA3AF") // Medium gray

    ctx.fillStyle = scaleGradient
    ctx.fill()

    // Add subtle glow (darker for light theme)
    ctx.shadowColor = "#9CA3AF" // Medium gray glow
    ctx.shadowBlur = 5
    ctx.strokeStyle = "#1F2937" // Dark border
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.shadowBlur = 0

    // Draw ticks with enhanced styling (darker for light theme)
    ctx.beginPath()
    ctx.moveTo(scaleBarX, scaleBarY - 10)
    ctx.lineTo(scaleBarX, scaleBarY + 10)
    ctx.moveTo(scaleBarX + scaleBarLength / 2, scaleBarY - 5)
    ctx.lineTo(scaleBarX + scaleBarLength / 2, scaleBarY + 5)
    ctx.moveTo(scaleBarX + scaleBarLength, scaleBarY - 10)
    ctx.lineTo(scaleBarX + scaleBarLength, scaleBarY + 10)
    ctx.strokeStyle = "#1F2937" // Dark ticks
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw scale text with enhanced styling (dark text for light theme)
    ctx.font = "bold 12px Arial"
    ctx.textAlign = "center"
    ctx.shadowColor = "#9CA3AF" // Medium gray shadow
    ctx.shadowBlur = 3
    ctx.fillStyle = "#1F2937" // Dark text
    ctx.fillText(`${roundedDistance.toFixed(1)} km`, scaleBarX + scaleBarLength / 2, scaleBarY - 15)
    ctx.shadowBlur = 0

    // Draw subdivisions (dark text for light theme)
    ctx.font = "10px Arial"
    ctx.fillStyle = "#1F2937" // Dark text
    ctx.fillText("0", scaleBarX, scaleBarY + 15)
    ctx.fillText(`${(roundedDistance / 2).toFixed(1)}`, scaleBarX + scaleBarLength / 2, scaleBarY + 15)
    ctx.fillText(`${roundedDistance.toFixed(1)}`, scaleBarX + scaleBarLength, scaleBarY + 15)

    // Draw legend for start and end points (light theme)
    const legendX = 20
    const legendY = 30
    const legendSpacing = 25
    const legendRadius = 8

    // Start point legend
    ctx.beginPath()
    ctx.arc(legendX, legendY, legendRadius, 0, Math.PI * 2)
    const startGradient = ctx.createRadialGradient(legendX - 2, legendY - 2, 0, legendX, legendY, legendRadius)
    startGradient.addColorStop(0, "#6EE7B7") // Light green
    startGradient.addColorStop(1, "#34D399") // Darker green
    ctx.fillStyle = startGradient
    ctx.fill()
    ctx.strokeStyle = "#1F2937" // Dark border
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = "#1F2937" // Dark text
    ctx.textAlign = "left"
    ctx.font = "12px Arial"
    ctx.fillText("Start Point", legendX + legendRadius + 5, legendY + 4)

    // End point legend
    ctx.beginPath()
    ctx.arc(legendX, legendY + legendSpacing, legendRadius, 0, Math.PI * 2)
    const endGradient = ctx.createRadialGradient(
      legendX - 2,
      legendY + legendSpacing - 2,
      0,
      legendX,
      legendY + legendSpacing,
      legendRadius,
    )
    endGradient.addColorStop(0, "#FCA5A5") // Light red
    endGradient.addColorStop(1, "#F87171") // Darker red
    ctx.fillStyle = endGradient
    ctx.fill()
    ctx.strokeStyle = "#1F2937" // Dark border
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = "#1F2937" // Dark text
    ctx.fillText("End Point", legendX + legendRadius + 5, legendY + legendSpacing + 4)

    // Waypoint legend
    ctx.beginPath()
    ctx.arc(legendX, legendY + legendSpacing * 2, legendRadius, 0, Math.PI * 2)
    const waypointGradient = ctx.createRadialGradient(
      legendX - 2,
      legendY + legendSpacing * 2 - 2,
      0,
      legendX,
      legendY + legendSpacing * 2,
      legendRadius,
    )
    waypointGradient.addColorStop(0, "#93C5FD") // Light blue
    waypointGradient.addColorStop(1, "#60A5FA") // Darker blue
    ctx.fillStyle = waypointGradient
    ctx.fill()
    ctx.strokeStyle = "#1F2937" // Dark border
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = "#1F2937" // Dark text
    ctx.fillText("Waypoint", legendX + legendRadius + 5, legendY + legendSpacing * 2 + 4)
  }, [route, points, zoom, offset, hoveredSegment, hoveredPoint, startPointId, endPointId, canvasSize, isInitialized])

  // Helper function to calculate distance between points
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-primary text-xl">Visualized Route Map</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 border-primary text-primary hover:bg-accent"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 border-primary text-primary hover:bg-accent"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8 border-primary text-primary hover:bg-accent"
            title="Reset View"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="map-container bg-background p-3 rounded-md shadow-lg"
          style={{ minHeight: "500px" }} // Ensure this matches canvas height or is responsive
        >
          {isInitialized && (
            <canvas
              ref={canvasRef}
              className="w-full h-[500px] rounded-md cursor-grab"
              style={{ touchAction: "none" }} /* Prevents browser handling of touch events */
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              // Add touch event handlers if needed for mobile
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
