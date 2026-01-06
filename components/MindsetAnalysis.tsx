
import React, { useMemo, useState } from 'react';
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

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeTradeHistory(trades);
      setAiAnalysis(result);
    } catch (e: any) {
      console.error("Analysis Error:", e);
      if (e.message === "API_KEY_MISSING") {
        setError("讀取不到 API 金鑰。請確認已在 Netlify 設定變數並完成部署。");
      } else if (e.message === "API_KEY_INVALID") {
        setError("API 金鑰無效或不支援此模型。請確認金鑰權限。");
      } else {
        setError(`分析失敗: ${e.message || "未知錯誤"}`);
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
      <p className="font-bold">尚無心理數據。請開始記錄包含情緒標籤的交易。</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <section className="bg-[#0b1120] rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[160px] -mr-96 -mt-96"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-14">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl border border-indigo-400/20">
                <i className="fas fa-robot text-white text-4xl"></i>
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight">AI 交易行為導師</h3>
                <p className="text-indigo-300/60 text-[10px] font-bold uppercase tracking-[0.5em] mt-2">Intelligence Engine v3.5</p>
              </div>
            </div>
          </div>

          {!aiAnalysis ? (
            <div className="space-y-10">
              <div className="max-w-3xl">
                <p className="text-slate-100 text-3xl font-bold leading-tight mb-6">
                  「診斷交易靈魂，尋找獲利缺口。」
                </p>
                <p className="text-slate-400 text-lg font-medium border-l-2 border-indigo-600 pl-4">
                  我將掃描您的交易行為，提供犀利的行為校正建議。
                </p>
              </div>
              
              <div className="flex flex-col gap-6">
                <button 
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-[2rem] font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-4 w-fit"
                >
                  {isAnalyzing ? (
                    <><i className="fas fa-spinner fa-spin"></i> 分析中...</>
                  ) : (
                    <><i className="fas fa-bolt text-amber-400"></i> 開始 AI 診斷分析</>
                  )}
                </button>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl max-w-xl animate-in slide-in-from-left-4">
                    <p className="text-rose-400 text-sm font-bold flex items-center gap-3">
                      <i className="fas fa-exclamation-circle"></i> {error}
                    </p>
                    <p className="text-rose-400/60 text-[10px] mt-2 leading-relaxed">
                      提示：如果您剛在 Netlify 設定好環境變數，請務必點擊 "Deploys" -> "Trigger deploy" -> "Deploy site" 重新發布，設定才會生效。
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="bg-[#1e293b]/50 border border-white/10 rounded-[2.5rem] p-10 mb-8 shadow-2xl backdrop-blur-2xl">
                <p className="whitespace-pre-wrap text-slate-100 text-xl leading-relaxed font-medium">
                  {aiAnalysis}
                </p>
              </div>
              <button 
                onClick={() => setAiAnalysis(null)}
                className="text-slate-400 hover:text-white px-8 py-3 rounded-xl border border-white/10 text-xs font-bold transition flex items-center gap-3"
              >
                <i className="fas fa-sync-alt"></i> 重啟分析
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-3">
            情緒與盈虧分析
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis?.emotionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" fontSize={14} width={100} axisLine={false} tickLine={false} className="font-bold text-slate-700" />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '15px', border: 'none' }} />
                <Bar dataKey="avgPnl" radius={[0, 10, 10, 0]}>
                  {analysis?.emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-indigo-900 text-white p-10 rounded-[2.5rem] flex flex-col justify-center shadow-2xl relative overflow-hidden">
           <i className="fas fa-award absolute -right-4 -bottom-4 text-9xl opacity-5"></i>
           <p className="text-indigo-300 font-black uppercase text-[10px] mb-4">執行紀律評分</p>
           <div className="flex items-baseline gap-2 mb-4">
             <h4 className="text-7xl font-black">{(analysis ? analysis.avgExecution * 20 : 0).toFixed(0)}</h4>
             <span className="text-2xl font-black text-indigo-400">%</span>
           </div>
           <p className="text-indigo-100/60 text-xs font-medium">這是基於您的執行評分所計算出的紀律水平。</p>
        </div>
      </div>
    </div>
  );
};

export default MindsetAnalysis;
