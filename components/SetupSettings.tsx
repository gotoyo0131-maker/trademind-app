
import React, { useState, useRef } from 'react';
import { Trade } from '../types';

interface SetupSettingsProps {
  options: string[];
  symbolOptions: string[];
  trades: Trade[];
  currentUserId: string;
  onUpdate: (newOptions: string[]) => void;
  onUpdateSymbols: (newSymbols: string[]) => void;
  onResetData: () => void;
  onImportData: (data: { trades: Trade[], setups: string[], symbols: string[] }) => void;
}

const SetupSettings: React.FC<SetupSettingsProps> = ({ 
  options, 
  symbolOptions, 
  trades,
  onUpdate, 
  onUpdateSymbols, 
  onResetData,
  onImportData 
}) => {
  const [newSetup, setNewSetup] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 匯出資料功能
  const handleExport = () => {
    const backupData = {
      trades: trades,
      setups: options,
      symbols: symbolOptions,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TradeMind_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 匯入資料功能
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // 基本結構檢查
        if (json.trades && Array.isArray(json.trades)) {
          if (confirm('匯入備份將會覆蓋目前的本地資料，確定要繼續嗎？')) {
            onImportData({
              trades: json.trades,
              setups: json.setups || options,
              symbols: json.symbols || symbolOptions
            });
            alert('資料匯入成功！');
          }
        } else {
          alert('無效的備份檔案格式。');
        }
      } catch (err) {
        alert('解析檔案失敗，請確保這是正確的 JSON 備份檔。');
      }
    };
    reader.readAsText(file);
    // 清除 input 數值以便下次觸發
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">系統設置</h2>
        <p className="text-slate-500 font-medium">自定義您的交易環境與數據備份</p>
      </header>

      {/* 數據備份與還原 - 新增功能 */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <i className="fas fa-database text-8xl"></i>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-3">
          <i className="fas fa-file-export text-indigo-500"></i> 數據備份與還原
        </h3>
        <p className="text-xs text-slate-400 mb-8">建議定期匯出資料保存於雲端或硬碟，避免瀏覽器快取清除導致遺失。</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleExport}
            className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-3xl transition-all group"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition">
              <i className="fas fa-download text-indigo-600"></i>
            </div>
            <span className="font-bold text-slate-700">匯出完整資料</span>
            <span className="text-[10px] text-slate-400 mt-1">下載為 .json 備份檔</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-3xl transition-all group"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition">
              <i className="fas fa-upload text-emerald-600"></i>
            </div>
            <span className="font-bold text-slate-700">匯入備份資料</span>
            <span className="text-[10px] text-slate-400 mt-1">選取備份檔並恢復</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              className="hidden" 
              accept=".json"
            />
          </button>
        </div>
      </section>

      {/* Setup Options */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
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
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
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

      <section className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100">
        <h3 className="text-lg font-bold text-rose-800 mb-2">危險區域</h3>
        <p className="text-xs text-rose-600 mb-4 font-medium">清空操作不可撤銷，請謹慎執行。</p>
        <button onClick={onResetData} className="bg-rose-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-600/20">清空本地所有資料</button>
      </section>
    </div>
  );
};

export default SetupSettings;
