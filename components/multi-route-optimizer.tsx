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
import SimpleRouteMap from "@/components/simple-route-map"
import MapPerformanceComparison from "@/components/map-performance-comparison"
import { parseRouteData } from "@/lib/route-utils"
import { nearestNeighborAlgorithm, twoOptAlgorithm, geneticAlgorithm, calculateBestRoute } from "@/lib/route-algorithms"
import { exportToEnhancedXLSX } from "@/lib/enhanced-export-utils"
import type { RoutePoint, CalculatedRoute } from "@/lib/types"
import { Download, BarChart3, Map, FileText, CheckCircle } from "lucide-react"
import ExcelImport from "@/components/excel-import"

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
  const [importMode, setImportMode] = useState<"manual" | "excel">("manual")

  const handleExcelImportSuccess = (importedPoints: RoutePoint[]) => {
    setPoints(importedPoints)
    setError("")
    
    // Convert points to route data format for display in textarea
    const routeDataText = importedPoints
      .map(point => `${point.id} ${point.description} ${point.latitude} ${point.longitude}`)
      .join('\n')
    setRouteData(routeDataText)
    
    // Reset route calculations since we have new data
    setCalculatedRoutes({
      nearestNeighbor: null,
      twoOpt: null,
      genetic: null,
      best: null,
    })
  }

  const handleExcelImportError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    setError("")

    try {
      let routePoints: RoutePoint[]
      
      // If we already have points from Excel import, use them
      if (points.length > 0 && importMode === "excel") {
        routePoints = points
      } else {
        // Parse the route data from textarea
        routePoints = parseRouteData(routeData)
      }

      if (routePoints.length < 2) {
        setError("Por favor, insira pelo menos dois pontos de rota para calcular uma rota")
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
        setError(`Ponto de início com ID ${startPointId} não encontrado`)
        return
      }

      if (endPointId && endPointId !== "auto" && endIndex === -1) {
        setError(`Ponto final com ID ${endPointId} não encontrado`)
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
      setError(err instanceof Error ? err.message : "Formato de dados de rota inválido")
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
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-primary">Otimizador de Rota Avançado</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Input Mode Selection */}
          <Tabs value={importMode} onValueChange={(value) => setImportMode(value as "manual" | "excel")} className="w-full mb-6">
            <TabsList className="bg-card border-border grid w-full grid-cols-2">
              <TabsTrigger 
                value="manual" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
              >
                <Map className="h-4 w-4 mr-2" />
                Inserção Manual
              </TabsTrigger>
              <TabsTrigger 
                value="excel" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
              >
                <FileText className="h-4 w-4 mr-2" />
                Importar Excel/CSV
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="routeData" className="block mb-2 text-foreground">
                    Dados de rota (um ponto por linha, formato: id descrição latitude longitude)
                  </label>
                  <Textarea
                    id="routeData"
                    value={routeData}
                    onChange={(e) => setRouteData(e.target.value)}
                    placeholder="1 Escritório -11.684651 -49.85554651&#10;2 Armazém -11.4651 -49.854651"
                    className="bg-input border-border text-foreground min-h-[150px] font-mono"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Calcular Rotas Ótimas
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddExample}
                    variant="outline"
                    className="border-primary text-primary hover:bg-accent"
                  >
                    Carregar Dados de Exemplo
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="excel" className="mt-4">
              <ExcelImport 
                onImportSuccess={handleExcelImportSuccess}
                onImportError={handleExcelImportError}
              />
              
              {points.length > 0 && (
                <div className="mt-4">
                  <Alert className="bg-primary/10 border-primary text-primary-foreground">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {points.length} pontos importados com sucesso! Clique em "Calcular Rotas Ótimas" abaixo para prosseguir.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={() => handleSubmit()} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
                  >
                    Calcular Rotas Ótimas
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Common Configuration Options */}
          {points.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startPoint" className="text-foreground">
                    Ponto de Início (opcional)
                  </Label>
                  <Select value={startPointId} onValueChange={setStartPointId}>
                    <SelectTrigger id="startPoint" className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Selecione o ponto de início" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="auto" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">
                        Automático (decidido pelo algoritmo)
                      </SelectItem>
                      {points.map((point) => (
                        <SelectItem
                          key={`start-${point.id}`}
                          value={point.id.toString()}
                          className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          {point.id}: {point.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="endPoint" className="text-foreground">
                    Ponto Final (opcional)
                  </Label>
                  <Select value={endPointId} onValueChange={setEndPointId}>
                    <SelectTrigger id="endPoint" className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Selecione o ponto final" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="auto" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">
                        Automático (decidido pelo algoritmo)
                      </SelectItem>
                      {points.map((point) => (
                        <SelectItem
                          key={`end-${point.id}`}
                          value={point.id.toString()}
                          className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          {point.id}: {point.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-card p-4 rounded-md border border-border">
                <Label className="text-foreground mb-2 block">Algoritmo de Otimização</Label>
                <RadioGroup
                  value={selectedAlgorithm}
                  onValueChange={setSelectedAlgorithm}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="best" id="best" className="text-success" />
                    <Label htmlFor="best" className="text-foreground">
                      Melhor Resultado
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nearestNeighbor" id="nearestNeighbor" className="text-accent-foreground" />
                    <Label htmlFor="nearestNeighbor" className="text-foreground">
                      Vizinho Mais Próximo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="twoOpt" id="twoOpt" className="text-accent-foreground" />
                    <Label htmlFor="twoOpt" className="text-foreground">
                      2-Opt
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="genetic" id="genetic" className="text-accent-foreground" />
                    <Label htmlFor="genetic" className="text-foreground">
                      Algoritmo Genético
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedRoute && points.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleExportData}
                    variant="outline"
                    className="border-success text-success hover:bg-success/10"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Rota
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert className="bg-destructive/10 border-destructive text-destructive-foreground">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedRoute && points.length > 0 && (
        <div className="space-y-6">          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-card border-border grid w-full grid-cols-3">
              <TabsTrigger value="map" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
                <Map className="h-4 w-4 mr-2" />
                Visão de Mapa
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Comparação de Algoritmos
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Performance do Mapa
              </TabsTrigger>
            </TabsList><TabsContent value="map" className="mt-4">
              <RouteDisplay route={selectedRoute} points={points} />
              <div className="mt-6">
                <SimpleRouteMap
                  route={selectedRoute}
                  points={points}
                  startPointId={startPointId !== "auto" ? Number.parseInt(startPointId) : undefined}
                  endPointId={endPointId !== "auto" ? Number.parseInt(endPointId) : undefined}
                />
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="mt-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-primary">Comparação de Desempenho dos Algoritmos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {calculatedRoutes.nearestNeighbor && (
                        <div
                          className={`bg-card p-4 rounded-md border-2 ${selectedAlgorithm === "nearestNeighbor" ? "border-primary" : "border-border"}`}
                        >
                          <h3 className="text-foreground font-bold mb-2">Vizinho Mais Próximo</h3>
                          <p className="text-muted-foreground text-sm mb-1">Distância Total:</p>
                          <p className="text-primary text-xl font-bold mb-2">
                            {calculatedRoutes.nearestNeighbor.totalDistance.toFixed(2)} km
                          </p>
                          <p className="text-muted-foreground text-sm mb-1">Cálculo:</p>
                          <p className="text-success text-sm">Rápido</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlgorithm("nearestNeighbor")}
                            className={`mt-2 w-full ${selectedAlgorithm === "nearestNeighbor" ? "bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-accent"}`}
                          >
                            {selectedAlgorithm === "nearestNeighbor" ? "Selecionado" : "Selecionar"}
                          </Button>
                        </div>
                      )}

                      {calculatedRoutes.twoOpt && (
                        <div
                          className={`bg-card p-4 rounded-md border-2 ${selectedAlgorithm === "twoOpt" ? "border-primary" : "border-border"}`}
                        >
                          <h3 className="text-foreground font-bold mb-2">Algoritmo 2-Opt</h3>
                          <p className="text-muted-foreground text-sm mb-1">Distância Total:</p>
                          <p className="text-primary text-xl font-bold mb-2">
                            {calculatedRoutes.twoOpt.totalDistance.toFixed(2)} km
                          </p>
                          <p className="text-muted-foreground text-sm mb-1">Cálculo:</p>
                          <p className="text-success text-sm">Médio</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlgorithm("twoOpt")}
                            className={`mt-2 w-full ${selectedAlgorithm === "twoOpt" ? "bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-accent"}`}
                          >
                            {selectedAlgorithm === "twoOpt" ? "Selecionado" : "Selecionar"}
                          </Button>
                        </div>
                      )}

                      {calculatedRoutes.genetic && (
                        <div
                          className={`bg-card p-4 rounded-md border-2 ${selectedAlgorithm === "genetic" ? "border-primary" : "border-border"}`}
                        >
                          <h3 className="text-foreground font-bold mb-2">Algoritmo Genético</h3>
                          <p className="text-muted-foreground text-sm mb-1">Distância Total:</p>
                          <p className="text-primary text-xl font-bold mb-2">
                            {calculatedRoutes.genetic.totalDistance.toFixed(2)} km
                          </p>
                          <p className="text-muted-foreground text-sm mb-1">Cálculo:</p>
                          <p className="text-success text-sm">Complexo</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlgorithm("genetic")}
                            className={`mt-2 w-full ${selectedAlgorithm === "genetic" ? "bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-accent"}`}
                          >
                            {selectedAlgorithm === "genetic" ? "Selecionado" : "Selecionar"}
                          </Button>
                        </div>
                      )}

                      {calculatedRoutes.best && (
                        <div
                          className={`bg-card p-4 rounded-md border-2 ${selectedAlgorithm === "best" ? "border-success" : "border-border"}`}
                        >
                          <h3 className="text-foreground font-bold mb-2">Melhor Resultado</h3>
                          <p className="text-muted-foreground text-sm mb-1">Distância Total:</p>
                          <p className="text-primary text-xl font-bold mb-2">
                            {calculatedRoutes.best.totalDistance.toFixed(2)} km
                          </p>
                          <p className="text-muted-foreground text-sm mb-1">Algoritmo:</p>
                          <p className="text-success text-sm">
                            {calculatedRoutes.best.totalDistance === calculatedRoutes.nearestNeighbor?.totalDistance
                              ? "Vizinho Mais Próximo"
                              : calculatedRoutes.best.totalDistance === calculatedRoutes.twoOpt?.totalDistance
                                ? "2-Opt"
                                : "Genético"}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlgorithm("best")}
                            className={`mt-2 w-full ${selectedAlgorithm === "best" ? "bg-primary text-primary-foreground" : "border-primary text-primary hover:bg-accent"}`}
                          >
                            {selectedAlgorithm === "best" ? "Selecionado" : "Selecionar"}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="bg-card p-4 rounded-md border border-border">
                      <h3 className="text-foreground font-bold mb-4">Comparação de Distâncias</h3>
                      <div className="space-y-4">
                        {calculatedRoutes.nearestNeighbor && (
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-foreground">Vizinho Mais Próximo</span>
                              <span className="text-primary">
                                {calculatedRoutes.nearestNeighbor.totalDistance.toFixed(2)} km
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div
                                className="bg-primary h-2.5 rounded-full"
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
                              <span className="text-foreground">2-Opt Algorithm</span>
                              <span className="text-primary">
                                {calculatedRoutes.twoOpt.totalDistance.toFixed(2)} km
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div
                                className="bg-primary h-2.5 rounded-full"
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
                              <span className="text-foreground">Genetic Algorithm</span>
                              <span className="text-primary">
                                {calculatedRoutes.genetic.totalDistance.toFixed(2)} km
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div
                                className="bg-primary h-2.5 rounded-full"
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

                    <div className="bg-card p-4 rounded-md border border-border">
                      <h3 className="text-foreground font-bold mb-2">Informações sobre Algoritmos</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                          <span className="text-primary font-bold">Vizinho Mais Próximo:</span> Um algoritmo guloso que
                          sempre seleciona o ponto não visitado mais próximo. Rápido, mas pode não encontrar a solução ótima.
                        </p>
                        <p>
                          <span className="text-primary font-bold">2-Opt:</span> Melhora uma rota inicial trocando
                          arestas para reduzir a distância total. Melhores resultados do que o Vizinho Mais Próximo com tempo de cálculo moderado.
                        </p>
                        <p>
                          <span className="text-primary font-bold">Algoritmo Genético:</span> Usa princípios evolutivos
                          para encontrar rotas ótimas. Pode encontrar melhores soluções para rotas complexas, mas requer mais cálculo.
                        </p>
                        <p>
                          <span className="text-success font-bold">Melhor Resultado:</span> Seleciona automaticamente a rota
                          com a menor distância total entre todos os algoritmos calculados.
                        </p>
                      </div>
                    </div>
                  </div>                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              <MapPerformanceComparison
                route={selectedRoute}
                points={points}
                startPointId={startPointId !== "auto" ? Number.parseInt(startPointId) : undefined}
                endPointId={endPointId !== "auto" ? Number.parseInt(endPointId) : undefined}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
