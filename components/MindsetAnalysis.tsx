
import React, { useMemo } from 'react';
import { Trade } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, ScatterChart, Scatter, ZAxis
} from 'recharts';

interface MindsetAnalysisProps {
  trades: Trade[];
}

const MindsetAnalysis: React.FC<MindsetAnalysisProps> = ({ trades }) => {
  const analysis = useMemo(() => {
    if (trades.length === 0) return null;

    // 情緒盈虧關聯
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

    // 執行力 vs 盈虧
    const scatterData = trades.map(t => ({
      execution: t.executionRating,
      pnl: t.pnlAmount,
      symbol: t.symbol
    }));

    // 平均執行力星等
    const avgExecution = trades.reduce((acc, t) => acc + t.executionRating, 0) / trades.length;

    return { emotionData, scatterData, avgExecution };
  }, [trades]);

  if (!analysis) return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <i className="fas fa-brain text-6xl mb-4 opacity-20"></i>
      <p className="font-bold">尚無心理數據。請開始記錄包含情緒標籤的交易。</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <i className="fas fa-theater-masks text-indigo-500"></i> 情緒標籤與平均盈虧關聯
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.emotionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" fontSize={12} width={80} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="avgPnl" radius={[0, 4, 4, 0]}>
                  {analysis.emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgPnl >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-[10px] text-slate-400 italic">當此圖出現極端的負向長條時，代表該情緒是你交易的「死亡陷阱」。</p>
        </div>

        <div className="bg-indigo-900 text-white p-8 rounded-3xl flex flex-col justify-center relative overflow-hidden shadow-2xl">
           <i className="fas fa-award absolute -right-4 -bottom-4 text-9xl opacity-10 rotate-12"></i>
           <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs mb-2">平均執行紀律指數</p>
           <h4 className="text-6xl font-black mb-4">{(analysis.avgExecution * 20).toFixed(1)}<span className="text-2xl">%</span></h4>
           <p className="text-indigo-100/70 text-sm leading-relaxed">
             這反映了你「知行合一」的程度。專業交易者的指數通常穩定在 85% 以上。
           </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
          <i className="fas fa-dot-circle text-indigo-500"></i> 執行紀律與獲利分佈散點圖
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" dataKey="execution" name="執行星等" unit="星" domain={[1, 5]} ticks={[1,2,3,4,5]} axisLine={false} tickLine={false} />
              <YAxis type="number" dataKey="pnl" name="盈虧" unit="$" axisLine={false} tickLine={false} />
              <ZAxis type="number" range={[100, 500]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="交易" data={analysis.scatterData}>
                {analysis.scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} opacity={0.6} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 leading-relaxed">
           <strong>解讀技巧：</strong> 如果大部分的高獲利（綠點）都集中在 4-5 星，代表你的策略與系統是穩定可靠的。如果 1-2 星也能賺錢，那只是運氣，且伴隨著巨大的風險。
        </div>
      </div>
    </div>
  );
};

export default MindsetAnalysis;
