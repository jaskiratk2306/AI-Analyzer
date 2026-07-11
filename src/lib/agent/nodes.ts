import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentStateType } from "./state";
import { getCompanyTicker, getFinancialData, getCompanyNews } from "./tools";

function formatLargeNumber(value: number) {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return value.toLocaleString();
}

function scoreDataCompleteness(financialData: AgentStateType["financialData"]) {
  let score = 0;
  if (typeof financialData?.price === "number") score += 16;
  if (typeof financialData?.marketCap === "number") score += 20;
  if (typeof financialData?.trailingPE === "number") score += 16;
  if (typeof financialData?.revenueGrowth === "number") score += 20;
  if (typeof financialData?.profitMargins === "number") score += 16;
  if (financialData?.industry && financialData?.sector) score += 12;
  return Math.min(100, score);
}

function parseJsonPayload(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const jsonText = start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;

  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function getGroqModel() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  return new ChatGroq({
    apiKey,
    model: "llama-3.1-8b-instant",
    temperature: 0.2,
    maxTokens: 450,
  });
}

async function buildGroundedAnalysis(state: AgentStateType) {
  const financialData = state.financialData;
  const revenueGrowth = typeof financialData?.revenueGrowth === "number" ? financialData.revenueGrowth * 100 : null;
  const profitMargins = typeof financialData?.profitMargins === "number" ? financialData.profitMargins * 100 : null;
  const trailingPE = typeof financialData?.trailingPE === "number" ? financialData.trailingPE : null;
  const marketCap = typeof financialData?.marketCap === "number" ? financialData.marketCap : null;
  const qualityScore = scoreDataCompleteness(financialData);

  const growthSignals: string[] = [];
  const riskFactors: string[] = [];

  if (revenueGrowth !== null) {
    growthSignals.push(`Revenue growth is ${revenueGrowth.toFixed(2)}% on the reported period.`);
  } else {
    riskFactors.push("Revenue growth data was not available, so momentum is uncertain.");
  }

  if (profitMargins !== null) {
    growthSignals.push(`Operating margin is ${profitMargins.toFixed(2)}%, suggesting ${profitMargins > 10 ? "healthy" : "mixed"} profitability.`);
  } else {
    riskFactors.push("Profit margin data was not available, limiting profitability context.");
  }

  if (marketCap !== null) {
    growthSignals.push(`Market capitalization is ${formatLargeNumber(marketCap)}.`);
  }

  if (trailingPE !== null) {
    if (trailingPE > 0 && trailingPE < 30) {
      growthSignals.push(`The P/E ratio of ${trailingPE.toFixed(2)} looks comparatively reasonable.`);
    } else {
      riskFactors.push(`The P/E ratio of ${trailingPE.toFixed(2)} appears stretched or not meaningful for this context.`);
    }
  } else {
    riskFactors.push("Valuation data was unavailable, so the entry price is harder to assess.");
  }

  if (qualityScore < 70) {
    riskFactors.push("Some core financial metrics are missing, so confidence is intentionally capped.");
  }

  const overallSentiment = qualityScore >= 70
    ? "The analysis is grounded in live financial metrics and reflects the company’s current reported health rather than a generic narrative."
    : "The analysis is only partially grounded because some financial metrics were unavailable; the recommendation should be treated cautiously.";

  const fallback = {
    growthSignals: growthSignals.length > 0 ? growthSignals : ["No growth signals were available from the financial feed."],
    riskFactors: riskFactors.length > 0 ? riskFactors : ["No major risks were surfaced from the available dataset."],
    overallSentiment,
    dataSource: "Yahoo Finance via yahoo-finance2",
    generatedAt: new Date().toISOString(),
    dataQualityScore: qualityScore,
    disclaimer: "AI-generated analysis only. Not financial advice. Figures are derived from the latest available financial data source and should be verified independently.",
  };

  const model = getGroqModel();
  if (!model) return fallback;

  try {
    const prompt = new SystemMessage(
      "You are an investment research assistant. Return strict JSON with keys growthSignals (array of strings), riskFactors (array of strings), overallSentiment (string), dataQualityScore (number), disclaimer (string)."
    );
    const userMessage = new HumanMessage(`Company: ${state.companyName}\nFinancial summary:\n- Revenue growth: ${revenueGrowth?.toFixed(2) ?? "unavailable"}%\n- Profit margin: ${profitMargins?.toFixed(2) ?? "unavailable"}%\n- P/E ratio: ${trailingPE?.toFixed(2) ?? "unavailable"}\n- Market cap: ${marketCap ? formatLargeNumber(marketCap) : "unavailable"}\n- News count: ${state.newsData?.length ?? 0}`);

    const response = await model.invoke([prompt, userMessage]);
    const text = typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
        ? response.content.map((item: any) => typeof item === "string" ? item : item.text ?? "").join("")
        : "";
    const parsed = parseJsonPayload(text);

    if (parsed && Array.isArray(parsed.growthSignals) && Array.isArray(parsed.riskFactors)) {
      return {
        ...fallback,
        growthSignals: parsed.growthSignals.slice(0, 4),
        riskFactors: parsed.riskFactors.slice(0, 4),
        overallSentiment: typeof parsed.overallSentiment === "string" ? parsed.overallSentiment : fallback.overallSentiment,
        dataQualityScore: typeof parsed.dataQualityScore === "number" ? parsed.dataQualityScore : fallback.dataQualityScore,
        disclaimer: typeof parsed.disclaimer === "string" ? parsed.disclaimer : fallback.disclaimer,
      };
    }
  } catch (error) {
    console.error("Groq analysis failed, using fallback:", error);
  }

  return fallback;
}

async function buildGroundedDecision(state: AgentStateType) {
  const financialData = state.financialData;
  const revenueGrowth = typeof financialData?.revenueGrowth === "number" ? financialData.revenueGrowth : 0;
  const profitMargins = typeof financialData?.profitMargins === "number" ? financialData.profitMargins : 0;
  const trailingPE = typeof financialData?.trailingPE === "number" ? financialData.trailingPE : 0;
  const qualityScore = scoreDataCompleteness(financialData);

  const hasSolidGrowth = revenueGrowth > 0.05;
  const hasHealthyMargins = profitMargins > 0.1;
  const hasReasonableValuation = trailingPE > 0 && trailingPE < 30;
  const qualitySignals = [hasSolidGrowth, hasHealthyMargins, hasReasonableValuation].filter(Boolean).length;

  let verdict: "Invest" | "Hold" | "Avoid" = "Hold";
  if (qualityScore >= 80 && hasSolidGrowth && hasHealthyMargins && hasReasonableValuation) {
    verdict = "Invest";
  } else if (qualityScore < 60 || (!hasSolidGrowth && !hasHealthyMargins)) {
    verdict = "Avoid";
  }

  const confidence = Math.min(95, Math.max(25, Math.round(qualityScore * 0.45 + qualitySignals * 12)));

  const reasoning = [
    revenueGrowth > 0 ? `Revenue growth is positive at ${(revenueGrowth * 100).toFixed(2)}%.` : "Revenue growth is flat or negative.",
    profitMargins > 0.1 ? `Profit margins are ${Math.round(profitMargins * 100)}% and support the view.` : "Profit margins are weak or unavailable.",
    trailingPE > 0 ? `The valuation metric is ${trailingPE.toFixed(2)}.` : "Valuation data is unavailable.",
    `Data quality score: ${qualityScore}/100 from the live financial feed.`,
  ];

  const fallback = {
    verdict,
    confidence,
    reasoning,
  };

  const model = getGroqModel();
  if (!model) return fallback;

  try {
    const prompt = new SystemMessage(
      "You are an investment committee assistant. Return strict JSON with keys verdict (Invest, Hold, or Avoid), confidence (number), reasoning (array of strings)."
    );
    const userMessage = new HumanMessage(`Company: ${state.companyName}\nData quality score: ${qualityScore}/100\nRevenue growth: ${(revenueGrowth * 100).toFixed(2)}%\nProfit margin: ${(profitMargins * 100).toFixed(2)}%\nP/E ratio: ${trailingPE.toFixed(2)}`);

    const response = await model.invoke([prompt, userMessage]);
    const text = typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
        ? response.content.map((item: any) => typeof item === "string" ? item : item.text ?? "").join("")
        : "";
    const parsed = parseJsonPayload(text);

    if (parsed && typeof parsed.verdict === "string" && Array.isArray(parsed.reasoning)) {
      const normalizedVerdict = parsed.verdict === "Invest" || parsed.verdict === "Hold" || parsed.verdict === "Avoid"
        ? parsed.verdict
        : fallback.verdict;
      return {
        verdict: normalizedVerdict,
        confidence: typeof parsed.confidence === "number" ? Math.min(95, Math.max(25, parsed.confidence)) : fallback.confidence,
        reasoning: parsed.reasoning.slice(0, 4),
      };
    }
  } catch (error) {
    console.error("Groq decision failed, using fallback:", error);
  }

  return fallback;
}

export async function fetchCompanyData(state: AgentStateType): Promise<Partial<AgentStateType>> {
  try {
    const { companyName } = state;
    const ticker = await getCompanyTicker(companyName);
    
    if (!ticker) {
      return { error: `Could not find a stock ticker for company: ${companyName}` };
    }

    const [financialData, newsData] = await Promise.all([
      getFinancialData(ticker),
      getCompanyNews(companyName, ticker),
    ]);

    if (!financialData) {
      return { error: `Could not fetch financial data for ticker: ${ticker}` };
    }

    return {
      financialData,
      newsData: newsData.length > 0 ? newsData : null,
      error: null,
    };
  } catch (error: any) {
    return { error: `Error in data fetching: ${error.message}` };
  }
}

export async function analyzeData(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (state.error || !state.financialData) {
    return {};
  }

  try {
    return { analysis: await buildGroundedAnalysis(state) };
  } catch (error: any) {
    return { error: `Failed to analyze data: ${error.message}` };
  }
}

export async function makeDecision(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (state.error || !state.analysis) {
    return {};
  }

  try {
    return { decision: await buildGroundedDecision(state) };
  } catch (error: any) {
    return { error: `Failed to make decision: ${error.message}` };
  }
}
