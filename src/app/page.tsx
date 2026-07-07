"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, Moon, Sun, LogOut, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "../components/ThemeProvider";
import ResearchResults from "../components/ResearchResults";

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<{ email: string; name: string; isSubscriber: boolean; searchCount: number } | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/session", { method: "POST" });
      const data = await res.json();
      setSession(data.user);
    } catch {
      setSession(null);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      if (!isActive) return;
      await refreshSession();
    };

    loadSession();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (!session.isSubscriber && session.searchCount >= 3) {
      setLimitMessage("You have reached your 3-search free limit. Upgrade to unlock unlimited searches.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setLimitMessage(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, email: session.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setLimitMessage(data.error || "You have reached your 3-search free limit. Upgrade to unlock unlimited searches.");
          await refreshSession();
          setResult(null);
          return;
        }

        throw new Error(data.error || "Failed to fetch research data");
      }

      if (data.error) {
        throw new Error(data.error || "Failed to fetch research data");
      }

      setResult(data);
      await refreshSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("ai-analyzer-user");
    setSession(null);
    router.push("/login");
  };

  return (
    <main className="page-shell">
      <header className="hero-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <div className="surface-pill" style={{ marginBottom: "0.75rem" }}>
            <Sparkles size={16} /> AI research cockpit
          </div>
          <h1 style={{ color: "var(--accent-primary)", marginBottom: "0.25rem", fontSize: "2.1rem" }}>
            InvestAI
          </h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: "560px" }}>Elevated company intelligence with secure access, smart search limits, and a premium analysis experience.</p>
          {session ? <p className="status-chip" style={{ marginTop: "0.6rem" }}>Signed in as {session.email}</p> : <p style={{ marginTop: "0.45rem", color: "var(--text-secondary)" }}>Sign in to unlock research and usage tracking.</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button 
            onClick={toggleTheme} 
            style={{ background: "transparent", border: "none", color: "var(--text-primary)" }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={24} /> : <Sun size={24} />}
          </button>
          {session ? <button className="btn btn-primary" onClick={handleLogout}><LogOut size={16} /></button> : <button className="btn btn-primary" onClick={() => router.push("/login")}>Sign in</button>}
        </div>
      </header>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "1.5rem" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
            <ShieldCheck size={18} /> Secure access
          </div>
          <p style={{ color: "var(--text-secondary)" }}>Protected workspace with account-based access and usage controls.</p>
        </div>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
            <Zap size={18} /> Fast insights
          </div>
          <p style={{ color: "var(--text-secondary)" }}>Generate a researched investment view in seconds for any public company.</p>
        </div>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)", marginBottom: "0.5rem" }}>
            <Sparkles size={18} /> Premium upgrades
          </div>
          <p style={{ color: "var(--text-secondary)" }}>Upgrade to unlock unlimited research sessions and richer workflows.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ marginBottom: "0.25rem" }}>Research workspace</h2>
            <p style={{ color: "var(--text-secondary)" }}>
              {session?.isSubscriber ? "Unlimited searches unlocked." : `Free searches remaining: ${Math.max(0, 3 - (session?.searchCount ?? 0))}`}
            </p>
          </div>
          {!session?.isSubscriber && session ? <button className="btn btn-primary" onClick={() => router.push("/pricing")}>Upgrade</button> : null}
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flexGrow: 1, minWidth: "240px" }}>
            <Search 
              size={20} 
              style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} 
            />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter a company name (e.g. Apple, Tesla)"
              style={{
                width: "100%",
                padding: "1rem 1rem 1rem 3rem",
                borderRadius: "0.85rem",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontSize: "1rem",
                outline: "none"
              }}
              disabled={isLoading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !companyName.trim()}>
            {isLoading ? <Loader2 size={20} className="spinner" style={{ animation: "spin 2s linear infinite" }} /> : "Research"}
          </button>
        </form>
      </div>

      {limitMessage && (
        <div className="card" style={{ borderLeft: "4px solid var(--color-yellow)", backgroundColor: "rgba(240, 206, 89, 0.12)", marginBottom: "1rem" }}>
          <p style={{ margin: 0 }}>{limitMessage}</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ borderLeft: "4px solid var(--color-pink)", backgroundColor: "rgba(211, 67, 101, 0.1)" }}>
          <h3 style={{ color: "var(--color-pink)", margin: 0 }}>Error</h3>
          <p style={{ margin: "0.5rem 0 0 0" }}>{error}</p>
        </div>
      )}

      {result && <ResearchResults data={result} />}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </main>
  );
}
