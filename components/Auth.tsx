
import React, { useState } from 'react';
import { supabase, findInvitation, deleteInvitationsByEmail, saveProfile, fetchProfile } from '../services/supabaseService';
import { DEFAULT_SETUPS, DEFAULT_SYMBOLS } from '../constants';

const Auth: React.FC<{ onLogin: () => void }> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{message: string, hint?: string} | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. 嘗試直接登入
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!authError && authData.user) {
        // 登入成功！自動同步/修復密碼備份
        console.log("Login successful. Syncing password backup...");
        const profile = await fetchProfile(authData.user.id);
        await saveProfile({
          ...profile,
          id: authData.user.id,
          email: email,
          password: password // 這裡會把剛才輸入正確的密碼存回去
        });
        
        deleteInvitationsByEmail(email).catch(console.error);
        return;
      }

      // 2. 如果登入失敗，檢查邀請表（處理首次激活）
      const invitation = await findInvitation(email);
      
      if (!invitation) {
        throw { message: "此帳號尚未獲得授權", hint: "請確認您的 Email 是否已加入邀請清單。" };
      }

      if (invitation.password !== password) {
        throw { message: "授權密碼不符", hint: "請檢查輸入是否正確。" };
      }

      // 3. 符合邀請條件，執行註冊激活
      console.log("Activating user...");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { 
          data: { role: invitation.role || 'user' } 
        }
      });
      
      if (signUpError) {
        throw { message: `激活失敗: ${signUpError.message}`, hint: "如果帳號已存在但密碼不符，請聯繫管理員重置。" };
      }
      
      if (signUpData.user) {
        await saveProfile({
          id: signUpData.user.id,
          email: email,
          password: password,
          setups: DEFAULT_SETUPS,
          symbols: DEFAULT_SYMBOLS,
          initial_balance: 0,
          use_initial_balance: false,
          role: invitation.role || 'user',
          is_active: true
        });
        
        await deleteInvitationsByEmail(email);
        alert("帳號激活成功！請再次登入。");
        setPassword('');
      }

    } catch (err: any) {
      console.error("Auth process error:", err);
      setError({
        message: err.message || "驗證失敗",
        hint: err.hint || "請確認網路連線或聯繫管理員。"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]"></div>

      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative z-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/20 rotate-3 border border-white/10">
            <i className="fas fa-shield-halved text-white text-3xl"></i>
          </div>
          
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">屬於您個人交易日誌</h2>
          <p className="text-slate-500 text-sm mb-8 font-medium">封閉式雲端系統，僅供授權存取</p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">授權帳號 (Email)</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800/40 border border-slate-700 text-white p-4 rounded-2xl outline-none focus:border-indigo-500 transition font-medium"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">安全密碼</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700 text-white p-4 pr-12 rounded-2xl outline-none focus:border-indigo-500 transition font-medium"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl animate-shake">
                <div className="flex items-center gap-2 text-rose-500 mb-1">
                  <i className="fas fa-exclamation-triangle text-xs"></i>
                  <p className="text-[11px] font-black uppercase tracking-wider">{error.message}</p>
                </div>
                {error.hint && <p className="text-rose-400/80 text-[10px] font-medium leading-relaxed">{error.hint}</p>}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : '驗證並登入'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-800/50">
            <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em]">
              Authorized Internal Access Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
