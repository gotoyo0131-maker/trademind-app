
import React, { useState } from 'react';
import { User, Role } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [error, setError] = useState('');

  const getUsers = (): User[] => {
    const saved = localStorage.getItem('trademind_users');
    return saved ? JSON.parse(saved) : [
      { id: 'admin-1', username: 'admin', password: '123', role: 'admin', createdAt: new Date().toISOString() }
    ];
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = getUsers();

    if (isRegistering) {
      if (users.find(u => u.username === username)) {
        return setError('該用戶名已存在');
      }
      const newUser: User = {
        id: crypto.randomUUID(),
        username,
        password, // 僅供模擬
        role,
        createdAt: new Date().toISOString()
      };
      const updatedUsers = [...users, newUser];
      localStorage.setItem('trademind_users', JSON.stringify(updatedUsers));
      onLogin(newUser);
      localStorage.setItem('trademind_session', JSON.stringify(newUser));
    } else {
      const user = users.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user);
        localStorage.setItem('trademind_session', JSON.stringify(user));
      } else {
        setError('用戶名或密碼錯誤 (預設管理員 admin/123)');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-sans relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-600/40 rotate-12">
              <i className="fas fa-chart-line text-white text-3xl"></i>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">TradeMind AI</h2>
            <p className="text-slate-400 text-sm mt-2">{isRegistering ? '建立您的專業交易帳戶' : '歡迎回來，專業交易者'}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">帳戶名稱</label>
              <div className="relative">
                <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">安全密碼</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            {isRegistering && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">帳戶權限</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setRole('user')} className={`py-3 rounded-xl border text-xs font-bold transition ${role === 'user' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-800/30 border-slate-700 text-slate-400'}`}>
                    使用者 (User)
                  </button>
                  <button type="button" onClick={() => setRole('admin')} className={`py-3 rounded-xl border text-xs font-bold transition ${role === 'admin' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-slate-800/30 border-slate-700 text-slate-400'}`}>
                    管理員 (Admin)
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-rose-400 text-xs text-center font-bold animate-pulse">{error}</p>}

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-95 mt-4">
              {isRegistering ? '立即註冊' : '登錄系統'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-slate-400 text-xs hover:text-white transition font-medium">
              {isRegistering ? '已有帳號？返回登錄' : '還沒有帳號？立即免費註冊'}
            </button>
          </div>
        </div>
        
        <p className="text-center text-slate-600 text-[10px] mt-8 uppercase tracking-[0.2em]">
          Professional Portfolio Management · 2024
        </p>
      </div>
    </div>
  );
};

export default Auth;
