
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "尚無交易數據可供分析。";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare a condensed version of history for the prompt
  const tradeSummary = trades.slice(-10).map(t => ({
    symbol: t.symbol,
    pnl: t.pnlAmount,
    emotion: t.emotions,
    error: t.errorCategory,
    rating: t.executionRating
  }));

  const prompt = `
    你是一位專業的交易心理導師與績效分析師。請根據以下交易紀錄，為使用者提供精簡、犀利且具建設性的分析。
    
    最近 10 筆交易摘要：
    ${JSON.stringify(tradeSummary, null, 2)}
    
    請分析：
    1. 使用者的執行紀律趨勢。
    2. 盈虧與情緒標籤的關聯（是否有特定的負面情緒導致虧損？）。
    3. 給出 3 個具體的行動建議，幫助使用者改善下一週的績效。
    
    請用繁體中文回答，口吻專業且帶有激勵感。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text || "AI 暫時無法生成分析報告，請稍後再試。";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "分析過程中發生錯誤，請檢查您的網路連接或稍後再試。";
  }
};
