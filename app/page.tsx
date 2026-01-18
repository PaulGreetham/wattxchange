import { typography } from "@/lib/design";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className={typography.h1}>WattXchange</h1>
          <p className={typography.lead}>
            A unified dashboard for monitoring wind and solar energy production.
          </p>
        </header>
      </main>
    </div>
  );
}
