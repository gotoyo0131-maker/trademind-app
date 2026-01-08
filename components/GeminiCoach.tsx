
import React, { useState, useEffect, useCallback } from 'react';
import { Trade } from '../types';
import { analyzeTradeHistory } from '../services/geminiService';

interface GeminiCoachProps {
  trades: Trade[];
}

const GeminiCoach: React.FC<GeminiCoachProps> = ({ trades }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [status, setStatus] = useState<'IDLE' | 'ERROR'>('IDLE');
  const [errorDetail, setErrorDetail] = useState('');
  const [copied, setCopied] = useState(false);

  const loadingMessages = [
    "正在診斷交易行為...",
    "調閱心理導師數據...",
    "產出改進方案..."
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
      // Fix: Strictly handle generic errors without prohibited API key UI prompts.
      setStatus('ERROR');
      setErrorDetail(e.message || "分析過程中發生未知錯誤。");
    } finally {
      setIsLoading(false);
    }
  }, [trades]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
          <i className="fas fa-robot text-xs"></i>
        </div>
        <span className="font-black text-xs uppercase tracking-widest text-slate-700">AI 交易助手</span>
      </div>
      
      {analysis && !isLoading ? (
        <div className="bg-slate-900 text-white p-6 rounded-2xl text-xs border border-slate-800 shadow-2xl animate-in fade-in zoom-in">
          <div className="prose prose-invert prose-sm max-w-none mb-6">
            <p className="whitespace-pre-wrap text-slate-200 leading-relaxed font-medium">{analysis}</p>
          </div>
          <div className="flex items-center gap-4 border-t border-slate-800 pt-4">
            <button onClick={performAnalysis} className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-300 flex items-center gap-1">
              <i className="fas fa-sync-alt"></i> 重新產出
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
          {status === 'ERROR' ? (
            <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase">
                <i className="fas fa-bug"></i> 執行錯誤
              </div>
              <p className="text-[10px] text-rose-700 font-mono bg-white/50 p-3 rounded-lg break-all">{errorDetail}</p>
              <button onClick={performAnalysis} className="w-full py-3 bg-rose-600 text-white rounded-xl text-xs font-bold transition hover:bg-rose-700 active:scale-95">重試</button>
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
