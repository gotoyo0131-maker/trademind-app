
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "尚無數據可供分析。";

  // Fix: Initialize GoogleGenAI strictly using process.env.API_KEY as per guidelines.
  // The SDK requires a named parameter object: { apiKey: string }.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    // Fix: Using gemini-3-pro-preview for complex reasoning task as per guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    // Fix: Accessing .text property directly (not as a method).
    return response.text || "無法產出分析內容。";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
