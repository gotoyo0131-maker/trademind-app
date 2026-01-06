
import React, { useMemo } from 'react';
import { Trade } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';

interface MindsetAnalysisProps {
  trades: Trade[];
}

const MindsetAnalysis: React.FC<MindsetAnalysisProps> = ({ trades }) => {
  const analysis = useMemo(() => {
    if (trades.length === 0) return null;
    
    const emotionMap: Record<string, { pnl: number, count: number }> = {};
    
    trades.forEach(t => {
      // 處理情緒標籤
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
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <i className="fas fa-brain text-4xl opacity-20"></i>
      </div>
      <p className="font-bold text-sm">尚未有足夠的心理數據。請開始記錄包含情緒標籤的交易。</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">心理與行為分析</h2>
        <p className="text-slate-500 font-medium mt-1">透過數據量化您的交易情緒與執行紀律。</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 紀律評分卡 */}
        <div className="bg-indigo-600 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[320px]">
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
            <i className="fas fa-award text-[15rem]"></i>
          </div>
          <div className="relative z-10">
            <p className="text-indigo-200 font-black uppercase tracking-[0.3em] text-[10px] mb-4">平均執行紀律</p>
            <div className="flex items-baseline gap-3 mb-6">
              <h4 className="text-9xl font-black tracking-tighter">
                {(analysis ? analysis.avgExecution * 20 : 0).toFixed(0)}
              </h4>
              <span className="text-3xl font-black text-indigo-300">%</span>
            </div>
            <div className="space-y-4">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000" 
                  style={{ width: `${(analysis?.avgExecution || 0) * 20}%` }}
                ></div>
              </div>
              <p className="text-indigo-100/70 text-xs font-medium leading-relaxed">
                這是根據您在日誌中對每筆交易「執行評分」的加權總計。高於 80% 代表具備優異的知行合一能力。
              </p>
            </div>
          </div>
        </div>

        {/* 情緒統計圖表 */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                情緒標籤 vs 平均盈虧
              </h3>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-400">獲利情緒</span>
              </div>
              <div className="flex items-center gap-1.5 ml-3">
                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-400">虧損情緒</span>
              </div>
            </div>
          </div>
          
          <div className="flex-grow min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis?.emotionData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  fontSize={13} 
                  width={80} 
                  axisLine={false} 
                  tickLine={false} 
                  className="font-black text-slate-700" 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}
                />
                <Bar dataKey="avgPnl" radius={[0, 10, 10, 0]} barSize={24}>
                  {analysis?.emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <p className="text-[10px] text-slate-400 mt-6 font-medium italic text-center">
            * 透過此圖表觀察哪些情緒標籤與您的虧損具有高度相關性，進而優化您的心態。
          </p>
        </div>
      </div>

      {/* 診斷建議提示 */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <i className="fas fa-lightbulb text-amber-400 text-2xl"></i>
        </div>
        <div>
          <h4 className="text-lg font-bold mb-1">如何閱讀此數據？</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            心理分析的目標在於發現您的「負面行為模式」。例如，如果您發現標籤為「焦慮」的交易平均盈虧始終為負值，這代表您在焦慮時的判斷力會大幅下降。下一次當您再次感受到焦慮時，請務必強制離場或停止交易。
          </p>
        </div>
      </div>
    </div>
  );
};

export default MindsetAnalysis;
