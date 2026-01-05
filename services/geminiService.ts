
import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types.ts";

export const analyzeTradeHistory = async (trades: Trade[]): Promise<string> => {
  if (trades.length === 0) return "目前還沒有交易資料可以分析。請先記錄您的第一筆交易！";

  // 安全取得 API KEY，避免 process 未定義時崩潰
  const apiKey = (typeof process !== 'undefined' ? process.env.API_KEY : '') || "";
  if (!apiKey) return "系統未設定 API KEY，無法使用 AI 導師功能。";

  const ai = new GoogleGenAI({ apiKey });
  
  const logs = trades.slice(0, 10).map(t => ({
    symbol: t.symbol,
    pnl: t.pnlAmount,
    setup: t.setup,
    emotions: t.emotions,
    error: t.errorCategory,
    execution: t.executionRating,
    summary: t.summary
  }));

  const prompt = `
    你是一位世界級的交易心理導師與績效分析專家。請分析以下使用者最近的交易日誌：
    
    ${JSON.stringify(logs, null, 2)}

    請從以下三個角度給出精簡且有洞察力的回饋（繁體中文）：
    1. 模式識別：是否有特定的情緒（如焦慮或貪婪）導致了虧損？
    2. 紀律評估：使用者的執行力評分與最終盈虧是否成正比？
    3. 下一筆交易的具體建議：給出一個可以立即執行的改進措施。
    
    字數控制在 250 字以內，口吻要專業、嚴厲但具鼓勵性。
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

    return response.text ?? "AI 導師未能生成分析內容，請稍後再試。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 導師目前無法連線。請確保您的 API 金鑰正確且具備存取權限。";
  }
};
