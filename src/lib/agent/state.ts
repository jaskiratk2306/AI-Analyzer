import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
  companyName: Annotation<string>(),
  financialData: Annotation<Record<string, any> | null>(),
  newsData: Annotation<Array<{ title: string; snippet: string; url: string }> | null>(),
  analysis: Annotation<{
    growthSignals: string[];
    riskFactors: string[];
    overallSentiment: string;
  } | null>(),
  decision: Annotation<{
    verdict: "Invest" | "Pass";
    confidence: number;
    reasoning: string[];
  } | null>(),
  error: Annotation<string | null>(),
});

export type AgentStateType = typeof AgentState.State;
