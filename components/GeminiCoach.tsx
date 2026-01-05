
import React, { useState } from 'react';
import { Trade } from '../types';
import { analyzeTradeHistory } from '../services/geminiService';

interface GeminiCoachProps {
  trades: Trade[];
}

const GeminiCoach: React.FC<GeminiCoachProps> = ({ trades }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getAnalysis = async () => {
    setIsLoading(true);
    const feedback = await analyzeTradeHistory(trades);
    setAnalysis(feedback);
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white shadow-lg">
          <i className="fas fa-robot text-sm"></i>
        </div>
        <span className="font-bold text-sm tracking-wide uppercase">AI 交易導師</span>
      </div>
      
      {analysis ? (
        <div className="bg-slate-800/50 p-4 rounded-xl text-xs leading-relaxed text-slate-300 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <p className="whitespace-pre-wrap">{analysis}</p>
          <button 
            onClick={() => setAnalysis(null)} 
            className="mt-4 text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1"
          >
            <i className="fas fa-sync-alt"></i> 重新分析
          </button>
        </div>
      ) : (
        <button 
          onClick={getAnalysis}
          disabled={isLoading || trades.length < 1}
          className="w-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 py-3 px-4 rounded-xl text-xs font-bold hover:bg-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> 正在分析數據...
            </>
          ) : (
            <>
              <i className="fas fa-magic"></i> 診斷交易心理
            </>
          )}
        </button>
      )}
      
      {trades.length < 1 && !analysis && !isLoading && (
        <p className="text-[10px] text-slate-500 italic px-2 text-center">
          新增至少一筆交易紀錄，即可啟用 AI 導師建議。
        </p>
      )}
    </div>
  );
};

export default GeminiCoach;
