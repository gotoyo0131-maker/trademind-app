
import React, { useState, useEffect, useCallback } from 'react';
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
  const [status, setStatus] = useState<'IDLE' | 'NEED_KEY' | 'ERROR'>('IDLE');
  const [errorDetail, setErrorDetail] = useState('');
  const [copied, setCopied] = useState(false);

  const loadingMessages = [
    "正在讀取交易紀錄...",
    "分析心理標籤...",
    "產出導師建議..."
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

  const performAnalysis = useCallback(async () => {
    if (trades.length < 1) return;
    
    setIsLoading(true);
    setStatus('IDLE');
    setErrorDetail('');

    try {
      const result = await analyzeTradeHistory(trades);
      setAnalysis(result);
    } catch (e: any) {
      const msg = e.message || "";
      if (msg === "API_KEY_MISSING" || msg === "ENTITY_NOT_FOUND") {
        setStatus('NEED_KEY');
        if (msg === "ENTITY_NOT_FOUND") {
          setErrorDetail("目前的金鑰不支援此模型（Gemini 3）。請點擊下方按鈕，選擇一個『已啟用付費(Paid)』或正確權限的 Google 專案金鑰。");
        }
      } else {
        setStatus('ERROR');
        setErrorDetail(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [trades]);

  const handleLinkKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // 規範：觸發 openSelectKey 後應假設成功並直接嘗試下一步
        setStatus('IDLE');
        performAnalysis();
      } catch (e) {
        console.error("Key selection UI failed", e);
      }
    } else {
      window.open('https://aistudio.google.com/app/apikey', '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
          <i className="fas fa-robot text-xs"></i>
        </div>
        <span className="font-black text-xs uppercase tracking-widest text-slate-700">AI 交易導師</span>
      </div>
      
      {analysis && !isLoading ? (
        <div className="bg-slate-900 text-white p-6 rounded-2xl text-xs border border-slate-800 shadow-2xl animate-in fade-in zoom-in">
          <div className="prose prose-invert prose-sm max-w-none mb-6">
            <p className="whitespace-pre-wrap text-slate-200 leading-relaxed font-medium">{analysis}</p>
          </div>
          <div className="flex items-center gap-4 border-t border-slate-800 pt-4">
            <button onClick={performAnalysis} className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-300 flex items-center gap-1">
              <i className="fas fa-sync-alt"></i> 重新分析
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(analysis || "");
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }} 
              className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest hover:text-emerald-300 flex items-center gap-1"
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i> {copied ? '已複製' : '複製建議'}
            </button>
            <button onClick={() => setAnalysis(null)} className="ml-auto text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-slate-400">關閉</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {status === 'NEED_KEY' ? (
            <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-xl animate-in slide-in-from-top-2">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <i className="fas fa-key text-xl"></i>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800">連結 API 金鑰</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {errorDetail || "目前系統無法讀取到有效的 API 金鑰。請點擊按鈕從您的 Google 帳號中選取一組金鑰。"}
                  </p>
                  <p className="text-[10px] text-indigo-500 font-bold mt-2">
                    <i className="fas fa-info-circle mr-1"></i> 請確保選擇的專案已開啟 Billing (付費) 功能。
                  </p>
                </div>
              </div>
              <button 
                onClick={handleLinkKey}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <i className="fas fa-plug"></i> 立即連結我的 Google API Key
              </button>
            </div>
          ) : status === 'ERROR' ? (
            <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase">
                <i className="fas fa-exclamation-triangle"></i> 服務異常
              </div>
              <p className="text-[10px] text-rose-700 font-mono bg-white/50 p-3 rounded-lg">{errorDetail}</p>
              <div className="flex gap-2">
                <button onClick={performAnalysis} className="flex-grow py-3 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition">重試</button>
                <button onClick={handleLinkKey} className="px-4 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl text-xs font-bold">更換金鑰</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={performAnalysis}
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
