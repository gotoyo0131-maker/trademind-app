
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "尚無交易數據可供分析。";

  // 1. 檢查環境變數
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("Vercel 尚未偵測到 API_KEY 環境變數。請在 Vercel Settings -> Environment Variables 設置後重新 Deploy。");
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
    你是一位專業的交易心理導師與績效分析師。請根據以下交易紀錄，為使用者提供精簡、犀利且具建設性的分析。
    
    最近 10 筆交易摘要：
    ${JSON.stringify(tradeSummary, null, 2)}
    
    請分析：
    1. 使用者的執行紀律趨勢。
    2. 盈虧與情緒標籤的關聯。
    3. 給出 3 個具體的行動建議。
    
    請用繁體中文回答，口吻專業且帶有激勵感。
  `;

  try {
    // 改用相容性更廣的 gemini-flash-latest
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    if (!response.text) {
      throw new Error("AI 返回了空白內容。");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const rawMessage = error.message || String(error);
    
    if (rawMessage.includes("Requested entity was not found") || rawMessage.includes("404")) {
      throw new Error("無法在您的專案中調用此 AI 模型。請確保您的 API Key 所在的專案已啟用 Gemini API 權限。");
    }

    if (rawMessage.includes("403") || rawMessage.includes("401")) {
      throw new Error("API Key 權限受限。請嘗試點擊「手動連結」使用另一個金鑰，或檢查 Vercel 上的 API_KEY 設定。");
    }
    
    throw new Error(`連線錯誤: ${rawMessage}`);
  }
};
