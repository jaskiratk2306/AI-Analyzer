import "dotenv/config";
import { NextResponse } from "next/server";
import { researchAgent } from "@/lib/agent/graph";
import { getCompanyTicker, getFinancialData, getCompanyNews } from "@/lib/agent/tools";
import { getUserByEmail, incrementSearchCount } from "@/lib/data/users";

// Vercel maxDuration: allows longer execution times (e.g. 60s for Pro, or 10-15s for Hobby)
export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const { companyName, email } = await req.json();

    if (!companyName || typeof companyName !== "string") {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }

    const user = email ? getUserByEmail(email) : null;
    if (user && !user.isSubscriber && user.searchCount >= 3) {
      return NextResponse.json({ error: "Free search limit reached. Upgrade to continue." }, { status: 403 });
    }

    const initialState = {
      companyName,
      financialData: null,
      newsData: null,
      analysis: null,
      decision: null,
      error: null,
    };

    let finalState: any;
    try {
      finalState = await researchAgent.invoke(initialState);
    } catch (error: any) {
      const ticker = await getCompanyTicker(companyName);
      const financialData = ticker ? await getFinancialData(ticker) : null;
      const newsData = ticker ? await getCompanyNews(companyName, ticker) : [];

      finalState = {
        companyName,
        financialData,
        newsData,
        analysis: financialData
          ? {
              growthSignals: [
                financialData.revenueGrowth ? `Revenue growth is ${Math.round(financialData.revenueGrowth * 100)}%.` : "Revenue growth data was unavailable.",
                financialData.profitMargins ? `Operating margin is ${Math.round(financialData.profitMargins * 100)}%.` : "Profit margin data was unavailable.",
              ],
              riskFactors: financialData.trailingPE ? [] : ["Valuation data was unavailable."],
              overallSentiment: "Fallback analysis generated from the live financial feed because the graph pipeline was unavailable.",
              dataSource: "Yahoo Finance via yahoo-finance2",
              generatedAt: new Date().toISOString(),
              dataQualityScore: financialData ? 70 : 35,
              disclaimer: "AI-generated analysis only. Not financial advice.",
            }
          : null,
        decision: financialData
          ? {
              verdict: "Hold",
              confidence: 55,
              reasoning: [
                `The analysis uses a direct financial-data fallback for ${companyName}.`,
                financialData.trailingPE ? `Current valuation is ${financialData.trailingPE.toFixed(2)}.` : "Valuation details were unavailable.",
              ],
            }
          : {
              verdict: "Hold",
              confidence: 25,
              reasoning: ["The company could not be analyzed from the current financial feed."],
            },
        error: null,
      };
    }

    if (finalState.error) {
      return NextResponse.json({ error: finalState.error }, { status: 500 });
    }

    if (user) {
      incrementSearchCount(user.email);
    }

    return NextResponse.json(finalState);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during research." },
      { status: 500 }
    );
  }
}
