import "dotenv/config";
import { NextResponse } from "next/server";
import { researchAgent } from "@/lib/agent/graph";
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

    // Run the LangGraph agent. If no Groq key is configured, the agent falls back to a deterministic analysis.
    const initialState = {
      companyName,
      financialData: null,
      newsData: null,
      analysis: null,
      decision: null,
      error: null,
    };

    const finalState = await researchAgent.invoke(initialState);

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
