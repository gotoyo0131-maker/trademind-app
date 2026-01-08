
import React, { useState } from 'react';
import { Trade, User } from '../types';

interface SetupSettingsProps {
  options: string[];
  symbolOptions: string[];
  trades: Trade[];
  currentUser: User;
  onUpdate: (newOptions: string[]) => void;
  onUpdateSymbols: (newSymbols: string[]) => void;
  onUpdateUser: (updatedUser: User) => void;
  onResetData: () => void;
  onImportData: (state: any) => void;
}

const SetupSettings: React.FC<SetupSettingsProps> = ({ 
  options, 
  symbolOptions, 
  trades,
  currentUser,
  onUpdate, 
  onUpdateSymbols, 
  onUpdateUser,
  onImportData
}) => {
  const [newSetup, setNewSetup] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [balanceEnabled, setBalanceEnabled] = useState(currentUser.useInitialBalance || false);
  const [tempBalance, setTempBalance] = useState(currentUser.initialBalance?.toString() || '0');
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  const handleUpdateBalance = async () => {
    setIsSavingBalance(true);
    try {
      await onUpdateUser({
        ...currentUser,
        useInitialBalance: balanceEnabled,
        initialBalance: parseFloat(tempBalance) || 0
      });
      // 小技巧：直接透過 prop 同步 local 狀態，以防 App.tsx 更新延遲
      // 這裡依賴 App.tsx 正確處理 mappedUpdate
      alert(balanceEnabled ? '資金設定已啟動' : '資金管理已關閉');
    } catch (err) {
      alert('同步失敗，請稍後再試');
    } finally {
      setIsSavingBalance(false);
    }
  };

  const handleExport = () => {
    const data = {
      trades,
      setups: options,
      symbols: symbolOptions,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trademind_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        onImportData(data);
      } catch (err) {
        alert('無效的備份檔案格式，請確認選擇的是 .json 檔案。');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">系統設置</h2>
        <p className="text-slate-500 font-medium">個人化您的交易環境與數據管理</p>
      </header>

      {/* 帳戶資金配置 */}
      <section className={`p-8 rounded-[2.5rem] bg-white border-2 transition-all shadow-xl ${balanceEnabled ? 'border-indigo-500' : 'border-slate-100'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
            <i className="fas fa-wallet text-indigo-500"></i> 帳戶資金配置
          </h3>
          {isSavingBalance && <div className="text-[10px] font-black text-indigo-500 animate-pulse uppercase tracking-widest">正在同步雲端...</div>}
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <span className="text-sm font-bold text-slate-700">啟用資金管理 (顯示複利曲線)</span>
            <button 
              onClick={() => setBalanceEnabled(!balanceEnabled)} 
              className={`w-12 h-6 rounded-full transition-colors relative ${balanceEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${balanceEnabled ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className={`relative transition-opacity ${balanceEnabled ? 'opacity-100' : 'opacity-30 grayscale'}`}>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-500">$</span>
              <input 
                type="number" 
                disabled={!balanceEnabled}
                value={tempBalance} 
                onChange={e => setTempBalance(e.target.value)} 
                className="w-full border-2 rounded-2xl py-4 pl-10 pr-4 outline-none font-black text-lg bg-white border-indigo-100 focus:border-indigo-500" 
              />
            </div>
            <button 
              onClick={handleUpdateBalance} 
              disabled={isSavingBalance}
              className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all active:scale-[0.98] ${isSavingBalance ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'}`}
            >
              {isSavingBalance ? <i className="fas fa-circle-notch fa-spin"></i> : '確認並儲存變更'}
            </button>
          </div>
        </div>
      </section>

      {/* 交易標的管理 (Symbols) */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
          <i className="fas fa-tags text-indigo-500"></i> 交易標的管理 (Symbols)
        </h3>
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            if(newSymbol.trim()) { 
              onUpdateSymbols([...symbolOptions, newSymbol.trim().toUpperCase()]); 
              setNewSymbol(''); 
            } 
          }} 
          className="flex gap-4 mb-6"
        >
          <input 
            type="text" 
            value={newSymbol} 
            onChange={e => setNewSymbol(e.target.value)} 
            placeholder="代號如 AAPL, BTC..." 
            className="flex-grow p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold focus:border-indigo-500 transition-all" 
          />
          <button type="submit" className="bg-indigo-600 text-white px-8 rounded-2xl font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition">新增</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {symbolOptions.map(s => (
            <span key={s} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-black flex items-center gap-2 border border-slate-200 group">
              {s} <i className="fas fa-times cursor-pointer text-slate-300 group-hover:text-rose-500" onClick={() => onUpdateSymbols(symbolOptions.filter(x => x !== s))}></i>
            </span>
          ))}
        </div>
      </section>

      {/* 進場策略 (Setups) */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
        <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
          <i className="fas fa-scroll text-indigo-500"></i> 進場策略管理 (Setups)
        </h3>
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            if(newSetup.trim()) { 
              onUpdate([...options, newSetup.trim()]); 
              setNewSetup(''); 
            } 
          }} 
          className="flex gap-4 mb-6"
        >
          <input 
            type="text" 
            value={newSetup} 
            onChange={e => setNewSetup(e.target.value)} 
            placeholder="新策略名稱..." 
            className="flex-grow p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold focus:border-indigo-500 transition-all" 
          />
          <button type="submit" className="bg-indigo-600 text-white px-8 rounded-2xl font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition">新增</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {options.map(s => (
            <span key={s} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black flex items-center gap-2 border border-indigo-100 group">
              {s} <i className="fas fa-times cursor-pointer text-indigo-300 group-hover:text-rose-500" onClick={() => onUpdate(options.filter(x => x !== s))}></i>
            </span>
          ))}
        </div>
      </section>

      {/* 數據備份與還原 */}
      <section className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <i className="fas fa-file-export text-xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">數據備份與還原</h3>
            <p className="text-slate-400 text-xs font-medium mt-1">建議定期匯出資料保存於雲端或硬碟，避免瀏覽器快取清除導致遺失。</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <button 
            onClick={handleExport}
            className="group p-8 rounded-[2rem] border-2 border-slate-50 bg-slate-50/30 hover:bg-white hover:border-indigo-500 transition-all text-center flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <i className="fas fa-download text-xl"></i>
            </div>
            <div>
              <p className="font-black text-slate-800">匯出完整資料</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">下載為 .json 備份檔</p>
            </div>
          </button>

          <div className="relative group">
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileImport} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
            />
            <div className="p-8 rounded-[2rem] border-2 border-slate-50 bg-slate-50/30 group-hover:bg-white group-hover:border-emerald-500 transition-all text-center flex flex-col items-center gap-4 h-full">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <i className="fas fa-upload text-xl"></i>
              </div>
              <div>
                <p className="font-black text-slate-800">匯入備份資料</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">選取備份檔並恢復</p>
              </div>
            </div>
          </div>
        </div>

        {/* 背景裝飾 */}
        <div className="absolute top-[-20%] right-[-10%] opacity-[0.03] pointer-events-none">
          <i className="fas fa-database text-[20rem]"></i>
        </div>
      </section>
    </div>
  );
};

export default SetupSettings;
