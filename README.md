# AI Investment Research Agent 🤖📈

> An AI-powered full-stack web application that researches any publicly traded company and delivers a structured **Invest / Pass** decision — powered by **LangGraph.js**, **Groq (Llama 3)**, and **Yahoo Finance**.

---

## Overview

The AI Investment Research Agent takes a company name as input, runs it through a multi-step LangGraph.js pipeline, and outputs:

- 📊 Live financial data (price, market cap, P/E ratio, revenue growth)
- 📰 Recent news headlines
- 🧠 AI-synthesized growth signals & risk factors
-  A final **Invest** or **Pass** verdict with confidence score & reasoning

Built as a take-home assignment demonstrating production-quality full-stack AI development.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router, TypeScript) |
| Styling | Vanilla CSS (custom 5-color palette, Light/Dark mode) |
| AI Orchestration | LangGraph.js |
| LLM | Groq — Llama 3.1 8B Instant (free tier) |
| Financial Data | yahoo-finance2 (no API key needed) |

---

## How to Run It

### Prerequisites
- Node.js 18+
- A **free** Groq API key → [console.groq.com](https://console.groq.com) (sign up, go to "API Keys")

### Setup
```bash
# 1. Clone the repo
git clone https://github.com/jaskiratk2306/AI-Analyzer.git
cd AI-Analyzer

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
```

### Configure API Key
Open `.env.local` and add your Groq API key:
```env
GROQ_API_KEY="your_groq_api_key_here"
```

### Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — type any company name and click **Research**.

---

## How It Works — LangGraph Architecture

The agent is modeled as a directed state graph with 3 nodes:

```
START → [fetchData] → [analyze] → [decide] → END
              ↓ (error)              ↓ (error)
             END                   END
```

### Node 1: `fetchData`
- Uses `yahoo-finance2` to **search** for the company's ticker symbol
- Fetches live financial metrics: price, market cap, P/E, revenue growth, profit margins, debt
- Fetches recent **news headlines** from Yahoo Finance
- If company not found → routes to `END` with a user-friendly error

### Node 2: `analyze`
- Passes raw financials + news to **Groq (Llama 3.1 8B)**
- LLM synthesizes data into structured JSON:
  - `growthSignals[]` — positive indicators
  - `riskFactors[]` — red flags
  - `overallSentiment` — market sentiment paragraph

### Node 3: `decide`
- Acts as an investment committee member
- LLM returns structured JSON:
  - `verdict` — `"Invest"` or `"Pass"`
  - `confidence` — 0–100 score
  - `reasoning[]` — 3–5 bullet points explaining the call

**Conditional edges** handle errors at each step — if any node fails, the graph safely routes to END and returns the error to the frontend.

---

## Project Structure

```
src/
├── app/
│   ├── api/research/route.ts   # Backend API route (triggers LangGraph)
│   ├── page.tsx                # Main UI page
│   ├── layout.tsx              # App layout with ThemeProvider
│   └── globals.css             # Vanilla CSS design system
├── components/
│   ├── ResearchResults.tsx     # Results dashboard component
│   └── ThemeProvider.tsx       # Light/Dark mode context
└── lib/
    └── agent/
        ├── graph.ts            # LangGraph state machine (nodes + edges)
        ├── nodes.ts            # Node functions (fetch, analyze, decide)
        ├── state.ts            # AgentState type definition
        └── tools.ts            # Yahoo Finance API helpers
```

---

## Key Decisions & Trade-offs

| Decision | Choice | Why |
|----------|--------|-----|
| LLM Provider | Groq (Llama 3.1 8B) | Completely free tier, no billing required, very fast (~1s responses) |
| Financial Data | yahoo-finance2 | Free, no API key, covers financials + news in one library |
| Styling | Vanilla CSS | Assignment constraint; implemented custom 5-color palette with CSS variables |
| JSON parsing | Regex extraction | LLMs sometimes wrap JSON in markdown; regex `/{[\s\S]*}/` is more robust than string replacement |
| LLM init | Lazy (inside function) | Next.js reads env vars at runtime, not import time; top-level constructor throws before env is loaded |

### What was left out
- **Streaming**: UI waits for full graph execution. Would use Next.js streaming + `useReadableStream` with more time.
- **Caching**: No DB layer. Would add Vercel KV to cache results for popular companies (Apple/Tesla).
- **SEC Filings**: Only uses Yahoo Finance news. Full implementation would parse 10-K filings via EDGAR API.

---

## Vercel Deployment

> [!WARNING]  
> Vercel Hobby tier limits serverless function execution to **10s**. The full LangGraph pipeline (2 LLM calls + Yahoo Finance) typically takes **5–15 seconds**.

**Fixes:**
1. **Vercel Pro** — set `export const maxDuration = 60` in `route.ts` (already done)
2. **Use Groq** — Llama 3.1 8B on Groq typically responds in ~1–2s, keeping total well under 10s

**To deploy:**
```bash
npx vercel
# Add GROQ_API_KEY in Vercel dashboard → Settings → Environment Variables
```

---

## Example Runs

*(Fill these in after running the app locally!)*

### Apple (AAPL)
- **Verdict:** [ ]
- **Confidence:** [ ]%
- **Key Reasoning:** [ ]

### Tesla (TSLA)
- **Verdict:** [ ]
- **Confidence:** [ ]%
- **Key Reasoning:** [ ]

### GameStop (GME)
- **Verdict:** [ ]
- **Confidence:** [ ]%
- **Key Reasoning:** [ ]

---

## What I Would Improve With More Time

1. **Streaming UI** — Show real-time step progress ("Fetching data... → Analyzing... → Deciding...") using Next.js streaming responses
2. **Result caching** — Store recent analyses in Vercel KV / Upstash Redis to avoid redundant LLM calls
3. **Better data sources** — Add SEC EDGAR for 10-K risk factors, Alpha Vantage for earnings history
4. **Score visualization** — Animated gauge/radar chart for the confidence score and investment signals
5. **Company comparison** — Allow researching 2 companies side-by-side

---

## Ambiguity Notes (AI Assumptions)

- **LLM Provider**: Defaulted to Groq (free, no billing) after OpenAI quota was exhausted and Gemini free tier was also exhausted. Groq's free tier is extremely generous and suitable for a demo/assignment.
- **Search API**: Used `yahoo-finance2` for both financials and news — avoids needing a second API key (Tavily/Serpapi).
- **Tailwind CSS**: Next.js default scaffolding installs Tailwind; I wiped it and implemented Vanilla CSS per the assignment constraint.
