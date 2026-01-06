
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "尚無交易數據可供分析。";

  // 1. 嘗試讀取環境變數 (Vercel 雲端環境常因安全限制為 undefined)
  const apiKey = process.env.API_KEY;
  
  // 如果連環境變數都沒有，拋出特定錯誤代碼
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("AUTH_REQUIRED");
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
    請用繁體中文，語氣犀利且精簡。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return response.text || "AI 無法生成建議，請稍後再試。";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    const msg = error.message || "";
    // 如果是權限錯誤，也引導使用者重新選擇金鑰
    if (msg.includes("403") || msg.includes("401") || msg.includes("not found")) {
      throw new Error("AUTH_REQUIRED");
    }
    throw new Error(`連線失敗: ${msg}`);
  }
};
