import MultiRouteOptimizer from "@/components/multi-route-optimizer"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#110043] text-[#f1f5f9] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-[#42eedc]">Advanced Route Optimizer</h1>
        <p className="mb-8">
          Calculate and visualize optimal routes with multiple algorithms. Enter route points in the format:{" "}
          <span className="font-mono bg-[#1a0063] px-2 py-1 rounded">id description latitude longitude</span>
        </p>
        <MultiRouteOptimizer />
      </div>
    </main>
  )
}
