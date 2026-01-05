
import React, { useMemo, useState } from 'react';
import { Trade, TradeDirection } from '../types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

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
  if (ms <= 0 || isNaN(ms)) return "0分";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天 ${hours % 24}時`;
  if (hours > 0) return `${hours}時 ${minutes % 60}分`;
  return `${minutes}分 ${seconds % 60}秒`;
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
    if (filteredTrades.length === 0) return null;

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

    const longCount = filteredTrades.filter(t => t.direction === TradeDirection.LONG).length;
    const shortCount = totalTrades - longCount;
    const longPct = (longCount / totalTrades) * 100;
    const shortPct = (shortCount / totalTrades) * 100;

    const sortedByPnl = [...filteredTrades].sort((a, b) => b.pnlAmount - a.pnlAmount);
    const bestTrade = sortedByPnl[0];
    const worstTrade = sortedByPnl[sortedByPnl.length - 1];

    const dailyMap: Record<string, number> = {};
    filteredTrades.forEach(t => {
      const date = new Date(t.entryTime).toLocaleDateString();
      dailyMap[date] = (dailyMap[date] || 0) + t.pnlAmount;
    });

    const sortedDates = Object.keys(dailyMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let cumulative = 0;
    const chartData = sortedDates.map(date => {
      cumulative += dailyMap[date];
      return { date, net: dailyMap[date], cumulative };
    });

    return { 
      totalTrades, winRate, totalPnl, avgDuration, avgProfit, avgLoss, 
      avgWinDuration, avgLossDuration, bestTrade, worstTrade,
      longPct, shortPct, chartData 
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
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            {period === 'month' ? '月度績效儀表板' : '總體績效儀表板'}
          </h2>
          <p className="text-slate-500 font-medium">
            {period === 'month' ? `${year}年 ${month + 1}月的交易數據深度分析。` : '歷史所有交易紀錄的彙整統計報告。'}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '累計盈虧', value: `$${stats?.totalPnl.toFixed(2) || '0.00'}`, color: stats?.totalPnl && stats.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500', icon: 'fa-wallet' },
          { label: '勝率 (Win Rate)', value: `${stats?.winRate.toFixed(1) || '0'}%`, color: 'text-indigo-600', icon: 'fa-chart-pie' },
          { label: '平均持倉時間', value: stats ? formatDuration(stats.avgDuration) : '--', color: 'text-slate-700', icon: 'fa-hourglass-half' },
          { label: '交易筆數', value: stats?.totalTrades || '0', color: 'text-slate-700', icon: 'fa-hashtag' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
              <i className={`fas ${item.icon} text-slate-200`}></i>
            </div>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">平均盈利交易</p>
          <p className="text-xl font-bold text-emerald-500">+${stats?.avgProfit.toFixed(2) || '0.00'}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">平均虧損交易</p>
          <p className="text-xl font-bold text-rose-500">-${Math.abs(stats?.avgLoss || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">做多方向百分比</p>
          <div className="flex items-end gap-2">
            <p className="text-xl font-bold text-indigo-600">{stats?.longPct.toFixed(1) || '0'}%</p>
            <div className="h-1 flex-grow bg-slate-100 rounded-full mb-2 overflow-hidden">
               <div className="h-full bg-indigo-600" style={{ width: `${stats?.longPct || 0}%` }}></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">做空方向百分比</p>
          <div className="flex items-end gap-2">
            <p className="text-xl font-bold text-rose-500">{stats?.shortPct.toFixed(1) || '0'}%</p>
            <div className="h-1 flex-grow bg-slate-100 rounded-full mb-2 overflow-hidden">
               <div className="h-full bg-rose-500" style={{ width: `${stats?.shortPct || 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${period === 'month' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        {period === 'month' && (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <i className="fas fa-calendar-check text-indigo-500"></i>
                  交易盈虧日曆 <span className="text-[10px] font-normal text-slate-400">(點擊日期查看日誌)</span>
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
                    const hasTrades = item.count && item.count > 0;
                    const isPositive = (item.pnl ?? 0) >= 0;
                    
                    return (
                      <div 
                        key={idx} 
                        onClick={() => !item.empty && hasTrades && onDateClick(item.dateStr || '')}
                        className={`h-16 md:h-20 border rounded-lg p-1 transition relative flex flex-col ${item.empty ? 'bg-slate-50 border-transparent opacity-30' : 'bg-white border-slate-100'} ${!item.empty && hasTrades ? (isPositive ? 'bg-emerald-50/40 border-emerald-100 hover:border-emerald-300 cursor-pointer hover:shadow-sm' : 'bg-rose-50/40 border-rose-100 hover:border-rose-300 cursor-pointer hover:shadow-sm') : 'cursor-default'}`}
                      >
                        {!item.empty && (
                          <>
                            <span className="text-[10px] font-bold text-slate-400">{item.day}</span>
                            {hasTrades && (
                              <div className="flex flex-col items-center justify-center flex-grow -mt-1">
                                <span className={`text-[10px] font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {isPositive ? '+' : ''}{(item.pnl ?? 0).toFixed(0)}
                                </span>
                                <span className="text-[8px] text-slate-500 font-medium">{item.count} 筆</span>
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
          </div>
        )}

        <div className={`space-y-4 ${period === 'all' ? 'lg:col-span-2' : ''}`}>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">最佳交易 (Best)</p>
              <p className="text-lg font-bold text-emerald-600">{stats?.bestTrade ? `+$${stats.bestTrade.pnlAmount.toFixed(2)}` : '--'}</p>
              <p className="text-[10px] text-slate-500 mt-1">{stats?.bestTrade?.symbol || '尚未有紀錄'}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">最差交易 (Worst)</p>
              <p className="text-lg font-bold text-rose-600">{stats?.worstTrade ? `$${stats.worstTrade.pnlAmount.toFixed(2)}` : '--'}</p>
              <p className="text-[10px] text-slate-500 mt-1">{stats?.worstTrade?.symbol || '尚未有紀錄'}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-[11px] font-bold text-slate-700 mb-4 flex items-center gap-2">
              <i className="fas fa-history text-indigo-400"></i>
              平均持倉持續時間分析
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">獲勝交易平均時間</span>
                  <span className="text-xs font-bold text-emerald-600">{stats ? formatDuration(stats.avgWinDuration) : '--'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">虧損交易平均時間</span>
                  <span className="text-xs font-bold text-rose-500">{stats ? formatDuration(stats.avgLossDuration) : '--'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                   <div className="h-full bg-rose-400" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {period === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-64">
                <h3 className="text-xs font-bold text-slate-700 mb-4">累計損益曲線</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.chartData || []}>
                    <defs>
                      <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Area type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCum)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-64">
                <h3 className="text-xs font-bold text-slate-700 mb-4">單日盈虧分佈</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="net">
                      {(stats?.chartData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {period === 'month' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-48">
                <h3 className="text-xs font-bold text-slate-700 mb-4">本月累計盈虧</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" hide />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Area type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2} fillOpacity={0.1} fill="#6366f1" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-48">
                <h3 className="text-xs font-bold text-slate-700 mb-4">本月獲利分布</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.chartData || []}>
                    <Bar dataKey="net">
                      {(stats?.chartData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {!stats && (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center shadow-inner">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-folder-open text-3xl text-slate-300"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {period === 'month' ? `${year}年 ${month + 1}月 目前尚無交易` : '還沒有任何交易數據'}
          </h3>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto">
            我們需要您的交易紀錄來為您生成深度的績效報告。
          </p>
          <button onClick={onViewLogs} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
            立即記錄第一筆交易
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
