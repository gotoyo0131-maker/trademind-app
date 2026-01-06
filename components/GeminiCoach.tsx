
import React, { useState } from 'react';
import { Trade } from '../types';
import { analyzeTradeHistory } from '../services/geminiService';

interface GeminiCoachProps {
  trades: Trade[];
}

// 宣告 window.aistudio 的類型以供 TS 使用
// 修復：使用 AIStudio 介面名以符合編譯器預期，並避免與全域定義衝突
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
  }
}

const GeminiCoach: React.FC<GeminiCoachProps> = ({ trades }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const handleKeySelection = async () => {
    try {
      await window.aistudio.openSelectKey();
      setNeedsKey(false);
      setErrorMsg(null);
      // 觸發重新選擇後嘗試再次獲取分析
      getAnalysis();
    } catch (e) {
      console.error("Failed to open key selection:", e);
    }
  };

  const getAnalysis = async () => {
    if (trades.length < 1) return;
    
    setIsLoading(true);
    setErrorMsg(null);
    setNeedsKey(false);

    try {
      // 檢查是否已選擇 API Key (某些環境需要)
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setNeedsKey(true);
          setIsLoading(false);
          return;
        }
      }

      const feedback = await analyzeTradeHistory(trades);
      setAnalysis(feedback);
    } catch (e: any) {
      console.error("Coach Component Error:", e);
      // 如果請求失敗且包含特定錯誤訊息，重置金鑰選擇狀態
      if (e.message === "KEY_NOT_FOUND" || (e.message && e.message.includes("Requested entity was not found"))) {
        setNeedsKey(true);
        setErrorMsg("API Key 無效或未授權該模型，請重新選擇。");
      } else {
        setErrorMsg("分析過程中發生非預期錯誤。請確保您的瀏覽器支持並已正確配置。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white shadow-lg">
          <i className="fas fa-robot text-sm"></i>
        </div>
        <span className="font-bold text-sm tracking-wide uppercase text-slate-700">AI 交易導師</span>
      </div>
      
      {analysis ? (
        <div className="bg-slate-900 text-white p-4 rounded-2xl text-xs leading-relaxed border border-slate-800 shadow-xl animate-in fade-in slide-in-from-top-2">
          <p className="whitespace-pre-wrap text-slate-200">{analysis}</p>
          <div className="mt-4 flex gap-3 border-t border-slate-800 pt-3">
            <button 
              onClick={getAnalysis} 
              disabled={isLoading}
              className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1 transition"
            >
              <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i> 重新診斷
            </button>
            <button 
              onClick={() => setAnalysis(null)} 
              className="text-slate-500 hover:text-slate-400 font-bold uppercase tracking-widest text-[10px] transition"
            >
              關閉
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {needsKey ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3 animate-in fade-in">
              <p className="text-[10px] text-amber-700 font-bold leading-tight">
                <i className="fas fa-exclamation-triangle mr-1"></i> 需要配置 API Key
              </p>
              <p className="text-[10px] text-slate-500">
                為了使用 AI 診斷功能，您需要選擇一個具備權限的付費項目 API Key。
              </p>
              <button 
                onClick={handleKeySelection}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
              >
                選取您的 API Key
              </button>
              <p className="text-[9px] text-slate-400 italic text-center">
                詳情請參考 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">計費說明文檔</a>
              </p>
            </div>
          ) : (
            <button 
              onClick={getAnalysis}
              disabled={isLoading || trades.length < 1}
              className={`w-full py-4 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                isLoading 
                  ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-700 active:scale-95'
              }`}
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> 正在連線分析...</>
              ) : (
                <><i className="fas fa-magic"></i> 啟動 AI 心理診斷</>
              )}
            </button>
          )}
          
          {errorMsg && !needsKey && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
              <p className="text-[10px] text-rose-500 font-medium leading-tight">
                <i className="fas fa-times-circle mr-1"></i> {errorMsg}
              </p>
              <button 
                onClick={getAnalysis}
                className="text-[10px] text-rose-600 underline font-black mt-2"
              >
                重試一次
              </button>
            </div>
          )}

          {trades.length < 1 && !analysis && !isLoading && !needsKey && (
            <p className="text-[10px] text-slate-500 italic px-2 text-center leading-tight">
              記錄交易後，即可開啟 AI 績效建議。
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GeminiCoach;
