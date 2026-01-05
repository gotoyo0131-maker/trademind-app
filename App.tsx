
import React, { useState, useEffect } from 'react';
import { Trade } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import LogForm from './components/LogForm.tsx';
import LogList from './components/LogList.tsx';
import MindsetAnalysis from './components/MindsetAnalysis.tsx';
import GeminiCoach from './components/GeminiCoach.tsx';
import SetupSettings from './components/SetupSettings.tsx';
import { INITIAL_SETUP_OPTIONS } from './constants.ts';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'logs' | 'add' | 'settings' | 'mindset'>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [setupOptions, setSetupOptions] = useState<string[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [logFilter, setLogFilter] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTrades = localStorage.getItem('trademind_logs');
    if (savedTrades) {
      setTrades(JSON.parse(savedTrades));
    }

    const savedSetups = localStorage.getItem('trademind_setups');
    if (savedSetups) {
      setSetupOptions(JSON.parse(savedSetups));
    } else {
      setSetupOptions(INITIAL_SETUP_OPTIONS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('trademind_logs', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('trademind_setups', JSON.stringify(setupOptions));
  }, [setupOptions]);

  const handleSaveTrade = (trade: Trade) => {
    if (editingTrade) {
      setTrades(prev => prev.map(t => t.id === trade.id ? trade : t));
      setEditingTrade(null);
    } else {
      setTrades(prev => [trade, ...prev]);
    }
    setView('logs');
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: '績效看板', icon: 'fa-th-large' },
    { id: 'mindset', label: '心理分析', icon: 'fa-brain' },
    { id: 'logs', label: '交易日誌', icon: 'fa-list' },
    { id: 'add', label: '記錄交易', icon: 'fa-plus-circle' },
    { id: 'settings', label: '系統設置', icon: 'fa-cog' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* 行動端標題列 */}
      <header className="md:hidden bg-slate-900 text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <i className="fas fa-chart-line text-indigo-400"></i>
          <h1 className="text-lg font-bold">TradeMind</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </header>

      {/* 側邊導航欄 */}
      <nav className={`fixed md:relative inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white p-6 flex flex-col shrink-0 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="hidden md:flex items-center gap-3 mb-10">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <i className="fas fa-chart-line text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight">TradeMind AI</h1>
        </div>

        <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => { setView(item.id as any); setEditingTrade(null); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all ${view === item.id ? 'bg-indigo-600 font-bold shadow-lg shadow-indigo-600/20' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i> {item.label}
            </button>
          ))}
          
          <div className="mt-8 pt-6 border-t border-slate-800">
            <GeminiCoach trades={trades} />
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800 text-[10px] text-slate-500 text-center">
           數據僅儲存於此裝置 · v1.2.2
        </div>
      </nav>

      {/* 行動端遮罩 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* 主要內容區 */}
      <main className="flex-grow p-4 md:p-10">
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && (
            <Dashboard 
              trades={trades} 
              onViewLogs={() => setView('logs')} 
              onDateClick={(d) => { setLogFilter(d); setView('logs'); }} 
            />
          )}
          
          {view === 'mindset' && <MindsetAnalysis trades={trades} />}

          {view === 'logs' && (
            <LogList 
              trades={trades} 
              onDelete={(id) => setTrades(prev => prev.filter(t => t.id !== id))} 
              onEdit={(t) => { setEditingTrade(t); setView('add'); }}
              onAddNew={() => { setEditingTrade(null); setView('add'); }}
              initialFilter={logFilter}
            />
          )}

          {view === 'add' && (
            <LogForm 
              onSave={handleSaveTrade} 
              onCancel={() => setView('logs')} 
              initialData={editingTrade}
              setupOptions={setupOptions}
            />
          )}

          {view === 'settings' && (
            <SetupSettings 
              options={setupOptions} 
              trades={trades}
              onUpdate={setSetupOptions} 
              onResetData={() => { if(confirm('確定清除所有資料？')) { setTrades([]); localStorage.clear(); setView('dashboard'); } }}
              onImportData={(t, s) => { setTrades(t); setSetupOptions(s); setView('dashboard'); }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
