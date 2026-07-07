import { Suspense } from "react";
import HomePageContent from "./home-page-content";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <div className="card" style={{ textAlign: "center" }}>
            Loading dashboard...
          </div>
        </main>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
