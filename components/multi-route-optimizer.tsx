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
import MapPerformanceComparison from "@/components/map-performance-comparison"
import { parseRouteData } from "@/lib/route-utils"
import { nearestNeighborAlgorithm, twoOptAlgorithm, geneticAlgorithm, calculateBestRoute } from "@/lib/route-algorithms"
import { exportToEnhancedXLSX } from "@/lib/enhanced-export-utils"
import type { RoutePoint, CalculatedRoute } from "@/lib/types"
import { Download, Map, FileText, CheckCircle } from "lucide-react"
import ExcelImport from "@/components/excel-import"
import LeafletMapWrapper from "@/components/LeafletMapWrapper"

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
    <div className="flex flex-col lg:flex-row h-[85vh] gap-6">
      {/* Sidebar - Controls & Inputs */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4 h-full overflow-hidden">
        <Card className="flex-1 flex flex-col bg-card border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary text-xl">Configuração da Rota</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin scrollbar-thumb-primary/10">
            
            {/* Input Mode Selection */}
            <Tabs value={importMode} onValueChange={(value) => setImportMode(value as "manual" | "excel")} className="w-full">
              <TabsList className="bg-muted grid w-full grid-cols-2">
                <TabsTrigger value="manual" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow text-muted-foreground transition-all">
                  <Map className="h-4 w-4 mr-2" /> Manual
                </TabsTrigger>
                <TabsTrigger value="excel" className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow text-muted-foreground transition-all">
                  <FileText className="h-4 w-4 mr-2" /> Excel/CSV
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-4 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="routeData" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Pontos da Rota
                    </Label>
                    <Textarea
                      id="routeData"
                      value={routeData}
                      onChange={(e) => setRouteData(e.target.value)}
                      placeholder={`1 Escritório -11.68 -49.85\n2 Cliente A -11.46 -49.85`}
                      className="bg-muted/50 border-transparent focus:border-primary text-foreground min-h-[120px] font-mono text-sm mt-1 mb-2 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all active:scale-95">
                      Calcular
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddExample}
                      variant="outline"
                      className="w-full border-primary/20 hover:bg-primary/5 text-primary"
                    >
                      Exemplo
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
                   <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100 dark:bg-green-900/20 dark:border-green-900/50">
                        <CheckCircle className="h-4 w-4" />
                        <span>{points.length} pontos carregados</span>
                      </div>
                      <Button onClick={() => handleSubmit()} className="w-full">Calcular Rota</Button>
                   </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Global Errors */}
            {error && (
              <Alert variant="destructive" className="py-2 text-sm animate-in fade-in slide-in-from-top-2">
                 <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Algorithm & Configuration (Only show if points exist) */}
            {points.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-dashed">
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Início</Label>
                      <Select value={startPointId} onValueChange={setStartPointId}>
                        <SelectTrigger className="h-9 text-sm">
                           <SelectValue placeholder="Auto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Automático</SelectItem>
                          {points.map(p => (
                            <SelectItem key={`s-${p.id}`} value={p.id.toString()}>{p.id}: {p.description}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fim</Label>
                      <Select value={endPointId} onValueChange={setEndPointId}>
                        <SelectTrigger className="h-9 text-sm">
                           <SelectValue placeholder="Auto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Automático</SelectItem>
                          {points.map(p => (
                             <SelectItem key={`e-${p.id}`} value={p.id.toString()}>{p.id}: {p.description}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Algoritmo</Label>
                  <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                    <SelectTrigger className="h-9 text-sm">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="best">🏅 Melhor Resultado (Automático)</SelectItem>
                       <SelectItem value="nearestNeighbor">⚡ Vizinho Mais Próximo (Rápido)</SelectItem>
                       <SelectItem value="twoOpt">🔄 2-Opt (Equilibrado)</SelectItem>
                       <SelectItem value="genetic">🧬 Genético (Complexo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedRoute && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 h-8 text-sm"
                    onClick={handleExportData}
                  >
                    <Download className="h-3 w-3 mr-2" /> Exportar Rota
                  </Button>
                )}
              </div>
            )}
             
            {/* Results Summary Mini-Card */}
             {selectedRoute && (
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/10 mt-4 space-y-2">
                <h4 className="font-semibold text-primary text-sm flex items-center justify-between">
                   <span>Resumo da Rota</span>
                   <span className="text-xs bg-background px-2 py-0.5 rounded shadow-sm border">{selectedRoute.path.length} pontos</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <span className="text-xs text-muted-foreground block">Distância Total</span>
                      <span className="text-lg font-bold text-foreground">{selectedRoute.totalDistance.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">km</span></span>
                   </div>
                   <div>
                       {/* Placeholder for future time estimation if added */}
                   </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* Main Content - Map */}
      <div className="flex-1 h-full lg:h-auto rounded-xl overflow-hidden border border-border shadow-lg relative bg-white dark:bg-neutral-900">
        <LeafletMapWrapper
           markers={points.map(p => ({ lat: p.latitude, lng: p.longitude, title: p.description, description: `ID: ${p.id}` }))}
           route={selectedRoute ? selectedRoute.path.map(idx => [points[idx].latitude, points[idx].longitude]) : []}
        />
        
        {/* Floating status overlay if needed */}
        {!selectedRoute && points.length === 0 && (
           <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[500] pointer-events-none">
              <div className="bg-card p-6 rounded-xl shadow-xl border text-center max-w-sm">
                 <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Map className="h-6 w-6" />
                 </div>
                 <h3 className="font-semibold text-lg mb-2">Pronto para Começar</h3>
                 <p className="text-muted-foreground text-sm">Adicione pontos manualmente ou importe um arquivo para visualizar a rota no mapa.</p>
              </div>
           </div>
        )}
      </div>
    </div>
  )
}
