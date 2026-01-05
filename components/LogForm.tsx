
import React, { useState, useEffect } from 'react';
import { Trade, TradeDirection, ErrorCategory } from '../types';
import { EMOTION_TAGS } from '../constants';

interface LogFormProps {
  onSave: (trade: Trade) => void;
  onCancel: () => void;
  initialData?: Trade | null;
  setupOptions: string[];
  symbolOptions: string[];
}

const LogForm: React.FC<LogFormProps> = ({ onSave, onCancel, initialData, setupOptions, symbolOptions }) => {
  const [formData, setFormData] = useState<Partial<Trade>>({
    id: crypto.randomUUID(),
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: new Date().toISOString().slice(0, 16),
    symbol: symbolOptions[0] || '',
    direction: TradeDirection.LONG,
    entryPrice: 0,
    exitPrice: 0,
    size: 0,
    fees: 0,
    slippage: 0,
    setup: setupOptions[0] || '',
    stopLoss: 0,
    takeProfit: 0,
    confidence: 7,
    emotions: '',
    preTradeMindset: '',
    executionRating: 5,
    notesOnExecution: '',
    errorCategory: ErrorCategory.NONE,
    improvements: '',
    summary: '',
  });

  useEffect(() => {
    if (initialData) {
      const formatForInput = (isoStr: string) => {
        const d = new Date(isoStr);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      setFormData({
        ...initialData,
        entryTime: formatForInput(initialData.entryTime),
        exitTime: formatForInput(initialData.exitTime),
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryPrice = Number(formData.entryPrice) || 0;
    const exitPrice = Number(formData.exitPrice) || 0;
    const size = Number(formData.size) || 0;
    const isLong = formData.direction === TradeDirection.LONG;
    
    const priceDiff = isLong ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    const pnlAmount = (priceDiff * size) - (Number(formData.fees) || 0) - (Number(formData.slippage) || 0);
    const pnlPercentage = entryPrice !== 0 ? (priceDiff / entryPrice) * 100 : 0;

    onSave({
      ...formData as Trade,
      entryTime: new Date(formData.entryTime || "").toISOString(),
      exitTime: new Date(formData.exitTime || "").toISOString(),
      pnlAmount,
      pnlPercentage,
      riskRewardRatio: 2 
    });
  };

  const SectionTitle = ({ num, title }: { num: string, title: string }) => (
    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3 border-l-4 border-indigo-600 pl-4">
      <span className="text-indigo-600 font-black">{num}.</span>
      {title}
    </h3>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-20 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{initialData ? '編輯日誌' : '新增交易日誌'}</h2>
          <p className="text-xs text-slate-500">專業交易從詳實的紀錄與檢討開始。</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition">取消</button>
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition active:scale-95">儲存日誌</button>
        </div>
      </div>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="一" title="基礎交易數據 (Hard Data)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">進場時間</label>
            <input type="datetime-local" value={formData.entryTime} onChange={e => setFormData({...formData, entryTime: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">出場時間</label>
            <input type="datetime-local" value={formData.exitTime} onChange={e => setFormData({...formData, exitTime: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" required />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">標的 (Symbol)</label>
            <select 
              value={formData.symbol} 
              onChange={e => setFormData({...formData, symbol: e.target.value})} 
              required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700 outline-none focus:border-indigo-500"
            >
              {symbolOptions.length > 0 ? (
                symbolOptions.map(s => <option key={s} value={s}>{s}</option>)
              ) : (
                <option value="">請先至設置頁面新增標的</option>
              )}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">方向</label>
            <select value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value as TradeDirection})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
              <option value={TradeDirection.LONG}>做多 (Long)</option>
              <option value={TradeDirection.SHORT}>做空 (Short)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">進場價</label>
            <input type="number" step="any" value={formData.entryPrice} onChange={e => setFormData({...formData, entryPrice: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-600" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">出場價</label>
            <input type="number" step="any" value={formData.exitPrice} onChange={e => setFormData({...formData, exitPrice: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-600" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">倉位規模</label>
            <input type="number" step="any" value={formData.size} onChange={e => setFormData({...formData, size: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">手續費/滑價</label>
            <input type="number" step="any" value={formData.fees} onChange={e => setFormData({...formData, fees: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="二" title="策略與邏輯 (Technical)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">進場訊號 (Setup)</label>
            <select value={formData.setup} onChange={e => setFormData({...formData, setup: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
              {setupOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">預計止損</label>
                <input type="number" step="any" value={formData.stopLoss} onChange={e => setFormData({...formData, stopLoss: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">預計止盈</label>
                <input type="number" step="any" value={formData.takeProfit} onChange={e => setFormData({...formData, takeProfit: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
             </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="三" title="心理狀態與行為 (Subjective)" />
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 block">進場自信度 ({formData.confidence}/10)</label>
              <input type="range" min="1" max="10" value={formData.confidence} onChange={e => setFormData({...formData, confidence: Number(e.target.value)})} className="w-full accent-indigo-600" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 block">執行紀律評分</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setFormData({...formData, executionRating: s})} className={`text-xl ${s <= (formData.executionRating || 0) ? 'text-amber-400' : 'text-slate-200'}`}>
                    <i className="fas fa-star"></i>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">進場前心理狀態</label>
            <textarea rows={2} value={formData.preTradeMindset} onChange={e => setFormData({...formData, preTradeMindset: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="描述進場時的直覺或焦慮度..." />
          </div>
          <div className="flex flex-wrap gap-2">
            {EMOTION_TAGS.map(tag => (
              <button key={tag} type="button" onClick={() => {
                const cur = formData.emotions || '';
                setFormData({...formData, emotions: cur.includes(tag) ? cur.replace(tag, '').trim() : `${cur} ${tag}`.trim()});
              }} className={`px-3 py-1 rounded-full text-xs font-bold transition border ${formData.emotions?.includes(tag) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="四" title="檢討與總結 (Growth)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">錯誤分類</label>
            <select value={formData.errorCategory} onChange={e => setFormData({...formData, errorCategory: e.target.value as ErrorCategory})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-rose-600">
              {Object.values(ErrorCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">一句話總結</label>
            <input type="text" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="例如：雖然賺錢但違反規則，需檢討..." />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">改進措施</label>
            <textarea rows={2} value={formData.improvements} onChange={e => setFormData({...formData, improvements: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="下次遇到同樣情況我該如何做得更好？" />
          </div>
        </div>
      </section>
    </form>
  );
};

export default LogForm;
