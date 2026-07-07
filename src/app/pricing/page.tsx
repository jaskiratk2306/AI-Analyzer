"use client";

import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PricingPage() {
  const [session, setSession] = useState<{ email: string; name: string; isSubscriber: boolean; searchCount: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedEmail = localStorage.getItem("ai-analyzer-user");
    if (!savedEmail) {
      router.push("/login");
      return;
    }

    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: savedEmail }),
    })
      .then((res) => res.json())
      .then((data) => setSession(data.user));
  }, [router]);

  async function upgrade() {
    if (!session) return;

    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.email }),
    });

    if (res.ok) {
      localStorage.setItem("ai-analyzer-user", session.email);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: "2rem", display: "grid", placeItems: "center" }}>
      <div className="card" style={{ width: "100%", maxWidth: "820px" }}>
        <div className="surface-pill" style={{ marginBottom: "1rem" }}>
          <Crown size={16} /> Premium plans
        </div>
        <h1 style={{ fontSize: "2rem" }}>Choose your plan</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Upgrade to unlock unlimited research searches, smarter workflows, and a more powerful assistant experience.</p>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div className="card" style={{ border: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "1.15rem" }}>Free</h2>
            <p style={{ color: "var(--text-secondary)" }}>3 searches total</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, margin: "0.75rem 0" }}>$0</p>
            <ul style={{ paddingLeft: "1rem", color: "var(--text-secondary)", display: "grid", gap: "0.45rem" }}>
              <li>Basic company insights</li>
              <li>Limited research runs</li>
              <li>Theme and dashboard access</li>
            </ul>
          </div>
          <div className="card" style={{ border: "2px solid var(--accent-primary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--accent-primary)", marginBottom: "0.6rem" }}>
              <Sparkles size={16} /> Pro
            </div>
            <p style={{ color: "var(--text-secondary)" }}>Unlimited searches</p>
            <p style={{ fontSize: "2rem", fontWeight: 700, margin: "0.75rem 0" }}>$9/mo</p>
            <ul style={{ paddingLeft: "1rem", color: "var(--text-secondary)", display: "grid", gap: "0.45rem", marginBottom: "1rem" }}>
              <li>Unlimited company research</li>
              <li>Priority insights and faster response</li>
              <li>Advanced workspace controls</li>
            </ul>
            <button className="btn btn-primary" onClick={upgrade}>Upgrade now</button>
          </div>
        </div>
        <p style={{ marginTop: "1.25rem" }}><Link href="/" style={{ color: "var(--accent-primary)" }}>Back to dashboard</Link></p>
      </div>
    </main>
  );
}
