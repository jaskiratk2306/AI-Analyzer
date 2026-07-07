import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, AgentStateType } from "./state";
import { fetchCompanyData, analyzeData, makeDecision } from "./nodes";

// Define the graph
const workflow = new StateGraph(AgentState)
  // Add nodes
  .addNode("fetchData", fetchCompanyData)
  .addNode("analyze", analyzeData)
  .addNode("decide", makeDecision)
  
  // Add edges
  .addEdge(START, "fetchData")
  
  // Conditional edge: if there's an error in fetching data, go to END
  .addConditionalEdges("fetchData", (state: AgentStateType) => {
    if (state.error) return END;
    return "analyze";
  })
  
  .addConditionalEdges("analyze", (state: AgentStateType) => {
    if (state.error) return END;
    return "decide";
  })
  
  .addEdge("decide", END);

// Compile the graph
export const researchAgent = workflow.compile();
