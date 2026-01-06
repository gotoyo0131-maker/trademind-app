
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
  const [needsKey, setNeedsKey] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const loadingMessages = [
    "正在讀取交易數據...",
    "AI 正在回顧操作紀律...",
    "正在分析心理標籤...",
    "正在產出診斷報告..."
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setNeedsKey(false);
        getAnalysis(); // 選擇後自動重試
      } catch (e) {
        console.error("Key Selector Error", e);
      }
    } else {
      window.open('https://aistudio.google.com/app/apikey', '_blank');
    }
  };

  const getAnalysis = async () => {
    if (trades.length < 1) return;
    
    setIsLoading(true);
    setErrorMsg('');
    setNeedsKey(false);

    try {
      const result = await analyzeTradeHistory(trades);
      setAnalysis(result);
    } catch (e: any) {
      if (e.message === "AUTH_REQUIRED") {
        setNeedsKey(true);
      } else {
        setErrorMsg(e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <i className="fas fa-robot text-xs"></i>
          </div>
          <span className="font-bold text-xs uppercase tracking-widest text-slate-700">AI 交易導師</span>
        </div>
      </div>
      
      {analysis ? (
        <div className="bg-slate-900 text-white p-6 rounded-2xl text-xs border border-slate-800 shadow-xl animate-in fade-in zoom-in duration-300">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-slate-200 leading-relaxed">{analysis}</p>
          </div>
          <div className="mt-6 flex gap-3 border-t border-slate-800 pt-4">
            <button onClick={getAnalysis} className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-300 transition">
              <i className="fas fa-sync-alt"></i> 重新診斷
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(analysis);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest hover:text-emerald-300 transition"
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i> {copied ? '已複製' : '複製建議'}
            </button>
            <button onClick={() => setAnalysis(null)} className="text-slate-500 font-bold text-[10px] uppercase tracking-widest ml-auto">關閉</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {needsKey ? (
            <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl space-y-4 animate-in slide-in-from-top-2">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <i className="fas fa-lock-open text-xl"></i>
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">需要連結 API 金鑰</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    由於雲端環境限制，請點擊下方按鈕手動連結您的 Google API 金鑰以啟動診斷服務。
                  </p>
                </div>
              </div>
              <button 
                onClick={handleSelectKey}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <i className="fas fa-plug"></i> 立即連結我的 API 金鑰
              </button>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-[10px] uppercase">
                <i className="fas fa-exclamation-triangle"></i> 服務異常
              </div>
              <p className="text-[10px] text-rose-700 font-mono">{errorMsg}</p>
              <button onClick={getAnalysis} className="text-[10px] font-black underline text-rose-600">再試一次</button>
            </div>
          ) : (
            <button 
              onClick={getAnalysis}
              disabled={isLoading || trades.length < 1}
              className={`w-full py-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                isLoading 
                  ? 'bg-slate-900 text-white cursor-wait' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
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
        </div>
      )}
    </div>
  );
};

export default GeminiCoach;
