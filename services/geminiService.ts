
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "目前還沒有交易資料可以分析。請先記錄您的第一筆交易！";

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    return "系統未偵測到有效的 API_KEY。請確保已在環境變數中設定 API_KEY。";
  }

  try {
    // 每次調用時初始化以確保獲取最新 Key (符合 guidelines)
    const ai = new GoogleGenAI({ apiKey });
    
    // 整理最近的交易日誌摘要，限制數量避免 Token 過大
    const logsSummary = trades.slice(0, 15).map(t => ({
      symbol: t.symbol,
      pnl: t.pnlAmount,
      setup: t.setup,
      emotions: t.emotions,
      error: t.errorCategory,
      execution: t.executionRating,
      summary: t.summary
    }));

    const promptText = `
      你是一位世界級交易心理導師與績效分析專家。
      以下是交易者最近的 15 筆交易紀錄摘要：
      ${JSON.stringify(logsSummary, null, 2)}
      
      請根據以上數據提供專業分析（請使用繁體中文）：
      1. 識別交易者展現的心理偏誤（如貪婪、恐懼、報復性交易等）。
      2. 評價其執行紀律與策略一致性。
      3. 給出一個可以立即改善下一筆交易的具體行動建議。
      
      要求：語氣專業且具鼓勵性，內容控制在 250 字以內，直接切入重點，不要有過多的開場白。
    `;

    // 使用 generateContent 調用
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI 回傳內容為空");
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini AI API Error:", error);
    
    // 錯誤分類處理
    if (error.message?.includes('403')) {
      return "API 金鑰權限不足或已被封鎖，請檢查 Google AI Studio 設定。";
    }
    if (error.message?.includes('429')) {
      return "請求過於頻繁，請稍後再試。";
    }
    
    return `AI 導師暫時離線 (${error.message || "未知錯誤"})。請檢查網路連線或稍後再試。`;
  }
};
