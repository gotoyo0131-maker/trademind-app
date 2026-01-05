
import React, { useState, useEffect } from 'react';
import { Trade } from '../types';

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
    hour: '2-digit', minute: '2-digit',
    hour12: false
  });
};

const getDurationText = (start: string, end: string) => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0 || isNaN(ms)) return "0 分鐘";
  const minutes = Math.floor(ms / (1000 * 60));
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
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  const filteredTrades = trades.filter(t => 
    t.symbol.toLowerCase().includes(filter.toLowerCase()) || 
    t.setup.toLowerCase().includes(filter.toLowerCase()) ||
    new Date(t.entryTime).toLocaleDateString().includes(filter)
  );

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">歷史交易日誌</h2>
          <p className="text-xs text-slate-500 mt-1">深度檢討每一筆交易，是通往長期獲利的唯一途徑。</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="搜尋標的、策略、日期..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition w-full md:w-64 text-sm shadow-sm"
          />
          <button 
            onClick={onAddNew}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg active:scale-95"
          >
            <i className="fas fa-plus"></i> 新增
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                return (
                  <React.Fragment key={trade.id}>
                    <tr className={`hover:bg-slate-50 transition cursor-pointer ${expandedId === trade.id ? 'bg-indigo-50/30' : ''}`} onClick={() => toggleExpand(trade.id)}>
                      <td className="px-6 py-5 text-center">
                        <i className={`fas ${expandedId === trade.id ? 'fa-chevron-down text-indigo-500' : 'fa-chevron-right text-slate-300'} transition-transform`}></i>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-bold text-slate-800">{new Date(trade.entryTime).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(trade.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-black ${trade.direction.includes('多') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {trade.direction.split(' ')[0]}
                          </span>
                          <span className="font-bold text-slate-800">{trade.symbol}</span>
                        </div>
                        <div className="text-[10px] text-indigo-500 font-bold mt-1 uppercase tracking-wider">{trade.setup}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`font-black ${isWin ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isWin ? '+' : ''}{trade.pnlAmount.toFixed(2)}
                        </div>
                        <div className={`text-[10px] font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWin ? '+' : ''}{trade.pnlPercentage.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => onEdit(trade)} className="p-2 text-slate-400 hover:text-indigo-600 transition"><i className="fas fa-edit"></i></button>
                          <button onClick={() => onDelete(trade.id)} className="p-2 text-slate-400 hover:text-rose-600 transition"><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                    
                    {expandedId === trade.id && (
                      <tr>
                        <td colSpan={5} className="bg-slate-50/80 p-0 border-b border-slate-200">
                          <div className="p-8 grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-300">
                            
                            {/* 維度一：數據核心 */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-database"></i> 維度一：基礎數據
                              </h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs"><span className="text-slate-400">進場價格</span><span className="font-mono font-bold text-slate-700">{trade.entryPrice}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400">出場價格</span><span className="font-mono font-bold text-slate-700">{trade.exitPrice}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400">持倉時長</span><span className="font-bold text-indigo-600">{getDurationText(trade.entryTime, trade.exitTime)}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400">手續滑價</span><span className="font-mono text-rose-400">-${(trade.fees + (trade.slippage || 0)).toFixed(2)}</span></div>
                              </div>
                            </div>

                            {/* 維度二：策略邏輯 */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-crosshairs"></i> 維度二：策略邏輯
                              </h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs"><span className="text-slate-400">訊號 (Setup)</span><span className="font-bold text-slate-700">{trade.setup}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400">止損位 (SL)</span><span className="font-mono text-rose-500">{trade.stopLoss || '--'}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400">止盈位 (TP)</span><span className="font-mono text-emerald-500">{trade.takeProfit || '--'}</span></div>
                              </div>
                            </div>

                            {/* 維度三：心理行為 */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-brain"></i> 維度三：心理狀態
                              </h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-slate-400">執行評分</span>
                                  <div className="flex text-amber-400 text-[10px]">
                                    {[...Array(5)].map((_, i) => <i key={i} className={`${i < trade.executionRating ? 'fas' : 'far'} fa-star`}></i>)}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-400">進場自信</span>
                                  <span className="font-bold text-slate-700">{trade.confidence}/10</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(trade.emotions || '').split(' ').map(tag => tag && (
                                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">{tag}</span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* 維度四：檢討總結 */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-lightbulb"></i> 維度四：檢討總結
                              </h4>
                              <div className="space-y-2">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${trade.errorCategory.includes('無') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                  {trade.errorCategory}
                                </span>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{trade.summary}"</p>
                              </div>
                            </div>

                            {/* 完整文字區 */}
                            <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                                   <div className="text-[10px] font-black text-indigo-400 uppercase mb-1">進場前心態與執行備註</div>
                                   <div className="text-xs text-slate-600 leading-relaxed">{trade.preTradeMindset || '未記錄進場心態。'}</div>
                                </div>
                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                                   <div className="text-[10px] font-black text-emerald-500 uppercase mb-1">未來改進措施</div>
                                   <div className="text-xs text-slate-600 leading-relaxed">{trade.improvements || '未記錄改進方案。'}</div>
                                </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                    找不到符合條件的交易紀錄。
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
