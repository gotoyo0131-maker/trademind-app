
import React, { useMemo, useState, useEffect } from 'react';
import { Trade, User, TradeDirection } from '../types';
import TradeCalendar from './TradeCalendar';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell
} from 'recharts';

interface DashboardProps {
  trades: Trade[];
  currentUser: User;
  onViewLogs: () => void;
  onDateClick: (dateStr: string) => void;
  onAddFirstTrade: () => void;
  onGoToSettings?: () => void;
}

const getDurationMinutes = (start: string, end: string) => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms > 0 ? Math.floor(ms / (1000 * 60)) : 0;
};

// 生成 24 小時時段定義 (每小時一格)
const TIME_PERIODS = Array.from({ length: 24 }, (_, i) => ({
  label: `${i.toString().padStart(2, '0')}:00`,
  start: i,
  end: i + 1
}));

const Dashboard: React.FC<DashboardProps> = ({ trades, currentUser, onViewLogs, onDateClick, onAddFirstTrade, onGoToSettings }) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'overall'>('overall');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => new Date(a.exitTime).getTime() - new Date(b.exitTime).getTime());
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (viewMode === 'overall') return sortedTrades;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return sortedTrades.filter(t => {
      const d = new Date(t.entryTime);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [sortedTrades, currentDate, viewMode]);

  const stats = useMemo(() => {
    if (trades.length === 0) return null;

    const currentDisplayTrades = filteredTrades;
    const wins = currentDisplayTrades.filter(t => t.pnlAmount > 0);
    const losses = currentDisplayTrades.filter(t => t.pnlAmount < 0);
    const totalPnl = currentDisplayTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
    const winRate = currentDisplayTrades.length > 0 ? (wins.length / currentDisplayTrades.length) * 100 : 0;
    
    const avgWin = wins.length > 0 ? wins.reduce((acc, t) => acc + t.pnlAmount, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((acc, t) => acc + t.pnlAmount, 0) / losses.length) : 0;
    
    const bestTrade = currentDisplayTrades.length > 0 ? [...currentDisplayTrades].sort((a, b) => b.pnlAmount - a.pnlAmount)[0] : null;
    const worstTrade = currentDisplayTrades.length > 0 ? [...currentDisplayTrades].sort((a, b) => a.pnlAmount - b.pnlAmount)[0] : null;

    const longTrades = currentDisplayTrades.filter(t => t.direction === TradeDirection.LONG);
    const longPct = currentDisplayTrades.length > 0 ? (longTrades.length / currentDisplayTrades.length) * 100 : 0;

    const avgWinTime = wins.length > 0 ? wins.reduce((acc, t) => acc + getDurationMinutes(t.entryTime, t.exitTime), 0) / wins.length : 0;
    const avgLossTime = losses.length > 0 ? losses.reduce((acc, t) => acc + getDurationMinutes(t.entryTime, t.exitTime), 0) / losses.length : 0;

    // 時段勝率統計 (24 小時)
    const timeWinRateData = TIME_PERIODS.map(period => {
      const periodTrades = currentDisplayTrades.filter(t => {
        const hour = new Date(t.entryTime).getHours();
        return hour === period.start;
      });
      const periodWins = periodTrades.filter(t => t.pnlAmount > 0);
      const wr = periodTrades.length > 0 ? (periodWins.length / periodTrades.length) * 100 : 0;
      return {
        name: period.label,
        winRate: Number(wr.toFixed(1)),
        count: periodTrades.length
      };
    });

    const effectiveInitialBalance = currentUser.useInitialBalance ? (currentUser.initialBalance || 0) : 0;
    
    let runningEquity = effectiveInitialBalance;
    const equityHistory = [
      { name: 'Start', equity: effectiveInitialBalance, fullDate: 'Initial' }, 
      ...sortedTrades.map((t, idx) => {
        runningEquity += t.pnlAmount;
        const dateStr = new Date(t.exitTime).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'});
        return { 
          name: `${dateStr} (#${idx + 1})`, 
          equity: Number(runningEquity.toFixed(2)),
          fullDate: new Date(t.exitTime).toLocaleString(undefined, { hour12: false })
        };
      })
    ];

    const totalLifetimePnl = sortedTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
    const totalReturnPct = (currentUser.useInitialBalance && effectiveInitialBalance > 0) 
      ? (totalLifetimePnl / effectiveInitialBalance) * 100 
      : 0;

    return {
      totalPnl, winRate, avgWin, avgLoss, bestTrade, worstTrade, 
      longPct, shortPct: 100 - longPct, avgWinTime, avgLossTime,
      count: currentDisplayTrades.length, equityHistory, currentEquity: runningEquity,
      initialBalance: effectiveInitialBalance, totalReturnPct, totalLifetimePnl,
      timeWinRateData
    };
  }, [filteredTrades, sortedTrades, currentUser]);

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-4xl mb-8 shadow-2xl shadow-indigo-600/20 rotate-12">
          <i className="fas fa-feather-pointed"></i>
        </div>
        <div className="text-center max-w-md px-6">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">歡迎開啟第一筆紀錄</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-10">點擊下方按鈕開始記錄您的第一筆交易，系統將自動為您生成多維度的績效分析。</p>
          <button onClick={onAddFirstTrade} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition active:scale-95 mb-12 flex items-center justify-center gap-3">
            <i className="fas fa-plus-circle"></i> 開始記錄第一筆交易
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {viewMode === 'overall' ? '總體績效儀表板' : '月度績效儀表板'}
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            {viewMode === 'overall' ? '歷史所有交易紀錄的彙整統計' : `${currentDate.getFullYear()} 年 ${currentDate.getMonth() + 1} 月的數據分析`}
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setViewMode('monthly')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>按月分析</button>
          <button onClick={() => setViewMode('overall')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'overall' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>總體績效</button>
        </div>
      </header>

      {currentUser.useInitialBalance && stats && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mb-2">當前帳戶總資產 (Total Equity)</p>
              <div className="flex items-baseline gap-4">
                <h3 className="text-5xl font-black tracking-tighter">${stats.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <span className={`text-sm font-black px-3 py-1 rounded-full ${stats.totalReturnPct >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {stats.totalReturnPct >= 0 ? '+' : ''}{stats.totalReturnPct.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 border-l border-white/10 pl-8">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">初始本金</p>
                <p className="text-xl font-bold text-slate-100">${stats.initialBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">累計盈虧</p>
                <p className={`text-xl font-bold ${stats.totalLifetimePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stats.totalLifetimePnl >= 0 ? '+' : ''}${Math.abs(stats.totalLifetimePnl).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '總交易筆數', value: stats?.count || 0, color: 'text-slate-900' },
          { label: '累計盈虧', value: `$${stats?.totalPnl.toLocaleString() || '0'}`, color: stats?.totalPnl! >= 0 ? 'text-emerald-500' : 'text-rose-500' },
          { label: '勝率 (Win Rate)', value: `${stats?.winRate.toFixed(1) || '0'}%`, color: 'text-indigo-600' },
          { label: '平均獲利', value: `$${stats?.avgWin.toFixed(1) || '0'}`, color: 'text-emerald-500' },
          { label: '平均虧損', value: `$${stats?.avgLoss.toFixed(1) || '0'}`, color: 'text-rose-500' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
            <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            {viewMode === 'monthly' ? (
              <div className="min-h-[420px]">
                <TradeCalendar trades={trades} onDateClick={onDateClick} currentDate={currentDate} setCurrentDate={setCurrentDate} />
              </div>
            ) : (
              <div className="flex flex-col w-full">
                <div className="flex justify-between items-center mb-8 px-2">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-chart-line text-indigo-500"></i> {currentUser.useInitialBalance ? '資產增長曲線' : '累計盈虧趨勢'}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                    24H Format Enabled
                  </div>
                </div>
                
                <div className="h-[350px] min-h-[350px] w-full relative">
                  {mounted && stats?.equityHistory && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.equityHistory} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={9} tickMargin={10} axisLine={false} tickLine={false} stroke="#94a3b8" />
                        <YAxis domain={['auto', 'auto']} fontSize={10} axisLine={false} tickLine={false} stroke="#94a3b8" tickFormatter={(val) => `$${val.toLocaleString()}`} />
                        <Tooltip 
                          labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <ReferenceLine y={currentUser.useInitialBalance ? currentUser.initialBalance || 0 : 0} stroke="#cbd5e1" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="equity" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 更新：24 小時時段勝率統計區塊 (每小時一格) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
              <i className="fas fa-clock text-indigo-500"></i> 24 小時勝率分佈 (每小時)
            </h3>
            {/* 使用橫向滾動容器以容納 24 個 Bar */}
            <div className="h-[400px] w-full overflow-y-auto pr-2 custom-scrollbar">
              <div className="h-[650px] w-full"> {/* 增加內層高度確保 24 條 Bar 不會擠壓 */}
                {mounted && stats?.timeWinRateData && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.timeWinRateData} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <XAxis type="number" hide domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} width={50} stroke="#64748b" />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        formatter={(val: number, name: string, payload: any) => [`${val}% (${payload.payload.count}筆)`, '勝率']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px' }}
                      />
                      <Bar dataKey="winRate" radius={[0, 8, 8, 0]} barSize={16}>
                        {stats.timeWinRateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? '#10b981' : (entry.count > 0 ? '#f43f5e' : '#e2e8f0')} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-4 italic">分析您在一天中每個小時的交易表現，顏色代表該時段的執行勝率。</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border-t-4 border-t-emerald-500 border border-slate-100 shadow-sm group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{viewMode === 'overall' ? '最佳交易 (BEST)' : '本月最佳交易'}</p>
            {stats?.bestTrade ? (
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-black text-slate-800">{stats.bestTrade.symbol}</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{stats.bestTrade.setup}</p>
                  <p className="text-[9px] text-slate-300 mt-2">{new Date(stats.bestTrade.exitTime).toLocaleDateString()}</p>
                </div>
                <p className="text-xl font-black text-emerald-500">${stats.bestTrade.pnlAmount.toFixed(2)}</p>
              </div>
            ) : <p className="text-xs text-slate-300 italic">尚無數據</p>}
          </div>

          <div className="bg-white p-6 rounded-3xl border-t-4 border-t-rose-500 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{viewMode === 'overall' ? '最糟交易 (WORST)' : '本月最糟交易'}</p>
            {stats?.worstTrade ? (
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-black text-slate-800">{stats.worstTrade.symbol}</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{stats.worstTrade.setup}</p>
                  <p className="text-[9px] text-slate-300 mt-2">{new Date(stats.worstTrade.exitTime).toLocaleDateString()}</p>
                </div>
                <p className="text-xl font-black text-rose-500">${stats.worstTrade.pnlAmount.toFixed(2)}</p>
              </div>
            ) : <p className="text-xs text-slate-300 italic">尚無數據</p>}
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{viewMode === 'overall' ? '總體方向分佈' : '本月方向分佈'}</p>
                <div className="h-2 w-full bg-white/10 rounded-full mb-4 overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${stats?.longPct || 0}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                  <span>做多 {stats?.longPct.toFixed(0)}%</span>
                  <span>做空 {stats?.shortPct.toFixed(0)}%</span>
                </div>
                <button onClick={onViewLogs} className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black transition">查看日誌</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
