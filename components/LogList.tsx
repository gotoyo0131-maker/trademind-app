
import React, { useState, useEffect } from 'react';
import { Trade } from '../types.ts';

interface LogListProps {
  trades: Trade[];
  onDelete: (id: string) => void;
  onEdit: (trade: Trade) => void;
  onAddNew: () => void;
  initialFilter?: string;
}

const formatDateTime = (isoStr: string) => {
  const d = new Date(isoStr);
  return d.toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
};

const getDurationText = (start: string, end: string) => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0 || isNaN(ms)) return "0 分鐘";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} 天 ${hours % 24} 小時`;
  if (hours > 0) return `${hours} 小時 ${minutes % 60} 分鐘`;
  return `${minutes} 分鐘`;
};

const LogList: React.FC<LogListProps> = ({ trades, onDelete, onEdit, onAddNew, initialFilter }) => {
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  const filteredTrades = trades.filter(t => 
    t.symbol.toLowerCase().includes(filter.toLowerCase()) || 
    t.setup.toLowerCase().includes(filter.toLowerCase()) ||
    new Date(t.entryTime).toLocaleDateString().includes(filter)
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">歷史交易日誌</h2>
          {filter && (
            <p className="text-xs text-indigo-600 font-bold mt-1">
              過濾條件: {filter}
              <button onClick={() => setFilter('')} className="text-slate-400 hover:text-rose-500 underline ml-2">清除</button>
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="搜尋標的、策略..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition w-full md:w-64 text-sm"
          />
          <button 
            onClick={onAddNew}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <i className="fas fa-plus"></i> 新增紀錄
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-4 w-10"></th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">日期</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">標的</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">方向</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">盈虧 ($)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrades.map(trade => (
                <React.Fragment key={trade.id}>
                  <tr className={`hover:bg-slate-50 transition cursor-pointer ${expandedId === trade.id ? 'bg-slate-50' : ''}`} onClick={() => toggleExpand(trade.id)}>
                    <td className="px-4 py-4 text-center">
                      <i className={`fas ${expandedId === trade.id ? 'fa-minus-square text-indigo-500' : 'fa-plus-square text-slate-300'}`}></i>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(trade.entryTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {trade.symbol}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${trade.direction.includes('多') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-semibold ${trade.pnlAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {trade.pnlAmount >= 0 ? '+' : ''}{trade.pnlAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onEdit(trade)} className="p-2 text-slate-400 hover:text-indigo-600">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => onDelete(trade.id)} className="p-2 text-slate-400 hover:text-rose-600">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {expandedId === trade.id && (
                    <tr>
                      <td colSpan={6} className="px-8 py-6 bg-slate-50/50 border-y border-slate-100 animate-in fade-in slide-in-from-top-1 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">精確時間與持倉時長</h4>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                  <span className="text-xs font-bold text-slate-500 w-20">進場時間</span>
                                  <span className="text-xs font-mono text-slate-800">{formatDateTime(trade.entryTime)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                  <span className="text-xs font-bold text-slate-500 w-20">出場時間</span>
                                  <span className="text-xs font-mono text-slate-800">{formatDateTime(trade.exitTime)}</span>
                                </div>
                                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center gap-3">
                                  <i className="fas fa-hourglass-half text-indigo-400"></i>
                                  <span className="text-xs font-bold text-slate-500 w-20">持倉總時長</span>
                                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                    {getDurationText(trade.entryTime, trade.exitTime)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                              <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">心理總結</h5>
                              <p className="text-sm text-slate-800 font-medium">{trade.summary}</p>
                              <p className="text-xs text-slate-500 mt-2 italic">{trade.improvements}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogList;
