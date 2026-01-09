
import { createClient } from '@supabase/supabase-js';
import { Trade, User } from '../types';

const SUPABASE_URL = 'https://yxfxxvomfxgukswrgxjz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4Znh4dm9tZnhndWtzd3JneGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTg1NDcsImV4cCI6MjA4MzM5NDU0N30._gqouQh6COivUig4VuaQzkFAIrBPMC7xMKPZCqeCUGo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const isValidUUID = (id: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return id && regex.test(id);
};

// 更新：強制要求 userId 參數
export const fetchTrades = async (userId: string) => {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId) // 關鍵：在此過濾使用者 ID
    .order('entry_time', { ascending: false });
  
  if (error) {
    console.error("Fetch trades error:", error);
    if (error.message?.includes('infinite recursion') || error.message?.includes('deadlock')) {
      throw new Error("系統連線衝突。請使用『深度清理』按鈕重新啟動。");
    }
    return [];
  }
  return data ? data.map(mapDbToTrade) : [];
};

export const saveTrade = async (trade: Partial<Trade>) => {
  const dbData = mapTradeToDb(trade);
  if (dbData.id && !isValidUUID(dbData.id)) {
    delete dbData.id;
  }
  const { data, error } = await supabase
    .from('trades')
    .upsert(dbData)
    .select()
    .single();
  
  if (error) throw error;
  return mapDbToTrade(data);
};

export const deleteTrade = async (id: string) => {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    return null;
  }
  return data;
};

export const saveProfile = async (profile: any) => {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(profile);
  if (error) throw error;
};

export const deleteProfile = async (userId: string) => {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId);
  if (error) throw error;
};

export const fetchAllProfiles = async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*');
  if (error) throw error;
  return data || [];
};

export const createInvitation = async (email: string, password: string, role: string = 'user') => {
  const { error } = await supabase
    .from('user_invitations')
    .insert([{ email, password, role }]);
  if (error) throw error;
};

export const fetchInvitations = async () => {
  const { data, error } = await supabase
    .from('user_invitations')
    .select('*');
  if (error) throw error;
  return data || [];
};

export const deleteInvitation = async (id: string) => {
  const { error } = await supabase
    .from('user_invitations')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const deleteInvitationsByEmail = async (email: string) => {
  const { error } = await supabase
    .from('user_invitations')
    .delete()
    .eq('email', email);
  if (error) throw error;
};

export const findInvitation = async (email: string) => {
  const { data, error } = await supabase
    .from('user_invitations')
    .select('*')
    .eq('email', email);
  
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[data.length - 1];
};

const mapDbToTrade = (db: any): Trade => ({
  id: db.id,
  userId: db.user_id,
  entryTime: db.entry_time,
  exitTime: db.exit_time,
  symbol: db.symbol,
  direction: db.direction,
  entryPrice: Number(db.entry_price || 0),
  exitPrice: Number(db.exit_price || 0),
  size: Number(db.size || 0),
  fees: Number(db.fees || 0),
  slippage: Number(db.slippage || 0),
  setup: db.setup || '未知策略',
  stopLoss: db.stop_loss ? Number(db.stop_loss) : undefined,
  takeProfit: db.take_profit ? Number(db.take_profit) : undefined,
  initialRisk: db.initial_risk ? Number(db.initial_risk) : undefined,
  confidence: db.confidence || 0,
  emotions: db.emotions || '',
  preTradeMindset: db.pre_trade_mindset || '',
  executionRating: db.execution_rating || 0,
  notesOnExecution: db.notes_on_execution || '',
  errorCategory: db.error_category || '無',
  summary: db.summary || '',
  improvements: db.improvements || '',
  pnlAmount: Number(db.pnl_amount || 0),
  pnlPercentage: Number(db.pnl_percentage || 0),
  riskRewardRatio: db.risk_reward_ratio ? Number(db.risk_reward_ratio) : undefined,
  screenshots: db.screenshots || []
});

const mapTradeToDb = (trade: any) => ({
  id: trade.id,
  user_id: trade.userId,
  entry_time: trade.entryTime,
  exit_time: trade.exitTime,
  symbol: trade.symbol,
  direction: trade.direction,
  entry_price: trade.entryPrice,
  exit_price: trade.exitPrice,
  size: trade.size,
  fees: trade.fees,
  slippage: trade.slippage,
  setup: trade.setup,
  stop_loss: trade.stopLoss,
  take_profit: trade.takeProfit,
  initial_risk: trade.initialRisk,
  confidence: trade.confidence,
  emotions: trade.emotions,
  pre_trade_mindset: trade.preTradeMindset,
  execution_rating: trade.executionRating,
  notes_on_execution: trade.notesOnExecution, // 已修正：原為 trade.notes_on_execution
  error_category: trade.errorCategory,
  summary: trade.summary,
  improvements: trade.improvements,
  pnl_amount: trade.pnlAmount,
  pnl_percentage: trade.pnlPercentage,
  risk_reward_ratio: trade.riskRewardRatio,
  screenshots: trade.screenshots
});
