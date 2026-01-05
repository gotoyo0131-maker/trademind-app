
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

export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string; // 本地模擬，實際生產環境不建議存明文
  role: Role;
  createdAt: string;
}

export interface Trade {
  id: string;
  userId: string; // 關聯用戶 ID
  // 第一維度：基礎數據
  entryTime: string;
  exitTime: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  size: number;
  fees: number;
  slippage: number;
  
  // 第二維度：策略
  setup: string;
  stopLoss: number;
  takeProfit: number;

  // 第三維度：心理
  confidence: number;
  emotions: string;
  preTradeMindset: string;
  executionRating: number;
  notesOnExecution: string;

  // 第四維度：總結
  errorCategory: ErrorCategory;
  improvements: string;
  summary: string;

  // 計算欄位
  pnlAmount: number;
  pnlPercentage: number;
  riskRewardRatio: number;
}
