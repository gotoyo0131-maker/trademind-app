
import React, { useState, useEffect, useRef } from 'react';
import { Trade } from '../types';

interface LogListProps {
  trades: Trade[];
  initialSearchTerm?: string;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

const getDurationText = (start: string, end: string) => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0 || isNaN(ms)) return "0 分鐘";
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} 天 ${hours % 24} 時`;
  if (hours > 0) return `${hours} 時 ${minutes % 60} 分`;
  return `${minutes} 分鐘`;
};

const LogList: React.FC<LogListProps> = ({ trades, initialSearchTerm = '', onEdit, onDelete, onAddNew }) => {
  const [filter, setFilter] = useState(initialSearchTerm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const resetTimerRef = useRef<any>(null);

  useEffect(() => {
    setFilter(initialSearchTerm);
  }, [initialSearchTerm]);

  const handlePendingDelete = (id: string) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    
    if (pendingDeleteId === id) {
      onDelete(id);
      setPendingDeleteId(null);
    } else {
      setPendingDeleteId(id);
      resetTimerRef.current = setTimeout(() => {
        setPendingDeleteId(null);
      }, 3000);
    }
  };

  const filteredTrades = trades.filter(t => 
    t.symbol.toLowerCase().includes(filter.toLowerCase()) || 
    t.setup.toLowerCase().includes(filter.toLowerCase()) ||
    new Date(t.entryTime).toLocaleDateString().includes(filter)
  ).sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">歷史交易日誌</h2>
          <p className="text-xs text-slate-500 mt-1">24 小時制檢索模式</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="搜尋標的、策略..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition w-full md:w-64 text-sm shadow-sm"
          />
          <button onClick={onAddNew} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg active:scale-95">
            <i className="fas fa-plus"></i> 新增
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 w-12"></th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">日期時間</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">標的 / 策略</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">盈虧 ($ / %)</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrades.map(trade => {
                const isWin = trade.pnlAmount >= 0;
                const isExpanded = expandedId === trade.id;
                const isPendingDelete = pendingDeleteId === trade.id;
                
                const toggleExpand = () => setExpandedId(isExpanded ? null : trade.id);

                return (
                  <React.Fragment key={trade.id}>
                    <tr className={`hover:bg-slate-50/50 transition ${isExpanded ? 'bg-indigo-50/30' : ''}`}>
                      <td onClick={toggleExpand} className="px-6 py-5 text-center cursor-pointer">
                        <i className={`fas ${isExpanded ? 'fa-chevron-down text-indigo-500' : 'fa-chevron-right text-slate-300'}`}></i>
                      </td>
                      
                      <td onClick={toggleExpand} className="px-6 py-5 cursor-pointer">
                        <div className="text-xs font-bold text-slate-800">{new Date(trade.entryTime).toLocaleDateString()}</div>
                        {/* 修正：強制 24 小時制 */}
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(trade.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                        </div>
                      </td>

                      <td onClick={toggleExpand} className="px-6 py-5 cursor-pointer">
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-black ${trade.direction.includes('做多') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {trade.direction.includes('做多') ? '多' : '空'}
                          </span>
                          <span className="font-bold text-slate-800">{trade.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-indigo-500 font-bold uppercase">{trade.setup}</span>
                        </div>
                      </td>

                      <td onClick={toggleExpand} className="px-6 py-5 cursor-pointer">
                        <div className={`font-black ${isWin ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isWin ? '+' : ''}{trade.pnlAmount.toFixed(2)}
                        </div>
                        <div className={`text-[10px] font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWin ? '+' : ''}{trade.pnlPercentage.toFixed(2)}%
                        </div>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => onEdit(trade)} className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button onClick={() => handlePendingDelete(trade.id)} className={`p-3 rounded-xl transition-all shadow-sm ${isPendingDelete ? 'bg-rose-600 text-white px-4' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`}>
                            {isPendingDelete ? <span className="text-[10px] font-black uppercase">刪除？</span> : <i className="fas fa-trash-alt"></i>}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-slate-50/80 p-0 border-b border-slate-200">
                          <div className="p-8 space-y-4 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase mb-2 tracking-widest">時間紀錄 (24H)</h4>
                                <div className="text-[11px] space-y-1">
                                  <p>進場：{new Date(trade.entryTime).toLocaleString(undefined, { hour12: false })}</p>
                                  <p>出場：{new Date(trade.exitTime).toLocaleString(undefined, { hour12: false })}</p>
                                  <p className="pt-1 border-t mt-1 font-bold">持倉：{getDurationText(trade.entryTime, trade.exitTime)}</p>
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="text-[10px] font-black text-rose-500 uppercase mb-2 tracking-widest">檢討總結</h4>
                                <p className="text-xs font-black">"{trade.summary}"</p>
                                <p className="text-[10px] text-slate-500 mt-2">{trade.errorCategory}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogList;
