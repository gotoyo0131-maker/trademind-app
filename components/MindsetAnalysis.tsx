
import React, { useMemo, useState, useEffect } from 'react';
import { Trade } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { analyzeTradeHistory } from '../services/geminiService';

interface MindsetAnalysisProps {
  trades: Trade[];
}

const MindsetAnalysis: React.FC<MindsetAnalysisProps> = ({ trades }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'detected' | 'missing'>('checking');
  const [showGuide, setShowGuide] = useState(false);

  const checkKey = () => {
    let key = "";
    try {
      key = process.env.API_KEY || "";
    } catch (e) {
      key = (window as any).process?.env?.API_KEY || "";
    }
    
    if (key && key !== "undefined" && key.length > 10) {
      setApiKeyStatus('detected');
    } else {
      setApiKeyStatus('missing');
    }
  };

  useEffect(() => {
    checkKey();
    const interval = setInterval(checkKey, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeTradeHistory(trades);
      setAiAnalysis(result);
    } catch (e: any) {
      if (e.message === "API_KEY_MISSING") {
        setError("系統目前讀取不到金鑰。這通常是因為設定完變數後尚未執行 Trigger Deploy。");
        setShowGuide(true);
      } else if (e.message === "API_KEY_INVALID") {
        setError("金鑰驗證失敗。請確認您在 Netlify 貼上的金鑰完整且無空格。");
      } else {
        setError(`連線錯誤: ${e.message || "請檢查網路連線"}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analysis = useMemo(() => {
    if (trades.length === 0) return null;
    const emotionMap: Record<string, { pnl: number, count: number }> = {};
    trades.forEach(t => {
      const tags = (t.emotions || '').split(' ').filter(Boolean);
      tags.forEach(tag => {
        if (!emotionMap[tag]) emotionMap[tag] = { pnl: 0, count: 0 };
        emotionMap[tag].pnl += t.pnlAmount;
        emotionMap[tag].count += 1;
      });
    });
    const emotionData = Object.keys(emotionMap).map(name => ({
      name,
      avgPnl: emotionMap[name].pnl / emotionMap[name].count,
      count: emotionMap[name].count
    })).sort((a, b) => b.avgPnl - a.avgPnl);
    const avgExecution = trades.reduce((acc, t) => acc + t.executionRating, 0) / trades.length;
    return { emotionData, avgExecution };
  }, [trades]);

  if (trades.length === 0) return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <i className="fas fa-brain text-6xl mb-4 opacity-20"></i>
      <p className="font-bold text-sm">尚無心理數據。請開始記錄包含情緒標籤的交易。</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <section className="bg-[#0b1120] rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[160px] -mr-96 -mt-96"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-14">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.3)] rotate-3 border border-indigo-400/20">
                <i className="fas fa-robot text-white text-5xl"></i>
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tight flex items-center gap-5">
                  AI 交易行為導師
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${apiKeyStatus === 'detected' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,1)] animate-pulse'}`}></div>
                    <span className={`text-xs font-black uppercase tracking-widest ${apiKeyStatus === 'detected' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {apiKeyStatus === 'detected' ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                </h3>
                <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-[0.5em] mt-3">Quantum Engine v3.3</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase">部署檢查</span>
                <span className={`text-xs font-bold ${apiKeyStatus === 'detected' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {apiKeyStatus === 'detected' ? '金鑰已就緒' : '待重新部署'}
                </span>
              </div>
            </div>
          </div>

          {showGuide && apiKeyStatus === 'missing' && (
            <div className="mb-12 bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] p-10 animate-in zoom-in duration-500 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-xl font-black text-indigo-300 flex items-center gap-4">
                  <i className="fas fa-rocket"></i> 設定看起來正確，請完成最後一步
                </h4>
                <button onClick={() => setShowGuide(false)} className="text-slate-500 hover:text-white transition-colors">
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>
              
              <div className="bg-white/5 p-8 rounded-2xl border border-white/5 space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  您的設定已經儲存。請點擊左側選單的 <b>Deploys</b> 圖示，然後點擊右方的 <b>Trigger deploy</b> 並選擇 <b>Deploy site</b>。
                </p>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-xs text-amber-300 font-bold">
                    <i className="fas fa-info-circle mr-2"></i> 提示：網頁必須重新建置（Rebuild），新的金鑰才會生效。
                  </p>
                </div>
              </div>
            </div>
          )}

          {!aiAnalysis ? (
            <div className="space-y-12">
              <div className="max-w-3xl">
                <p className="text-slate-100 text-3xl md:text-4xl font-bold leading-tight mb-8">
                  「診斷交易靈魂，尋找獲利缺口。」
                </p>
                <div className="flex gap-4">
                   <div className="w-1 bg-indigo-600 rounded-full"></div>
                   <p className="text-slate-400 text-lg leading-relaxed font-medium">
                     我將深度掃描您的交易行為與情緒標籤，提供精準的行為校正建議。
                   </p>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <button 
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing || apiKeyStatus === 'missing'}
                  className={`px-16 py-8 rounded-[2rem] font-black text-xl transition-all flex items-center justify-center gap-5 shadow-[0_20px_80px_rgba(0,0,0,0.4)] ${
                    apiKeyStatus === 'detected' 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white hover:-translate-y-1 active:scale-95' 
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  {isAnalyzing ? (
                    <><i className="fas fa-spinner fa-spin"></i> 正在透視數據...</>
                  ) : (
                    <><i className="fas fa-bolt text-amber-400"></i> 開始 AI 診斷分析</>
                  )}
                </button>
                {apiKeyStatus === 'missing' && (
                  <div className="flex items-center gap-4 text-amber-400 animate-pulse">
                    <i className="fas fa-arrow-left text-2xl"></i>
                    <span className="text-sm font-black uppercase tracking-widest">請先重新部署</span>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2rem] max-w-2xl flex items-start gap-5">
                  <i className="fas fa-exclamation-triangle text-rose-500 text-2xl mt-1"></i>
                  <div>
                    <h5 className="font-black text-rose-400 text-lg mb-2">發生錯誤</h5>
                    <p className="text-rose-400/70 text-sm font-bold leading-relaxed">{error}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="bg-[#1e293b]/50 border border-white/10 rounded-[3rem] p-12 mb-10 shadow-2xl relative group backdrop-blur-2xl">
                <div className="absolute -top-6 left-16 px-8 py-3 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl border border-indigo-400/30">
                  BEHAVIORAL REPORT
                </div>
                <p className="whitespace-pre-wrap text-slate-100 text-2xl leading-relaxed font-medium relative z-10">
                  {aiAnalysis}
                </p>
              </div>
              <button 
                onClick={() => setAiAnalysis(null)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white px-12 py-5 rounded-2xl text-xs font-black transition-all flex items-center gap-4 uppercase"
              >
                <i className="fas fa-sync-alt"></i> 重啟新的診斷
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
            <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
            情緒標籤與盈虧分析
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis?.emotionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" fontSize={14} width={100} axisLine={false} tickLine={false} className="font-bold text-slate-700" />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none' }} />
                <Bar dataKey="avgPnl" radius={[0, 10, 10, 0]}>
                  {analysis?.emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-indigo-900 text-white p-10 rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 p-8 opacity-10">
             <i className="fas fa-award text-9xl"></i>
           </div>
           <p className="text-indigo-300 font-black uppercase tracking-[0.3em] text-[10px] mb-4">執行紀律評分</p>
           <div className="flex items-baseline gap-2 mb-6">
             <h4 className="text-8xl font-black">{(analysis ? analysis.avgExecution * 20 : 0).toFixed(0)}</h4>
             <span className="text-3xl font-black text-indigo-400">%</span>
           </div>
           <p className="text-indigo-100/70 text-sm leading-loose font-medium">
             這是根據您每筆交易的紀律自我評分算出的平均值。
           </p>
        </div>
      </div>
    </div>
  );
};

export default MindsetAnalysis;
