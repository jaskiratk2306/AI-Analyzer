import yahooFinanceModule from 'yahoo-finance2';

const YahooFinanceCtor = ((yahooFinanceModule as any).default ?? yahooFinanceModule) as new () => any;
const yahooFinance = new YahooFinanceCtor();

/**
 * Searches for a company by name to find its stock ticker.
 */
export async function getCompanyTicker(companyName: string): Promise<string | null> {
  try {
    const results = await yahooFinance.search(companyName);
    // Find the first equity result
    const equity = results.quotes.find((q: any) => q.isYahooFinance && q.quoteType === 'EQUITY');
    return typeof equity?.symbol === 'string' ? equity.symbol : null;
  } catch (error) {
    console.error("Error finding ticker:", error);
    return null;
  }
}

/**
 * Fetches financial data for a given ticker.
 */
export async function getFinancialData(ticker: string) {
  try {
    const quote = await yahooFinance.quote(ticker);
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ['summaryProfile', 'defaultKeyStatistics', 'financialData']
    });

    return {
      price: quote.regularMarketPrice,
      currency: quote.currency,
      marketCap: quote.marketCap,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      trailingPE: quote.trailingPE,
      forwardPE: quote.forwardPE,
      industry: summary.summaryProfile?.industry,
      sector: summary.summaryProfile?.sector,
      businessSummary: summary.summaryProfile?.longBusinessSummary,
      profitMargins: summary.financialData?.profitMargins,
      revenueGrowth: summary.financialData?.revenueGrowth,
      totalCash: summary.financialData?.totalCash,
      totalDebt: summary.financialData?.totalDebt,
    };
  } catch (error) {
    console.error("Error fetching financials:", error);
    return null;
  }
}

/**
 * Fetches recent news for a given ticker.
 */
export async function getCompanyNews(companyName: string, ticker: string | null) {
  try {
    // We can search by ticker if we have it, otherwise by company name
    const query = ticker || companyName;
    const results = await yahooFinance.search(query);
    
    if (!results.news || results.news.length === 0) {
      return [];
    }

    return results.news.slice(0, 5).map((item: any) => ({
      title: item.title || "News update",
      snippet: item.summary || item.title || "No summary available",
      url: item.link || "",
    }));
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}
