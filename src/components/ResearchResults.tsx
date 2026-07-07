"use client";

import { TrendingUp, AlertTriangle, Activity, Briefcase } from "lucide-react";

export default function ResearchResults({ data }: { data: any }) {
  const { financialData, analysis, decision } = data;

  const isInvest = decision?.verdict === "Invest";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Top Level Decision */}
      <div className="card" style={{ 
        textAlign: "center", 
        border: `2px solid ${isInvest ? "var(--color-yellow)" : "var(--color-coral)"}`,
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, height: "4px",
          background: isInvest ? "var(--color-yellow)" : "var(--color-coral)"
        }} />
        <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: isInvest ? "var(--color-yellow)" : "var(--color-coral)" }}>
          {decision?.verdict}
        </h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.2rem", fontWeight: 600 }}>Confidence:</span>
          <div style={{ width: "200px", height: "12px", background: "var(--border-color)", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ 
              height: "100%", 
              width: `${decision?.confidence || 0}%`, 
              background: isInvest ? "var(--color-yellow)" : "var(--color-coral)",
              transition: "width 1s ease-out"
            }} />
          </div>
          <span>{decision?.confidence}%</span>
        </div>
        
        <div style={{ textAlign: "left", marginTop: "2rem" }}>
          <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>Key Reasoning</h3>
          <ul style={{ paddingLeft: "1.5rem", marginTop: "1rem" }}>
            {decision?.reasoning?.map((reason: string, i: number) => (
              <li key={i} style={{ marginBottom: "0.5rem" }}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Financials Summary */}
      {financialData && (
        <div className="card">
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <Briefcase size={20} color="var(--accent-primary)" />
            Financial Overview
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <StatBox label="Price" value={`${financialData.currency} ${financialData.price?.toFixed(2) || 'N/A'}`} />
            <StatBox label="Market Cap" value={financialData.marketCap ? formatLargeNumber(financialData.marketCap) : 'N/A'} />
            <StatBox label="P/E Ratio" value={financialData.trailingPE?.toFixed(2) || 'N/A'} />
            <StatBox label="Revenue Growth" value={financialData.revenueGrowth ? `${(financialData.revenueGrowth * 100).toFixed(2)}%` : 'N/A'} />
          </div>
        </div>
      )}

      {/* Analysis Details */}
      {analysis && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="card">
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-yellow)" }}>
              <TrendingUp size={20} /> Growth Signals
            </h3>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "1rem" }}>
              {analysis.growthSignals.map((signal: string, i: number) => (
                <li key={i} style={{ marginBottom: "0.5rem" }}>{signal}</li>
              ))}
            </ul>
          </div>
          
          <div className="card">
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-coral)" }}>
              <AlertTriangle size={20} /> Risk Factors
            </h3>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "1rem" }}>
              {analysis.riskFactors.map((risk: string, i: number) => (
                <li key={i} style={{ marginBottom: "0.5rem" }}>{risk}</li>
              ))}
            </ul>
          </div>
          
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
              <Activity size={20} /> Market Sentiment
            </h3>
            <p style={{ marginTop: "1rem", lineHeight: 1.6 }}>{analysis.overallSentiment}</p>
          </div>
        </div>
      )}

    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string | number }) {
  return (
    <div style={{ padding: "1rem", background: "rgba(15, 55, 95, 0.05)", borderRadius: "0.5rem" }}>
      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function formatLargeNumber(num: number) {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  return num.toString();
}
