
import React, { useState, useMemo } from 'react';
import { Trade } from '../types';

interface TradeCalendarProps {
  trades: Trade[];
}

const TradeCalendar: React.FC<TradeCalendarProps> = ({ trades }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  // 調整為週一為起始 (0-6 -> Mon-Sun)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthTrades = useMemo(() => {
    return trades.filter(t => {
      const d = new Date(t.entryTime);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [trades, year, month]);

  const monthSummary = useMemo(() => {
    const total = monthTrades.length;
    const pnl = monthTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
    const wins = monthTrades.filter(t => t.pnlAmount > 0).length;
    const losses = monthTrades.filter(t => t.pnlAmount < 0).length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    return { total, pnl, wins, losses, winRate };
  }, [monthTrades]);

  const getDayStats = (day: number) => {
    const dayDate = new Date(year, month, day).toLocaleDateString();
    const dayTrades = monthTrades.filter(t => new Date(t.entryTime).toLocaleDateString() === dayDate);
    
    if (dayTrades.length === 0) return null;

    const pnl = dayTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
    const wins = dayTrades.filter(t => t.pnlAmount > 0).length;
    const winRate = (wins / dayTrades.length) * 100;

    return { pnl, count: dayTrades.length, winRate };
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const weekDays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><i className="fas fa-chevron-left"></i></button>
            <h2 className="text-xl font-bold text-slate-800 min-w-[120px] text-center">
              {year}年 {month + 1}月
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><i className="fas fa-chevron-right"></i></button>
          </div>
        </div>

        {/* 本月績效彙總 */}
        <div className="bg-slate-900 text-white p-4 rounded-lg flex flex-col md:flex-row gap-6 text-sm border border-slate-700">
          <div className="font-bold border-b md:border-b-0 md:border-r border-slate-700 pb-2 md:pb-0 md:pr-6">本月績效彙總</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-2">
            <div className="flex justify-between md:flex-col gap-2">
              <span className="text-slate-400 text-xs">總交易筆數</span>
              <span className="font-mono">{monthSummary.total}</span>
            </div>
            <div className="flex justify-between md:flex-col gap-2">
              <span className="text-slate-400 text-xs">總淨盈虧 ($)</span>
              <span className={`font-mono font-bold ${monthSummary.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {monthSummary.pnl.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between md:flex-col gap-2">
              <span className="text-slate-400 text-xs">總獲利筆數</span>
              <span className="font-mono text-emerald-400">{monthSummary.wins}</span>
            </div>
            <div className="flex justify-between md:flex-col gap-2">
              <span className="text-slate-400 text-xs">總虧損筆數</span>
              <span className="font-mono text-rose-400">{monthSummary.losses}</span>
            </div>
            <div className="flex justify-between md:flex-col gap-2">
              <span className="text-slate-400 text-xs">勝率 (%)</span>
              <span className="font-mono">{monthSummary.winRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* 日曆標題 */}
        <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* 日曆網格 */}
        <div className="grid grid-cols-7 border-l border-t border-slate-200">
          {/* 前置空白 */}
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-32 bg-slate-50/50 border-r border-b border-slate-200"></div>
          ))}

          {/* 日期單元格 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const stats = getDayStats(day);
            const isToday = new Date().toLocaleDateString() === new Date(year, month, day).toLocaleDateString();

            return (
              <div key={day} className={`h-32 border-r border-b border-slate-200 p-2 relative group hover:bg-slate-50 transition ${isToday ? 'bg-indigo-50/30' : ''}`}>
                <div className={`text-xs font-bold mb-1 ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {year}/{month + 1}/{day}
                </div>
                
                {stats && (
                  <div className="mt-2 flex flex-col items-center justify-center text-center">
                    <div className={`text-sm font-bold mb-1 ${stats.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium">
                      {stats.count} 筆交易
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {stats.winRate.toFixed(0)}% 勝率
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 後置空白 */}
          {Array.from({ length: (7 - ((adjustedFirstDay + daysInMonth) % 7)) % 7 }).map((_, i) => (
            <div key={`empty-end-${i}`} className="h-32 bg-slate-50/50 border-r border-b border-slate-200"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradeCalendar;
