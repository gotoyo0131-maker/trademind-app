
import React, { useMemo, useState } from 'react';
import { User, Trade, Role } from '../types';

interface UserManagementProps {
  users: User[];
  trades: Trade[];
  onAddUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  currentUserId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, trades, onAddUser, onDeleteUser, currentUserId }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('user');

  const userStats = useMemo(() => {
    return users.map(user => {
      const userTrades = trades.filter(t => t.userId === user.id);
      const totalPnl = userTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
      return {
        ...user,
        tradeCount: userTrades.length,
        totalPnl,
        winRate: userTrades.length > 0 
          ? (userTrades.filter(t => t.pnlAmount > 0).length / userTrades.length) * 100 
          : 0
      };
    });
  }, [users, trades]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    
    if (users.find(u => u.username === newUsername)) {
      alert('用戶名已存在！');
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username: newUsername,
      password: newPassword,
      role: newRole,
      createdAt: new Date().toISOString()
    };

    onAddUser(newUser);
    setNewUsername('');
    setNewPassword('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">用戶管理與系統監控</h2>
          <p className="text-slate-500 font-medium mt-1">目前系統共有 {users.length} 位註冊交易者。</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-lg active:scale-95 ${showAddForm ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          <i className={`fas ${showAddForm ? 'fa-times' : 'fa-user-plus'}`}></i>
          {showAddForm ? '取消新增' : '新增用戶'}
        </button>
      </header>

      {/* 新增用戶表單 */}
      {showAddForm && (
        <div className="bg-white p-8 rounded-2xl border border-indigo-100 shadow-xl animate-in slide-in-from-top-4 duration-500">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fas fa-id-card text-indigo-500"></i>
            建立新交易帳戶
          </h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">用戶名稱</label>
              <input 
                type="text" 
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="例如: trader_01"
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">設定密碼</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">帳戶權限</label>
              <select 
                value={newRole}
                onChange={e => setNewRole(e.target.value as Role)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-500 transition text-sm font-bold"
              >
                <option value="user">使用者 (User)</option>
                <option value="admin">管理員 (Admin)</option>
              </select>
            </div>
            <button type="submit" className="bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition active:scale-95">
              確認建立帳戶
            </button>
          </form>
        </div>
      )}

      {/* 統計看板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">全站總交易額</p>
           <h4 className="text-3xl font-black text-indigo-600">${trades.reduce((acc, t) => acc + (t.entryPrice * t.size), 0).toLocaleString()}</h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">總結算盈虧</p>
           <h4 className={`text-3xl font-black ${trades.reduce((acc, t) => acc + t.pnlAmount, 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
             ${trades.reduce((acc, t) => acc + t.pnlAmount, 0).toFixed(2)}
           </h4>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">全站平均勝率</p>
           <h4 className="text-3xl font-black text-slate-800">
             {((trades.filter(t => t.pnlAmount > 0).length / trades.length || 0) * 100).toFixed(1)}%
           </h4>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">交易者</th>
              <th className="px-6 py-4">權限</th>
              <th className="px-6 py-4">總筆數</th>
              <th className="px-6 py-4">勝率</th>
              <th className="px-6 py-4 text-right">累計盈虧</th>
              <th className="px-6 py-4 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {userStats.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">{user.username}</span>
                      <span className="text-[10px] text-slate-400">ID: {user.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${user.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{user.tradeCount}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{user.winRate.toFixed(1)}%</td>
                <td className={`px-6 py-4 text-right font-bold text-sm ${user.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {user.totalPnl >= 0 ? '+' : ''}{user.totalPnl.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  {user.id !== currentUserId ? (
                    <button 
                      onClick={() => onDeleteUser(user.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="刪除用戶與其交易數據"
                    >
                      <i className="fas fa-user-slash"></i>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold italic">當前帳戶</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
