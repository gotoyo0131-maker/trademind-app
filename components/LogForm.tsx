
import React, { useState, useEffect } from 'react';
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
          <p className="text-xs text-slate-500 font-medium">誠實紀錄是長期獲利的唯一方法。</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition">取消</button>
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition active:scale-95">儲存日誌</button>
        </div>
      </div>

      {/* 1. 基礎交易數據 (Hard Data) */}
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
            <select value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700 outline-none" required>
              {symbolOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">方向</label>
            <select value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value as TradeDirection})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
              <option value={TradeDirection.LONG}>{TradeDirection.LONG}</option>
              <option value={TradeDirection.SHORT}>{TradeDirection.SHORT}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">數量</label>
            <input type="number" step="any" value={formData.size} onChange={e => setFormData({...formData, size: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">進場價</label>
            <input type="number" step="any" value={formData.entryPrice} onChange={e => setFormData({...formData, entryPrice: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">出場價</label>
            <input type="number" step="any" value={formData.exitPrice} onChange={e => setFormData({...formData, exitPrice: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">手續費</label>
            <input type="number" step="any" value={formData.fees} onChange={e => setFormData({...formData, fees: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
          </div>
        </div>
      </section>

      {/* 2. 策略與邏輯 (Technical) */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="二" title="策略與邏輯 (Technical)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">進場策略 (Setup)</label>
            <select value={formData.setup} onChange={e => setFormData({...formData, setup: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
              {setupOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">止損</label>
                <input type="number" step="any" value={formData.stopLoss} onChange={e => setFormData({...formData, stopLoss: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">止盈</label>
                <input type="number" step="any" value={formData.takeProfit} onChange={e => setFormData({...formData, takeProfit: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
             </div>
          </div>
        </div>
      </section>

      {/* 3. 交易圖解與截圖 (Screenshots) */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="三" title="交易圖解與截圖 (Screenshots)" />
        <p className="text-[10px] text-slate-400 mb-6 -mt-4 font-medium italic">請輸入 TradingView 連結或其他圖片網址。未輸入網址的欄位將不會儲存。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formData.screenshots?.map((ss, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">截圖 #{idx + 1}</span>
                {ss.url && <i className="fas fa-check-circle text-emerald-500 text-xs"></i>}
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <i className="fas fa-link absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                  <input 
                    type="url" 
                    placeholder="圖片或連結網址..." 
                    value={ss.url} 
                    onChange={e => handleScreenshotChange(idx, 'url', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="relative">
                  <i className="fas fa-comment-alt absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                  <input 
                    type="text" 
                    placeholder="簡短說明 (如: 進場圖)..." 
                    value={ss.description} 
                    onChange={e => handleScreenshotChange(idx, 'description', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 心理狀態與行為 (Subjective) */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="四" title="心理狀態與行為 (Subjective)" />
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {EMOTION_TAGS.map(tag => (
              <button key={tag} type="button" onClick={() => {
                const cur = formData.emotions || '';
                setFormData({...formData, emotions: cur.includes(tag) ? cur.replace(tag, '').trim() : `${cur} ${tag}`.trim()});
              }} className={`px-4 py-2 rounded-full text-xs font-bold transition border ${formData.emotions?.includes(tag) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                {tag}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 block">執行紀律評分 ({formData.executionRating} 星)</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setFormData({...formData, executionRating: s})} className={`text-2xl transition ${s <= (formData.executionRating || 0) ? 'text-amber-400' : 'text-slate-200'}`}>
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 block">進場自信度 ({formData.confidence}/10)</label>
                <input type="range" min="1" max="10" value={formData.confidence} onChange={e => setFormData({...formData, confidence: Number(e.target.value)})} className="w-full accent-indigo-600" />
             </div>
          </div>
        </div>
      </section>

      {/* 5. 檢討與總結 (Growth) */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="五" title="檢討與總結 (Growth)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">錯誤分類 (Errors)</label>
            <select value={formData.errorCategory} onChange={e => setFormData({...formData, errorCategory: e.target.value as ErrorCategory})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-rose-600">
              {Object.values(ErrorCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">一句話總結</label>
            <input type="text" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="總結本次核心..." />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">未來改進點</label>
            <textarea rows={3} value={formData.improvements} onChange={e => setFormData({...formData, improvements: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="列出 2-3 個下次可以做得更好的地方..." />
          </div>
        </div>
      </section>
    </form>
  );
};

export default LogForm;
