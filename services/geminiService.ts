
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "目前還沒有交易資料可以分析。請先記錄您的第一筆交易！";

  // 安全取得 API KEY
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : "";
  if (!apiKey) return "系統未檢測到 API_KEY，請在 Vercel 或環境變數中設定。";

  const ai = new GoogleGenAI({ apiKey });
  
  const logs = trades.slice(0, 8).map(t => ({
    symbol: t.symbol,
    pnl: t.pnlAmount,
    setup: t.setup,
    emotions: t.emotions,
    error: t.errorCategory,
    execution: t.executionRating,
    summary: t.summary
  }));

  const prompt = `
    你是一位世界級交易心理導師。請分析以下交易數據：
    ${JSON.stringify(logs, null, 2)}
    
    請提供專業分析（繁體中文）：
    1. 識別潛在的心理偏誤。
    2. 指出執行力最強與最弱的地方。
    3. 給出一個可以立即改善下一筆交易的具體行動建議。
    
    內容精簡，控制在 200 字以內。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text ?? "AI 導師目前無法回覆內容。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 導師連線失敗，請稍後再試。";
  }
};
