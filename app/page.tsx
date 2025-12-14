"use client";

import { RoyProvider, RoyHUD } from "@/components/roy";

export default function Page() {
  return (
    <RoyProvider>
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        {/* Main content area - placeholder for now */}
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="text-center space-y-6 max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Roy
            </h1>
            <p className="text-xl text-muted-foreground">
              Your AI operating system for full-stack building
            </p>

            <div className="pt-8 space-y-4">
              <p className="text-sm text-muted-foreground">
                Press{" "}
                <kbd className="px-2 py-1 rounded bg-muted text-foreground font-mono text-xs">
                  ⌘K
                </kbd>{" "}
                to talk to Roy
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-4">
                <ExampleCard
                  title="Check priorities"
                  example="What should I prioritize this week based on our OKRs?"
                />
                <ExampleCard
                  title="Get context"
                  example="What did we decide about onboarding in that last meeting?"
                />
                <ExampleCard
                  title="Generate prototypes"
                  example="Create some prototype variants for the new onboarding flow"
                />
                <ExampleCard
                  title="Research"
                  example="What are the latest trends in user onboarding for B2B apps?"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Roy HUD - the main interface */}
        <RoyHUD />
      </main>
    </RoyProvider>
  );
}

function ExampleCard({ title, example }: { title: string; example: string }) {
  return (
    <div className="p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
      <h3 className="font-medium text-sm text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">&ldquo;{example}&rdquo;</p>
    </div>
  );
}
