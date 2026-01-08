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

  // 當刪除操作啟動時，若 3 秒內沒點第二次就還原
  const handlePendingDelete = (id: string) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    
    if (pendingDeleteId === id) {
      // 第二次點擊：真正執行
      onDelete(id);
      setPendingDeleteId(null);
    } else {
      // 第一次點擊：進入確認狀態
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
          <p className="text-xs text-slate-500 mt-1">深度檢討是通往長期獲利的唯一途徑。</p>
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
                        <div className="text-[10px] text-slate-400 font-mono">{new Date(trade.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
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
                          {trade.riskRewardRatio && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-400 px-1.5 py-0.5 rounded font-black">R:R {trade.riskRewardRatio.toFixed(1)}</span>
                          )}
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
                          <button 
                            type="button"
                            onClick={() => onEdit(trade)}
                            className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => handlePendingDelete(trade.id)}
                            className={`p-3 rounded-xl transition-all shadow-sm active:scale-90 flex items-center gap-2 ${
                              isPendingDelete 
                                ? 'bg-rose-600 text-white px-4 ring-4 ring-rose-100' 
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                            }`}
                          >
                            {isPendingDelete ? (
                              <>
                                <i className="fas fa-check"></i>
                                <span className="text-[10px] font-black uppercase">確定刪除?</span>
                              </>
                            ) : (
                              <i className="fas fa-trash-alt"></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-slate-50/80 p-0 border-b border-slate-200">
                          <div className="p-8 space-y-8 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">交易概覽</h4>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between"><span className="text-slate-400">進/出場價</span><span className="font-bold">{trade.entryPrice} / {trade.exitPrice}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-400">持倉時間</span><span className="font-bold">{getDurationText(trade.entryTime, trade.exitTime)}</span></div>
                                  <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="text-slate-400">執行評分</span>
                                    <div className="flex gap-0.5">
                                      {[...Array(5)].map((_, i) => <i key={i} className={`${i < trade.executionRating ? 'fas' : 'far'} fa-star text-amber-400 text-[10px]`}></i>)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {trade.emotions.split(' ').map(tag => tag && <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">{tag}</span>)}
                                </div>
                              </div>

                              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">行為與心態診斷</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">進場前心態</span>
                                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">"{trade.preTradeMindset || '未填寫'}"</p>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">執行過程筆記</span>
                                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">"{trade.notesOnExecution || '未填寫'}"</p>
                                  </div>
                                </div>
                                <div className="pt-2 border-t">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">核心總結</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded font-black uppercase">{trade.errorCategory}</span>
                                  </div>
                                  <p className="text-xs text-slate-800 font-black mb-1">"{trade.summary}"</p>
                                  <p className="text-[11px] text-emerald-600 font-bold"><i className="fas fa-lightbulb"></i> 下次改進：{trade.improvements || '無'}</p>
                                </div>
                              </div>
                            </div>

                            {trade.screenshots && trade.screenshots.length > 0 && (
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">交易圖解</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {trade.screenshots.map((ss, idx) => (
                                    <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group">
                                      <div className="aspect-video bg-slate-100 overflow-hidden relative">
                                        <img 
                                          src={ss.url} 
                                          alt="" 
                                          className="w-full h-full object-cover transition group-hover:scale-105" 
                                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x225?text=Invalid+URL'; }} 
                                        />
                                      </div>
                                      <div className="p-3 text-[10px] text-slate-500 font-medium truncate">{ss.description || `圖解 #${idx+1}`}</div>
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
      </div>
    </div>
  );
};

export default LogList;