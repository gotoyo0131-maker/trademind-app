
import React, { useState, useEffect, useMemo } from 'react';
import { Trade, User } from './types';
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import LogList from './components/LogList';
import MindsetAnalysis from './components/MindsetAnalysis';
import GeminiCoach from './components/GeminiCoach';
import SetupSettings from './components/SetupSettings';
import Auth from './components/Auth';
import UserManagement from './components/UserManagement';
import { INITIAL_SETUP_OPTIONS, INITIAL_SYMBOL_OPTIONS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<'dashboard' | 'logs' | 'add' | 'settings' | 'mindset' | 'users'>('dashboard');
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [setupOptions, setSetupOptions] = useState<string[]>([]);
  const [symbolOptions, setSymbolOptions] = useState<string[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [logFilter, setLogFilter] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 初始化資料
  useEffect(() => {
    const savedSession = localStorage.getItem('trademind_session');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));

    const savedUsers = localStorage.getItem('trademind_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const defaultAdmin: User = { id: 'admin-1', username: 'admin', password: '123', role: 'admin', createdAt: new Date().toISOString() };
      setUsers([defaultAdmin]);
      localStorage.setItem('trademind_users', JSON.stringify([defaultAdmin]));
    }

    const savedTrades = localStorage.getItem('trademind_all_trades');
    if (savedTrades) setAllTrades(JSON.parse(savedTrades));

    const savedSetups = localStorage.getItem('trademind_setups');
    setSetupOptions(savedSetups ? JSON.parse(savedSetups) : INITIAL_SETUP_OPTIONS);

    const savedSymbols = localStorage.getItem('trademind_symbols');
    setSymbolOptions(savedSymbols ? JSON.parse(savedSymbols) : INITIAL_SYMBOL_OPTIONS);
  }, []);

  // 當交易數據變動時保存
  useEffect(() => {
    localStorage.setItem('trademind_all_trades', JSON.stringify(allTrades));
  }, [allTrades]);

  // 當用戶清單變動時保存
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('trademind_users', JSON.stringify(users));
    }
  }, [users]);

  // 當選項變動時保存
  useEffect(() => {
    localStorage.setItem('trademind_setups', JSON.stringify(setupOptions));
  }, [setupOptions]);

  useEffect(() => {
    localStorage.setItem('trademind_symbols', JSON.stringify(symbolOptions));
  }, [symbolOptions]);

  // 過濾當前用戶的交易
  const userTrades = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return allTrades;
    return allTrades.filter(t => t.userId === currentUser.id);
  }, [allTrades, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('trademind_session');
    setCurrentUser(null);
    setView('dashboard');
  };

  const handleSaveTrade = (trade: Trade) => {
    if (!currentUser) return;
    const tradeWithUser = { ...trade, userId: currentUser.id };
    
    if (editingTrade) {
      setAllTrades(prev => prev.map(t => t.id === trade.id ? tradeWithUser : t));
      setEditingTrade(null);
    } else {
      setAllTrades(prev => [tradeWithUser, ...prev]);
    }
    setView('logs');
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      alert('無法刪除目前登錄中的管理員帳號！');
      return;
    }
    if (confirm('確定要刪除此用戶及其所有相關交易數據嗎？此操作無法還原。')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setAllTrades(prev => prev.filter(t => t.userId !== userId));
    }
  };

  if (!currentUser) {
    return <Auth onLogin={setCurrentUser} />;
  }

  const navItems = [
    { id: 'dashboard', label: '績效看板', icon: 'fa-th-large', roles: ['admin', 'user'] },
    { id: 'mindset', label: '心理分析', icon: 'fa-brain', roles: ['admin', 'user'] },
    { id: 'logs', label: '交易日誌', icon: 'fa-list', roles: ['admin', 'user'] },
    { id: 'add', label: '記錄交易', icon: 'fa-plus-circle', roles: ['user'] },
    { id: 'users', label: '用戶管理', icon: 'fa-users-cog', roles: ['admin'] },
    { id: 'settings', label: '系統設置', icon: 'fa-cog', roles: ['admin', 'user'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* 移動端 Header */}
      <header className="md:hidden bg-slate-900 text-white p-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <i className="fas fa-chart-line text-indigo-400"></i>
          <h1 className="text-lg font-bold">TradeMind</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </header>

      {/* 側邊導航 */}
      <nav className={`fixed md:relative inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white p-6 flex flex-col shrink-0 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="hidden md:flex items-center gap-3 mb-10">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <i className="fas fa-chart-line text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight">TradeMind PRO</h1>
        </div>

        <div className="mb-8 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{currentUser.username}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <i className={`fas ${currentUser.role === 'admin' ? 'fa-shield-alt text-amber-500' : 'fa-user text-indigo-400'}`}></i>
                {currentUser.role}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full mt-4 py-2 text-[10px] font-bold text-slate-500 hover:text-rose-400 border-t border-slate-700 pt-3 flex items-center justify-center gap-2 transition">
            <i className="fas fa-sign-out-alt"></i> 登出帳號
          </button>
        </div>

        <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
          {filteredNav.map(item => (
            <button 
              key={item.id}
              onClick={() => { setView(item.id as any); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all ${view === item.id ? 'bg-indigo-600 font-bold shadow-lg shadow-indigo-600/20 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
            >
              <i className={`fas ${item.icon} w-5 text-center`}></i> {item.label}
            </button>
          ))}
          
          <div className="mt-8 pt-6 border-t border-slate-800">
            <GeminiCoach trades={userTrades} />
          </div>
        </div>
      </nav>

      <main className="flex-grow p-4 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && <Dashboard trades={userTrades} onViewLogs={() => setView('logs')} onDateClick={(d) => { setLogFilter(d); setView('logs'); }} />}
          {view === 'mindset' && <MindsetAnalysis trades={userTrades} />}
          {view === 'users' && currentUser.role === 'admin' && (
            <UserManagement 
              users={users} 
              trades={allTrades} 
              onAddUser={handleAddUser} 
              onDeleteUser={handleDeleteUser}
              currentUserId={currentUser.id}
            />
          )}
          {view === 'logs' && <LogList trades={userTrades} onDelete={(id) => setAllTrades(prev => prev.filter(t => t.id !== id))} onEdit={(t) => { setEditingTrade(t); setView('add'); }} onAddNew={() => { setEditingTrade(null); setView('add'); }} initialFilter={logFilter} />}
          {view === 'add' && <LogForm onSave={handleSaveTrade} onCancel={() => setView('logs')} initialData={editingTrade} setupOptions={setupOptions} symbolOptions={symbolOptions} />}
          {view === 'settings' && (
            <SetupSettings 
              options={setupOptions} 
              symbolOptions={symbolOptions}
              trades={userTrades} 
              currentUserId={currentUser.id}
              onUpdate={setSetupOptions} 
              onUpdateSymbols={setSymbolOptions}
              onResetData={() => setAllTrades([])} 
              onImportData={(trades, setups) => { setAllTrades(trades); setSetupOptions(setups); }} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
