
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "尚無數據可供分析。";

  // 嚴格遵守指令：從 process.env.API_KEY 獲取金鑰
  // 使用定義檢查以確保在編譯階段不會報錯
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : (window as any).process?.env?.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const tradeSummary = trades.slice(-15).map(t => ({
    symbol: t.symbol,
    pnl: t.pnlAmount,
    direction: t.direction,
    emotion: t.emotions,
    error: t.errorCategory,
    rating: t.executionRating,
    summary: t.summary
  }));

  const prompt = `
    你是一位極其專業且言詞犀利的交易心理導師。
    請分析以下交易數據並提供診斷回覆（繁體中文）：
    ${JSON.stringify(tradeSummary, null, 2)}
    
    回覆格式：
    1. 【核心病灶】：一句話指出致命傷。
    2. 【導師建議】：提供 2 個可執行的改進方案。
    3. 【交易格言】：送他一句話。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    return response.text || "無法產出分析內容。";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("403") || error.message?.includes("401")) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};
