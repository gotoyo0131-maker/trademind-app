
import React, { useState } from 'react';
import { Trade } from '../types';

interface SetupSettingsProps {
  options: string[];
  symbolOptions: string[];
  trades: Trade[];
  currentUserId: string;
  onUpdate: (newOptions: string[]) => void;
  onUpdateSymbols: (newSymbols: string[]) => void;
  onResetData: () => void;
  onImportData: (trades: Trade[]) => void;
}

const SetupSettings: React.FC<SetupSettingsProps> = ({ options, symbolOptions, onUpdate, onUpdateSymbols, onResetData }) => {
  const [newSetup, setNewSetup] = useState('');
  const [newSymbol, setNewSymbol] = useState('');

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">系統設置</h2>
        <p className="text-slate-500 font-medium">自定義您的交易環境與數據</p>
      </header>

      {/* Setup Options */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">策略標籤管理 (Setups)</h3>
        <form onSubmit={(e) => { e.preventDefault(); if(newSetup.trim()) { onUpdate([...options, newSetup.trim()]); setNewSetup(''); } }} className="flex gap-2 mb-4">
          <input type="text" value={newSetup} onChange={e => setNewSetup(e.target.value)} placeholder="輸入新策略名稱..." className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
          <button type="submit" className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition">新增</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {options.map(s => (
            <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold flex items-center gap-2 border border-indigo-100">
              {s} <i className="fas fa-times cursor-pointer hover:text-rose-500" onClick={() => onUpdate(options.filter(x => x !== s))}></i>
            </span>
          ))}
        </div>
      </section>

      {/* Symbol Options */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">交易標的管理 (Symbols)</h3>
        <form onSubmit={(e) => { e.preventDefault(); if(newSymbol.trim()) { onUpdateSymbols([...symbolOptions, newSymbol.trim()]); setNewSymbol(''); } }} className="flex gap-2 mb-4">
          <input type="text" value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder="代號如 AAPL, BTC..." className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" />
          <button type="submit" className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition">新增</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {symbolOptions.map(s => (
            <span key={s} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold flex items-center gap-2 border border-slate-200">
              {s} <i className="fas fa-times cursor-pointer hover:text-rose-500" onClick={() => onUpdateSymbols(symbolOptions.filter(x => x !== s))}></i>
            </span>
          ))}
        </div>
      </section>

      <section className="bg-rose-50 p-8 rounded-2xl border border-rose-100">
        <h3 className="text-lg font-bold text-rose-800 mb-2">危險區域</h3>
        <p className="text-xs text-rose-600 mb-4 font-medium">清空操作不可撤銷，請謹慎執行。</p>
        <button onClick={onResetData} className="bg-rose-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-600/20">清空本地所有資料</button>
      </section>
    </div>
  );
};

export default SetupSettings;
