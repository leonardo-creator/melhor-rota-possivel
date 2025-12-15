import MultiRouteOptimizer from "@/components/multi-route-optimizer"
import Link from "next/link"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

// ... imports
export default function Home() {
  return (
    <main className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Premium Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="text-xl">🗺️</span>
           </div>
           <div>
             <h1 className="font-bold text-lg leading-tight text-primary">Melhor Rota</h1>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Otimizador Pro</p>
           </div>
        </div>

        <Link href="/ajuda">
           <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
             <HelpCircle className="h-4 w-4" />
             <span className="hidden sm:inline">Ajuda & Suporte</span>
           </Button>
        </Link>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 p-4 overflow-hidden">
        <MultiRouteOptimizer />
      </div>
    </main>
  )
}
