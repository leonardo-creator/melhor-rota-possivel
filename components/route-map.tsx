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

    // Create background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    bgGradient.addColorStop(0, "#0c0030") // Darker at top
    bgGradient.addColorStop(1, "#1a0063") // Lighter at bottom

    // Clear canvas with gradient background
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw decorative pattern
    ctx.strokeStyle = "rgba(55, 0, 255, 0.1)"
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

    // Draw glow effect for segments
    route.segments.forEach((segment, i) => {
      const fromPos = getPointPosition(segment.fromIndex)
      const toPos = getPointPosition(segment.toIndex)

      // Draw glow effect
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(fromPos.x, fromPos.y)
      ctx.lineTo(toPos.x, toPos.y)
      ctx.lineWidth = 8
      ctx.strokeStyle = "rgba(66, 238, 220, 0.2)"
      ctx.stroke()
      ctx.restore()
    })

    // Draw segments with enhanced styling
    route.segments.forEach((segment, i) => {
      const fromPos = getPointPosition(segment.fromIndex)
      const toPos = getPointPosition(segment.toIndex)

      // Create gradient for the line
      const gradient = ctx.createLinearGradient(fromPos.x, fromPos.y, toPos.x, toPos.y)
      gradient.addColorStop(0, "#3700ff") // Start with blue
      gradient.addColorStop(0.5, "#42eedc") // Transition to teal
      gradient.addColorStop(1, "#a2ff00") // End with lime

      // Draw line with gradient
      ctx.beginPath()
      ctx.moveTo(fromPos.x, fromPos.y)
      ctx.lineTo(toPos.x, toPos.y)

      // Highlight hovered segment
      if (hoveredSegment === i) {
        ctx.lineWidth = 6
        ctx.strokeStyle = "#ff3f19" // Red for hover

        // Add pulsing effect for hovered segment
        ctx.shadowColor = "#ff3f19"
        ctx.shadowBlur = 10
      } else {
        ctx.lineWidth = 4
        ctx.strokeStyle = gradient
      }

      ctx.stroke()
      ctx.shadowBlur = 0 // Reset shadow

      // Draw animated dashes for direction
      ctx.beginPath()
      ctx.setLineDash([5, 10])
      ctx.lineDashOffset = -((Date.now() / 100) % 15) // Animate dash
      ctx.moveTo(fromPos.x, fromPos.y)
      ctx.lineTo(toPos.x, toPos.y)
      ctx.lineWidth = 2
      ctx.strokeStyle = "#f1f5f9"
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

      // Create gradient for label background
      const labelGradient = ctx.createLinearGradient(-textWidth / 2 - 5, 0, textWidth / 2 + 5, 0)
      labelGradient.addColorStop(0, "rgba(17, 0, 67, 0.9)")
      labelGradient.addColorStop(1, "rgba(55, 0, 255, 0.9)")

      ctx.fillStyle = labelGradient
      ctx.fill()

      // Add subtle border
      ctx.strokeStyle = "#42eedc"
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw text with glow effect - FIXED TEXT COLOR FOR READABILITY
      ctx.shadowColor = hoveredSegment === i ? "#ff3f19" : "#42eedc"
      ctx.shadowBlur = 5
      ctx.fillStyle = "#f1f5f9" // Always light text for readability
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

      // Draw outer glow
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2)

      // Different glow colors based on point type
      if (isHovered) {
        ctx.fillStyle = "rgba(255, 63, 25, 0.3)" // Red glow for hover
      } else if (isStart) {
        ctx.fillStyle = "rgba(162, 255, 0, 0.3)" // Green glow for start
      } else if (isEnd) {
        ctx.fillStyle = "rgba(255, 63, 25, 0.3)" // Red glow for end
      } else {
        ctx.fillStyle = "rgba(66, 238, 220, 0.3)" // Teal glow for regular points
      }
      ctx.fill()

      // Draw point shadow
      ctx.beginPath()
      ctx.arc(pos.x, pos.y + 3, 12, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
      ctx.fill()

      // Draw main circle with gradient
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2)

      // Create radial gradient for point
      const pointGradient = ctx.createRadialGradient(pos.x - 3, pos.y - 3, 0, pos.x, pos.y, 12)

      // Determine point colors
      if (isHovered) {
        pointGradient.addColorStop(0, "#ff6347") // Lighter red
        pointGradient.addColorStop(1, "#ff3f19") // Darker red
      } else if (isStart) {
        pointGradient.addColorStop(0, "#c4ff65") // Lighter green
        pointGradient.addColorStop(1, "#a2ff00") // Darker green
      } else if (isEnd) {
        pointGradient.addColorStop(0, "#ff6347") // Lighter red
        pointGradient.addColorStop(1, "#ff3f19") // Darker red
      } else {
        pointGradient.addColorStop(0, "#7df9e9") // Lighter teal
        pointGradient.addColorStop(1, "#42eedc") // Darker teal
      }

      ctx.fillStyle = pointGradient
      ctx.fill()

      // Draw point border with glow
      ctx.lineWidth = 2
      ctx.strokeStyle = "#f1f5f9"
      ctx.shadowColor = isHovered ? "#ff3f19" : isStart ? "#a2ff00" : isEnd ? "#ff3f19" : "#42eedc"
      ctx.shadowBlur = 5
      ctx.stroke()
      ctx.shadowBlur = 0 // Reset shadow

      // Draw point ID - FIXED TEXT COLOR FOR READABILITY
      ctx.fillStyle = "#110043" // Dark text on light background for point ID
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
        ctx.fillStyle = isStart ? "#a2ff00" : "#ff3f19"
        ctx.fill()
        ctx.strokeStyle = "#f1f5f9"
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = "#110043" // Dark text for readability
        ctx.font = "bold 10px Arial"
        ctx.fillText(isStart ? "S" : "E", indicatorX, indicatorY)
      }

      // Draw point description with enhanced styling
      const description = point.description
      ctx.font = "12px Arial"
      const textWidth = ctx.measureText(description).width
      const textHeight = 20
      const cornerRadius = 5

      // Draw rounded rectangle for description
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

      // Create gradient for description background
      const descGradient = ctx.createLinearGradient(
        pos.x - textWidth / 2 - 5,
        pos.y + 20,
        pos.x + textWidth / 2 + 5,
        pos.y + 20,
      )
      descGradient.addColorStop(0, "rgba(17, 0, 67, 0.9)")
      descGradient.addColorStop(1, "rgba(55, 0, 255, 0.9)")

      ctx.fillStyle = descGradient
      ctx.fill()

      // Add subtle border
      ctx.strokeStyle = isHovered ? "#ff3f19" : isStart ? "#a2ff00" : isEnd ? "#ff3f19" : "#42eedc"
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw description text - FIXED TEXT COLOR FOR READABILITY
      ctx.fillStyle = "#f1f5f9" // Light text for readability
      ctx.fillText(description, pos.x, pos.y + 30)

      // Draw coordinates for hovered point with enhanced styling
      if (isHovered) {
        const coordText = `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`
        ctx.font = "11px Arial"
        const coordWidth = ctx.measureText(coordText).width
        const coordHeight = 20

        // Draw rounded rectangle for coordinates
        ctx.beginPath()
        ctx.moveTo(pos.x - coordWidth / 2 - 5 + cornerRadius, pos.y - 40)
        ctx.lineTo(pos.x + coordWidth / 2 + 5 - cornerRadius, pos.y - 40)
        ctx.arcTo(
          pos.x + coordWidth / 2 + 5,
          pos.y - 40,
          pos.x + coordWidth / 2 + 5,
          pos.y - 40 + cornerRadius,
          cornerRadius,
        )
        ctx.lineTo(pos.x + coordWidth / 2 + 5, pos.y - 40 + coordHeight - cornerRadius)
        ctx.arcTo(
          pos.x + coordWidth / 2 + 5,
          pos.y - 40 + coordHeight,
          pos.x + coordWidth / 2 + 5 - cornerRadius,
          pos.y - 40 + coordHeight,
          cornerRadius,
        )
        ctx.lineTo(pos.x - coordWidth / 2 - 5 + cornerRadius, pos.y - 40 + coordHeight)
        ctx.arcTo(
          pos.x - coordWidth / 2 - 5,
          pos.y - 40 + coordHeight,
          pos.x - coordWidth / 2 - 5,
          pos.y - 40 + coordHeight - cornerRadius,
          cornerRadius,
        )
        ctx.lineTo(pos.x - coordWidth / 2 - 5, pos.y - 40 + cornerRadius)
        ctx.arcTo(
          pos.x - coordWidth / 2 - 5,
          pos.y - 40,
          pos.x - coordWidth / 2 - 5 + cornerRadius,
          pos.y - 40,
          cornerRadius,
        )
        ctx.closePath()

        // Create gradient for coordinates background
        const coordGradient = ctx.createLinearGradient(
          pos.x - coordWidth / 2 - 5,
          pos.y - 40,
          pos.x + coordWidth / 2 + 5,
          pos.y - 40,
        )
        coordGradient.addColorStop(0, "rgba(255, 63, 25, 0.9)")
        coordGradient.addColorStop(1, "rgba(255, 99, 71, 0.9)")

        ctx.fillStyle = coordGradient
        ctx.fill()

        // Add subtle border
        ctx.strokeStyle = "#f1f5f9"
        ctx.lineWidth = 1
        ctx.stroke()

        // Draw coordinates text with glow - FIXED TEXT COLOR FOR READABILITY
        ctx.shadowColor = "#ff3f19"
        ctx.shadowBlur = 3
        ctx.fillStyle = "#f1f5f9" // Light text for readability
        ctx.fillText(coordText, pos.x, pos.y - 30)
        ctx.shadowBlur = 0
      }
    })

    // Draw route order numbers with enhanced styling
    route.path.forEach((pointIndex, i) => {
      if (i < route.path.length - 1) {
        const fromPos = getPointPosition(pointIndex)
        const toPos = getPointPosition(route.path[i + 1])

        // Calculate position for order number (slightly offset from midpoint)
        const midX = (fromPos.x + toPos.x) / 2
        const midY = (fromPos.y + toPos.y) / 2

        // Draw glowing circle for order number
        ctx.beginPath()
        ctx.arc(midX, midY, 14, 0, Math.PI * 2)

        // Create radial gradient for order marker
        const orderGradient = ctx.createRadialGradient(midX - 2, midY - 2, 0, midX, midY, 14)
        orderGradient.addColorStop(0, "#5c29ff") // Lighter blue
        orderGradient.addColorStop(1, "#3700ff") // Darker blue

        ctx.fillStyle = orderGradient
        ctx.fill()

        // Add glow effect
        ctx.shadowColor = "#3700ff"
        ctx.shadowBlur = 8
        ctx.strokeStyle = "#f1f5f9"
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.shadowBlur = 0

        // Draw order number - FIXED TEXT COLOR FOR READABILITY
        const orderText = `${i + 1}`
        ctx.font = "bold 14px Arial"
        ctx.fillStyle = "#f1f5f9" // Light text for readability
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(orderText, midX, midY)
      }
    })

    // Draw enhanced compass
    const compassRadius = 40
    const compassX = canvas.width - compassRadius - 20
    const compassY = compassRadius + 20

    // Draw compass outer glow
    ctx.beginPath()
    ctx.arc(compassX, compassY, compassRadius + 5, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(66, 238, 220, 0.2)"
    ctx.fill()

    // Draw compass circle with gradient
    ctx.beginPath()
    ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2)

    // Create radial gradient for compass
    const compassGradient = ctx.createRadialGradient(compassX - 10, compassY - 10, 0, compassX, compassY, compassRadius)
    compassGradient.addColorStop(0, "#1a0063") // Lighter purple
    compassGradient.addColorStop(1, "#110043") // Darker purple

    ctx.fillStyle = compassGradient
    ctx.fill()

    // Add subtle glow
    ctx.shadowColor = "#42eedc"
    ctx.shadowBlur = 10
    ctx.strokeStyle = "#42eedc"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.shadowBlur = 0

    // Draw compass directions with enhanced styling - FIXED TEXT COLOR FOR READABILITY
    ctx.font = "bold 14px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // North (special styling)
    ctx.fillStyle = "#f1f5f9" // Light text for readability
    ctx.shadowColor = "#ff3f19"
    ctx.shadowBlur = 5
    ctx.fillText("N", compassX, compassY - compassRadius + 15)
    ctx.shadowBlur = 0

    // Other directions
    ctx.fillStyle = "#f1f5f9" // Light text for readability
    ctx.fillText("S", compassX, compassY + compassRadius - 15)
    ctx.fillText("E", compassX + compassRadius - 15, compassY)
    ctx.fillText("W", compassX - compassRadius + 15, compassY)

    // Draw compass rose lines
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i
      const innerRadius = compassRadius * 0.3
      const outerRadius = compassRadius * 0.9

      ctx.beginPath()
      ctx.moveTo(compassX + innerRadius * Math.cos(angle), compassY + innerRadius * Math.sin(angle))
      ctx.lineTo(compassX + outerRadius * Math.cos(angle), compassY + outerRadius * Math.sin(angle))

      // Alternate colors for compass rose lines
      ctx.strokeStyle = i % 2 === 0 ? "#42eedc" : "#f1f5f9"
      ctx.lineWidth = i % 2 === 0 ? 2 : 1
      ctx.stroke()
    }

    // Draw compass needle with gradient
    ctx.beginPath()
    ctx.moveTo(compassX, compassY - compassRadius * 0.7)
    ctx.lineTo(compassX - compassRadius * 0.2, compassY)
    ctx.lineTo(compassX, compassY + compassRadius * 0.2)
    ctx.lineTo(compassX + compassRadius * 0.2, compassY)
    ctx.closePath()

    // Create gradient for north-pointing needle
    const needleGradient = ctx.createLinearGradient(
      compassX,
      compassY - compassRadius * 0.7,
      compassX,
      compassY + compassRadius * 0.2,
    )
    needleGradient.addColorStop(0, "#ff3f19") // Red at north tip
    needleGradient.addColorStop(0.5, "#ff6347") // Lighter in middle
    needleGradient.addColorStop(1, "#f1f5f9") // White at south end

    ctx.fillStyle = needleGradient
    ctx.fill()

    // Add needle border
    ctx.strokeStyle = "#f1f5f9"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw enhanced scale bar
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

    // Draw scale bar background with gradient
    ctx.beginPath()
    ctx.rect(scaleBarX, scaleBarY - scaleBarHeight / 2, scaleBarLength, scaleBarHeight)

    // Create gradient for scale bar
    const scaleGradient = ctx.createLinearGradient(scaleBarX, scaleBarY, scaleBarX + scaleBarLength, scaleBarY)
    scaleGradient.addColorStop(0, "#3700ff") // Blue at start
    scaleGradient.addColorStop(0.5, "#42eedc") // Teal in middle
    scaleGradient.addColorStop(1, "#a2ff00") // Green at end

    ctx.fillStyle = scaleGradient
    ctx.fill()

    // Add subtle glow
    ctx.shadowColor = "#42eedc"
    ctx.shadowBlur = 5
    ctx.strokeStyle = "#f1f5f9"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.shadowBlur = 0

    // Draw ticks with enhanced styling
    ctx.beginPath()
    ctx.moveTo(scaleBarX, scaleBarY - 10)
    ctx.lineTo(scaleBarX, scaleBarY + 10)
    ctx.moveTo(scaleBarX + scaleBarLength / 2, scaleBarY - 5)
    ctx.lineTo(scaleBarX + scaleBarLength / 2, scaleBarY + 5)
    ctx.moveTo(scaleBarX + scaleBarLength, scaleBarY - 10)
    ctx.lineTo(scaleBarX + scaleBarLength, scaleBarY + 10)
    ctx.strokeStyle = "#f1f5f9"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw scale text with enhanced styling - FIXED TEXT COLOR FOR READABILITY
    ctx.font = "bold 12px Arial"
    ctx.textAlign = "center"
    ctx.shadowColor = "#42eedc"
    ctx.shadowBlur = 3
    ctx.fillStyle = "#f1f5f9" // Light text for readability
    ctx.fillText(`${roundedDistance.toFixed(1)} km`, scaleBarX + scaleBarLength / 2, scaleBarY - 15)
    ctx.shadowBlur = 0

    // Draw subdivisions - FIXED TEXT COLOR FOR READABILITY
    ctx.font = "10px Arial"
    ctx.fillStyle = "#f1f5f9" // Light text for readability
    ctx.fillText("0", scaleBarX, scaleBarY + 15)
    ctx.fillText(`${(roundedDistance / 2).toFixed(1)}`, scaleBarX + scaleBarLength / 2, scaleBarY + 15)
    ctx.fillText(`${roundedDistance.toFixed(1)}`, scaleBarX + scaleBarLength, scaleBarY + 15)

    // Draw legend for start and end points
    const legendX = 20
    const legendY = 30
    const legendSpacing = 25
    const legendRadius = 8

    // Start point legend
    ctx.beginPath()
    ctx.arc(legendX, legendY, legendRadius, 0, Math.PI * 2)
    const startGradient = ctx.createRadialGradient(legendX - 2, legendY - 2, 0, legendX, legendY, legendRadius)
    startGradient.addColorStop(0, "#c4ff65")
    startGradient.addColorStop(1, "#a2ff00")
    ctx.fillStyle = startGradient
    ctx.fill()
    ctx.strokeStyle = "#f1f5f9"
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = "#f1f5f9" // Light text for readability
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
    endGradient.addColorStop(0, "#ff6347")
    endGradient.addColorStop(1, "#ff3f19")
    ctx.fillStyle = endGradient
    ctx.fill()
    ctx.strokeStyle = "#f1f5f9"
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = "#f1f5f9" // Light text for readability
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
    waypointGradient.addColorStop(0, "#7df9e9")
    waypointGradient.addColorStop(1, "#42eedc")
    ctx.fillStyle = waypointGradient
    ctx.fill()
    ctx.strokeStyle = "#f1f5f9"
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = "#f1f5f9" // Light text for readability
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
    <Card className="bg-[#1a0063] border-[#d4d4d8]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#42eedc] text-xl">Visualized Route Map</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 border-[#3700ff] text-[#42eedc] hover:bg-[#3700ff]/20"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 border-[#3700ff] text-[#42eedc] hover:bg-[#3700ff]/20"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8 border-[#3700ff] text-[#42eedc] hover:bg-[#3700ff]/20"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className="bg-gradient-to-b from-[#0c0030] to-[#1a0063] p-3 rounded-md shadow-lg"
            ref={containerRef}
            style={{ minHeight: "500px" }}
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
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 bg-[#110043] p-3 rounded-md">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#c4ff65] to-[#a2ff00] mr-2 shadow-sm shadow-[#a2ff00]"></div>
              <span className="text-[#f1f5f9]">Starting Point</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#ff6347] to-[#ff3f19] mr-2 shadow-sm shadow-[#ff3f19]"></div>
              <span className="text-[#f1f5f9]">Ending Point</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#7df9e9] to-[#42eedc] mr-2 shadow-sm shadow-[#42eedc]"></div>
              <span className="text-[#f1f5f9]">Waypoints</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-8 bg-gradient-to-r from-[#3700ff] via-[#42eedc] to-[#a2ff00] mr-2 rounded-full"></div>
              <span className="text-[#f1f5f9]">Route Path</span>
            </div>
          </div>

          <div className="text-sm text-[#f1f5f9] bg-[#110043] p-3 rounded-md">
            <p className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-[#ff3f19] mr-2"></span>
              Hover over points to see coordinates
            </p>
            <p className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-[#a2ff00] mr-2"></span>
              Hover over lines to highlight route segments
            </p>
            <p className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-[#42eedc] mr-2"></span>
              Drag to pan the map, use buttons to zoom
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
