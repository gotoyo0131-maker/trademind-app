
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "尚無交易數據可供分析。";

  // 每次調用時實例化，確保獲取最新的 process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // 準備最近 10 筆交易摘要
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

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // 拋出特定錯誤供 UI 層處理
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    
    return "分析過程中發生錯誤，請檢查您的網路連接或稍後再試。";
  }
};
