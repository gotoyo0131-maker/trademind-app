
import React, { useState, useEffect } from 'react';
import { Trade } from '../types';
import { analyzeTradeHistory } from '../services/geminiService';

interface GeminiCoachProps {
  trades: Trade[];
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const GeminiCoach: React.FC<GeminiCoachProps> = ({ trades }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorStatus, setErrorStatus] = useState<'NONE' | 'MISSING_KEY' | 'API_ERROR'>('NONE');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const loadingMessages = [
    "正在讀取交易數據...",
    "AI 正在回顧您的操作紀律...",
    "正在分析情緒與勝率的關聯...",
    "正在為您生成專屬建議...",
    "即將完成，請稍候..."
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleCopy = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualConnect = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        // 選擇後直接重試
        setErrorStatus('NONE');
        getAnalysis();
      } catch (e) {
        console.error("Key selector error:", e);
      }
    } else {
      // 如果不在 AI Studio 環境，跳轉到教學
      window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
    }
  };

  const getAnalysis = async () => {
    if (trades.length < 1) return;
    
    setIsLoading(true);
    setErrorStatus('NONE');
    setErrorMessage('');

    try {
      const result = await analyzeTradeHistory(trades);
      setAnalysis(result);
    } catch (e: any) {
      const msg = e.message || "";
      if (msg === "MISSING_ENV_KEY") {
        setErrorStatus('MISSING_KEY');
      } else {
        setErrorStatus('API_ERROR');
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <i className="fas fa-robot text-sm"></i>
          </div>
          <span className="font-bold text-sm tracking-wide uppercase text-slate-700">AI 交易導師</span>
        </div>
        {analysis && !isLoading && (
          <button 
            onClick={handleCopy}
            className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"
          >
            <i className={`fas ${copied ? 'fa-check text-emerald-500' : 'fa-copy'}`}></i>
            {copied ? '已複製' : '複製建議'}
          </button>
        )}
      </div>
      
      {analysis ? (
        <div className="bg-slate-900 text-white p-6 rounded-2xl text-xs leading-relaxed border border-slate-800 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-slate-200 font-medium">{analysis}</p>
          </div>
          <div className="mt-6 flex gap-3 border-t border-slate-800 pt-4">
            <button onClick={getAnalysis} className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1 hover:text-indigo-300 transition">
              <i className="fas fa-sync-alt"></i> 重新診斷
            </button>
            <button onClick={() => setAnalysis(null)} className="text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-slate-400 transition">關閉</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {errorStatus === 'MISSING_KEY' && (
            <div className="bg-white border-2 border-amber-100 p-6 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
                  <i className="fas fa-key text-xl"></i>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">未偵測到 API 金鑰</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    請至 <b>Vercel Settings -> Environment Variables</b> 新增名為 <code>API_KEY</code> 的變數，然後 <b>Redeploy</b>。
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleManualConnect}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plug"></i> 手動連結 API Key (即刻生效)
                </button>
                <button 
                  onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                  className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold hover:bg-slate-100 transition border border-slate-200"
                >
                  前往 Google AI Studio 獲取金鑰
                </button>
              </div>
            </div>
          )}

          {errorStatus === 'API_ERROR' && (
            <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-600">
                <i className="fas fa-exclamation-circle"></i>
                <span className="text-xs font-black uppercase tracking-wider">診斷系統異常</span>
              </div>
              <p className="text-[11px] text-rose-700 font-mono bg-white/50 p-3 rounded-lg border border-rose-100">
                {errorMessage}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={getAnalysis}
                  className="flex-grow py-3 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
                >
                  重試連線
                </button>
                <button 
                  onClick={handleManualConnect}
                  className="flex-grow py-3 bg-white text-slate-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  更換金鑰
                </button>
              </div>
            </div>
          )}

          {errorStatus === 'NONE' && (
            <button 
              onClick={getAnalysis}
              disabled={isLoading || trades.length < 1}
              className={`w-full py-4 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                isLoading 
                  ? 'bg-slate-900 border border-slate-800 text-white cursor-wait' 
                  : 'bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-700 active:scale-95'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <i className="fas fa-spinner fa-spin text-indigo-400"></i>
                  <span className="animate-pulse">{loadingMessages[loadingStep]}</span>
                </div>
              ) : (
                <><i className="fas fa-magic"></i> 啟動 AI 心理診斷</>
              )}
            </button>
          )}

          {trades.length < 1 && !analysis && !isLoading && (
            <p className="text-[10px] text-slate-400 italic px-2 text-center leading-tight">
              記錄至少一筆交易後，即可開啟 AI 績效建議。
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GeminiCoach;
