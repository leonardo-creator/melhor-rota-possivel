interface RoutePoint {
  id: number
  description: string
  latitude: number
  longitude: number
}

interface RouteSegment {
  fromIndex: number
  toIndex: number
  distance: number
}

interface CalculatedRoute {
  totalDistance: number
  segments: RouteSegment[]
  path: number[] // Indices of points in order of visit
}
