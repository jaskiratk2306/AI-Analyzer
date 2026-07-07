"use client";

import { Suspense } from "react";
import Home from "./page";

export default function PageSuspense() {
  return (
    <Suspense fallback={<div className="page-shell">Loading...</div>}>
      <Home />
    </Suspense>
  );
}
