
import React, { useMemo } from 'react';
import { Trade } from '../types';

interface TradeCalendarProps {
  trades: Trade[];
  onDateClick: (dateStr: string) => void;
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
}

const TradeCalendar: React.FC<TradeCalendarProps> = ({ trades, onDateClick, currentDate, setCurrentDate }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthTrades = useMemo(() => {
    return trades.filter(t => {
      const d = new Date(t.entryTime);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [trades, year, month]);

  const getDayStats = (day: number) => {
    const d = new Date(year, month, day);
    const dayStr = d.toLocaleDateString();
    const dayTrades = monthTrades.filter(t => new Date(t.entryTime).toLocaleDateString() === dayStr);
    if (dayTrades.length === 0) return null;
    const pnl = dayTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
    return { pnl, count: dayTrades.length, dateStr: dayStr };
  };

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <i className="far fa-calendar-alt text-indigo-500"></i> 交易盈虧日曆
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))} 
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition"
          >
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
          <span className="text-xs font-black text-slate-700 min-w-[80px] text-center">{year}年 {month + 1}月</span>
          <button 
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))} 
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 transition"
          >
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl overflow-hidden border border-slate-100 grid grid-cols-7">
        {weekDays.map(d => <div key={d} className="py-3 text-center text-[10px] font-black text-slate-400 bg-slate-50 border-b border-r border-slate-100">{d}</div>)}
        {Array.from({ length: adjustedFirstDay }).map((_, i) => <div key={`e-${i}`} className="h-16 md:h-20 bg-slate-50/20 border-b border-r border-slate-50"></div>)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const stats = getDayStats(day);
          return (
            <div 
              key={day} 
              onClick={() => stats && onDateClick(stats.dateStr)}
              className={`h-16 md:h-20 border-b border-r border-slate-50 p-1 transition relative group ${stats ? 'cursor-pointer hover:bg-indigo-50' : 'hover:bg-slate-50'}`}
            >
              <span className={`text-[10px] font-bold transition ${stats ? 'text-indigo-600' : 'text-slate-300'}`}>{day}</span>
              {stats && (
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                   <div className={`text-[10px] md:text-xs font-black ${stats.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                     {stats.pnl >= 0 ? '+' : ''}{stats.pnl.toFixed(0)}
                   </div>
                   <div className="text-[9px] font-black text-slate-400 mt-0.5 px-1.5 py-0.5 bg-slate-100 rounded-md">
                     {stats.count} 筆
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TradeCalendar;
