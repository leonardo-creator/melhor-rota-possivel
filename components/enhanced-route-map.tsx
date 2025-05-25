"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  MoveHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Square,
  Eye,
  EyeOff,
  Map,
  Layers,
} from "lucide-react"
import type { RoutePoint, CalculatedRoute, OptimizationMethod } from "@/lib/types"

interface EnhancedRouteMapProps {
  route: CalculatedRoute
  points: RoutePoint[]
  startPointId?: number
  endPointId?: number
  alternativeRoutes?: CalculatedRoute[]
  optimizationMethod?: OptimizationMethod
}

export default function EnhancedRouteMap({
  route,
  points,
  startPointId,
  endPointId,
  alternativeRoutes = [],
  optimizationMethod = "nearest-neighbor",
}: EnhancedRouteMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [hoveredSegment, setHoveredSegment] = useState<{ routeIndex: number; segmentIndex: number } | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 500 })
  const [isInitialized, setIsInitialized] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showAlternativeRoutes, setShowAlternativeRoutes] = useState(true)
  const [activeTab, setActiveTab] = useState("map")
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite" | "terrain">("standard")
  const animationRef = useRef<number | null>(null)

  // Combine main route with alternative routes for rendering
  const allRoutes = [route, ...(showAlternativeRoutes ? alternativeRoutes : [])]

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
    const resizeObserver = new ResizeObserver(updateCanvasSize)
    resizeObserver.observe(containerRef.current)

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
      resizeObserver.disconnect()
    }
  }, [isInitialized])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keys if the map is focused or a child is focused
      if (!containerRef.current?.contains(document.activeElement)) return

      const moveAmount = 20
      switch (e.key) {
        case "ArrowUp":
          setOffset((prev) => ({ ...prev, y: prev.y + moveAmount }))
          e.preventDefault()
          break
        case "ArrowDown":
          setOffset((prev) => ({ ...prev, y: prev.y - moveAmount }))
          e.preventDefault()
          break
        case "ArrowLeft":
          setOffset((prev) => ({ ...prev, x: prev.x + moveAmount }))
          e.preventDefault()
          break
        case "ArrowRight":
          setOffset((prev) => ({ ...prev, x: prev.x - moveAmount }))
          e.preventDefault()
          break
        case "+":
        case "=":
          handleZoomIn()
          e.preventDefault()
          break
        case "-":
        case "_":
          handleZoomOut()
          e.preventDefault()
          break
        case "0":
          handleReset()
          e.preventDefault()
          break
        case "a":
          toggleAlternativeRoutes()
          e.preventDefault()
          break
        case "p":
          toggleAnimation()
          e.preventDefault()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [showAlternativeRoutes, isAnimating])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5))
  }

  const handleReset = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setSelectedPointIndex(null)
  }

  const toggleAlternativeRoutes = () => {
    setShowAlternativeRoutes((prev) => !prev)
  }

  const toggleAnimation = () => {
    if (isAnimating) {
      stopAnimation()
    } else {
      animateRoute()
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return // Only handle left mouse button

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / (rect.right - rect.left)) * canvas.width
    const y = ((e.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height

    // Check if clicking on a point
    let foundPoint = false
    points.forEach((_, i) => {
      const pointPos = getPointPosition(i)
      const distance = Math.sqrt(Math.pow(x - pointPos.x, 2) + Math.pow(y - pointPos.y, 2))
      if (distance < 15) {
        setSelectedPointIndex(i)
        foundPoint = true
      }
    })

    if (!foundPoint) {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }

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
        // Change cursor to pointer
        canvas.style.cursor = "pointer"
      }
    })

    if (!foundPoint) {
      setHoveredPoint(null)
      // Reset cursor if not dragging
      canvas.style.cursor = isDragging ? "grabbing" : "grab"
    }

    // Check if hovering over a segment
    if (!foundPoint) {
      let foundSegment = false

      // Check all routes (main + alternatives)
      allRoutes.forEach((currentRoute, routeIndex) => {
        currentRoute.segments.forEach((segment, segmentIndex) => {
          const fromPos = getPointPosition(segment.fromIndex)
          const toPos = getPointPosition(segment.toIndex)

          // Calculate distance from point to line segment
          const distance = distToSegment(x, y, fromPos.x, fromPos.y, toPos.x, toPos.y)
          if (distance < 10) {
            setHoveredSegment({ routeIndex, segmentIndex })
            foundSegment = true
            // Change cursor to pointer
            canvas.style.cursor = "pointer"
          }
        })
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
      // Set cursor to grabbing
      canvas.style.cursor = "grabbing"
      // Prevent default to avoid text selection during drag
      e.preventDefault()
    }
  }

  const handleMouseUp = () => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.cursor = "grab"
    }
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setHoveredSegment(null)
    setHoveredPoint(null)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((touch.clientX - rect.left) / (rect.right - rect.left)) * canvas.width
    const y = ((touch.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height

    // Check if touching a point
    let foundPoint = false
    points.forEach((_, i) => {
      const pointPos = getPointPosition(i)
      const distance = Math.sqrt(Math.pow(x - pointPos.x, 2) + Math.pow(y - pointPos.y, 2))
      if (distance < 20) {
        // Larger touch target
        setSelectedPointIndex(i)
        foundPoint = true
      }
    })

    if (!foundPoint) {
      setIsDragging(true)
      setDragStart({ x: touch.clientX, y: touch.clientY })
    }

    e.preventDefault()
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return

    const touch = e.touches[0]
    const dx = touch.clientX - dragStart.x
    const dy = touch.clientY - dragStart.y
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
    setDragStart({ x: touch.clientX, y: touch.clientY })
    e.preventDefault()
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
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

  // Function to move in a specific direction
  const moveMap = (direction: "up" | "down" | "left" | "right") => {
    const moveAmount = 20
    switch (direction) {
      case "up":
        setOffset((prev) => ({ ...prev, y: prev.y + moveAmount }))
        break
      case "down":
        setOffset((prev) => ({ ...prev, y: prev.y - moveAmount }))
        break
      case "left":
        setOffset((prev) => ({ ...prev, x: prev.x + moveAmount }))
        break
      case "right":
        setOffset((prev) => ({ ...prev, x: prev.x - moveAmount }))
        break
    }
  }

  // Function to center the map on a specific point
  const centerOnPoint = (index: number) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const point = points[index]
    const padding = 40
    const width = canvas.width - padding * 2
    const height = canvas.height - padding * 2

    // Calculate the offset needed to center this point
    const x =
      canvas.width / 2 - padding - ((point.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width * zoom
    const y =
      canvas.height / 2 - padding - ((bounds.maxLat - point.latitude) / (bounds.maxLat - bounds.minLat)) * height * zoom

    setOffset({ x, y })
    setSelectedPointIndex(index)
  }

  // Function to animate the route
  const animateRoute = () => {
    setIsAnimating(true)
    let step = 0
    const totalSteps = route.path.length
    const animationSpeed = 1000 // ms per step

    const animate = () => {
      if (step < totalSteps) {
        const pointIndex = route.path[step]
        centerOnPoint(pointIndex)
        setSelectedPointIndex(pointIndex)

        // Schedule next step
        setTimeout(() => {
          step++
          if (step < totalSteps) {
            animationRef.current = requestAnimationFrame(animate)
          } else {
            setIsAnimating(false)
          }
        }, animationSpeed)
      } else {
        setIsAnimating(false)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  // Function to stop animation
  const stopAnimation = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    setIsAnimating(false)
  }

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Get route color based on index and optimization method
  function getRouteColor(routeIndex: number, isHovered = false) {
    if (isHovered) return "#ff3f19" // Red for hover

    if (routeIndex === 0) {
      // Main route colors based on optimization method
      switch (optimizationMethod) {
        case "nearest-neighbor":
          return { start: "#3700ff", middle: "#42eedc", end: "#a2ff00" }
        case "genetic-algorithm":
          return { start: "#7928CA", middle: "#FF0080", end: "#FF4D4D" }
        case "simulated-annealing":
          return { start: "#004D40", middle: "#00BFA5", end: "#64FFDA" }
        case "a-star":
          return { start: "#1A237E", middle: "#3D5AFE", end: "#8C9EFF" }
        default:
          return { start: "#3700ff", middle: "#42eedc", end: "#a2ff00" }
      }
    } else {
      // Alternative route colors
      const alternativeColors = [
        { start: "#6B7280", middle: "#9CA3AF", end: "#D1D5DB" }, // Gray
        { start: "#7C3AED", middle: "#A78BFA", end: "#C4B5FD" }, // Purple
        { start: "#0369A1", middle: "#0EA5E9", end: "#7DD3FC" }, // Blue
        { start: "#15803D", middle: "#22C55E", end: "#86EFAC" }, // Green
      ]

      // Use modulo to cycle through colors if there are more alternative routes than colors
      const colorIndex = (routeIndex - 1) % alternativeColors.length
      return alternativeColors[colorIndex]
    }
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

    // Create background based on map style
    let bgGradient
    switch (mapStyle) {
      case "satellite":
        bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        bgGradient.addColorStop(0, "#0f172a") // Dark blue
        bgGradient.addColorStop(1, "#1e293b") // Lighter blue
        break
      case "terrain":
        bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        bgGradient.addColorStop(0, "#064e3b") // Dark green
        bgGradient.addColorStop(1, "#065f46") // Lighter green
        break
      default: // standard
        bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
        bgGradient.addColorStop(0, "#0c0030") // Darker at top
        bgGradient.addColorStop(1, "#1a0063") // Lighter at bottom
    }

    // Clear canvas with gradient background
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw decorative pattern based on map style
    if (mapStyle === "standard") {
      // Draw hexagonal grid pattern for standard style
      ctx.strokeStyle = "rgba(55, 0, 255, 0.1)"
      ctx.lineWidth = 1

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
    } else if (mapStyle === "satellite") {
      // Draw grid pattern for satellite style
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 0.5

      const gridSize = 50

      // Draw vertical lines
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Draw horizontal lines
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    } else if (mapStyle === "terrain") {
      // Draw contour lines for terrain style
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 0.5

      // Draw random contour-like curves
      for (let i = 0; i < 10; i++) {
        ctx.beginPath()
        const startX = Math.random() * canvas.width
        const startY = Math.random() * canvas.height
        ctx.moveTo(startX, startY)

        for (let j = 0; j < 5; j++) {
          const controlX1 = startX + Math.random() * 200 - 100
          const controlY1 = startY + Math.random() * 200 - 100
          const controlX2 = startX + Math.random() * 200 - 100
          const controlY2 = startY + Math.random() * 200 - 100
          const endX = startX + Math.random() * 200 - 100
          const endY = startY + Math.random() * 200 - 100

          ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY)
        }

        ctx.stroke()
      }
    }

    // Draw all routes (main route first, then alternatives if enabled)
    allRoutes.forEach((currentRoute, routeIndex) => {
      // Draw glow effect for segments
      currentRoute.segments.forEach((segment) => {
        const fromPos = getPointPosition(segment.fromIndex)
        const toPos = getPointPosition(segment.toIndex)

        // Draw glow effect
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(fromPos.x, fromPos.y)
        ctx.lineTo(toPos.x, toPos.y)
        ctx.lineWidth = 8

        // Different glow color based on route index
        const glowColor = routeIndex === 0 ? "rgba(66, 238, 220, 0.2)" : "rgba(150, 150, 150, 0.15)"

        ctx.strokeStyle = glowColor
        ctx.stroke()
        ctx.restore()
      })

      // Draw segments with enhanced styling
      currentRoute.segments.forEach((segment, segmentIndex) => {
        const fromPos = getPointPosition(segment.fromIndex)
        const toPos = getPointPosition(segment.toIndex)

        // Determine if this segment is hovered
        const isHovered =
          hoveredSegment !== null &&
          hoveredSegment.routeIndex === routeIndex &&
          hoveredSegment.segmentIndex === segmentIndex

        // Get color based on route index and hover state
        const routeColor = getRouteColor(routeIndex, isHovered)

        // Create gradient for the line
        const gradient = ctx.createLinearGradient(fromPos.x, fromPos.y, toPos.x, toPos.y)

        if (isHovered) {
          gradient.addColorStop(0, "#ff3f19") // Red for hover
          gradient.addColorStop(1, "#ff3f19") // Red for hover
        } else {
          if (typeof routeColor === "string") {
            gradient.addColorStop(0, routeColor)
            gradient.addColorStop(1, routeColor)
          } else {
            gradient.addColorStop(0, routeColor.start)
            gradient.addColorStop(0.5, routeColor.middle)
            gradient.addColorStop(1, routeColor.end)
          }
        }

        // Draw line with gradient
        ctx.beginPath()
        ctx.moveTo(fromPos.x, fromPos.y)
        ctx.lineTo(toPos.x, toPos.y)

        // Line styling based on route index and hover state
        if (isHovered) {
          ctx.lineWidth = 6
          ctx.strokeStyle = "#ff3f19" // Red for hover

          // Add pulsing effect for hovered segment
          ctx.shadowColor = "#ff3f19"
          ctx.shadowBlur = 10
        } else {
          // Main route is thicker than alternatives
          ctx.lineWidth = routeIndex === 0 ? 4 : 2
          ctx.strokeStyle = gradient

          // Add subtle shadow to main route
          if (routeIndex === 0) {
            ctx.shadowColor = "rgba(66, 238, 220, 0.5)"
            ctx.shadowBlur = 3
          }
        }

        ctx.stroke()
        ctx.shadowBlur = 0 // Reset shadow

        // Draw animated dashes for direction (only for main route or hovered segments)
        if (routeIndex === 0 || isHovered) {
          ctx.beginPath()
          ctx.setLineDash([5, 10])
          ctx.lineDashOffset = -((Date.now() / 100) % 15) // Animate dash
          ctx.moveTo(fromPos.x, fromPos.y)
          ctx.lineTo(toPos.x, toPos.y)
          ctx.lineWidth = routeIndex === 0 ? 2 : 1
          ctx.strokeStyle = "#f1f5f9"
          ctx.stroke()
          ctx.setLineDash([]) // Reset dash
        }

        // Draw distance label with enhanced styling (only for main route or hovered segments)
        if (routeIndex === 0 || isHovered) {
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
          ctx.arcTo(
            -textWidth / 2 - 5,
            -textHeight / 2,
            -textWidth / 2 - 5 + cornerRadius,
            -textHeight / 2,
            cornerRadius,
          )
          ctx.closePath()

          // Create gradient for label background
          const labelGradient = ctx.createLinearGradient(-textWidth / 2 - 5, 0, textWidth / 2 + 5, 0)

          if (isHovered) {
            labelGradient.addColorStop(0, "rgba(255, 63, 25, 0.9)")
            labelGradient.addColorStop(1, "rgba(255, 99, 71, 0.9)")
          } else {
            labelGradient.addColorStop(0, "rgba(17, 0, 67, 0.9)")
            labelGradient.addColorStop(1, "rgba(55, 0, 255, 0.9)")
          }

          ctx.fillStyle = labelGradient
          ctx.fill()

          // Add subtle border
          ctx.strokeStyle = isHovered ? "#ff3f19" : "#42eedc"
          ctx.lineWidth = 1
          ctx.stroke()

          // Draw text with glow effect
          ctx.shadowColor = isHovered ? "#ff3f19" : "#42eedc"
          ctx.shadowBlur = 5
          ctx.fillStyle = "#f1f5f9" // Always light text for readability
          ctx.fillText(distanceText, 0, 0)
          ctx.shadowBlur = 0

          ctx.restore()
        }
      })
    })

    // Draw route order numbers with enhanced styling (only for main route)
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

        // Draw order number
        const orderText = `${i + 1}`
        ctx.font = "bold 14px Arial"
        ctx.fillStyle = "#f1f5f9" // Light text for readability
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(orderText, midX, midY)
      }
    })

    // Draw points with enhanced styling
    points.forEach((point, i) => {
      const pos = getPointPosition(i)
      const isStart = isStartPoint(i)
      const isEnd = isEndPoint(i)
      const isHovered = hoveredPoint === i
      const isSelected = selectedPointIndex === i

      // Draw outer glow
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, isSelected ? 22 : 18, 0, Math.PI * 2)

      // Different glow colors based on point type
      if (isSelected) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)" // White glow for selected
      } else if (isHovered) {
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
      ctx.arc(pos.x, pos.y, isSelected ? 15 : 12, 0, Math.PI * 2)

      // Create radial gradient for point
      const pointGradient = ctx.createRadialGradient(pos.x - 3, pos.y - 3, 0, pos.x, pos.y, isSelected ? 15 : 12)

      // Determine point colors
      if (isSelected) {
        pointGradient.addColorStop(0, "#ffffff") // White for selected
        pointGradient.addColorStop(1, "#f1f5f9") // Light gray for selected
      } else if (isHovered) {
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
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.strokeStyle = isSelected ? "#ffffff" : "#f1f5f9"
      ctx.shadowColor = isSelected
        ? "#ffffff"
        : isHovered
          ? "#ff3f19"
          : isStart
            ? "#a2ff00"
            : isEnd
              ? "#ff3f19"
              : "#42eedc"
      ctx.shadowBlur = isSelected ? 10 : 5
      ctx.stroke()
      ctx.shadowBlur = 0 // Reset shadow

      // Draw point ID
      ctx.fillStyle = "#110043" // Dark text on light background for point ID
      ctx.font = isSelected ? "bold 14px Arial" : "bold 12px Arial"
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

      // Draw description text
      ctx.fillStyle = "#f1f5f9" // Light text for readability
      ctx.fillText(description, pos.x, pos.y + 30)

      // Draw coordinates for hovered or selected points with enhanced styling
      if (isHovered || isSelected) {
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
        coordGradient.addColorStop(0, isSelected ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 63, 25, 0.9)")
        coordGradient.addColorStop(1, isSelected ? "rgba(241, 245, 249, 0.9)" : "rgba(255, 99, 71, 0.9)")

        ctx.fillStyle = coordGradient
        ctx.fill()

        // Add subtle border
        ctx.strokeStyle = "#f1f5f9"
        ctx.lineWidth = 1
        ctx.stroke()

        // Draw coordinates text with glow
        ctx.shadowColor = isSelected ? "#ffffff" : "#ff3f19"
        ctx.shadowBlur = 3
        ctx.fillStyle = "#f1f5f9" // Light text for readability
        ctx.fillText(coordText, pos.x, pos.y - 30)
        ctx.shadowBlur = 0
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

    // Draw compass directions with enhanced styling
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
    needleGradient.addColorStop(0, "#4A4A4A") // Dark gray for North
    needleGradient.addColorStop(0.5, "#707070") // Medium gray
    needleGradient.addColorStop(1, "#1E1E1E") // Darker gray

    ctx.fillStyle = needleGradient
    ctx.fill()

    // Add needle border
    ctx.strokeStyle = "#1E1E1E" // Dark border
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
    scaleGradient.addColorStop(0, "#E0E0E0") // Light gray
    scaleGradient.addColorStop(0.5, "#F5F5F5") // Lighter gray
    scaleGradient.addColorStop(1, "#D0D0D0") // Medium light gray

    ctx.fillStyle = scaleGradient
    ctx.fill()

    // Add subtle glow
    ctx.shadowColor = "#A0A0A0" // Medium gray glow
    ctx.shadowBlur = 5
    ctx.strokeStyle = "#1E1E1E" // Dark border
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
    ctx.strokeStyle = "#1E1E1E" // Dark ticks
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw scale text with enhanced styling
    ctx.font = "bold 12px Arial"
    ctx.textAlign = "center"
    ctx.shadowColor = "#A0A0A0" // Medium gray shadow
    ctx.shadowBlur = 3
    ctx.fillStyle = "#1E1E1E" // Dark text
    ctx.fillText(`${roundedDistance.toFixed(1)} km`, scaleBarX + scaleBarLength / 2, scaleBarY - 15)
    ctx.shadowBlur = 0

    // Draw subdivisions
    ctx.font = "10px Arial"
    ctx.fillStyle = "#1E1E1E" // Dark text
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
    startGradient.addColorStop(0, "#90EE90") // Light green
    startGradient.addColorStop(1, "#32CD32") // Lime green
    ctx.fillStyle = startGradient
    ctx.fill()
    ctx.strokeStyle = "#1E1E1E" // Dark border
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = "#1E1E1E" // Dark text
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
    endGradient.addColorStop(0, "#FFA07A") // Light salmon
    endGradient.addColorStop(1, "#FF6347") // Tomato
    ctx.fillStyle = endGradient
    ctx.fill()
    ctx.strokeStyle = "#1E1E1E" // Dark border
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = "#1E1E1E" // Dark text
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
    waypointGradient.addColorStop(0, "#ADD8E6") // Light blue
    waypointGradient.addColorStop(1, "#87CEEB") // Sky blue
    ctx.fillStyle = waypointGradient
    ctx.fill()
    ctx.strokeStyle = "#1E1E1E" // Dark border
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = "#1E1E1E" // Dark text
    ctx.fillText("Waypoint", legendX + legendRadius + 5, legendY + legendSpacing * 2 + 4)

    // Add alternative route legend if showing alternatives
    if (showAlternativeRoutes && alternativeRoutes.length > 0) {
      ctx.strokeStyle = "#A9A9A9" // Dark gray for alternative routes
      ctx.stroke()

      ctx.fillStyle = "#1E1E1E" // Dark text
      ctx.fillText("Alternative Routes", legendX + legendRadius + 5, legendY + legendSpacing * 3 + 4)
    }

    // Draw optimization method indicator
    const methodText = `Optimization: ${optimizationMethod.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`
    ctx.font = "bold 12px Arial"
    const methodWidth = ctx.measureText(methodText).width

    ctx.fillStyle = "rgba(240, 240, 240, 0.8)" // Light gray background for indicator
    ctx.fillRect(canvas.width - methodWidth - 30, canvas.height - 40, methodWidth + 20, 25)
    ctx.strokeStyle = "#A0A0A0" // Medium gray border
    ctx.lineWidth = 1
    ctx.strokeRect(canvas.width - methodWidth - 30, canvas.height - 40, methodWidth + 20, 25)

    ctx.fillStyle = "#1E1E1E" // Dark text
    ctx.textAlign = "left"
    ctx.fillText(methodText, canvas.width - methodWidth - 20, canvas.height - 25)

    // Draw selected point info if applicable
    if (selectedPointIndex !== null) {
      const point = points[selectedPointIndex]
      const infoX = canvas.width - 20
      const infoY = canvas.height - 60
      const infoWidth = 200
      const infoHeight = 120
      const cornerRadius = 10

      // Draw info box with rounded corners
      ctx.beginPath()
      ctx.moveTo(infoX - infoWidth + cornerRadius, infoY - infoHeight)
      ctx.lineTo(infoX - cornerRadius, infoY - infoHeight)
      ctx.arcTo(infoX, infoY - infoHeight, infoX, infoY - infoHeight + cornerRadius, cornerRadius)
      ctx.lineTo(infoX, infoY - cornerRadius)
      ctx.arcTo(infoX, infoY, infoX - cornerRadius, infoY, cornerRadius)
      ctx.lineTo(infoX - infoWidth + cornerRadius, infoY)
      ctx.arcTo(infoX - infoWidth, infoY, infoX - infoWidth, infoY - cornerRadius, cornerRadius)
      ctx.lineTo(infoX - infoWidth, infoY - infoHeight + cornerRadius)
      ctx.arcTo(
        infoX - infoWidth,
        infoY - infoHeight,
        infoX - infoWidth + cornerRadius,
        infoY - infoHeight,
        cornerRadius,
      )
      ctx.closePath()

      // Create gradient for info box
      const infoGradient = ctx.createLinearGradient(infoX - infoWidth, infoY - infoHeight, infoX, infoY)
      infoGradient.addColorStop(0, "rgba(245, 245, 245, 0.9)") // Light gray
      infoGradient.addColorStop(1, "rgba(220, 220, 220, 0.9)") // Slightly darker light gray

      ctx.fillStyle = infoGradient
      ctx.fill()

      // Add subtle border
      ctx.strokeStyle = "#A0A0A0" // Medium gray border
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw point info
      ctx.fillStyle = "#1E1E1E" // Dark text
      ctx.textAlign = "left"
      ctx.font = "bold 14px Arial"
      ctx.fillText(`Point ${point.id}: ${point.description}`, infoX - infoWidth + 10, infoY - infoHeight + 20)

      ctx.font = "12px Arial"
      ctx.fillText(`Latitude: ${point.latitude.toFixed(6)}`, infoX - infoWidth + 10, infoY - infoHeight + 45)
      ctx.fillText(`Longitude: ${point.longitude.toFixed(6)}`, infoX - infoWidth + 10, infoY - infoHeight + 65)

      // Add point type info
      const pointType = isStartPoint(selectedPointIndex)
        ? "Start Point"
        : isEndPoint(selectedPointIndex)
          ? "End Point"
          : "Waypoint"
      ctx.fillText(`Type: ${pointType}`, infoX - infoWidth + 10, infoY - infoHeight + 85)

      // Add position in route if applicable
      const routePosition = route.path.indexOf(selectedPointIndex)
      if (routePosition !== -1) {
        ctx.fillText(
          `Route Position: ${routePosition + 1} of ${route.path.length}`,
          infoX - infoWidth + 10,
          infoY - infoHeight + 105,
        )
      }
    }
  }, [
    route,
    points,
    zoom,
    offset,
    hoveredSegment,
    hoveredPoint,
    startPointId,
    endPointId,
    canvasSize,
    isInitialized,
    selectedPointIndex,
    showAlternativeRoutes,
    alternativeRoutes,
    mapStyle,
    optimizationMethod,
  ])

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
    <Card className="bg-[#F5F5F5] border-[#D1D5DB]"> {/* Light background, medium gray border */}
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#2c5282] text-xl">Visualized Route Map</CardTitle> {/* Dark blue title */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 border-[#6B7280] text-[#4B5563] hover:bg-[#E5E7EB]/20" // Medium gray border, dark gray text, light gray hover
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 border-[#6B7280] text-[#4B5563] hover:bg-[#E5E7EB]/20"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8 border-[#6B7280] text-[#4B5563] hover:bg-[#E5E7EB]/20"
            title="Reset View"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowControls(!showControls)}
            className={`h-8 w-8 border-[#6B7280] ${showControls ? "bg-[#E5E7EB]/20 text-[#1F2937]" : "text-[#4B5563]"} hover:bg-[#E5E7EB]/20`} // Darker text when active
            title="Show Navigation Controls"
          >
            <MoveHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAnimation}
            className={`h-8 w-8 border-[#6B7280] ${isAnimating ? "bg-[#E5E7EB]/20 text-[#1F2937]" : "text-[#4B5563]"} hover:bg-[#E5E7EB]/20`}
            title={isAnimating ? "Stop Animation" : "Animate Route"}
          >
            {isAnimating ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAlternativeRoutes}
            className={`h-8 w-8 border-[#6B7280] ${showAlternativeRoutes ? "bg-[#E5E7EB]/20 text-[#1F2937]" : "text-[#4B5563]"} hover:bg-[#E5E7EB]/20`}
            title={showAlternativeRoutes ? "Hide Alternative Routes" : "Show Alternative Routes"}
          >
            {showAlternativeRoutes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-[#E5E7EB] border-[#6B7280] grid grid-cols-2 mb-4"> {/* Light gray background, medium gray border */}
              <TabsTrigger
                value="map"
                className="data-[state=active]:bg-[#4B5563] data-[state=active]:text-[#F9FAFB] text-[#374151]" // Dark gray active background, light text, medium-dark inactive text
              >
                <Map className="h-4 w-4 mr-2" />
                Map View
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-[#4B5563] data-[state=active]:text-[#F9FAFB] text-[#374151]"
              >
                <Layers className="h-4 w-4 mr-2" />
                Map Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="mt-0">
              {showControls && (
                <div className="bg-[#E5E7EB] p-3 rounded-md shadow-lg mb-4"> {/* Light gray background */}
                  <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto mb-2">
                    <div></div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveMap("up")}
                      className="h-8 w-8 border-[#6B7280] text-[#4B5563] hover:bg-[#D1D5DB]/20" // Medium gray border, dark gray text, lighter gray hover
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <div></div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveMap("left")}
                      className="h-8 w-8 border-[#6B7280] text-[#4B5563] hover:bg-[#D1D5DB]/20"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center justify-center">
                      <span className="text-[#1F2937] text-xs">Move</span> {/* Dark text */}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveMap("right")}
                      className="h-8 w-8 border-[#6B7280] text-[#4B5563] hover:bg-[#D1D5DB]/20"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div></div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveMap("down")}
                      className="h-8 w-8 border-[#6B7280] text-[#4B5563] hover:bg-[#D1D5DB]/20"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <div></div>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-[#1F2937] text-xs min-w-[40px]">Zoom:</span> {/* Dark text */}
                    <Slider
                      value={[zoom]}
                      min={0.5}
                      max={5}
                      step={0.1}
                      onValueChange={(value) => setZoom(value[0])}
                      className="flex-1"
                    />
                    <span className="text-[#1F2937] text-xs min-w-[40px] text-right">{zoom.toFixed(1)}x</span> {/* Dark text */}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#1F2937] text-xs block mb-1">Jump to point:</span> {/* Dark text */}
                      <div className="flex flex-wrap gap-1">
                        {points.map((point, index) => (
                          <Button
                            key={point.id}
                            variant="outline"
                            size="sm"
                            onClick={() => centerOnPoint(index)}
                            className={`h-6 px-1.5 py-0 text-xs border-[#6B7280] ${
                              selectedPointIndex === index
                                ? "bg-[#4B5563] text-[#F9FAFB]" // Dark gray active background, light text
                                : isStartPoint(index)
                                  ? "text-[#166534]" // Dark green text
                                  : isEndPoint(index)
                                    ? "text-[#991B1B]" // Dark red text
                                    : "text-[#3B82F6]" // Blue text (adjust as needed for light theme)
                            } hover:bg-[#D1D5DB]/20`}
                          >
                            {point.id}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#1F2937] text-xs block mb-1">Keyboard shortcuts:</span> {/* Dark text */}
                      <div className="grid grid-cols-2 gap-1 text-[#4B5563] text-xs"> {/* Dark gray text */}
                        <span>Arrow keys: Move</span>
                        <span>+/-: Zoom in/out</span>
                        <span>0: Reset view</span>
                        <span>a: Toggle alternatives</span>
                        <span>p: Play/stop animation</span>
                        <span>Click: Select point</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`bg-gradient-to-b ${
                  mapStyle === "satellite"
                    ? "from-[#E0E0E0] to-[#F5F5F5]" // Light grays for satellite
                    : mapStyle === "terrain"
                      ? "from-[#C8E6C9] to-[#E8F5E9]" // Light greens for terrain
                      : "from-[#E3F2FD] to-[#F3E5F5]" // Light blues/purples for standard (adjust as needed)
                } p-3 rounded-md shadow-lg`}
                ref={containerRef}
                style={{ minHeight: "500px" }}
                tabIndex={0} // Make div focusable for keyboard events
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
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <div className="bg-[#E5E7EB] p-4 rounded-md"> {/* Light gray background */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[#1F2937] font-medium mb-2">Map Style</h3> {/* Dark text */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={mapStyle === "standard" ? "default" : "outline"}
                        onClick={() => setMapStyle("standard")}
                        className={`${
                          mapStyle === "standard"
                            ? "bg-[#4B5563] hover:bg-[#4B5563]/90 text-[#F9FAFB]" // Dark gray active background, light text
                            : "border-[#6B7280] text-[#374151]" // Medium gray border, medium-dark text
                        }`}
                      >
                        Standard
                      </Button>
                      <Button
                        variant={mapStyle === "satellite" ? "default" : "outline"}
                        onClick={() => setMapStyle("satellite")}
                        className={`${
                          mapStyle === "satellite"
                            ? "bg-[#4B5563] hover:bg-[#4B5563]/90 text-[#F9FAFB]"
                            : "border-[#6B7280] text-[#374151]"
                        }`}
                      >
                        Satellite
                      </Button>
                      <Button
                        variant={mapStyle === "terrain" ? "default" : "outline"}
                        onClick={() => setMapStyle("terrain")}
                        className={`${
                          mapStyle === "terrain"
                            ? "bg-[#4B5563] hover:bg-[#4B5563]/90 text-[#F9FAFB]"
                            : "border-[#6B7280] text-[#374151]"
                        }`}
                      >
                        Terrain
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[#1F2937] font-medium mb-2">Route Display</h3> {/* Dark text */}
                    <div className="flex items-center space-x-2 mb-2">
                      <Button
                        variant={showAlternativeRoutes ? "default" : "outline"}
                        onClick={toggleAlternativeRoutes}
                        className={`${
                          showAlternativeRoutes
                            ? "bg-[#4B5563] hover:bg-[#4B5563]/90 text-[#F9FAFB]"
                            : "border-[#6B7280] text-[#374151]"
                        }`}
                      >
                        {showAlternativeRoutes ? "Hide Alternative Routes" : "Show Alternative Routes"}
                      </Button>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-[#1F2937] text-sm mb-2">Route Colors Legend</h4> {/* Dark text */}
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center">
                          <div className="w-16 h-4 bg-gradient-to-r from-[#6B7280] via-[#9CA3AF] to-[#D1D5DB] mr-2 rounded-full"></div> {/* Grayscale gradient */}
                          <span className="text-[#1F2937] text-sm">Nearest Neighbor (Default)</span> {/* Dark text */}
                        </div>
                        <div className="flex items-center">
                          <div className="w-16 h-4 bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F43F5E] mr-2 rounded-full"></div> {/* Adjusted for light theme visibility */}
                          <span className="text-[#1F2937] text-sm">Genetic Algorithm</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-16 h-4 bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] mr-2 rounded-full"></div> {/* Adjusted for light theme visibility */}
                          <span className="text-[#1F2937] text-sm">Simulated Annealing</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-16 h-4 bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#60A5FA] mr-2 rounded-full"></div> {/* Adjusted for light theme visibility */}
                          <span className="text-[#1F2937] text-sm">A* Algorithm</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[#1F2937] font-medium mb-2">Animation Controls</h3> {/* Dark text */}
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={toggleAnimation} className="border-[#6B7280] text-[#374151]"> {/* Medium gray border, medium-dark text */}
                        {isAnimating ? (
                          <>
                            <Square className="h-4 w-4 mr-2" />
                            Stop Animation
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Animate Route
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 bg-[#E5E7EB] p-3 rounded-md"> {/* Light gray background */}
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#A7F3D0] to-[#6EE7B7] mr-2 shadow-sm shadow-[#6EE7B7]"></div> {/* Light green gradient */}
              <span className="text-[#1F2937]">Starting Point</span> {/* Dark text */}
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#FECACA] to-[#FCA5A5] mr-2 shadow-sm shadow-[#FCA5A5]"></div> {/* Light red gradient */}
              <span className="text-[#1F2937]">Ending Point</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#BFDBFE] to-[#93C5FD] mr-2 shadow-sm shadow-[#93C5FD]"></div> {/* Light blue gradient */}
              <span className="text-[#1F2937]">Waypoints</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-8 bg-gradient-to-r from-[#6B7280] via-[#9CA3AF] to-[#D1D5DB] mr-2 rounded-full"></div> {/* Grayscale gradient */}
              <span className="text-[#1F2937]">Optimal Route</span>
            </div>
          </div>

          <div className="text-sm text-[#1F2937] bg-[#E5E7EB] p-3 rounded-md"> {/* Dark text, light gray background */}
            <p className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-[#F87171] mr-2"></span> {/* Light red indicator */}
              Click on points to select and view details
            </p>
            <p className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-[#4ADE80] mr-2"></span> {/* Light green indicator */}
              Drag to pan the map, use buttons or mouse wheel to zoom
            </p>
            <p className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-[#60A5FA] mr-2"></span> {/* Light blue indicator */}
              Toggle alternative routes to compare different optimization methods
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
