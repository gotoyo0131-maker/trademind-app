
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
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition w-full md:w-64 text-sm shadow-sm font-medium"
          />
          <button onClick={onAddNew} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg active:scale-95">
            <i className="fas fa-plus"></i> 新增
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 w-12"></th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">日期時間</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">標的 / 策略</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">盈虧 ($ / %)</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTrades.map(trade => {
                const isWin = trade.pnlAmount >= 0;
                const isExpanded = expandedId === trade.id;
                const isPendingDelete = pendingDeleteId === trade.id;
                
                const toggleExpand = () => setExpandedId(isExpanded ? null : trade.id);

                return (
                  <React.Fragment key={trade.id}>
                    <tr className={`hover:bg-slate-50/50 transition cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`} onClick={toggleExpand}>
                      <td className="px-6 py-5 text-center">
                        <i className={`fas ${isExpanded ? 'fa-chevron-down text-indigo-500' : 'fa-chevron-right text-slate-300'} transition-transform duration-300`}></i>
                      </td>
                      
                      <td className="px-6 py-5">
                        <div className="text-xs font-black text-slate-800">{new Date(trade.entryTime).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(trade.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${trade.direction.includes('做多') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {trade.direction.includes('做多') ? '多 (L)' : '空 (S)'}
                          </span>
                          <span className="font-black text-slate-800 text-sm">{trade.symbol}</span>
                        </div>
                        <div className="text-[10px] text-indigo-500 font-bold uppercase mt-1 tracking-tight">{trade.setup}</div>
                      </td>

                      <td className="px-6 py-5">
                        <div className={`font-black text-sm ${isWin ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isWin ? '+' : ''}{trade.pnlAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-[10px] font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWin ? '+' : ''}{trade.pnlPercentage.toFixed(2)}%
                        </div>
                      </td>

                      <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => onEdit(trade)} className="p-3 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 rounded-xl transition-all shadow-sm">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button onClick={() => handlePendingDelete(trade.id)} className={`p-3 rounded-xl transition-all shadow-sm ${isPendingDelete ? 'bg-rose-600 text-white px-4' : 'bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-100'}`}>
                            {isPendingDelete ? <span className="text-[10px] font-black uppercase tracking-widest">確定？</span> : <i className="fas fa-trash-alt"></i>}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-slate-50/50 p-0 border-b border-slate-100">
                          <div className="p-8 space-y-8 animate-in slide-in-from-top-4 duration-300">
                            {/* 第一排：時間與風控 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                  <i className="fas fa-clock"></i> 時間紀錄 (24H)
                                </h4>
                                <div className="space-y-2 text-[11px] font-bold text-slate-600">
                                  <div className="flex justify-between"><span>進場時點</span><span>{new Date(trade.entryTime).toLocaleString(undefined, { hour12: false })}</span></div>
                                  <div className="flex justify-between"><span>出場時點</span><span>{new Date(trade.exitTime).toLocaleString(undefined, { hour12: false })}</span></div>
                                  <div className="flex justify-between pt-2 border-t border-slate-50 text-indigo-600"><span>總計持倉</span><span>{getDurationText(trade.entryTime, trade.exitTime)}</span></div>
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                  <i className="fas fa-calculator"></i> 交易參數 (Stats)
                                </h4>
                                <div className="grid grid-cols-2 gap-y-2 text-[11px] font-bold text-slate-600">
                                  <div><p className="text-[9px] text-slate-400 font-black">進場價</p><p>${trade.entryPrice}</p></div>
                                  <div><p className="text-[9px] text-slate-400 font-black">出場價</p><p>${trade.exitPrice}</p></div>
                                  <div><p className="text-[9px] text-slate-400 font-black">止損價 (SL)</p><p className="text-rose-500">${trade.stopLoss || '未設定'}</p></div>
                                  <div><p className="text-[9px] text-slate-400 font-black">止盈價 (TP)</p><p className="text-emerald-500">${trade.takeProfit || '未設定'}</p></div>
                                  <div className="col-span-2 pt-2 border-t border-slate-50 flex justify-between">
                                    <span className="text-[10px] font-black text-slate-400">風險回報比 (R:R)</span>
                                    <span className="text-indigo-600 font-black">{trade.riskRewardRatio?.toFixed(2) || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                  <i className="fas fa-comment-dots"></i> 檢討與總結
                                </h4>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[9px] text-slate-400 font-black mb-1">一句話總結</p>
                                    <p className="text-xs font-black text-slate-800">"{trade.summary}"</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-slate-400 font-black mb-1">行為分類</p>
                                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-black border border-rose-100 inline-block">{trade.errorCategory}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 第二排：行為心理詳細細節 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                    <i className="fas fa-brain"></i> 行為心理分析
                                  </h4>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <i key={star} className={`fas fa-star text-xs ${trade.executionRating >= star ? 'text-amber-400' : 'text-slate-100'}`}></i>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div className="flex flex-wrap gap-1.5">
                                    {(trade.emotions || '').split(' ').filter(Boolean).map(tag => (
                                      <span key={tag} className="px-2 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black border border-slate-100">{tag}</span>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><p className="text-[9px] text-slate-400 font-black mb-1 uppercase">進場前心態</p><p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">{trade.preTradeMindset || '未填寫'}</p></div>
                                    <div><p className="text-[9px] text-slate-400 font-black mb-1 uppercase">執行過程筆記</p><p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">{trade.notesOnExecution || '未填寫'}</p></div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                  <i className="fas fa-arrow-up-right-dots"></i> 下一步具體改進點
                                </h4>
                                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-50 text-[11px] font-black text-emerald-700 leading-relaxed min-h-[80px]">
                                  {trade.improvements || '沒有紀錄改進方案。'}
                                </div>
                              </div>
                            </div>

                            {/* 第三排：交易截圖 */}
                            {trade.screenshots && trade.screenshots.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                  <i className="fas fa-camera"></i> 交易圖解 (Screenshots)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {trade.screenshots.map((ss, idx) => (
                                    <div key={idx} className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                      <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                        <img src={ss.url} alt={ss.description} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400/f8fafc/cbd5e1?text=Image+Not+Found'; }} />
                                        <a href={ss.url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black">
                                          查看大圖 <i className="fas fa-external-link-alt ml-2"></i>
                                        </a>
                                      </div>
                                      {ss.description && <div className="p-3 text-[10px] font-bold text-slate-500 text-center border-t border-slate-50">{ss.description}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
        {filteredTrades.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 text-xl">
              <i className="fas fa-search"></i>
            </div>
            <p className="text-slate-400 text-sm font-bold">找不到相符的交易紀錄。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogList;
