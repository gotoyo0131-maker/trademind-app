
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
  const [showRiskHelp, setShowRiskHelp] = useState(false);
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

  // 智慧風險計算邏輯
  const riskCalculation = useMemo(() => {
    const ep = Number(formData.entryPrice) || 0;
    const sl = Number(formData.stopLoss) || 0;
    const sz = Number(formData.size) || 0;
    const tp = Number(formData.takeProfit) || 0;

    const hasBaseData = ep > 0 && sl > 0;
    const amount = hasBaseData ? Math.abs(ep - sl) * (sz || 1) : 0;
    const rr = (hasBaseData && tp > 0) ? Math.abs(tp - ep) / Math.abs(ep - sl) : 0;

    return { amount, rr, ready: hasBaseData && sz > 0 };
  }, [formData.entryPrice, formData.stopLoss, formData.size, formData.takeProfit]);

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
      screenshots: validScreenshots
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <style>{`
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <header className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{initialData ? '編輯交易細節' : '開始新的交易錄入'}</h2>
        <p className="text-slate-500 font-medium">深入紀錄客觀數據與主觀感受，邁向職業交易者。</p>
      </header>

      {/* Step Indicator - Reduced to 2 steps */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${step === s ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/20' : step > s ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
              {step > s ? <i className="fas fa-check text-xs"></i> : s}
            </div>
            {s < 2 && <div className={`w-12 h-1 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {step === 1 && (
          <div className="space-y-10">
            {/* 1. 市場基礎數據 */}
            <div className="space-y-6">
              <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-database"></i> 交易明細與數據
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">標的 (Symbol)</label>
                  <select value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 outline-none appearance-none" required>
                    {symbolOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">方向</label>
                  <select value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value as TradeDirection})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-slate-800 appearance-none">
                    <option value={TradeDirection.LONG}>{TradeDirection.LONG}</option>
                    <option value={TradeDirection.SHORT}>{TradeDirection.SHORT}</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">進場價格</label>
                  <input type="number" step="any" value={formData.entryPrice || ''} onChange={e => setFormData({...formData, entryPrice: Number(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold" placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">出場價格</label>
                  <input type="number" step="any" value={formData.exitPrice || ''} onChange={e => setFormData({...formData, exitPrice: Number(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold" placeholder="0.00" />
                </div>
                <div className="col-span-2 md:col-span-1 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">數量 (Size)</label>
                  <input type="number" step="any" value={formData.size || ''} onChange={e => setFormData({...formData, size: Number(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">進場時間</label>
                  <input type="datetime-local" value={formData.entryTime} onChange={e => setFormData({...formData, entryTime: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">出場時間</label>
                  <input type="datetime-local" value={formData.exitTime} onChange={e => setFormData({...formData, exitTime: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold" required />
                </div>
              </div>
            </div>

            {/* 2. 技術與風控 */}
            <div className="space-y-6 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-shield-halved"></i> 技術策略與風控
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">進場策略 (Setup)</label>
                    <select value={formData.setup} onChange={e => setFormData({...formData, setup: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-600 outline-none appearance-none">
                      {setupOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                        初始風險 (Initial Risk $)
                        <button type="button" onClick={() => setShowRiskHelp(!showRiskHelp)} className="w-4 h-4 bg-indigo-200 text-indigo-600 rounded-full flex items-center justify-center">
                          <i className="fas fa-question text-[8px]"></i>
                        </button>
                      </label>
                      {riskCalculation.rr > 0 && (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          R:R: {riskCalculation.rr.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <input 
                      type="number" 
                      step="any" 
                      value={formData.initialRisk || ''} 
                      onChange={e => setFormData({...formData, initialRisk: Number(e.target.value)})} 
                      className="w-full p-3 bg-white border-2 border-indigo-200 rounded-xl font-black text-indigo-900 text-lg outline-none focus:border-indigo-500" 
                      placeholder="這筆打算賠多少？" 
                    />
                    {riskCalculation.ready && (
                      <div className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-dashed border-indigo-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">建議: ${riskCalculation.amount.toFixed(2)}</span>
                        <button type="button" onClick={() => setFormData({...formData, initialRisk: riskCalculation.amount})} className="text-[10px] font-black text-indigo-600 hover:underline">點擊套用</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">止損 (SL)</label>
                      <input type="number" step="any" value={formData.stopLoss || ''} onChange={e => setFormData({...formData, stopLoss: Number(e.target.value)})} className="w-full p-3 bg-rose-50 border border-rose-100 rounded-xl font-bold text-rose-500" placeholder="止損價" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">止盈 (TP)</label>
                      <input type="number" step="any" value={formData.takeProfit || ''} onChange={e => setFormData({...formData, takeProfit: Number(e.target.value)})} className="w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl font-bold text-emerald-500" placeholder="目標價" />
                    </div>
                  </div>
                  
                  {/* Screenshots Grid - 4 slots visible */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">交易圖解 (至少 4 個欄位)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {formData.screenshots?.map((ss, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex flex-col gap-1.5">
                          <input type="url" placeholder="圖片網址" value={ss.url} onChange={e => handleScreenshotChange(idx, 'url', e.target.value)} className="text-[9px] bg-white p-1 rounded border border-slate-200 outline-none" />
                          <input type="text" placeholder="描述" value={ss.description} onChange={e => handleScreenshotChange(idx, 'description', e.target.value)} className="text-[9px] bg-white p-1 rounded border border-slate-200 outline-none" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-brain"></i> 執行檢討與心理狀態
            </h3>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">心理狀態標籤 (可多選)</label>
              <div className="flex flex-wrap gap-2">
                {EMOTION_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => {
                    const cur = formData.emotions || '';
                    setFormData({...formData, emotions: cur.includes(tag) ? cur.replace(tag, '').trim() : `${cur} ${tag}`.trim()});
                  }} className={`px-4 py-2 rounded-xl text-[10px] font-black transition border-2 ${formData.emotions?.includes(tag) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">執行紀律評分 (1-5 星)</label>
                <div className="flex gap-4 bg-slate-50 p-5 rounded-2xl justify-center border border-slate-100">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setFormData({...formData, executionRating: s})} className={`text-3xl transition hover:scale-125 ${s <= (formData.executionRating || 0) ? 'text-amber-400' : 'text-slate-200'}`}>
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">執行錯誤分類 (若有)</label>
                <select value={formData.errorCategory} onChange={e => setFormData({...formData, errorCategory: e.target.value as ErrorCategory})} className="w-full p-4 bg-rose-50/30 border border-rose-100 rounded-2xl outline-none font-black text-rose-600 appearance-none">
                  {Object.values(ErrorCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">一句話檢討 (Summary)</label>
                <input type="text" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800" placeholder="例如: 趨勢確認後回測進場，完美執行。" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">具體改進建議</label>
                <textarea rows={4} value={formData.improvements} onChange={e => setFormData({...formData, improvements: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed" placeholder="列出 2-3 個下次可以做得更好的地方..." />
              </div>
            </div>
          </div>
        )}

        <div className="pt-10 flex flex-col md:flex-row justify-between gap-4">
          <button type="button" onClick={step === 1 ? onCancel : () => setStep(step - 1)} className="order-2 md:order-1 px-8 py-4 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition">
            {step === 1 ? '取消錄入' : '回上一步'}
          </button>
          <button type="submit" className="order-1 md:order-2 flex-grow py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-95">
            {step === 2 ? (initialData ? '更新交易紀錄' : '完成錄入並儲存') : '下一步：行為心理與檢討 →'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogForm;
