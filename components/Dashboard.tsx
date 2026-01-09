
import React, { useMemo, useState, useEffect } from 'react';
import { Trade, User, TradeDirection } from '../types';
import TradeCalendar from './TradeCalendar';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';

interface DashboardProps {
  trades: Trade[];
  currentUser: User;
  onViewLogs: () => void;
  onDateClick: (dateStr: string) => void;
  onAddFirstTrade: () => void;
  onGoToSettings?: () => void;
}

type DashboardTab = 'overview' | 'time' | 'strategy';

const Dashboard: React.FC<DashboardProps> = ({ trades, currentUser, onViewLogs, onDateClick, onAddFirstTrade, onGoToSettings }) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'overall'>('overall');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  
  const [timeRange, setTimeRange] = useState({ start: 0, end: 23 });

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
    const totalPnl = currentDisplayTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
    const winRate = currentDisplayTrades.length > 0 ? (wins.length / currentDisplayTrades.length) * 100 : 0;
    
    const timeAnalysisData = Array.from({ length: 24 }, (_, i) => {
      const periodTrades = currentDisplayTrades.filter(t => new Date(t.entryTime).getHours() === i);
      const winsInPeriod = periodTrades.filter(t => t.pnlAmount > 0).length;
      const lossesInPeriod = periodTrades.filter(t => t.pnlAmount < 0).length;
      const wr = periodTrades.length > 0 ? (winsInPeriod / periodTrades.length) * 100 : 0;
      return {
        hour: i,
        name: `${i.toString().padStart(2, '0')}:00`,
        win: winsInPeriod,
        loss: lossesInPeriod,
        winRate: Number(wr.toFixed(1)),
        total: periodTrades.length
      };
    }).filter(d => d.hour >= timeRange.start && d.hour <= timeRange.end);

    const symbolStats = Array.from(new Set(currentDisplayTrades.map(t => t.symbol))).map(sym => {
      const symTrades = currentDisplayTrades.filter(t => t.symbol === sym);
      const symWins = symTrades.filter(t => t.pnlAmount > 0).length;
      return { name: sym, winRate: (symWins / symTrades.length) * 100, count: symTrades.length, pnl: symTrades.reduce((acc, t) => acc + t.pnlAmount, 0) };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    const setupStats = Array.from(new Set(currentDisplayTrades.map(t => t.setup))).map(setup => {
      const setupTrades = currentDisplayTrades.filter(t => t.setup === setup);
      const setupWins = setupTrades.filter(t => t.pnlAmount > 0).length;
      return { name: setup, winRate: (setupWins / setupTrades.length) * 100, count: setupTrades.length, pnl: setupTrades.reduce((acc, t) => acc + t.pnlAmount, 0) };
    }).sort((a, b) => b.winRate - a.winRate);

    const longTrades = currentDisplayTrades.filter(t => t.direction.includes('做多'));
    const longPct = currentDisplayTrades.length > 0 ? (longTrades.length / currentDisplayTrades.length) * 100 : 0;

    const effectiveInitialBalance = currentUser.useInitialBalance ? (currentUser.initialBalance || 0) : 0;
    
    // 1. 計算「總體」資產歷史
    let runningOverallEquity = effectiveInitialBalance;
    const overallEquityHistory = [{ name: 'Start', equity: effectiveInitialBalance }];
    sortedTrades.forEach((t, idx) => {
      runningOverallEquity += t.pnlAmount;
      overallEquityHistory.push({
        name: `${new Date(t.exitTime).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})} (#${idx + 1})`,
        equity: Number(runningOverallEquity.toFixed(2))
      });
    });

    // 2. 計算「月度」資產歷史
    // 月初起始金額 = 初始資金 + 該月份之前所有交易的盈虧總和
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const tradesBeforeMonth = sortedTrades.filter(t => new Date(t.exitTime) < currentMonthStart);
    const pnlBeforeMonth = tradesBeforeMonth.reduce((acc, t) => acc + t.pnlAmount, 0);
    const monthlyStartBalance = effectiveInitialBalance + pnlBeforeMonth;

    let runningMonthlyEquity = monthlyStartBalance;
    const monthlyEquityHistory = [{ name: '月初', equity: monthlyStartBalance }];
    filteredTrades.forEach((t, idx) => {
      runningMonthlyEquity += t.pnlAmount;
      monthlyEquityHistory.push({
        name: `${new Date(t.exitTime).getDate()}日 (#${idx + 1})`,
        equity: Number(runningMonthlyEquity.toFixed(2))
      });
    });

    return {
      totalPnl, winRate, count: currentDisplayTrades.length, 
      overallEquityHistory, monthlyEquityHistory, 
      currentEquity: runningOverallEquity,
      longPct, shortPct: 100 - longPct,
      timeAnalysisData, symbolStats, setupStats
    };
  }, [filteredTrades, sortedTrades, currentUser, timeRange, currentDate]);

  if (trades.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl mb-6 shadow-xl shadow-indigo-600/20 rotate-12"><i className="fas fa-chart-line"></i></div>
      <h2 className="text-2xl font-black text-slate-900 mb-4">準備好開始您的交易日誌了嗎？</h2>
      <button onClick={onAddFirstTrade} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition active:scale-95">+ 記錄第一筆交易</button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">績效分析總覽</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={() => setViewMode('overall')} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition ${viewMode === 'overall' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>總體</button>
               <button onClick={() => setViewMode('monthly')} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition ${viewMode === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>月度</button>
            </div>
            <p className="text-slate-400 text-xs font-medium">基於 {stats?.count} 筆成交紀錄</p>
          </div>
        </div>
        <nav className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-xs font-black transition ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>數據概覽</button>
          <button onClick={() => setActiveTab('time')} className={`px-4 py-2 rounded-xl text-xs font-black transition ${activeTab === 'time' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>時段分析</button>
          <button onClick={() => setActiveTab('strategy')} className={`px-4 py-2 rounded-xl text-xs font-black transition ${activeTab === 'strategy' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>策略/標的</button>
        </nav>
      </header>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col justify-between min-h-[220px]">
              <div>
                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">當前帳戶淨值</p>
                <h3 className="text-5xl font-black tracking-tighter">${stats?.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="flex gap-10 mt-6 pt-6 border-t border-white/10">
                <div><p className="text-slate-400 text-[9px] font-black uppercase mb-1">總盈虧</p><p className={`text-xl font-bold ${stats?.totalPnl! >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${stats?.totalPnl.toLocaleString()}</p></div>
                <div><p className="text-slate-400 text-[9px] font-black uppercase mb-1">總勝率</p><p className="text-xl font-bold text-indigo-400">{stats?.winRate.toFixed(1)}%</p></div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">方向分佈 (Direction)</h3>
              <div className="space-y-6">
                <div className="relative h-12 w-full bg-slate-100 rounded-2xl overflow-hidden flex">
                  <div className="h-full bg-emerald-500 transition-all duration-1000 flex items-center justify-center text-[10px] font-black text-white" style={{ width: `${stats?.longPct}%` }}>{stats?.longPct! > 15 && `${stats?.longPct.toFixed(0)}%`}</div>
                  <div className="h-full bg-rose-500 transition-all duration-1000 flex items-center justify-center text-[10px] font-black text-white" style={{ width: `${stats?.shortPct}%` }}>{stats?.shortPct! > 15 && `${stats?.shortPct.toFixed(0)}%`}</div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black px-2">
                  <span className="text-emerald-600 flex items-center gap-2"><i className="fas fa-arrow-up"></i> 做多</span>
                  <span className="text-rose-600 flex items-center gap-2">做空 <i className="fas fa-arrow-down"></i></span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {viewMode === 'overall' ? (
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[450px]">
                <div className="h-[400px] w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <i className="fas fa-chart-line text-indigo-500"></i> 全球累計資產增長曲線
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Historical Full Log</span>
                    </div>
                  </div>
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats?.overallEquityHistory} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tickMargin={10} stroke="#94a3b8" />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#94a3b8" tickFormatter={v => `$${v}`} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '800'}} />
                        <Line type="monotone" dataKey="equity" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <TradeCalendar trades={filteredTrades} onDateClick={onDateClick} currentDate={currentDate} setCurrentDate={setCurrentDate} />
                </div>
                
                {/* 關鍵新增：月度資產增長曲線 */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[400px]">
                  <div className="h-[350px] w-full">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <i className="fas fa-wave-square text-indigo-500"></i> {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月 - 資產盈虧走勢
                      </h4>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Monthly Growth Trend</span>
                    </div>
                    {mounted && stats?.monthlyEquityHistory.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats?.monthlyEquityHistory} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tickMargin={10} stroke="#94a3b8" />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#94a3b8" tickFormatter={v => `$${v}`} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '800'}} />
                          <Line type="monotone" dataKey="equity" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
                        <i className="fas fa-inbox text-4xl opacity-20"></i>
                        <p className="text-xs font-bold">當月尚無交易數據可生成曲線</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'time' && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div><h3 className="text-lg font-black text-slate-900">時段績效透視</h3><p className="text-xs text-slate-400 font-medium">分析各小時的「勝/損」次數分佈。</p></div>
             <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase ml-2">時段過濾</span>
                <select value={timeRange.start} onChange={e => setTimeRange({...timeRange, start: parseInt(e.target.value)})} className="bg-white border border-slate-200 rounded-lg text-xs p-1 font-bold outline-none">{Array.from({length: 24}, (_, i) => <option key={i} value={i}>{i}:00</option>)}</select>
                <span className="text-slate-300">至</span>
                <select value={timeRange.end} onChange={e => setTimeRange({...timeRange, end: parseInt(e.target.value)})} className="bg-white border border-slate-200 rounded-lg text-xs p-1 font-bold outline-none">{Array.from({length: 24}, (_, i) => <option key={i} value={i}>{i}:00</option>)}</select>
             </div>
          </div>
          <div className="h-[450px] w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.timeAnalysisData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#64748b" />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#64748b" />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px' }} formatter={(val: number, name: string) => [val, name === 'win' ? '勝場' : '損場']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                  <Bar dataKey="win" name="win" stackId="a" fill="#10b981" />
                  <Bar dataKey="loss" name="loss" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2"><i className="fas fa-scroll text-indigo-500"></i> 進場策略勝率</h3>
            <div className="space-y-6">
              {stats?.setupStats.map(setup => (
                <div key={setup.name} className="space-y-2">
                  <div className="flex justify-between items-center text-xs"><span className="font-black text-slate-700">{setup.name}</span><span className="font-bold text-slate-400">{setup.count} 筆 | {setup.winRate.toFixed(1)}%</span></div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100"><div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${setup.winRate}%` }}></div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2"><i className="fas fa-bullseye text-emerald-500"></i> 品種標的績效</h3>
            <div className="space-y-8">
              {stats?.symbolStats.map(sym => (
                <div key={sym.name} className="flex items-center gap-6">
                  <div className="w-16 text-[10px] font-black text-slate-800 border-r border-slate-100">{sym.name}</div>
                  <div className="flex-grow space-y-2">
                    <div className="flex justify-between text-[10px] font-bold"><span className={sym.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>${sym.pnl.toLocaleString()}</span><span className="text-slate-400">{sym.winRate.toFixed(1)}% WR</span></div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${sym.winRate >= 50 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${sym.winRate}%` }}></div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
