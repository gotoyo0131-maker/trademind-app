
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "尚無交易數據可供分析。";

  // 根據規範：API Key 必須由 process.env.API_KEY 獲取
  // 建立新實例以確保使用最新注入的金鑰
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const tradeSummary = trades.slice(-10).map(t => ({
    symbol: t.symbol,
    pnl: t.pnlAmount,
    emotion: t.emotions,
    error: t.errorCategory,
    rating: t.executionRating
  }));

  const prompt = `
    你是一位專業的交易心理導師。請根據以下交易紀錄進行分析：
    ${JSON.stringify(tradeSummary, null, 2)}
    
    請提供：
    1. 紀律診斷：指出執行上的核心問題。
    2. 行動方案：給出 3 個具體改進動作。
    請用繁體中文，語氣精簡犀利。
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

    return response.text || "AI 暫時無法生成建議。";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMessage = error.message || String(error);
    
    // 規範：若包含 "Requested entity was not found"，代表需要重新選擇 Key
    if (errorMessage.includes("Requested entity was not found")) {
      throw new Error("ENTITY_NOT_FOUND");
    }
    
    throw new Error(errorMessage);
  }
};
