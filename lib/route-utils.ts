import type { RoutePoint, RouteSegment, CalculatedRoute, OptimizationMethod } from "./types"

/**
 * Parse route data from multiple lines of text
 * Each line format: "id description latitude longitude"
 */
export function parseRouteData(routeData: string): RoutePoint[] {
  const lines = routeData.split("\n").filter((line) => line.trim() !== "")

  return lines.map((line) => {
    const parts = line.trim().split(/\s+/)

    if (parts.length < 4) {
      throw new Error(`Invalid route format in line: "${line}". Expected: id description latitude longitude`)
    }

    const id = Number.parseInt(parts[0], 10)
    // The description might contain multiple words, so we need to get the last two parts as coordinates
    const longitude = Number.parseFloat(parts[parts.length - 1])
    const latitude = Number.parseFloat(parts[parts.length - 2])
    // Everything between the id and coordinates is the description
    const description = parts.slice(1, parts.length - 2).join(" ")

    if (isNaN(id) || isNaN(latitude) || isNaN(longitude)) {
      throw new Error(`Invalid numeric values in line: "${line}"`)
    }

    return {
      id,
      description,
      latitude,
      longitude,
    }
  })
}

/**
 * Parse route data from a single string
 * Format: "id/description/latitude/longitude"
 */
export function parseRouteString(routeString: string): RoutePoint {
  const parts = routeString.split("/")

  if (parts.length !== 4) {
    throw new Error("Invalid route format. Expected: id/description/latitude/longitude")
  }

  const id = Number.parseInt(parts[0], 10)
  const description = parts[1]
  const latitude = Number.parseFloat(parts[2])
  const longitude = Number.parseFloat(parts[3])

  if (isNaN(id) || isNaN(latitude) || isNaN(longitude)) {
    throw new Error("Invalid route format. ID, latitude, and longitude must be numbers.")
  }

  return {
    id,
    description,
    latitude,
    longitude,
  }
}

/**
 * Calculate distance between two points using the Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km

  return distance
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Calculate the optimal route using the specified algorithm
 */
export function calculateOptimalRoute(
  points: RoutePoint[],
  method: OptimizationMethod = "nearest-neighbor",
): CalculatedRoute {
  console.log(`Calculating optimal route using ${method} for ${points.length} points`)

  const startTime = performance.now()
  let result: CalculatedRoute

  switch (method) {
    case "genetic-algorithm":
      result = calculateRouteGeneticAlgorithm(points)
      break
    case "simulated-annealing":
      result = calculateRouteSimulatedAnnealing(points)
      break
    case "a-star":
      result = calculateRouteAStar(points)
      break
    case "brute-force":
      result = calculateRouteBruteForce(points)
      break
    case "nearest-neighbor":
    default:
      result = calculateRouteNearestNeighbor(points)
  }

  const endTime = performance.now()
  result.executionTime = endTime - startTime
  result.optimizationMethod = method

  console.log(`Route calculated using ${method} in ${result.executionTime.toFixed(2)}ms:`, {
    totalDistance: result.totalDistance,
    pathLength: result.path.length,
    segmentsLength: result.segments.length,
  })

  return result
}

/**
 * Calculate a route with specific start and end points
 */
export function calculateRouteWithEndpoints(
  points: RoutePoint[],
  startIndex: number,
  endIndex: number,
  method: OptimizationMethod = "nearest-neighbor",
): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  console.log(`Calculating route with fixed endpoints using ${method}: start=${startIndex}, end=${endIndex}`)

  const startTime = performance.now()
  let result: CalculatedRoute

  switch (method) {
    case "genetic-algorithm":
      result = calculateRouteWithEndpointsGeneticAlgorithm(points, startIndex, endIndex)
      break
    case "simulated-annealing":
      result = calculateRouteWithEndpointsSimulatedAnnealing(points, startIndex, endIndex)
      break
    case "a-star":
      result = calculateRouteWithEndpointsAStar(points, startIndex, endIndex)
      break
    case "nearest-neighbor":
    default:
      result = calculateRouteWithEndpointsNearestNeighbor(points, startIndex, endIndex)
  }

  const endTime = performance.now()
  result.executionTime = endTime - startTime
  result.optimizationMethod = method

  console.log(`Route with endpoints calculated using ${method} in ${result.executionTime.toFixed(2)}ms:`, {
    totalDistance: result.totalDistance,
    pathLength: result.path.length,
    segmentsLength: result.segments.length,
    startPoint: points[startIndex].id,
    endPoint: points[endIndex].id,
  })

  return result
}

/**
 * Calculate the optimal route using the nearest neighbor algorithm
 */
export function calculateRouteNearestNeighbor(points: RoutePoint[]): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  // Create a distance matrix
  const distances: number[][] = createDistanceMatrix(points)

  // Nearest neighbor algorithm
  const visited = new Set<number>([0]) // Start with the first point
  const path = [0] // Path of indices

  while (visited.size < points.length) {
    const lastPoint = path[path.length - 1]
    let nearestPoint = -1
    let minDistance = Number.POSITIVE_INFINITY

    // Find the nearest unvisited point
    for (let i = 0; i < points.length; i++) {
      if (!visited.has(i) && distances[lastPoint][i] < minDistance) {
        nearestPoint = i
        minDistance = distances[lastPoint][i]
      }
    }

    if (nearestPoint === -1) {
      console.error("Failed to find next nearest point. This shouldn't happen.")
      break
    }

    path.push(nearestPoint)
    visited.add(nearestPoint)
  }

  // Calculate segments and total distance
  const { segments, totalDistance } = calculateSegmentsAndDistance(path, distances)

  return {
    totalDistance,
    segments,
    path,
    optimizationMethod: "nearest-neighbor",
  }
}

/**
 * Calculate a route with specific start and end points using nearest neighbor
 */
export function calculateRouteWithEndpointsNearestNeighbor(
  points: RoutePoint[],
  startIndex: number,
  endIndex: number,
): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  // Create a distance matrix
  const distances: number[][] = createDistanceMatrix(points)

  // Modified nearest neighbor algorithm with fixed start and end
  const visited = new Set<number>([startIndex]) // Start with the specified start point
  const path = [startIndex] // Path of indices

  // Visit all points except the end point
  while (visited.size < points.length - 1) {
    const lastPoint = path[path.length - 1]
    let nearestPoint = -1
    let minDistance = Number.POSITIVE_INFINITY

    // Find the nearest unvisited point (excluding the end point)
    for (let i = 0; i < points.length; i++) {
      if (!visited.has(i) && i !== endIndex && distances[lastPoint][i] < minDistance) {
        nearestPoint = i
        minDistance = distances[lastPoint][i]
      }
    }

    // If no more points to visit (except end), break
    if (nearestPoint === -1) break

    path.push(nearestPoint)
    visited.add(nearestPoint)
  }

  // Add the end point
  path.push(endIndex)

  // Calculate segments and total distance
  const { segments, totalDistance } = calculateSegmentsAndDistance(path, distances)

  return {
    totalDistance,
    segments,
    path,
    optimizationMethod: "nearest-neighbor",
  }
}

/**
 * Calculate the optimal route using a genetic algorithm
 * This is a more advanced algorithm that can find Melhor Rotas than nearest neighbor
 */
export function calculateRouteGeneticAlgorithm(points: RoutePoint[]): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  // Create a distance matrix
  const distances: number[][] = createDistanceMatrix(points)

  // Genetic algorithm parameters
  const populationSize = 50
  const generations = 100
  const mutationRate = 0.1
  const elitismCount = 5

  // Initialize population with random routes
  let population: number[][] = []
  for (let i = 0; i < populationSize; i++) {
    population.push(generateRandomRoute(points.length))
  }

  // Evaluate fitness for each route in the population
  let fitnesses: number[] = population.map((route) => 1 / calculateRouteDistance(route, distances))

  // Main genetic algorithm loop
  for (let generation = 0; generation < generations; generation++) {
    // Create new population
    const newPopulation: number[][] = []

    // Elitism: keep the best routes
    const elites = getElites(population, fitnesses, elitismCount)
    newPopulation.push(...elites)

    // Fill the rest of the population with crossover and mutation
    while (newPopulation.length < populationSize) {
      // Select parents using tournament selection
      const parent1 = tournamentSelection(population, fitnesses, 3)
      const parent2 = tournamentSelection(population, fitnesses, 3)

      // Crossover
      let child = crossover(parent1, parent2)

      // Mutation
      if (Math.random() < mutationRate) {
        child = mutate(child)
      }

      newPopulation.push(child)
    }

    // Update population and fitnesses
    population = newPopulation
    fitnesses = population.map((route) => 1 / calculateRouteDistance(route, distances))
  }

  // Get the best route
  const bestRouteIndex = fitnesses.indexOf(Math.max(...fitnesses))
  const bestRoute = population[bestRouteIndex]

  // Calculate segments and total distance
  const { segments, totalDistance } = calculateSegmentsAndDistance(bestRoute, distances)

  return {
    totalDistance,
    segments,
    path: bestRoute,
    optimizationMethod: "genetic-algorithm",
  }
}

/**
 * Calculate a route with specific start and end points using genetic algorithm
 */
export function calculateRouteWithEndpointsGeneticAlgorithm(
  points: RoutePoint[],
  startIndex: number,
  endIndex: number,
): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  // If only 2 points, return direct route
  if (points.length === 2) {
    const distances = createDistanceMatrix(points)
    const path = [startIndex, endIndex]
    const { segments, totalDistance } = calculateSegmentsAndDistance(path, distances)

    return {
      totalDistance,
      segments,
      path,
      optimizationMethod: "genetic-algorithm",
    }
  }

  // Create a distance matrix
  const distances: number[][] = createDistanceMatrix(points)

  // Genetic algorithm parameters
  const populationSize = 50
  const generations = 100
  const mutationRate = 0.1
  const elitismCount = 5

  // Initialize population with random routes that start with startIndex and end with endIndex
  let population: number[][] = []
  for (let i = 0; i < populationSize; i++) {
    population.push(generateRandomRouteWithEndpoints(points.length, startIndex, endIndex))
  }

  // Evaluate fitness for each route in the population
  let fitnesses: number[] = population.map((route) => 1 / calculateRouteDistance(route, distances))

  // Main genetic algorithm loop
  for (let generation = 0; generation < generations; generation++) {
    // Create new population
    const newPopulation: number[][] = []

    // Elitism: keep the best routes
    const elites = getElites(population, fitnesses, elitismCount)
    newPopulation.push(...elites)

    // Fill the rest of the population with crossover and mutation
    while (newPopulation.length < populationSize) {
      // Select parents using tournament selection
      const parent1 = tournamentSelection(population, fitnesses, 3)
      const parent2 = tournamentSelection(population, fitnesses, 3)

      // Crossover with fixed endpoints
      let child = crossoverWithFixedEndpoints(parent1, parent2, startIndex, endIndex)

      // Mutation with fixed endpoints
      if (Math.random() < mutationRate) {
        child = mutateWithFixedEndpoints(child, startIndex, endIndex)
      }

      newPopulation.push(child)
    }

    // Update population and fitnesses
    population = newPopulation
    fitnesses = population.map((route) => 1 / calculateRouteDistance(route, distances))
  }

  // Get the best route
  const bestRouteIndex = fitnesses.indexOf(Math.max(...fitnesses))
  const bestRoute = population[bestRouteIndex]

  // Calculate segments and total distance
  const { segments, totalDistance } = calculateSegmentsAndDistance(bestRoute, distances)

  return {
    totalDistance,
    segments,
    path: bestRoute,
    optimizationMethod: "genetic-algorithm",
  }
}

/**
 * Calculate the optimal route using simulated annealing
 */
export function calculateRouteSimulatedAnnealing(points: RoutePoint[]): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  // Create a distance matrix
  const distances: number[][] = createDistanceMatrix(points)

  // Simulated annealing parameters
  const initialTemperature = 1000
  const coolingRate = 0.995
  const iterations = 10000

  // Start with a random solution
  let currentRoute = generateRandomRoute(points.length)
  let currentDistance = calculateRouteDistance(currentRoute, distances)

  let bestRoute = [...currentRoute]
  let bestDistance = currentDistance

  let temperature = initialTemperature

  // Main simulated annealing loop
  for (let i = 0; i < iterations; i++) {
    // Create a neighboring solution by swapping two cities
    const newRoute = [...currentRoute]
    const idx1 = Math.floor(Math.random() * points.length)
    let idx2 = Math.floor(Math.random() * points.length)

    // Make sure idx2 is different from idx1
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * points.length)
    }
    // Swap
    ;[newRoute[idx1], newRoute[idx2]] = [newRoute[idx2], newRoute[idx1]]

    // Calculate the new distance
    const newDistance = calculateRouteDistance(newRoute, distances)

    // Decide whether to accept the new solution
    if (newDistance < currentDistance) {
      // Accept better solution
      currentRoute = newRoute
      currentDistance = newDistance

      // Update best solution if needed
      if (newDistance < bestDistance) {
        bestRoute = [...newRoute]
        bestDistance = newDistance
      }
    } else {
      // Accept worse solution with a probability that decreases as temperature decreases
      const acceptanceProbability = Math.exp((currentDistance - newDistance) / temperature)
      if (Math.random() < acceptanceProbability) {
        currentRoute = newRoute
        currentDistance = newDistance
      }
    }

    // Cool down
    temperature *= coolingRate
  }

  // Calculate segments and total distance
  const { segments, totalDistance } = calculateSegmentsAndDistance(bestRoute, distances)

  return {
    totalDistance,
    segments,
    path: bestRoute,
    optimizationMethod: "simulated-annealing",
  }
}

/**
 * Calculate a route with specific start and end points using simulated annealing
 */
export function calculateRouteWithEndpointsSimulatedAnnealing(
  points: RoutePoint[],
  startIndex: number,
  endIndex: number,
): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  // If only 2 points, return direct route
  if (points.length === 2) {
    const distances = createDistanceMatrix(points)
    const path = [startIndex, endIndex]
    const { segments, totalDistance } = calculateSegmentsAndDistance(path, distances)

    return {
      totalDistance,
      segments,
      path,
      optimizationMethod: "simulated-annealing",
    }
  }

  // Create a distance matrix
  const distances: number[][] = createDistanceMatrix(points)

  // Simulated annealing parameters
  const initialTemperature = 1000
  const coolingRate = 0.995
  const iterations = 10000

  // Start with a random solution with fixed endpoints
  let currentRoute = generateRandomRouteWithEndpoints(points.length, startIndex, endIndex)
  let currentDistance = calculateRouteDistance(currentRoute, distances)

  let bestRoute = [...currentRoute]
  let bestDistance = currentDistance

  let temperature = initialTemperature

  // Main simulated annealing loop
  for (let i = 0; i < iterations; i++) {
    // Create a neighboring solution by swapping two cities (excluding start and end)
    const newRoute = [...currentRoute]

    // Get random indices excluding start and end
    const validIndices = Array.from({ length: points.length - 2 }, (_, i) => i + 1).filter(
      (idx) => idx !== 0 && idx !== points.length - 1,
    )

    if (validIndices.length >= 2) {
      const idx1Pos = Math.floor(Math.random() * validIndices.length)
      const idx1 = validIndices[idx1Pos]

      // Remove idx1 from valid indices for idx2
      validIndices.splice(idx1Pos, 1)

      const idx2 = (validIndices[Math.floor(Math.random() * validIndices.length)][
        // Swap
        (newRoute[idx1], newRoute[idx2])
      ] = [newRoute[idx2], newRoute[idx1]])

      // Calculate the new distance
      const newDistance = calculateRouteDistance(newRoute, distances)

      // Decide whether to accept the new solution
      if (newDistance < currentDistance) {
        // Accept better solution
        currentRoute = newRoute
        currentDistance = newDistance

        // Update best solution if needed
        if (newDistance < bestDistance) {
          bestRoute = [...newRoute]
          bestDistance = newDistance
        }
      } else {
        // Accept worse solution with a probability that decreases as temperature decreases
        const acceptanceProbability = Math.exp((currentDistance - newDistance) / temperature)
        if (Math.random() < acceptanceProbability) {
          currentRoute = newRoute
          currentDistance = newDistance
        }
      }
    }

    // Cool down
    temperature *= coolingRate
  }

  // Calculate segments and total distance
  const { segments, totalDistance } = calculateSegmentsAndDistance(bestRoute, distances)

  return {
    totalDistance,
    segments,
    path: bestRoute,
    optimizationMethod: "simulated-annealing",
  }
}

/**
 * Calculate the optimal route using A* algorithm
 * Note: A* is typically used for finding the shortest path between two points,
 * but we adapt it for the TSP problem
 */
export function calculateRouteAStar(points: RoutePoint[]): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  // For small number of points, use brute force for optimal solution
  if (points.length <= 10) {
    return calculateRouteBruteForce(points)
  }

  // Create a distance matrix
  const distances: number[][] = createDistanceMatrix(points)

  // Start with a greedy solution (nearest neighbor)
  const greedyPath = calculateRouteNearestNeighbor(points).path

  // Use A* to improve the greedy solution
  const path = improveRouteWithAStar(greedyPath, distances)

  // Calculate segments and total distance
  const { segments, totalDistance } = calculateSegmentsAndDistance(path, distances)

  return {
    totalDistance,
    segments,
    path,
    optimizationMethod: "a-star",
  }
}

/**
 * Calculate a route with specific start and end points using A* algorithm
 */
export function calculateRouteWithEndpointsAStar(
  points: RoutePoint[],
  startIndex: number,
  endIndex: number,
): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  // If only 2 points, return direct route
  if (points.length === 2) {
    const distances = createDistanceMatrix(points)
    const path = [startIndex, endIndex]
    const { segments, totalDistance } = calculateSegmentsAndDistance(path, distances)

    return {
      totalDistance,
      segments,
      path,
      optimizationMethod: "a-star",
    }
  }

  // Create a distance matrix
  const distances = createDistanceMatrix(points)

  // Start with a greedy solution (nearest neighbor with fixed endpoints)
  const greedyPath = calculateRouteWithEndpointsNearestNeighbor(points, startIndex, endIndex).path

  // Use A* to improve the greedy solution while keeping endpoints fixed
  const path = improveRouteWithAStarFixedEndpoints(greedyPath, distances, startIndex, endIndex)

  // Calculate segments and total distance
  const { segments, totalDistance } = calculateSegmentsAndDistance(path, distances)

  return {
    totalDistance,
    segments,
    path,
    optimizationMethod: "a-star",
  }
}

/**
 * Calculate the optimal route using brute force (exact solution)
 * Warning: This is O(n!) and should only be used for small numbers of points
 */
export function calculateRouteBruteForce(points: RoutePoint[]): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  // For more than 10 points, this will be too slow
  if (points.length > 10) {
    console.warn("Brute force is too slow for more than 10 points. Using nearest neighbor instead.")
    return calculateRouteNearestNeighbor(points)
  }

  // Create a distance matrix
  const distances: number[][] = createDistanceMatrix(points)

  // Generate all possible permutations
  const permutations = generatePermutations(points.length)

  // Find the shortest route
  let shortestDistance = Number.POSITIVE_INFINITY
  let shortestPath: number[] = []

  for (const path of permutations) {
    const distance = calculateRouteDistance(path, distances)

    if (distance < shortestDistance) {
      shortestDistance = distance
      shortestPath = [...path]
    }
  }

  // Calculate segments and total distance
  const { segments, totalDistance } = calculateSegmentsAndDistance(shortestPath, distances)

  return {
    totalDistance,
    segments,
    path: shortestPath,
    optimizationMethod: "brute-force",
  }
}

// Helper functions

/**
 * Create a distance matrix for all points
 */
function createDistanceMatrix(points: RoutePoint[]): number[][] {
  const distances: number[][] = []

  for (let i = 0; i < points.length; i++) {
    distances[i] = []
    for (let j = 0; j < points.length; j++) {
      if (i === j) {
        distances[i][j] = 0
      } else {
        distances[i][j] = calculateDistance(
          points[i].latitude,
          points[i].longitude,
          points[j].latitude,
          points[j].longitude,
        )
      }
    }
  }

  return distances
}

/**
 * Calculate segments and total distance for a path
 */
function calculateSegmentsAndDistance(
  path: number[],
  distances: number[][],
): { segments: RouteSegment[]; totalDistance: number } {
  const segments: RouteSegment[] = []
  let totalDistance = 0

  for (let i = 0; i < path.length - 1; i++) {
    const fromIndex = path[i]
    const toIndex = path[i + 1]
    const distance = distances[fromIndex][toIndex]

    segments.push({
      fromIndex,
      toIndex,
      distance,
    })

    totalDistance += distance
  }

  return { segments, totalDistance }
}

/**
 * Calculate the total distance of a route
 */
function calculateRouteDistance(route: number[], distances: number[][]): number {
  let totalDistance = 0

  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += distances[route[i]][route[i + 1]]
  }

  return totalDistance
}

/**
 * Generate a random route
 */
function generateRandomRoute(numPoints: number): number[] {
  const route = Array.from({ length: numPoints }, (_, i) => i)

  // Shuffle the array (Fisher-Yates algorithm)
  for (let i = route.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[route[i], route[j]] = [route[j], route[i]]
  }

  return route
}

/**
 * Generate a random route with fixed start and end points
 */
function generateRandomRouteWithEndpoints(numPoints: number, startIndex: number, endIndex: number): number[] {
  // Create array of indices excluding start and end
  const middleIndices = Array.from({ length: numPoints }, (_, i) => i).filter((i) => i !== startIndex && i !== endIndex)

  // Shuffle the middle indices
  for (let i = middleIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[middleIndices[i], middleIndices[j]] = [middleIndices[j], middleIndices[i]]
  }

  // Construct the route with fixed start and end
  return [startIndex, ...middleIndices, endIndex]
}

/**
 * Get the elite (best) routes from a population
 */
function getElites(population: number[][], fitnesses: number[], count: number): number[][] {
  // Create array of indices
  const indices = Array.from({ length: population.length }, (_, i) => i)

  // Sort indices by fitness (descending)
  indices.sort((a, b) => fitnesses[b] - fitnesses[a])

  // Return the top 'count' routes
  return indices.slice(0, count).map((i) => [...population[i]])
}

/**
 * Tournament selection for genetic algorithm
 */
function tournamentSelection(population: number[][], fitnesses: number[], tournamentSize: number): number[] {
  // Randomly select tournamentSize individuals
  const tournamentIndices: number[] = []

  for (let i = 0; i < tournamentSize; i++) {
    tournamentIndices.push(Math.floor(Math.random() * population.length))
  }

  // Find the best individual in the tournament
  let bestIndex = tournamentIndices[0]

  for (let i = 1; i < tournamentSize; i++) {
    if (fitnesses[tournamentIndices[i]] > fitnesses[bestIndex]) {
      bestIndex = tournamentIndices[i]
    }
  }

  return [...population[bestIndex]]
}

/**
 * Crossover operation for genetic algorithm
 */
function crossover(parent1: number[], parent2: number[]): number[] {
  const size = parent1.length

  // Select random crossover points
  const start = Math.floor(Math.random() * size)
  const end = start + Math.floor(Math.random() * (size - start))

  // Create child with segment from parent1
  const child = Array(size).fill(-1)

  for (let i = start; i <= end; i++) {
    child[i] = parent1[i]
  }

  // Fill remaining positions with cities from parent2 (in order)
  let parent2Index = 0

  for (let i = 0; i < size; i++) {
    if (child[i] === -1) {
      // Find next city from parent2 that's not already in child
      while (child.includes(parent2[parent2Index])) {
        parent2Index++
      }

      child[i] = parent2[parent2Index]
      parent2Index++
    }
  }

  return child
}

/**
 * Crossover operation for genetic algorithm with fixed endpoints
 */
function crossoverWithFixedEndpoints(
  parent1: number[],
  parent2: number[],
  startIndex: number,
  endIndex: number,
): number[] {
  const size = parent1.length

  // Create child with fixed start and end
  const child = Array(size).fill(-1)
  child[0] = startIndex
  child[size - 1] = endIndex

  // Select random crossover points (excluding start and end)
  const start = 1 + Math.floor(Math.random() * (size - 2))
  const end = start + Math.floor(Math.random() * (size - start - 1))

  // Copy segment from parent1
  for (let i = start; i <= end; i++) {
    child[i] = parent1[i]
  }

  // Fill remaining positions with cities from parent2 (in order)
  let parent2Index = 0

  for (let i = 1; i < size - 1; i++) {
    if (child[i] === -1) {
      // Find next city from parent2 that's not already in child
      while (child.includes(parent2[parent2Index])) {
        parent2Index++
      }

      child[i] = parent2[parent2Index]
      parent2Index++
    }
  }

  return child
}

/**
 * Mutation operation for genetic algorithm
 */
function mutate(route: number[]): number[] {
  const mutatedRoute = [...route]

  // Swap two random cities
  const idx1 = Math.floor(Math.random() * route.length)
  let idx2 = Math.floor(Math.random() * route.length)

  // Make sure idx2 is different from idx1
  while (idx2 === idx1) {
    idx2 = Math.floor(Math.random() * route.length)
  }
  // Swap
  ;[mutatedRoute[idx1], mutatedRoute[idx2]] = [mutatedRoute[idx2], mutatedRoute[idx1]]

  return mutatedRoute
}

/**
 * Mutation operation for genetic algorithm with fixed endpoints
 */
function mutateWithFixedEndpoints(route: number[], startIndex: number, endIndex: number): number[] {
  const mutatedRoute = [...route]

  // Only mutate middle points (not start or end)
  if (route.length <= 2) return mutatedRoute

  // Swap two random cities (excluding start and end)
  const idx1 = 1 + Math.floor(Math.random() * (route.length - 2))
  let idx2 = 1 + Math.floor(Math.random() * (route.length - 2))

  // Make sure idx2 is different from idx1
  while (idx2 === idx1) {
    idx2 = 1 + Math.floor(Math.random() * (route.length - 2))
  }
  // Swap
  ;[mutatedRoute[idx1], mutatedRoute[idx2]] = [mutatedRoute[idx2], mutatedRoute[idx1]]

  return mutatedRoute
}

/**
 * Improve a route using A* algorithm
 */
function improveRouteWithAStar(initialRoute: number[], distances: number[][]): number[] {
  const size = initialRoute.length
  let currentRoute = [...initialRoute]
  let currentDistance = calculateRouteDistance(currentRoute, distances)
  let improved = true

  // Continue until no more improvements can be made
  while (improved) {
    improved = false

    // Try to improve by swapping pairs of edges
    for (let i = 0; i < size - 2; i++) {
      for (let j = i + 2; j < size - (i === 0 ? 1 : 0); j++) {
        // Skip adjacent edges
        if (j === i + 1) continue

        // Try 2-opt swap: replace edges (i,i+1) and (j,j+1) with (i,j) and (i+1,j+1)
        const newRoute = [...currentRoute]

        // Reverse the segment between i+1 and j
        let left = i + 1
        let right = j

        while (left < right) {
          ;[newRoute[left], newRoute[right]] = [newRoute[right], newRoute[left]]
          left++
          right--
        }

        const newDistance = calculateRouteDistance(newRoute, distances)

        if (newDistance < currentDistance) {
          currentRoute = newRoute
          currentDistance = newDistance
          improved = true
          break
        }
      }

      if (improved) break
    }
  }

  return currentRoute
}

/**
 * Improve a route using A* algorithm with fixed endpoints
 */
function improveRouteWithAStarFixedEndpoints(
  initialRoute: number[],
  distances: number[][],
  startIndex: number,
  endIndex: number,
): number[] {
  const size = initialRoute.length

  // If route is too small, no improvement needed
  if (size <= 3) return initialRoute

  let currentRoute = [...initialRoute]
  let currentDistance = calculateRouteDistance(currentRoute, distances)
  let improved = true

  // Continue until no more improvements can be made
  while (improved) {
    improved = false

    // Try to improve by swapping pairs of edges (excluding start and end)
    for (let i = 0; i < size - 2; i++) {
      // Skip if this would affect the start or end
      if (i === 0 && currentRoute[0] !== startIndex) continue

      for (let j = i + 2; j < size - (i === 0 ? 1 : 0); j++) {
        // Skip if this would affect the end
        if (j === size - 1 && currentRoute[size - 1] !== endIndex) continue

        // Skip adjacent edges
        if (j === i + 1) continue

        // Try 2-opt swap: replace edges (i,i+1) and (j,j+1) with (i,j) and (i+1,j+1)
        const newRoute = [...currentRoute]

        // Reverse the segment between i+1 and j
        let left = i + 1
        let right = j

        while (left < right) {
          ;[newRoute[left], newRoute[right]] = [newRoute[right], newRoute[left]]
          left++
          right--
        }

        const newDistance = calculateRouteDistance(newRoute, distances)

        if (newDistance < currentDistance) {
          currentRoute = newRoute
          currentDistance = newDistance
          improved = true
          break
        }
      }

      if (improved) break
    }
  }

  return currentRoute
}

/**
 * Generate all permutations of indices (for brute force)
 */
function generatePermutations(n: number): number[][] {
  const result: number[][] = []
  const indices = Array.from({ length: n }, (_, i) => i)

  function permute(arr: number[], start: number): void {
    if (start === arr.length - 1) {
      result.push([...arr])
      return
    }

    for (let i = start; i < arr.length; i++) {
      // Swap
      ;[arr[start], arr[i]] = [arr[i], arr[start]]

      // Recurse
      permute(arr, start + 1)[
        // Backtrack
        (arr[start], arr[i])
      ] = [arr[i], arr[start]]
    }
  }

  permute(indices, 0)
  return result
}

/**
 * Legacy function for backward compatibility
 */
export function calculateRoute(points: RoutePoint[]): CalculatedRoute {
  return calculateOptimalRoute(points, "nearest-neighbor")
}
