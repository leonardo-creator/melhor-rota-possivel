import MultiRouteOptimizer from "@/components/multi-route-optimizer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-primary">
            🗺️ Melhor Rota
          </h1>
          <h2 className="text-2xl font-semibold mb-2 text-accent">
            Otimizador de Rota Avançado
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Calcule e visualize rotas ótimas usando múltiplos algoritmos avançados.
            Otimização de rotas profissional com visualizações modernas e bonitas.
          </p>        </div>
        
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-card-foreground">Cálculo de Rota</h3>
          <p className="mb-6 text-muted-foreground">
            Enter route points in the format:{" "}
            <span className="font-mono bg-secondary px-2 py-1 rounded text-secondary-foreground">
              id description latitude longitude
            </span>
          </p>
          <MultiRouteOptimizer />
        </div>
      </div>
    </main>
  )
}
