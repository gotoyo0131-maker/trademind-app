
import React, { useState } from 'react';
import { Trade } from '../types';
import { analyzeTradeHistory } from '../services/geminiService';

interface GeminiCoachProps {
  trades: Trade[];
}

const GeminiCoach: React.FC<GeminiCoachProps> = ({ trades }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const feedback = await analyzeTradeHistory(trades);
      setAnalysis(feedback);
    } catch (e: any) {
      console.error("Coach Component Error:", e);
      setErrorMsg("分析過程中發生非預期錯誤。");
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
        <span className="font-bold text-sm tracking-wide uppercase text-slate-200">AI 交易導師</span>
      </div>
      
      {analysis ? (
        <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl text-xs leading-relaxed text-slate-200 border border-slate-700/50 shadow-xl animate-in fade-in slide-in-from-top-2">
          <p className="whitespace-pre-wrap">{analysis}</p>
          <div className="mt-4 flex gap-3 border-t border-slate-700/50 pt-3">
            <button 
              onClick={getAnalysis} 
              disabled={isLoading}
              className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1 transition"
            >
              <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i> 重新分析
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
        <div className="space-y-2">
          <button 
            onClick={getAnalysis}
            disabled={isLoading || trades.length < 1}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
              isLoading 
                ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> 正在診斷交易心理...
              </>
            ) : (
              <>
                <i className="fas fa-magic"></i> 啟動心理診斷
              </>
            )}
          </button>
          
          {errorMsg && (
            <p className="text-[10px] text-rose-400 font-medium px-2">{errorMsg}</p>
          )}

          {trades.length < 1 && !analysis && !isLoading && (
            <p className="text-[10px] text-slate-500 italic px-2 text-center leading-tight">
              記錄至少一筆交易，<br/>即可開啟 AI 專屬績效與心理建議。
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GeminiCoach;
