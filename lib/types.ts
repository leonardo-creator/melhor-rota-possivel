export interface RoutePoint {
  id: number
  description: string
  latitude: number
  longitude: number
}

export interface RouteSegment {
  fromIndex: number
  toIndex: number
  distance: number
}

export interface CalculatedRoute {
  totalDistance: number
  segments: RouteSegment[]
  path: number[] // Indices of points in order of visit
  optimizationMethod?: OptimizationMethod
  executionTime?: number // Time taken to calculate the route in ms
}

export type OptimizationMethod =
  | "nearest-neighbor"
  | "genetic-algorithm"
  | "simulated-annealing"
  | "a-star"
  | "brute-force"
