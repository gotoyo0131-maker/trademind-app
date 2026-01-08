
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trade, User, Role } from './types';
import { DEFAULT_SETUPS, DEFAULT_SYMBOLS } from './constants';
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import LogList from './components/LogList';
import MindsetAnalysis from './components/MindsetAnalysis';
import SetupSettings from './components/SetupSettings';
import UserManagement from './components/UserManagement';
import Auth from './components/Auth';
import { supabase, fetchTrades, saveTrade, deleteTrade, fetchProfile, saveProfile } from './services/supabaseService';

type Tab = 'dashboard' | 'logs' | 'add' | 'mindset' | 'settings' | 'users';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [setups, setSetups] = useState<string[]>(DEFAULT_SETUPS);
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<{message: string, code?: string, canReset?: boolean} | null>(null);
  const [isDeactivated, setIsDeactivated] = useState(false);
  
  const lastLoadedUserId = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<any>(null);

  const handleLogout = useCallback(async () => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    
    setLoadError(null);
    setIsLoading(false);
    setCurrentUser(null);
    setTrades([]);
    setActiveTab('dashboard');
    lastLoadedUserId.current = null;
    
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut error:", e);
    }
  }, []);

  // 深度重置：取代「清除瀏覽器暫存」的手動操作
  const handleDeepReset = useCallback(async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await handleLogout();
      // 在虛擬環境中，強制刷新 UI 狀態
      window.location.href = window.location.origin;
    } catch (e) {
      handleLogout();
    }
  }, [handleLogout]);

  const loadUserData = useCallback(async (userId: string, email: string, metadata?: any) => {
    setLoadError(null);
    setIsLoading(true);
    lastLoadedUserId.current = userId;

    try {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      
      loadingTimeoutRef.current = setTimeout(() => {
        setLoadError({ 
          message: "資料庫回應過慢。這通常是權限死鎖造成的。", 
          code: "DB_TIMEOUT",
          canReset: true
        });
        setIsLoading(false);
      }, 8000);

      // 1. Profile
      const profile = await fetchProfile(userId);
      
      if (profile && profile.is_active === false) {
        setIsDeactivated(true);
        setTimeout(() => handleLogout(), 3000);
        return;
      }

      // 2. Trades
      const tradeData = await fetchTrades();
      
      if (!profile || !profile.email) {
        const newProfile = {
          id: userId,
          email: email,
          role: metadata?.role || 'user',
          is_active: true,
          setups: DEFAULT_SETUPS,
          symbols: DEFAULT_SYMBOLS,
          initial_balance: 0,
          use_initial_balance: false
        };
        await saveProfile(newProfile);
        setCurrentUser({
          id: userId,
          username: email.split('@')[0],
          email: email,
          role: newProfile.role as Role,
          createdAt: new Date().toISOString()
        });
        setSetups(DEFAULT_SETUPS);
        setSymbols(DEFAULT_SYMBOLS);
      } else {
        setCurrentUser({
          id: userId,
          username: email.split('@')[0],
          email: email,
          role: (profile.role as Role) || 'user',
          createdAt: new Date().toISOString(),
          initialBalance: profile.initial_balance,
          useInitialBalance: profile.use_initial_balance
        });
        setSetups(profile.setups || DEFAULT_SETUPS);
        setSymbols(profile.symbols || DEFAULT_SYMBOLS);
      }
      
      setTrades(tradeData);
      setLoadError(null);
    } catch (err: any) {
      console.error("Load Error:", err);
      const isRecursion = err.message?.includes('recursion') || err.message?.includes('infinite');
      setLoadError({
        message: isRecursion 
          ? "系統偵測到 RLS 權限死鎖。這可能是因為舊的快取狀態與新規則衝突。" 
          : (err.message || "讀取失敗，請確認 SQL 已正確執行。"),
        code: isRecursion ? "RLS_RECURSION_500" : (err.code || "ERR_500"),
        canReset: true
      });
    } finally {
      setIsLoading(false);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    }
  }, [handleLogout]);

  const handleRetry = () => {
    setLoadError(null);
    setIsLoading(true);
    supabase.auth.getSession().then(({data}) => {
      if (data.session?.user) {
        loadUserData(data.session.user.id, data.session.user.email!);
      } else {
        handleLogout();
      }
    });
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          // 當新登入時，自動清除之前的錯誤
          setLoadError(null);
          await loadUserData(session.user.id, session.user.email!, session.user.user_metadata);
        }
      } else {
        setCurrentUser(null);
        lastLoadedUserId.current = null;
        setTrades([]);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [loadUserData]);

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-6 text-center">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center text-3xl mb-6 border border-rose-500/20 shadow-2xl shadow-rose-500/10">
          <i className="fas fa-plug-circle-exclamation"></i>
        </div>
        <h1 className="text-xl font-black text-white mb-2 uppercase tracking-tight">存取連線死鎖</h1>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-8 max-w-md w-full shadow-2xl">
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            {loadError.message}
          </p>
          <div className="bg-black/50 p-3 rounded-xl text-left border border-slate-800">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">診斷代碼</p>
            <p className="text-[10px] font-mono text-rose-400 break-all">{loadError.code || 'UNKNOWN'}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={handleRetry} 
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
          >
            直接重試 (Retry)
          </button>
          
          <button 
            onClick={handleDeepReset} 
            className="w-full py-4 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-2xl font-black hover:bg-rose-600/20 transition-all text-xs flex items-center justify-center gap-2"
          >
            <i className="fas fa-trash-can"></i> 深度清理並登出 (推薦)
          </button>

          <button 
            onClick={handleLogout} 
            className="w-full py-4 text-slate-500 font-black text-[10px] uppercase hover:text-slate-300"
          >
            普通登出
          </button>
        </div>
        
        <p className="mt-8 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          深度清理將移除本地 Session 快取以解除 RLS 衝突
        </p>
      </div>
    );
  }

  if (isDeactivated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] p-6 text-center">
        <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center text-3xl mb-6">
          <i className="fas fa-user-slash"></i>
        </div>
        <h1 className="text-2xl font-black text-white mb-2">帳號存取受限</h1>
        <p className="text-slate-400 text-sm font-medium">請聯繫系統管理員以恢復您的存取權限。</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] gap-4 text-center p-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(79,70,229,0.3)]"></div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-indigo-500 animate-pulse uppercase tracking-[0.4em]">Establishing Clean Session</p>
          <p className="text-slate-600 text-[8px] uppercase tracking-widest font-bold">Synchronizing Security Tokens...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Auth onLogin={() => {}} />;

  const isAdmin = currentUser.role === 'admin';

  const handleSaveTrade = async (trade: Trade) => {
    try {
      const saved = await saveTrade({ ...trade, userId: currentUser?.id });
      if (editingTrade) {
        setTrades(prev => prev.map(t => t.id === saved.id ? saved : t));
      } else {
        setTrades(prev => [saved, ...prev]);
      }
      setEditingTrade(null);
      setActiveTab('logs');
    } catch (err: any) {
      alert('儲存失敗：' + err.message);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    try {
      await deleteTrade(id);
      setTrades(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert('刪除失敗：' + err.message);
    }
  };

  const handleUpdateProfile = async (newProfile: any) => {
    if (!currentUser) return;
    try {
      await saveProfile({ id: currentUser.id, ...newProfile });
      if (newProfile.setups) setSetups(newProfile.setups);
      if (newProfile.symbols) setSymbols(newProfile.symbols);
      const mappedUpdate: Partial<User> = {};
      if (newProfile.initial_balance !== undefined) mappedUpdate.initialBalance = newProfile.initial_balance;
      if (newProfile.use_initial_balance !== undefined) mappedUpdate.useInitialBalance = newProfile.use_initial_balance;
      if (newProfile.role !== undefined) mappedUpdate.role = newProfile.role;
      setCurrentUser(prev => prev ? { ...prev, ...mappedUpdate } : null);
    } catch (err: any) {
      console.error("Update profile error:", err);
      throw err;
    }
  };

  const handleImportData = async (data: any) => {
    if (!currentUser) return;
    try {
      if (data.setups) {
        const mergedSetups = Array.from(new Set([...setups, ...data.setups]));
        await saveProfile({ id: currentUser.id, setups: mergedSetups });
        setSetups(mergedSetups);
      }
      if (data.symbols) {
        const mergedSymbols = Array.from(new Set([...symbols, ...data.symbols]));
        await saveProfile({ id: currentUser.id, symbols: mergedSymbols });
        setSymbols(mergedSymbols);
      }
      if (data.trades && Array.isArray(data.trades)) {
        const promises = data.trades.map((t: any) => {
          const { id, userId, ...tradeToSave } = t;
          return saveTrade({ ...tradeToSave, userId: currentUser.id });
        });
        await Promise.all(promises);
        const tradeData = await fetchTrades();
        setTrades(tradeData);
      }
      alert('匯入完成！');
    } catch (err: any) {
      alert('匯入失敗：' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen z-40">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white rotate-12 shadow-md">
            <i className="fas fa-shield-halved"></i>
          </div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">TradeMind <span className="text-indigo-600">Pro</span></h1>
        </div>
        
        <nav className="flex-grow space-y-1">
          <NavItem id="dashboard" icon="fa-chart-pie" label="績效總覽" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setLogSearchTerm('');}} />
          <NavItem id="logs" icon="fa-layer-group" label="交易日誌" active={activeTab === 'logs'} onClick={() => {setActiveTab('logs'); setLogSearchTerm('');}} />
          <NavItem id="add" icon="fa-plus-circle" label="新增交易" active={activeTab === 'add'} onClick={() => {setActiveTab('add'); setLogSearchTerm('');}} />
          <NavItem id="mindset" icon="fa-brain" label="行為心理" active={activeTab === 'mindset'} onClick={() => {setActiveTab('mindset'); setLogSearchTerm('');}} />
          <NavItem id="settings" icon="fa-sliders-h" label="系統設置" active={activeTab === 'settings'} onClick={() => {setActiveTab('settings'); setLogSearchTerm('');}} />
          
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <p className="px-3 mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Admin Control</p>
              <NavItem id="users" icon="fa-user-shield" label="用戶管理" color="text-amber-500" active={activeTab === 'users'} onClick={() => {setActiveTab('users'); setLogSearchTerm('');}} />
            </div>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border-2 uppercase ${isAdmin ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {(currentUser.email || currentUser.username)[0].toUpperCase()}
            </div>
            <div className="flex-grow overflow-hidden">
              <p className="text-xs font-black text-slate-800 truncate">{currentUser.email}</p>
              <p className={`text-[9px] font-black uppercase flex items-center gap-1 ${isAdmin ? 'text-amber-500' : 'text-emerald-500'}`}>
                {isAdmin ? 'System Admin' : 'Secure Session'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition font-black text-[10px] uppercase tracking-wider">
            <i className="fas fa-power-off"></i> 離線登出
          </button>
        </div>
      </aside>

      <main className="flex-grow p-4 md:p-10 max-w-7xl mx-auto w-full mb-16 md:mb-0 relative">
        {activeTab === 'dashboard' && <Dashboard trades={trades} currentUser={currentUser} onViewLogs={() => setActiveTab('logs')} onDateClick={(d) => { setLogSearchTerm(d); setActiveTab('logs'); }} onAddFirstTrade={() => setActiveTab('add')} onGoToSettings={() => setActiveTab('settings')} />}
        {activeTab === 'logs' && <LogList trades={trades} initialSearchTerm={logSearchTerm} onEdit={(t) => { setEditingTrade(t); setActiveTab('add'); }} onDelete={handleDeleteTrade} onAddNew={() => { setEditingTrade(null); setActiveTab('add'); }} />}
        {activeTab === 'add' && <LogForm onSave={handleSaveTrade} onCancel={() => { setEditingTrade(null); setActiveTab('logs'); }} initialData={editingTrade} setupOptions={setups} symbolOptions={symbols} />}
        {activeTab === 'mindset' && <MindsetAnalysis trades={trades} />}
        {activeTab === 'settings' && <SetupSettings options={setups} symbolOptions={symbols} trades={trades} currentUser={currentUser} onUpdate={(s) => handleUpdateProfile({ setups: s })} onUpdateSymbols={(sy) => handleUpdateProfile({ symbols: sy })} onUpdateUser={(u) => handleUpdateProfile({ initial_balance: u.initialBalance, use_initial_balance: u.useInitialBalance })} onResetData={() => {}} onImportData={handleImportData} />}
        {activeTab === 'users' && isAdmin && <UserManagement currentUserId={currentUser.id} />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50">
          <button onClick={() => setActiveTab('dashboard')} className={`p-2 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}><i className="fas fa-chart-pie"></i></button>
          <button onClick={() => setActiveTab('logs')} className={`p-2 ${activeTab === 'logs' ? 'text-indigo-600' : 'text-slate-400'}`}><i className="fas fa-layer-group"></i></button>
          <button onClick={() => setActiveTab('add')} className={`p-2 ${activeTab === 'add' ? 'text-indigo-600' : 'text-slate-400'}`}><i className="fas fa-plus-circle"></i></button>
          {isAdmin && <button onClick={() => setActiveTab('users')} className={`p-2 ${activeTab === 'users' ? 'text-amber-500' : 'text-slate-400'}`}><i className="fas fa-user-shield"></i></button>}
          <button onClick={() => setActiveTab('settings')} className={`p-2 ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}><i className="fas fa-sliders-h"></i></button>
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, color = "text-slate-400", active, onClick }: { id: string, icon: string, label: string, color?: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]' : `${color} hover:bg-slate-100`}`}>
    <i className={`fas ${icon} text-sm`}></i>
    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
