
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "尚無交易數據可供分析。";

  // 1. 優先嘗試獲取環境變數
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    // 拋出特定錯誤，讓 UI 知道是變數缺失
    throw new Error("MISSING_ENV_KEY");
  }

  // 每次呼叫都重新建立實例，確保抓到最新的 key (尤其是手動連結後)
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
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
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    if (!response.text) {
      throw new Error("AI 返回了空內容，請重試。");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const rawMessage = error.message || String(error);
    
    // 處理常見的 API 錯誤
    if (rawMessage.includes("Requested entity was not found")) {
      throw new Error("MODEL_NOT_FOUND: 您選擇的金鑰不支援 Gemini 3 模型，請確保金鑰來自付費專案。");
    }
    if (rawMessage.includes("API key not valid")) {
      throw new Error("INVALID_KEY: 金鑰無效或已過期。");
    }
    
    throw new Error(`API 連線失敗: ${rawMessage}`);
  }
};
