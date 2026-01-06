
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

// 告訴 TypeScript process 變數在環境中是存在的
declare const process: any;

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "目前還沒有交易數據可以分析。";

  let apiKey = "";
  try {
    // 優先嘗試標準讀取方式
    apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : "";
    
    // 如果是 undefined 或是字串 "undefined"，嘗試從全局視窗讀取
    if (!apiKey || apiKey === "undefined") {
      apiKey = (window as any).process?.env?.API_KEY || "";
    }
  } catch (e) {
    console.warn("Env access warning:", e);
  }
  
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
    你是一位冷靜、專業的交易心理教練。請根據以下交易數據提供分析：
    ${JSON.stringify(tradeSummary, null, 2)}
    
    請以繁體中文回覆：
    1. 【核心病灶】：點破最大的心理弱點。
    2. 【導師建議】：給出 2 個行動指令。
    3. 【金句】：送他一句提醒的話。
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

    return response.text || "AI 導師暫時無法回應。";
  } catch (error: any) {
    if (error.status === 403 || error.status === 401) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
};
