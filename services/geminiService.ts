
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "目前還沒有交易資料可以分析。請先記錄您的第一筆交易！";

  try {
    // 嚴格遵守 SDK 初始化規範
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    // 整理最近的交易日誌摘要
    const logsSummary = trades.slice(0, 10).map(t => ({
      symbol: t.symbol,
      pnl: t.pnlAmount,
      setup: t.setup,
      emotions: t.emotions,
      error: t.errorCategory,
      execution: t.executionRating,
      summary: t.summary
    }));

    const prompt = `
      你是一位世界級交易心理導師與績效分析專家。請分析以下交易數據：
      ${JSON.stringify(logsSummary, null, 2)}
      
      請提供專業分析（繁體中文）：
      1. 識別交易者在這些紀錄中展現的潛在心理偏誤（如貪婪、恐懼、過度交易等）。
      2. 評價其執行紀律與策略一致性。
      3. 給出一個可以立即改善下一筆交易的具體、可執行的行動建議。
      
      內容請精簡、直接，控制在 250 字以內，並使用專業且鼓勵性質的語氣。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI 回傳了空的內容。");
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    
    // 針對常見錯誤提供更友善的提示
    if (error?.message?.includes('API_KEY')) {
      return "系統未偵測到有效的 API_KEY。請確保已在環境變數中設定 API_KEY。";
    }
    if (error?.message?.includes('403')) {
      return "API 金鑰權限不足或已被封鎖，請檢查 Google AI Studio 設定。";
    }
    
    return `AI 導師暫時離線 (${error.message || "未知錯誤"})。請檢查網路連線或稍後再試。`;
  }
};
