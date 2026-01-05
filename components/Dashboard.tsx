
import React, { useMemo, useState } from 'react';
import { Trade, TradeDirection } from '../types';

interface DashboardProps {
  trades: Trade[];
  onViewLogs: () => void;
  onDateClick: (dateStr: string) => void;
}

type Period = 'all' | 'month';

interface CalendarDay {
  empty?: boolean;
  day?: number;
  pnl?: number;
  count?: number;
  dateStr?: string;
}

const formatDuration = (ms: number) => {
  if (ms <= 0 || isNaN(ms)) return "0 分";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天 ${hours % 24}時`;
  if (hours > 0) return `${hours}時 ${minutes % 60}分`;
  return `${minutes}分`;
};

const Dashboard: React.FC<DashboardProps> = ({ trades, onViewLogs, onDateClick }) => {
  const [period, setPeriod] = useState<Period>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const filteredTrades = useMemo(() => {
    if (period === 'all') return trades;
    return trades.filter(t => {
      const d = new Date(t.entryTime);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [trades, period, year, month]);

  const stats = useMemo(() => {
    if (filteredTrades.length === 0) return {
      totalTrades: 0, winRate: 0, totalPnl: 0, avgDuration: 0, avgProfit: 0, avgLoss: 0,
      avgWinDuration: 0, avgLossDuration: 0, bestTrade: null, worstTrade: null,
      longPct: 0, shortPct: 0, longCount: 0, shortCount: 0
    };

    const totalTrades = filteredTrades.length;
    const wins = filteredTrades.filter(t => t.pnlAmount > 0);
    const losses = filteredTrades.filter(t => t.pnlAmount < 0);
    
    const winRate = (wins.length / totalTrades) * 100;
    const totalPnl = filteredTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
    
    const getDuration = (t: Trade) => new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime();
    
    const avgDuration = filteredTrades.reduce((acc, t) => acc + getDuration(t), 0) / totalTrades;
    const avgWinDuration = wins.length > 0 
      ? wins.reduce((acc, t) => acc + getDuration(t), 0) / wins.length 
      : 0;
    const avgLossDuration = losses.length > 0 
      ? losses.reduce((acc, t) => acc + getDuration(t), 0) / losses.length 
      : 0;

    const avgProfit = wins.length > 0 ? wins.reduce((acc, t) => acc + t.pnlAmount, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((acc, t) => acc + t.pnlAmount, 0) / losses.length : 0;

    const longCount = filteredTrades.filter(t => t.direction.includes('多') || t.direction === TradeDirection.LONG).length;
    const shortCount = totalTrades - longCount;
    const longPct = totalTrades > 0 ? (longCount / totalTrades) * 100 : 0;
    const shortPct = totalTrades > 0 ? (shortCount / totalTrades) * 100 : 0;

    // 排序找出最佳與最差交易
    const sortedByPnl = [...filteredTrades].sort((a, b) => b.pnlAmount - a.pnlAmount);
    
    // 只有在真的有獲利時才定義為 bestTrade
    const bestCandidate = sortedByPnl[0];
    const bestTrade = bestCandidate && bestCandidate.pnlAmount > 0 ? bestCandidate : null;
    
    // 只有在真的有虧損時才定義為 worstTrade
    const worstCandidate = sortedByPnl[sortedByPnl.length - 1];
    const worstTrade = worstCandidate && worstCandidate.pnlAmount < 0 ? worstCandidate : null;

    return { 
      totalTrades, winRate, totalPnl, avgDuration, avgProfit, avgLoss, 
      avgWinDuration, avgLossDuration, bestTrade, worstTrade,
      longPct, shortPct, longCount, shortCount
    };
  }, [filteredTrades]);

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const calendarDays = useMemo<CalendarDay[]>(() => {
    if (period !== 'month') return [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const days: CalendarDay[] = [];
    for (let i = 0; i < adjustedFirstDay; i++) days.push({ empty: true });
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toLocaleDateString();
      const dayTrades = trades.filter(t => new Date(t.entryTime).toLocaleDateString() === dateStr);
      const dayPnl = dayTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
      days.push({ day: i, pnl: dayPnl, count: dayTrades.length, dateStr });
    }
    return days;
  }, [trades, year, month, period]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            {period === 'month' ? '月度績效儀表板' : '總體績效儀表板'}
          </h2>
          <p className="text-slate-500 font-medium">
            {period === 'month' ? `${year}年 ${month + 1}月的數據分析` : '歷史所有交易紀錄的彙整統計'}
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setPeriod('month')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition ${period === 'month' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            按月分析
          </button>
          <button 
            onClick={() => setPeriod('all')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition ${period === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            總體績效
          </button>
        </div>
      </header>

      {/* 第一層：核心摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="總交易筆數" value={stats.totalTrades} color="text-slate-900" icon="fa-clipboard-list" />
        <StatCard label="累計盈虧" value={`$${stats.totalPnl.toFixed(2)}`} color={stats.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'} icon="fa-wallet" />
        <StatCard label="勝率 (Win Rate)" value={`${stats.winRate.toFixed(1)}%`} color="text-indigo-600" icon="fa-chart-pie" />
        <StatCard label="平均盈利" value={`$${stats.avgProfit.toFixed(2)}`} color="text-emerald-500" icon="fa-arrow-trend-up" />
        <StatCard label="平均虧損" value={`$${Math.abs(stats.avgLoss).toFixed(2)}`} color="text-rose-500" icon="fa-arrow-trend-down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：日曆或多空分佈 */}
        <div className="lg:col-span-2 space-y-6">
          {period === 'month' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <i className="fas fa-calendar-check text-indigo-500"></i>
                  交易盈虧日曆
                </h3>
                <div className="flex items-center gap-4">
                  <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 transition"><i className="fas fa-chevron-left"></i></button>
                  <span className="text-xs font-bold text-slate-700">{year}年 {month + 1}月</span>
                  <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 transition"><i className="fas fa-chevron-right"></i></button>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 mb-2">
                  {weekDays.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((item, idx) => {
                    const hasTrades = (item.count || 0) > 0;
                    const isPositive = (item.pnl || 0) >= 0;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => !item.empty && hasTrades && onDateClick(item.dateStr || '')}
                        className={`h-16 md:h-20 border rounded-lg p-1 transition relative flex flex-col ${item.empty ? 'bg-slate-50 border-transparent opacity-30' : 'bg-white border-slate-100'} ${!item.empty && hasTrades ? (isPositive ? 'bg-emerald-50/40 border-emerald-100 hover:border-emerald-300 cursor-pointer shadow-sm' : 'bg-rose-50/40 border-rose-100 hover:border-rose-300 cursor-pointer shadow-sm') : 'cursor-default'}`}
                      >
                        {!item.empty && (
                          <>
                            <span className="text-[10px] font-bold text-slate-400">{item.day}</span>
                            {hasTrades && (
                              <div className="flex flex-col items-center justify-center flex-grow -mt-1">
                                <span className={`text-[10px] font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {isPositive ? '+' : ''}{(item.pnl || 0).toFixed(0)}
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold mt-0.5">
                                  {item.count} 筆
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2">
                <i className="fas fa-chart-bar text-indigo-500"></i>
                交易數據總結
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">多空方向百分比</p>
                    <div className="flex h-12 w-full rounded-xl overflow-hidden shadow-inner bg-slate-100">
                      <div className="bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold transition-all" style={{ width: `${stats?.longPct || 50}%` }}>
                        多 {stats?.longPct.toFixed(0)}%
                      </div>
                      <div className="bg-slate-800 flex items-center justify-center text-white text-[10px] font-bold transition-all" style={{ width: `${stats?.shortPct || 50}%` }}>
                        空 {stats?.shortPct.toFixed(0)}%
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>{stats?.longCount} 筆做多</span>
                      <span>{stats?.shortCount} 筆做空</span>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">總平均持倉效率</p>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <span className="text-xs text-slate-600">總平均持倉</span>
                       <span className="text-xs font-bold text-slate-800">{stats ? formatDuration(stats.avgDuration) : '--'}</span>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* 持倉時間深度分析 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2">
                <i className="fas fa-hourglass-half text-indigo-500"></i>
                持倉時間分析 (持續時間)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                   <span className="text-[10px] font-black text-emerald-600 uppercase mb-1">平均獲勝持續時間</span>
                   <span className="text-xl font-black text-emerald-700">{stats ? formatDuration(stats.avgWinDuration) : '--'}</span>
                </div>
                <div className="flex flex-col p-4 bg-rose-50 rounded-2xl border border-rose-100">
                   <span className="text-[10px] font-black text-rose-600 uppercase mb-1">平均損失持續時間</span>
                   <span className="text-xl font-black text-rose-700">{stats ? formatDuration(stats.avgLossDuration) : '--'}</span>
                </div>
             </div>
             <p className="mt-4 text-[10px] text-slate-400 italic">理想情況下，獲勝持續時間應長於損失持續時間（截斷虧損，讓利潤奔跑）。</p>
          </div>
        </div>

        {/* 右側：最佳/最差交易卡片 */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
             <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="fas fa-crown"></i> 最佳交易 (Best Trade)
             </h3>
             {stats?.bestTrade ? (
               <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-emerald-600">+${stats.bestTrade.pnlAmount.toFixed(2)}</span>
                    <span className="text-xs font-bold text-emerald-400">+{stats.bestTrade.pnlPercentage.toFixed(2)}%</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-slate-400">標的</span><span className="font-bold text-slate-700">{stats.bestTrade.symbol}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400">策略</span><span className="font-bold text-indigo-600">{stats.bestTrade.setup}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400">日期</span><span className="text-slate-500">{new Date(stats.bestTrade.entryTime).toLocaleDateString()}</span></div>
                  </div>
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-6 text-slate-300">
                    <i className="fas fa-trophy text-3xl mb-2 opacity-20"></i>
                    <p className="text-[10px] font-bold uppercase">尚無獲利紀錄</p>
                </div>
             )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-rose-500">
             <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="fas fa-skull-crossbones"></i> 最糟糕交易 (Worst Trade)
             </h3>
             {stats?.worstTrade ? (
               <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-rose-600">-${Math.abs(stats.worstTrade.pnlAmount).toFixed(2)}</span>
                    <span className="text-xs font-bold text-rose-400">{stats.worstTrade.pnlPercentage.toFixed(2)}%</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-slate-400">標的</span><span className="font-bold text-slate-700">{stats.worstTrade.symbol}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400">錯誤</span><span className="font-bold text-rose-600">{stats.worstTrade.errorCategory}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400">日期</span><span className="text-slate-500">{new Date(stats.worstTrade.entryTime).toLocaleDateString()}</span></div>
                  </div>
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-6 text-slate-300">
                    <i className="fas fa-shield-alt text-3xl mb-2 opacity-20"></i>
                    <p className="text-[10px] font-bold uppercase">尚無虧損紀錄</p>
                </div>
             )}
          </div>

          {/* 本月方向分佈 (月度模式顯示) */}
          {period === 'month' && (
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">本月方向分佈</p>
                <div className="flex h-8 w-full rounded-lg overflow-hidden bg-slate-100">
                  <div className="bg-indigo-500" style={{ width: `${stats?.longPct || 50}%` }}></div>
                  <div className="bg-slate-800" style={{ width: `${stats?.shortPct || 50}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold mt-2">
                  <span className="text-indigo-600">做多 {stats?.longPct.toFixed(0)}%</span>
                  <span className="text-slate-800">做空 {stats?.shortPct.toFixed(0)}%</span>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }: { label: string, value: string | number, color: string, icon: string }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
    <div className="flex justify-between items-start mb-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <i className={`fas ${icon} text-slate-200`}></i>
    </div>
    <p className={`text-xl lg:text-2xl font-black ${color}`}>{value}</p>
  </div>
);

export default Dashboard;
