
import React, { useState, useRef, useEffect } from 'react';
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
  onImportData: (data: { trades: Trade[], setups: string[], symbols: string[] }) => void;
}

const SetupSettings: React.FC<SetupSettingsProps> = ({ 
  options, 
  symbolOptions, 
  trades,
  currentUser,
  onUpdate, 
  onUpdateSymbols, 
  onUpdateUser,
  onResetData,
  onImportData 
}) => {
  const [newSetup, setNewSetup] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [balanceEnabled, setBalanceEnabled] = useState(currentUser.useInitialBalance || false);
  const [tempBalance, setTempBalance] = useState(currentUser.initialBalance?.toString() || '0');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    setBalanceEnabled(currentUser.useInitialBalance || false);
    setTempBalance(currentUser.initialBalance?.toString() || '0');
  }, [currentUser]);

  const handleUpdateBalance = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      const updatedBalance = parseFloat(tempBalance) || 0;
      onUpdateUser({
        ...currentUser,
        useInitialBalance: balanceEnabled,
        initialBalance: updatedBalance
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleExport = () => {
    const backupData = {
      trades: trades,
      setups: options,
      symbols: symbolOptions,
      exportDate: new Date().toISOString(),
      version: "1.1"
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Journal_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.trades && Array.isArray(json.trades)) {
          if (confirm('匯入備份將會覆蓋目前的本地資料，確定要繼續嗎？')) {
            onImportData({ trades: json.trades, setups: json.setups || options, symbols: json.symbols || symbolOptions });
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">系統設置</h2>
        <p className="text-slate-500 font-medium">自定義您的交易環境、初始資金與數據備份</p>
      </header>

      <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 relative z-10">
          <i className="fas fa-lightbulb text-amber-300 text-3xl"></i>
        </div>
        <div className="relative z-10 text-center md:text-left">
          <h4 className="text-lg font-black mb-1">功能小撇步：資產管理模式</h4>
          <p className="text-indigo-100 text-xs leading-relaxed">
            開啟「帳戶資金配置」後，系統將解鎖<b>「資產淨值橫幅 (Equity Banner)」</b>。您可以即時看到帳戶總回報率(%)與成長趨勢，掌握長線複利效果。
          </p>
        </div>
      </div>

      {/* 帳戶資金設置 - 新配色 */}
      <section className={`p-8 rounded-[2.5rem] bg-white border-2 transition-all duration-500 relative overflow-hidden shadow-xl ${balanceEnabled ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200'}`}>
        {balanceEnabled && (
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
        )}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`text-lg font-black flex items-center gap-3 ${balanceEnabled ? 'text-indigo-900' : 'text-slate-800'}`}>
              <i className={`fas fa-wallet ${balanceEnabled ? 'text-indigo-500' : 'text-indigo-300'}`}></i> 帳戶資金配置
            </h3>
            <span className={`text-[8px] font-black px-2 py-0.5 rounded text-white ${balanceEnabled ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}>PRO</span>
          </div>
          <p className="text-xs text-slate-400 mb-8 font-medium">設置初始本金後，儀表板將顯示即時帳戶總資產與成長率。</p>
          
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all ${balanceEnabled ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
              <div>
                <p className={`text-sm font-bold ${balanceEnabled ? 'text-indigo-900' : 'text-slate-700'}`}>啟用帳戶資金管理</p>
                <p className="text-[10px] text-slate-400 font-medium">切換開關並「更新」以套用儀表板</p>
              </div>
              <button 
                type="button" 
                onClick={() => { setBalanceEnabled(!balanceEnabled); setSaveStatus('idle'); }} 
                className={`w-14 h-7 rounded-full transition-colors relative ${balanceEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${balanceEnabled ? 'left-8' : 'left-1'}`}></div>
              </button>
            </div>

            <div className={`space-y-4 transition-all duration-300 ${balanceEnabled ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">初始本金金額 (Currency)</label>
                <div className="flex gap-3">
                  <div className="relative flex-grow">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black ${balanceEnabled ? 'text-indigo-500' : 'text-slate-400'}`}>$</span>
                    <input 
                      type="number" 
                      value={tempBalance} 
                      onChange={e => { setTempBalance(e.target.value); setSaveStatus('idle'); }} 
                      className={`w-full border-2 rounded-2xl py-4 pl-10 pr-4 outline-none transition-all font-mono text-lg font-black ${balanceEnabled ? 'bg-white border-indigo-200 text-indigo-900 focus:border-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`} 
                      placeholder="例如: 10000" 
                    />
                  </div>
                  <button 
                    type="button" 
                    disabled={saveStatus !== 'idle'} 
                    onClick={handleUpdateBalance} 
                    className={`min-w-[140px] rounded-2xl font-black transition-all shadow-lg active:scale-95 whitespace-nowrap flex items-center justify-center gap-2 ${
                      saveStatus === 'success' 
                        ? 'bg-emerald-500 text-white' 
                        : saveStatus === 'saving'
                        ? 'bg-indigo-400 text-white cursor-wait' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                    }`}
                  >
                    {saveStatus === 'saving' && <i className="fas fa-circle-notch fa-spin"></i>}
                    {saveStatus === 'success' && <i className="fas fa-check"></i>}
                    {saveStatus === 'idle' && '更新配置'}
                    {saveStatus === 'saving' && '正在處理'}
                    {saveStatus === 'success' && '已儲存'}
                  </button>
                </div>
              </div>
            </div>

            {!balanceEnabled && (
               <button 
                type="button" 
                disabled={saveStatus !== 'idle'} 
                onClick={handleUpdateBalance} 
                className={`w-full py-4 rounded-2xl font-black transition-all text-xs flex items-center justify-center gap-2 border-2 ${
                  saveStatus === 'success' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                    : 'bg-white border-slate-100 hover:border-slate-300 text-slate-400 hover:text-slate-600'
                }`}
              >
                {saveStatus === 'saving' && <i className="fas fa-circle-notch fa-spin"></i>}
                {saveStatus === 'success' && <i className="fas fa-check text-emerald-500"></i>}
                {saveStatus === 'idle' && '確認儲存目前狀態 (關閉模式)'}
                {saveStatus === 'saving' && '正在儲存...'}
                {saveStatus === 'success' && '設置已關閉'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 數據備份與還原 */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-database text-8xl"></i></div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-3"><i className="fas fa-file-export text-indigo-500"></i> 數據備份與還原</h3>
        <p className="text-xs text-slate-400 mb-8 font-medium">建議定期匯出資料保存於雲端或硬碟，避免瀏覽器快取清除導致遺失。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button type="button" onClick={handleExport} className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-3xl transition-all group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition"><i className="fas fa-download text-indigo-600"></i></div>
            <span className="font-bold text-slate-700">匯出完整資料</span>
            <span className="text-[10px] text-slate-400 mt-1">下載為 .json 備份檔</span>
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-3xl transition-all group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition"><i className="fas fa-upload text-emerald-600"></i></div>
            <span className="font-bold text-slate-700">匯入備份資料</span>
            <span className="text-[10px] text-slate-400 mt-1">選取備份檔並恢復</span>
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
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
        <button type="button" onClick={onResetData} className="bg-rose-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-600/20">清空本地所有資料</button>
      </section>
    </div>
  );
};

export default SetupSettings;
