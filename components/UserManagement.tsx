
import React, { useState, useMemo } from 'react';
import { User, Trade, Role } from '../types';

interface UserManagementProps {
  users: User[];
  trades: Trade[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  currentUserId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, trades, onAddUser, onUpdateUser, onDeleteUser, currentUserId }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('user');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 編輯狀態
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<Role>('user');

  const userStats = useMemo(() => {
    return users.map(user => {
      const userTrades = trades.filter(t => t.userId === user.id);
      const totalPnl = userTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
      return {
        ...user,
        tradeCount: userTrades.length,
        totalPnl,
        winRate: userTrades.length > 0 ? (userTrades.filter(t => t.pnlAmount > 0).length / userTrades.length) * 100 : 0
      };
    });
  }, [users, trades]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return alert('請填寫完整資訊');
    
    const newUser: User = {
      id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      username: newUsername,
      password: newPassword,
      role: newRole,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    onAddUser(newUser);
    setNewUsername('');
    setNewPassword('');
    setShowAddForm(false);
  };

  const startEditing = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUserId(user.id);
    setEditPassword(user.password || '');
    setEditRole(user.role);
  };

  const handleSaveEdit = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateUser({
      ...user,
      password: editPassword,
      role: editRole
    });
    setEditingUserId(null);
  };

  const toggleUserActive = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (user.id === currentUserId) return alert('不能停用當前登錄的管理者帳號。');
    onUpdateUser({
      ...user,
      isActive: user.isActive === false ? true : false
    });
  };

  const handleDelete = (userId: string, username: string, e: React.MouseEvent) => {
    // 強制停止冒泡與預設行為
    e.stopPropagation();
    e.preventDefault();
    
    // 安全檢查
    if (userId === currentUserId) {
      alert('安全保護：無法刪除您目前正在使用的管理者帳號。');
      return;
    }

    // 呼叫確認對話框
    const confirmDelete = window.confirm(`警告：永久刪除確認\n\n您確定要刪除使用者「${username}」嗎？\n這將會同步刪除該用戶的所有交易紀錄，且無法恢復。`);
    
    if (confirmDelete) {
      onDeleteUser(userId);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">用戶管理與監控</h2>
          <p className="text-slate-500 font-medium">管理系統權限、帳號狀態與安全性設置。</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 shadow-lg active:scale-95 ${showAddForm ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          <i className={`fas ${showAddForm ? 'fa-times' : 'fa-user-plus'} pointer-events-none`}></i>
          {showAddForm ? '取消操作' : '新增使用者'}
        </button>
      </header>

      {/* Add User Form */}
      {showAddForm && (
        <form onSubmit={handleAddUser} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-500/5 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">帳戶名稱</label>
              <input 
                type="text" 
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="用戶名"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">初始密碼</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="安全密碼"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">權限角色</label>
              <select 
                value={newRole}
                onChange={e => setNewRole(e.target.value as Role)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition text-sm font-bold"
              >
                <option value="user">一般使用者 (User)</option>
                <option value="admin">系統管理員 (Admin)</option>
              </select>
            </div>
            <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 active:scale-95">
              確認建立帳戶
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">交易者名稱</th>
                <th className="px-6 py-4">角色</th>
                <th className="px-6 py-4">總交易量</th>
                <th className="px-6 py-4 text-right">累計盈虧</th>
                <th className="px-6 py-4 text-center">管理功能</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userStats.map(user => {
                const isEditing = editingUserId === user.id;
                const isActive = user.isActive !== false;
                return (
                  <React.Fragment key={user.id}>
                    <tr className={`hover:bg-slate-50/50 transition ${isEditing ? 'bg-indigo-50' : ''} ${!isActive ? 'opacity-60 bg-slate-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${
                            isActive 
                              ? 'bg-slate-100 text-slate-600 border-slate-200' 
                              : 'bg-rose-50 text-rose-400 border-rose-100'
                          }`}>
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${!isActive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                {user.username}
                              </span>
                              {!isActive && <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-500 text-[8px] font-black uppercase">已凍結</span>}
                              {user.id === currentUserId && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 text-[8px] font-black uppercase">本人</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          user.role === 'admin' 
                            ? 'bg-amber-100 text-amber-600 border border-amber-200' 
                            : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-600">{user.tradeCount} 筆</span>
                      </td>
                      <td className={`px-6 py-4 text-right font-black ${user.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {user.totalPnl >= 0 ? '+' : ''}{user.totalPnl.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            type="button"
                            onClick={(e) => toggleUserActive(user, e)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition active:scale-90 ${isActive ? 'text-slate-400 bg-slate-100 hover:text-amber-500' : 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100'}`}
                            title={isActive ? "凍結帳號" : "解除凍結"}
                          >
                            <i className={`fas ${isActive ? 'fa-user-slash' : 'fa-user-check'} pointer-events-none`}></i>
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => isEditing ? setEditingUserId(null) : startEditing(user, e)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition active:scale-90 ${isEditing ? 'text-indigo-600 bg-indigo-100' : 'text-slate-400 bg-slate-100 hover:text-indigo-600'}`}
                            title="修改權限"
                          >
                            <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'} pointer-events-none`}></i>
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => handleDelete(user.id, user.username, e)}
                            className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-90"
                            title="永久刪除"
                          >
                            <i className="fas fa-trash-alt pointer-events-none"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Inline Edit Form */}
                    {isEditing && (
                      <tr className="bg-indigo-50/30">
                        <td colSpan={5} className="p-6 border-b border-indigo-100">
                          <div className="flex flex-col md:flex-row gap-6 items-end justify-center animate-in slide-in-from-top-2">
                             <div className="space-y-1 w-full md:w-64">
                               <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">重新設置密碼</label>
                               <input 
                                 type="text" 
                                 value={editPassword} 
                                 onChange={e => setEditPassword(e.target.value)}
                                 className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl outline-none text-sm font-mono shadow-sm"
                                 placeholder="輸入新密碼"
                               />
                             </div>
                             <div className="space-y-1 w-full md:w-48">
                               <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">變更權限</label>
                               <select 
                                 value={editRole} 
                                 onChange={e => setEditRole(e.target.value as Role)}
                                 className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl outline-none text-sm font-bold shadow-sm"
                               >
                                 <option value="user">User (一般使用者)</option>
                                 <option value="admin">Admin (管理員)</option>
                               </select>
                             </div>
                             <div className="flex gap-2">
                               <button 
                                 type="button"
                                 onClick={(e) => handleSaveEdit(user, e)}
                                 className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition active:scale-95"
                               >
                                 確認儲存
                               </button>
                               <button 
                                 type="button"
                                 onClick={(e) => { e.stopPropagation(); setEditingUserId(null); }}
                                 className="bg-white text-slate-500 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition"
                               >
                                 取消
                               </button>
                             </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
