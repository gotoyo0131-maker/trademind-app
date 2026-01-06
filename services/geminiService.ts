
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "目前還沒有交易數據可以分析。請先記錄幾筆交易吧！";

  /**
   * 支援多種平台的環境變數讀取方式
   * 1. process.env.API_KEY (Vercel, Netlify)
   * 2. import.meta.env.VITE_API_KEY (Vite)
   */
  const apiKey = process.env.API_KEY || (window as any).process?.env?.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    console.error("Critical: API_KEY is missing in the current environment.");
    throw new Error("API_KEY_MISSING");
  }

  // 每次分析時重新初始化，確保抓到最新的環境變數（應對 Redeploy 邏輯）
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
    你是一位冷靜、毒舌但極其專業的交易心理教練。請根據以下交易者的近期數據進行「靈魂拷問」與「戰術指導」：
    ${JSON.stringify(tradeSummary, null, 2)}
    
    請以繁體中文回覆，包含：
    1. 【核心病灶】：用一句話點破該交易者目前最大的心理或執行弱點。
    2. 【導師建議】：給出 2 個立即生效的行動指令。
    3. 【金句】：送他一句能在螢幕前提醒自己的話。
    
    語氣要專業且直接，不要廢話。不要使用 Markdown 標題符號，使用粗體即可。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    return response.text || "AI 導師正在休息，請稍後再試。";
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    if (error.status === 403 || error.status === 401) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};
