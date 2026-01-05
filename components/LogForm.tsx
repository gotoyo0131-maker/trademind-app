
import React, { useState, useEffect } from 'react';
import { Trade, TradeDirection, ErrorCategory } from '../types';
import { EMOTION_TAGS } from '../constants';

interface LogFormProps {
  onSave: (trade: Trade) => void;
  onCancel: () => void;
  initialData?: Trade | null;
  setupOptions: string[];
}

const LogForm: React.FC<LogFormProps> = ({ onSave, onCancel, initialData, setupOptions }) => {
  const [formData, setFormData] = useState<Partial<Trade>>({
    id: crypto.randomUUID(),
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: new Date().toISOString().slice(0, 16),
    symbol: '',
    direction: TradeDirection.LONG,
    entryPrice: 0,
    exitPrice: 0,
    size: 0,
    fees: 0,
    slippage: 0,
    setup: setupOptions[0] || '趨勢跟蹤',
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
    if (initialData) setFormData(initialData);
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
      pnlAmount,
      pnlPercentage,
      riskRewardRatio: 2 // 簡化處理
    });
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>, field: 'screenshotBefore' | 'screenshotAfter') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const SectionTitle = ({ num, title }: { num: string, title: string }) => (
    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
      <span className="bg-indigo-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-md">{num}</span>
      {title}
    </h3>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md py-4 z-20 border-b border-slate-200 -mx-4 px-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{initialData ? '編輯交易' : '新增交易日誌'}</h2>
          <p className="text-xs text-slate-500 font-medium">嚴格記錄是邁向盈利的第一步。</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition">取消</button>
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition active:scale-95">儲存日誌</button>
        </div>
      </div>

      {/* 第一維度 */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="一" title="基礎交易數據 (Hard Data)" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">交易標的</label>
            <input type="text" name="symbol" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" placeholder="例如: BTC/USDT" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">方向</label>
            <select value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value as TradeDirection})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
              <option value={TradeDirection.LONG}>做多 (Long)</option>
              <option value={TradeDirection.SHORT}>做空 (Short)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">倉位規模</label>
            <input type="number" step="any" value={formData.size} onChange={e => setFormData({...formData, size: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">進場價</label>
            <input type="number" step="any" value={formData.entryPrice} onChange={e => setFormData({...formData, entryPrice: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-indigo-600" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">出場價</label>
            <input type="number" step="any" value={formData.exitPrice} onChange={e => setFormData({...formData, exitPrice: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-rose-600" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">手續費/滑價</label>
            <input type="number" step="any" value={formData.fees} onChange={e => setFormData({...formData, fees: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" />
          </div>
        </div>
      </section>

      {/* 第二維度 */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="二" title="策略與邏輯 (Technical)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">進場訊號 (Setup)</label>
            <select value={formData.setup} onChange={e => setFormData({...formData, setup: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
              {setupOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">預計止損 (SL)</label>
                <input type="number" step="any" value={formData.stopLoss} onChange={e => setFormData({...formData, stopLoss: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
             </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">預計止盈 (TP)</label>
                <input type="number" step="any" value={formData.takeProfit} onChange={e => setFormData({...formData, takeProfit: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
             </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">進場圖 (Before)</label>
            <input type="file" accept="image/*" onChange={e => handleImage(e, 'screenshotBefore')} className="text-xs" />
            {formData.screenshotBefore && <img src={formData.screenshotBefore} className="h-32 w-full object-cover rounded-xl mt-2 border border-slate-100" />}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">出場圖 (After)</label>
            <input type="file" accept="image/*" onChange={e => handleImage(e, 'screenshotAfter')} className="text-xs" />
            {formData.screenshotAfter && <img src={formData.screenshotAfter} className="h-32 w-full object-cover rounded-xl mt-2 border border-slate-100" />}
          </div>
        </div>
      </section>

      {/* 第三維度 */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="三" title="心理狀態與行為 (Subjective)" />
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase block">進場自信程度 ({formData.confidence}/10)</label>
              <input type="range" min="1" max="10" value={formData.confidence} onChange={e => setFormData({...formData, confidence: Number(e.target.value)})} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">進場前心態記錄</label>
                <textarea rows={3} value={formData.preTradeMindset} onChange={e => setFormData({...formData, preTradeMindset: e.target.value})} placeholder="例如：感到有些焦慮，因為這是在關鍵位突破後追高的..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase block">執行力自我評價</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(star => (
                  <button key={star} type="button" onClick={() => setFormData({...formData, executionRating: star})} className={`text-2xl transition ${star <= (formData.executionRating || 0) ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}>
                    <i className="fas fa-star"></i>
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">執行偏差備註</label>
                <textarea rows={3} value={formData.notesOnExecution} onChange={e => setFormData({...formData, notesOnExecution: e.target.value})} placeholder="例如：原本計畫 50 止損，但手癢改到了 45..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase">情緒標籤</label>
             <div className="flex flex-wrap gap-2">
               {EMOTION_TAGS.map(tag => (
                 <button 
                  key={tag} 
                  type="button"
                  onClick={() => {
                    const current = formData.emotions || '';
                    const updated = current.includes(tag) ? current.replace(tag, '').trim() : `${current} ${tag}`.trim();
                    setFormData({...formData, emotions: updated});
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${formData.emotions?.includes(tag) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                 >
                   {tag}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* 第四維度 */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SectionTitle num="四" title="檢討與總結 (Growth)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">錯誤分類 (最關鍵的一步)</label>
            <select value={formData.errorCategory} onChange={e => setFormData({...formData, errorCategory: e.target.value as ErrorCategory})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-rose-600">
              {Object.values(ErrorCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">一句話定義這筆交易</label>
            <input type="text" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} placeholder="例如：雖然賺錢但違反規則，下次需注意。" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase">具體改進措施</label>
            <textarea rows={2} value={formData.improvements} onChange={e => setFormData({...formData, improvements: e.target.value})} placeholder="例如：當 RSI 超過 80 時，絕對不進場做多..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
          </div>
        </div>
      </section>
    </form>
  );
};

export default LogForm;
