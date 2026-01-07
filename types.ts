
export type Role = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: Role;
  createdAt: string;
  isActive?: boolean;
  initialBalance?: number;
  useInitialBalance?: boolean;
}

export enum TradeDirection {
  LONG = '做多 (Long)',
  SHORT = '做空 (Short)'
}

export enum ErrorCategory {
  NONE = '無 (完美執行)',
  FOMO = 'FOMO (害怕錯過)',
  OVERTRADE = '過度交易',
  REVENGE = '報復性交易',
  RULE_BREAK = '違反交易規則',
  HESITATION = '猶豫不決',
  STOP_MOVE = '亂移止損',
  EARLY_EXIT = '過早出場'
}

export interface TradeScreenshot {
  url: string;
  description: string;
}

export interface Trade {
  id: string;
  userId: string;
  entryTime: string;
  exitTime: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  size: number;
  fees: number;
  slippage?: number;
  setup: string;
  stopLoss?: number;
  takeProfit?: number;
  initialRisk?: number; // 新增：初始風險金額
  confidence: number;
  emotions: string;
  preTradeMindset?: string;
  executionRating: number;
  notesOnExecution?: string;
  errorCategory: ErrorCategory;
  improvements?: string;
  summary: string;
  pnlAmount: number;
  pnlPercentage: number;
  riskRewardRatio?: number;
  screenshots: TradeScreenshot[];
}

export interface GitHubConfig {
  token: string;
  gistId?: string;
}
