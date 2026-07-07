import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { AgentStateType } from "./state";
import { getCompanyTicker, getFinancialData, getCompanyNews } from "./tools";

function getGroqApiKey() {
  return process.env.GROQ_API_KEY?.trim();
}

// Lazy-initialize LLM so env vars are read at call time, not at import time
function getLLM() {
  return new ChatGroq({
    model: "llama-3.1-8b-instant", // Fast, free tier on Groq
    temperature: 0.2,
    apiKey: getGroqApiKey(),
  });
}

function buildFallbackAnalysis(state: AgentStateType) {
  const financialData = state.financialData;
  const growthSignals: string[] = [];
  const riskFactors: string[] = [];

  if ((financialData?.revenueGrowth ?? 0) > 0.05) {
    growthSignals.push("Revenue growth is positive, which is a constructive sign for the business.");
  } else {
    growthSignals.push("Revenue growth data is limited or flat, so growth should be monitored closely.");
  }

  if ((financialData?.profitMargins ?? 0) > 0.1) {
    growthSignals.push("Profit margins appear healthy, suggesting operational efficiency.");
  }

  if (financialData?.marketCap && financialData.marketCap > 1e9) {
    growthSignals.push("The company has meaningful scale, which can support resilience.");
  }

  if ((financialData?.trailingPE ?? 0) <= 0 || (financialData?.trailingPE ?? 0) > 40) {
    riskFactors.push("The valuation is either not available or appears stretched relative to typical expectations.");
  }

  if ((financialData?.revenueGrowth ?? 0) < 0) {
    riskFactors.push("Recent revenue momentum is negative, which may reflect business pressure.");
  }

  if (!financialData?.industry || !financialData?.sector) {
    riskFactors.push("Sector and industry context are incomplete, limiting confidence in the assessment.");
  }

  return {
    growthSignals: growthSignals.length > 0 ? growthSignals : ["The available data is too limited to highlight strong growth signals."],
    riskFactors: riskFactors.length > 0 ? riskFactors : ["The available data does not show obvious risk concerns."],
    overallSentiment: `The company appears to have ${((financialData?.revenueGrowth ?? 0) > 0 ? "positive" : "mixed")} momentum based on the available financial indicators. A fuller analysis would be possible with a Groq API key and richer market context.`,
  };
}

function buildFallbackDecision(state: AgentStateType) {
  const financialData = state.financialData;
  const revenueGrowth = financialData?.revenueGrowth ?? 0;
  const profitMargins = financialData?.profitMargins ?? 0;
  const trailingPE = financialData?.trailingPE ?? 0;

  const isHealthyGrowth = revenueGrowth > 0.05;
  const isHealthyMargin = profitMargins > 0.1;
  const isReasonableValuation = trailingPE > 0 && trailingPE < 40;

  const verdict: "Invest" | "Pass" = isHealthyGrowth && isHealthyMargin && isReasonableValuation ? "Invest" : "Pass";
  const confidence = Math.min(90, 55 + Number(isHealthyGrowth) * 12 + Number(isHealthyMargin) * 10 + Number(isReasonableValuation) * 8);

  return {
    verdict,
    confidence,
    reasoning: [
      isHealthyGrowth ? "Revenue growth is positive." : "Revenue growth is weak or unavailable.",
      isHealthyMargin ? "Profit margins look supportive." : "Profit margins are not clearly supportive.",
      isReasonableValuation ? "The valuation looks reasonable enough for a cautious entry." : "The valuation looks less attractive or is unclear.",
    ],
  };
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

  const prompt = `You are an expert financial analyst. Analyze the following data for a company.

Financial Data:
${JSON.stringify(state.financialData, null, 2)}

Recent News:
${JSON.stringify(state.newsData, null, 2)}

Provide a structured analysis. Respond ONLY with a raw JSON object (no markdown, no code fences), like this exact format:
{"growthSignals":["signal 1","signal 2","signal 3"],"riskFactors":["risk 1","risk 2","risk 3"],"overallSentiment":"A paragraph summarizing the overall market sentiment."}`;

  try {
    if (!getGroqApiKey()) {
      return { analysis: buildFallbackAnalysis(state) };
    }

    const llm = getLLM();
    const response = await llm.invoke(prompt);
    let content = response.content as string;
    
    // Strip any markdown code fences if present
    content = content.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
    // Extract just the JSON object
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in LLM response");

    const analysis = JSON.parse(jsonMatch[0]);
    return { analysis };
  } catch (error: any) {
    return { error: `Failed to analyze data: ${error.message}` };
  }
}

export async function makeDecision(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (state.error || !state.analysis) {
    return {};
  }

  const prompt = `You are a senior investment committee member making a final call on a company.

Company: ${state.companyName}

Analysis:
${JSON.stringify(state.analysis, null, 2)}

Key Financials: Price=$${state.financialData?.price?.toFixed(2)}, MarketCap=$${state.financialData?.marketCap}, P/E=${state.financialData?.trailingPE?.toFixed(1)}, RevenueGrowth=${state.financialData?.revenueGrowth ? (state.financialData.revenueGrowth * 100).toFixed(1) + '%' : 'N/A'}

Make a final investment decision. Respond ONLY with a raw JSON object (no markdown, no code fences), like this exact format:
{"verdict":"Invest","confidence":75,"reasoning":["Reason 1 here","Reason 2 here","Reason 3 here"]}

verdict must be exactly "Invest" or "Pass". confidence is a number 0-100.`;

  try {
    if (!getGroqApiKey()) {
      return { decision: buildFallbackDecision(state) };
    }

    const llm = getLLM();
    const response = await llm.invoke(prompt);
    let content = response.content as string;
    
    // Strip any markdown code fences
    content = content.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();
    // Extract just the JSON object
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in LLM response");

    const decision = JSON.parse(jsonMatch[0]);
    return { decision };
  } catch (error: any) {
    return { error: `Failed to make decision: ${error.message}` };
  }
}
