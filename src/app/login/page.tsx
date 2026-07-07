"use client";

import Link from "next/link";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to sign in.");
      return;
    }

    localStorage.setItem("ai-analyzer-user", data.user.email);
    router.push("/");
    router.refresh();
  }

  return (
    <main className="page-shell auth-shell">
      <div className="card auth-card">
        <div className="surface-pill" style={{ marginBottom: "1rem" }}>
          <ShieldCheck size={16} /> Secure login
        </div>
        <h1 style={{ fontSize: "1.75rem" }}>Welcome back</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Sign in to continue your research with protected access.</p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            required
            className="input-field"
            style={inputStyle}
          />
          <div style={{ position: "relative" }}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              className="input-field"
              style={{ ...inputStyle, paddingRight: "3rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text-secondary)" }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error ? <p style={{ color: "var(--color-pink)" }}>{error}</p> : null}
          <button className="btn btn-primary" type="submit">Sign in</button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          New here? <Link href="/signup" style={{ color: "var(--accent-primary)" }}>Create an account</Link>
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.95rem 1rem",
  borderRadius: "0.8rem",
  border: "1px solid var(--border-color)",
  backgroundColor: "var(--bg-primary)",
  color: "var(--text-primary)",
};
