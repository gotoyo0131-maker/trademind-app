
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
    // 檢查環境變數是否成功注入 (Vercel 重新部署後會生效)
    const checkKey = () => {
      const key = process.env.API_KEY;
      if (key && key.length > 5) {
        setApiKeyStatus('detected');
      } else {
        setApiKeyStatus('missing');
      }
    };
    checkKey();
    
    // 定期檢查 (預防 redeploy 後的 race condition)
    const timer = setTimeout(checkKey, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeTradeHistory(trades);
      setAiAnalysis(result);
    } catch (e: any) {
      console.error("AI Analysis Error:", e);
      if (e.message === "API_KEY_MISSING") {
        setError("系統仍未讀取到金鑰。請確認 Vercel 已經完成 Redeploy。");
        setShowGuide(true);
      } else if (e.status === 429) {
        setError("【免費版限制】請求頻率過高。請等 60 秒後再試一次。");
      } else {
        setError(`分析失敗: ${e.message || "請檢查網路或金鑰權限"}`);
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
      <section className="bg-[#0f172a] rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] -ml-48 -mb-48"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 rotate-3 border border-indigo-400/30">
                <i className="fas fa-robot text-white text-3xl"></i>
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  AI 交易行為導師
                  {apiKeyStatus === 'detected' && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black uppercase tracking-widest animate-pulse">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                      Online
                    </span>
                  )}
                </h3>
                <p className="text-indigo-300/60 text-[11px] font-bold uppercase tracking-[0.3em] mt-1">Behavioral Logic Engine</p>
              </div>
            </div>

            <div className={`px-6 py-3 rounded-2xl border transition-all duration-500 ${
              apiKeyStatus === 'detected' 
                ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">系統診斷結果</span>
                {apiKeyStatus === 'detected' ? (
                  <span className="text-xs font-black text-emerald-400 flex items-center gap-2">
                    <i className="fas fa-check-double"></i>
                    金鑰注入成功
                  </span>
                ) : (
                  <button onClick={() => setShowGuide(!showGuide)} className="text-xs font-black text-rose-400 hover:text-rose-300 transition flex items-center gap-2 group">
                    <i className="fas fa-exclamation-triangle group-hover:rotate-12 transition"></i>
                    未偵測到金鑰 (點擊查看原因)
                  </button>
                )}
              </div>
            </div>
          </div>

          {showGuide && apiKeyStatus === 'missing' && (
            <div className="mb-10 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 animate-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-base font-bold text-indigo-300 flex items-center gap-3">
                  <i className="fas fa-terminal"></i> 您的 Vercel 設定看起來很完美，但...
                </h4>
                <button onClick={() => setShowGuide(false)} className="text-slate-500 hover:text-white transition"><i className="fas fa-times"></i></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-xs text-slate-300 font-bold border-l-4 border-indigo-500 pl-4 py-1">最後一步：Redeploy</p>
                  <p className="text-xs text-slate-400 leading-loose ml-5">
                    環境變數就像是「裝修材料」，您已經把材料買好放在門口了，但您需要叫裝修工人（Vercel）進場重新施工一次，這些材料才會出現在房子裡。<br/>
                    <b>請到 Vercel 的 Deployments 點擊 Redeploy。</b>
                  </p>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <i className="fas fa-sync-alt text-3xl text-indigo-400 animate-spin-slow"></i>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">等待重新部署中</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!aiAnalysis ? (
            <div className="space-y-8">
              <div className="max-w-2xl">
                <p className="text-slate-200 text-xl font-medium leading-relaxed mb-4">
                  「診斷您的交易靈魂，找出獲利缺口。」
                </p>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  透過 Gemini 3 原生大模型分析您的行為數據。我們不只分析數字，更分析數據背後的情緒波動。
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-5">
                <button 
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing || apiKeyStatus === 'missing'}
                  className={`px-12 py-5 rounded-[1.25rem] font-black text-sm transition-all flex items-center justify-center gap-3 shadow-2xl ${
                    apiKeyStatus === 'detected' 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/40 active:scale-95' 
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  {isAnalyzing ? (
                    <><i className="fas fa-circle-notch fa-spin"></i> 正在透視數據魂...</>
                  ) : (
                    <><i className="fas fa-bolt text-amber-400"></i> 開始深度診斷報告</>
                  )}
                </button>
                {apiKeyStatus === 'missing' && (
                  <div className="flex items-center gap-3 text-rose-400 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 animate-bounce">
                    <i className="fas fa-arrow-left"></i>
                    <span className="text-[10px] font-black uppercase tracking-widest">請先 Redeploy 專案</span>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl max-w-xl animate-in shake">
                  <p className="text-rose-400 text-xs font-bold flex items-center gap-3">
                    <i className="fas fa-exclamation-triangle text-base"></i> {error}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-10 mb-8 shadow-inner relative group backdrop-blur-sm">
                <div className="absolute -top-4 left-10 px-4 py-1.5 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl border border-indigo-400/30">
                  AI 診斷結果報告
                </div>
                <div className="flex justify-between items-start mb-8">
                  <div className="flex gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/10"></span>
                  </div>
                  <i className="fas fa-quote-right text-white/5 text-6xl"></i>
                </div>
                <p className="whitespace-pre-wrap text-slate-200 text-lg leading-loose font-medium">
                  {aiAnalysis}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setAiAnalysis(null)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white px-8 py-3.5 rounded-2xl text-xs font-black transition flex items-center gap-3 uppercase tracking-widest"
                >
                  <i className="fas fa-redo"></i> 再次診斷
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Charts section remains same */}
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
    </div>
  );
};

export default MindsetAnalysis;
