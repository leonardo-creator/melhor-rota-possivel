import type { RoutePoint, RouteSegment, CalculatedRoute } from "./types"
import { calculateDistance } from "./route-utils"

/**
 * Calculate the optimal route using the nearest neighbor algorithm
 * This is a greedy algorithm that always chooses the closest unvisited point
 */
export function nearestNeighborAlgorithm(points: RoutePoint[], startIndex = 0, endIndex?: number): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  // Create a distance matrix
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

  // Initialize the path with the start point
  const visited = new Set<number>([startIndex])
  const path = [startIndex]

  // If we have a fixed end point, we need to handle it specially
  const hasFixedEnd = endIndex !== undefined && endIndex !== startIndex

  // Visit all points except possibly the end point
  while (visited.size < (hasFixedEnd ? points.length - 1 : points.length)) {
    const lastPoint = path[path.length - 1]
    let nearestPoint = -1
    let minDistance = Number.POSITIVE_INFINITY

    // Find the nearest unvisited point (excluding the end point if it's fixed)
    for (let i = 0; i < points.length; i++) {
      if (!visited.has(i) && (hasFixedEnd ? i !== endIndex : true) && distances[lastPoint][i] < minDistance) {
        nearestPoint = i
        minDistance = distances[lastPoint][i]
      }
    }

    // If no more points to visit (except possibly the end), break
    if (nearestPoint === -1) break

    path.push(nearestPoint)
    visited.add(nearestPoint)
  }

  // Add the end point if it's fixed
  if (hasFixedEnd) {
    path.push(endIndex)
  }

  // Calculate segments and total distance
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

  return {
    totalDistance,
    segments,
    path,
  }
}

/**
 * Calculate the optimal route using the 2-opt algorithm
 * This algorithm improves an initial route by swapping edges to reduce total distance
 */
export function twoOptAlgorithm(
  points: RoutePoint[],
  startIndex = 0,
  endIndex?: number,
  maxIterations = 100,
): CalculatedRoute {
  // Start with the nearest neighbor solution
  const initialRoute = nearestNeighborAlgorithm(points, startIndex, endIndex)
  const path = [...initialRoute.path]

  // Create a distance matrix
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

  // Check if we have fixed endpoints
  const hasFixedStart = startIndex !== undefined
  const hasFixedEnd = endIndex !== undefined && endIndex !== startIndex

  // 2-opt algorithm
  let improved = true
  let iteration = 0

  while (improved && iteration < maxIterations) {
    improved = false
    iteration++

    // Try all possible edge swaps
    for (let i = hasFixedStart ? 1 : 0; i < path.length - 2; i++) {
      for (let j = i + 1; j < (hasFixedEnd ? path.length - 1 : path.length); j++) {
        // Skip adjacent edges
        if (j === i + 1) continue

        // Calculate current distance
        const currentDistance = distances[path[i - 1]][path[i]] + distances[path[j]][path[j + 1]]

        // Calculate new distance if we swap
        const newDistance = distances[path[i - 1]][path[j]] + distances[path[i]][path[j + 1]]

        // If the new route is shorter, swap the edges
        if (newDistance < currentDistance) {
          // Reverse the segment between i and j
          const segment = path.slice(i, j + 1).reverse()
          path.splice(i, j - i + 1, ...segment)
          improved = true
          break
        }
      }
      if (improved) break
    }
  }

  // Calculate segments and total distance for the improved route
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

  return {
    totalDistance,
    segments,
    path,
  }
}

/**
 * Calculate the optimal route using a genetic algorithm approach
 * This is a more advanced algorithm that can find better solutions for complex routes
 */
export function geneticAlgorithm(
  points: RoutePoint[],
  startIndex = 0,
  endIndex?: number,
  populationSize = 50,
  generations = 100,
): CalculatedRoute {
  if (points.length < 2) {
    throw new Error("At least two points are required to calculate a route")
  }

  // Create a distance matrix
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

  // Check if we have fixed endpoints
  const hasFixedStart = startIndex !== undefined
  const hasFixedEnd = endIndex !== undefined && endIndex !== startIndex

  // Create initial population
  let population: number[][] = []

  // Generate random routes for the initial population
  for (let i = 0; i < populationSize; i++) {
    // Create a list of indices excluding start and end if fixed
    const availableIndices = []
    for (let j = 0; j < points.length; j++) {
      if ((hasFixedStart && j === startIndex) || (hasFixedEnd && j === endIndex)) continue
      availableIndices.push(j)
    }

    // Shuffle the available indices
    for (let j = availableIndices.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      ;[availableIndices[j], availableIndices[k]] = [availableIndices[k], availableIndices[j]]
    }

    // Create the route with fixed start and end if specified
    const route = []
    if (hasFixedStart) route.push(startIndex)
    route.push(...availableIndices)
    if (hasFixedEnd) route.push(endIndex)

    population.push(route)
  }

  // Add the nearest neighbor solution to the population
  const nnSolution = nearestNeighborAlgorithm(points, startIndex, endIndex)
  population[0] = nnSolution.path

  // Add the 2-opt solution to the population
  const twoOptSolution = twoOptAlgorithm(points, startIndex, endIndex)
  population[1] = twoOptSolution.path

  // Fitness function - calculate total distance of a route
  const calculateFitness = (route: number[]): number => {
    let totalDistance = 0
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += distances[route[i]][route[i + 1]]
    }
    return 1 / totalDistance // Invert so higher is better
  }

  // Run the genetic algorithm
  for (let gen = 0; gen < generations; gen++) {
    // Calculate fitness for each route
    const fitnessScores = population.map(calculateFitness)

    // Create a new population
    const newPopulation: number[][] = []

    // Elitism: keep the best route
    const bestIndex = fitnessScores.indexOf(Math.max(...fitnessScores))
    newPopulation.push([...population[bestIndex]])

    // Create the rest of the new population
    while (newPopulation.length < populationSize) {
      // Selection: tournament selection
      const tournamentSize = 5
      let parent1Index = Math.floor(Math.random() * population.length)
      let parent2Index = Math.floor(Math.random() * population.length)

      for (let i = 0; i < tournamentSize - 1; i++) {
        const competitorIndex = Math.floor(Math.random() * population.length)
        if (fitnessScores[competitorIndex] > fitnessScores[parent1Index]) {
          parent1Index = competitorIndex
        }

        const competitor2Index = Math.floor(Math.random() * population.length)
        if (fitnessScores[competitor2Index] > fitnessScores[parent2Index]) {
          parent2Index = competitor2Index
        }
      }

      const parent1 = population[parent1Index]
      const parent2 = population[parent2Index]

      // Crossover: ordered crossover (OX)
      let child: number[] = []

      if (Math.random() < 0.8) {
        // 80% chance of crossover
        // Determine crossover points
        const start = hasFixedStart ? 1 : 0
        const end = hasFixedEnd ? parent1.length - 2 : parent1.length - 1

        if (end - start > 1) {
          // Only crossover if we have enough points
          const crossPoint1 = start + Math.floor(Math.random() * (end - start))
          const crossPoint2 = crossPoint1 + 1 + Math.floor(Math.random() * (end - crossPoint1))

          // Initialize child with placeholders
          child = Array(parent1.length).fill(-1)

          // Copy segment from parent1
          for (let i = crossPoint1; i <= crossPoint2; i++) {
            child[i] = parent1[i]
          }

          // Fill the rest from parent2
          let parent2Index = 0
          for (let i = 0; i < child.length; i++) {
            if (child[i] === -1) {
              // Find the next unused city from parent2
              while (child.includes(parent2[parent2Index])) {
                parent2Index++
              }
              child[i] = parent2[parent2Index]
              parent2Index++
            }
          }
        } else {
          child = [...parent1] // Not enough points for crossover
        }
      } else {
        child = Math.random() < 0.5 ? [...parent1] : [...parent2]
      }

      // Mutation: swap mutation
      if (Math.random() < 0.2) {
        // 20% chance of mutation
        const start = hasFixedStart ? 1 : 0
        const end = hasFixedEnd ? child.length - 2 : child.length - 1

        if (end - start > 1) {
          // Only mutate if we have enough points
          const mutPoint1 = start + Math.floor(Math.random() * (end - start + 1))
          const mutPoint2 = start + Math.floor(Math.random() * (end - start + 1))

          // Swap two cities
          const temp = child[mutPoint1]
          child[mutPoint1] = child[mutPoint2]
          child[mutPoint2] = temp
        }
      }

      newPopulation.push(child)
    }

    // Replace the old population
    population = newPopulation
  }

  // Find the best route in the final population
  const fitnessScores = population.map(calculateFitness)
  const bestIndex = fitnessScores.indexOf(Math.max(...fitnessScores))
  const bestRoute = population[bestIndex]

  // Calculate segments and total distance for the best route
  const segments: RouteSegment[] = []
  let totalDistance = 0

  for (let i = 0; i < bestRoute.length - 1; i++) {
    const fromIndex = bestRoute[i]
    const toIndex = bestRoute[i + 1]
    const distance = distances[fromIndex][toIndex]

    segments.push({
      fromIndex,
      toIndex,
      distance,
    })

    totalDistance += distance
  }

  return {
    totalDistance,
    segments,
    path: bestRoute,
  }
}

/**
 * Calculate the optimal route using multiple algorithms and return the best result
 */
export function calculateBestRoute(points: RoutePoint[], startIndex?: number, endIndex?: number): CalculatedRoute {
  // Run all algorithms
  const nnResult = nearestNeighborAlgorithm(points, startIndex, endIndex)
  const twoOptResult = twoOptAlgorithm(points, startIndex, endIndex)
  const geneticResult = geneticAlgorithm(points, startIndex, endIndex)

  // Find the best result
  let bestResult = nnResult

  if (twoOptResult.totalDistance < bestResult.totalDistance) {
    bestResult = twoOptResult
  }

  if (geneticResult.totalDistance < bestResult.totalDistance) {
    bestResult = geneticResult
  }

  return bestResult
}
