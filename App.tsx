
import React, { useState, useEffect, useCallback } from 'react';
import { Trade, TradeDirection, ErrorCategory, User } from './types';
import { DEFAULT_SETUPS, DEFAULT_SYMBOLS, EMOTION_TAGS } from './constants';
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import LogList from './components/LogList';
import MindsetAnalysis from './components/MindsetAnalysis';
import SetupSettings from './components/SetupSettings';
import Auth from './components/Auth';
import UserManagement from './components/UserManagement';

type Tab = 'dashboard' | 'logs' | 'add' | 'mindset' | 'settings' | 'users';

const generateSafeId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [setups, setSetups] = useState<string[]>(DEFAULT_SETUPS);
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [logSearchTerm, setLogSearchTerm] = useState('');

  // 初始化：載入 Session 與 使用者列表
  useEffect(() => {
    const savedSession = localStorage.getItem('trademind_session');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));

    const savedUsers = localStorage.getItem('trademind_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const defaultAdmin: User = { 
        id: 'admin-1', 
        username: 'admin', 
        password: '123', 
        role: 'admin', 
        createdAt: new Date().toISOString(),
        isActive: true
      };
      setUsers([defaultAdmin]);
      localStorage.setItem('trademind_users', JSON.stringify([defaultAdmin]));
    }
  }, []);

  // 動態更新瀏覽器標籤標題
  useEffect(() => {
    if (currentUser) {
      document.title = `${currentUser.username} 交易日誌`;
    } else {
      document.title = 'TradeMind Professional';
    }
  }, [currentUser]);

  // 載入交易資料與設置
  useEffect(() => {
    try {
      const savedTrades = localStorage.getItem('trademind_trades');
      if (savedTrades) setTrades(JSON.parse(savedTrades));
      
      const savedSetups = localStorage.getItem('trademind_setups');
      if (savedSetups) setSetups(JSON.parse(savedSetups));
      
      const savedSymbols = localStorage.getItem('trademind_symbols');
      if (savedSymbols) setSymbols(JSON.parse(savedSymbols));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 持久化資料
  useEffect(() => {
    localStorage.setItem('trademind_trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('trademind_setups', JSON.stringify(setups));
  }, [setups]);

  useEffect(() => {
    localStorage.setItem('trademind_symbols', JSON.stringify(symbols));
  }, [symbols]);

  useEffect(() => {
    localStorage.setItem('trademind_users', JSON.stringify(users));
  }, [users]);

  const handleLogout = () => {
    localStorage.removeItem('trademind_session');
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    // 如果修改的是當前登入者，同步更新 Session
    if (currentUser && updatedUser.id === currentUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('trademind_session', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) return alert('不能刪除當前登錄的管理者帳號。');
    
    setUsers(prev => prev.filter(u => u.id !== userId));
    // 同步刪除該用戶的所有交易
    setTrades(prev => prev.filter(t => t.userId !== userId));
  };

  const handleDateClick = (dateStr: string) => {
    setLogSearchTerm(dateStr);
    setActiveTab('logs');
  };

  const NavItem = ({ id, icon, label }: { id: Tab, icon: string, label: string }) => (
    <button onClick={() => { setActiveTab(id); if(id !== 'logs') setLogSearchTerm(''); }} className={`flex flex-col md:flex-row items-center gap-2 p-3 rounded-xl transition-all ${activeTab === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}>
      <i className={`fas ${icon} text-lg md:text-sm`}></i>
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{label}</span>
    </button>
  );

  if (!currentUser) {
    return <Auth onLogin={(u) => setCurrentUser(u)} />;
  }

  // 過濾當前用戶的交易
  const userTrades = trades.filter(t => t.userId === currentUser.id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => { setActiveTab('dashboard'); setLogSearchTerm(''); }}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white rotate-12 shadow-md flex-shrink-0">
            <i className="fas fa-chart-line"></i>
          </div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
            {currentUser.username} 交易日誌
          </h1>
        </div>
        
        <nav className="flex-grow space-y-2">
          <NavItem id="dashboard" icon="fa-th-large" label="績效總覽" />
          <NavItem id="logs" icon="fa-list" label="交易日誌" />
          <NavItem id="add" icon="fa-plus-circle" label="新增交易" />
          <NavItem id="mindset" icon="fa-brain" label="行為心理" />
          {currentUser.role === 'admin' && (
            <NavItem id="users" icon="fa-users-cog" label="帳號管理" />
          )}
          <NavItem id="settings" icon="fa-cog" label="系統設置" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200 uppercase">
              {currentUser.username[0]}
            </div>
            <div className="flex-grow overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">{currentUser.username}</p>
              <p className="text-[10px] text-slate-400 uppercase font-black">{currentUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition font-bold text-xs uppercase tracking-wider">
            <i className="fas fa-sign-out-alt"></i>
            登出系統
          </button>
        </div>
      </aside>

      <main className="flex-grow p-4 md:p-10 max-w-7xl mx-auto w-full mb-16 md:mb-0">
        {activeTab === 'dashboard' && (
          <Dashboard 
            trades={userTrades} 
            onViewLogs={() => { setActiveTab('logs'); setLogSearchTerm(''); }} 
            onDateClick={handleDateClick} 
            onAddFirstTrade={() => setActiveTab('add')}
          />
        )}
        {activeTab === 'logs' && (
          <LogList 
            trades={userTrades} 
            initialSearchTerm={logSearchTerm}
            onDelete={(id) => setTrades(t => t.filter(x => x.id !== id))} 
            onEdit={(t) => { setEditingTrade(t); setActiveTab('add'); }} 
            onAddNew={() => { setEditingTrade(null); setLogSearchTerm(''); setActiveTab('add'); }} 
          />
        )}
        {activeTab === 'add' && (
          <LogForm 
            onSave={(t) => { 
              if(editingTrade) { 
                setTrades(prev => prev.map(x => x.id === t.id ? t : x)); 
                setEditingTrade(null); 
              } else { 
                setTrades(prev => [...prev, {...t, id: generateSafeId(), userId: currentUser.id}]); 
              } 
              setActiveTab('logs'); 
            }} 
            onCancel={() => { setEditingTrade(null); setActiveTab('logs'); }} 
            initialData={editingTrade} 
            setupOptions={setups} 
            symbolOptions={symbols} 
          />
        )}
        {activeTab === 'mindset' && <MindsetAnalysis trades={userTrades} />}
        {activeTab === 'users' && currentUser.role === 'admin' && (
          <UserManagement 
            users={users} 
            trades={trades} 
            onAddUser={handleAddUser} 
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            currentUserId={currentUser.id} 
          />
        )}
        {activeTab === 'settings' && (
          <SetupSettings 
            options={setups} 
            symbolOptions={symbols} 
            trades={trades} // 這裡傳遞全局 trades 用於備份
            currentUserId={currentUser.id} 
            onUpdate={setSetups} 
            onUpdateSymbols={setSymbols} 
            onResetData={() => { if(confirm('重置後將清空所有交易資料，確定嗎？')) { setTrades([]); } }} 
            onImportData={(data) => { 
              setTrades(data.trades); 
              setSetups(data.setups);
              setSymbols(data.symbols);
              setActiveTab('dashboard'); 
            }} 
          />
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50">
          <button onClick={() => setActiveTab('dashboard')} className={`p-2 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}><i className="fas fa-th-large"></i></button>
          <button onClick={() => setActiveTab('logs')} className={`p-2 ${activeTab === 'logs' ? 'text-indigo-600' : 'text-slate-400'}`}><i className="fas fa-list"></i></button>
          <button onClick={() => setActiveTab('add')} className={`p-2 ${activeTab === 'add' ? 'text-indigo-600' : 'text-slate-400'}`}><i className="fas fa-plus-circle"></i></button>
          <button onClick={() => setActiveTab('mindset')} className={`p-2 ${activeTab === 'mindset' ? 'text-indigo-600' : 'text-slate-400'}`}><i className="fas fa-brain"></i></button>
          <button onClick={handleLogout} className="p-2 text-rose-500"><i className="fas fa-sign-out-alt"></i></button>
      </nav>
    </div>
  );
};

export default App;
