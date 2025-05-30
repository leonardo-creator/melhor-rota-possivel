"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { 
  HelpCircle, 
  MapPin, 
  Route, 
  FileSpreadsheet, 
  Calculator, 
  Eye,
  Download,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ArrowLeft
} from "lucide-react"

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex justify-start">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Otimizador
            </Button>
          </Link>
        </div>

        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-800 flex items-center justify-center gap-3">
              <HelpCircle className="h-8 w-8" />
              Como Usar o Otimizador de Rotas
            </CardTitle>
            <p className="text-blue-600 text-lg mt-2">
              Guia completo para encontrar a melhor rota entre vários pontos
            </p>
          </CardHeader>
        </Card>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              🚀 Início Rápido (5 passos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border">
                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">1</div>
                <h3 className="font-semibold text-green-800">Adicionar Pontos</h3>
                <p className="text-sm text-green-600">Digite seus destinos</p>
              </div>
              <ArrowRight className="hidden md:block h-8 w-8 text-green-400 self-center mx-auto" />
              <div className="text-center p-4 bg-blue-50 rounded-lg border">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">2</div>
                <h3 className="font-semibold text-blue-800">Calcular</h3>
                <p className="text-sm text-blue-600">Clique em calcular rotas</p>
              </div>
              <ArrowRight className="hidden md:block h-8 w-8 text-blue-400 self-center mx-auto" />
              <div className="text-center p-4 bg-purple-50 rounded-lg border">
                <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">3</div>
                <h3 className="font-semibold text-purple-800">Ver Resultado</h3>
                <p className="text-sm text-purple-600">Visualize no mapa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Entrada Manual
            </TabsTrigger>
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Importar Excel
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Entender Resultados
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Dicas
            </TabsTrigger>
          </TabsList>

          {/* Manual Input Tab */}
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  Como Adicionar Pontos Manualmente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">📝 Formato dos Dados</h3>
                  <p className="text-blue-700 mb-3">Cada linha deve ter 4 informações separadas por espaço:</p>
                  <div className="bg-white p-3 rounded border font-mono text-sm">
                    <strong>ID Nome Latitude Longitude</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-bold text-green-800 mb-2">✅ Exemplo Correto</h3>
                    <div className="bg-white p-3 rounded border font-mono text-sm space-y-1">
                      <div>1 Casa -23.5505 -46.6333</div>
                      <div>2 Trabalho -23.5489 -46.6388</div>
                      <div>3 Mercado -23.5475 -46.6349</div>
                      <div>4 Escola -23.5462 -46.6279</div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-bold text-red-800 mb-2">❌ Erros Comuns</h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Esquecer o ID no início</li>
                      <li>• Usar vírgula em vez de ponto nos números</li>
                      <li>• Não separar com espaços</li>
                      <li>• Latitude/longitude trocadas</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Como Encontrar Coordenadas
                  </h3>
                  <ol className="text-yellow-700 space-y-1 text-sm">
                    <li>1. Abra o Google Maps</li>
                    <li>2. Procure pelo endereço</li>
                    <li>3. Clique com botão direito no local</li>
                    <li>4. Clique nos números que aparecem</li>
                    <li>5. Copie e cole no formato: latitude longitude</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Excel Import Tab */}
          <TabsContent value="excel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-500" />
                  Como Importar do Excel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-2">📊 Formato da Planilha</h3>
                  <p className="text-green-700 mb-3">Sua planilha deve ter estas colunas:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 bg-white text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2">index</th>
                          <th className="border border-gray-300 p-2">name</th>
                          <th className="border border-gray-300 p-2">description</th>
                          <th className="border border-gray-300 p-2">Latitude</th>
                          <th className="border border-gray-300 p-2">Longitude</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2">1</td>
                          <td className="border border-gray-300 p-2">Casa</td>
                          <td className="border border-gray-300 p-2">Minha residência</td>
                          <td className="border border-gray-300 p-2">-23.5505</td>
                          <td className="border border-gray-300 p-2">-46.6333</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">2</td>
                          <td className="border border-gray-300 p-2">Trabalho</td>
                          <td className="border border-gray-300 p-2">Escritório</td>
                          <td className="border border-gray-300 p-2">-23.5489</td>
                          <td className="border border-gray-300 p-2">-46.6388</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">1</div>
                    <h3 className="font-semibold text-blue-800">Prepare o Excel</h3>
                    <p className="text-sm text-blue-600">Organize os dados nas colunas corretas</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border">
                    <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">2</div>
                    <h3 className="font-semibold text-purple-800">Arraste o Arquivo</h3>
                    <p className="text-sm text-purple-600">Na aba "Importar Excel"</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border">
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">3</div>
                    <h3 className="font-semibold text-green-800">Calcular</h3>
                    <p className="text-sm text-green-600">Os dados aparecerão automaticamente</p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-bold text-yellow-800 mb-2">⚠️ Formatos Aceitos</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">.xlsx</Badge>
                    <Badge variant="secondary">.xls</Badge>
                    <Badge variant="secondary">.csv</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-purple-500" />
                  Entendendo os Resultados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-blue-800 text-lg">🗺️ Mapa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Pontos verdes:</strong> Início</li>
                        <li>• <strong>Pontos vermelhos:</strong> Fim</li>
                        <li>• <strong>Pontos azuis:</strong> Intermediários</li>
                        <li>• <strong>Setas:</strong> Direção da rota</li>
                        <li>• <strong>Números:</strong> Distância em km</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-green-800 text-lg">📊 Algoritmos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• <strong>Melhor Resultado:</strong> Rota mais curta</li>
                        <li>• <strong>Vizinho Próximo:</strong> Rápido</li>
                        <li>• <strong>2-Opt:</strong> Equilibrado</li>
                        <li>• <strong>Genético:</strong> Mais preciso</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-purple-800 text-lg">📈 Comparação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• <strong>Barras:</strong> Distância total</li>
                        <li>• <strong>Verde:</strong> Mais eficiente</li>
                        <li>• <strong>Azul:</strong> Menos eficiente</li>
                        <li>• <strong>Tempo:</strong> Velocidade do cálculo</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">🎯 Qual Algoritmo Escolher?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-blue-700">👍 Recomendado para iniciantes:</h4>
                      <p className="text-blue-600"><strong>"Melhor Resultado"</strong> - Escolhe automaticamente a rota mais curta</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-700">⚡ Para resultados rápidos:</h4>
                      <p className="text-blue-600"><strong>"Vizinho Mais Próximo"</strong> - Calcula instantaneamente</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Dicas e Boas Práticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-green-800 text-lg flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        ✅ Faça Assim
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Use nomes simples e claros</li>
                        <li>• Verifique as coordenadas no Google Maps</li>
                        <li>• Comece com poucos pontos para testar</li>
                        <li>• Defina pontos de início e fim se necessário</li>
                        <li>• Export os resultados para guardar</li>
                        <li>• Compare diferentes algoritmos</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-red-800 text-lg flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        ❌ Evite Isso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Não misture formatos de coordenadas</li>
                        <li>• Não use acentos nos nomes</li>
                        <li>• Evite pontos muito distantes (outro país)</li>
                        <li>• Não deixe campos vazios</li>
                        <li>• Não use vírgulas nos números</li>
                        <li>• Evite nomes muito longos</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2">🚀 Casos de Uso Comuns</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-blue-700">🏃‍♂️ Entregador</h4>
                      <p className="text-blue-600">Otimizar rota de entregas diárias</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-700">🏢 Vendedor</h4>
                      <p className="text-blue-600">Visitar clientes de forma eficiente</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-700">🏠 Pessoal</h4>
                      <p className="text-blue-600">Planejar passeios e compromissos</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    💾 Salvando Seus Resultados
                  </h3>
                  <p className="text-yellow-700 text-sm">
                    Após calcular a rota, use o botão <strong>"Exportar para Excel"</strong> para 
                    salvar uma planilha com a ordem otimizada dos pontos, distâncias e instruções detalhadas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer with Action Button */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <CardContent className="text-center py-6">
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Pronto para começar? 🚀
            </h3>
            <p className="text-green-600 mb-4">
              Agora que você sabe como usar, é hora de otimizar suas rotas!
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6"
            >
              Ir para o Otimizador de Rotas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
