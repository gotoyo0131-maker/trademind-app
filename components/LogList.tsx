
import React, { useState, useEffect } from 'react';
import { Trade } from '../types';

interface LogListProps {
  trades: Trade[];
  initialSearchTerm?: string;
  onDelete: (id: string) => void;
  onEdit: (trade: Trade) => void;
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

const LogList: React.FC<LogListProps> = ({ trades, initialSearchTerm = '', onDelete, onEdit, onAddNew }) => {
  const [filter, setFilter] = useState(initialSearchTerm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setFilter(initialSearchTerm);
  }, [initialSearchTerm]);

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
          <p className="text-xs text-slate-500 mt-1">
            {filter ? (
              <span className="flex items-center gap-1">
                正在查看日期: <b className="text-indigo-600">{filter}</b> 的記錄 
                <button onClick={() => setFilter('')} className="text-rose-500 hover:underline">(清除篩選)</button>
              </span>
            ) : '深度檢討是通往長期獲利的唯一途徑。'}
          </p>
        </div>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="搜尋標的、策略、日期..." 
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
                return (
                  <React.Fragment key={trade.id}>
                    <tr className={`hover:bg-slate-50 transition cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedId(isExpanded ? null : trade.id)}>
                      <td className="px-6 py-5 text-center">
                        <i className={`fas ${isExpanded ? 'fa-chevron-down text-indigo-500' : 'fa-chevron-right text-slate-300'}`}></i>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-bold text-slate-800">{new Date(trade.entryTime).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{new Date(trade.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-black ${trade.direction.includes('做多') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {trade.direction.includes('做多') ? '多' : '空'}
                          </span>
                          <span className="font-bold text-slate-800">{trade.symbol}</span>
                        </div>
                        <div className="text-[10px] text-indigo-500 font-bold mt-1 uppercase">{trade.setup}</div>
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
                    
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-slate-50/80 p-0 border-b border-slate-200">
                          <div className="p-8 space-y-8 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">基礎數據</h4>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between"><span className="text-slate-400">進場價</span><span className="font-bold">{trade.entryPrice}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-400">出場價</span><span className="font-bold">{trade.exitPrice}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-400">持倉</span><span className="font-bold">{getDurationText(trade.entryTime, trade.exitTime)}</span></div>
                                </div>
                              </div>
                              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">心理狀態</h4>
                                <div className="flex items-center gap-1 mb-2">
                                  {[...Array(5)].map((_, i) => <i key={i} className={`${i < trade.executionRating ? 'fas' : 'far'} fa-star text-amber-400 text-[10px]`}></i>)}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {trade.emotions.split(' ').map(tag => tag && <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">{tag}</span>)}
                                </div>
                              </div>
                              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">檢討總結</h4>
                                <p className="text-xs text-slate-600 italic font-bold mb-2">"{trade.summary}"</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-[10px]">
                                      <span className="text-slate-400 block mb-1 uppercase tracking-tighter">錯誤分類</span>
                                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 font-bold">{trade.errorCategory}</span>
                                    </div>
                                    <div className="text-[10px]">
                                      <span className="text-slate-400 block mb-1 uppercase tracking-tighter">改進點</span>
                                      <span className="text-slate-600">{trade.improvements || '未填寫'}</span>
                                    </div>
                                </div>
                              </div>
                            </div>

                            {trade.screenshots && trade.screenshots.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">交易圖解與截圖</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {trade.screenshots.map((ss, idx) => (
                                    <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group">
                                      <div className="aspect-video bg-slate-100 overflow-hidden relative">
                                        <img 
                                          src={ss.url} 
                                          alt={ss.description} 
                                          className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x225?text=Invalid+Image+URL'; }}
                                        />
                                        <a href={ss.url} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 bg-black/50 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                          <i className="fas fa-external-link-alt text-[10px]"></i>
                                        </a>
                                      </div>
                                      <div className="p-3">
                                        <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                                          <span className="text-indigo-600 font-bold mr-1">#{idx+1}</span>
                                          {ss.description || '無描述'}
                                        </p>
                                      </div>
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
              {filteredTrades.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">找不到符合條件的交易紀錄。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogList;
