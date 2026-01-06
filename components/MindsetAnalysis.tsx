
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

  // 診斷：檢查環境變數是否存在
  useEffect(() => {
    const checkKey = () => {
      // 模擬檢查環境變數 (在客戶端環境中，這通常取決於編譯時注入)
      if (process.env.API_KEY) {
        setApiKeyStatus('detected');
      } else {
        // 如果是本地開發或尚未注入，顯示缺失
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
        setError("錯誤：Vercel 讀不到 API 金鑰。請確認已設定 API_KEY 並『重新部署』專案。");
      } else {
        setError("連線失敗：請檢查您的 API 金鑰是否有效 (是否過期或複製錯誤)。");
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
      {/* AI Trading Coach Section with Connection Status */}
      <section className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 rotate-3">
                <i className="fas fa-robot text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">AI 交易行為導師</h3>
                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Behavioral Analysis AI</p>
              </div>
            </div>

            {/* 狀態燈號 - 讓使用者確認設定是否正確 */}
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
              <span className="text-[10px] font-black uppercase text-slate-400">金鑰狀態:</span>
              {apiKeyStatus === 'checking' && <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400"><i className="fas fa-spinner fa-spin"></i> 偵測中</span>}
              {apiKeyStatus === 'detected' && <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-400"><i className="fas fa-check-circle"></i> 設定正確</span>}
              {apiKeyStatus === 'missing' && <span className="flex items-center gap-2 text-[10px] font-bold text-rose-400"><i className="fas fa-exclamation-triangle"></i> 讀取不到</span>}
            </div>
          </div>

          {!aiAnalysis ? (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm font-medium max-w-xl leading-relaxed">
                導師已準備就緒。我將診斷您最近的交易日誌，分析您的情緒波動與執行偏差。
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"
                >
                  {isAnalyzing ? (
                    <><i className="fas fa-spinner fa-spin"></i> 正在透視數據...</>
                  ) : (
                    <><i className="fas fa-bolt"></i> 開始行為診斷</>
                  )}
                </button>
                {apiKeyStatus === 'missing' && (
                  <p className="text-[10px] text-amber-400/80 italic flex items-center gap-2">
                    <i className="fas fa-info-circle"></i> 提示：若您已在 Vercel 設定 API_KEY，請點擊 "Redeploy" 才會生效。
                  </p>
                )}
              </div>
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                  <p className="text-rose-400 text-xs font-bold"><i className="fas fa-exclamation-triangle mr-2"></i>{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4 shadow-inner">
                <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-3">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">診斷報告書</span>
                  <i className="fas fa-quote-right text-white/10 text-xl"></i>
                </div>
                <p className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed font-medium">
                  {aiAnalysis}
                </p>
              </div>
              <button 
                onClick={() => setAiAnalysis(null)}
                className="text-slate-500 hover:text-white text-xs font-bold transition flex items-center gap-2"
              >
                <i className="fas fa-redo"></i> 再次分析
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Existing Charts Section */}
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
