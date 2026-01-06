
import React, { useMemo, useState } from 'react';
import { Trade, TradeDirection } from '../types';
import GeminiCoach from './GeminiCoach';
import TradeCalendar from './TradeCalendar';

interface DashboardProps {
  trades: Trade[];
  onViewLogs: () => void;
  onDateClick: (dateStr: string) => void;
  onAddFirstTrade: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ trades, onViewLogs, onDateClick, onAddFirstTrade }) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'overall'>('overall');
  const [currentDate, setCurrentDate] = useState(new Date());

  // 計算邏輯：根據 viewMode 決定參與計算的交易
  const filteredTrades = useMemo(() => {
    if (viewMode === 'overall') return trades;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return trades.filter(t => {
      const d = new Date(t.entryTime);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [trades, viewMode, currentDate]);

  const stats = useMemo(() => {
    if (filteredTrades.length === 0) return null;
    const wins = filteredTrades.filter(t => t.pnlAmount > 0);
    const losses = filteredTrades.filter(t => t.pnlAmount < 0);
    const totalPnl = filteredTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
    const winRate = (wins.length / filteredTrades.length) * 100;
    const avgProfit = wins.length > 0 ? wins.reduce((acc, t) => acc + t.pnlAmount, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((acc, t) => acc + t.pnlAmount, 0) / losses.length : 0;
    
    const sortedByPnl = [...filteredTrades].sort((a, b) => b.pnlAmount - a.pnlAmount);
    const bestTrade = sortedByPnl[0];
    const worstTrade = sortedByPnl[sortedByPnl.length - 1];

    const longCount = filteredTrades.filter(t => t.direction === TradeDirection.LONG).length;
    const shortCount = filteredTrades.filter(t => t.direction === TradeDirection.SHORT).length;

    const getMinutes = (t: Trade) => (new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / 60000;
    const winHolding = wins.length > 0 ? wins.reduce((acc, t) => acc + getMinutes(t), 0) / wins.length : 0;
    const lossHolding = losses.length > 0 ? losses.reduce((acc, t) => acc + getMinutes(t), 0) / losses.length : 0;

    return {
      total: filteredTrades.length,
      winRate,
      totalPnl,
      avgProfit,
      avgLoss,
      bestTrade,
      worstTrade,
      longCount,
      shortCount,
      winHolding,
      lossHolding
    };
  }, [filteredTrades]);

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 text-4xl mb-4 shadow-sm border border-indigo-100">
          <i className="fas fa-book-open"></i>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">開啟您的交易日誌</h2>
          <p className="text-slate-400 max-w-md mx-auto font-medium">尚無交易記錄。開始記錄您的每一筆交易，TradeMind 將為您提供深度心理與績效分析。</p>
        </div>
        <button 
          onClick={onAddFirstTrade} 
          className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-95 flex items-center gap-3"
        >
          <i className="fas fa-plus-circle"></i>
          記錄第一筆交易
        </button>
      </div>
    );
  }

  const TradeSmallCard = ({ trade, title, color }: { trade?: Trade, title: string, color: string }) => (
    <div className={`bg-white p-6 rounded-2xl border-t-4 ${color} shadow-sm space-y-3`}>
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
      {trade ? (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800">{trade.symbol}</span>
            <span className={`text-sm font-black ${trade.pnlAmount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ${Math.abs(trade.pnlAmount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>{trade.setup}</span>
            <span>{new Date(trade.entryTime).toLocaleDateString()}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-300 italic">本期尚無資料</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {viewMode === 'monthly' ? '月度績效儀表板' : '總體績效儀表板'}
          </h2>
          <p className="text-slate-500 font-medium">
            {viewMode === 'monthly' 
              ? `${currentDate.getFullYear()} 年 ${currentDate.getMonth() + 1} 月的數據分析` 
              : '歷史所有交易紀錄的彙整統計'}
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={() => setViewMode('monthly')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${viewMode === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>按月分析</button>
          <button onClick={() => setViewMode('overall')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${viewMode === 'overall' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>總體績效</button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">總交易筆數</p>
          <p className="text-2xl font-black text-slate-800">{stats?.total || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">累計盈虧</p>
          <p className={`text-2xl font-black ${(stats?.totalPnl || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${(stats?.totalPnl || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">勝率 (Win Rate)</p>
          <p className="text-2xl font-black text-indigo-600">{(stats?.winRate || 0).toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">平均盈利</p>
          <p className="text-2xl font-black text-emerald-500">${(stats?.avgProfit || 0).toFixed(1)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">平均虧損</p>
          <p className="text-2xl font-black text-rose-500">${Math.abs(stats?.avgLoss || 0).toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {viewMode === 'monthly' ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <TradeCalendar 
                trades={trades} 
                onDateClick={onDateClick} 
                currentDate={currentDate} 
                setCurrentDate={setCurrentDate} 
              />
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <i className="fas fa-chart-area text-indigo-500"></i>
                <h3 className="font-bold text-slate-800">交易數據總結 (總計)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">多空方向百分比</p>
                  <div className="flex h-12 w-full rounded-xl overflow-hidden shadow-inner">
                    <div className="bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white transition-all" style={{ width: stats ? `${(stats.longCount / stats.total) * 100}%` : '50%' }}>做多 {stats ? ((stats.longCount / stats.total) * 100).toFixed(0) : 0}%</div>
                    <div className="bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white transition-all" style={{ width: stats ? `${(stats.shortCount / stats.total) * 100}%` : '50%' }}>做空 {stats ? ((stats.shortCount / stats.total) * 100).toFixed(0) : 0}%</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">平均持倉效率</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">總平均持倉</span>
                    <span className="text-xl font-black text-slate-800">{stats ? ((stats.winHolding + stats.lossHolding) / 2).toFixed(0) : 0} 分</span>
                  </div>
                </div>
              </div>
              <GeminiCoach trades={trades} />
            </div>
          )}

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <i className="fas fa-hourglass-half text-indigo-500"></i>
              <h3 className="font-bold text-slate-800">{viewMode === 'monthly' ? '本月持倉時間' : '歷史持倉時間'}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">平均獲利時間</p>
                  <p className="text-3xl font-black text-emerald-600">{(stats?.winHolding || 0).toFixed(0)} <span className="text-sm">分</span></p>
               </div>
               <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">平均損失時間</p>
                  <p className="text-3xl font-black text-rose-600">{(stats?.lossHolding || 0).toFixed(0)} <span className="text-sm">分</span></p>
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <TradeSmallCard title={viewMode === 'monthly' ? "本月最佳交易" : "最佳交易 (Best)"} trade={stats?.bestTrade} color="border-emerald-500" />
          <TradeSmallCard title={viewMode === 'monthly' ? "本月最糟交易" : "最糟交易 (Worst)"} trade={stats?.worstTrade} color="border-rose-500" />
          
          <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden shadow-xl min-h-[250px] flex flex-col justify-center">
            <i className="fas fa-rocket absolute -right-6 -bottom-6 text-9xl opacity-10 rotate-12"></i>
            <p className="text-indigo-300 font-bold uppercase tracking-widest text-[10px] mb-2">{viewMode === 'monthly' ? '本月方向分佈' : '總體方向分佈'}</p>
            {stats ? (
              <div className="space-y-4 relative z-10">
                 <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${(stats.longCount/stats.total)*100}%` }}></div>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold">
                    <span>做多 {((stats.longCount/stats.total)*100).toFixed(0)}%</span>
                    <span>做空 {((stats.shortCount/stats.total)*100).toFixed(0)}%</span>
                 </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic relative z-10">尚無方向數據</p>
            )}
            <button onClick={onViewLogs} className="mt-8 bg-white/10 hover:bg-white/20 border border-white/20 py-3 px-6 rounded-xl text-xs font-bold transition self-start relative z-10">
              查看日誌
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
