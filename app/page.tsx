import { Suspense } from "react"

import { HomeClient } from "@/components/home-client"

export default function Home() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading dashboard…</div>}>
      <HomeClient />
    </Suspense>
  )
}
