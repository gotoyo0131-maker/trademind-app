
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
              <div className="flex justify-between items-center text-indigo-100/70 text-[10px] font-black uppercase tracking-widest">
                <span>新手區</span>
                <span>職業級</span>
              </div>
            </div>
          </div>
        </div>

        {/* 情緒統計圖表 */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                情緒標籤 vs 平均盈虧 (心理回報比)
              </h3>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-400">優勢情緒</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-400">負面黑洞</span>
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
        </div>
      </div>

      {/* 診斷建議提示 - 全新結構化版本 */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <i className="fas fa-stethoscope text-[10rem]"></i>
        </div>
        
        <div className="relative z-10 space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="fas fa-microscope text-xl"></i>
            </div>
            <div>
              <h4 className="text-2xl font-black tracking-tight">如何解讀這份診斷報告？</h4>
              <p className="text-slate-400 text-sm font-medium">數據不會騙人，它能揭露您大腦中的交易短路。</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black">01</span>
                <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">定位「虧損黑洞」</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                觀察右方圖表中<b>紅色長度最長</b>的標籤。如果「焦慮」的紅條過長，代表該情緒會直接導致您的判斷力失效，這是您最致命的<b>「行為黑洞」</b>。
              </p>
            </div>

            <div className="space-y-4 border-l border-white/10 pl-8">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black">02</span>
                <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">尋找「獲利地圖」</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <b>綠色標籤</b>代表您在該心理狀態下能發揮最高水準。試著在下次交易前，刻意營造或回歸到這些穩定的情緒環境中。
              </p>
            </div>

            <div className="space-y-4 border-l border-white/10 pl-8">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black">03</span>
                <span className="text-sm font-black text-amber-400 uppercase tracking-widest">紀律分水嶺</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                左方的紀律百分比若<b>低於 70%</b>，代表您正處於「亂打」狀態。獲利可能是運氣，虧損則是必然。建議暫停實盤交易，回歸模擬檢討。
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <i className="fas fa-info-circle text-indigo-400"></i>
              <span className="text-xs font-bold text-slate-400 italic">💡 專業建議：針對紅條最長的情緒，建立「熔斷機制」——只要感覺到了，立刻關掉電腦。</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindsetAnalysis;
