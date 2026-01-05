
import React, { useState, useEffect } from 'react';
import { Trade, TradeDirection } from '../types';

interface LogListProps {
  trades: Trade[];
  onDelete: (id: string) => void;
  onEdit: (trade: Trade) => void;
  onAddNew: () => void;
  initialFilter?: string;
}

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
            <p className="text-xs text-indigo-600 font-bold mt-1 flex items-center gap-2">
              <i className="fas fa-filter"></i> 當前過濾條件: {filter}
              <button onClick={() => setFilter('')} className="text-slate-400 hover:text-rose-500 underline ml-2">清除過濾</button>
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="搜尋標的、策略或日期..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition w-full md:w-64"
            />
          </div>
          <button 
            onClick={onAddNew}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">策略設置</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">自信</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrades.map(trade => (
                <React.Fragment key={trade.id}>
                  <tr className={`hover:bg-slate-50 transition cursor-pointer ${expandedId === trade.id ? 'bg-slate-50' : ''}`} onClick={() => toggleExpand(trade.id)}>
                    <td className="px-4 py-4 text-center">
                      <i className={`fas ${expandedId === trade.id ? 'fa-minus-square text-indigo-500' : 'fa-plus-square text-slate-300'} transition`}></i>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
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
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {trade.setup}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{trade.confidence}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onEdit(trade)} className="p-2 text-slate-400 hover:text-indigo-600 transition" title="編輯">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => onDelete(trade.id)} className="p-2 text-slate-400 hover:text-rose-600 transition" title="刪除">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* 展開詳情區域 */}
                  {expandedId === trade.id && (
                    <tr>
                      <td colSpan={8} className="px-8 py-6 bg-slate-50/50 border-y border-slate-100 animate-in fade-in slide-in-from-top-1 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">交易分析圖對比</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500">進場 (Before)</span>
                                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm h-48 flex items-center justify-center overflow-hidden">
                                  {trade.screenshotBefore ? (
                                    <img src={trade.screenshotBefore} className="max-h-full object-contain cursor-zoom-in" onClick={() => window.open(trade.screenshotBefore)} alt="Before" />
                                  ) : (
                                    <span className="text-xs text-slate-300 italic">無進場圖</span>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500">出場 (After)</span>
                                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm h-48 flex items-center justify-center overflow-hidden">
                                  {trade.screenshotAfter ? (
                                    <img src={trade.screenshotAfter} className="max-h-full object-contain cursor-zoom-in" onClick={() => window.open(trade.screenshotAfter)} alt="After" />
                                  ) : (
                                    <span className="text-xs text-slate-300 italic">無出場圖</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">進場前心態</h5>
                                <p className="text-sm text-slate-700 leading-relaxed italic">
                                  {trade.preTradeMindset || '未記錄心理狀態'}
                                </p>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">情緒標籤</h5>
                                <div className="flex flex-wrap gap-1">
                                  {trade.emotions.split(' ').map(tag => tag && (
                                    <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded">
                                      {tag}
                                    </span>
                                  ))}
                                  {!trade.emotions && <span className="text-[10px] text-slate-400">無標籤</span>}
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                              <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">檢討與改進</h5>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 rounded mr-2">總結</span>
                                  <span className="text-sm text-slate-800 font-medium">{trade.summary}</span>
                                </div>
                                <div className="text-sm text-slate-600 leading-relaxed pl-4 border-l-2 border-slate-200">
                                  {trade.improvements || '未填寫改進措施'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                    查無交易紀錄。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogList;
