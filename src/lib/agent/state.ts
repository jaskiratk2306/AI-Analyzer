import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  companyName: Annotation<string>(),
  financialData: Annotation<Record<string, any> | null>(),
  newsData: Annotation<Array<{ title: string; snippet: string; url: string }> | null>(),
  analysis: Annotation<{
    growthSignals: string[];
    riskFactors: string[];
    overallSentiment: string;
    dataSource: string;
    generatedAt: string;
    dataQualityScore: number;
    disclaimer: string;
  } | null>(),
  decision: Annotation<{
    verdict: "Invest" | "Hold" | "Avoid";
    confidence: number;
    reasoning: string[];
  } | null>(),
  error: Annotation<string | null>(),
});

export type AgentStateType = typeof AgentState.State;
