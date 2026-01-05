
import React, { useState, useRef, useEffect } from 'react';
import { Trade } from '../types';
import { syncToGithub, pullFromGithub, GitHubConfig } from '../services/githubService';

interface SetupSettingsProps {
  options: string[];
  trades: Trade[];
  onUpdate: (newOptions: string[]) => void;
  onResetData: () => void;
  onImportData: (trades: Trade[], setups: string[]) => void;
}

const SetupSettings: React.FC<SetupSettingsProps> = ({ options, trades, onUpdate, onResetData, onImportData }) => {
  const [newSetup, setNewSetup] = useState('');
  const [ghConfig, setGhConfig] = useState<GitHubConfig>({ token: '', gistId: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('trademind_gh_config');
    if (saved) setGhConfig(JSON.parse(saved));
  }, []);

  const saveGhConfig = (config: GitHubConfig) => {
    setGhConfig(config);
    localStorage.setItem('trademind_gh_config', JSON.stringify(config));
  };

  const handleCloudPush = async () => {
    if (!ghConfig.token) return alert('請先輸入 GitHub Token');
    setIsSyncing(true);
    try {
      const newGistId = await syncToGithub(ghConfig, trades, options);
      saveGhConfig({ ...ghConfig, gistId: newGistId });
      alert('雲端備份成功！');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudPull = async () => {
    if (!ghConfig.token || !ghConfig.gistId) return alert('請確保 Token 與 Gist ID 已填寫');
    if (!confirm('拉取雲端資料將會覆蓋目前本地的交易紀錄，確定嗎？')) return;
    setIsSyncing(true);
    try {
      const data = await pullFromGithub(ghConfig.token, ghConfig.gistId);
      onImportData(data.trades, data.setups);
      alert('雲端資料已成功拉取並套用！');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetup.trim()) return;
    if (options.includes(newSetup.trim())) return alert('此設置已存在');
    onUpdate([...options, newSetup.trim()]);
    setNewSetup('');
  };

  const exportToJson = () => {
    const data = { trades, setups: options, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trademind-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">系統與數據管理</h2>
        <p className="text-slate-500 font-medium">自定義您的交易環境，並確保數據的安全備份。</p>
      </header>

      {/* GitHub 雲端同步 */}
      <section className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-3">
            <i className="fab fa-github text-2xl"></i> GitHub 雲端備份與同步
          </h3>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 uppercase font-black">Private Sync</span>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GitHub Personal Access Token</label>
            <input 
              type="password" 
              placeholder="ghp_xxxxxxxxxxxx" 
              value={ghConfig.token}
              onChange={e => saveGhConfig({ ...ghConfig, token: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <p className="text-[10px] text-slate-500 mt-1 italic">權限需包含 'gist'。 token 將僅儲存於本機 localStorage。</p>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gist ID (首次同步後自動生成)</label>
            <input 
              type="text" 
              placeholder="同步後會自動填入..." 
              value={ghConfig.gistId || ''}
              onChange={e => saveGhConfig({ ...ghConfig, gistId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleCloudPush}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 py-4 rounded-xl font-bold transition disabled:opacity-50"
          >
            <i className={`fas ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`}></i> 推送到雲端
          </button>
          <button 
            onClick={handleCloudPull}
            disabled={isSyncing || !ghConfig.gistId}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-4 rounded-xl font-bold border border-slate-700 transition disabled:opacity-30"
          >
            <i className={`fas ${isSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-download-alt'}`}></i> 從雲端拉取
          </button>
        </div>
      </section>

      {/* 策略管理 */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-tags text-indigo-500"></i> 自定義交易策略 (Setups)
        </h3>
        <form onSubmit={handleAdd} className="flex gap-2 mb-8">
          <input 
            type="text" 
            value={newSetup} 
            onChange={(e) => setNewSetup(e.target.value)}
            placeholder="例如：VCP 形態突破..." 
            className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
          />
          <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md">新增</button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {options.map((option) => (
            <div key={option} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-white hover:border-indigo-100 transition">
              <span className="font-semibold text-slate-700 text-sm">{option}</span>
              <button onClick={() => onUpdate(options.filter(o => o !== option))} className="p-2 text-slate-300 hover:text-rose-600 transition opacity-0 group-hover:opacity-100">
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 本地數據管理 */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-file-export text-indigo-500"></i> 本地文件備份
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={exportToJson} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-400 transition font-bold text-sm">
            <i className="fas fa-file-code mb-2 block text-xl"></i> 下載 JSON 備份檔
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-400 transition font-bold text-sm">
            <i className="fas fa-file-import mb-2 block text-xl"></i> 匯入 JSON 備份檔
            <input type="file" ref={fileInputRef} onChange={(e) => {
               const file = e.target.files?.[0];
               if (!file) return;
               const reader = new FileReader();
               reader.onload = (event) => {
                 try {
                   const data = JSON.parse(event.target?.result as string);
                   onImportData(data.trades, data.setups);
                 } catch (err) { alert('解析失敗'); }
               };
               reader.readAsText(file);
            }} accept=".json" className="hidden" />
          </button>
        </div>
      </section>

      <section className="bg-rose-50 p-8 rounded-2xl border border-rose-100">
        <h3 className="text-lg font-bold text-rose-800 mb-4 flex items-center gap-2">
          <i className="fas fa-exclamation-triangle"></i> 危險區域
        </h3>
        <button onClick={onResetData} className="bg-white text-rose-600 border border-rose-200 px-6 py-3 rounded-xl font-bold hover:bg-rose-600 hover:text-white transition">
          重置所有交易資料與設定
        </button>
      </section>
    </div>
  );
};

export default SetupSettings;
