
import React, { useState, useEffect, useMemo } from 'react';
import { Trade, TradeDirection, ErrorCategory, TradeScreenshot } from '../types';
import { EMOTION_TAGS } from '../constants';

interface LogFormProps {
  onSave: (trade: Trade) => void;
  onCancel: () => void;
  initialData?: Trade | null;
  setupOptions: string[];
  symbolOptions: string[];
}

const LogForm: React.FC<LogFormProps> = ({ onSave, onCancel, initialData, setupOptions, symbolOptions }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Trade>>({
    id: `id_${Date.now()}`,
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
    initialRisk: 0,
    confidence: 7,
    emotions: '',
    preTradeMindset: '',
    executionRating: 5,
    notesOnExecution: '',
    errorCategory: ErrorCategory.NONE,
    improvements: '',
    summary: '',
    screenshots: [
      { url: '', description: '' },
      { url: '', description: '' },
      { url: '', description: '' },
      { url: '', description: '' }
    ]
  });

  const riskCalculation = useMemo(() => {
    const ep = Number(formData.entryPrice) || 0;
    const sl = Number(formData.stopLoss) || 0;
    const tp = Number(formData.takeProfit) || 0;
    const size = Number(formData.size) || 0;

    const hasBaseData = ep > 0 && sl > 0;
    const rr = (hasBaseData && tp > 0) ? Math.abs(tp - ep) / Math.abs(ep - sl) : 0;
    const suggestedRisk = (hasBaseData && size > 0) ? Math.abs(ep - sl) * size : 0;

    return { rr, suggestedRisk };
  }, [formData.entryPrice, formData.stopLoss, formData.takeProfit, formData.size]);

  useEffect(() => {
    if (initialData) {
      const formatForInput = (isoStr: string) => {
        if (!isoStr) return new Date().toISOString().slice(0, 16);
        const d = new Date(isoStr);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      setFormData({
        ...initialData,
        entryTime: formatForInput(initialData.entryTime),
        exitTime: formatForInput(initialData.exitTime),
        screenshots: (initialData.screenshots && initialData.screenshots.length > 0) 
          ? [...initialData.screenshots, ...Array(Math.max(0, 4 - initialData.screenshots.length)).fill({ url: '', description: '' })].slice(0, 4)
          : [
            { url: '', description: '' },
            { url: '', description: '' },
            { url: '', description: '' },
            { url: '', description: '' }
          ]
      });
    }
  }, [initialData]);

  const handleScreenshotChange = (index: number, field: keyof TradeScreenshot, value: string) => {
    const newScreenshots = [...(formData.screenshots || [])];
    if (newScreenshots[index]) {
      newScreenshots[index] = { ...newScreenshots[index], [field]: value };
      setFormData({ ...formData, screenshots: newScreenshots });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }

    const entryPrice = Number(formData.entryPrice) || 0;
    const exitPrice = Number(formData.exitPrice) || 0;
    const size = Number(formData.size) || 0;
    const isLong = formData.direction === TradeDirection.LONG;
    
    const priceDiff = isLong ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    const pnlAmount = (priceDiff * size) - (Number(formData.fees) || 0) - (Number(formData.slippage) || 0);
    const pnlPercentage = entryPrice !== 0 ? (priceDiff / entryPrice) * 100 : 0;

    const validScreenshots = (formData.screenshots || []).filter(s => s.url && s.url.trim() !== '');

    onSave({
      ...formData as Trade,
      entryTime: new Date(formData.entryTime || "").toISOString(),
      exitTime: new Date(formData.exitTime || "").toISOString(),
      pnlAmount,
      pnlPercentage,
      riskRewardRatio: riskCalculation.rr || undefined,
      screenshots: validScreenshots
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <header className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{initialData ? '編輯交易細節' : '開始新的交易錄入'}</h2>
        <p className="text-slate-500 font-medium">合併數據與風控，一次完成核心錄入。</p>
      </header>

      <div className="flex items-center justify-center gap-4 mb-10">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${step === s ? 'bg-indigo-600 text-white scale-110 shadow-lg' : step > s ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
              {step > s ? <i className="fas fa-check text-xs"></i> : s}
            </div>
            {s < 2 && <div className={`w-12 h-1 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-10 animate-in fade-in duration-500">
        {step === 1 && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-chart-bar"></i> 市場數據 (Market Data)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">標的</label>
                    <select value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black">
                      {symbolOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">方向</label>
                    <select value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value as TradeDirection})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black">
                      <option value={TradeDirection.LONG}>做多</option>
                      <option value={TradeDirection.SHORT}>做空</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">進場價</label>
                    <input type="number" step="any" value={formData.entryPrice || ''} onChange={e => setFormData({...formData, entryPrice: Number(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">出場價</label>
                    <input type="number" step="any" value={formData.exitPrice || ''} onChange={e => setFormData({...formData, exitPrice: Number(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">數量</label>
                    <input type="number" step="any" value={formData.size || ''} onChange={e => setFormData({...formData, size: Number(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">手續費/費用</label>
                    <input type="number" step="any" value={formData.fees || ''} onChange={e => setFormData({...formData, fees: Number(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-xl font-bold focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">進場時間</label>
                    <input type="datetime-local" value={formData.entryTime} onChange={e => setFormData({...formData, entryTime: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-[11px] font-bold outline-none" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">出場時間</label>
                    <input type="datetime-local" value={formData.exitTime} onChange={e => setFormData({...formData, exitTime: e.target.value})} className="w-full p-3 border-2 border-indigo-100 bg-indigo-50/20 rounded-xl text-[11px] font-bold outline-none focus:border-indigo-500 transition-all" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-shield-halved"></i> 技術與風控 (Strategy & Risk)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">進場策略 (Setup)</label>
                    <select value={formData.setup} onChange={e => setFormData({...formData, setup: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-600 outline-none">
                      {setupOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">止損 (SL)</label>
                    <input type="number" step="any" value={formData.stopLoss || ''} onChange={e => setFormData({...formData, stopLoss: Number(e.target.value)})} className="w-full p-3 border border-rose-100 bg-rose-50/30 rounded-xl font-bold text-rose-600 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">止盈 (TP)</label>
                    <input type="number" step="any" value={formData.takeProfit || ''} onChange={e => setFormData({...formData, takeProfit: Number(e.target.value)})} className="w-full p-3 border border-emerald-100 bg-emerald-50/30 rounded-xl font-bold text-emerald-600 outline-none" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">預期風險金額 ($)</label>
                      {riskCalculation.rr > 0 && <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md">R:R: {riskCalculation.rr.toFixed(2)}</span>}
                    </div>
                    <input 
                      type="number" 
                      value={formData.initialRisk || ''} 
                      onChange={e => setFormData({...formData, initialRisk: Number(e.target.value)})} 
                      className="w-full p-4 bg-white border-2 border-indigo-200 rounded-2xl outline-none font-black text-xl text-slate-700 focus:border-indigo-500 transition-all placeholder:text-slate-300" 
                      placeholder="這筆打算賠多少？" 
                    />
                    {riskCalculation.suggestedRisk > 0 && (
                      <div 
                        onClick={() => setFormData({...formData, initialRisk: Number(riskCalculation.suggestedRisk.toFixed(2))})}
                        className="mt-2 p-3 border-2 border-dashed border-indigo-100 rounded-xl flex items-center justify-between cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
                      >
                        <span className="text-[11px] font-bold text-slate-500">建議: <span className="text-indigo-600">${riskCalculation.suggestedRisk.toFixed(2)}</span></span>
                        <span className="text-[10px] font-black text-indigo-600 uppercase group-hover:underline">點擊套用</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-images"></i> 交易圖解 (Screenshots)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {formData.screenshots?.map((ss, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <input type="url" placeholder="圖片連結 (URL)" value={ss.url} onChange={e => handleScreenshotChange(idx, 'url', e.target.value)} className="w-full p-2 text-[10px] border border-slate-200 rounded-lg outline-none" />
                    <input type="text" placeholder="簡短描述" value={ss.description} onChange={e => handleScreenshotChange(idx, 'description', e.target.value)} className="w-full p-2 text-[10px] border border-slate-200 rounded-lg outline-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-brain"></i> 行為心理與執行檢討
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">進場前心態</label>
                <textarea rows={2} value={formData.preTradeMindset} onChange={e => setFormData({...formData, preTradeMindset: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500" placeholder="當時是否有焦慮、FOMO 或過度自信？" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">執行過程筆記</label>
                <textarea rows={2} value={formData.notesOnExecution} onChange={e => setFormData({...formData, notesOnExecution: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500" placeholder="是否嚴格執行計畫？中途是否有亂動止損？" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">情緒標籤</label>
              <div className="flex flex-wrap gap-2">
                {EMOTION_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => {
                    const cur = formData.emotions || '';
                    setFormData({...formData, emotions: cur.includes(tag) ? cur.replace(tag, '').trim() : `${cur} ${tag}`.trim()});
                  }} className={`px-4 py-2 rounded-xl text-[10px] font-black transition ${formData.emotions?.includes(tag) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">執行紀律評分</label>
                <div className="flex justify-center gap-4 py-4">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setFormData({...formData, executionRating: s})} className={`text-3xl transition ${s <= (formData.executionRating || 0) ? 'text-amber-400' : 'text-slate-200'}`}>
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest">錯誤分類</label>
                <select value={formData.errorCategory} onChange={e => setFormData({...formData, errorCategory: e.target.value as ErrorCategory})} className="w-full p-3 bg-rose-50 border border-rose-100 rounded-xl font-black text-rose-600 outline-none">
                  {Object.values(ErrorCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">一句話總結</label>
                <input type="text" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">具體改進點</label>
                <textarea rows={2} value={formData.improvements} onChange={e => setFormData({...formData, improvements: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-indigo-500" />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-4 pt-10">
          <button type="button" onClick={step === 1 ? onCancel : () => setStep(1)} className="px-8 py-4 bg-slate-100 text-slate-500 font-black text-xs rounded-2xl hover:bg-slate-200 transition">
            {step === 1 ? '取消' : '回上一步'}
          </button>
          <button type="submit" className="flex-grow py-4 bg-indigo-600 text-white font-black text-xs rounded-2xl shadow-xl hover:bg-indigo-700 transition active:scale-95">
            {step === 1 ? '下一步：心理檢討 →' : '儲存紀錄'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogForm;
