
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Role } from '../types';
import { supabase, fetchAllProfiles, saveProfile, fetchInvitations, createInvitation, deleteProfile, deleteInvitationsByEmail, deleteInvitation } from '../services/supabaseService';

interface UserManagementProps {
  currentUserId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUserId }) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [allTrades, setAllTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); 
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingPwdId, setEditingPwdId] = useState<string | null>(null);
  const [tempPwd, setTempPwd] = useState('');
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('user');
  const [isCreating, setIsCreating] = useState(false);
  
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const deleteTimerRef = useRef<any>(null);
  const inviteTimerRef = useRef<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log("Admin: 正在獲取安全數據...");
      const results = await Promise.allSettled([
        fetchAllProfiles(),
        fetchInvitations(),
        supabase.from('trades').select('user_id, pnl_amount')
      ]);

      if (results[0].status === 'fulfilled') setProfiles(results[0].value);
      if (results[1].status === 'fulfilled') setInvitations(results[1].value);
      if (results[2].status === 'fulfilled') setAllTrades(results[2].value.data || []);
      
      console.log("Admin: 數據載入完成。");
    } catch (err: any) {
      console.error("Admin: 載入數據失敗", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      if (inviteTimerRef.current) clearTimeout(inviteTimerRef.current);
    };
  }, []);

  const profileWithAssets = useMemo(() => {
    return profiles.map(p => {
      const userPnL = allTrades
        .filter(t => t.user_id === p.id)
        .reduce((sum, t) => sum + (Number(t.pnl_amount) || 0), 0);
      
      const isConfigActive = p.use_initial_balance === true;
      const baseBalance = isConfigActive ? (Number(p.initial_balance) || 0) : 0;
      
      return {
        ...p,
        isConfigActive,
        currentAsset: baseBalance + userPnL
      };
    });
  }, [profiles, allTrades]);

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEditPwd = (profile: any) => {
    setEditingPwdId(profile.id);
    setTempPwd(profile.password || '');
  };

  const handleSavePwd = async (userId: string) => {
    try {
      const target = profiles.find(p => p.id === userId);
      await saveProfile({ ...target, password: tempPwd });
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, password: tempPwd } : p));
      setEditingPwdId(null);
    } catch (err) {
      alert('儲存密碼失敗');
    }
  };

  const handleUpdateStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) return;
    try {
      const target = profiles.find(p => p.id === userId);
      await saveProfile({ ...target, is_active: !currentStatus });
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_active: !currentStatus } : p));
    } catch (err) {
      alert('更新狀態失敗');
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if (pendingInviteId === id) {
      setIsProcessing(id);
      try {
        console.log("正在嘗試回收授權:", id);
        await deleteInvitation(id);
        setInvitations(prev => prev.filter(i => i.id !== id));
        setPendingInviteId(null);
        alert('授權已成功回收。');
      } catch (err: any) {
        console.error("Delete invite error:", err);
        alert('回收失敗：' + (err.message || '請檢查資料庫 RLS 權限'));
      } finally {
        setIsProcessing(null);
      }
    } else {
      setPendingInviteId(id);
      if (inviteTimerRef.current) clearTimeout(inviteTimerRef.current);
      inviteTimerRef.current = setTimeout(() => {
        setPendingInviteId(null);
      }, 3000);
    }
  };

  const handleDeleteClick = async (profile: any) => {
    if (profile.id === currentUserId) {
      alert('您無法刪除自己的帳號。');
      return;
    }

    if (pendingDeleteId === profile.id) {
      try {
        setLoading(true);
        await deleteProfile(profile.id);
        await deleteInvitationsByEmail(profile.email);
        setProfiles(prev => prev.filter(p => p.id !== profile.id));
        setPendingDeleteId(null);
        alert('成員帳號已徹底刪除。');
      } catch (err: any) {
        alert('刪除失敗：' + (err.message || '請確認 SQL 補丁已執行'));
      } finally {
        setLoading(false);
      }
    } else {
      setPendingDeleteId(profile.id);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => {
        setPendingDeleteId(null);
      }, 3000); 
    }
  };

  const handleUpdateRole = async (userId: string, newRole: Role) => {
    if (userId === currentUserId && newRole !== 'admin') {
      if (!confirm('警告：您正在移除自己的管理員權限！')) return;
    }
    try {
      const target = profiles.find(p => p.id === userId);
      await saveProfile({ ...target, role: newRole });
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
    } catch (err) {
      alert('更新權限失敗');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setIsCreating(true);
    try {
      await createInvitation(newEmail, newPassword, newRole);
      setNewEmail(''); setNewPassword('');
      await loadData(); 
      alert('授權已成功發送');
    } catch (err: any) {
      alert('建立失敗：' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading && profiles.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">正在安全連線至資料庫...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">管理控制台 <span className="text-amber-500">Admin</span></h2>
          <p className="text-slate-500 font-medium text-xs">監控系統狀態、邀請新成員或管理現有權限。</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all font-black text-xs uppercase">
          <i className="fas fa-sync-alt"></i> 刷新所有數據
        </button>
      </header>

      {/* 第一區塊：新增授權 */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
        <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-3">
          <i className="fas fa-user-plus text-indigo-500"></i> 新增帳號授權
        </h3>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
            <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" placeholder="user@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">授權密碼</label>
            <input type="text" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" placeholder="設定初次密碼" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">權限等級</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value as Role)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none cursor-pointer">
              <option value="user">USER (一般)</option>
              <option value="admin">ADMIN (管理)</option>
            </select>
          </div>
          <button type="submit" disabled={isCreating} className="bg-indigo-600 text-white p-3 rounded-xl font-black text-xs shadow-lg hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50">
            {isCreating ? <i className="fas fa-circle-notch fa-spin"></i> : '發送授權邀請'}
          </button>
        </form>
      </section>

      {/* 第二區塊：待激活邀請 */}
      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
          <i className="fas fa-hourglass-start"></i> 待激活邀請清單 ({invitations.length})
        </h3>
        {invitations.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center">
            <p className="text-xs font-bold text-slate-300 uppercase">暫無待激活的邀請</p>
          </div>
        ) : (
          <div className="bg-amber-50/40 rounded-[2rem] border border-amber-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-amber-100/30 border-b border-amber-100">
                  <th className="px-6 py-4 text-[10px] font-black text-amber-800 uppercase">邀請對象</th>
                  <th className="px-6 py-4 text-[10px] font-black text-amber-800 uppercase text-center">密碼備份</th>
                  <th className="px-6 py-4 text-[10px] font-black text-amber-800 uppercase text-center">預設權限</th>
                  <th className="px-6 py-4 text-[10px] font-black text-amber-800 uppercase text-right">管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {invitations.map(invite => {
                  const isPending = pendingInviteId === invite.id;
                  const isCurrentProcessing = isProcessing === invite.id;
                  return (
                    <tr key={invite.id} className="hover:bg-amber-100/20 transition group">
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-slate-800">{invite.email}</p>
                        <p className="text-[10px] font-bold text-amber-600/60 uppercase">等待使用者首次登入驗證</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <code className={`text-[10px] font-mono px-2 py-1 bg-white border border-amber-200 rounded transition ${visiblePasswords[invite.id] ? 'blur-0' : 'blur-[3px]'}`}>
                            {invite.password}
                          </code>
                          <button onClick={() => togglePassword(invite.id)} className="text-slate-400 hover:text-amber-600">
                            <i className={`fas ${visiblePasswords[invite.id] ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`}></i>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[9px] font-black px-2 py-1 bg-white border border-amber-200 rounded text-amber-700 uppercase">
                          {invite.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteInvite(invite.id)} 
                          disabled={isCurrentProcessing}
                          className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all shadow-sm ${
                            isCurrentProcessing ? 'bg-slate-200 text-slate-400' :
                            isPending ? 'bg-rose-600 text-white ring-2 ring-rose-200' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                          }`}
                        >
                          {isCurrentProcessing ? <i className="fas fa-spinner fa-spin"></i> : isPending ? '確定回收？' : '回收授權'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 第三區塊：正式成員 */}
      <section className="space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
          <i className="fas fa-users"></i> 已激活正式成員 ({profileWithAssets.length})
        </h3>
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">帳號資訊</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">狀態</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">密碼備份</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">目前資產</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">權限等級</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">危險操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profileWithAssets.map(profile => {
                const isSelf = profile.id === currentUserId;
                const isActive = profile.is_active !== false;
                const isPendingDelete = pendingDeleteId === profile.id;

                return (
                  <tr key={profile.id} className={`hover:bg-slate-50/50 transition group ${!isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] border ${profile.role === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {profile.role === 'admin' ? 'A' : 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{profile.email}</p>
                          <p className="text-[10px] font-bold text-slate-400">{isSelf ? '(您目前登入的帳號)' : `ID: ${profile.id.slice(0,8)}...`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button 
                        onClick={() => handleUpdateStatus(profile.id, isActive)}
                        disabled={isSelf}
                        className={`w-12 h-6 rounded-full transition-all relative inline-block ${isActive ? 'bg-emerald-500' : 'bg-slate-300'} ${isSelf ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      {editingPwdId === profile.id ? (
                        <input 
                          type="text" 
                          value={tempPwd} 
                          onChange={e => setTempPwd(e.target.value)} 
                          className="w-24 p-1 text-[10px] font-bold border border-indigo-300 rounded outline-none"
                          onBlur={() => handleSavePwd(profile.id)}
                          onKeyDown={e => e.key === 'Enter' && handleSavePwd(profile.id)}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <code className={`text-[11px] font-mono px-2 py-1 bg-slate-100 rounded transition ${visiblePasswords[profile.id] ? 'blur-0' : 'blur-[3px]'}`}>
                            {profile.password || 'N/A'}
                          </code>
                          <div className="flex gap-2">
                            <button onClick={() => togglePassword(profile.id)} className="text-slate-400 hover:text-indigo-600">
                              <i className={`fas ${visiblePasswords[profile.id] ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`}></i>
                            </button>
                            <button onClick={() => handleStartEditPwd(profile)} className="text-slate-300 hover:text-amber-500">
                              <i className="fas fa-pencil-alt text-[9px]"></i>
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className={`text-xs font-black ${profile.currentAsset >= (profile.isConfigActive ? profile.initial_balance : 0) ? 'text-emerald-500' : 'text-rose-500'}`}>
                        ${profile.currentAsset.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <select 
                        value={profile.role} 
                        onChange={(e) => handleUpdateRole(profile.id, e.target.value as Role)} 
                        className="text-[10px] font-black p-1.5 rounded-lg border bg-white outline-none hover:border-indigo-300 transition cursor-pointer"
                      >
                        <option value="user">USER</option>
                        <option value="admin">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {!isSelf && (
                        <button 
                          onClick={() => handleDeleteClick(profile)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase shadow-sm active:scale-95 ${
                            isPendingDelete 
                              ? 'bg-rose-600 text-white ring-4 ring-rose-100' 
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                          }`}
                        >
                          {isPendingDelete ? '確定刪除？' : '刪除帳號'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default UserManagement;
