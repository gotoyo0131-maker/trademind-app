
export enum TradeDirection {
  LONG = '多 (Long)',
  SHORT = '空 (Short)'
}

export enum ErrorCategory {
  NONE = '無 (紀律執行)',
  MARKET_VOLATILITY = '市場隨機波動',
  OVER_TRADING = '過度交易',
  NO_STOP_LOSS = '未設止損',
  FOMO = 'FOMO (怕錯過)',
  EMOTIONAL_TRADING = '情緒化交易',
  REVENGE_TRADING = '報復性交易',
  BREAKING_RULES = '違反交易規則'
}

export interface Trade {
  id: string;
  // 第一維度：基礎數據 (Hard Data)
  entryTime: string;
  exitTime: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  size: number;
  fees: number;
  slippage: number;
  
  // 第二維度：策略與邏輯 (Technical)
  setup: string;
  stopLoss: number;
  takeProfit: number;
  screenshotBefore?: string;
  screenshotAfter?: string;

  // 第三維度：心理狀態與行為 (Subjective)
  confidence: number; // 1-10
  emotions: string; // 標籤
  preTradeMindset: string; // 進場前心態
  executionRating: number; // 1-5 星
  notesOnExecution: string;

  // 第四維度：檢討與總結 (Growth)
  errorCategory: ErrorCategory;
  improvements: string;
  summary: string;

  // 自動計算欄位
  pnlAmount: number;
  pnlPercentage: number;
  riskRewardRatio: number;
}
