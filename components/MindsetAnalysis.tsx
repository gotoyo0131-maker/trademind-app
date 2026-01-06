
import React, { useMemo, useState, useEffect } from 'react';
import { Trade } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, ScatterChart, Scatter, ZAxis
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

  useEffect(() => {
    // 檢查環境變數
    const checkKey = () => {
      if (process.env.API_KEY && process.env.API_KEY.length > 10) {
        setApiKeyStatus('detected');
      } else {
        setApiKeyStatus('missing');
      }
    };
    checkKey();
  }, []);

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeTradeHistory(trades);
      setAiAnalysis(result);
    } catch (e: any) {
      if (e.message === "API_KEY_MISSING") {
        setError("系統偵測不到金鑰。請確認已 Redeploy 專案。");
        setShowGuide(true);
      } else {
        setError("分析過程發生錯誤。請確認 Google Gemini API 金鑰是否有效。");
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

    const scatterData = trades.map(t => ({
      execution: t.executionRating,
      pnl: t.pnlAmount,
      symbol: t.symbol
    }));

    const avgExecution = trades.reduce((acc, t) => acc + t.executionRating, 0) / trades.length;

    return { emotionData, scatterData, avgExecution };
  }, [trades]);

  if (trades.length === 0) return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <i className="fas fa-brain text-6xl mb-4 opacity-20"></i>
      <p className="font-bold text-sm">尚無心理數據。請開始記錄包含情緒標籤的交易。</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <section className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl transition-all border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 rotate-3 border border-indigo-400/30">
                <i className="fas fa-robot text-white text-2xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  AI 交易行為導師
                  {apiKeyStatus === 'detected' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-widest animate-pulse">Online</span>
                  )}
                </h3>
                <p className="text-indigo-300/60 text-[10px] font-bold uppercase tracking-[0.2em]">Quantum behavioral logic engine</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all ${
              apiKeyStatus === 'detected' 
                ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5' 
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">導師連線狀態</span>
                {apiKeyStatus === 'detected' ? (
                  <span className="text-[11px] font-black text-emerald-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                    核心已就緒
                  </span>
                ) : (
                  <button onClick={() => setShowGuide(!showGuide)} className="text-[11px] font-black text-rose-400 hover:text-rose-300 transition flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                    未偵測到金鑰
                  </button>
                )}
              </div>
            </div>
          </div>

          {showGuide && (
            <div className="mb-8 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 animate-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  <i className="fas fa-wrench"></i> 快速修復指南
                </h4>
                <button onClick={() => setShowGuide(false)} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 font-bold border-l-2 border-indigo-500 pl-3">步驟 1：Vercel 設定</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed ml-4">
                    請確認您的變數名稱是 <code className="text-white bg-slate-800 px-1 rounded">API_KEY</code>，且 Environments 必須勾選 <b className="text-emerald-400">Production</b>。
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 font-bold border-l-2 border-indigo-500 pl-3">步驟 2：重新部署 (Redeploy)</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed ml-4">
                    設定完變數後，請至 Vercel 點擊 <b>Redeploy</b>，新金鑰才會生效。
                  </p>
                </div>
              </div>
            </div>
          )}

          {!aiAnalysis ? (
            <div className="space-y-6">
              <div className="max-w-2xl">
                <p className="text-slate-300 text-lg font-medium leading-relaxed mb-2">
                  「你的情緒是你帳戶最大的敵人。」
                </p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  我將掃描您最近的交易明細，透過情緒關聯模型找出您的行為弱點，並提供精確的改進指令。
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className={`px-10 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-2xl ${
                    apiKeyStatus === 'detected' 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isAnalyzing ? (
                    <><i className="fas fa-circle-notch fa-spin"></i> 正在透視數據魂...</>
                  ) : (
                    <><i className="fas fa-bolt text-amber-400"></i> 開始深度診斷</>
                  )}
                </button>
                {apiKeyStatus === 'missing' && (
                  <p className="text-xs text-amber-400 italic animate-pulse">
                    <i className="fas fa-arrow-left mr-2"></i> 請先完成金鑰設定與 Redeploy
                  </p>
                )}
              </div>
              
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl max-w-lg">
                  <p className="text-rose-400 text-xs font-bold flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle"></i> {error}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6 shadow-inner relative group">
                <div className="absolute -top-3 left-8 px-3 py-1 bg-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                  導師診斷報告
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500/20"></span>
                  </div>
                  <i className="fas fa-quote-right text-white/5 text-4xl"></i>
                </div>
                <p className="whitespace-pre-wrap text-slate-200 text-base leading-loose font-medium">
                  {aiAnalysis}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setAiAnalysis(null)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <i className="fas fa-redo"></i> 再次診斷
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 數據圖表部分保持不變 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <i className="fas fa-theater-masks text-indigo-500"></i> 情緒標籤與平均盈虧關聯
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis?.emotionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" fontSize={12} width={80} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="avgPnl" radius={[0, 4, 4, 0]}>
                  {analysis?.emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-indigo-900 text-white p-8 rounded-3xl flex flex-col justify-center relative overflow-hidden shadow-2xl">
           <i className="fas fa-award absolute -right-4 -bottom-4 text-9xl opacity-10 rotate-12"></i>
           <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs mb-2">執行紀律指數</p>
           <h4 className="text-6xl font-black mb-4">{(analysis ? analysis.avgExecution * 20 : 0).toFixed(1)}<span className="text-2xl">%</span></h4>
           <p className="text-indigo-100/70 text-sm leading-relaxed">
             這反映了您「知行合一」的程度。專業交易者的指數通常穩定在 85% 以上。
           </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
          <i className="fas fa-dot-circle text-indigo-500"></i> 執行紀律與盈虧分佈
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" dataKey="execution" name="星等" domain={[1, 5]} ticks={[1,2,3,4,5]} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="pnl" name="盈虧" unit="$" axisLine={false} tickLine={false} />
              <ZAxis type="number" range={[100, 500]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="交易" data={analysis?.scatterData}>
                {analysis?.scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} opacity={0.6} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MindsetAnalysis;
